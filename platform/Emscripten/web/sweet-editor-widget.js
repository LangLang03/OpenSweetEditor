import {
  DocumentFactory,
  WebEditorCore,
  CompletionItem,
  CompletionContext,
  CompletionTriggerKind,
  CompletionProviderManager,
  DecorationContext,
  DecorationApplyMode,
  DecorationProviderManager,
} from "./editor-core.js";

const FALLBACK_EVENT_TYPE = {
  TOUCH_DOWN: 1,
  TOUCH_POINTER_DOWN: 2,
  TOUCH_MOVE: 3,
  TOUCH_POINTER_UP: 4,
  TOUCH_UP: 5,
  TOUCH_CANCEL: 6,
  MOUSE_DOWN: 7,
  MOUSE_MOVE: 8,
  MOUSE_UP: 9,
  MOUSE_WHEEL: 10,
  MOUSE_RIGHT_DOWN: 11,
};

const FALLBACK_GESTURE_TYPE = {
  TAP: 1,
  DOUBLE_TAP: 2,
  LONG_PRESS: 3,
  SCALE: 4,
  SCROLL: 5,
  FAST_SCROLL: 6,
  DRAG_SELECT: 7,
  CONTEXT_MENU: 8,
};

const FALLBACK_KEY_CODE = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  ESCAPE: 27,
  DELETE_KEY: 46,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  HOME: 36,
  END: 35,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  A: 65,
  C: 67,
  V: 86,
  X: 88,
  Z: 90,
  Y: 89,
  K: 75,
};

const FALLBACK_MODIFIER = {
  SHIFT: 1,
  CTRL: 2,
  ALT: 4,
  META: 8,
};

const FALLBACK_SPAN_LAYER = {
  SYNTAX: 0,
  SEMANTIC: 1,
};

function resolveEnum(moduleObj, enumName, fallback) {
  const enumObj = moduleObj && moduleObj[enumName];
  if (!enumObj || typeof enumObj !== "object") {
    return fallback;
  }
  const resolved = { ...fallback };
  Object.keys(fallback).forEach((key) => {
    if (!(key in enumObj)) return;
    const value = toFiniteNumber(enumObj[key]);
    if (value !== null) {
      resolved[key] = value;
    }
  });
  return resolved;
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
  return Array.isArray(value) ? value : [];
}

function forVector(vec, fn) {
  if (!vec || typeof vec.size !== "function") return;
  const size = vec.size();
  for (let i = 0; i < size; i += 1) {
    fn(vec.get(i), i);
  }
}

const CONTEXT_MENU_I18N = {
  en: {
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    selectAll: "Select All",
  },
  zh: {
    undo: "撤销",
    redo: "重做",
    cut: "剪切",
    copy: "复制",
    paste: "粘贴",
    selectAll: "全选",
  },
};

function resolveLocale(locale) {
  const value = String(locale || "").toLowerCase();
  return value.startsWith("zh") ? "zh" : "en";
}

const DEFAULT_THEME = {
  background: "#1e1e1e",
  text: "#d4d4d4",
  lineNumber: "#858585",
  splitLine: "#333333",
  currentLine: "rgba(255,255,255,0.06)",
  selection: "rgba(90,140,255,0.30)",
  cursor: "#ffffff",
  inlayHintBg: "rgba(80,80,80,0.85)",
  foldPlaceholderBg: "rgba(70,70,70,0.9)",
  foldPlaceholderText: "#cfcfcf",
  phantomText: "rgba(180,180,180,0.75)",
};

function argbToCss(argb, fallback) {
  if (!argb) return fallback;
  const a = ((argb >>> 24) & 0xff) / 255;
  const r = (argb >>> 16) & 0xff;
  const g = (argb >>> 8) & 0xff;
  const b = argb & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

class Canvas2DRenderer {
  constructor(theme = {}) {
    this.theme = { ...DEFAULT_THEME, ...theme };
    this._measureCanvas = document.createElement("canvas");
    this._measureCtx = this._measureCanvas.getContext("2d");
    this._baseFontSize = 14;
    this._fontFamily = "Menlo, Consolas, Monaco, monospace";
  }

  createTextMeasurerCallbacks() {
    return {
      measureTextWidth: (text, fontStyle) => {
        this._measureCtx.font = this._fontByStyle(fontStyle);
        return this._measureCtx.measureText(text || "").width;
      },
      measureInlayHintWidth: (text) => {
        this._measureCtx.font = `12px ${this._fontFamily}`;
        return this._measureCtx.measureText(text || "").width;
      },
      measureIconWidth: () => this._baseFontSize,
      getFontMetrics: () => {
        this._measureCtx.font = this._fontByStyle(0);
        const metrics = this._measureCtx.measureText("Mg");
        const ascent = metrics.actualBoundingBoxAscent || this._baseFontSize * 0.8;
        const descent = metrics.actualBoundingBoxDescent || this._baseFontSize * 0.2;
        return { ascent: -ascent, descent };
      },
    };
  }

  render(ctx, model, viewportWidth, viewportHeight) {
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    if (!model) return;

    this._drawCurrentLine(ctx, model, viewportWidth);
    this._drawSelection(ctx, model);
    this._drawLines(ctx, model);
    this._drawCursor(ctx, model);
    this._drawGutter(ctx, model, viewportHeight);
  }

  _drawCurrentLine(ctx, model, viewportWidth) {
    if (!model.current_line) return;
    const cursor = model.cursor;
    const h = cursor && cursor.height > 0 ? cursor.height : this._baseFontSize * 1.4;
    ctx.fillStyle = this.theme.currentLine;
    ctx.fillRect(0, model.current_line.y, viewportWidth, h);
  }

  _drawSelection(ctx, model) {
    ctx.fillStyle = this.theme.selection;
    forVector(model.selection_rects, (rect) => {
      ctx.fillRect(rect.origin.x, rect.origin.y, rect.width, rect.height);
    });
  }

  _drawLines(ctx, model) {
    forVector(model.lines, (line) => {
      forVector(line.runs, (run) => {
        this._drawRun(ctx, run);
      });
    });
  }

  _drawRun(ctx, run) {
    if (!run) return;
    const style = run.style || {};
    const text = run.text || "";
    const topY = run.y - this._baseFontSize;

    if (style.background_color) {
      ctx.fillStyle = argbToCss(style.background_color, "transparent");
      ctx.fillRect(run.x, topY, run.width, this._baseFontSize * 1.3);
    }

    if (run.type === 3) {
      ctx.fillStyle = this.theme.inlayHintBg;
      ctx.fillRect(run.x, topY, run.width, this._baseFontSize * 1.3);
    }

    if (run.type === 5) {
      ctx.fillStyle = this.theme.foldPlaceholderBg;
      ctx.fillRect(run.x, topY, run.width, this._baseFontSize * 1.3);
      ctx.fillStyle = this.theme.foldPlaceholderText;
    } else if (run.type === 4) {
      ctx.fillStyle = this.theme.phantomText;
    } else {
      ctx.fillStyle = argbToCss(style.color, this.theme.text);
    }

    if (text.length > 0) {
      ctx.font = this._fontByStyle(style.font_style || 0);
      ctx.fillText(text, run.x, run.y);
    }
  }

  _drawCursor(ctx, model) {
    if (!model.cursor || !model.cursor.visible) return;
    ctx.fillStyle = this.theme.cursor;
    ctx.fillRect(model.cursor.position.x, model.cursor.position.y, 2, model.cursor.height);
  }

  _drawGutter(ctx, model, viewportHeight) {
    if (model.split_x <= 0) return;
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, model.split_x, viewportHeight);

    ctx.strokeStyle = this.theme.splitLine;
    if (model.split_line_visible) {
      ctx.beginPath();
      ctx.moveTo(model.split_x + 0.5, 0);
      ctx.lineTo(model.split_x + 0.5, viewportHeight);
      ctx.stroke();
    }

    ctx.fillStyle = this.theme.lineNumber;
    ctx.font = `12px ${this._fontFamily}`;
    forVector(model.lines, (line) => {
      if (line.wrap_index !== 0 || line.is_phantom_line) return;
      const p = line.line_number_position;
      ctx.fillText(String(line.logical_line + 1), p.x, p.y);
    });
  }

  _fontByStyle(fontStyle) {
    const bold = (fontStyle & 1) !== 0;
    const italic = (fontStyle & 2) !== 0;
    const weight = bold ? "700" : "400";
    const slope = italic ? "italic" : "normal";
    return `${slope} ${weight} ${this._baseFontSize}px ${this._fontFamily}`;
  }
}

