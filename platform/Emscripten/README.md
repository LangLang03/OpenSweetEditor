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
- Event enum: `EditorEventType`

Entry file: `platform/Emscripten/web/index.js`

## Web v1 对齐完成项

- `WebEditorCore` 已补 typed 转发：编辑、选择、光标、滚动、折叠、snippet、linked-editing、readOnly、wrap/scale/lineSpacing、装饰读写与清理。
- `SweetEditorWidget` 已补高层 API：`insert/replace/delete`、`undo/redo`、`selection/cursor`、`goto/scroll`、`fold`、`snippet/linked-editing`、`setLine*`/`setBatchLine*`、`clear*Decorations`。
- 已补 `settings` facade（`getSettings()`）并对齐：
  - `setScale/setWrapMode/setReadOnly/setAutoIndentMode/setMaxGutterIcons`
  - decoration 调度参数：`scrollRefreshMinIntervalMs` / `overscanViewportMultiplier`
- 已补统一事件总线（`subscribe/unsubscribe`）：
  - `TextChanged/CursorChanged/SelectionChanged/ScrollChanged/ScaleChanged/ContextMenu/InlayHintClick/GutterIconClick/FoldToggle`
- 已补 NewLineActionProvider 链（`addNewLineActionProvider/removeNewLineActionProvider`，Enter 优先走 provider）。
- 已补运行时主题与图标接线：
  - `applyTheme/getTheme`
  - `setEditorIconProvider/getEditorIconProvider`
  - Canvas 渲染补齐 gutter icon、inlay icon/color 可视化。

## Android-only 延后项

- InlineSuggestion、PerfOverlay 等 Android 专有能力不在 Web v1 交集范围内，按 v2 单独推进。

## Smoke 测试

- API + 渲染最小冒烟脚本：`platform/Emscripten/web/tests/web-api-smoke.js`
- 浏览器入口页：`platform/Emscripten/web/tests/smoke.html`
- 建议通过本地静态服务器打开 `smoke.html`（避免 `file://` 下 wasm 加载受限）。
