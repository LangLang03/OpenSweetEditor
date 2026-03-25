import { Document } from './Document';
import { ProtocolDecoder } from './ProtocolDecoder';
import { ProtocolEncoder } from './ProtocolEncoder';
import {
    EditorOptions,
    TextMeasurer,
    EditorRenderModel,
    GestureResult,
    LayoutMetrics,
    ScrollMetrics,
    SelectionInfo,
    PositionRect,
    EventType,
    Modifier,
    WrapMode,
    FoldArrowMode,
    CurrentLineRenderMode,
    AutoIndentMode,
    ScrollBehavior,
} from './types/EditorTypes';

export interface SweetEditorModule {
    createDocumentFromUtf8(text: string): number;
    createDocumentFromFile(path: string): number;
    freeDocument(handle: number): void;
    getDocumentText(handle: number): string;
    getDocumentLineCount(handle: number): number;
    getDocumentLineText(handle: number, line: number): string;

    createEditor(measurer: TextMeasurer, optionsData: number, optionsSize: number): number;
    freeEditor(handle: number): void;
    setEditorDocument(editorHandle: number, docHandle: number): void;

    setEditorViewport(handle: number, width: number, height: number): void;
    editorOnFontMetricsChanged(handle: number): void;
    editorSetFoldArrowMode(handle: number, mode: number): void;
    editorSetWrapMode(handle: number, mode: number): void;
    editorSetScale(handle: number, scale: number): void;
    editorSetLineSpacing(handle: number, add: number, mult: number): void;
    editorSetContentStartPadding(handle: number, padding: number): void;
    editorSetShowSplitLine(handle: number, show: number): void;
    editorSetCurrentLineRenderMode(handle: number, mode: number): void;

    buildEditorRenderModel(handle: number): Uint8Array | null;
    getLayoutMetrics(handle: number): Uint8Array | null;

    handleEditorGestureEvent(handle: number, type: number, points: Float32Array): Uint8Array | null;
    handleEditorGestureEventEx(
        handle: number,
        type: number,
        points: Float32Array,
        modifiers: number,
        wheelDeltaX: number,
        wheelDeltaY: number,
        directScale: number
    ): Uint8Array | null;
    editorTickEdgeScroll(handle: number): Uint8Array | null;
    handleEditorKeyEvent(handle: number, keyCode: number, text: string, modifiers: number): Uint8Array | null;

    editorInsertText(handle: number, text: string): Uint8Array | null;
    editorReplaceText(
        handle: number,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number,
        text: string
    ): Uint8Array | null;
    editorDeleteText(
        handle: number,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number
    ): Uint8Array | null;
    editorBackspace(handle: number): Uint8Array | null;
    editorDeleteForward(handle: number): Uint8Array | null;

    editorMoveLineUp(handle: number): Uint8Array | null;
    editorMoveLineDown(handle: number): Uint8Array | null;
    editorCopyLineUp(handle: number): Uint8Array | null;
    editorCopyLineDown(handle: number): Uint8Array | null;
    editorDeleteLine(handle: number): Uint8Array | null;
    editorInsertLineAbove(handle: number): Uint8Array | null;
    editorInsertLineBelow(handle: number): Uint8Array | null;

    editorUndo(handle: number): Uint8Array | null;
    editorRedo(handle: number): Uint8Array | null;
    editorCanUndo(handle: number): number;
    editorCanRedo(handle: number): number;

