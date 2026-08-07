# Packaging and distributing the module

## Build a distributable package

```bash
npm install          # once
npm run package
```

This produces `advanced-speaker-timer-<version>.tgz` (~25 KB) in the module
folder. That single file is what you send to someone else — no `node_modules`,
no zip of the whole folder.

`npm run package` runs the TypeScript build and then `companion-module-build`,
the official Bitfocus tool. The tool bundles all dependencies into one
`pkg/main.js`, rewrites the manifest `entrypoint` to match, and compresses the
result. Hand-rolled `tar`/`zip` archives of the source folder are **not** a
valid module package and will only load in developer mode.

Validate the manifest at any time with:

```bash
npm run check
```

## How someone else installs it

1. Open Companion and go to the **Modules** page.
2. Choose the option to import/install a module from a file.
3. Select the `.tgz` file.

Companion treats it the same as a module from the official store. They do
**not** need developer mode, and they should not put the folder in
`~/companion-modules-dev/`.

## Testing the packaged build yourself

Developer mode normally runs your source, so it can hide packaging problems.
To make Companion run the packaged output instead, create an empty file named
`DEBUG-PACKAGED` in the module folder:

```bash
touch DEBUG-PACKAGED
```

Companion then loads from `pkg/` rather than the source. Delete the file to go
back to normal development.

## Manifest notes

`companion/manifest.json` is the source of truth — not `package.json`. It must
sit in the `companion/` subfolder, and it needs all of: `id`, `name`,
`shortname`, `description`, `version`, `license`, `repository`, `bugs`,
`maintainers`, `legacyIds`, `runtime`, `manufacturer`, `products`, `keywords`.

The `runtime.entrypoint` is relative to the manifest, so it points at
`../dist/index.js` in source form. The build tool rewrites it to `../main.js`
inside the package.

`runtime.type` is currently `node18`, which loads on both Companion 3.x and
4.x. Bump it to `node22` only if you no longer care about Companion 3.x.

## Bumping the version

Update `version` in **both** `package.json` and `companion/manifest.json`, then
re-run `npm run package`. Companion uses the manifest version to decide whether
an installed module is being upgraded.
