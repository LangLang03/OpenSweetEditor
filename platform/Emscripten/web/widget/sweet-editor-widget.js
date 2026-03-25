import { DocumentFactory } from "../core/document.js";
import { WebEditorCore } from "../core/web-editor-core.js";
import { Canvas2DRenderer } from "./canvas2d-renderer.js";

const EventType = {
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

const KeyCode = {
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

const Modifier = {
  SHIFT: 1,
  CTRL: 2,
  ALT: 4,
  META: 8,
};

export class SweetEditorWidget {
  constructor(container, wasmModule, options = {}) {
    this.container = container;
    this._wasm = wasmModule;
    this._options = options;
    this._renderer = new Canvas2DRenderer(options.theme || {});
    this._core = new WebEditorCore(wasmModule, this._renderer.createTextMeasurerCallbacks(), options.editorOptions || {});
    this._documentFactory = new DocumentFactory(wasmModule);
    this._activeTouches = new Map();
    this._edgeTimer = null;
    this._rafHandle = 0;
    this._dirty = false;
    this._renderErrorLogged = false;
    this._disposed = false;
    this._viewportWidth = 0;
    this._viewportHeight = 0;

    this._setupDom();
    this._bindEvents();
    this._resize();

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
    this._input.style.width = "1px";
    this._input.style.height = "1px";
    this._input.style.opacity = "0";
    this._input.style.pointerEvents = "none";
    this.container.appendChild(this._input);

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.container);
  }

  _bindEvents() {
    this._canvas.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    this._canvas.addEventListener("pointermove", (e) => this._onPointerMove(e));
    this._canvas.addEventListener("pointerup", (e) => this._onPointerUp(e));
    this._canvas.addEventListener("pointercancel", (e) => this._onPointerCancel(e));
    this._canvas.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
    this._canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this._input.addEventListener("keydown", (e) => this._onKeyDown(e));
    this._input.addEventListener("compositionstart", () => {
      this._core.call("compositionStart");
      this._markDirty();
    });
    this._input.addEventListener("compositionupdate", (e) => {
      this._core.call("compositionUpdate", e.data || "");
      this._markDirty();
    });
    this._input.addEventListener("compositionend", (e) => {
      this._core.call("compositionEnd", e.data || "");
      this._markDirty();
      this._input.value = "";
    });
    this._input.addEventListener("input", () => {
      if (this._input.value) {
        this._core.call("insertText", this._input.value);
        this._input.value = "";
        this._markDirty();
      }
    });
  }

  _onPointerDown(event) {
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
      const type = event.button === 2 ? EventType.MOUSE_RIGHT_DOWN : EventType.MOUSE_DOWN;
      this._dispatchGesture(type, [point], event);
      event.preventDefault();
      return;
    }

    this._activeTouches.set(event.pointerId, point);
    const type = this._activeTouches.size === 1 ? EventType.TOUCH_DOWN : EventType.TOUCH_POINTER_DOWN;
    this._dispatchGesture(type, Array.from(this._activeTouches.values()), event);
    event.preventDefault();
  }

  _onPointerMove(event) {
    const point = this._eventPoint(event);
    if (event.pointerType === "mouse") {
      if ((event.buttons & 1) !== 0) {
        this._dispatchGesture(EventType.MOUSE_MOVE, [point], event);
      }
      return;
    }

    if (!this._activeTouches.has(event.pointerId)) return;
    this._activeTouches.set(event.pointerId, point);
    this._dispatchGesture(EventType.TOUCH_MOVE, Array.from(this._activeTouches.values()), event);
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
      this._dispatchGesture(EventType.MOUSE_UP, [point], event);
      return;
    }

    if (!this._activeTouches.has(event.pointerId)) return;
    const type = this._activeTouches.size > 1 ? EventType.TOUCH_POINTER_UP : EventType.TOUCH_UP;
    this._dispatchGesture(type, Array.from(this._activeTouches.values()), event);
    this._activeTouches.delete(event.pointerId);
    event.preventDefault();
  }

  _onPointerCancel(event) {
    if (event.pointerType !== "mouse") {
      this._dispatchGesture(EventType.TOUCH_CANCEL, Array.from(this._activeTouches.values()), event);
      this._activeTouches.delete(event.pointerId);
      event.preventDefault();
    }
  }

  _onWheel(event) {
    const point = this._eventPoint(event);
    this._dispatchGesture(EventType.MOUSE_WHEEL, [point], event, event.deltaX, event.deltaY, 1.0);
    event.preventDefault();
  }

  _onKeyDown(event) {
    const mods = this._modifiers(event);

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this._core.call("insertText", event.key);
      this._markDirty();
      event.preventDefault();
      return;
    }

    const keyCode = this._mapKeyCode(event);
    if (!keyCode) return;

    const result = this._core.handleKeyEvent({ key_code: keyCode, text: "", modifiers: mods });
    if (result && result.handled) {
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
    if (event.shiftKey) mods |= Modifier.SHIFT;
    if (event.ctrlKey) mods |= Modifier.CTRL;
    if (event.altKey) mods |= Modifier.ALT;
    if (event.metaKey) mods |= Modifier.META;
    return mods;
  }

  _mapKeyCode(event) {
    switch (event.key) {
      case "Backspace": return KeyCode.BACKSPACE;
      case "Tab": return KeyCode.TAB;
      case "Enter": return KeyCode.ENTER;
      case "Escape": return KeyCode.ESCAPE;
      case "Delete": return KeyCode.DELETE_KEY;
      case "ArrowLeft": return KeyCode.LEFT;
      case "ArrowUp": return KeyCode.UP;
      case "ArrowRight": return KeyCode.RIGHT;
      case "ArrowDown": return KeyCode.DOWN;
      case "Home": return KeyCode.HOME;
      case "End": return KeyCode.END;
      case "PageUp": return KeyCode.PAGE_UP;
      case "PageDown": return KeyCode.PAGE_DOWN;
      default:
        break;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.length === 1) {
      const upper = event.key.toUpperCase();
      if (KeyCode[upper]) {
        return KeyCode[upper];
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