    editorSetCursorPosition(handle: number, line: number, column: number): void;
    editorGetCursorPosition(handle: number): { line: number; column: number };
    editorSelectAll(handle: number): void;
    editorSetSelection(
        handle: number,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number
    ): void;
    editorGetSelection(handle: number): SelectionInfo;
    editorGetSelectedText(handle: number): string;
    editorGetWordRangeAtCursor(handle: number): {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    editorGetWordAtCursor(handle: number): string;

    editorMoveCursorLeft(handle: number, extendSelection: number): void;
    editorMoveCursorRight(handle: number, extendSelection: number): void;
    editorMoveCursorUp(handle: number, extendSelection: number): void;
    editorMoveCursorDown(handle: number, extendSelection: number): void;
    editorMoveCursorToLineStart(handle: number, extendSelection: number): void;
    editorMoveCursorToLineEnd(handle: number, extendSelection: number): void;

    editorCompositionStart(handle: number): void;
    editorCompositionUpdate(handle: number, text: string): void;
    editorCompositionEnd(handle: number, committedText: string): Uint8Array | null;
    editorCompositionCancel(handle: number): void;
    editorIsComposing(handle: number): number;
    editorSetCompositionEnabled(handle: number, enabled: number): void;
    editorIsCompositionEnabled(handle: number): number;

    editorSetReadOnly(handle: number, readOnly: number): void;
    editorIsReadOnly(handle: number): number;

    editorSetAutoIndentMode(handle: number, mode: number): void;
    editorGetAutoIndentMode(handle: number): number;

    editorSetHandleConfig(
        handle: number,
        startLeft: number,
        startTop: number,
        startRight: number,
        startBottom: number,
        endLeft: number,
        endTop: number,
        endRight: number,
        endBottom: number
    ): void;
    editorSetScrollbarConfig(
        handle: number,
        thickness: number,
        minThumb: number,
        thumbHitPadding: number,
        mode: number,
        thumbDraggable: number,
        trackTapMode: number,
        fadeDelayMs: number,
        fadeDurationMs: number
    ): void;

    editorGetPositionRect(handle: number, line: number, column: number): PositionRect;
    editorGetCursorRect(handle: number): PositionRect;

    editorScrollToLine(handle: number, line: number, behavior: number): void;
    editorGotoPosition(handle: number, line: number, column: number): void;
    editorSetScroll(handle: number, scrollX: number, scrollY: number): void;
    editorGetScrollMetrics(handle: number): Uint8Array | null;

    editorRegisterTextStyle(handle: number, styleId: number, color: number, backgroundColor: number, fontStyle: number): void;
    editorSetLineSpans(handle: number, data: number, size: number): void;
    editorSetBatchLineSpans(handle: number, data: number, size: number): void;
    editorClearLineSpans(handle: number, line: number, layer: number): void;
    editorClearHighlightsLayer(handle: number, layer: number): void;

    editorSetLineInlayHints(handle: number, data: number, size: number): void;
    editorSetBatchLineInlayHints(handle: number, data: number, size: number): void;
    editorSetLinePhantomTexts(handle: number, data: number, size: number): void;
    editorSetBatchLinePhantomTexts(handle: number, data: number, size: number): void;

    editorSetLineGutterIcons(handle: number, data: number, size: number): void;
    editorSetBatchLineGutterIcons(handle: number, data: number, size: number): void;
    editorSetMaxGutterIcons(handle: number, count: number): void;
    editorClearGutterIcons(handle: number): void;

    editorSetLineDiagnostics(handle: number, data: number, size: number): void;
    editorSetBatchLineDiagnostics(handle: number, data: number, size: number): void;
    editorClearDiagnostics(handle: number): void;

    editorSetIndentGuides(handle: number, data: number, size: number): void;
    editorSetBracketGuides(handle: number, data: number, size: number): void;
    editorSetFlowGuides(handle: number, data: number, size: number): void;
    editorSetSeparatorGuides(handle: number, data: number, size: number): void;
    editorClearGuides(handle: number): void;

    editorSetBracketPairs(handle: number, openChars: Uint32Array, closeChars: Uint32Array): void;
    editorSetMatchedBrackets(
        handle: number,
        openLine: number,
        openCol: number,
        closeLine: number,
        closeCol: number
    ): void;
    editorClearMatchedBrackets(handle: number): void;

    editorSetFoldRegions(handle: number, data: number, size: number): void;
    editorToggleFold(handle: number, line: number): number;
    editorFoldAt(handle: number, line: number): number;
    editorUnfoldAt(handle: number, line: number): number;
    editorFoldAll(handle: number): void;
    editorUnfoldAll(handle: number): void;
    editorIsLineVisible(handle: number, line: number): number;

    editorClearHighlights(handle: number): void;
    editorClearInlayHints(handle: number): void;
    editorClearPhantomTexts(handle: number): void;
    editorClearAllDecorations(handle: number): void;

    editorInsertSnippet(handle: number, snippetTemplate: string): Uint8Array | null;
    editorStartLinkedEditing(handle: number, data: number, size: number): void;
    editorIsInLinkedEditing(handle: number): number;
    editorLinkedEditingNext(handle: number): number;
    editorLinkedEditingPrev(handle: number): number;
    editorCancelLinkedEditing(handle: number): void;

    freeBinaryData(ptr: number): void;
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAPU8: Uint8Array;
    setValue(ptr: number, value: number, type: string): void;
    getValue(ptr: number, type: string): number;
}

export class SweetEditor {
    private module: SweetEditorModule;
    private handle: number;
    private document: Document | null = null;

