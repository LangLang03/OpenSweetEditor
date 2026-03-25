import { DocumentFactory } from "../core/document.js";
import { WebEditorCore } from "../core/web-editor-core.js";
import { Canvas2DRenderer } from "./canvas2d-renderer.js";

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

function resolveEnum(moduleObj, enumName, fallback) {
  const enumObj = moduleObj && moduleObj[enumName];
  if (!enumObj || typeof enumObj !== "object") {
    return fallback;
  }
  const resolved = { ...fallback };
  Object.keys(fallback).forEach((key) => {
    if (!(key in enumObj)) return;
    const value = Number(enumObj[key]);
    if (Number.isFinite(value)) {
      resolved[key] = value;
    }
  });
  return resolved;
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

export class SweetEditorWidget {
  constructor(container, wasmModule, options = {}) {
    this.container = container;
    this._wasm = wasmModule;
    this._options = options;
    this._locale = resolveLocale(options.locale || (typeof navigator !== "undefined" ? navigator.language : "en"));
    this._i18n = CONTEXT_MENU_I18N[this._locale];
    this._eventType = resolveEnum(wasmModule, "EventType", FALLBACK_EVENT_TYPE);
    this._keyCode = resolveEnum(wasmModule, "KeyCode", FALLBACK_KEY_CODE);
    this._modifier = resolveEnum(wasmModule, "Modifier", FALLBACK_MODIFIER);
    this._renderer = new Canvas2DRenderer(options.theme || {});
    this._core = new WebEditorCore(
      wasmModule,
      this._renderer.createTextMeasurerCallbacks(),
      options.editorOptions || {},
      () => this._markDirty(),
    );
    this._documentFactory = new DocumentFactory(wasmModule);
    this._activeTouches = new Map();
    this._edgeTimer = null;
    this._rafHandle = 0;
    this._dirty = false;
    this._renderErrorLogged = false;
    this._disposed = false;
    this._viewportWidth = 0;
    this._viewportHeight = 0;
    this._isComposing = false;
    this._compositionCommitPending = false;
    this._compositionEndFallbackData = "";
    this._compositionEndTimer = 0;
    this._contextMenuVisible = false;
    this._contextMenuButtons = {};
    this._onDocumentPointerDown = (event) => this._handleDocumentPointerDown(event);
    this._onDocumentKeyDown = (event) => this._handleDocumentKeyDown(event);
    this._onWindowBlur = () => this._hideContextMenu();

    this._setupDom();
    this._bindEvents();
    this._resize();
    this._core.call("setCompositionEnabled", options.enableComposition ?? true);

    if (options.text) {
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

  loadText(text, options = {}) {
    if (this._document) {
      this._document.dispose();
    }
    this._document = this._documentFactory.fromText(text, options);
    this._core.loadDocument(this._document);
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
    this._canvas.remove();
    this._input.remove();
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
      this._markDirty();
    });
    this._input.addEventListener("compositionupdate", (e) => {
      const composingText = (typeof e.data === "string") ? e.data : (this._input.value || "");
      this._core.call("compositionUpdate", composingText);
      this._markDirty();
    });
    this._input.addEventListener("compositionend", (e) => {
      this._isComposing = false;
      this._compositionCommitPending = true;
      this._compositionEndFallbackData = (typeof e.data === "string") ? e.data : "";
      this._input.value = "";
      this._compositionEndTimer = setTimeout(() => {
        this._compositionEndTimer = 0;
        if (!this._compositionCommitPending) {
          return;
        }
        this._compositionCommitPending = false;
        const fallbackCommit = this._compositionEndFallbackData;
        this._compositionEndFallbackData = "";
        if (fallbackCommit) {
          this._core.call("compositionEnd", fallbackCommit);
        } else {
          this._core.call("compositionCancel");
        }
        this._markDirty();
      }, 0);
    });
    this._input.addEventListener("input", (e) => {
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
          this._core.call("compositionEnd", committedText);
          this._markDirty();
        }
        this._input.value = "";
        return;
      }

      if (this._isComposing || e.isComposing || inputType.startsWith("insertComposition") || inputType.startsWith("deleteComposition")) {
        return;
      }

      if (inputType === "deleteContentBackward") {
        this._core.call("backspace");
        this._input.value = "";
        this._markDirty();
        return;
      }
      if (inputType === "deleteContentForward") {
        this._core.call("deleteForward");
        this._input.value = "";
        this._markDirty();
        return;
      }

      const text = (typeof e.data === "string" && e.data.length > 0) ? e.data : (this._input.value || "");
      this._input.value = "";
      if (!text) return;
      this._core.call("insertText", text);
      this._markDirty();
    });
    this._input.addEventListener("copy", (e) => this._handleClipboardCopyCut(e, false));
    this._input.addEventListener("cut", (e) => this._handleClipboardCopyCut(e, true));
    this._input.addEventListener("paste", (e) => this._handleClipboardPaste(e));

    document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
    document.addEventListener("keydown", this._onDocumentKeyDown, true);
    window.addEventListener("blur", this._onWindowBlur);
  }

  _onPointerDown(event) {
    this._hideContextMenu();
    this._input.focus();
    if (typeof this._canvas.setPointerCapture === "function") {
      try {
        this._canvas.setPointerCapture(event.pointerId);
      } catch (_) {
        // Ignore capture failures on browsers/devtools modes that do not support it.
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
        // Ignore release failures for non-captured pointers.
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
    this._dispatchGesture(this._eventType.MOUSE_WHEEL, [point], event, event.deltaX, event.deltaY, 1.0);
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
    if (!this._contextMenuVisible || !this._contextMenu) return;
    if (this._contextMenu.contains(event.target)) return;
    this._hideContextMenu();
  }

  _handleDocumentKeyDown(event) {
    if (event.key === "Escape") {
      this._hideContextMenu();
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
      canUndo = !!this._core.call("canUndo");
      canRedo = !!this._core.call("canRedo");
      hasSelection = !!this._core.call("hasSelection");
    } catch (_) {
      // Ignore and keep defaults.
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
      case "undo":
        this._core.call("undo");
        break;
      case "redo":
        this._core.call("redo");
        break;
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
          this._core.call("insertText", text);
        }
        break;
      }
      default:
        break;
    }
  }

  async _copySelectionToClipboard(isCut) {
    if (!this._core.call("hasSelection")) return;
    const selectedText = this._core.call("getSelectedText") || "";
    if (!selectedText) return;
    const copied = await this._writeClipboardText(selectedText);
    if (isCut && copied) {
      const selection = this._core.call("getSelection");
      if (selection) {
        this._core.call("deleteText", selection);
      }
    }
  }

  async _writeClipboardText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        // Fall through to legacy path.
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
    if (!this._core.call("hasSelection")) {
      return;
    }

    const selectedText = this._core.call("getSelectedText") || "";
    if (!selectedText) {
      return;
    }

    if (event.clipboardData && event.clipboardData.setData) {
      event.clipboardData.setData("text/plain", selectedText);
      event.preventDefault();
      if (isCut) {
        const selection = this._core.call("getSelection");
        if (selection) {
          this._core.call("deleteText", selection);
          this._markDirty();
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
    this._core.call("insertText", text);
    this._markDirty();
    event.preventDefault();
  }

  _onKeyDown(event) {
    this._hideContextMenu();
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
    }

    if (this._isComposing || event.isComposing || event.key === "Process" || (event.keyCode === 229 && event.key.length === 1)) {
      return;
    }

    const mods = this._modifiers(event);

    const keyCode = this._mapKeyCode(event);
    if (!keyCode) return;

    const result = this._core.handleKeyEvent({ key_code: keyCode, text: "", modifiers: mods });
    if (result && result.handled) {
      this._markDirty();
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      this._core.call("backspace");
      this._markDirty();
      event.preventDefault();
      return;
    }

    if (event.key === "Delete") {
      this._core.call("deleteForward");
      this._markDirty();
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

    pointVector.delete();
    this._markDirty();

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
      this._markDirty();
      if (!result || !result.needs_edge_scroll) {
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
        // Keep fallback values when native rect read fails.
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
    this._markDirty();
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
}
