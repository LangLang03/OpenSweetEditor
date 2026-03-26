const FALLBACK_SPAN_LAYER = Object.freeze({
  SYNTAX: 0,
  SEMANTIC: 1,
});

const FALLBACK_INLAY_TYPE = Object.freeze({
  TEXT: 0,
  ICON: 1,
  COLOR: 2,
});

const FALLBACK_SEPARATOR_STYLE = Object.freeze({
  SINGLE: 0,
  DOUBLE: 1,
});

const FALLBACK_DIAGNOSTIC_SEVERITY = Object.freeze({
  DIAG_ERROR: 0,
  DIAG_WARNING: 1,
  DIAG_INFO: 2,
  DIAG_HINT: 3,
});

function resolveEnum(moduleObj, enumName, fallback) {
  const enumObj = moduleObj && moduleObj[enumName];
  if (!enumObj || typeof enumObj !== "object") {
    return fallback;
  }
  const resolved = { ...fallback };
  Object.keys(fallback).forEach((key) => {
    if (!(key in enumObj)) {
      return;
    }
    const value = toFiniteNumber(enumObj[key]);
    if (value !== null) {
      resolved[key] = value;
    }
  });
  return Object.freeze(resolved);
}

function toFiniteNumber(value) {
  if (value && typeof value === "object" && "value" in value) {
    const enumValue = Number(value.value);
    if (Number.isFinite(enumValue)) {
      return enumValue;
    }
  }

  const n = Number(value);
  if (Number.isFinite(n)) {
    return n;
  }
  return null;
}

function toInt(value, fallback = 0) {
  const n = toFiniteNumber(value);
  if (n === null) {
    return fallback;
  }
  return Math.trunc(n);
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value.size === "function" && typeof value.get === "function") {
    const size = Math.max(0, toInt(value.size(), 0));
    const out = [];
    for (let i = 0; i < size; i += 1) {
      out.push(value.get(i));
    }
    return out;
  }

  if (typeof value[Symbol.iterator] === "function") {
    try {
      return Array.from(value);
    } catch (_) {
      return [];
    }
  }

  return [];
}

function ensureLine(value) {
  return Math.max(0, toInt(value, 0));
}

function ensureColumn(value) {
  return Math.max(0, toInt(value, 0));
}

function ensureLength(value) {
  return Math.max(0, toInt(value, 0));
}

function ensureRange(range, fallbackPosition = null) {
  if (range && range.start && range.end) {
    return {
      start: {
        line: ensureLine(range.start.line),
        column: ensureColumn(range.start.column),
      },
      end: {
        line: ensureLine(range.end.line),
        column: ensureColumn(range.end.column),
      },
    };
  }

  if (fallbackPosition && Number.isFinite(fallbackPosition.line) && Number.isFinite(fallbackPosition.column)) {
    return {
      start: {
        line: ensureLine(fallbackPosition.line),
        column: ensureColumn(fallbackPosition.column),
      },
      end: {
        line: ensureLine(fallbackPosition.line),
        column: ensureColumn(fallbackPosition.column),
      },
    };
  }

  return {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
  };
}

function normalizePosition(position) {
  if (!position) {
    return { line: 0, column: 0 };
  }
  return {
    line: ensureLine(position.line),
    column: ensureColumn(position.column),
  };
}

function iterateLineEntries(input, callback) {
  if (!input) {
    return;
  }

  if (input instanceof Map) {
    input.forEach((items, line) => {
      callback(ensureLine(line), asArray(items));
    });
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((entry, index) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        callback(ensureLine(entry[0]), asArray(entry[1]));
        return;
      }
      if (entry && typeof entry === "object" && Number.isFinite(entry.line)) {
        const items = entry.items ?? entry.spans ?? entry.hints ?? entry.phantoms ?? entry.icons ?? entry.diagnostics;
        callback(ensureLine(entry.line), asArray(items));
        return;
      }
      callback(ensureLine(index), asArray(entry));
    });
    return;
  }

  if (typeof input === "object") {
    Object.keys(input).forEach((lineKey) => {
      callback(ensureLine(lineKey), asArray(input[lineKey]));
    });
  }
}

function cloneLineMap(input) {
  if (input == null) {
    return null;
  }
  const out = new Map();
  iterateLineEntries(input, (line, items) => {
    out.set(line, items.map((item) => ({ ...item })));
  });
  return out;
}

function cloneList(input) {
  if (input == null) {
    return null;
  }
  return asArray(input).map((item) => {
    if (item == null || typeof item !== "object") {
      return item;
    }
    if (Array.isArray(item)) {
      return item.slice();
    }
    return { ...item };
  });
}

function appendLineMap(target, source) {
  if (!source) {
    return;
  }
  source.forEach((items, line) => {
    if (!target.has(line)) {
      target.set(line, []);
    }
    const outItems = target.get(line);
    items.forEach((item) => {
      outItems.push({ ...item });
    });
  });
}

function modePriority(mode) {
  switch (mode) {
    case DecorationApplyMode.REPLACE_ALL:
      return 2;
    case DecorationApplyMode.REPLACE_RANGE:
      return 1;
    case DecorationApplyMode.MERGE:
    default:
      return 0;
  }
}

function mergeMode(current, next) {
  return modePriority(next) > modePriority(current) ? next : current;
}

function normalizeCompletionKind(kind) {
  const n = toInt(kind, CompletionItem.KIND_TEXT);
  return n >= CompletionItem.KIND_KEYWORD && n <= CompletionItem.KIND_TEXT
    ? n
    : CompletionItem.KIND_TEXT;
}

function normalizeInsertTextFormat(format) {
  const n = toInt(format, CompletionItem.INSERT_TEXT_FORMAT_PLAIN_TEXT);
  if (n === CompletionItem.INSERT_TEXT_FORMAT_SNIPPET) {
    return n;
  }
  return CompletionItem.INSERT_TEXT_FORMAT_PLAIN_TEXT;
}

function normalizeCompletionItem(input) {
  if (input instanceof CompletionItem) {
    return input;
  }
  return new CompletionItem(input || {});
}

function normalizeCompletionItems(items) {
  return asArray(items).map((item) => normalizeCompletionItem(item));
}

