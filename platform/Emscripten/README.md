# OpenSweetEditor Web

## Build Wasm

### Windows (PowerShell)

```powershell
./platform/Emscripten/build-wasm.ps1
```

### macOS/Linux

```bash
bash ./platform/Emscripten/build-wasm.sh
```

The wasm output will be generated at `build/wasm/bin/sweeteditor.js` and `build/wasm/bin/sweeteditor.wasm`.

## Web API

- Core API (embind C++ mapping): `EditorCore`, `LineArrayDocument`, `PieceTableDocument`
- High-level API: `createSweetEditor(container, options)`
- Document abstraction/factory: `Document`, `DocumentFactory`
- Context menu i18n: pass `options.locale` with `"zh"` or `"en"` (default auto-detect from browser)

Entry file: `platform/Emscripten/web/index.js`
