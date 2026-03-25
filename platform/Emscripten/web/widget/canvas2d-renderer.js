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

function forVector(vec, fn) {
  if (!vec || typeof vec.size !== "function") return;
  const size = vec.size();
  for (let i = 0; i < size; i += 1) {
    fn(vec.get(i), i);
  }
}

export class Canvas2DRenderer {
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

export { forVector };