function safeCall(fn) {
  try {
    return fn();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function loadSweetEditorCore(options = {}) {
  const { moduleFactory, modulePath, moduleOptions = {} } = options;

  let factory = moduleFactory;
  let moduleBaseUrl = null;
  if (!factory) {
    if (!modulePath) {
      throw new Error("modulePath or moduleFactory is required to load SweetEditor wasm module.");
    }
    moduleBaseUrl = new URL(modulePath, import.meta.url);
    const imported = await import(moduleBaseUrl.href);
    factory = imported.default || imported.createSweetEditorModule || imported;
  }

  if (typeof factory !== "function") {
    throw new Error("Invalid wasm module factory.");
  }

  const finalOptions = { ...moduleOptions };
  if (moduleBaseUrl && typeof finalOptions.locateFile !== "function") {
    finalOptions.locateFile = (path) => {
      const url = new URL(path, moduleBaseUrl);
      if (moduleBaseUrl.search && !url.search) {
        url.search = moduleBaseUrl.search;
      }
      return url.href;
    };
  }

  return factory(finalOptions);
}

export class Document {
  constructor(nativeDocument, kind) {
    if (new.target === Document) {
      throw new TypeError("Document is abstract. Use DocumentFactory.");
    }
    this._native = nativeDocument;
    this.kind = kind;
  }

  getNative() {
    return this._native;
  }

  getText() {
    return this._native.getU8Text();
  }

  getLineCount() {
    return this._native.getLineCount();
  }

  getLineText(line) {
    return this._native.getLineU16Text(line);
  }

  getPositionFromCharIndex(charIndex) {
    return this._native.getPositionFromCharIndex(charIndex);
  }

  getCharIndexFromPosition(position) {
    return this._native.getCharIndexFromPosition(position);
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }
}

class PieceTableDocumentImpl extends Document {
  constructor(nativeDocument) {
    super(nativeDocument, "piece-table");
  }
}

class LineArrayDocumentImpl extends Document {
  constructor(nativeDocument) {
    super(nativeDocument, "line-array");
  }
}

export class DocumentFactory {
  constructor(wasmModule) {
    this._wasm = wasmModule;
  }

  fromText(text, options = {}) {
    const kind = options.kind || "piece-table";
    if (kind === "line-array") {
      return this.fromLineArray(text);
    }
    return this.fromPieceTable(text);
  }

  fromPieceTable(text) {
    return new PieceTableDocumentImpl(new this._wasm.PieceTableDocument(text || ""));
  }

  fromLineArray(text) {
    return new LineArrayDocumentImpl(new this._wasm.LineArrayDocument(text || ""));
  }
}
export class WebEditorCore {
  constructor(wasmModule, textMeasurerCallbacks, editorOptions = {}, onDidMutate = null) {
    this._wasm = wasmModule;
    this._onDidMutate = typeof onDidMutate === "function" ? onDidMutate : null;
    this._notifySuppressed = 0;
    this._notifyPending = false;

    const nativeOptions = {
      touch_slop: editorOptions.touchSlop ?? 10.0,
      double_tap_timeout: editorOptions.doubleTapTimeout ?? 300,
      long_press_ms: editorOptions.longPressMs ?? 500,
      max_undo_stack_size: editorOptions.maxUndoStackSize ?? 512,
    };

    this._native = new wasmModule.EditorCore(textMeasurerCallbacks, nativeOptions);
    this._spanLayer = resolveEnum(wasmModule, "SpanLayer", FALLBACK_SPAN_LAYER);
    this._inlayType = resolveEnum(wasmModule, "InlayType", FALLBACK_INLAY_TYPE);
    this._separatorStyle = resolveEnum(wasmModule, "SeparatorStyle", FALLBACK_SEPARATOR_STYLE);
    this._diagnosticSeverity = resolveEnum(wasmModule, "DiagnosticSeverity", FALLBACK_DIAGNOSTIC_SEVERITY);
  }

  getNative() {
    return this._native;
  }

  beginBatch() {
    this._notifySuppressed += 1;
  }

  endBatch() {
    if (this._notifySuppressed > 0) {
      this._notifySuppressed -= 1;
    }
    if (this._notifySuppressed === 0 && this._notifyPending) {
      this._notifyPending = false;
      this._emitMutate();
    }
  }

  withBatch(fn) {
    this.beginBatch();
    try {
      return fn();
    } finally {
      this.endBatch();
    }
  }

  _invoke(method, ...args) {
    const fn = this._native?.[method];
    if (typeof fn !== "function") {
      throw new Error(`EditorCore method not found: ${method}`);
    }
    return fn.apply(this._native, args);
  }

  call(method, ...args) {
    const result = this._invoke(method, ...args);
    this._notifyMutate();
    return result;
  }

  read(method, ...args) {
    return this._invoke(method, ...args);
  }

  loadDocument(document) {
    const nativeDoc = typeof document?.getNative === "function" ? document.getNative() : document;
    this.call("loadDocument", nativeDoc);
  }

  setViewport(width, height) {
    this.call("setViewport", { width, height });
  }

  buildRenderModel() {
    return this.read("buildRenderModel");
  }

  handleGestureEvent(eventData) {
    return this.call(
      "handleGestureEventRaw",
      eventData.type ?? 0,
      eventData.points,
      eventData.modifiers ?? 0,
      eventData.wheel_delta_x ?? 0,
      eventData.wheel_delta_y ?? 0,
      eventData.direct_scale ?? 1.0,
    );
  }

  handleKeyEvent(eventData) {
    return this.call(
      "handleKeyEventRaw",
      eventData.key_code ?? 0,
      eventData.text ?? "",
      eventData.modifiers ?? 0,
    );
  }

  tickEdgeScroll() {
    return this.call("tickEdgeScroll");
  }

  tickFling() {
    return this.call("tickFling");
  }

  onFontMetricsChanged() {
    this.call("onFontMetricsChanged");
  }

  setFoldArrowMode(mode) {
    this.call("setFoldArrowMode", toInt(mode, 0));
  }

  setWrapMode(mode) {
    this.call("setWrapMode", toInt(mode, 0));
  }

  setTabSize(tabSize) {
    if (typeof this._native?.setTabSize === "function") {
      this.call("setTabSize", Math.max(1, toInt(tabSize, 4)));
    }
  }

  setScale(scale) {
    const value = Number(scale);
    this.call("setScale", Number.isFinite(value) ? value : 1.0);
  }

  setLineSpacing(add, mult) {
    const addValue = Number(add);
    const multValue = Number(mult);
    this.call(
      "setLineSpacing",
      Number.isFinite(addValue) ? addValue : 0.0,
      Number.isFinite(multValue) ? multValue : 1.0,
    );
  }

  setContentStartPadding(padding) {
    const value = Number(padding);
    this.call("setContentStartPadding", Number.isFinite(value) ? value : 0.0);
  }

  setShowSplitLine(show) {
    this.call("setShowSplitLine", Boolean(show));
  }

  setCurrentLineRenderMode(mode) {
    this.call("setCurrentLineRenderMode", toInt(mode, 0));
  }

  getViewState() {
    return this.read("getViewState");
  }

  getScrollMetrics() {
    return this.read("getScrollMetrics");
  }

  getLayoutMetrics() {
    return this.read("getLayoutMetrics");
  }

  insertText(text) {
    return this.call("insertText", String(text ?? ""));
  }

  replaceText(range, newText) {
    return this.call("replaceText", ensureRange(range), String(newText ?? ""));
  }

  deleteText(range) {
    return this.call("deleteText", ensureRange(range));
  }

  backspace() {
    return this.call("backspace");
  }

  deleteForward() {
    return this.call("deleteForward");
  }

  moveLineUp() {
    return this.call("moveLineUp");
  }

  moveLineDown() {
    return this.call("moveLineDown");
  }

  copyLineUp() {
    return this.call("copyLineUp");
  }

  copyLineDown() {
    return this.call("copyLineDown");
  }

  deleteLine() {
    return this.call("deleteLine");
  }

  insertLineAbove() {
    return this.call("insertLineAbove");
  }

  insertLineBelow() {
    return this.call("insertLineBelow");
  }

  undo() {
    return this.call("undo");
  }

  redo() {
    return this.call("redo");
  }

  setCursorPosition(position) {
    this.call("setCursorPosition", normalizePosition(position));
  }

  setSelection(startOrRange, startColumn, endLine, endColumn) {
    if (startOrRange && typeof startOrRange === "object" && startOrRange.start && startOrRange.end) {
      this.call("setSelection", ensureRange(startOrRange));
      return;
    }

    const range = ensureRange({
      start: {
        line: ensureLine(startOrRange),
        column: ensureColumn(startColumn),
      },
      end: {
        line: ensureLine(endLine),
        column: ensureColumn(endColumn),
      },
    });
    this.call("setSelection", range);
  }

  clearSelection() {
    this.call("clearSelection");
  }

  selectAll() {
    this.call("selectAll");
  }

  getSelectedText() {
    return this.read("getSelectedText");
  }

  moveCursorLeft(extendSelection = false) {
    this.call("moveCursorLeft", Boolean(extendSelection));
  }

  moveCursorRight(extendSelection = false) {
    this.call("moveCursorRight", Boolean(extendSelection));
  }

  moveCursorUp(extendSelection = false) {
    this.call("moveCursorUp", Boolean(extendSelection));
  }

  moveCursorDown(extendSelection = false) {
    this.call("moveCursorDown", Boolean(extendSelection));
  }

  moveCursorToLineStart(extendSelection = false) {
    this.call("moveCursorToLineStart", Boolean(extendSelection));
  }

  moveCursorToLineEnd(extendSelection = false) {
    this.call("moveCursorToLineEnd", Boolean(extendSelection));
  }

  compositionStart() {
    this.call("compositionStart");
  }

  compositionUpdate(text) {
    this.call("compositionUpdate", String(text ?? ""));
  }

  compositionEnd(committedText) {
    return this.call("compositionEnd", String(committedText ?? ""));
  }

  compositionCancel() {
    this.call("compositionCancel");
  }

  isComposing() {
    return this.read("isComposing");
  }

  setCompositionEnabled(enabled) {
    this.call("setCompositionEnabled", Boolean(enabled));
  }

  isCompositionEnabled() {
    return this.read("isCompositionEnabled");
  }

  setReadOnly(readOnly) {
    this.call("setReadOnly", Boolean(readOnly));
  }

  isReadOnly() {
    return this.read("isReadOnly");
  }

  setAutoIndentMode(mode) {
    this.call("setAutoIndentMode", toInt(mode, 0));
  }

  getAutoIndentMode() {
    return this.read("getAutoIndentMode");
  }

  setHandleConfig(config) {
    this.call("setHandleConfig", config || {});
  }

  getHandleConfig() {
    if (typeof this._native?.getHandleConfig === "function") {
      return this.read("getHandleConfig");
    }
    return null;
  }

  setScrollbarConfig(config) {
    this.call("setScrollbarConfig", config || {});
  }

  getScrollbarConfig() {
    if (typeof this._native?.getScrollbarConfig === "function") {
      return this.read("getScrollbarConfig");
    }
    return null;
  }

  getPositionRect(line, column) {
    if (typeof this._native?.getPositionScreenRect === "function") {
      return this.read("getPositionScreenRect", ensureLine(line), ensureColumn(column));
    }
    return this.read("getPositionRect", ensureLine(line), ensureColumn(column));
  }

  getCursorRect() {
    if (typeof this._native?.getCursorScreenRect === "function") {
      return this.read("getCursorScreenRect");
    }
    return this.read("getCursorRect");
  }

  scrollToLine(line, behavior = 0) {
    this.call("scrollToLine", ensureLine(line), toInt(behavior, 0));
  }

  gotoPosition(line, column) {
    this.call("gotoPosition", ensureLine(line), ensureColumn(column));
  }

  setScroll(scrollX, scrollY) {
    const x = Number(scrollX);
    const y = Number(scrollY);
    this.call(
      "setScroll",
      Number.isFinite(x) ? x : 0.0,
      Number.isFinite(y) ? y : 0.0,
    );
  }

  insertSnippet(snippetTemplate) {
    return this.call("insertSnippet", String(snippetTemplate ?? ""));
  }

  startLinkedEditing(model) {
    this.call("startLinkedEditing", model || {});
  }

  linkedEditingNext() {
    if (typeof this._native?.linkedEditingNextTabStop === "function") {
      const result = this._native.linkedEditingNextTabStop();
      this._notifyMutate();
      return result;
    }
    return this.call("linkedEditingNext");
  }

  linkedEditingPrev() {
    if (typeof this._native?.linkedEditingPrevTabStop === "function") {
      const result = this._native.linkedEditingPrevTabStop();
      this._notifyMutate();
      return result;
    }
    return this.call("linkedEditingPrev");
  }

  cancelLinkedEditing() {
    this.call("cancelLinkedEditing");
  }

  finishLinkedEditing() {
    this.call("finishLinkedEditing");
  }

  toggleFoldAt(line) {
    return this.call("toggleFoldAt", ensureLine(line));
  }

  foldAt(line) {
    return this.call("foldAt", ensureLine(line));
  }

  unfoldAt(line) {
    return this.call("unfoldAt", ensureLine(line));
  }

  foldAll() {
    this.call("foldAll");
  }

  unfoldAll() {
    this.call("unfoldAll");
  }

  isLineVisible(line) {
    return this.read("isLineVisible", ensureLine(line));
  }

  setMatchedBrackets(open, close) {
    if (arguments.length >= 4) {
      const openPosition = { line: ensureLine(arguments[0]), column: ensureColumn(arguments[1]) };
      const closePosition = { line: ensureLine(arguments[2]), column: ensureColumn(arguments[3]) };
      this.call("setMatchedBrackets", openPosition, closePosition);
      return;
    }

    this.call("setMatchedBrackets", normalizePosition(open), normalizePosition(close));
  }

  clearMatchedBrackets() {
    this.call("clearMatchedBrackets");
  }

  getCursorPosition() {
    return this.read("getCursorPosition");
  }

  getWordRangeAtCursor() {
    return this.read("getWordRangeAtCursor");
  }

  getWordAtCursor() {
    return this.read("getWordAtCursor");
  }

  getSelection() {
    return this.read("getSelection");
  }

  hasSelection() {
    return this.read("hasSelection");
  }

  canUndo() {
    return this.read("canUndo");
  }

  canRedo() {
    return this.read("canRedo");
  }

  isInLinkedEditing() {
    return this.read("isInLinkedEditing");
  }

  registerTextStyle(styleId, color, backgroundColor = 0, fontStyle = 0) {
    const style = {
      color: toInt(color, 0),
      background_color: toInt(backgroundColor, 0),
      font_style: toInt(fontStyle, 0),
    };
    this.call("registerTextStyle", toInt(styleId, 0), style);
  }

  setLineSpans(line, layer, spans) {
    const lineNo = ensureLine(line);
    const layerValue = toInt(layer, this._spanLayer.SYNTAX);
    const src = asArray(spans);
    this._callWithVector("StyleSpanVector", src, (span) => ({
      column: ensureColumn(span.column),
      length: ensureLength(span.length),
      style_id: toInt(span.styleId ?? span.style_id, 0),
    }), (vec) => {
      this.call("setLineSpans", lineNo, layerValue, vec);
    });
  }

  setBatchLineSpans(layer, spansByLine) {
    const layerValue = toInt(layer, this._spanLayer.SYNTAX);
    this.withBatch(() => {
      iterateLineEntries(spansByLine, (line, spans) => {
        this.setLineSpans(line, layerValue, spans);
      });
    });
  }

  setLineInlayHints(line, hints) {
    const lineNo = ensureLine(line);
    const src = asArray(hints);
    this._callWithVector("InlayHintVector", src, (hint) => this._toNativeInlayHint(hint), (vec) => {
      this.call("setLineInlayHints", lineNo, vec);
    });
  }

  setBatchLineInlayHints(hintsByLine) {
    this.withBatch(() => {
      iterateLineEntries(hintsByLine, (line, hints) => {
        this.setLineInlayHints(line, hints);
      });
    });
  }

  setLinePhantomTexts(line, phantoms) {
    const lineNo = ensureLine(line);
    const src = asArray(phantoms);
    this._callWithVector("PhantomTextVector", src, (phantom) => ({
      column: ensureColumn(phantom.column),
      text: String(phantom.text ?? ""),
    }), (vec) => {
      this.call("setLinePhantomTexts", lineNo, vec);
    });
  }

  setBatchLinePhantomTexts(phantomsByLine) {
    this.withBatch(() => {
      iterateLineEntries(phantomsByLine, (line, phantoms) => {
        this.setLinePhantomTexts(line, phantoms);
      });
    });
  }

  setLineGutterIcons(line, icons) {
    const lineNo = ensureLine(line);
    const src = asArray(icons);
    this._callWithVector("GutterIconVector", src, (icon) => ({
      icon_id: toInt(icon.iconId ?? icon.icon_id ?? icon, 0),
    }), (vec) => {
      this.call("setLineGutterIcons", lineNo, vec);
    });
  }

  setBatchLineGutterIcons(iconsByLine) {
    this.withBatch(() => {
      iterateLineEntries(iconsByLine, (line, icons) => {
        this.setLineGutterIcons(line, icons);
      });
    });
  }

  setLineDiagnostics(line, diagnostics) {
    const lineNo = ensureLine(line);
    const src = asArray(diagnostics);
    this._callWithVector("DiagnosticSpanVector", src, (item) => ({
      column: ensureColumn(item.column),
      length: ensureLength(item.length),
      severity: this._toNativeEnumValue("DiagnosticSeverity", item.severity, this._diagnosticSeverity.DIAG_HINT),
      color: toInt(item.color, 0),
    }), (vec) => {
      this.call("setLineDiagnostics", lineNo, vec);
    });
  }

  setBatchLineDiagnostics(diagsByLine) {
    this.withBatch(() => {
      iterateLineEntries(diagsByLine, (line, diagnostics) => {
        this.setLineDiagnostics(line, diagnostics);
      });
    });
  }

  setIndentGuides(guides) {
    this._callWithVector("IndentGuideVector", asArray(guides), (item) => ({
      start: normalizePosition(item.start),
      end: normalizePosition(item.end),
    }), (vec) => {
      this.call("setIndentGuides", vec);
    });
  }

  setBracketGuides(guides) {
    this._callWithVector("BracketGuideVector", asArray(guides), (item) => ({
      parent: normalizePosition(item.parent),
      end: normalizePosition(item.end),
      children: asArray(item.children).map((child) => normalizePosition(child)),
    }), (vec) => {
      this.call("setBracketGuides", vec);
    });
  }

  setFlowGuides(guides) {
    this._callWithVector("FlowGuideVector", asArray(guides), (item) => ({
      start: normalizePosition(item.start),
      end: normalizePosition(item.end),
    }), (vec) => {
      this.call("setFlowGuides", vec);
    });
  }

  setSeparatorGuides(guides) {
    this._callWithVector("SeparatorGuideVector", asArray(guides), (item) => ({
      line: ensureLine(item.line),
      style: this._toNativeEnumValue("SeparatorStyle", item.style, this._separatorStyle.SINGLE),
      count: Math.max(0, toInt(item.count, 0)),
      text_end_column: Math.max(0, toInt(item.textEndColumn ?? item.text_end_column, 0)),
    }), (vec) => {
      this.call("setSeparatorGuides", vec);
    });
  }

  setFoldRegions(regions) {
    this._callWithVector("FoldRegionVector", asArray(regions), (item) => ({
      start_line: ensureLine(item.startLine ?? item.start_line),
      end_line: ensureLine(item.endLine ?? item.end_line),
      collapsed: Boolean(item.collapsed),
    }), (vec) => {
      this.call("setFoldRegions", vec);
    });
  }

  setMaxGutterIcons(count) {
    this.call("setMaxGutterIcons", Math.max(0, toInt(count, 0)));
  }

  clearHighlights(layer = null) {
    if (layer == null) {
      this.call("clearHighlights");
      return;
    }
    this.call("clearHighlights", toInt(layer, this._spanLayer.SYNTAX));
  }

  clearInlayHints() {
    this.call("clearInlayHints");
  }

  clearPhantomTexts() {
    this.call("clearPhantomTexts");
  }

  clearGutterIcons() {
    this.call("clearGutterIcons");
  }

  clearDiagnostics() {
    this.call("clearDiagnostics");
  }

  clearGuides() {
    this.call("clearGuides");
  }

  clearAllDecorations() {
    this.call("clearAllDecorations");
  }

  setBracketPairs(bracketPairs) {
    this._callWithVector("BracketPairVector", asArray(bracketPairs), (pair) => ({
      open: toInt(pair.open, 0),
      close: toInt(pair.close, 0),
      auto_close: Boolean(pair.autoClose ?? pair.auto_close),
      surround: Boolean(pair.surround),
    }), (vec) => {
      this.call("setBracketPairs", vec);
    });
  }

  _toNativeInlayHint(hint) {
    const typeValue = toInt(hint.type, this._inlayType.TEXT);
    const nativeType = this._toNativeEnumValue("InlayType", typeValue, this._inlayType.TEXT);
    if (typeValue === this._inlayType.ICON) {
      return {
        type: nativeType,
        column: ensureColumn(hint.column),
        text: "",
        icon_id: toInt(hint.iconId ?? hint.icon_id ?? hint.intValue, 0),
        color: 0,
      };
    }
    if (typeValue === this._inlayType.COLOR) {
      return {
        type: nativeType,
        column: ensureColumn(hint.column),
        text: "",
        icon_id: 0,
        color: toInt(hint.color ?? hint.colorValue ?? hint.intValue, 0),
      };
    }
    return {
      type: this._toNativeEnumValue("InlayType", this._inlayType.TEXT, this._inlayType.TEXT),
      column: ensureColumn(hint.column),
      text: String(hint.text ?? ""),
      icon_id: 0,
      color: 0,
    };
  }

  _toNativeEnumValue(enumName, value, fallback = 0) {
    const numericValue = toInt(value, fallback);
    const enumType = this._wasm?.[enumName];
    const enumValues = enumType?.values;
    if (enumValues && Object.prototype.hasOwnProperty.call(enumValues, String(numericValue))) {
      return enumValues[String(numericValue)];
    }
    return numericValue;
  }

  _callWithVector(vectorName, items, mapper, fn) {
    const Ctor = this._wasm?.[vectorName];
    if (typeof Ctor !== "function") {
      throw new Error(`Vector constructor not found: ${vectorName}`);
    }
    const vec = new Ctor();
    try {
      asArray(items).forEach((item) => {
        vec.push_back(mapper(item));
      });
      fn(vec);
    } finally {
      if (typeof vec.delete === "function") {
        vec.delete();
      }
    }
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }

  _notifyMutate() {
    if (this._notifySuppressed > 0) {
      this._notifyPending = true;
      return;
    }
    this._emitMutate();
  }

  _emitMutate() {
    if (this._onDidMutate) {
      this._onDidMutate();
    }
  }
}
export const CompletionTriggerKind = Object.freeze({
  INVOKED: 0,
  CHARACTER: 1,
  RETRIGGER: 2,
});

export class CompletionItem {
  static KIND_KEYWORD = 0;
  static KIND_FUNCTION = 1;
  static KIND_VARIABLE = 2;
  static KIND_CLASS = 3;
  static KIND_INTERFACE = 4;
  static KIND_MODULE = 5;
  static KIND_PROPERTY = 6;
  static KIND_SNIPPET = 7;
  static KIND_TEXT = 8;

  static INSERT_TEXT_FORMAT_PLAIN_TEXT = 1;
  static INSERT_TEXT_FORMAT_SNIPPET = 2;

  constructor(init = {}) {
    this.label = String(init.label ?? "");
    this.detail = init.detail == null ? null : String(init.detail);
    this.insertText = init.insertText == null ? null : String(init.insertText);
    this.insertTextFormat = normalizeInsertTextFormat(init.insertTextFormat);
    this.textEdit = init.textEdit
      ? {
          range: ensureRange(init.textEdit.range),
          newText: String(init.textEdit.newText ?? ""),
        }
      : null;
    this.filterText = init.filterText == null ? null : String(init.filterText);
    this.sortKey = init.sortKey == null ? null : String(init.sortKey);
    this.kind = normalizeCompletionKind(init.kind);
  }

  get matchText() {
    return this.filterText || this.label;
  }
}

export class CompletionContext {
  constructor({
    triggerKind = CompletionTriggerKind.INVOKED,
    triggerCharacter = null,
    cursorPosition = { line: 0, column: 0 },
    lineText = "",
    wordRange = null,
    languageConfiguration = null,
    editorMetadata = null,
  } = {}) {
    this.triggerKind = toInt(triggerKind, CompletionTriggerKind.INVOKED);
    this.triggerCharacter = triggerCharacter == null ? null : String(triggerCharacter);
    this.cursorPosition = normalizePosition(cursorPosition);
    this.lineText = String(lineText ?? "");
    this.wordRange = ensureRange(wordRange, this.cursorPosition);
    this.languageConfiguration = languageConfiguration;
    this.editorMetadata = editorMetadata;
  }
}

export class CompletionResult {
  constructor(items = [], isIncomplete = false) {
    this.items = normalizeCompletionItems(items);
    this.isIncomplete = Boolean(isIncomplete);
  }

  static EMPTY = new CompletionResult([], false);
}

export class CompletionReceiver {
  accept(_result) {
    throw new Error("CompletionReceiver.accept must be implemented");
  }

  get isCancelled() {
    return true;
  }
}

export class CompletionProvider {
  isTriggerCharacter(_ch) {
    return false;
  }

  provideCompletions(_context, _receiver) {
    // Host app should implement.
  }
}

class ManagedCompletionReceiver extends CompletionReceiver {
  constructor(manager, provider, generation) {
    super();
    this._manager = manager;
    this._provider = provider;
    this._generation = generation;
    this._cancelled = false;
  }

  cancel() {
    this._cancelled = true;
  }

  accept(result) {
    if (this._cancelled || this._generation !== this._manager._generation) {
      return false;
    }
    const normalized = result instanceof CompletionResult
      ? result
      : new CompletionResult(result?.items ?? [], result?.isIncomplete ?? false);
    this._manager._onProviderResult(this._provider, normalized, this._generation);
    return true;
  }

  get isCancelled() {
    return this._cancelled || this._generation !== this._manager._generation;
  }
}

export class CompletionProviderManager {
  constructor(options = {}) {
    this._providers = new Set();
    this._activeReceivers = new Map();
    this._generation = 0;
    this._mergedItems = [];

    this._buildContext = typeof options.buildContext === "function" ? options.buildContext : null;
    this._onItemsUpdated = typeof options.onItemsUpdated === "function" ? options.onItemsUpdated : null;
    this._onDismissed = typeof options.onDismissed === "function" ? options.onDismissed : null;

    this._debounceCharacterMs = Math.max(0, toInt(options.debounceCharacterMs, 50));
    this._debounceInvokedMs = Math.max(0, toInt(options.debounceInvokedMs, 0));

    this._lastTriggerKind = CompletionTriggerKind.INVOKED;
    this._lastTriggerChar = null;
    this._refreshTimer = 0;
  }

  setListener(listener = null) {
    this._onItemsUpdated = typeof listener?.onItemsUpdated === "function" ? listener.onItemsUpdated : null;
    this._onDismissed = typeof listener?.onDismissed === "function" ? listener.onDismissed : null;
  }

  addProvider(provider) {
    if (!provider) {
      return;
    }
    this._providers.add(provider);
  }

  removeProvider(provider) {
    if (!provider) {
      return;
    }
    this._providers.delete(provider);
    const receiver = this._activeReceivers.get(provider);
    if (receiver) {
      receiver.cancel();
      this._activeReceivers.delete(provider);
    }
  }

  isTriggerCharacter(ch) {
    const chText = String(ch ?? "");
    for (const provider of this._providers) {
      if (safeCall(() => provider.isTriggerCharacter(chText))) {
        return true;
      }
    }
    return false;
  }

  triggerCompletion(triggerKind = CompletionTriggerKind.INVOKED, triggerCharacter = null) {
    if (this._providers.size === 0) {
      return;
    }

    this._lastTriggerKind = toInt(triggerKind, CompletionTriggerKind.INVOKED);
    this._lastTriggerChar = triggerCharacter == null ? null : String(triggerCharacter);

    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    const delay = this._lastTriggerKind === CompletionTriggerKind.INVOKED
      ? this._debounceInvokedMs
      : this._debounceCharacterMs;

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = 0;
      this._executeRefresh(this._lastTriggerKind, this._lastTriggerChar);
    }, Math.max(0, delay));
  }

  showItems(items) {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._generation += 1;
    this._cancelAllReceivers();

    this._mergedItems = normalizeCompletionItems(items);
    if (this._mergedItems.length === 0) {
      this._emitDismiss();
      return;
    }

    this._emitItemsUpdated(this._mergedItems);
  }

  dismiss() {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._generation += 1;
    this._cancelAllReceivers();
    this._mergedItems = [];
    this._emitDismiss();
  }

  _executeRefresh(triggerKind, triggerCharacter) {
    this._generation += 1;
    const generation = this._generation;

    this._cancelAllReceivers();
    this._mergedItems = [];

    const context = this._buildContext
      ? this._buildContext(triggerKind, triggerCharacter)
      : null;

    if (!context) {
      this.dismiss();
      return;
    }

    for (const provider of this._providers) {
      const receiver = new ManagedCompletionReceiver(this, provider, generation);
      this._activeReceivers.set(provider, receiver);
      try {
        provider.provideCompletions(context, receiver);
      } catch (error) {
        console.error("Completion provider error:", error);
      }
    }
  }

  _cancelAllReceivers() {
    this._activeReceivers.forEach((receiver) => {
      receiver.cancel();
    });
    this._activeReceivers.clear();
  }

  _onProviderResult(_provider, result, generation) {
    if (generation !== this._generation) {
      return;
    }

    this._mergedItems.push(...normalizeCompletionItems(result.items));
    this._mergedItems.sort((a, b) => {
      const keyA = a.sortKey || a.label;
      const keyB = b.sortKey || b.label;
      return keyA.localeCompare(keyB);
    });

    if (this._mergedItems.length === 0) {
      this._emitDismiss();
      return;
    }

    this._emitItemsUpdated(this._mergedItems);
  }

  _emitItemsUpdated(items) {
    if (this._onItemsUpdated) {
      this._onItemsUpdated(items.slice());
    }
  }

  _emitDismiss() {
    if (this._onDismissed) {
      this._onDismissed();
    }
  }
}
export const DecorationType = Object.freeze({
  SYNTAX_HIGHLIGHT: 1 << 0,
  SEMANTIC_HIGHLIGHT: 1 << 1,
  INLAY_HINT: 1 << 2,
  DIAGNOSTIC: 1 << 3,
  FOLD_REGION: 1 << 4,
  INDENT_GUIDE: 1 << 5,
  BRACKET_GUIDE: 1 << 6,
  FLOW_GUIDE: 1 << 7,
  SEPARATOR_GUIDE: 1 << 8,
  GUTTER_ICON: 1 << 9,
  PHANTOM_TEXT: 1 << 10,
});

