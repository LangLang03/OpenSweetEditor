export class WebEditorCore {
  constructor(wasmModule, textMeasurerCallbacks, editorOptions = {}, onDidMutate = null) {
    this._wasm = wasmModule;
    this._onDidMutate = typeof onDidMutate === "function" ? onDidMutate : null;
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
    this._notifyMutate();
  }

  setViewport(width, height) {
    this._native.setViewport({ width, height });
    this._notifyMutate();
  }

  buildRenderModel() {
    return this._native.buildRenderModel();
  }

  handleGestureEvent(eventData) {
    const result = this._native.handleGestureEventRaw(
      eventData.type ?? 0,
      eventData.points,
      eventData.modifiers ?? 0,
      eventData.wheel_delta_x ?? 0,
      eventData.wheel_delta_y ?? 0,
      eventData.direct_scale ?? 1.0,
    );
    this._notifyMutate();
    return result;
  }

  handleKeyEvent(eventData) {
    const result = this._native.handleKeyEventRaw(
      eventData.key_code ?? 0,
      eventData.text ?? "",
      eventData.modifiers ?? 0,
    );
    this._notifyMutate();
    return result;
  }

  tickEdgeScroll() {
    const result = this._native.tickEdgeScroll();
    this._notifyMutate();
    return result;
  }

  call(method, ...args) {
    const fn = this._native[method];
    if (typeof fn !== "function") {
      throw new Error(`EditorCore method not found: ${method}`);
    }
    const result = fn.apply(this._native, args);
    this._notifyMutate();
    return result;
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }

  _notifyMutate() {
    if (this._onDidMutate) {
      this._onDidMutate();
    }
  }
}
