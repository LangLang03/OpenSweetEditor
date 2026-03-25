import { createSweetEditor } from "../index.js?v=20260325_3";

const host = document.getElementById("editor");
const wasmVersion = Date.now();

const editor = await createSweetEditor(host, {
  modulePath: `../../../../build/wasm/bin/sweeteditor.js?v=${wasmVersion}`,
  text: `#include <iostream>\n\nint main() {\n    std::cout << \"Hello OpenSweetEditor Web\" << std::endl;\n    return 0;\n}\n`,
});

const core = editor.getCore();

document.getElementById("undoBtn").addEventListener("click", () => {
  core.call("undo");
});

document.getElementById("redoBtn").addEventListener("click", () => {
  core.call("redo");
});