export const DecorationApplyMode = Object.freeze({
  MERGE: 0,
  REPLACE_ALL: 1,
  REPLACE_RANGE: 2,
});

export const DecorationTextChangeMode = Object.freeze({
  INCREMENTAL: "incremental",
  FULL: "full",
  DISABLED: "disabled",
});

export const DecorationResultDispatchMode = Object.freeze({
  BOTH: "both",
  SYNC: "sync",
  ASYNC: "async",
});

export const DecorationProviderCallMode = Object.freeze({
  SYNC: "sync",
  ASYNC: "async",
});

export class DecorationContext {
  constructor({
    visibleStartLine = 0,
    visibleEndLine = -1,
    totalLineCount = 0,
    textChanges = [],
    languageConfiguration = null,
    editorMetadata = null,
  } = {}) {
    this.visibleStartLine = ensureLine(visibleStartLine);
    this.visibleEndLine = toInt(visibleEndLine, -1);
    this.totalLineCount = Math.max(0, toInt(totalLineCount, 0));
    this.textChanges = asArray(textChanges).map((change) => ({
      range: ensureRange(change.range),
      oldText: String(change.oldText ?? change.old_text ?? ""),
      newText: String(change.newText ?? change.new_text ?? ""),
    }));
    this.languageConfiguration = languageConfiguration;
    this.editorMetadata = editorMetadata;
  }
}

