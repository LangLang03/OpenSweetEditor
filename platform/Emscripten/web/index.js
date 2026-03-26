import { loadSweetEditorCore } from "./editor-core.js?v=20260326_19";
import { SweetEditorWidget } from "./sweet-editor-widget.js?v=20260326_19";

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
  DecorationTextChangeMode,
  DecorationResultDispatchMode,
  DecorationProviderCallMode,
  DecorationContext,
  DecorationResult,
  DecorationProvider,
  DecorationReceiver,
  DecorationProviderManager,
  SweetLineIncrementalDecorationProvider,
  normalizeNewlines,
  countLogicalLines,
  clampVisibleLineRange,
  applyLineChangeToLines,
  applyTextChangeToText,
  applyTextChangesToText,
} from "./editor-core.js?v=20260326_19";

export { SweetEditorWidget, EditorEventType } from "./sweet-editor-widget.js?v=20260326_19";

export async function createSweetEditor(container, options = {}) {
  if (!container) {
    throw new Error("container is required");
  }
  const wasmModule = options.wasmModule || await loadSweetEditorCore(options);
  return new SweetEditorWidget(container, wasmModule, options);
}


