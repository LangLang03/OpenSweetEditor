import { VisualRunType, FoldState, GuideStyle, CurrentLineRenderMode, } from '../types/EditorTypes';
export const defaultTheme = {
    background: '#1e1e1e',
    currentLine: '#282828',
    currentLineBorder: '#3e3e3e',
    selection: 'rgba(38, 79, 120, 0.8)',
    cursor: '#ffffff',
    lineNumber: '#858585',
    lineNumberSplit: '#3e3e3e',
    defaultText: '#d4d4d4',
    whitespace: '#5a5a5a',
    inlayHintBackground: 'rgba(50, 50, 50, 0.8)',
    inlayHintText: '#808080',
    foldPlaceholder: '#569cd6',
    guideIndent: 'rgba(60, 60, 60, 0.5)',
    guideBracket: 'rgba(100, 100, 100, 0.5)',
    guideFlow: 'rgba(80, 120, 80, 0.5)',
    guideSeparator: 'rgba(120, 80, 80, 0.5)',
    diagnosticError: '#f44747',
    diagnosticWarning: '#dcdcaa',
    diagnosticInfo: '#75beff',
    diagnosticHint: '#75beff',
    scrollbarTrack: 'rgba(100, 100, 100, 0.2)',
    scrollbarThumb: 'rgba(100, 100, 100, 0.5)',
    bracketHighlight: 'rgba(255, 255, 255, 0.2)',
    linkedEditing: 'rgba(255, 255, 255, 0.1)',
    linkedEditingActive: 'rgba(255, 255, 255, 0.2)',
    compositionUnderline: '#ffffff',
};
export class CanvasRenderer {
    constructor(canvas, editor, theme = defaultTheme, fontFamily = 'Menlo, Monaco, "Courier New", monospace', fontSize = 14) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.editor = editor;
        this.theme = theme;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.setupCanvas();
    }
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.devicePixelRatio;
        this.canvas.height = rect.height * this.devicePixelRatio;
        this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }
    setTheme(theme) {
        this.theme = { ...this.theme, ...theme };
    }
    setFont(fontFamily, fontSize) {
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
    }
    render() {
        const model = this.editor.buildRenderModel();
        if (!model)
            return;
        const ctx = this.ctx;
        const rect = this.canvas.getBoundingClientRect();
        ctx.fillStyle = this.theme.background;
        ctx.fillRect(0, 0, rect.width, rect.height);
        this.renderCurrentLine(model);
        this.renderSelectionRects(model);
        this.renderLinkedEditingRects(model);
        this.renderBracketHighlightRects(model);
        this.renderGuideSegments(model);
        this.renderLines(model);
        this.renderDiagnostics(model);
        this.renderCompositionDecoration(model);
        this.renderCursor(model);
        this.renderLineNumberSplit(model);
        this.renderLineNumbers(model);
        this.renderGutterIcons(model);
        this.renderFoldMarkers(model);
        this.renderScrollbars(model);
    }
    renderCurrentLine(model) {
        if (model.currentLineRenderMode === CurrentLineRenderMode.NONE)
            return;
        const ctx = this.ctx;
        const lineHeight = model.cursor.height;
        const y = model.currentLine.y;
        if (model.currentLineRenderMode === CurrentLineRenderMode.BACKGROUND) {
            ctx.fillStyle = this.theme.currentLine;
            ctx.fillRect(0, y, model.viewportWidth, lineHeight);
        }
        else if (model.currentLineRenderMode === CurrentLineRenderMode.BORDER) {
            ctx.strokeStyle = this.theme.currentLineBorder;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(model.viewportWidth, y);
            ctx.moveTo(0, y + lineHeight);
            ctx.lineTo(model.viewportWidth, y + lineHeight);
            ctx.stroke();
        }
    }
    renderSelectionRects(model) {
        const ctx = this.ctx;
        ctx.fillStyle = this.theme.selection;
        for (const rect of model.selectionRects) {
            ctx.fillRect(rect.origin.x, rect.origin.y, rect.width, rect.height);
        }
    }
    renderLinkedEditingRects(model) {
        const ctx = this.ctx;
        for (const rect of model.linkedEditingRects) {
            ctx.fillStyle = rect.isActive ? this.theme.linkedEditingActive : this.theme.linkedEditing;
            ctx.fillRect(rect.origin.x, rect.origin.y, rect.width, rect.height);
        }
    }
    renderBracketHighlightRects(model) {
        const ctx = this.ctx;
        ctx.fillStyle = this.theme.bracketHighlight;
        for (const rect of model.bracketHighlightRects) {
            ctx.fillRect(rect.origin.x, rect.origin.y, rect.width, rect.height);
        }
    }
    renderGuideSegments(model) {
        const ctx = this.ctx;
        for (const segment of model.guideSegments) {
            ctx.strokeStyle = this.getGuideColor(segment.type);
            ctx.lineWidth = 1;
            if (segment.style === GuideStyle.DASHED) {
                ctx.setLineDash([4, 4]);
            }
            else {
                ctx.setLineDash([]);
            }
            ctx.beginPath();
            ctx.moveTo(segment.start.x, segment.start.y);
            ctx.lineTo(segment.end.x, segment.end.y);
            if (segment.arrowEnd) {
                const dx = segment.end.x - segment.start.x;
                const dy = segment.end.y - segment.start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    const ux = dx / len;
                    const uy = dy / len;
                    const arrowSize = 6;
                    ctx.moveTo(segment.end.x, segment.end.y);
                    ctx.lineTo(segment.end.x - arrowSize * (ux + uy * 0.5), segment.end.y - arrowSize * (uy - ux * 0.5));
                    ctx.moveTo(segment.end.x, segment.end.y);
                    ctx.lineTo(segment.end.x - arrowSize * (ux - uy * 0.5), segment.end.y - arrowSize * (uy + ux * 0.5));
                }
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    getGuideColor(type) {
        switch (type) {
            case 0: return this.theme.guideIndent;
            case 1: return this.theme.guideBracket;
            case 2: return this.theme.guideFlow;
            case 3: return this.theme.guideSeparator;
            default: return this.theme.guideIndent;
        }
    }
    renderLines(model) {
        const ctx = this.ctx;
        for (const line of model.lines) {
            this.renderLine(ctx, line);
        }
    }
    renderLine(ctx, line) {
        for (const run of line.runs) {
            this.renderRun(ctx, run);
        }
    }
    renderRun(ctx, run) {
        switch (run.type) {
            case VisualRunType.TEXT:
                this.renderTextRun(ctx, run);
                break;
            case VisualRunType.WHITESPACE:
                this.renderWhitespaceRun(ctx, run);
                break;
            case VisualRunType.NEWLINE:
                break;
            case VisualRunType.INLAY_HINT:
                this.renderInlayHintRun(ctx, run);
                break;
            case VisualRunType.PHANTOM_TEXT:
                this.renderPhantomTextRun(ctx, run);
                break;
            case VisualRunType.FOLD_PLACEHOLDER:
                this.renderFoldPlaceholderRun(ctx, run);
                break;
        }
    }
    renderTextRun(ctx, run) {
        ctx.font = this.getFont(run.style.fontStyle);
        ctx.fillStyle = this.getColor(run.style.color) || this.theme.defaultText;
        ctx.textBaseline = 'top';
        ctx.fillText(run.text, run.x, run.y);
        if (run.style.backgroundColor !== 0) {
            ctx.fillStyle = this.getColor(run.style.backgroundColor);
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillRect(run.x, run.y, run.width, run.width > 0 ? run.width : ctx.measureText(run.text).width);
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    renderWhitespaceRun(ctx, run) {
        ctx.font = this.getFont(0);
        ctx.fillStyle = this.theme.whitespace;
        ctx.textBaseline = 'top';
        ctx.fillText(run.text, run.x, run.y);
    }
    renderInlayHintRun(ctx, run) {
        if (run.text) {
            const padding = run.padding || 2;
            const margin = run.margin || 2;
            ctx.fillStyle = this.theme.inlayHintBackground;
            ctx.fillRect(run.x - padding - margin, run.y, run.width + padding * 2 + margin * 2, run.width > 0 ? run.width : 16);
            ctx.font = `${this.fontSize - 2}px italic ${this.fontFamily}`;
            ctx.fillStyle = this.theme.inlayHintText;
            ctx.textBaseline = 'top';
            ctx.fillText(run.text, run.x, run.y + 1);
        }
        else if (run.iconId !== 0) {
            this.renderIcon(ctx, run.x, run.y, run.iconId, run.width, run.width > 0 ? run.width : 16);
        }
    }
    renderPhantomTextRun(ctx, run) {
        ctx.font = this.getFont(run.style.fontStyle);
        ctx.fillStyle = this.getColor(run.style.color) || 'rgba(150, 150, 150, 0.5)';
        ctx.textBaseline = 'top';
        ctx.fillText(run.text, run.x, run.y);
    }
    renderFoldPlaceholderRun(ctx, run) {
        ctx.fillStyle = this.theme.foldPlaceholder;
        ctx.fillRect(run.x, run.y, run.width, run.width > 0 ? run.width : 16);
        ctx.font = this.getFont(0);
        ctx.fillStyle = this.theme.background;
        ctx.textBaseline = 'top';
        ctx.fillText('...', run.x + 2, run.y + 1);
    }
    renderIcon(ctx, x, y, _iconId, width, height) {
        ctx.fillStyle = this.theme.defaultText;
        ctx.fillRect(x, y, width || 16, height || 16);
    }
    renderDiagnostics(model) {
        const ctx = this.ctx;
        for (const diag of model.diagnosticDecorations) {
            ctx.strokeStyle = this.getDiagnosticColor(diag.severity);
            ctx.lineWidth = 2;
            const wavyHeight = 3;
            const amplitude = 2;
            const frequency = 8;
            ctx.beginPath();
            for (let i = 0; i < diag.width; i++) {
                const x = diag.origin.x + i;
                const y = diag.origin.y + diag.height + wavyHeight + Math.sin(i / frequency) * amplitude;
                if (i === 0) {
                    ctx.moveTo(x, y);
                }
                else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }
    getDiagnosticColor(severity) {
        switch (severity) {
            case 0: return this.theme.diagnosticError;
            case 1: return this.theme.diagnosticWarning;
            case 2: return this.theme.diagnosticInfo;
            case 3: return this.theme.diagnosticHint;
            default: return this.theme.diagnosticError;
        }
    }
    renderCompositionDecoration(model) {
        if (!model.compositionDecoration.active)
            return;
        const ctx = this.ctx;
        const deco = model.compositionDecoration;
        ctx.strokeStyle = this.theme.compositionUnderline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(deco.origin.x, deco.origin.y + deco.height - 2);
        ctx.lineTo(deco.origin.x + deco.width, deco.origin.y + deco.height - 2);
        ctx.stroke();
    }
    renderCursor(model) {
        if (!model.cursor.visible)
            return;
        const ctx = this.ctx;
        const cursor = model.cursor;
        ctx.fillStyle = this.theme.cursor;
        ctx.fillRect(cursor.position.x, cursor.position.y, 2, cursor.height);
    }
    renderLineNumberSplit(model) {
        if (!model.splitLineVisible)
            return;
        const ctx = this.ctx;
        ctx.strokeStyle = this.theme.lineNumberSplit;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(model.splitX, 0);
        ctx.lineTo(model.splitX, model.viewportHeight);
        ctx.stroke();
    }
    renderLineNumbers(model) {
        const ctx = this.ctx;
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.theme.lineNumber;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        const renderedLines = new Set();
        for (const line of model.lines) {
            if (!renderedLines.has(line.logicalLine)) {
                const lineNum = (line.logicalLine + 1).toString();
                ctx.fillText(lineNum, line.lineNumberPosition.x, line.lineNumberPosition.y);
                renderedLines.add(line.logicalLine);
            }
        }
        ctx.textAlign = 'left';
    }
    renderGutterIcons(model) {
        const ctx = this.ctx;
        for (const icon of model.gutterIcons) {
            this.renderIcon(ctx, icon.origin.x, icon.origin.y, icon.iconId, icon.width, icon.height);
        }
    }
    renderFoldMarkers(model) {
        const ctx = this.ctx;
        for (const marker of model.foldMarkers) {
            const size = Math.min(marker.width, marker.height) * 0.6;
            const cx = marker.origin.x + marker.width / 2;
            const cy = marker.origin.y + marker.height / 2;
            ctx.strokeStyle = this.theme.lineNumber;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (marker.foldState === FoldState.EXPANDED) {
                ctx.moveTo(cx - size / 2, cy - size / 4);
                ctx.lineTo(cx, cy + size / 4);
                ctx.lineTo(cx + size / 2, cy - size / 4);
            }
            else {
                ctx.moveTo(cx - size / 4, cy - size / 2);
                ctx.lineTo(cx + size / 4, cy);
                ctx.lineTo(cx - size / 4, cy + size / 2);
            }
            ctx.stroke();
        }
    }
    renderScrollbars(model) {
        const ctx = this.ctx;
        if (model.verticalScrollbar.visible) {
            const vs = model.verticalScrollbar;
            ctx.globalAlpha = vs.alpha;
            ctx.fillStyle = this.theme.scrollbarTrack;
            ctx.fillRect(vs.track.origin.x, vs.track.origin.y, vs.track.width, vs.track.height);
            ctx.fillStyle = this.theme.scrollbarThumb;
            ctx.fillRect(vs.thumb.origin.x, vs.thumb.origin.y, vs.thumb.width, vs.thumb.height);
        }
        if (model.horizontalScrollbar.visible) {
            const hs = model.horizontalScrollbar;
            ctx.globalAlpha = hs.alpha;
            ctx.fillStyle = this.theme.scrollbarTrack;
            ctx.fillRect(hs.track.origin.x, hs.track.origin.y, hs.track.width, hs.track.height);
            ctx.fillStyle = this.theme.scrollbarThumb;
            ctx.fillRect(hs.thumb.origin.x, hs.thumb.origin.y, hs.thumb.width, hs.thumb.height);
        }
        ctx.globalAlpha = 1;
    }
    getFont(fontStyle) {
        let style = '';
        if (fontStyle & 1)
            style += 'bold ';
        if (fontStyle & 2)
            style += 'italic ';
        if (fontStyle & 4)
            style += 'line-through ';
        return `${style}${this.fontSize}px ${this.fontFamily}`;
    }
    getColor(argb) {
        if (argb === 0)
            return '';
        const a = ((argb >> 24) & 0xff) / 255;
        const r = (argb >> 16) & 0xff;
        const g = (argb >> 8) & 0xff;
        const b = argb & 0xff;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}
//# sourceMappingURL=CanvasRenderer.js.map