export class DecorationResult {
  constructor(init = {}) {
    this.syntaxSpans = init.syntaxSpans ?? null;
    this.semanticSpans = init.semanticSpans ?? null;
    this.inlayHints = init.inlayHints ?? null;
    this.diagnostics = init.diagnostics ?? null;
    this.indentGuides = init.indentGuides ?? null;
    this.bracketGuides = init.bracketGuides ?? null;
    this.flowGuides = init.flowGuides ?? null;
    this.separatorGuides = init.separatorGuides ?? null;
    this.foldRegions = init.foldRegions ?? null;
    this.gutterIcons = init.gutterIcons ?? null;
    this.phantomTexts = init.phantomTexts ?? null;

    this.syntaxSpansMode = toInt(init.syntaxSpansMode, DecorationApplyMode.MERGE);
    this.semanticSpansMode = toInt(init.semanticSpansMode, DecorationApplyMode.MERGE);
    this.inlayHintsMode = toInt(init.inlayHintsMode, DecorationApplyMode.MERGE);
    this.diagnosticsMode = toInt(init.diagnosticsMode, DecorationApplyMode.MERGE);
    this.indentGuidesMode = toInt(init.indentGuidesMode, DecorationApplyMode.MERGE);
    this.bracketGuidesMode = toInt(init.bracketGuidesMode, DecorationApplyMode.MERGE);
    this.flowGuidesMode = toInt(init.flowGuidesMode, DecorationApplyMode.MERGE);
    this.separatorGuidesMode = toInt(init.separatorGuidesMode, DecorationApplyMode.MERGE);
    this.foldRegionsMode = toInt(init.foldRegionsMode, DecorationApplyMode.MERGE);
    this.gutterIconsMode = toInt(init.gutterIconsMode, DecorationApplyMode.MERGE);
    this.phantomTextsMode = toInt(init.phantomTextsMode, DecorationApplyMode.MERGE);
  }
}

