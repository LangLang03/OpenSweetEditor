# OpenSweetEditor Web SDK Workspace

TypeScript-based Web SDK v2 workspace (pnpm).

Current npm line:

- `@sweeteditor/core@0.0.2`
- `@sweeteditor/widget@0.0.2`
- `@sweeteditor/providers-sweetline@0.0.2`
- `@sweeteditor/sdk@0.0.2`

## Documentation

- Usage guide (EN): [docs/en/api-platform-web.md](../../../docs/en/api-platform-web.md)
- Full API reference (EN, 100%): [docs/en/api-platform-web-sdk-v2-reference.md](../../../docs/en/api-platform-web-sdk-v2-reference.md)
- 使用指南（中文）: [docs/zh/api-platform-web.md](../../../docs/zh/api-platform-web.md)
- 完整 API 参考（中文，100%）: [docs/zh/api-platform-web-sdk-v2-reference.md](../../../docs/zh/api-platform-web-sdk-v2-reference.md)

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
pnpm docs:api
pnpm build
pnpm build:web-dist
```

`build:web-dist` writes static output to:

- `platform/Emscripten/web`

## Run Demo

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm --filter @sweeteditor/demo dev
```

Build demo only:

```bash
pnpm --filter @sweeteditor/demo build
```

## Runtime Bundling

`@sweeteditor/sdk` includes bundled runtime files for npm consumers:

- `packages/sdk/runtime/sweeteditor.js`
- `packages/sdk/runtime/sweeteditor.wasm`
- `packages/sdk/runtime/libs/sweetline/*`
- `packages/sdk/runtime/syntaxes/*.json`

By default, `createEditor(...)` uses the bundled runtime automatically when `options.wasm` is omitted.

Helpers exported by `@sweeteditor/sdk`:

- `getBundledWasmModulePath()`
- `getBundledSyntaxPath(name)`

## Browser/CDN Usage (ESM)

Web CDN usage is ESM-first (`<script type="module">`), not global-IIFE style.

```html
<script type="importmap">
{
  "imports": {
    "@sweeteditor/core": "https://cdn.jsdelivr.net/npm/@sweeteditor/core@0.0.2/dist/index.js",
    "@sweeteditor/widget": "https://cdn.jsdelivr.net/npm/@sweeteditor/widget@0.0.2/dist/index.js",
    "@sweeteditor/sdk": "https://cdn.jsdelivr.net/npm/@sweeteditor/sdk@0.0.2/dist/index.js"
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


