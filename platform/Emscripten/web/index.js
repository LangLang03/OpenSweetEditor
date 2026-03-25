import { loadSweetEditorCore } from "./editor-core.js?v=20260326_01";
import { SweetEditorWidget } from "./sweet-editor-widget.js?v=20260326_01";

export {
  loadSweetEditorCore,
  Document,
  DocumentFactory,
  WebEditorCore,
  CompletionItem,
  CompletionContext,
  CompletionResult,
  CompletionTriggerKind,
  CompletionProvider,
  CompletionReceiver,
  CompletionProviderManager,
  DecorationType,
  DecorationApplyMode,
  DecorationContext,
  DecorationResult,
  DecorationProvider,
  DecorationReceiver,
  DecorationProviderManager,
} from "./editor-core.js?v=20260326_01";

export { SweetEditorWidget } from "./sweet-editor-widget.js?v=20260326_01";

export async function createSweetEditor(container, options = {}) {
  if (!container) {
    throw new Error("container is required");
  }
  const wasmModule = options.wasmModule || await loadSweetEditorCore(options);
  return new SweetEditorWidget(container, wasmModule, options);
}