export class DecorationReceiver {
  accept(_result) {
    throw new Error("DecorationReceiver.accept must be implemented");
  }

  get isCancelled() {
    return true;
  }
}

export class DecorationProvider {
  getCapabilities() {
    return DecorationType.SYNTAX_HIGHLIGHT;
  }

  provideDecorations(_context, _receiver) {
    // Host app should implement.
  }
}

class ManagedDecorationReceiver extends DecorationReceiver {
  constructor(manager, provider, generation) {
    super();
    this._manager = manager;
    this._provider = provider;
    this._generation = generation;
    this._cancelled = false;
    this._inSyncPhase = true;
  }

  cancel() {
    this._cancelled = true;
  }

  markAsyncPhase() {
    this._inSyncPhase = false;
  }

  accept(result) {
    if (this._cancelled || this._generation !== this._manager._generation) {
      return false;
    }

    const dispatchMode = this._manager._resultDispatchMode;
    if (dispatchMode === DecorationResultDispatchMode.SYNC && !this._inSyncPhase) {
      return false;
    }
    if (dispatchMode === DecorationResultDispatchMode.ASYNC && this._inSyncPhase) {
      return false;
    }

    const patch = result instanceof DecorationResult ? result : new DecorationResult(result || {});
    this._manager._onProviderPatch(this._provider, patch, this._generation);
    return true;
  }