class CompletionPopupController {
  constructor(container) {
    this._container = container;
    this._panel = document.createElement("div");
    this._panel.style.position = "absolute";
    this._panel.style.display = "none";
    this._panel.style.minWidth = "260px";
    this._panel.style.maxWidth = "420px";
    this._panel.style.maxHeight = "220px";
    this._panel.style.overflowY = "auto";
    this._panel.style.zIndex = "36";
    this._panel.style.border = "1px solid rgba(255,255,255,0.16)";
    this._panel.style.borderRadius = "8px";
    this._panel.style.background = "#1f2937";
    this._panel.style.boxShadow = "0 12px 24px rgba(0,0,0,0.35)";
    this._panel.style.padding = "4px";

    this._items = [];
    this._selectedIndex = 0;
    this._confirmListener = null;
    this._renderer = null;

    this._cursorX = 0;
    this._cursorY = 0;
    this._cursorHeight = 18;

    this._container.appendChild(this._panel);
  }

  setConfirmListener(listener) {
    this._confirmListener = typeof listener === "function" ? listener : null;
  }

  setRenderer(renderer) {
    this._renderer = typeof renderer === "function" ? renderer : null;
    this._renderItems();
  }

  get isShowing() {
    return this._panel.style.display !== "none";
  }

  updateCursorPosition(x, y, height) {
    this._cursorX = Number.isFinite(x) ? x : 0;
    this._cursorY = Number.isFinite(y) ? y : 0;
    this._cursorHeight = Math.max(12, Number.isFinite(height) ? height : 18);
    if (this.isShowing) {
      this._applyPosition();
    }
  }

  updateItems(items) {
    this._items = asArray(items).slice();
    this._selectedIndex = 0;
    if (this._items.length === 0) {
      this.dismissPanel();
      return;
    }
    this._renderItems();
    this._show();
  }

  dismissPanel() {
    this._panel.style.display = "none";
  }

  dispose() {
    this.dismissPanel();
    this._items = [];
    if (this._panel) {
      this._panel.remove();
    }
    this._panel = null;
    this._confirmListener = null;
    this._renderer = null;
  }

  handleKeyEvent(event) {
    if (!this.isShowing || this._items.length === 0) {
      return false;
    }

    switch (event.key) {
      case "ArrowUp":
        this._moveSelection(-1);
        return true;
      case "ArrowDown":
        this._moveSelection(1);
        return true;
      case "Enter":
      case "Tab":
        this._confirmSelected();
        return true;
      case "Escape":
        this.dismissPanel();
        return true;
      default:
        return false;
    }
  }

  _show() {
    this._panel.style.display = "block";
    this._applyPosition();
  }

  _applyPosition() {
    const gap = 4;
    const panelRect = this._panel.getBoundingClientRect();
    const hostRect = this._container.getBoundingClientRect();

    let x = this._cursorX;
    let y = this._cursorY + this._cursorHeight + gap;

    const maxX = Math.max(0, hostRect.width - panelRect.width - gap);
    const maxY = Math.max(0, hostRect.height - panelRect.height - gap);

    if (x > maxX) {
      x = maxX;
    }

    if (y > maxY) {
      y = this._cursorY - panelRect.height - gap;
    }

    x = Math.max(0, x);
    y = Math.max(0, y);

    this._panel.style.left = `${Math.round(x)}px`;
    this._panel.style.top = `${Math.round(y)}px`;
  }

  _renderItems() {
    this._panel.innerHTML = "";

    this._items.forEach((item, index) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      row.style.padding = "6px 8px";
      row.style.borderRadius = "6px";
      row.style.cursor = "pointer";
      row.style.fontFamily = "Consolas, Menlo, Monaco, monospace";
      row.style.fontSize = "13px";
      row.style.color = "#f3f4f6";

      const selected = index === this._selectedIndex;
      row.style.background = selected ? "rgba(255,255,255,0.12)" : "transparent";

      if (this._renderer) {
        this._renderer({
          row,
          item,
          index,
          selected,
        });
      } else {
        const badge = document.createElement("span");
        badge.style.minWidth = "18px";
        badge.style.height = "18px";
        badge.style.borderRadius = "6px";
        badge.style.display = "inline-flex";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        badge.style.fontSize = "10px";
        badge.style.fontWeight = "700";
        badge.style.background = "rgba(148,163,184,0.45)";
        badge.style.color = "#ffffff";
        badge.textContent = this._kindLetter(item.kind);

        const label = document.createElement("span");
        label.style.flex = "1 1 auto";
        label.textContent = item.label || "";

        const detail = document.createElement("span");
        detail.style.flex = "0 0 auto";
        detail.style.opacity = "0.75";
        detail.style.fontSize = "11px";
        detail.textContent = item.detail || "";

        row.appendChild(badge);
        row.appendChild(label);
        row.appendChild(detail);
      }

      row.addEventListener("mouseenter", () => {
        this._selectedIndex = index;
        this._rerenderSelection();
      });

      row.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this._selectedIndex = index;
        this._confirmSelected();
      });

