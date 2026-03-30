# Web Platform API (Emscripten, SDK v2)

This document describes the current Web SDK v2 structure and usage.

## Status

- Web is organized as a pnpm workspace under `platform/Emscripten/sdk`.
- `platform/Emscripten/web` is build output and static distribution directory.
- v2 primary API entry is `@opensweeteditor/sdk` (`createEditor`), not v1 `createSweetEditor`.

Current npm packages:

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

## Build Flow

### Full Flow (recommended)

```powershell
./platform/Emscripten/build-wasm.ps1 -BuildType Release
```

```bash
bash ./platform/Emscripten/build-wasm.sh Release
```

The wasm script also runs workspace build and writes output to `platform/Emscripten/web`.

### Workspace-only Flow

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build:web-dist
```

## Public API (`@opensweeteditor/sdk`)

```ts
import {
  createEditor,
  createModel,
  getBundledWasmModulePath,
  getBundledSyntaxPath
} from "@opensweeteditor/sdk";
```

### `createEditor(container, options)`

```ts
const model = createModel("hello", {
  uri: "inmemory://demo/example.cpp",
  language: "cpp"
});

const editor = await createEditor(container, {
  model,
  locale: "en"
});
```

Default wasm behavior:

- If `options.wasm` is omitted, bundled runtime in `@opensweeteditor/sdk/runtime` is used.

Optional explicit wasm path:

```ts
const editor = await createEditor(container, {
  model,
  wasm: {
    modulePath: getBundledWasmModulePath()
  }
});
```

### `createModel(text, { uri, language })`

- Editor/model decoupling.
- Easy model switch with `editor.setModel(...)`.

### Provider registration

```ts
const c = editor.registerCompletionProvider({
  triggerCharacters: ["."],
  provideCompletions(context, model) {
    return [{ label: "print" }];
  }
});

const d = editor.registerDecorationProvider({
  provideDecorations(context, model) {
    return null;
  }
});
```

Both return `IDisposable`.

## SweetLine (optional package)

Package: `@opensweeteditor/providers-sweetline`

```ts
import { createSweetLineDecorationProvider } from "@opensweeteditor/providers-sweetline";

const provider = createSweetLineDecorationProvider({
  sweetLine,
  highlightEngine
});
editor.registerDecorationProvider(provider);
```

## Runtime Files Included in npm

`@opensweeteditor/sdk` tarball includes:

- `runtime/sweeteditor.js`
- `runtime/sweeteditor.wasm`
- `runtime/libs/sweetline/*`
- `runtime/syntaxes/*.json`

Syntax helper:

```ts
const cppSyntax = getBundledSyntaxPath("cpp.json");
```

## CDN Usage

Use ESM (`<script type="module">`), not global-IIFE API:

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

## Distribution Output (`platform/Emscripten/web`)

After `build:web-dist`:

```text
platform/Emscripten/web
├─ index.html
├─ assets/*
└─ runtime
   ├─ sweeteditor.js
   ├─ sweeteditor.wasm
   ├─ libs/sweetline/*
   ├─ syntaxes/*.json
   └─ files/*
```

Serve with any static server:

```bash
cd platform/Emscripten/web
python -m http.server 8080
```

Open: `http://localhost:8080/`

## Build-type Logging Defaults

CMake defaults:

- `Debug`: `ENABLE_LOG=1`, `ENABLE_PERF_LOG=1`, `SWEETEDITOR_DEBUG=1`
- `Release`: `ENABLE_LOG=0`, `ENABLE_PERF_LOG=0`, `SWEETEDITOR_DEBUG=0`

Override flags:

- `SWEETEDITOR_ENABLE_LOG`
- `SWEETEDITOR_ENABLE_PERF_LOG`
- `SWEETEDITOR_DEBUG_MODE`