  get isCancelled() {
    return this._cancelled || this._generation !== this._manager._generation;
  }
}

function cloneDecorationResult(result) {
  return {
    syntaxSpans: cloneLineMap(result.syntaxSpans),
    semanticSpans: cloneLineMap(result.semanticSpans),
    inlayHints: cloneLineMap(result.inlayHints),
    diagnostics: cloneLineMap(result.diagnostics),
    indentGuides: cloneList(result.indentGuides),
    bracketGuides: cloneList(result.bracketGuides),
    flowGuides: cloneList(result.flowGuides),
    separatorGuides: cloneList(result.separatorGuides),
    foldRegions: cloneList(result.foldRegions),
    gutterIcons: cloneLineMap(result.gutterIcons),
    phantomTexts: cloneLineMap(result.phantomTexts),

    syntaxSpansMode: toInt(result.syntaxSpansMode, DecorationApplyMode.MERGE),
    semanticSpansMode: toInt(result.semanticSpansMode, DecorationApplyMode.MERGE),
    inlayHintsMode: toInt(result.inlayHintsMode, DecorationApplyMode.MERGE),
    diagnosticsMode: toInt(result.diagnosticsMode, DecorationApplyMode.MERGE),
    indentGuidesMode: toInt(result.indentGuidesMode, DecorationApplyMode.MERGE),
    bracketGuidesMode: toInt(result.bracketGuidesMode, DecorationApplyMode.MERGE),
    flowGuidesMode: toInt(result.flowGuidesMode, DecorationApplyMode.MERGE),
    separatorGuidesMode: toInt(result.separatorGuidesMode, DecorationApplyMode.MERGE),
    foldRegionsMode: toInt(result.foldRegionsMode, DecorationApplyMode.MERGE),
    gutterIconsMode: toInt(result.gutterIconsMode, DecorationApplyMode.MERGE),
    phantomTextsMode: toInt(result.phantomTextsMode, DecorationApplyMode.MERGE),
  };
}

