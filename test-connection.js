#!/usr/bin/env node
// A connectivity check must not start a timer or change the operator's show.
const net = require('node:net')
const { StringDecoder } = require('node:string_decoder')

const host = process.argv[2] || '127.0.0.1'
const port = Number(process.argv[3] || 18765)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Port must be a whole number from 1 to 65535')
    process.exit(1)
}
const client = new net.Socket()
const decoder = new StringDecoder('utf8')
let buffer = ''
let done = false
const timeout = setTimeout(() => finish('Timed out waiting for timer status'), 5000)
function finish(error) {
    if (done) return
    done = true
    clearTimeout(timeout)
    process.exitCode = error ? 1 : 0
    if (error) console.error(error)
    client.destroy()
}
client.on('connect', () => client.write(JSON.stringify({ action: 'status' }) + '\n'))
client.on('data', chunk => {
    buffer += decoder.write(chunk)
    if (buffer.length > 1_000_000) return finish('Response exceeded the size limit')
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
        if (!line.trim()) continue
        let response
        try { response = JSON.parse(line) }
        catch { return finish('App returned invalid JSON') }
        if (response.status === 'error') return finish(response.message || 'App rejected status request')
        if (response.status === 'ok' && response.data?.timerA && response.data?.timerB) {
            console.log(`Connected to Advanced Speaker Timer at ${host}:${port}`)
            console.log(`Timer A: ${response.data.timerA.state}; Timer B: ${response.data.timerB.state}`)
            finish()
            return
        }
    }
})
client.on('error', error => finish(`Connection failed: ${error.message}`))
client.on('close', () => { if (!done) finish('Connection closed before receiving status') })
client.connect(port, host)
