# @opensweeteditor/sdk

Stable public entry for OpenSweetEditor Web SDK v2.

## Install

```bash
npm i @opensweeteditor/sdk
```

## Quick Start

```ts
import { createEditor, createModel } from "@opensweeteditor/sdk";

const model = createModel("int main() {\n  return 0;\n}\n", {
  uri: "inmemory://demo/main.cpp",
  language: "cpp"
});

const editor = await createEditor(container, { model });
```

## Runtime

If `options.wasm` is omitted, bundled runtime is used automatically:

- `runtime/sweeteditor.js`
- `runtime/sweeteditor.wasm`
- `runtime/libs/sweetline/*`
- `runtime/syntaxes/*.json`

Helpers:

- `getBundledWasmModulePath()`
- `getBundledSyntaxPath(name)`

## Optional SweetLine

Use with `@opensweeteditor/providers-sweetline`.