function mergeDecorationPatch(target, patch) {
  const fields = [
    ["syntaxSpans", "syntaxSpansMode"],
    ["semanticSpans", "semanticSpansMode"],
    ["inlayHints", "inlayHintsMode"],
    ["diagnostics", "diagnosticsMode"],
    ["indentGuides", "indentGuidesMode"],
    ["bracketGuides", "bracketGuidesMode"],
    ["flowGuides", "flowGuidesMode"],
    ["separatorGuides", "separatorGuidesMode"],
    ["foldRegions", "foldRegionsMode"],
    ["gutterIcons", "gutterIconsMode"],
    ["phantomTexts", "phantomTextsMode"],
  ];

  fields.forEach(([dataKey, modeKey]) => {
    if (patch[dataKey] != null) {
      target[dataKey] = patch[dataKey];
      target[modeKey] = patch[modeKey];
      return;
    }

    if (patch[modeKey] !== DecorationApplyMode.MERGE) {
      target[dataKey] = null;
      target[modeKey] = patch[modeKey];
    }
  });
}

function normalizeDecorationTextChangeMode(mode) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationTextChangeMode.FULL) {
    return DecorationTextChangeMode.FULL;
  }
  if (value === DecorationTextChangeMode.DISABLED) {
    return DecorationTextChangeMode.DISABLED;
  }
  return DecorationTextChangeMode.INCREMENTAL;
}

function normalizeDecorationResultDispatchMode(mode) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationResultDispatchMode.SYNC) {
    return DecorationResultDispatchMode.SYNC;
  }
  if (value === DecorationResultDispatchMode.ASYNC) {
    return DecorationResultDispatchMode.ASYNC;
  }
  return DecorationResultDispatchMode.BOTH;
}

function normalizeDecorationProviderCallMode(mode) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationProviderCallMode.ASYNC) {
    return DecorationProviderCallMode.ASYNC;
  }
  return DecorationProviderCallMode.SYNC;
}

export class DecorationProviderManager {
  constructor(options = {}) {
    this._providers = new Set();
    this._providerStates = new Map();

    this._buildContext = typeof options.buildContext === "function" ? options.buildContext : null;
    this._getVisibleLineRange = typeof options.getVisibleLineRange === "function" ? options.getVisibleLineRange : null;
    this._ensureVisibleLineRange = typeof options.ensureVisibleLineRange === "function"
      ? options.ensureVisibleLineRange
      : null;
    this._getTotalLineCount = typeof options.getTotalLineCount === "function" ? options.getTotalLineCount : null;
    this._getLanguageConfiguration = typeof options.getLanguageConfiguration === "function"
      ? options.getLanguageConfiguration
      : null;
    this._getMetadata = typeof options.getMetadata === "function" ? options.getMetadata : null;
    this._onApplyMerged = typeof options.onApplyMerged === "function" ? options.onApplyMerged : null;

    this._refreshTimer = 0;
    this._scrollRefreshTimer = 0;
    this._applyTimer = 0;

    this._pendingTextChanges = [];
    this._applyScheduled = false;
    this._generation = 0;
    this._lastVisibleStartLine = 0;
    this._lastVisibleEndLine = -1;
    this._lastScrollRefreshTickMs = 0;

    this._scrollRefreshMinIntervalMs = 50;
    this._overscanViewportMultiplier = 0.5;
    this._textChangeMode = DecorationTextChangeMode.INCREMENTAL;
    this._resultDispatchMode = DecorationResultDispatchMode.BOTH;
    this._providerCallMode = DecorationProviderCallMode.SYNC;
    this._applySynchronously = false;

    this.setOptions(options);
  }

  setOptions(options = {}) {
    if (!options || typeof options !== "object") {
      return;
    }

    if ("scrollRefreshMinIntervalMs" in options) {
      this._scrollRefreshMinIntervalMs = Math.max(0, toInt(options.scrollRefreshMinIntervalMs, 50));
    }
    if ("overscanViewportMultiplier" in options) {
      this._overscanViewportMultiplier = Math.max(0, Number(options.overscanViewportMultiplier ?? 0.5));
    }
    if ("textChangeMode" in options) {
      this._textChangeMode = normalizeDecorationTextChangeMode(options.textChangeMode);
    }
    if ("resultDispatchMode" in options) {
      this._resultDispatchMode = normalizeDecorationResultDispatchMode(options.resultDispatchMode);
    }
    if ("providerCallMode" in options) {
      this._providerCallMode = normalizeDecorationProviderCallMode(options.providerCallMode);
    }
    if ("applySynchronously" in options) {
      this._applySynchronously = Boolean(options.applySynchronously);
    }
  }

  getOptions() {
    return {
      scrollRefreshMinIntervalMs: this._scrollRefreshMinIntervalMs,
      overscanViewportMultiplier: this._overscanViewportMultiplier,
      textChangeMode: this._textChangeMode,
      resultDispatchMode: this._resultDispatchMode,
      providerCallMode: this._providerCallMode,
      applySynchronously: this._applySynchronously,
    };
  }

  addProvider(provider) {
    if (!provider) {
      return;
    }
    this._providers.add(provider);
    if (!this._providerStates.has(provider)) {
      this._providerStates.set(provider, {
        snapshot: null,
        activeReceiver: null,
      });
    }
    this.requestRefresh();
  }

  removeProvider(provider) {
    if (!provider) {
      return;
    }

    this._providers.delete(provider);
    const state = this._providerStates.get(provider);
    if (state?.activeReceiver) {
      state.activeReceiver.cancel();
    }
    this._providerStates.delete(provider);

    this._scheduleApply();
  }

  requestRefresh() {
    this._scheduleRefresh(0, null);
  }

  onDocumentLoaded() {
    this._scheduleRefresh(0, null);
  }

  onTextChanged(changes) {
    if (this._textChangeMode === DecorationTextChangeMode.DISABLED) {
      return;
    }
    this._scheduleRefresh(50, asArray(changes));
  }

  onScrollChanged() {
    const now = Date.now();
    const elapsed = now - this._lastScrollRefreshTickMs;
    const delay = elapsed >= this._scrollRefreshMinIntervalMs
      ? 0
      : (this._scrollRefreshMinIntervalMs - elapsed);

    if (this._scrollRefreshTimer) {
      return;
    }

    this._scrollRefreshTimer = setTimeout(() => {
      this._scrollRefreshTimer = 0;
      if (this._refreshTimer) {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = 0;
      }
      this._doRefresh();
      this._lastScrollRefreshTickMs = Date.now();
    }, Math.max(0, delay));
  }

