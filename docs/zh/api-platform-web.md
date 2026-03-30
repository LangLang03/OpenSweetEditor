# Web 平台 API（Emscripten，SDK v2）

本文档说明当前 Web SDK v2 的结构与使用方式。

## 当前状态

- Web 端采用 pnpm workspace，目录位于 `platform/Emscripten/sdk`。
- `platform/Emscripten/web` 是构建产物与静态分发目录。
- v2 主入口为 `@opensweeteditor/sdk`（`createEditor`），不再以 v1 `createSweetEditor` 作为主 API。

当前 npm 包版本：

- `@opensweeteditor/core@2.0.1`
- `@opensweeteditor/widget@2.0.1`
- `@opensweeteditor/providers-sweetline@2.0.1`
- `@opensweeteditor/sdk@2.0.1`

## 工作区结构

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

## 构建流程

### 全流程（推荐）

```powershell
./platform/Emscripten/build-wasm.ps1 -BuildType Release
```

```bash
bash ./platform/Emscripten/build-wasm.sh Release
```

脚本会在 wasm 完成后自动继续执行 workspace 构建，并把结果输出到 `platform/Emscripten/web`。

### 仅 workspace 流程

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build:web-dist
```

## v2 公开 API（`@opensweeteditor/sdk`）

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
  locale: "zh-CN"
});
```

默认 wasm 行为：

- 不传 `options.wasm` 时，自动使用 `@opensweeteditor/sdk/runtime` 内置运行时。

如需显式指定路径：

```ts
const editor = await createEditor(container, {
  model,
  wasm: {
    modulePath: getBundledWasmModulePath()
  }
});
```

### `createModel(text, { uri, language })`

- 编辑器与模型解耦。
- 可通过 `editor.setModel(...)` 快速切换模型。

### Provider 注册

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

两者都返回 `IDisposable`。

## SweetLine（可选包）

包名：`@opensweeteditor/providers-sweetline`

```ts
import { createSweetLineDecorationProvider } from "@opensweeteditor/providers-sweetline";

const provider = createSweetLineDecorationProvider({
  sweetLine,
  highlightEngine
});
editor.registerDecorationProvider(provider);
```

## npm 内置运行时文件

`@opensweeteditor/sdk` 发布包包含：

- `runtime/sweeteditor.js`
- `runtime/sweeteditor.wasm`
- `runtime/libs/sweetline/*`
- `runtime/syntaxes/*.json`

内置语法文件路径辅助函数：

```ts
const cppSyntax = getBundledSyntaxPath("cpp.json");
```

## CDN 用法

浏览器端使用 ESM（`<script type="module">`），不是全局 IIFE 方式：

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

## 产物目录（`platform/Emscripten/web`）

执行 `build:web-dist` 后：

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

可直接静态托管：

```bash
cd platform/Emscripten/web
python -m http.server 8080
```

访问：`http://localhost:8080/`

## BuildType 与日志默认值

CMake 默认行为：

- `Debug`：`ENABLE_LOG=1`、`ENABLE_PERF_LOG=1`、`SWEETEDITOR_DEBUG=1`
- `Release`：`ENABLE_LOG=0`、`ENABLE_PERF_LOG=0`、`SWEETEDITOR_DEBUG=0`

可通过以下 CMake 选项覆盖：

- `SWEETEDITOR_ENABLE_LOG`
- `SWEETEDITOR_ENABLE_PERF_LOG`
- `SWEETEDITOR_DEBUG_MODE`

