# OpenSweetEditor Web SDK Workspace

TypeScript-based Web SDK v2 workspace (pnpm).

Current npm line:

- `@opensweeteditor/core@2.0.1`
- `@opensweeteditor/widget@2.0.1`
- `@opensweeteditor/providers-sweetline@2.0.1`
- `@opensweeteditor/sdk@2.0.1`

## Workspace Layout

```text
platform/Emscripten/sdk
|-- packages
|   |-- core
|   |-- widget
|   |-- providers-sweetline
|   `-- sdk
|-- apps
|   `-- demo
|-- assets
`-- scripts
```

## Common Commands

```bash
pnpm install
pnpm clean
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm build:web-dist
```

`build:web-dist` writes static output to:

- `platform/Emscripten/web`

## Run Demo

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm --filter @opensweeteditor/demo dev
```

Build demo only:

```bash
pnpm --filter @opensweeteditor/demo build
```

## Runtime Bundling

`@opensweeteditor/sdk` includes bundled runtime files for npm consumers:

- `packages/sdk/runtime/sweeteditor.js`
- `packages/sdk/runtime/sweeteditor.wasm`
- `packages/sdk/runtime/libs/sweetline/*`
- `packages/sdk/runtime/syntaxes/*.json`

By default, `createEditor(...)` uses the bundled runtime automatically when `options.wasm` is omitted.

Helpers exported by `@opensweeteditor/sdk`:

- `getBundledWasmModulePath()`
- `getBundledSyntaxPath(name)`

## Browser/CDN Usage (ESM)

Web CDN usage is ESM-first (`<script type="module">`), not global-IIFE style.

```html
<script type="importmap">
{
  "imports": {
    "@opensweeteditor/core": "https://cdn.jsdelivr.net/npm/@opensweeteditor/core@2.0.1/dist/index.js",
    "@opensweeteditor/widget": "https://cdn.jsdelivr.net/npm/@opensweeteditor/widget@2.0.1/dist/index.js",
    "@opensweeteditor/sdk": "https://cdn.jsdelivr.net/npm/@opensweeteditor/sdk@2.0.1/dist/index.js"
  }
}
</script>
```

## Wasm Build Integration

Use existing wasm scripts:

- `platform/Emscripten/build-wasm.ps1`
- `platform/Emscripten/build-wasm.sh`

They build wasm and then trigger pnpm `build:web-dist`.

## Logging Defaults by Build Type

CMake defaults:

- `Debug`: logs/perf logs/debug macro enabled
- `Release`: logs/perf logs/debug macro disabled

Override flags:

- `SWEETEDITOR_ENABLE_LOG`
- `SWEETEDITOR_ENABLE_PERF_LOG`
- `SWEETEDITOR_DEBUG_MODE`

