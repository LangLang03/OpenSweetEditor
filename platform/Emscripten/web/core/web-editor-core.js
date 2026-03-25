export class WebEditorCore {
  constructor(wasmModule, textMeasurerCallbacks, editorOptions = {}) {
    this._wasm = wasmModule;
    const nativeOptions = {
      touch_slop: editorOptions.touchSlop ?? 10.0,
      double_tap_timeout: editorOptions.doubleTapTimeout ?? 300,
      long_press_ms: editorOptions.longPressMs ?? 500,
      max_undo_stack_size: editorOptions.maxUndoStackSize ?? 512,
    };
    this._native = new wasmModule.EditorCore(textMeasurerCallbacks, nativeOptions);
  }

  getNative() {
    return this._native;
  }

  loadDocument(document) {
    const nativeDoc = typeof document.getNative === "function" ? document.getNative() : document;
    this._native.loadDocument(nativeDoc);
  }

  setViewport(width, height) {
    this._native.setViewport({ width, height });
  }

  buildRenderModel() {
    return this._native.buildRenderModel();
  }

  handleGestureEvent(eventData) {
    return this._native.handleGestureEvent(eventData);
  }

  handleKeyEvent(eventData) {
    return this._native.handleKeyEvent(eventData);
  }

  tickEdgeScroll() {
    return this._native.tickEdgeScroll();
  }

  call(method, ...args) {
    const fn = this._native[method];
    if (typeof fn !== "function") {
      throw new Error(`EditorCore method not found: ${method}`);
    }
    return fn.apply(this._native, args);
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }
}
