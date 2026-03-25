import { Document } from './Document.js';
import { ProtocolDecoder } from './ProtocolDecoder.js';
import { ProtocolEncoder } from './ProtocolEncoder.js';
import { Modifier, ScrollBehavior, } from './types/EditorTypes.js';
export class SweetEditor {
    constructor(module, handle) {
        this.document = null;
        this.module = module;
        this.handle = handle;
    }
    static create(options, measurer, wasmModule) {
        const module = wasmModule;
        const optionsData = ProtocolEncoder.encodeEditorOptions(options);
        const optionsPtr = module._malloc(optionsData.length);
        module.HEAPU8.set(optionsData, optionsPtr);
        const handle = module.createEditor(measurer, optionsPtr, optionsData.length);
        module._free(optionsPtr);
        return new SweetEditor(module, handle);
    }
    setViewport(width, height) {
        this.module.setEditorViewport(this.handle, width, height);
    }
    loadDocument(text) {
        if (this.document) {
            this.document.dispose();
        }
        this.document = Document.createFromText(this.module, text);
        this.module.setEditorDocument(this.handle, this.document.getHandle());
    }
    loadDocumentFile(path) {
        if (this.document) {
            this.document.dispose();
        }
        this.document = Document.createFromFile(this.module, path);
        if (!this.document)
            return false;
        this.module.setEditorDocument(this.handle, this.document.getHandle());
        return true;
    }
    getDocument() {
        return this.document;
    }
    onFontMetricsChanged() {
        this.module.editorOnFontMetricsChanged(this.handle);
    }
    setFoldArrowMode(mode) {
        this.module.editorSetFoldArrowMode(this.handle, mode);
    }
    setWrapMode(mode) {
        this.module.editorSetWrapMode(this.handle, mode);
    }
    setScale(scale) {
        this.module.editorSetScale(this.handle, scale);
    }
    setLineSpacing(add, mult) {
        this.module.editorSetLineSpacing(this.handle, add, mult);
    }
    setContentStartPadding(padding) {
        this.module.editorSetContentStartPadding(this.handle, padding);
    }
    setShowSplitLine(show) {
        this.module.editorSetShowSplitLine(this.handle, show ? 1 : 0);
    }
    setCurrentLineRenderMode(mode) {
        this.module.editorSetCurrentLineRenderMode(this.handle, mode);
    }
    buildRenderModel() {
        const data = this.module.buildEditorRenderModel(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readEditorRenderModel();
    }
    getLayoutMetrics() {
        const data = this.module.getLayoutMetrics(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readLayoutMetrics();
    }
    handleGestureEvent(type, points) {
        const pointsArray = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            pointsArray[i * 2] = points[i].x;
            pointsArray[i * 2 + 1] = points[i].y;
        }
        const data = this.module.handleEditorGestureEvent(this.handle, type, pointsArray);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    handleGestureEventEx(type, points, modifiers = Modifier.NONE, wheelDeltaX = 0, wheelDeltaY = 0, directScale = 1) {
        const pointsArray = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            pointsArray[i * 2] = points[i].x;
            pointsArray[i * 2 + 1] = points[i].y;
        }
        const data = this.module.handleEditorGestureEventEx(this.handle, type, pointsArray, modifiers, wheelDeltaX, wheelDeltaY, directScale);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    tickEdgeScroll() {
        const data = this.module.editorTickEdgeScroll(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    handleKeyEvent(keyCode, text, modifiers) {
        const data = this.module.handleEditorKeyEvent(this.handle, keyCode, text ?? '', modifiers);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    insertText(text) {
        const data = this.module.editorInsertText(this.handle, text);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    replaceText(startLine, startColumn, endLine, endColumn, text) {
        const data = this.module.editorReplaceText(this.handle, startLine, startColumn, endLine, endColumn, text);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    deleteText(startLine, startColumn, endLine, endColumn) {
        const data = this.module.editorDeleteText(this.handle, startLine, startColumn, endLine, endColumn);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    backspace() {
        const data = this.module.editorBackspace(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    deleteForward() {
        const data = this.module.editorDeleteForward(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    moveLineUp() {
        const data = this.module.editorMoveLineUp(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    moveLineDown() {
        const data = this.module.editorMoveLineDown(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    copyLineUp() {
        const data = this.module.editorCopyLineUp(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    copyLineDown() {
        const data = this.module.editorCopyLineDown(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    deleteLine() {
        const data = this.module.editorDeleteLine(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    insertLineAbove() {
        const data = this.module.editorInsertLineAbove(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    insertLineBelow() {
        const data = this.module.editorInsertLineBelow(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    undo() {
        const data = this.module.editorUndo(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    redo() {
        const data = this.module.editorRedo(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    canUndo() {
        return this.module.editorCanUndo(this.handle) !== 0;
    }
    canRedo() {
        return this.module.editorCanRedo(this.handle) !== 0;
    }
    setCursorPosition(line, column) {
        this.module.editorSetCursorPosition(this.handle, line, column);
    }
    getCursorPosition() {
        return this.module.editorGetCursorPosition(this.handle);
    }
    selectAll() {
        this.module.editorSelectAll(this.handle);
    }
    setSelection(startLine, startColumn, endLine, endColumn) {
        this.module.editorSetSelection(this.handle, startLine, startColumn, endLine, endColumn);
    }
    getSelection() {
        return this.module.editorGetSelection(this.handle);
    }
    getSelectedText() {
        return this.module.editorGetSelectedText(this.handle);
    }
    getWordRangeAtCursor() {
        return this.module.editorGetWordRangeAtCursor(this.handle);
    }
    getWordAtCursor() {
        return this.module.editorGetWordAtCursor(this.handle);
    }
    moveCursorLeft(extendSelection = false) {
        this.module.editorMoveCursorLeft(this.handle, extendSelection ? 1 : 0);
    }
    moveCursorRight(extendSelection = false) {
        this.module.editorMoveCursorRight(this.handle, extendSelection ? 1 : 0);
    }
    moveCursorUp(extendSelection = false) {
        this.module.editorMoveCursorUp(this.handle, extendSelection ? 1 : 0);
    }
    moveCursorDown(extendSelection = false) {
        this.module.editorMoveCursorDown(this.handle, extendSelection ? 1 : 0);
    }
    moveCursorToLineStart(extendSelection = false) {
        this.module.editorMoveCursorToLineStart(this.handle, extendSelection ? 1 : 0);
    }
    moveCursorToLineEnd(extendSelection = false) {
        this.module.editorMoveCursorToLineEnd(this.handle, extendSelection ? 1 : 0);
    }
    compositionStart() {
        this.module.editorCompositionStart(this.handle);
    }
    compositionUpdate(text) {
        this.module.editorCompositionUpdate(this.handle, text);
    }
    compositionEnd(committedText) {
        const data = this.module.editorCompositionEnd(this.handle, committedText);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }
    compositionCancel() {
        this.module.editorCompositionCancel(this.handle);
    }
    isComposing() {
        return this.module.editorIsComposing(this.handle) !== 0;
    }
    setCompositionEnabled(enabled) {
        this.module.editorSetCompositionEnabled(this.handle, enabled ? 1 : 0);
    }
    isCompositionEnabled() {
        return this.module.editorIsCompositionEnabled(this.handle) !== 0;
    }
    setReadOnly(readOnly) {
        this.module.editorSetReadOnly(this.handle, readOnly ? 1 : 0);
    }
    isReadOnly() {
        return this.module.editorIsReadOnly(this.handle) !== 0;
    }
    setAutoIndentMode(mode) {
        this.module.editorSetAutoIndentMode(this.handle, mode);
    }
    getAutoIndentMode() {
        return this.module.editorGetAutoIndentMode(this.handle);
    }
    scrollToLine(line, behavior = ScrollBehavior.CENTER) {
        this.module.editorScrollToLine(this.handle, line, behavior);
    }
    gotoPosition(line, column) {
        this.module.editorGotoPosition(this.handle, line, column);
    }
    setScroll(scrollX, scrollY) {
        this.module.editorSetScroll(this.handle, scrollX, scrollY);
    }
    getScrollMetrics() {
        const data = this.module.editorGetScrollMetrics(this.handle);
        if (!data)
            return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readScrollMetrics();
    }
    getPositionRect(line, column) {
        return this.module.editorGetPositionRect(this.handle, line, column);
    }
    getCursorRect() {
        return this.module.editorGetCursorRect(this.handle);
    }
    registerTextStyle(styleId, color, backgroundColor, fontStyle) {
        this.module.editorRegisterTextStyle(this.handle, styleId, color, backgroundColor, fontStyle);
    }
    toggleFold(line) {
        return this.module.editorToggleFold(this.handle, line) !== 0;
    }
    foldAt(line) {
        return this.module.editorFoldAt(this.handle, line) !== 0;
    }
    unfoldAt(line) {
        return this.module.editorUnfoldAt(this.handle, line) !== 0;
    }
    foldAll() {
        this.module.editorFoldAll(this.handle);
    }
    unfoldAll() {
        this.module.editorUnfoldAll(this.handle);
    }
    isLineVisible(line) {
        return this.module.editorIsLineVisible(this.handle, line) !== 0;
    }
    clearHighlights() {
        this.module.editorClearHighlights(this.handle);
    }
    clearInlayHints() {
        this.module.editorClearInlayHints(this.handle);
    }
    clearPhantomTexts() {
        this.module.editorClearPhantomTexts(this.handle);
    }
    clearAllDecorations() {
        this.module.editorClearAllDecorations(this.handle);
    }
    dispose() {
        if (this.document) {
            this.document.dispose();
            this.document = null;
        }
        if (this.handle !== 0) {
            this.module.freeEditor(this.handle);
            this.handle = 0;
        }
    }
}
//# sourceMappingURL=SweetEditor.js.map