      this._panel.appendChild(row);
    });
  }

  _kindLetter(kind) {
    switch (toInt(kind, CompletionItem.KIND_TEXT)) {
      case CompletionItem.KIND_KEYWORD: return "K";
      case CompletionItem.KIND_FUNCTION: return "F";
      case CompletionItem.KIND_VARIABLE: return "V";
      case CompletionItem.KIND_CLASS: return "C";
      case CompletionItem.KIND_INTERFACE: return "I";
      case CompletionItem.KIND_MODULE: return "M";
      case CompletionItem.KIND_PROPERTY: return "P";
      case CompletionItem.KIND_SNIPPET: return "S";
      default: return "T";
    }
  }

  _moveSelection(delta) {
    if (this._items.length === 0) {
      return;
    }
    this._selectedIndex = Math.max(0, Math.min(this._items.length - 1, this._selectedIndex + delta));
    this._rerenderSelection();
  }

  _rerenderSelection() {
    const children = this._panel.children;
    for (let i = 0; i < children.length; i += 1) {
      const selected = i === this._selectedIndex;
      children[i].style.background = selected ? "rgba(255,255,255,0.12)" : "transparent";
    }
  }

  _confirmSelected() {
    if (this._selectedIndex < 0 || this._selectedIndex >= this._items.length) {
      return;
    }
    const item = this._items[this._selectedIndex];
    this.dismissPanel();
    if (this._confirmListener) {
      this._confirmListener(item);
    }
  }
}
export class SweetEditorWidget {
  constructor(container, wasmModule, options = {}) {
    this.container = container;
    this._wasm = wasmModule;
    this._options = options;
    this._locale = resolveLocale(options.locale || (typeof navigator !== "undefined" ? navigator.language : "en"));
    this._i18n = CONTEXT_MENU_I18N[this._locale];
    this._eventType = resolveEnum(wasmModule, "EventType", FALLBACK_EVENT_TYPE);
    this._gestureType = resolveEnum(wasmModule, "GestureType", FALLBACK_GESTURE_TYPE);
    this._keyCode = resolveEnum(wasmModule, "KeyCode", FALLBACK_KEY_CODE);
    this._modifier = resolveEnum(wasmModule, "Modifier", FALLBACK_MODIFIER);
    this._spanLayer = resolveEnum(wasmModule, "SpanLayer", FALLBACK_SPAN_LAYER);

    this._renderer = new Canvas2DRenderer(options.theme || {});
    this._core = new WebEditorCore(
      wasmModule,
      this._renderer.createTextMeasurerCallbacks(),
      options.editorOptions || {},
      () => this._markDirty(),
    );

    this._documentFactory = new DocumentFactory(wasmModule);
    this._document = null;
    this._languageConfiguration = options.languageConfiguration || null;
    this._metadata = options.metadata || null;

    this._activeTouches = new Map();
    this._edgeTimer = null;
    this._rafHandle = 0;
    this._dirty = false;
    this._renderErrorLogged = false;
    this._disposed = false;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._lastRenderModel = null;

    this._isComposing = false;
    this._compositionCommitPending = false;
    this._compositionEndFallbackData = "";
    this._compositionEndTimer = 0;

    this._contextMenuVisible = false;
    this._contextMenuButtons = {};

    this._onDocumentPointerDown = (event) => this._handleDocumentPointerDown(event);
    this._onDocumentKeyDown = (event) => this._handleDocumentKeyDown(event);
    this._onWindowBlur = () => {
      this._hideContextMenu();
      this.dismissCompletion();
    };

    this._completionPopupController = new CompletionPopupController(this.container);
    this._completionPopupController.setConfirmListener((item) => this._applyCompletionItem(item));

    this._completionProviderManager = new CompletionProviderManager({
      buildContext: (triggerKind, triggerCharacter) => this._buildCompletionContext(triggerKind, triggerCharacter),
      onItemsUpdated: (items) => {
        this._updateCompletionPopupCursorAnchor();
        this._completionPopupController.updateItems(items);
      },
      onDismissed: () => {
        this._completionPopupController.dismissPanel();
      },
    });

    const decorationOptions = options.decorationOptions || options.decorationProviderOptions || {};
    this._decorationProviderManager = new DecorationProviderManager({
      buildContext: (ctx) => new DecorationContext(ctx),
      getVisibleLineRange: () => this.getVisibleLineRange(),
      ensureVisibleLineRange: () => this._refreshRenderModelSnapshot(),
      getTotalLineCount: () => this.getTotalLineCount(),
      getLanguageConfiguration: () => this._languageConfiguration,
      getMetadata: () => this._metadata,
      onApplyMerged: (merged, visibleRange) => this._applyMergedDecorations(merged, visibleRange),
      textChangeMode: decorationOptions.textChangeMode,
      resultDispatchMode: decorationOptions.resultDispatchMode,
      providerCallMode: decorationOptions.providerCallMode,
      scrollRefreshMinIntervalMs: decorationOptions.scrollRefreshMinIntervalMs,
      overscanViewportMultiplier: decorationOptions.overscanViewportMultiplier,
      applySynchronously: decorationOptions.applySynchronously,
    });

    this._setupDom();
    this._bindEvents();
    this._resize();

    this._core.call("setCompositionEnabled", options.enableComposition ?? true);
    this._applyLanguageBracketPairs();

    if (options.text != null) {
      this.loadText(options.text, { kind: options.documentKind || "piece-table" });
    }

    this._markDirty();
  }

  getCore() {
    return this._core;
  }

  getDocumentFactory() {
    return this._documentFactory;
  }

  setLocale(locale) {
    this._locale = resolveLocale(locale);
    this._i18n = CONTEXT_MENU_I18N[this._locale];
    this._refreshContextMenuLabels();
  }

  setLanguageConfiguration(config) {
    this._languageConfiguration = config || null;
    this._applyLanguageBracketPairs();
    this.requestDecorationRefresh();
  }

  getLanguageConfiguration() {
    return this._languageConfiguration;
  }

  setMetadata(metadata) {
    this._metadata = metadata ?? null;
  }

  getMetadata() {
    return this._metadata;
  }

  loadText(text, options = {}) {
    if (this._document) {
      this._document.dispose();
    }

    this._document = this._documentFactory.fromText(String(text ?? ""), options);
    this._core.loadDocument(this._document);

    this._decorationProviderManager.onDocumentLoaded();
    this.dismissCompletion();
    this._markDirty();
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;

    if (this._compositionEndTimer) {
      clearTimeout(this._compositionEndTimer);
      this._compositionEndTimer = 0;
    }

    this._hideContextMenu();
    this.dismissCompletion();

    document.removeEventListener("pointerdown", this._onDocumentPointerDown, true);
    document.removeEventListener("keydown", this._onDocumentKeyDown, true);
    window.removeEventListener("blur", this._onWindowBlur);

    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = 0;
    }
    if (this._edgeTimer) {
      clearInterval(this._edgeTimer);
      this._edgeTimer = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._document) {
      this._document.dispose();
      this._document = null;
    }

    this._core.dispose();

    if (this._contextMenu) {
      this._contextMenu.remove();
      this._contextMenu = null;
    }

    if (this._completionPopupController) {
      this._completionPopupController.dispose();
      this._completionPopupController = null;
    }

