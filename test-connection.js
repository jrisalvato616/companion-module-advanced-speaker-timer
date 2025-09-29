#!/usr/bin/env node

const net = require('net');

const client = new net.Socket();

console.log('Attempting to connect to Advanced Speaker Timer Pro on localhost:18765...');

client.connect(18765, '127.0.0.1', () => {
    console.log('Connected to Advanced Speaker Timer Pro!');

    // Test status command
    const statusCommand = JSON.stringify({ action: 'status' }) + '\n';
    console.log('Sending status command:', statusCommand.trim());
    client.write(statusCommand);
});

client.on('data', (data) => {
    console.log('Received response:');
    console.log(data.toString());

    // Test start timer A command
    setTimeout(() => {
        const startCommand = JSON.stringify({ action: 'start', timer: 'A' }) + '\n';
        console.log('Sending start timer A command:', startCommand.trim());
        client.write(startCommand);
    }, 1000);

    // Disconnect after 3 seconds
    setTimeout(() => {
        console.log('Closing connection...');
        client.destroy();
    }, 3000);
});

client.on('error', (err) => {
    console.error('Connection error:', err.message);
    console.log('\nMake sure Advanced Speaker Timer Pro is running and the TCP server is started.');
});

client.on('close', () => {
    console.log('Connection closed');
});