  _scheduleRefresh(delayMs, changes) {
    if (changes && changes.length > 0) {
      this._pendingTextChanges.push(...changes.map((change) => ({
        range: ensureRange(change.range),
        oldText: String(change.oldText ?? change.old_text ?? ""),
        newText: String(change.newText ?? change.new_text ?? ""),
      })));
    }

    if (this._scrollRefreshTimer) {
      clearTimeout(this._scrollRefreshTimer);
      this._scrollRefreshTimer = 0;
    }

    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = 0;
      this._doRefresh();
    }, Math.max(0, toInt(delayMs, 0)));
  }

  _doRefresh() {
    this._generation += 1;
    const generation = this._generation;

    if (this._ensureVisibleLineRange) {
      safeCall(() => this._ensureVisibleLineRange());
    }

    const visibleRange = this._resolveVisibleRange();
    this._lastVisibleStartLine = visibleRange.start;
    this._lastVisibleEndLine = visibleRange.end;

    const totalLineCount = Math.max(0, toInt(this._getTotalLineCount?.(), 0));
    const pendingChanges = this._pendingTextChanges.slice();
    this._pendingTextChanges = [];
    const contextChanges = this._textChangeMode === DecorationTextChangeMode.FULL
      ? []
      : pendingChanges;

    const contextRange = this._resolveContextRange(visibleRange, totalLineCount);
    const context = this._buildContext
      ? this._buildContext({
          visibleStartLine: contextRange.start,
          visibleEndLine: contextRange.end,
          totalLineCount,
          textChanges: contextChanges,
          languageConfiguration: this._getLanguageConfiguration?.() ?? null,
          editorMetadata: this._getMetadata?.() ?? null,
        })
      : new DecorationContext({
          visibleStartLine: contextRange.start,
          visibleEndLine: contextRange.end,
          totalLineCount,
          textChanges: contextChanges,
          languageConfiguration: this._getLanguageConfiguration?.() ?? null,
          editorMetadata: this._getMetadata?.() ?? null,
        });

    for (const provider of this._providers) {
      let state = this._providerStates.get(provider);
      if (!state) {
        state = { snapshot: null, activeReceiver: null };
        this._providerStates.set(provider, state);
      }

      if (state.activeReceiver) {
        state.activeReceiver.cancel();
      }

      const receiver = new ManagedDecorationReceiver(this, provider, generation);
      state.activeReceiver = receiver;
      this._invokeProvider(provider, context, receiver);
    }
  }

  _invokeProvider(provider, context, receiver) {
    const run = () => {
      if (receiver.isCancelled) {
        return;
      }
      try {
        provider.provideDecorations(context, receiver);
      } catch (error) {
        console.error("Decoration provider error:", error);
      } finally {
        receiver.markAsyncPhase();
      }
    };

    if (this._providerCallMode === DecorationProviderCallMode.ASYNC) {
      setTimeout(run, 0);
      return;
    }
    run();
  }

  _resolveVisibleRange() {
    const range = this._getVisibleLineRange ? this._getVisibleLineRange() : null;
    const start = ensureLine(range?.start ?? range?.[0] ?? 0);
    const end = toInt(range?.end ?? range?.[1], -1);
    return { start, end };
  }

  _resolveContextRange(visibleRange, totalLineCount) {
    if (totalLineCount <= 0 || visibleRange.end < visibleRange.start) {
      return { start: visibleRange.start, end: visibleRange.end };
    }

    const viewportLineCount = visibleRange.end - visibleRange.start + 1;
    const overscan = Math.max(0, Math.ceil(viewportLineCount * this._overscanViewportMultiplier));

    return {
      start: Math.max(0, visibleRange.start - overscan),
      end: Math.min(totalLineCount - 1, visibleRange.end + overscan),
    };
  }

  _onProviderPatch(provider, patch, generation) {
    if (generation !== this._generation) {
      return;
    }

    const normalizedPatch = cloneDecorationResult(patch);
    let state = this._providerStates.get(provider);
    if (!state) {
      state = { snapshot: null, activeReceiver: null };
      this._providerStates.set(provider, state);
    }

    if (!state.snapshot) {
      state.snapshot = cloneDecorationResult(new DecorationResult());
    }

    mergeDecorationPatch(state.snapshot, normalizedPatch);
    this._scheduleApply();
  }

  _scheduleApply() {
    if (this._applyScheduled) {
      return;
    }

    this._applyScheduled = true;
    if (this._applySynchronously) {
      this._applyScheduled = false;
      this._applyMerged();
      return;
    }

    this._applyTimer = setTimeout(() => {
      this._applyTimer = 0;
      this._applyScheduled = false;
      this._applyMerged();
    }, 0);
  }

  _applyMerged() {
    const merged = {
      syntaxSpans: new Map(),
      semanticSpans: new Map(),
      inlayHints: new Map(),
      diagnostics: new Map(),
      indentGuides: null,
      bracketGuides: null,
      flowGuides: null,
      separatorGuides: null,
      foldRegions: [],
      gutterIcons: new Map(),
      phantomTexts: new Map(),

      syntaxSpansMode: DecorationApplyMode.MERGE,
      semanticSpansMode: DecorationApplyMode.MERGE,
      inlayHintsMode: DecorationApplyMode.MERGE,
      diagnosticsMode: DecorationApplyMode.MERGE,
      indentGuidesMode: DecorationApplyMode.MERGE,
      bracketGuidesMode: DecorationApplyMode.MERGE,
      flowGuidesMode: DecorationApplyMode.MERGE,
      separatorGuidesMode: DecorationApplyMode.MERGE,
      foldRegionsMode: DecorationApplyMode.MERGE,
      gutterIconsMode: DecorationApplyMode.MERGE,
      phantomTextsMode: DecorationApplyMode.MERGE,
    };

    for (const provider of this._providers) {
      const state = this._providerStates.get(provider);
      if (!state?.snapshot) {
        continue;
      }

      const snapshot = state.snapshot;

      merged.syntaxSpansMode = mergeMode(merged.syntaxSpansMode, snapshot.syntaxSpansMode);
      appendLineMap(merged.syntaxSpans, snapshot.syntaxSpans);

      merged.semanticSpansMode = mergeMode(merged.semanticSpansMode, snapshot.semanticSpansMode);
      appendLineMap(merged.semanticSpans, snapshot.semanticSpans);

      merged.inlayHintsMode = mergeMode(merged.inlayHintsMode, snapshot.inlayHintsMode);
      appendLineMap(merged.inlayHints, snapshot.inlayHints);

      merged.diagnosticsMode = mergeMode(merged.diagnosticsMode, snapshot.diagnosticsMode);
      appendLineMap(merged.diagnostics, snapshot.diagnostics);

      merged.gutterIconsMode = mergeMode(merged.gutterIconsMode, snapshot.gutterIconsMode);
      appendLineMap(merged.gutterIcons, snapshot.gutterIcons);

      merged.phantomTextsMode = mergeMode(merged.phantomTextsMode, snapshot.phantomTextsMode);
      appendLineMap(merged.phantomTexts, snapshot.phantomTexts);

      merged.indentGuidesMode = mergeMode(merged.indentGuidesMode, snapshot.indentGuidesMode);
      if (snapshot.indentGuides) {
        merged.indentGuides = cloneList(snapshot.indentGuides);
      }

      merged.bracketGuidesMode = mergeMode(merged.bracketGuidesMode, snapshot.bracketGuidesMode);
      if (snapshot.bracketGuides) {
        merged.bracketGuides = cloneList(snapshot.bracketGuides);
      }

      merged.flowGuidesMode = mergeMode(merged.flowGuidesMode, snapshot.flowGuidesMode);
      if (snapshot.flowGuides) {
        merged.flowGuides = cloneList(snapshot.flowGuides);
      }

      merged.separatorGuidesMode = mergeMode(merged.separatorGuidesMode, snapshot.separatorGuidesMode);
      if (snapshot.separatorGuides) {
        merged.separatorGuides = cloneList(snapshot.separatorGuides);
      }

      merged.foldRegionsMode = mergeMode(merged.foldRegionsMode, snapshot.foldRegionsMode);
      if (snapshot.foldRegions) {
        merged.foldRegions.push(...cloneList(snapshot.foldRegions));
      }
    }

    if (this._onApplyMerged) {
      this._onApplyMerged(merged, {
        startLine: this._lastVisibleStartLine,
        endLine: this._lastVisibleEndLine,
      });
    }
  }
}