    this._canvas.remove();
    this._input.remove();
  }

  registerTextStyle(styleId, color, backgroundColor = 0, fontStyle = 0) {
    this._core.registerTextStyle(styleId, color, backgroundColor, fontStyle);
  }

  setLineSpans(line, layer, spans) {
    this._core.setLineSpans(line, layer, spans);
  }

  setBatchLineSpans(layer, spansByLine) {
    this._core.setBatchLineSpans(layer, spansByLine);
  }

  clearHighlights(layer = null) {
    this._core.clearHighlights(layer);
  }

  addDecorationProvider(provider) {
    this._decorationProviderManager.addProvider(provider);
  }

  removeDecorationProvider(provider) {
    this._decorationProviderManager.removeProvider(provider);
  }

  requestDecorationRefresh() {
    this._decorationProviderManager.requestRefresh();
  }

  setDecorationProviderOptions(options = {}) {
    this._decorationProviderManager.setOptions(options);
  }

  getDecorationProviderOptions() {
    return this._decorationProviderManager.getOptions();
  }

  setDecorationOptions(options = {}) {
    this.setDecorationProviderOptions(options);
  }

  getDecorationOptions() {
    return this.getDecorationProviderOptions();
  }

  addCompletionProvider(provider) {
    this._completionProviderManager.addProvider(provider);
  }

  removeCompletionProvider(provider) {
    this._completionProviderManager.removeProvider(provider);
  }

  triggerCompletion() {
    this._completionProviderManager.triggerCompletion(CompletionTriggerKind.INVOKED, null);
  }

  showCompletionItems(items) {
    this._completionProviderManager.showItems(items);
  }

  dismissCompletion() {
    this._completionProviderManager.dismiss();
  }

  setCompletionItemRenderer(renderer) {
    this._completionPopupController.setRenderer(renderer);
  }

  getVisibleLineRange(options = {}) {
    const preferFreshModel = Boolean(options?.preferFreshModel ?? false);
    const model = preferFreshModel
      ? (this._refreshRenderModelSnapshot() || this._lastRenderModel)
      : (this._lastRenderModel || this._refreshRenderModelSnapshot());
    if (!model || !model.lines) {
      return { start: 0, end: -1 };
    }

    let start = Number.MAX_SAFE_INTEGER;
    let end = -1;

    forVector(model.lines, (line) => {
      const logicalLine = toInt(line.logical_line, -1);
      if (logicalLine < 0) {
        return;
      }
      if (logicalLine < start) {
        start = logicalLine;
      }
      if (logicalLine > end) {
        end = logicalLine;
      }
    });

    if (end < 0 || start === Number.MAX_SAFE_INTEGER) {
      return { start: 0, end: -1 };
    }

    return { start, end };
  }

  getTotalLineCount() {
    if (!this._document) {
      return 0;
    }
    return toInt(this._document.getLineCount(), 0);
  }

  _setupDom() {
    this.container.style.position = this.container.style.position || "relative";
    this.container.style.overflow = "hidden";

    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this._canvas.style.display = "block";
    this._canvas.style.touchAction = "none";
    this.container.appendChild(this._canvas);

    this._ctx = this._canvas.getContext("2d");

    this._input = document.createElement("textarea");
    this._input.setAttribute("aria-label", "Editor hidden input");
    this._input.tabIndex = -1;
    this._input.spellcheck = false;
    this._input.autocomplete = "off";
    this._input.style.position = "absolute";
    this._input.style.left = "0";
    this._input.style.top = "0";
    this._input.style.width = "2px";
    this._input.style.height = "18px";
    this._input.style.padding = "0";
    this._input.style.margin = "0";
    this._input.style.border = "0";
    this._input.style.outline = "none";
    this._input.style.color = "transparent";
    this._input.style.caretColor = "transparent";
    this._input.style.background = "transparent";
    this._input.style.opacity = "0.01";
    this._input.style.pointerEvents = "none";
    this.container.appendChild(this._input);

    this._createContextMenu();

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.container);
  }

  _bindEvents() {
    this._canvas.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    this._canvas.addEventListener("pointermove", (e) => this._onPointerMove(e));
    this._canvas.addEventListener("pointerup", (e) => this._onPointerUp(e));
    this._canvas.addEventListener("pointercancel", (e) => this._onPointerCancel(e));
    this._canvas.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
    this._canvas.addEventListener("contextmenu", (e) => this._onContextMenu(e));

    this._input.addEventListener("keydown", (e) => this._onKeyDown(e));
    this._input.addEventListener("compositionstart", () => {
      if (this._compositionEndTimer) {
        clearTimeout(this._compositionEndTimer);
        this._compositionEndTimer = 0;
      }
      this._isComposing = true;
      this._compositionCommitPending = false;
      this._compositionEndFallbackData = "";
      this._input.value = "";
      this._core.call("compositionStart");
    });

    this._input.addEventListener("compositionupdate", (e) => {
      const composingText = typeof e.data === "string" ? e.data : (this._input.value || "");
      this._core.call("compositionUpdate", composingText);
    });

    this._input.addEventListener("compositionend", (e) => {
      this._isComposing = false;
      this._compositionCommitPending = true;
      this._compositionEndFallbackData = typeof e.data === "string" ? e.data : "";
      this._input.value = "";
      this._compositionEndTimer = setTimeout(() => {
        this._compositionEndTimer = 0;
        if (!this._compositionCommitPending) {
          return;
        }

        this._compositionCommitPending = false;
        const fallbackCommit = this._compositionEndFallbackData;
        this._compositionEndFallbackData = "";

        const result = fallbackCommit
          ? this._core.call("compositionEnd", fallbackCommit)
          : this._core.call("compositionCancel");

        this._handleTextEditResult(result);
      }, 0);
    });

    this._input.addEventListener("input", (e) => this._onInput(e));
    this._input.addEventListener("copy", (e) => this._handleClipboardCopyCut(e, false));
    this._input.addEventListener("cut", (e) => this._handleClipboardCopyCut(e, true));
    this._input.addEventListener("paste", (e) => this._handleClipboardPaste(e));

    document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
    document.addEventListener("keydown", this._onDocumentKeyDown, true);
    window.addEventListener("blur", this._onWindowBlur);
  }
  _onInput(e) {
    const inputType = e.inputType || "";

    if (inputType === "insertFromComposition") {
      if (this._compositionCommitPending) {
        if (this._compositionEndTimer) {
          clearTimeout(this._compositionEndTimer);
          this._compositionEndTimer = 0;
        }
        this._compositionCommitPending = false;
        const committedText = (typeof e.data === "string" && e.data.length > 0)
          ? e.data
          : (this._input.value || this._compositionEndFallbackData || "");
        this._compositionEndFallbackData = "";
        const result = this._core.call("compositionEnd", committedText);
        this._handleTextEditResult(result);
      }
      this._input.value = "";
      return;
    }

    if (this._isComposing || e.isComposing || inputType.startsWith("insertComposition") || inputType.startsWith("deleteComposition")) {
      return;
    }

    if (inputType === "deleteContentBackward") {
      const result = this._core.call("backspace");
      this._input.value = "";
      this._handleTextEditResult(result);
      return;
    }

    if (inputType === "deleteContentForward") {
      const result = this._core.call("deleteForward");
      this._input.value = "";
      this._handleTextEditResult(result);
      return;
    }

    const text = (typeof e.data === "string" && e.data.length > 0) ? e.data : (this._input.value || "");
    this._input.value = "";
    if (!text) {
      return;
    }

    const result = this._core.call("insertText", text);
    this._handleTextEditResult(result);
  }

  _onPointerDown(event) {
    this._hideContextMenu();
    this._input.focus();

    if (typeof this._canvas.setPointerCapture === "function") {
      try {
        this._canvas.setPointerCapture(event.pointerId);
      } catch (_) {
        // ignore
      }
    }

    const point = this._eventPoint(event);
    if (event.pointerType === "mouse") {
      const type = event.button === 2 ? this._eventType.MOUSE_RIGHT_DOWN : this._eventType.MOUSE_DOWN;
      this._dispatchGesture(type, [point], event);
      event.preventDefault();
      return;
    }

    this._activeTouches.set(event.pointerId, point);
    const type = this._activeTouches.size === 1 ? this._eventType.TOUCH_DOWN : this._eventType.TOUCH_POINTER_DOWN;
    this._dispatchGesture(type, Array.from(this._activeTouches.values()), event);
    event.preventDefault();
  }

  _onPointerMove(event) {
    const point = this._eventPoint(event);
    if (event.pointerType === "mouse") {
      if ((event.buttons & 1) !== 0) {
        this._dispatchGesture(this._eventType.MOUSE_MOVE, [point], event);
      }
      return;
    }

    if (!this._activeTouches.has(event.pointerId)) return;
    this._activeTouches.set(event.pointerId, point);
    this._dispatchGesture(this._eventType.TOUCH_MOVE, Array.from(this._activeTouches.values()), event);
    event.preventDefault();
  }

  _onPointerUp(event) {
    const point = this._eventPoint(event);
    if (typeof this._canvas.releasePointerCapture === "function") {
      try {
        this._canvas.releasePointerCapture(event.pointerId);
      } catch (_) {
        // ignore
      }
    }

    if (event.pointerType === "mouse") {
      this._dispatchGesture(this._eventType.MOUSE_UP, [point], event);
      return;
    }

    if (!this._activeTouches.has(event.pointerId)) return;
    const type = this._activeTouches.size > 1 ? this._eventType.TOUCH_POINTER_UP : this._eventType.TOUCH_UP;
    this._dispatchGesture(type, Array.from(this._activeTouches.values()), event);
    this._activeTouches.delete(event.pointerId);
    event.preventDefault();
  }

  _onPointerCancel(event) {
    if (event.pointerType !== "mouse") {
      this._dispatchGesture(this._eventType.TOUCH_CANCEL, Array.from(this._activeTouches.values()), event);
      this._activeTouches.delete(event.pointerId);
      event.preventDefault();
    }
  }

  _onWheel(event) {
    this._hideContextMenu();
    const point = this._eventPoint(event);
    this._dispatchGesture(this._eventType.MOUSE_WHEEL, [point], event, event.deltaX, -event.deltaY, 1.0);
    event.preventDefault();
  }

  _onContextMenu(event) {
    event.preventDefault();
    this._input.focus();

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this._updateContextMenuState();
    this._showContextMenu(x, y);
  }

  _handleDocumentPointerDown(event) {
    if (this._contextMenuVisible && this._contextMenu && !this._contextMenu.contains(event.target)) {
      this._hideContextMenu();
    }
  }

  _handleDocumentKeyDown(event) {
    if (event.key === "Escape") {
      this._hideContextMenu();
      this.dismissCompletion();
    }
  }

  _onKeyDown(event) {
    this._hideContextMenu();

    if (this._completionPopupController.handleKeyEvent(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const cmd = event.ctrlKey || event.metaKey;
    if (cmd && !event.altKey) {
      const key = (event.key || "").toLowerCase();
      if (key === "c") {
        void this._copySelectionToClipboard(false);
        event.preventDefault();
        return;
      }
      if (key === "x") {
        void this._copySelectionToClipboard(true);
        event.preventDefault();
        return;
      }
      if (key === " ") {
        this.triggerCompletion();
        event.preventDefault();
        return;
      }
    }

    if (this._isComposing || event.isComposing || event.key === "Process" || (event.keyCode === 229 && event.key.length === 1)) {
      return;
    }

    const mods = this._modifiers(event);
    const keyCode = this._mapKeyCode(event);
    if (!keyCode) {
      return;
    }

    const result = this._core.handleKeyEvent({ key_code: keyCode, text: "", modifiers: mods });
    if (result && (result.handled ?? result.Handled)) {
      this._handleKeyEventResult(result);
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      const edit = this._core.call("backspace");
      this._handleTextEditResult(edit);
      event.preventDefault();
      return;
    }

    if (event.key === "Delete") {
      const edit = this._core.call("deleteForward");
      this._handleTextEditResult(edit);
      event.preventDefault();
    }
  }

  _dispatchGesture(type, points, domEvent, wheelX = 0, wheelY = 0, directScale = 1.0) {
    const pointVector = new this._wasm.PointFVector();
    points.forEach((p) => pointVector.push_back({ x: p.x, y: p.y }));

    const result = this._core.handleGestureEvent({
      type,
      points: pointVector,
      modifiers: this._modifiers(domEvent),
      wheel_delta_x: wheelX,
      wheel_delta_y: wheelY,
      direct_scale: directScale,
    });

    if (typeof pointVector.delete === "function") {
      pointVector.delete();
    }

    const gestureType = toInt(result?.type, 0);
    if (gestureType === this._gestureType.SCROLL || gestureType === this._gestureType.FAST_SCROLL) {
      this._decorationProviderManager.onScrollChanged();
      this.dismissCompletion();
    } else if (gestureType === this._gestureType.TAP) {
      this.dismissCompletion();
    }

    if (result && result.needs_edge_scroll) {
      this._startEdgeScroll();
    } else {
      this._stopEdgeScroll();
    }
  }

  _startEdgeScroll() {
    if (this._edgeTimer) return;
    this._edgeTimer = setInterval(() => {
      const result = this._core.tickEdgeScroll();
      if (result && result.needs_edge_scroll) {
        this._decorationProviderManager.onScrollChanged();
      } else {
        this._stopEdgeScroll();
      }
    }, 16);
  }

  _stopEdgeScroll() {
    if (!this._edgeTimer) return;
    clearInterval(this._edgeTimer);
    this._edgeTimer = null;
  }

  _modifiers(event) {
    let mods = 0;
    if (event.shiftKey) mods |= this._modifier.SHIFT;
    if (event.ctrlKey) mods |= this._modifier.CTRL;
    if (event.altKey) mods |= this._modifier.ALT;
    if (event.metaKey) mods |= this._modifier.META;
    return mods;
  }

  _mapKeyCode(event) {
    switch (event.key) {
      case "Backspace": return this._keyCode.BACKSPACE;
      case "Tab": return this._keyCode.TAB;
      case "Enter": return this._keyCode.ENTER;
      case "Escape": return this._keyCode.ESCAPE;
      case "Delete": return this._keyCode.DELETE_KEY;
      case "ArrowLeft": return this._keyCode.LEFT;
      case "ArrowUp": return this._keyCode.UP;
      case "ArrowRight": return this._keyCode.RIGHT;
      case "ArrowDown": return this._keyCode.DOWN;
      case "Home": return this._keyCode.HOME;
      case "End": return this._keyCode.END;
      case "PageUp": return this._keyCode.PAGE_UP;
      case "PageDown": return this._keyCode.PAGE_DOWN;
      default:
        break;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.length === 1) {
      const upper = event.key.toUpperCase();
      if (this._keyCode[upper]) {
        return this._keyCode[upper];
      }
    }
    return 0;
  }

  _eventPoint(event) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  _syncInputAnchor(model, viewportWidth, viewportHeight) {
    if (!this._input) return;

    let cursorX = 0;
    let cursorY = 0;
    let cursorH = 18;
    const nativeCore = typeof this._core.getNative === "function" ? this._core.getNative() : null;
    if (nativeCore && typeof nativeCore.getCursorScreenRect === "function") {
      try {
        const rect = nativeCore.getCursorScreenRect();
        if (rect) {
          cursorX = Number(rect.x) || 0;
          cursorY = Number(rect.y) || 0;
          cursorH = Math.max(12, Number(rect.height) || 18);
        }
      } catch (_) {
        // ignore
      }
    }

    if (model && model.cursor && model.cursor.position) {
      if (cursorX === 0 && cursorY === 0) {
        cursorX = Number(model.cursor.position.x) || 0;
        cursorY = Number(model.cursor.position.y) || 0;
        cursorH = Math.max(12, Number(model.cursor.height) || 18);
      }
    }

    const width = Math.max(2, viewportWidth || 2);
    const height = Math.max(cursorH, viewportHeight || cursorH);
    const clampedX = Math.max(0, Math.min(width - 2, cursorX));
    const clampedY = Math.max(0, Math.min((viewportHeight || height) - cursorH, cursorY));

    this._input.style.left = `${clampedX}px`;
    this._input.style.top = `${clampedY}px`;
    this._input.style.height = `${cursorH}px`;
    this._input.style.lineHeight = `${cursorH}px`;
    this._input.style.fontSize = `${Math.max(12, Math.round(cursorH * 0.8))}px`;

    this._completionPopupController.updateCursorPosition(clampedX, clampedY, cursorH);
  }

  _resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.floor(rect.width * dpr));
    const targetHeight = Math.max(1, Math.floor(rect.height * dpr));

    if (
      this._canvas.width === targetWidth
      && this._canvas.height === targetHeight
      && this._viewportWidth === rect.width
      && this._viewportHeight === rect.height
    ) {
      return;
    }

    this._canvas.width = targetWidth;
    this._canvas.height = targetHeight;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._viewportWidth = rect.width;
    this._viewportHeight = rect.height;
    this._syncInputAnchor(null, rect.width, rect.height);
    this._core.setViewport(rect.width, rect.height);
  }
  _markDirty() {
    if (this._disposed) return;
    this._dirty = true;
    this._requestRender();
  }

  _requestRender() {
    if (this._disposed || this._rafHandle) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = 0;
      if (this._disposed || !this._dirty) return;

      this._dirty = false;
      try {
        const rect = this.container.getBoundingClientRect();
        const model = this._core.buildRenderModel();
        this._lastRenderModel = model;
        this._syncInputAnchor(model, rect.width, rect.height);
        this._renderer.render(this._ctx, model, rect.width, rect.height);
      } catch (error) {
        if (!this._renderErrorLogged) {
          console.error("SweetEditorWidget render error:", error);
          this._renderErrorLogged = true;
        }
      }

      if (this._dirty) {
        this._requestRender();
      }
    });
  }

  _safeBuildRenderModel() {
    try {
      return this._core.buildRenderModel();
    } catch (_) {
      return null;
    }
  }

  _refreshRenderModelSnapshot() {
    const model = this._safeBuildRenderModel();
    if (model) {
      this._lastRenderModel = model;
    }
    return model;
  }

  _updateCompletionPopupCursorAnchor() {
    const model = this._lastRenderModel || this._safeBuildRenderModel();
    if (!model || !model.cursor || !model.cursor.position) {
      return;
    }

    this._completionPopupController.updateCursorPosition(
      Number(model.cursor.position.x) || 0,
      Number(model.cursor.position.y) || 0,
      Math.max(12, Number(model.cursor.height) || 18),
    );
  }

  _buildCompletionContext(triggerKind, triggerCharacter) {
    const cursor = this._core.getCursorPosition();
    if (!cursor) {
      return null;
    }

    const line = toInt(cursor.line, 0);
    const lineText = this._document ? (this._document.getLineText(line) || "") : "";
    const wordRange = this._core.getWordRangeAtCursor() || {
      start: { line, column: toInt(cursor.column, 0) },
      end: { line, column: toInt(cursor.column, 0) },
    };

    return new CompletionContext({
      triggerKind,
      triggerCharacter,
      cursorPosition: cursor,
      lineText,
      wordRange,
      languageConfiguration: this._languageConfiguration,
      editorMetadata: this._metadata,
    });
  }

  _applyCompletionItem(item) {
    const completionItem = item instanceof CompletionItem ? item : new CompletionItem(item || {});
    let text = completionItem.insertText ?? completionItem.label;
    let replaceRange = null;

    if (completionItem.textEdit) {
      replaceRange = completionItem.textEdit.range;
      text = completionItem.textEdit.newText;
    } else {
      const wr = this._core.getWordRangeAtCursor();
      if (wr && !this._isEmptyRange(wr)) {
        replaceRange = wr;
      }
    }

    if (replaceRange) {
      const deleteResult = this._core.call("deleteText", replaceRange);
      this._handleTextEditResult(deleteResult);
    }

    let insertResult = null;
    if (completionItem.insertTextFormat === CompletionItem.INSERT_TEXT_FORMAT_SNIPPET) {
      insertResult = this._core.call("insertSnippet", text);
    } else {
      insertResult = this._core.call("insertText", text);
    }
    this._handleTextEditResult(insertResult);
  }

  _isEmptyRange(range) {
    if (!range || !range.start || !range.end) {
      return true;
    }
    return range.start.line === range.end.line && range.start.column === range.end.column;
  }

  _handleKeyEventResult(result) {
    if (!result) {
      return;
    }

    const contentChanged = Boolean(result.content_changed ?? result.contentChanged ?? false);
    if (!contentChanged) {
      return;
    }

    const editResult = result.edit_result ?? result.editResult ?? null;
    if (editResult) {
      this._handleTextEditResult(editResult);
      return;
    }

    this._decorationProviderManager.onTextChanged([]);
    if (this._completionPopupController.isShowing) {
      this._completionProviderManager.triggerCompletion(CompletionTriggerKind.RETRIGGER, null);
    }
  }

  _handleTextEditResult(editResult) {
    if (!editResult) {
      return;
    }

    const changed = Boolean(editResult.changed ?? false);
    const changes = asArray(editResult.changes);

    if (!changed && changes.length === 0) {
      return;
    }

    this._decorationProviderManager.onTextChanged(changes);
    this._triggerCompletionFromTextChanges(changes);
  }

  _triggerCompletionFromTextChanges(changes) {
    if (!this._completionProviderManager) {
      return;
    }

    if (this._core.isInLinkedEditing()) {
      return;
    }

    if (!changes || changes.length === 0) {
      if (this._completionPopupController.isShowing) {
        this._completionProviderManager.triggerCompletion(CompletionTriggerKind.RETRIGGER, null);
      }
      return;
    }

    const primary = changes[0] || {};
    const newText = String(primary.new_text ?? primary.newText ?? "");

    if (newText.length === 1) {
      const ch = newText;
      if (this._completionProviderManager.isTriggerCharacter(ch)) {
        this._completionProviderManager.triggerCompletion(CompletionTriggerKind.CHARACTER, ch);
      } else if (this._completionPopupController.isShowing) {
        this._completionProviderManager.triggerCompletion(CompletionTriggerKind.RETRIGGER, null);
      } else if (/^[A-Za-z0-9_]$/.test(ch)) {
        this._completionProviderManager.triggerCompletion(CompletionTriggerKind.INVOKED, null);
      }
      return;
    }

    if (this._completionPopupController.isShowing) {
      this._completionProviderManager.triggerCompletion(CompletionTriggerKind.RETRIGGER, null);
    }
  }

  _applyMergedDecorations(merged, visibleRange) {
    const startLine = toInt(visibleRange?.startLine, 0);
    const endLine = toInt(visibleRange?.endLine, -1);

    this._core.beginBatch();
    try {
      this._applySpanMode(this._spanLayer.SYNTAX, merged.syntaxSpansMode, startLine, endLine);
      this._applySpanMode(this._spanLayer.SEMANTIC, merged.semanticSpansMode, startLine, endLine);
      this._core.setBatchLineSpans(this._spanLayer.SYNTAX, merged.syntaxSpans);
      this._core.setBatchLineSpans(this._spanLayer.SEMANTIC, merged.semanticSpans);

      this._applyInlayMode(merged.inlayHintsMode, startLine, endLine);
      this._core.setBatchLineInlayHints(merged.inlayHints);

      this._applyDiagnosticMode(merged.diagnosticsMode, startLine, endLine);
      this._core.setBatchLineDiagnostics(merged.diagnostics);

      this._applyGutterMode(merged.gutterIconsMode, startLine, endLine);
      this._core.setBatchLineGutterIcons(merged.gutterIcons);

      this._applyPhantomMode(merged.phantomTextsMode, startLine, endLine);
      this._core.setBatchLinePhantomTexts(merged.phantomTexts);

      if (merged.indentGuidesMode === DecorationApplyMode.REPLACE_ALL || merged.indentGuidesMode === DecorationApplyMode.REPLACE_RANGE) {
        this._core.setIndentGuides(merged.indentGuides || []);
      } else if (merged.indentGuides) {
        this._core.setIndentGuides(merged.indentGuides);
      }

      if (merged.bracketGuidesMode === DecorationApplyMode.REPLACE_ALL || merged.bracketGuidesMode === DecorationApplyMode.REPLACE_RANGE) {
        this._core.setBracketGuides(merged.bracketGuides || []);
      } else if (merged.bracketGuides) {
        this._core.setBracketGuides(merged.bracketGuides);
      }

      if (merged.flowGuidesMode === DecorationApplyMode.REPLACE_ALL || merged.flowGuidesMode === DecorationApplyMode.REPLACE_RANGE) {
        this._core.setFlowGuides(merged.flowGuides || []);
      } else if (merged.flowGuides) {
        this._core.setFlowGuides(merged.flowGuides);
      }

      if (merged.separatorGuidesMode === DecorationApplyMode.REPLACE_ALL || merged.separatorGuidesMode === DecorationApplyMode.REPLACE_RANGE) {
        this._core.setSeparatorGuides(merged.separatorGuides || []);
      } else if (merged.separatorGuides) {
        this._core.setSeparatorGuides(merged.separatorGuides);
      }

      if (merged.foldRegionsMode === DecorationApplyMode.REPLACE_ALL || merged.foldRegionsMode === DecorationApplyMode.REPLACE_RANGE) {
        this._core.setFoldRegions(merged.foldRegions || []);
      } else if (merged.foldRegions && merged.foldRegions.length > 0) {
        this._core.setFoldRegions(merged.foldRegions);
      }
    } finally {
      this._core.endBatch();
    }
  }

  _applySpanMode(layer, mode, startLine, endLine) {
    if (mode === DecorationApplyMode.REPLACE_ALL) {
      this._core.clearHighlights(layer);
      return;
    }
    if (mode === DecorationApplyMode.REPLACE_RANGE) {
      this._core.setBatchLineSpans(layer, this._buildEmptyLineMap(startLine, endLine));
    }
  }

  _applyInlayMode(mode, startLine, endLine) {
    if (mode === DecorationApplyMode.REPLACE_ALL) {
      this._core.clearInlayHints();
      return;
    }
    if (mode === DecorationApplyMode.REPLACE_RANGE) {
      this._core.setBatchLineInlayHints(this._buildEmptyLineMap(startLine, endLine));
    }
  }

  _applyDiagnosticMode(mode, startLine, endLine) {
    if (mode === DecorationApplyMode.REPLACE_ALL) {
      this._core.clearDiagnostics();
      return;
    }
    if (mode === DecorationApplyMode.REPLACE_RANGE) {
      this._core.setBatchLineDiagnostics(this._buildEmptyLineMap(startLine, endLine));
    }
  }

  _applyGutterMode(mode, startLine, endLine) {
    if (mode === DecorationApplyMode.REPLACE_ALL) {
      this._core.clearGutterIcons();
      return;
    }
    if (mode === DecorationApplyMode.REPLACE_RANGE) {
      this._core.setBatchLineGutterIcons(this._buildEmptyLineMap(startLine, endLine));
    }
  }

  _applyPhantomMode(mode, startLine, endLine) {
    if (mode === DecorationApplyMode.REPLACE_ALL) {
      this._core.clearPhantomTexts();
      return;
    }
    if (mode === DecorationApplyMode.REPLACE_RANGE) {
      this._core.setBatchLinePhantomTexts(this._buildEmptyLineMap(startLine, endLine));
    }
  }

  _buildEmptyLineMap(startLine, endLine) {
    const out = new Map();
    if (endLine < startLine) {
      return out;
    }
    for (let line = startLine; line <= endLine; line += 1) {
      out.set(line, []);
    }
    return out;
  }

  _applyLanguageBracketPairs() {
    const rawPairs = asArray(this._languageConfiguration?.bracketPairs);
    if (rawPairs.length === 0) {
      return;
    }

    const pairs = [];
    rawPairs.forEach((pair) => {
      const openText = String(pair.open ?? "");
      const closeText = String(pair.close ?? "");
      if (!openText || !closeText) {
        return;
      }

      const open = openText.codePointAt(0);
      const close = closeText.codePointAt(0);
      if (!Number.isFinite(open) || !Number.isFinite(close)) {
        return;
      }

      pairs.push({
        open,
        close,
        autoClose: pair.autoClose ?? pair.auto_close ?? true,
        surround: pair.surround ?? true,
      });
    });

    if (pairs.length > 0) {
      this._core.setBracketPairs(pairs);
    }
  }

  _createContextMenu() {
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.zIndex = "32";
    menu.style.minWidth = "156px";
    menu.style.padding = "4px";
    menu.style.borderRadius = "8px";
    menu.style.border = "1px solid rgba(255,255,255,0.12)";
    menu.style.background = "#1f2937";
    menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.35)";
    menu.style.userSelect = "none";
    menu.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
    menu.style.fontSize = "13px";
    menu.style.pointerEvents = "auto";

    const entries = ["undo", "redo", "-", "cut", "copy", "paste", "-", "selectAll"];
    entries.forEach((entry) => {
      if (entry === "-") {
        const separator = document.createElement("div");
        separator.style.height = "1px";
        separator.style.margin = "4px 6px";
        separator.style.background = "rgba(255,255,255,0.16)";
        menu.appendChild(separator);
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = entry;
      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.border = "none";
      button.style.background = "transparent";
      button.style.color = "#f3f4f6";
      button.style.padding = "7px 10px";
      button.style.borderRadius = "6px";
      button.style.cursor = "pointer";
      button.style.font = "inherit";
      button.addEventListener("mouseenter", () => {
        if (!button.disabled) {
          button.style.background = "rgba(255,255,255,0.12)";
        }
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "transparent";
      });
      button.addEventListener("click", async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        await this._runContextAction(entry);
        this._hideContextMenu();
        this._input.focus();
      });
      menu.appendChild(button);
      this._contextMenuButtons[entry] = button;
    });

    this._contextMenu = menu;
    this.container.appendChild(menu);
    this._refreshContextMenuLabels();
  }

  _refreshContextMenuLabels() {
    if (!this._contextMenuButtons) return;
    const labels = this._i18n || CONTEXT_MENU_I18N.en;
    Object.entries(this._contextMenuButtons).forEach(([key, button]) => {
      button.textContent = labels[key] || key;
    });
  }

  _setContextMenuItemDisabled(action, disabled) {
    const button = this._contextMenuButtons[action];
    if (!button) return;
    button.disabled = !!disabled;
    button.style.opacity = disabled ? "0.45" : "1";
    button.style.cursor = disabled ? "not-allowed" : "pointer";
  }

  _updateContextMenuState() {
    let canUndo = false;
    let canRedo = false;
    let hasSelection = false;
    try {
      canUndo = !!this._core.canUndo();
      canRedo = !!this._core.canRedo();
      hasSelection = !!this._core.hasSelection();
    } catch (_) {
      // ignore
    }

    this._setContextMenuItemDisabled("undo", !canUndo);
    this._setContextMenuItemDisabled("redo", !canRedo);
    this._setContextMenuItemDisabled("cut", !hasSelection);
    this._setContextMenuItemDisabled("copy", !hasSelection);
    const canReadClipboard = typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText;
    this._setContextMenuItemDisabled("paste", !canReadClipboard);
  }

  _showContextMenu(x, y) {
    if (!this._contextMenu) return;
    const containerRect = this.container.getBoundingClientRect();
    const menu = this._contextMenu;
    menu.style.display = "block";
    menu.style.visibility = "hidden";

    const menuWidth = menu.offsetWidth || 160;
    const menuHeight = menu.offsetHeight || 180;
    const clampedX = Math.max(4, Math.min(x, containerRect.width - menuWidth - 4));
    const clampedY = Math.max(4, Math.min(y, containerRect.height - menuHeight - 4));

    menu.style.left = `${clampedX}px`;
    menu.style.top = `${clampedY}px`;
    menu.style.visibility = "visible";
    this._contextMenuVisible = true;
  }

  _hideContextMenu() {
    if (!this._contextMenu) return;
    this._contextMenu.style.display = "none";
    this._contextMenuVisible = false;
  }

  async _runContextAction(action) {
    switch (action) {
      case "undo": {
        const result = this._core.call("undo");
        this._handleTextEditResult(result);
        break;
      }
      case "redo": {
        const result = this._core.call("redo");
        this._handleTextEditResult(result);
        break;
      }
      case "selectAll":
        this._core.call("selectAll");
        break;
      case "copy":
        await this._copySelectionToClipboard(false);
        break;
      case "cut":
        await this._copySelectionToClipboard(true);
        break;
      case "paste": {
        const text = await this._readClipboardText();
        if (text) {
          const result = this._core.call("insertText", text);
          this._handleTextEditResult(result);
        }
        break;
      }
      default:
        break;
    }
  }

  async _copySelectionToClipboard(isCut) {
    if (!this._core.hasSelection()) return;
    const selectedText = this._core.read("getSelectedText") || "";
    if (!selectedText) return;

    const copied = await this._writeClipboardText(selectedText);
    if (isCut && copied) {
      const selection = this._core.getSelection();
      if (selection) {
        const result = this._core.call("deleteText", selection);
        this._handleTextEditResult(result);
      }
    }
  }

  async _writeClipboardText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        // fall through
      }
    }

    try {
      const previous = this._input.value;
      this._input.value = text;
      this._input.focus();
      this._input.select();
      const ok = document.execCommand("copy");
      this._input.value = previous || "";
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  async _readClipboardText() {
    if (!(typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText)) {
      return "";
    }
    try {
      return await navigator.clipboard.readText();
    } catch (_) {
      return "";
    }
  }

  _handleClipboardCopyCut(event, isCut) {
    if (!this._core.hasSelection()) {
      return;
    }

    const selectedText = this._core.read("getSelectedText") || "";
    if (!selectedText) {
      return;
    }

    if (event.clipboardData && event.clipboardData.setData) {
      event.clipboardData.setData("text/plain", selectedText);
      event.preventDefault();
      if (isCut) {
        const selection = this._core.getSelection();
        if (selection) {
          const result = this._core.call("deleteText", selection);
          this._handleTextEditResult(result);
        }
      }
      return;
    }

    void this._copySelectionToClipboard(isCut);
    event.preventDefault();
  }

  _handleClipboardPaste(event) {
    if (!event.clipboardData || !event.clipboardData.getData) {
      return;
    }
    const text = event.clipboardData.getData("text/plain") || "";
    if (!text) {
      return;
    }

    const result = this._core.call("insertText", text);
    this._handleTextEditResult(result);
    event.preventDefault();
  }
}
