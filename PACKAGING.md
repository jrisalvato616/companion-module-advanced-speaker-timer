# Packaging and distributing the Companion module

## Build a distributable package

Install the locked dependencies in a fresh checkout, then validate and package:

```bash
npm ci
npm test
npm run typecheck
npm run package
npm run check
```

`npm run package` builds TypeScript and runs the official Bitfocus `companion-module-build` tool. It writes `advanced-speaker-timer-<version>.tgz` in this directory. The archive contains the bundled module code, package metadata, and Companion manifest. It contains no macOS app or user configuration.

The tool bundles dependencies into `pkg/main.js` and changes the packaged manifest entrypoint to `../main.js`. Do not distribute a tar/zip of the source directory as an installable module.

Run `companion-module-build` without `--dev` for a production package. A prerelease can use `--prerelease` and a distinct prerelease version such as `1.7.1-dev.1`. Companion identifies an installed version by module ID and version; a prerelease flag alone does not make another package with the same version distinct.

## Version metadata

Keep these fields synchronized when changing the module version:

- `package.json`: `version`
- `companion/manifest.json`: `version`
- `package-lock.json`: top-level `version` and `packages[""].version`

The build tool uses **package.json's version** for the packaged module and copies the other manifest fields from `companion/manifest.json`. Keep both source versions aligned so source loading and packaged loading agree. The source entrypoint remains `../dist/index.js`; the build tool rewrites it only inside the package.

The module currently uses `node18` and Companion API `1.13.2`. The packaged module has been tested with Companion **5.0.3**; Companion 4 also supports the package-import workflow. Do not change the runtime or claim additional version compatibility without testing it.

## Verify the exact package

1. Confirm the archive contains `pkg/main.js`, `pkg/package.json`, and `pkg/companion/manifest.json` with the intended version.
2. Import the final `.tgz` through **Modules → Import module package** in Companion. Select that exact version on the connection.
3. Check connection startup, current timer variables, Start/Pause/Reset, message sending/clearing, and a stock preset's feedback.
4. Record the package checksum and publish the same file that was validated.

Testing through an installed package exercises the bundled entrypoint and runtime. Loading source in developer mode is not a substitute. For troubleshooting a development checkout, the tools also support `DEBUG-PACKAGED`, which switches developer loading to `pkg/`; remove that marker when returning to ordinary source development.

## Publish source and the module archive

This module is maintained in a subdirectory of the app repository and published separately at:

`https://github.com/jrisalvato616/companion-module-advanced-speaker-timer`

Publish only the module subtree to that public repository. Keep its generated `dist` files in sync with `src`. Attach the final `.tgz` to a release/tag identifying the same source state. Do not include local test sessions, Companion configuration backups, development app bundles, or `node_modules` in the release.

For a coordinated app/module release, use the same version for both and describe any app requirements. Module **1.7.1** uses the matching app **1.7.1** for Send Draft and the clock-target fixes. The app repository's all-in-one release script builds and publishes app artifacts too; use the module's own package command when publishing only its `.tgz`.

## Runtime requirements

- `runEntrypoint()` at the end of `src/index.ts` starts Companion's IPC handshake. Without it, the process exits before the connection initializes.
- New apps push timer updates; fallback status polling keeps older or idle connections current. Stale/disconnected state must clear live-looking values and feedback.
