import { loadSweetEditorCore } from "./core/wasm-core.js";
import { Document, DocumentFactory } from "./core/document.js";
import { WebEditorCore } from "./core/web-editor-core.js";
import { SweetEditorWidget } from "./widget/sweet-editor-widget.js";

export { loadSweetEditorCore, Document, DocumentFactory, WebEditorCore, SweetEditorWidget };

export async function createSweetEditor(container, options = {}) {
  if (!container) {
    throw new Error("container is required");
  }
  const wasmModule = options.wasmModule || await loadSweetEditorCore(options);
  return new SweetEditorWidget(container, wasmModule, options);
}