    private constructor(module: SweetEditorModule, handle: number) {
        this.module = module;
        this.handle = handle;
    }

    static create(options: EditorOptions, measurer: TextMeasurer, wasmModule: any): SweetEditor {
        const module: SweetEditorModule = wasmModule;
        const optionsData = ProtocolEncoder.encodeEditorOptions(options);
        const optionsPtr = module._malloc(optionsData.length);
        module.HEAPU8.set(optionsData, optionsPtr);
        const handle = module.createEditor(measurer, optionsPtr, optionsData.length);
        module._free(optionsPtr);
        return new SweetEditor(module, handle);
    }

    setViewport(width: number, height: number): void {
        this.module.setEditorViewport(this.handle, width, height);
    }

    loadDocument(text: string): void {
        if (this.document) {
            this.document.dispose();
        }
        this.document = Document.createFromText(this.module, text);
        this.module.setEditorDocument(this.handle, this.document.getHandle());
    }

    loadDocumentFile(path: string): boolean {
        if (this.document) {
            this.document.dispose();
        }
        this.document = Document.createFromFile(this.module, path);
        if (!this.document) return false;
        this.module.setEditorDocument(this.handle, this.document.getHandle());
        return true;
    }

    getDocument(): Document | null {
        return this.document;
    }

    onFontMetricsChanged(): void {
        this.module.editorOnFontMetricsChanged(this.handle);
    }

    setFoldArrowMode(mode: FoldArrowMode): void {
        this.module.editorSetFoldArrowMode(this.handle, mode);
    }

    setWrapMode(mode: WrapMode): void {
        this.module.editorSetWrapMode(this.handle, mode);
    }

    setScale(scale: number): void {
        this.module.editorSetScale(this.handle, scale);
    }

    setLineSpacing(add: number, mult: number): void {
        this.module.editorSetLineSpacing(this.handle, add, mult);
    }

    setContentStartPadding(padding: number): void {
        this.module.editorSetContentStartPadding(this.handle, padding);
    }

    setShowSplitLine(show: boolean): void {
        this.module.editorSetShowSplitLine(this.handle, show ? 1 : 0);
    }

    setCurrentLineRenderMode(mode: CurrentLineRenderMode): void {
        this.module.editorSetCurrentLineRenderMode(this.handle, mode);
    }

