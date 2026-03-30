# Web SDK v2 Full API Reference (100% Coverage)

This document uses `platform/Emscripten/sdk/packages/*/dist/*.d.ts` as the single source of truth and mirrors public declarations file-by-file for full API coverage.

- Scope: `@sweeteditor/sdk`, `@sweeteditor/core`, `@sweeteditor/widget`, `@sweeteditor/providers-sweetline`
- Sync rule: run `pnpm -r build` and then `pnpm docs:api`; declaration changes mean API changes
- Note: members prefixed with `_` are legacy/internal surface from historical bridge code; prefer high-level APIs in `@sweeteditor/sdk` for stable integration

## Package Versions
- `@sweeteditor/sdk@0.0.1`
- `@sweeteditor/providers-sweetline@0.0.1`
- `@sweeteditor/widget@0.0.1`
- `@sweeteditor/core@0.0.1`

## Contents
- [@sweeteditor/sdk](#sweeteditorsdk)
- [@sweeteditor/providers-sweetline](#sweeteditorproviders-sweetline)
- [@sweeteditor/widget](#sweeteditorwidget)
- [@sweeteditor/core](#sweeteditorcore)

## @sweeteditor/sdk
Version: `0.0.1`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/sdk/dist/index.d.ts`

```ts
export { createEditor, createModel, getBundledSyntaxPath, getBundledWasmModulePath } from "./editor/editor-instance.js";
export type { ICompletionContext, ICompletionItem, ICompletionList, ICompletionProvider, ICreateEditorOptions, IDecorationProvider, IEditor, IWasmOptions, } from "./types.js";
export { CompletionItem, CompletionResult, CompletionTriggerKind, DecorationApplyMode, countLogicalLines, DecorationProviderCallMode, DecorationResult, DecorationResultDispatchMode, DecorationTextChangeMode, DisposableStore, normalizeNewlines, toDisposable, type IDisposable, type ITextModel, } from "@sweeteditor/core";
```

### `platform/Emscripten/sdk/packages/sdk/dist/editor/editor-instance.d.ts`

```ts
import { type IAnyRecord, type ISweetEditorWasmModule, type ITextModel } from "@sweeteditor/core";
import { SweetEditorWidget } from "@sweeteditor/widget";
import type { ICreateEditorOptions, IEditor } from "../types.js";
interface ICreateEditorOverrides {
    createWidget?: (container: HTMLElement, wasmModule: ISweetEditorWasmModule, options: IAnyRecord) => SweetEditorWidget;
    loadWasm?: (options: ICreateEditorOptions["wasm"]) => Promise<ISweetEditorWasmModule>;
}
export declare function getBundledWasmModulePath(): string;
export declare function getBundledSyntaxPath(name: string): string;
export declare function createModel(text: string, options?: {
    uri?: string;
    language?: string;
}): ITextModel;
export declare function createEditor(container: HTMLElement, options?: ICreateEditorOptions, overrides?: ICreateEditorOverrides): Promise<IEditor>;
export {};
```

### `platform/Emscripten/sdk/packages/sdk/dist/types.d.ts`

```ts
import type { IAnyRecord, IDisposable, ISweetEditorWasmModule, ITextModel } from "@sweeteditor/core";
import type { SweetEditorWidget } from "@sweeteditor/widget";
export interface ICompletionContext {
    readonly triggerKind: number;
    readonly triggerCharacter: string | null;
    readonly cursorPosition: {
        line: number;
        column: number;
    } | null;
    readonly word: string;
}
export interface ICompletionItem {
    label: string;
    insertText?: string;
    detail?: string;
    documentation?: string;
    kind?: number;
    sortKey?: string;
    filterText?: string;
    insertTextFormat?: number;
}
export interface ICompletionList {
    items: ICompletionItem[];
    isIncomplete?: boolean;
}
export interface ICompletionProvider {
    triggerCharacters?: string[];
    provideCompletions(context: ICompletionContext, model: ITextModel): Promise<ICompletionList | ICompletionItem[] | null | undefined> | ICompletionList | ICompletionItem[] | null | undefined;
}
export interface IDecorationProvider {
    capabilities?: IAnyRecord;
    provideDecorations(context: IAnyRecord, model: ITextModel): Promise<IAnyRecord | null | void> | IAnyRecord | null | void;
}
export interface ILegacyDecorationProvider {
    getCapabilities?: () => IAnyRecord | number;
    provideDecorations?: (context: IAnyRecord, receiver: {
        accept: (result: IAnyRecord) => void;
    }) => void | Promise<void>;
}
export interface IWasmOptions {
    module?: ISweetEditorWasmModule;
    modulePath?: string;
    moduleFactory?: (options?: IAnyRecord) => Promise<ISweetEditorWasmModule> | ISweetEditorWasmModule;
    moduleOptions?: IAnyRecord;
}
export interface ICreateEditorOptions {
    wasm?: IWasmOptions;
    locale?: string;
    theme?: IAnyRecord;
    model?: ITextModel;
    value?: string;
    language?: string;
    uri?: string;
    decorationOptions?: IAnyRecord;
    performanceOverlay?: boolean | IAnyRecord;
    widgetOptions?: IAnyRecord;
}
export interface IEditor {
    getValue(): string;
    setValue(text: string): void;
    getModel(): ITextModel;
    setModel(model: ITextModel): void;
    registerCompletionProvider(provider: ICompletionProvider): IDisposable;
    registerDecorationProvider(provider: IDecorationProvider | ILegacyDecorationProvider): IDisposable;
    onDidChangeModelContent(listener: (model: ITextModel) => void): IDisposable;
    triggerCompletion(): void;
    getNativeWidget(): SweetEditorWidget;
    dispose(): void;
}
```

## @sweeteditor/providers-sweetline
Version: `0.0.1`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/providers-sweetline/dist/index.d.ts`

```ts
import { SweetLineIncrementalDecorationProvider, type IDisposable } from "@sweeteditor/core";
export type ISweetLineProvider = InstanceType<typeof SweetLineIncrementalDecorationProvider>;
export declare function createSweetLineDecorationProvider(options?: Record<string, unknown>): ISweetLineProvider;
export interface IDecorationRegistrationTarget {
    registerDecorationProvider(provider: unknown): IDisposable;
}
export declare function registerSweetLineDecorationProvider(editor: IDecorationRegistrationTarget, options?: Record<string, unknown>): {
    provider: ISweetLineProvider;
    disposable: IDisposable;
};
```

## @sweeteditor/widget
Version: `0.0.1`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/widget/dist/index.d.ts`

```ts
import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
import type { IAnyRecord, ISweetEditorWasmModule } from "@sweeteditor/core";
export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
export declare function createWidget(container: HTMLElement, wasmModule: ISweetEditorWasmModule, options?: IAnyRecord): InstanceType<typeof SweetEditorWidget>;
```

### `platform/Emscripten/sdk/packages/widget/dist/legacy/sweet-editor-widget-legacy.d.ts`

```ts
import { CompletionContext, SweetLineIncrementalDecorationProvider, type IAnyRecord, type IAnyValue, type IEditorMetadata, type IEditorTextChange, type ITextPosition, type ITextRange, type IVisibleLineRange } from "@sweeteditor/core";
interface IEChartsStatic {
    init: (...args: IAnyValue[]) => IAnyValue;
    graphic?: IAnyRecord;
}
declare global {
    interface Window {
        echarts?: IEChartsStatic;
    }
}
export declare const EditorEventType: Readonly<Record<string, string>>;
export declare class SweetEditorWidget {
    [key: string]: IAnyValue;
    constructor(container: HTMLElement, wasmModule: IAnyValue, options?: IAnyRecord);
    getCore(): any;
    getDocumentFactory(): any;
    subscribe(eventType: IAnyValue, listener: (...args: IAnyValue[]) => IAnyValue): () => void;
    unsubscribe(eventType: IAnyValue, listener: (...args: IAnyValue[]) => IAnyValue): void;
    getSettings(): any;
    applyTheme(theme?: IAnyRecord): any;
    getTheme(): any;
    setEditorIconProvider(provider: IAnyValue): void;
    getEditorIconProvider(): any;
    addNewLineActionProvider(provider: IAnyValue): void;
    removeNewLineActionProvider(provider: IAnyValue): void;
    setScale(scale: number): void;
    setWrapMode(mode: IAnyValue): void;
    setReadOnly(readOnly: boolean): void;
    isReadOnly(): boolean;
    setAutoIndentMode(mode: IAnyValue): void;
    getAutoIndentMode(): any;
    setMaxGutterIcons(count: number): void;
    setLineSpacing(add: number, mult: number): void;
    setContentStartPadding(padding: number): void;
    getContentStartPadding(): any;
    setDecorationScrollRefreshMinIntervalMs(intervalMs: number): void;
    getDecorationScrollRefreshMinIntervalMs(): number;
    setDecorationOverscanViewportMultiplier(multiplier: number): void;
    getDecorationOverscanViewportMultiplier(): number;
    insert(text: string): any;
    insertText(text: string): any;
    replace(range: ITextRange, newText: string): any;
    replaceText(range: ITextRange, newText: string): any;
    delete(range: ITextRange): any;
    deleteText(range: ITextRange): any;
    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    getCursorPosition(): any;
    setCursorPosition(position: ITextPosition): void;
    getSelection(): {
        hasSelection: boolean;
        range: any;
    };
    getSelectionRange(): any;
    hasSelection(): boolean;
    setSelection(startOrRange: ITextRange | ITextPosition, startColumn: number, endLine: number, endColumn: number): void;
    clearSelection(): void;
    selectAll(): void;
    getSelectedText(): string;
    moveCursorLeft(extendSelection?: boolean): void;
    moveCursorRight(extendSelection?: boolean): void;
    moveCursorUp(extendSelection?: boolean): void;
    moveCursorDown(extendSelection?: boolean): void;
    moveCursorToLineStart(extendSelection?: boolean): void;
    moveCursorToLineEnd(extendSelection?: boolean): void;
    goto(line: number, column?: number): void;
    gotoPosition(line: number, column?: number): void;
    scrollToLine(line: number, behavior?: number): void;
    setScroll(scrollX: number, scrollY: number): void;
    getScrollMetrics(): any;
    getPositionRect(line: number, column: number): any;
    getCursorRect(): any;
    getViewState(): any;
    getLayoutMetrics(): any;
    setLineInlayHints(line: number, hints: IAnyValue[]): void;
    setBatchLineInlayHints(hintsByLine: IAnyValue): void;
    setLinePhantomTexts(line: number, phantoms: IAnyValue): void;
    setBatchLinePhantomTexts(phantomsByLine: IAnyValue): void;
    setLineGutterIcons(line: number, icons: IAnyValue[]): void;
    setBatchLineGutterIcons(iconsByLine: IAnyValue): void;
    setLineDiagnostics(line: number, diagnostics: IAnyValue[]): void;
    setBatchLineDiagnostics(diagsByLine: IAnyValue): void;
    setIndentGuides(guides: IAnyValue[]): void;
    setBatchIndentGuides(guides: IAnyValue[]): void;
    setBracketGuides(guides: IAnyValue[]): void;
    setBatchBracketGuides(guides: IAnyValue[]): void;
    setFlowGuides(guides: IAnyValue[]): void;
    setBatchFlowGuides(guides: IAnyValue[]): void;
    setSeparatorGuides(guides: IAnyValue[]): void;
    setBatchSeparatorGuides(guides: IAnyValue[]): void;
    setFoldRegions(regions: IAnyValue[]): void;
    setBatchFoldRegions(regions: IAnyValue[]): void;
    clearInlayHints(): void;
    clearPhantomTexts(): void;
    clearGutterIcons(): void;
    clearDiagnostics(): void;
    clearGuides(): void;
    clearAllDecorations(): void;
    insertSnippet(snippetTemplate: string): any;
    startLinkedEditing(model: IAnyValue): void;
    isInLinkedEditing(): boolean;
    linkedEditingNext(): boolean;
    linkedEditingPrev(): boolean;
    cancelLinkedEditing(): void;
    finishLinkedEditing(): void;
    toggleFoldAt(line: number): boolean;
    toggleFold(line: number): boolean;
    foldAt(line: number): boolean;
    unfoldAt(line: number): boolean;
    foldAll(): void;
    unfoldAll(): void;
    isLineVisible(line: number): boolean;
    setMatchedBrackets(open: IAnyValue, close: IAnyValue, closeLine: IAnyValue, closeColumn: IAnyValue): void;
    clearMatchedBrackets(): void;
    setLocale(locale: string): void;
    setPerformanceOverlayEnabled(enabled: boolean): void;
    isPerformanceOverlayEnabled(): boolean;
    setPerformanceOverlayVisible(visible: boolean): void;
    isPerformanceOverlayVisible(): boolean;
    getPerformanceStats(): {
        enabled: boolean;
        visible: boolean;
        updateIntervalMs: any;
        stutterThresholdMs: any;
        fps: number;
        avgFrameMs: number;
        avgBuildMs: number;
        avgDrawMs: number;
        avgRafLagMs: number;
        maxFrameMs: number;
        requeueCount: number;
        scrollSpeedY: number;
        stutterCount: number;
        lastStutterMs: number;
        maxStutterMs: number;
        lastOverlayUpdatedAt: number;
        stutterEvents: any;
        history: any;
    };
    setLanguageConfiguration(config: IAnyRecord): void;
    getLanguageConfiguration(): any;
    setMetadata(metadata: IEditorMetadata): void;
    getMetadata(): any;
    getText(): string;
    loadText(text: string, options?: IAnyRecord): void;
    dispose(): void;
    registerTextStyle(styleId: number, color: number, backgroundColor?: number, fontStyle?: number): void;
    setLineSpans(line: number, layer: IAnyValue, spans: IAnyValue[]): void;
    setBatchLineSpans(layer: IAnyValue, spansByLine: IAnyValue): void;
    clearHighlights(layer?: IAnyValue): void;
    createSweetLineDecorationProvider(options?: IAnyRecord): SweetLineIncrementalDecorationProvider;
    addSweetLineDecorationProvider(options?: IAnyRecord): SweetLineIncrementalDecorationProvider;
    addDecorationProvider(provider: IAnyValue): void;
    removeDecorationProvider(provider: IAnyValue): void;
    requestDecorationRefresh(): void;
    setDecorationProviderOptions(options?: IAnyRecord): void;
    getDecorationProviderOptions(): any;
    setDecorationOptions(options?: IAnyRecord): void;
    getDecorationOptions(): any;
    addCompletionProvider(provider: IAnyValue): void;
    removeCompletionProvider(provider: IAnyValue): void;
    triggerCompletion(): void;
    showCompletionItems(items: IAnyValue[]): void;
    dismissCompletion(): void;
    setCompletionItemRenderer(renderer: IAnyValue): void;
    getVisibleLineRange(options?: IAnyRecord): {
        start: number;
        end: number;
    };
    getTotalLineCount(): number;
    _createSettingsFacade(): {
        setScale: (scale: number) => void;
        getScale: () => number;
        setWrapMode: (mode: IAnyValue) => void;
        getWrapMode: () => any;
        setReadOnly: (readOnly: boolean) => void;
        isReadOnly: () => boolean;
        setAutoIndentMode: (mode: IAnyValue) => void;
        getAutoIndentMode: () => any;
        setMaxGutterIcons: (count: number) => void;
        getMaxGutterIcons: () => any;
        setLineSpacing: (add: number, mult: number) => void;
        getLineSpacing: () => {
            add: any;
            mult: any;
        };
        setDecorationScrollRefreshMinIntervalMs: (intervalMs: number) => void;
        getDecorationScrollRefreshMinIntervalMs: () => number;
        setDecorationOverscanViewportMultiplier: (multiplier: number) => void;
        getDecorationOverscanViewportMultiplier: () => number;
    };
    _applySettingsObject(settings: IAnyRecord): void;
    _emitEvent(eventType: IAnyValue, payload?: IAnyRecord): void;
    _emitTextChanged(action: string, range: ITextRange | null, text: string | null): void;
    _emitContextMenuEvent(cursorPosition: ITextPosition | null, screenPoint: IAnyValue, nativeEvent: IAnyRecord | null): void;
    _safeGetScrollMetrics(): any;
    _syncEventStateFromCore(): void;
    _emitCursorChanged(cursorPosition: ITextPosition | null, force?: boolean): void;
    _emitSelectionChanged(hasSelection: boolean, selection: IAnyValue, cursorPosition: ITextPosition | null, force?: boolean): void;
    _emitScrollScaleValues(scrollX: number, scrollY: number, scale: number, forceScroll?: IAnyValue, forceScale?: IAnyValue): void;
    _emitScrollScaleFromCore(forceScroll?: IAnyValue, forceScale?: IAnyValue): void;
    _emitScrollScaleFromGestureResult(result: IAnyValue, emitScroll?: boolean, emitScale?: boolean): void;
    _emitStateEventsFromCore(options?: IAnyRecord): void;
    _dispatchHitTargetEvents(hitTarget: IAnyValue, screenPoint: IAnyValue, nativeEvent: IAnyRecord | null): void;
    _fireGestureEvents(result: IAnyValue, screenPoint: IAnyValue, nativeEvent?: IAnyRecord | null): void;
    _provideNewLineAction(): any;
    _setupDom(): void;
    _bindEvents(): void;
    _isCompositionInputType(inputType: string): boolean;
    _setupPerformanceOverlay(): void;
    _nowMs(): number;
    _smoothValue(previous: IAnyValue, current: IAnyValue, alpha?: IAnyValue): number;
    _formatPerfRelativeSeconds(timestampMs: number): string;
    _classifyStutterReason(elapsedMs: number, now: IAnyValue): "build" | "draw" | "rafLag" | "blocked";
    _recordStutterEvent(elapsedMs: number, now: IAnyValue): void;
    _refreshStutterEventList(): void;
    _applyPerformanceOverlayVisibility(): void;
    _refreshPerformanceOverlayLabels(): void;
    _refreshPerformanceOverlayValues(): void;
    _teardownPerformanceOverlay(): void;
    _ensurePerformanceChart(): void;
    _updatePerformanceChart(): void;
    _startPerformanceMonitor(): void;
    _stopPerformanceMonitor(): void;
    _recordPerformanceSample(sample?: IAnyValue): void;
    _pushPerformanceHistorySample(now: IAnyValue): void;
    _updatePerformanceOverlay(now?: IAnyValue): void;
    _debugInputTargetName(target: IAnyValue): string;
    _debugInputLog(eventName: string, payload?: IAnyRecord): void;
    _hasActiveCompositionFlow(): boolean;
    _invalidatePrintableFallback(): void;
    _suppressNextInputOnce(): void;
    _extractInputText(event: IAnyRecord, allowValueFallback?: IAnyValue): string;
    _applyDomTextInput(event: IAnyRecord, options?: IAnyRecord): boolean;
    _shouldSchedulePrintableFallback(event: IAnyRecord): boolean;
    _schedulePrintableFallback(event: IAnyRecord): boolean;
    _onBeforeInput(e: IAnyRecord): void;
    _onInput(e: IAnyRecord): void;
    _onPointerDown(event: IAnyRecord): void;
    _onPointerMove(event: IAnyRecord): void;
    _onPointerUp(event: IAnyRecord): void;
    _onPointerCancel(event: IAnyRecord): void;
    _onWheel(event: IAnyRecord): void;
    _onContextMenu(event: IAnyRecord): void;
    _handleDocumentPointerDown(event: IAnyRecord): void;
    _isBodyLikeElement(target: IAnyValue): boolean;
    _isTextEntryElement(target: IAnyValue): boolean;
    _shouldRouteDocumentKeyEvent(event: IAnyRecord): any;
    _handleDocumentKeyDown(event: IAnyRecord): void;
    _onKeyDown(event: IAnyRecord): void;
    _dispatchGesture(type: string, points: IAnyValue[], domEvent: IAnyRecord, wheelX?: number, wheelY?: number, directScale?: number): void;
    _startEdgeScroll(): void;
    _stopEdgeScroll(): void;
    _modifiers(event: IAnyRecord): number;
    _mapKeyCode(event: IAnyRecord): any;
    _mapLegacyKeyCode(event: IAnyRecord): any;
    _eventPoint(event: IAnyRecord): {
        x: number;
        y: number;
    };
    _syncInputAnchor(model: IAnyValue, viewportWidth: number, viewportHeight: number): void;
    _resize(): void;
    _markDirty(): void;
    _requestRender(): void;
    _safeBuildRenderModel(): any;
    _refreshRenderModelSnapshot(): any;
    _updateCompletionPopupCursorAnchor(): void;
    _buildCompletionContext(triggerKind: number, triggerCharacter: string): CompletionContext | null;
    _applyCompletionItem(item: IAnyValue): void;
    _isEmptyRange(range: ITextRange | null | undefined): boolean;
    _handleKeyEventResult(result: IAnyValue, options?: IAnyRecord): void;
    _handleTextEditResult(editResult: IAnyValue, options?: IAnyRecord): void;
    _triggerCompletionFromTextChanges(changes: IEditorTextChange[]): void;
    _applyMergedDecorations(merged: IAnyValue, visibleRange: IVisibleLineRange): void;
    _applySpanMode(layer: IAnyValue, mode: IAnyValue, startLine: number, endLine: number): void;
    _applyInlayMode(mode: IAnyValue, startLine: number, endLine: number): void;
    _applyDiagnosticMode(mode: IAnyValue, startLine: number, endLine: number): void;
    _applyGutterMode(mode: IAnyValue, startLine: number, endLine: number): void;
    _applyPhantomMode(mode: IAnyValue, startLine: number, endLine: number): void;
    _buildEmptyLineMap(startLine: number, endLine: number): Map<any, any>;
    _applyLanguageBracketPairs(): void;
    _createContextMenu(): void;
    _refreshContextMenuLabels(): void;
    _setContextMenuItemDisabled(action: string, disabled: IAnyValue): void;
    _updateContextMenuState(): void;
    _showContextMenu(x: number, y: number): void;
    _hideContextMenu(): void;
    _runContextAction(action: string): Promise<void>;
    _copySelectionToClipboard(isCut: boolean): Promise<void>;
    _writeClipboardText(text: string): Promise<boolean>;
    _readClipboardText(): Promise<string>;
    _handleClipboardCopyCut(event: IAnyRecord, isCut: boolean): void;
    _handleClipboardPaste(event: IAnyRecord): void;
}
export {};
```

## @sweeteditor/core
Version: `0.0.1`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/core/dist/index.d.ts`

```ts
export * from "./base/lifecycle.js";
export * from "./editor/model.js";
export * from "./platform/wasm.js";
export * from "./legacy/embind-contracts.js";
export * from "./legacy/editor-input-types.js";
export * from "./legacy/editor-core-legacy.js";
```

### `platform/Emscripten/sdk/packages/core/dist/base/lifecycle.d.ts`

```ts
export interface IDisposable {
    dispose(): void;
}
export declare function toDisposable(onDispose: () => void): IDisposable;
export declare class DisposableStore implements IDisposable {
    private readonly _items;
    private _isDisposed;
    add<T extends IDisposable>(item: T): T;
    clear(): void;
    dispose(): void;
}
```

### `platform/Emscripten/sdk/packages/core/dist/editor/model.d.ts`

```ts
import type { IEditorTextChange } from "../legacy/editor-input-types.js";
export interface IModelOptions {
    uri?: string;
    language?: string;
}
export interface ITextModel {
    readonly uri: string;
    readonly language: string;
    readonly versionId: number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: Iterable<IEditorTextChange> | IEditorTextChange[] | null | undefined): void;
}
export declare class TextModel implements ITextModel {
    readonly uri: string;
    readonly language: string;
    private _value;
    private _versionId;
    constructor(text: string, options?: IModelOptions);
    get versionId(): number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: Iterable<IEditorTextChange> | IEditorTextChange[] | null | undefined): void;
}
export declare function createTextModel(text: string, options?: IModelOptions): TextModel;
```

### `platform/Emscripten/sdk/packages/core/dist/platform/wasm.d.ts`

```ts
import type { IAnyRecord, ISweetEditorWasmModule } from "../legacy/embind-contracts.js";
export interface IWasmModuleOptions extends IAnyRecord {
    locateFile?: (path: string) => string;
}
export type IWasmModuleFactory = (options: IWasmModuleOptions) => ISweetEditorWasmModule | Promise<ISweetEditorWasmModule>;
export interface IWasmLoadOptions {
    modulePath?: string;
    moduleFactory?: IWasmModuleFactory;
    moduleOptions?: IWasmModuleOptions;
}
export declare function loadWasmModule(options?: IWasmLoadOptions): Promise<ISweetEditorWasmModule>;
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/embind-contracts.d.ts`

```ts
export type IAnyValue = any;
export type IAnyRecord = Record<string, IAnyValue>;
export interface IEmbindDeletable {
    delete(): void;
}
export interface IEmbindVector<T> extends IEmbindDeletable {
    size(): number;
    get(index: number): T;
    push_back?(value: T): void;
}
export interface IEmbindEnumValue {
    value: number;
}
export type IEmbindEnumLike = number | IEmbindEnumValue;
export interface ITextPosition {
    line: number;
    column: number;
}
export interface ITextRange {
    start: ITextPosition;
    end: ITextPosition;
}
export interface INativeDocument extends IEmbindDeletable {
    getU8Text(): string;
    getLineCount(): number;
    getLineU16Text(line: number): string;
    getPositionFromCharIndex(charIndex: number): ITextPosition;
    getCharIndexFromPosition(position: ITextPosition): number;
}
export interface INativeEditorCore extends IEmbindDeletable {
    loadDocument(document: INativeDocument): IAnyValue;
    setViewport(size: {
        width: number;
        height: number;
    }): IAnyValue;
    buildRenderModel(): IAnyValue;
    handleGestureEventRaw(type: number, points: IAnyValue, modifiers: number, wheelDeltaX: number, wheelDeltaY: number, directScale: number): IAnyValue;
    handleKeyEventRaw(keyCode: number, text: string, modifiers: number): IAnyValue;
    [key: string]: IAnyValue;
}
export interface ISweetEditorWasmModule extends IAnyRecord {
    EditorCore: new (textMeasurerCallbacks: IAnyRecord, nativeOptions: IAnyRecord) => INativeEditorCore;
    PieceTableDocument: new (text: string) => INativeDocument;
    LineArrayDocument: new (text: string) => INativeDocument;
}
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/editor-input-types.d.ts`

```ts
import type { IAnyRecord, ITextPosition, ITextRange } from "./embind-contracts.js";
export interface IEditorPointerPoint {
    x: number;
    y: number;
    id?: number;
}
export interface IEditorGestureEvent {
    type: number;
    points: IEditorPointerPoint[] | IAnyRecord;
    modifiers?: number;
    wheel_delta_x?: number;
    wheel_delta_y?: number;
    direct_scale?: number;
}
export interface IEditorKeyEvent {
    key_code: number;
    text?: string;
    modifiers?: number;
}
export interface IEditorTextChange {
    range: ITextRange | null;
    oldText?: string;
    old_text?: string;
    newText?: string;
    new_text?: string;
}
export interface IVisibleLineRange {
    start: number;
    end: number;
    startLine?: number;
    endLine?: number;
}
export interface ILanguageBracketPair {
    open: string;
    close: string;
    autoClose?: boolean;
    surround?: boolean;
}
export interface ILanguageConfiguration {
    bracketPairs?: ILanguageBracketPair[];
    [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}
export interface IEditorMetadata {
    fileName?: string;
    language?: string;
    cursorPosition?: ITextPosition;
    [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/editor-core-legacy.d.ts`

```ts
import type { IAnyRecord, IAnyValue, INativeDocument, ITextPosition, ITextRange } from "./embind-contracts.js";
import type { IEditorGestureEvent, IEditorKeyEvent, IEditorMetadata, IEditorTextChange, ILanguageConfiguration, IVisibleLineRange } from "./editor-input-types.js";
type TextInput = string | null | undefined;
interface IPoint {
    line: number;
    column: number;
}
type IRange = ITextRange;
interface ITextChange {
    range: IRange;
    oldText?: string;
    old_text?: string;
    newText?: string;
    new_text?: string;
}
type ITimeoutHandle = ReturnType<typeof setTimeout>;
interface IWasmLoadOptions {
    moduleFactory?: ((options: IAnyRecord) => IAnyValue | Promise<IAnyValue>) | IAnyValue;
    modulePath?: string;
    moduleOptions?: IAnyRecord;
}
interface ICompletionItemInit {
    label?: string;
    detail?: string | null;
    insertText?: string | null;
    insertTextFormat?: number;
    textEdit?: {
        range?: IRange;
        newText?: string;
    } | null;
    filterText?: string | null;
    sortKey?: string | null;
    kind?: number;
}
export declare function normalizeNewlines(text: TextInput): string;
export declare function countLogicalLines(text: TextInput): number;
export declare function clampVisibleLineRange(start: number, end: number, totalLines: number, maxLineSpan?: number): {
    start: number;
    end: number;
};
export declare function applyLineChangeToLines(lines: string[], range: IRange, newText: TextInput, options?: {
    normalizeNewlines?: boolean;
}): void;
export declare function applyTextChangeToText(originalText: TextInput, range: IRange, newText: TextInput, options?: {
    normalizeNewlines?: boolean;
}): string;
export declare function applyTextChangesToText(originalText: TextInput, changes: Iterable<ITextChange> | ITextChange[] | null | undefined, options?: {
    normalizeNewlines?: boolean;
}): string;
export declare function loadSweetEditorCore(options?: IWasmLoadOptions): Promise<IAnyValue>;
export declare class Document {
    [key: string]: IAnyValue;
    protected _native: INativeDocument | null;
    kind: string;
    constructor(nativeDocument: INativeDocument | null, kind: string);
    getNative(): IAnyRecord | null;
    getText(): string;
    getLineCount(): number;
    getLineText(line: number): string;
    getPositionFromCharIndex(charIndex: number): IPoint;
    getCharIndexFromPosition(position: IPoint): number;
    dispose(): void;
}
export declare class DocumentFactory {
    [key: string]: IAnyValue;
    private readonly _wasm;
    constructor(wasmModule: IAnyRecord);
    fromText(text: TextInput, options?: {
        kind?: "piece-table" | "line-array";
    }): Document;
    fromPieceTable(text: TextInput): Document;
    fromLineArray(text: TextInput): Document;
}
export declare class WebEditorCore {
    [key: string]: IAnyValue;
    constructor(wasmModule: IAnyRecord, textMeasurerCallbacks: IAnyRecord, editorOptions?: IAnyRecord, onDidMutate?: (() => void) | null);
    getNative(): any;
    beginBatch(): void;
    endBatch(): void;
    withBatch(fn: (...args: IAnyValue[]) => IAnyValue): any;
    _invoke(method: string, ...args: IAnyValue[]): any;
    call(method: string, ...args: IAnyValue[]): any;
    read(method: string, ...args: IAnyValue[]): any;
    loadDocument(document: IAnyValue): any;
    setViewport(width: number, height: number): any;
    buildRenderModel(): any;
    handleGestureEvent(eventData: IEditorGestureEvent): any;
    handleKeyEvent(eventData: IEditorKeyEvent): any;
    tickEdgeScroll(): any;
    tickFling(): any;
    onFontMetricsChanged(): any;
    setFoldArrowMode(mode: IAnyValue): any;
    setWrapMode(mode: IAnyValue): any;
    setTabSize(tabSize: number): any;
    setScale(scale: number): any;
    setLineSpacing(add: number, mult: number): any;
    setContentStartPadding(padding: number): any;
    setShowSplitLine(show: boolean): any;
    setCurrentLineRenderMode(mode: IAnyValue): any;
    getViewState(): any;
    getScrollMetrics(): any;
    getLayoutMetrics(): any;
    insert(text: string): any;
    replaceText(range: ITextRange, newText: string): any;
    deleteText(range: ITextRange): any;
    backspace(): any;
    deleteForward(): any;
    moveLineUp(): any;
    moveLineDown(): any;
    copyLineUp(): any;
    copyLineDown(): any;
    deleteLine(): any;
    insertLineAbove(): any;
    insertLineBelow(): any;
    undo(): any;
    redo(): any;
    setCursorPosition(position: ITextPosition): any;
    setSelection(startOrRange: ITextRange | ITextPosition, startColumn: number, endLine: number, endColumn: number): any;
    clearSelection(): any;
    selectAll(): any;
    getSelectedText(): any;
    moveCursorLeft(extendSelection?: boolean): any;
    moveCursorRight(extendSelection?: boolean): any;
    moveCursorUp(extendSelection?: boolean): any;
    moveCursorDown(extendSelection?: boolean): any;
    moveCursorToLineStart(extendSelection?: boolean): any;
    moveCursorToLineEnd(extendSelection?: boolean): any;
    compositionStart(): any;
    compositionUpdate(text: string): any;
    compositionEnd(committedText: IAnyValue): any;
    compositionCancel(): any;
    isComposing(): any;
    setCompositionEnabled(enabled: boolean): any;
    isCompositionEnabled(): any;
    setReadOnly(readOnly: boolean): any;
    isReadOnly(): any;
    setAutoIndentMode(mode: IAnyValue): any;
    getAutoIndentMode(): any;
    setHandleConfig(config: IAnyRecord): any;
    getHandleConfig(): any;
    setScrollbarConfig(config: IAnyRecord): any;
    getScrollbarConfig(): any;
    getPositionRect(line: number, column: number): any;
    getCursorRect(): any;
    scrollToLine(line: number, behavior?: number): any;
    gotoPosition(line: number, column: number): any;
    setScroll(scrollX: number, scrollY: number): any;
    insertSnippet(snippetTemplate: string): any;
    startLinkedEditing(model: IAnyValue): any;
    linkedEditingNext(): any;
    linkedEditingPrev(): any;
    cancelLinkedEditing(): any;
    finishLinkedEditing(): any;
    toggleFoldAt(line: number): any;
    foldAt(line: number): any;
    unfoldAt(line: number): any;
    foldAll(): any;
    unfoldAll(): any;
    isLineVisible(line: number): any;
    setMatchedBrackets(open: IAnyValue, close: IAnyValue): any;
    clearMatchedBrackets(): any;
    getCursorPosition(): any;
    getWordRangeAtCursor(): any;
    getWordAtCursor(): any;
    getSelection(): any;
    hasSelection(): any;
    canUndo(): any;
    canRedo(): any;
    isInLinkedEditing(): any;
    registerTextStyle(styleId: number, color: number, backgroundColor?: number, fontStyle?: number): any;
    setLineSpans(line: number, layer: IAnyValue, spans: IAnyValue[]): void;
    setBatchLineSpans(layer: IAnyValue, spansByLine: IAnyValue): void;
    setLineInlayHints(line: number, hints: IAnyValue[]): void;
    setBatchLineInlayHints(hintsByLine: IAnyValue): void;
    setLinePhantomTexts(line: number, phantoms: IAnyValue): void;
    setBatchLinePhantomTexts(phantomsByLine: IAnyValue): void;
    setLineGutterIcons(line: number, icons: IAnyValue[]): void;
    setBatchLineGutterIcons(iconsByLine: IAnyValue): void;
    setLineDiagnostics(line: number, diagnostics: IAnyValue[]): void;
    setBatchLineDiagnostics(diagsByLine: IAnyValue): void;
    setIndentGuides(guides: IAnyValue[]): void;
    setBracketGuides(guides: IAnyValue[]): void;
    setFlowGuides(guides: IAnyValue[]): void;
    setSeparatorGuides(guides: IAnyValue[]): void;
    setFoldRegions(regions: IAnyValue[]): void;
    setMaxGutterIcons(count: number): any;
    clearHighlights(layer?: IAnyValue): any;
    clearInlayHints(): any;
    clearPhantomTexts(): any;
    clearGutterIcons(): any;
    clearDiagnostics(): any;
    clearGuides(): any;
    clearAllDecorations(): any;
    setBracketPairs(bracketPairs: IAnyValue): void;
    _toNativeInlayHint(hint: IAnyValue): {
        type: any;
        column: number;
        text: string;
        icon_id: any;
        color: number;
    } | {
        type: any;
        column: number;
        text: string;
        icon_id: number;
        color: any;
    };
    _toNativeEnumValue(enumName: string, value: IAnyValue, fallback?: IAnyValue): any;
    _callBatchLineEntries(entryVectorName: IAnyValue, itemVectorName: IAnyValue, entryFieldName: IAnyValue, entriesByLine: IAnyValue, itemMapper: (...args: IAnyValue[]) => IAnyValue, fn: (...args: IAnyValue[]) => IAnyValue): boolean;
    _callWithVector(vectorName: IAnyValue, items: IAnyValue[], mapper: (...args: IAnyValue[]) => IAnyValue, fn: (...args: IAnyValue[]) => IAnyValue): void;
    dispose(): void;
    _notifyMutate(): void;
    _emitMutate(): void;
}
export declare const CompletionTriggerKind: Readonly<{
    INVOKED: 0;
    CHARACTER: 1;
    RETRIGGER: 2;
}>;
export declare class CompletionItem {
    [key: string]: IAnyValue;
    static KIND_KEYWORD: number;
    static KIND_FUNCTION: number;
    static KIND_VARIABLE: number;
    static KIND_CLASS: number;
    static KIND_INTERFACE: number;
    static KIND_MODULE: number;
    static KIND_PROPERTY: number;
    static KIND_SNIPPET: number;
    static KIND_TEXT: number;
    static INSERT_TEXT_FORMAT_PLAIN_TEXT: number;
    static INSERT_TEXT_FORMAT_SNIPPET: number;
    constructor(init?: ICompletionItemInit);
    get matchText(): any;
}
export declare class CompletionContext {
    [key: string]: IAnyValue;
    constructor({ triggerKind, triggerCharacter, cursorPosition, lineText, wordRange, languageConfiguration, editorMetadata, }?: {
        triggerKind?: number;
        triggerCharacter?: string | null;
        cursorPosition?: IPoint;
        lineText?: string;
        wordRange?: IRange | null;
        languageConfiguration?: IAnyRecord | null;
        editorMetadata?: IAnyRecord | null;
    });
}
export declare class CompletionResult {
    [key: string]: IAnyValue;
    constructor(items?: ICompletionItemInit[], isIncomplete?: boolean);
    static EMPTY: CompletionResult;
}
export declare class CompletionReceiver {
    [key: string]: IAnyValue;
    accept(_result: IAnyValue): void;
    get isCancelled(): boolean;
}
export declare class CompletionProvider {
    [key: string]: IAnyValue;
    isTriggerCharacter(_ch: string): boolean;
    provideCompletions(_context: CompletionContext, _receiver: CompletionReceiver): void;
}
declare class ManagedCompletionReceiver extends CompletionReceiver {
    [key: string]: IAnyValue;
    constructor(manager: IAnyValue, provider: IAnyValue, generation: number);
    cancel(): void;
    accept(result: IAnyValue): boolean;
    get isCancelled(): any;
}
interface ICompletionProviderLike {
    isTriggerCharacter?: (ch: string) => boolean;
    provideCompletions: (context: IAnyValue, receiver: CompletionReceiver) => void;
}
interface ICompletionListenerLike {
    onItemsUpdated?: (items: CompletionItem[]) => void;
    onDismissed?: () => void;
}
interface ICompletionManagerOptions {
    buildContext?: (triggerKind: number, triggerCharacter: string) => IAnyValue | null;
    onItemsUpdated?: (items: CompletionItem[]) => void;
    onDismissed?: () => void;
    debounceCharacterMs?: number;
    debounceInvokedMs?: number;
}
export declare class CompletionProviderManager {
    _providers: Set<ICompletionProviderLike>;
    _activeReceivers: Map<ICompletionProviderLike, ManagedCompletionReceiver>;
    _generation: number;
    _mergedItems: CompletionItem[];
    _buildContext: ((triggerKind: number, triggerCharacter: string) => IAnyValue | null) | null;
    _onItemsUpdated: ((items: CompletionItem[]) => void) | null;
    _onDismissed: (() => void) | null;
    _debounceCharacterMs: number;
    _debounceInvokedMs: number;
    _lastTriggerKind: number;
    _lastTriggerChar: string | null;
    _refreshTimer: ITimeoutHandle | 0;
    constructor(options?: ICompletionManagerOptions);
    setListener(listener?: ICompletionListenerLike | null): void;
    addProvider(provider: ICompletionProviderLike): void;
    removeProvider(provider: ICompletionProviderLike): void;
    isTriggerCharacter(ch: string): boolean;
    triggerCompletion(triggerKind?: number, triggerCharacter?: string | null): void;
    showItems(items: IAnyValue[]): void;
    dismiss(): void;
    _executeRefresh(triggerKind: number, triggerCharacter: string | null): void;
    _cancelAllReceivers(): void;
    _onProviderResult(_provider: ICompletionProviderLike, result: IAnyValue, generation: number): void;
    _emitItemsUpdated(items: IAnyValue[]): void;
    _emitDismiss(): void;
}
export declare const DecorationType: Readonly<{
    SYNTAX_HIGHLIGHT: number;
    SEMANTIC_HIGHLIGHT: number;
    INLAY_HINT: number;
    DIAGNOSTIC: number;
    FOLD_REGION: number;
    INDENT_GUIDE: number;
    BRACKET_GUIDE: number;
    FLOW_GUIDE: number;
    SEPARATOR_GUIDE: number;
    GUTTER_ICON: number;
    PHANTOM_TEXT: number;
}>;
export declare const DecorationApplyMode: Readonly<{
    MERGE: 0;
    REPLACE_ALL: 1;
    REPLACE_RANGE: 2;
}>;
export declare const DecorationTextChangeMode: Readonly<{
    INCREMENTAL: "incremental";
    FULL: "full";
    DISABLED: "disabled";
}>;
export declare const DecorationResultDispatchMode: Readonly<{
    BOTH: "both";
    SYNC: "sync";
    ASYNC: "async";
}>;
export declare const DecorationProviderCallMode: Readonly<{
    SYNC: "sync";
    ASYNC: "async";
}>;
export declare class DecorationContext {
    [key: string]: IAnyValue;
    constructor({ visibleStartLine, visibleEndLine, viewportStartLine, viewportEndLine, totalLineCount, textChanges, languageConfiguration, editorMetadata, }?: {
        visibleStartLine?: number;
        visibleEndLine?: number;
        viewportStartLine?: number;
        viewportEndLine?: number;
        totalLineCount?: number;
        textChanges?: ITextChange[];
        languageConfiguration?: IAnyRecord | null;
        editorMetadata?: IAnyRecord | null;
    });
}
export declare class DecorationResult {
    [key: string]: IAnyValue;
    constructor(init?: IAnyRecord);
}
export declare class DecorationReceiver {
    [key: string]: IAnyValue;
    accept(_result: IAnyValue): void;
    get isCancelled(): boolean;
}
export declare class DecorationProvider {
    [key: string]: IAnyValue;
    getCapabilities(): number;
    provideDecorations(_context: IAnyValue, _receiver: IAnyValue): void;
}
export declare class SweetLineIncrementalDecorationProvider extends DecorationProvider {
    [key: string]: IAnyValue;
    constructor(options?: IAnyRecord);
    getCapabilities(): any;
    dispose(): void;
    getLineCount(): number;
    setDocumentSource(fileName: string, text: string): void;
    provideDecorations(context: IAnyValue, receiver: IAnyValue): void;
    _buildVisibleRangeForRendering(context: IAnyValue, totalLineCount: number): {
        start: number;
        end: number;
    };
    _buildLazyAnalyzeRange(visibleRange: IVisibleLineRange, totalLineCount: number): {
        start: number;
        end: number;
    };
    _resolveAnalyzerExtension(fileName: string): string;
    _ensureTextAnalyzer(fileName: string, fileChanged: boolean): boolean;
    _resetLineAnalyzeState(): void;
    _invalidateLineAnalyzeByChanges(changes: IEditorTextChange[]): void;
    _invalidateLineAnalyzeFromLine(line: number): void;
    _scheduleLineAnalyze(range: IVisibleLineRange, receiver: IAnyValue): void;
    _cancelPendingLineAnalyze(): void;
    _analyzeLineRangeSynchronously(startLine: number, endLine: number): number;
    _runLineAnalyzeChunk(jobId: number, receiver: IAnyValue): void;
    _analyzeOneLineAtCursor(): boolean;
    _collectCachedSyntaxSpans(visibleRange: IVisibleLineRange): Map<any, any>;
    _setSourceText(text: string): void;
    _resolveContextFileName(context: IAnyValue): any;
    _syncSourceFromDocument(): boolean;
    _applyTextChanges(changes: IEditorTextChange[]): void;
    _tryRebuildAnalyzer(fileName: string): boolean;
    _tryAnalyzeIncremental(changes: IEditorTextChange[], fileName: string): boolean;
    _disposeAnalyzer(): void;
    _rebuildAnalyzer(fileName: string): void;
    _collectSyntaxSpans(visibleRange: IVisibleLineRange): Map<any, any>;
}
declare class ManagedDecorationReceiver extends DecorationReceiver {
    [key: string]: IAnyValue;
    constructor(manager: IAnyValue, provider: IAnyValue, generation: number);
    cancel(): void;
    markAsyncPhase(): void;
    accept(result: IAnyValue): boolean;
    get isCancelled(): any;
}
type IDecorationTextChangeMode = (typeof DecorationTextChangeMode)[keyof typeof DecorationTextChangeMode];
type IDecorationResultDispatchMode = (typeof DecorationResultDispatchMode)[keyof typeof DecorationResultDispatchMode];
type IDecorationProviderCallMode = (typeof DecorationProviderCallMode)[keyof typeof DecorationProviderCallMode];
interface IDecorationProviderLike {
    provideDecorations: (context: IAnyValue, receiver: DecorationReceiver) => void;
}
interface IDecorationProviderState {
    snapshot: IAnyRecord | null;
    activeReceiver: ManagedDecorationReceiver | null;
}
interface IDecorationManagerOptions {
    buildContext?: (input: IAnyRecord) => IAnyValue;
    getVisibleLineRange?: () => IAnyValue;
    ensureVisibleLineRange?: () => void;
    getTotalLineCount?: () => IAnyValue;
    getLanguageConfiguration?: () => ILanguageConfiguration | IAnyRecord | null;
    getMetadata?: () => IEditorMetadata | IAnyRecord | null;
    onApplyMerged?: (merged: IAnyRecord, visibleRange: IVisibleLineRange) => void;
    scrollRefreshMinIntervalMs?: number;
    overscanViewportMultiplier?: number;
    textChangeMode?: IDecorationTextChangeMode;
    resultDispatchMode?: IDecorationResultDispatchMode;
    providerCallMode?: IDecorationProviderCallMode;
    applySynchronously?: boolean;
}
export declare class DecorationProviderManager {
    _providers: Set<IDecorationProviderLike>;
    _providerStates: Map<IDecorationProviderLike, IDecorationProviderState>;
    _buildContext: ((input: IAnyRecord) => IAnyValue) | null;
    _getVisibleLineRange: (() => IAnyValue) | null;
    _ensureVisibleLineRange: (() => void) | null;
    _getTotalLineCount: (() => IAnyValue) | null;
    _getLanguageConfiguration: (() => ILanguageConfiguration | IAnyRecord | null) | null;
    _getMetadata: (() => IEditorMetadata | IAnyRecord | null) | null;
    _onApplyMerged: ((merged: IAnyRecord, visibleRange: IVisibleLineRange) => void) | null;
    _refreshTimer: ITimeoutHandle | 0;
    _scrollRefreshTimer: ITimeoutHandle | 0;
    _applyTimer: ITimeoutHandle | 0;
    _pendingTextChanges: ITextChange[];
    _applyScheduled: boolean;
    _generation: number;
    _lastVisibleStartLine: number;
    _lastVisibleEndLine: number;
    _lastScrollRefreshTickMs: number;
    _scrollRefreshMinIntervalMs: number;
    _overscanViewportMultiplier: number;
    _textChangeMode: IDecorationTextChangeMode;
    _resultDispatchMode: IDecorationResultDispatchMode;
    _providerCallMode: IDecorationProviderCallMode;
    _applySynchronously: boolean;
    constructor(options?: IDecorationManagerOptions);
    setOptions(options?: IDecorationManagerOptions): void;
    getOptions(): {
        scrollRefreshMinIntervalMs: number;
        overscanViewportMultiplier: number;
        textChangeMode: IDecorationTextChangeMode;
        resultDispatchMode: IDecorationResultDispatchMode;
        providerCallMode: IDecorationProviderCallMode;
        applySynchronously: boolean;
    };
    addProvider(provider: IDecorationProviderLike): void;
    removeProvider(provider: IDecorationProviderLike): void;
    requestRefresh(): void;
    onDocumentLoaded(): void;
    onTextChanged(changes: IEditorTextChange[]): void;
    onScrollChanged(): void;
    _scheduleRefresh(delayMs: IAnyValue, changes: IEditorTextChange[] | null): void;
    _doRefresh(): void;
    _invokeProvider(provider: IDecorationProviderLike, context: IAnyValue, receiver: ManagedDecorationReceiver): void;
    _resolveVisibleRange(): {
        start: number;
        end: any;
    };
    _resolveContextRange(visibleRange: IVisibleLineRange, totalLineCount: number): {
        start: number;
        end: number;
    };
    _onProviderPatch(provider: IDecorationProviderLike, patch: IAnyValue, generation: number): void;
    _scheduleApply(): void;
    _applyMerged(): void;
}
export {};
```