    buildRenderModel(): EditorRenderModel | null {
        const data = this.module.buildEditorRenderModel(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readEditorRenderModel();
    }

    getLayoutMetrics(): LayoutMetrics | null {
        const data = this.module.getLayoutMetrics(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readLayoutMetrics();
    }

    handleGestureEvent(type: EventType, points: Array<{ x: number; y: number }>): GestureResult | null {
        const pointsArray = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            pointsArray[i * 2] = points[i].x;
            pointsArray[i * 2 + 1] = points[i].y;
        }
        const data = this.module.handleEditorGestureEvent(this.handle, type, pointsArray);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    handleGestureEventEx(
        type: EventType,
        points: Array<{ x: number; y: number }>,
        modifiers: Modifier = Modifier.NONE,
        wheelDeltaX: number = 0,
        wheelDeltaY: number = 0,
        directScale: number = 1
    ): GestureResult | null {
        const pointsArray = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            pointsArray[i * 2] = points[i].x;
            pointsArray[i * 2 + 1] = points[i].y;
        }
        const data = this.module.handleEditorGestureEventEx(
            this.handle,
            type,
            pointsArray,
            modifiers,
            wheelDeltaX,
            wheelDeltaY,
            directScale
        );
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    tickEdgeScroll(): GestureResult | null {
        const data = this.module.editorTickEdgeScroll(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    handleKeyEvent(keyCode: number, text: string | null, modifiers: Modifier): GestureResult | null {
        const data = this.module.handleEditorKeyEvent(this.handle, keyCode, text ?? '', modifiers);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    insertText(text: string): GestureResult | null {
        const data = this.module.editorInsertText(this.handle, text);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    replaceText(
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number,
        text: string
    ): GestureResult | null {
        const data = this.module.editorReplaceText(this.handle, startLine, startColumn, endLine, endColumn, text);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    deleteText(
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number
    ): GestureResult | null {
        const data = this.module.editorDeleteText(this.handle, startLine, startColumn, endLine, endColumn);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    backspace(): GestureResult | null {
        const data = this.module.editorBackspace(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    deleteForward(): GestureResult | null {
        const data = this.module.editorDeleteForward(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    moveLineUp(): GestureResult | null {
        const data = this.module.editorMoveLineUp(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    moveLineDown(): GestureResult | null {
        const data = this.module.editorMoveLineDown(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    copyLineUp(): GestureResult | null {
        const data = this.module.editorCopyLineUp(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    copyLineDown(): GestureResult | null {
        const data = this.module.editorCopyLineDown(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    deleteLine(): GestureResult | null {
        const data = this.module.editorDeleteLine(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    insertLineAbove(): GestureResult | null {
        const data = this.module.editorInsertLineAbove(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    insertLineBelow(): GestureResult | null {
        const data = this.module.editorInsertLineBelow(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    undo(): GestureResult | null {
        const data = this.module.editorUndo(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    redo(): GestureResult | null {
        const data = this.module.editorRedo(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    canUndo(): boolean {
        return this.module.editorCanUndo(this.handle) !== 0;
    }

    canRedo(): boolean {
        return this.module.editorCanRedo(this.handle) !== 0;
    }

    setCursorPosition(line: number, column: number): void {
        this.module.editorSetCursorPosition(this.handle, line, column);
    }

    getCursorPosition(): { line: number; column: number } {
        return this.module.editorGetCursorPosition(this.handle);
    }

    selectAll(): void {
        this.module.editorSelectAll(this.handle);
    }

    setSelection(startLine: number, startColumn: number, endLine: number, endColumn: number): void {
        this.module.editorSetSelection(this.handle, startLine, startColumn, endLine, endColumn);
    }

    getSelection(): SelectionInfo {
        return this.module.editorGetSelection(this.handle);
    }

    getSelectedText(): string {
        return this.module.editorGetSelectedText(this.handle);
    }

    getWordRangeAtCursor(): { startLine: number; startColumn: number; endLine: number; endColumn: number } {
        return this.module.editorGetWordRangeAtCursor(this.handle);
    }

    getWordAtCursor(): string {
        return this.module.editorGetWordAtCursor(this.handle);
    }

    moveCursorLeft(extendSelection: boolean = false): void {
        this.module.editorMoveCursorLeft(this.handle, extendSelection ? 1 : 0);
    }

    moveCursorRight(extendSelection: boolean = false): void {
        this.module.editorMoveCursorRight(this.handle, extendSelection ? 1 : 0);
    }

    moveCursorUp(extendSelection: boolean = false): void {
        this.module.editorMoveCursorUp(this.handle, extendSelection ? 1 : 0);
    }

    moveCursorDown(extendSelection: boolean = false): void {
        this.module.editorMoveCursorDown(this.handle, extendSelection ? 1 : 0);
    }

    moveCursorToLineStart(extendSelection: boolean = false): void {
        this.module.editorMoveCursorToLineStart(this.handle, extendSelection ? 1 : 0);
    }

    moveCursorToLineEnd(extendSelection: boolean = false): void {
        this.module.editorMoveCursorToLineEnd(this.handle, extendSelection ? 1 : 0);
    }

    compositionStart(): void {
        this.module.editorCompositionStart(this.handle);
    }

    compositionUpdate(text: string): void {
        this.module.editorCompositionUpdate(this.handle, text);
    }

    compositionEnd(committedText: string): GestureResult | null {
        const data = this.module.editorCompositionEnd(this.handle, committedText);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readGestureResult();
    }

    compositionCancel(): void {
        this.module.editorCompositionCancel(this.handle);
    }

    isComposing(): boolean {
        return this.module.editorIsComposing(this.handle) !== 0;
    }

    setCompositionEnabled(enabled: boolean): void {
        this.module.editorSetCompositionEnabled(this.handle, enabled ? 1 : 0);
    }

    isCompositionEnabled(): boolean {
        return this.module.editorIsCompositionEnabled(this.handle) !== 0;
    }

    setReadOnly(readOnly: boolean): void {
        this.module.editorSetReadOnly(this.handle, readOnly ? 1 : 0);
    }

    isReadOnly(): boolean {
        return this.module.editorIsReadOnly(this.handle) !== 0;
    }

    setAutoIndentMode(mode: AutoIndentMode): void {
        this.module.editorSetAutoIndentMode(this.handle, mode);
    }

    getAutoIndentMode(): AutoIndentMode {
        return this.module.editorGetAutoIndentMode(this.handle);
    }

    scrollToLine(line: number, behavior: ScrollBehavior = ScrollBehavior.CENTER): void {
        this.module.editorScrollToLine(this.handle, line, behavior);
    }

    gotoPosition(line: number, column: number): void {
        this.module.editorGotoPosition(this.handle, line, column);
    }

    setScroll(scrollX: number, scrollY: number): void {
        this.module.editorSetScroll(this.handle, scrollX, scrollY);
    }

    getScrollMetrics(): ScrollMetrics | null {
        const data = this.module.editorGetScrollMetrics(this.handle);
        if (!data) return null;
        const decoder = new ProtocolDecoder(data);
        return decoder.readScrollMetrics();
    }

    getPositionRect(line: number, column: number): PositionRect {
        return this.module.editorGetPositionRect(this.handle, line, column);
    }

    getCursorRect(): PositionRect {
        return this.module.editorGetCursorRect(this.handle);
    }

    registerTextStyle(styleId: number, color: number, backgroundColor: number, fontStyle: number): void {
        this.module.editorRegisterTextStyle(this.handle, styleId, color, backgroundColor, fontStyle);
    }

    toggleFold(line: number): boolean {
        return this.module.editorToggleFold(this.handle, line) !== 0;
    }

    foldAt(line: number): boolean {
        return this.module.editorFoldAt(this.handle, line) !== 0;
    }

    unfoldAt(line: number): boolean {
        return this.module.editorUnfoldAt(this.handle, line) !== 0;
    }

    foldAll(): void {
        this.module.editorFoldAll(this.handle);
    }

    unfoldAll(): void {
        this.module.editorUnfoldAll(this.handle);
    }

    isLineVisible(line: number): boolean {
        return this.module.editorIsLineVisible(this.handle, line) !== 0;
    }

    clearHighlights(): void {
        this.module.editorClearHighlights(this.handle);
    }

    clearInlayHints(): void {
        this.module.editorClearInlayHints(this.handle);
    }

    clearPhantomTexts(): void {
        this.module.editorClearPhantomTexts(this.handle);
    }

    clearAllDecorations(): void {
        this.module.editorClearAllDecorations(this.handle);
    }

    dispose(): void {
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
