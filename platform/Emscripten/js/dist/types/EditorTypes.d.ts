export interface EditorOptions {
    touchSlop?: number;
    doubleTapTimeout?: number;
    longPressMs?: number;
    maxUndoStackSize?: number;
}
export interface TextPosition {
    line: number;
    column: number;
}
export interface TextRange {
    start: TextPosition;
    end: TextPosition;
}
export interface TextMeasurer {
    measureTextWidth(text: string, fontStyle: number): number;
    measureInlayHintWidth(text: string): number;
    measureIconWidth(iconId: number): number;
    getFontMetrics(): {
        ascent: number;
        descent: number;
    };
}
export interface CursorRect {
    x: number;
    y: number;
    height: number;
}
export interface ScrollMetrics {
    scale: number;
    scrollX: number;
    scrollY: number;
    maxScrollX: number;
    maxScrollY: number;
    contentWidth: number;
    contentHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    textAreaX: number;
    textAreaWidth: number;
    canScrollX: boolean;
    canScrollY: boolean;
}
export interface SelectionInfo {
    hasSelection: boolean;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
export interface PositionRect {
    x: number;
    y: number;
    height: number;
}
export declare enum EventType {
    UNDEFINED = 0,
    TOUCH_DOWN = 1,
    TOUCH_POINTER_DOWN = 2,
    TOUCH_MOVE = 3,
    TOUCH_POINTER_UP = 4,
    TOUCH_UP = 5,
    TOUCH_CANCEL = 6,
    MOUSE_DOWN = 7,
    MOUSE_MOVE = 8,
    MOUSE_UP = 9,
    MOUSE_WHEEL = 10,
    MOUSE_RIGHT_DOWN = 11,
    DIRECT_SCALE = 12,
    DIRECT_SCROLL = 13
}
export declare enum GestureType {
    UNDEFINED = 0,
    TAP = 1,
    DOUBLE_TAP = 2,
    LONG_PRESS = 3,
    SCALE = 4,
    SCROLL = 5,
    FAST_SCROLL = 6,
    DRAG_SELECT = 7,
    CONTEXT_MENU = 8
}
export declare enum HitTargetType {
    NONE = 0,
    INLAY_HINT_TEXT = 1,
    INLAY_HINT_ICON = 2,
    GUTTER_ICON = 3,
    FOLD_PLACEHOLDER = 4,
    FOLD_GUTTER = 5,
    INLAY_HINT_COLOR = 6
}
export interface HitTarget {
    type: HitTargetType;
    line: number;
    column: number;
    iconId: number;
    colorValue: number;
}
export interface GestureResult {
    type: GestureType;
    tapPoint: {
        x: number;
        y: number;
    };
    scale: number;
    scrollX: number;
    scrollY: number;
    modifiers: number;
    cursorPosition: TextPosition;
    hasSelection: boolean;
    selection: TextRange;
    viewScrollX: number;
    viewScrollY: number;
    viewScale: number;
    hitTarget: HitTarget;
    needsEdgeScroll: boolean;
}
export declare enum Modifier {
    NONE = 0,
    SHIFT = 1,
    CTRL = 2,
    ALT = 4,
    META = 8
}
export declare enum WrapMode {
    NONE = 0,
    CHAR_BREAK = 1,
    WORD_BREAK = 2
}
export declare enum FoldArrowMode {
    AUTO = 0,
    ALWAYS = 1,
    HIDDEN = 2
}
export declare enum CurrentLineRenderMode {
    BACKGROUND = 0,
    BORDER = 1,
    NONE = 2
}
export declare enum AutoIndentMode {
    NONE = 0,
    INDENT = 1,
    ADVANCED = 2
}
export declare enum ScrollBehavior {
    TOP = 0,
    CENTER = 1,
    BOTTOM = 2
}
export declare enum VisualRunType {
    TEXT = 0,
    WHITESPACE = 1,
    NEWLINE = 2,
    INLAY_HINT = 3,
    PHANTOM_TEXT = 4,
    FOLD_PLACEHOLDER = 5
}
export declare enum FoldState {
    NONE = 0,
    EXPANDED = 1,
    COLLAPSED = 2
}
export declare enum GuideDirection {
    VERTICAL = 0,
    HORIZONTAL = 1
}
export declare enum GuideType {
    INDENT = 0,
    BRACKET = 1,
    FLOW = 2,
    SEPARATOR = 3
}
export declare enum GuideStyle {
    SOLID = 0,
    DASHED = 1,
    DOUBLE = 2
}
export interface TextStyle {
    fontStyle: number;
    color: number;
    backgroundColor: number;
}
export interface VisualRun {
    type: VisualRunType;
    column: number;
    length: number;
    x: number;
    y: number;
    text: string;
    style: TextStyle;
    iconId: number;
    colorValue: number;
    width: number;
    padding: number;
    margin: number;
}
export interface VisualLine {
    logicalLine: number;
    wrapIndex: number;
    lineNumberPosition: {
        x: number;
        y: number;
    };
    runs: VisualRun[];
    isPhantomLine: boolean;
    foldState: FoldState;
}
export interface Cursor {
    textPosition: TextPosition;
    position: {
        x: number;
        y: number;
    };
    height: number;
    visible: boolean;
    showDragger: boolean;
}
export interface SelectionRect {
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface SelectionHandle {
    position: {
        x: number;
        y: number;
    };
    height: number;
    visible: boolean;
}
export interface CompositionDecoration {
    active: boolean;
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface GuideSegment {
    direction: GuideDirection;
    type: GuideType;
    style: GuideStyle;
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    arrowEnd: boolean;
}
export interface DiagnosticDecoration {
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    severity: number;
    color: number;
}
export interface LinkedEditingRect {
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    isActive: boolean;
}
export interface BracketHighlightRect {
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface GutterIconRenderItem {
    logicalLine: number;
    iconId: number;
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface FoldMarkerRenderItem {
    logicalLine: number;
    foldState: FoldState;
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface ScrollbarRect {
    origin: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}
export interface ScrollbarModel {
    visible: boolean;
    alpha: number;
    track: ScrollbarRect;
    thumb: ScrollbarRect;
}
export interface EditorRenderModel {
    splitX: number;
    splitLineVisible: boolean;
    scrollX: number;
    scrollY: number;
    viewportWidth: number;
    viewportHeight: number;
    currentLine: {
        x: number;
        y: number;
    };
    currentLineRenderMode: CurrentLineRenderMode;
    lines: VisualLine[];
    cursor: Cursor;
    selectionRects: SelectionRect[];
    selectionStartHandle: SelectionHandle;
    selectionEndHandle: SelectionHandle;
    compositionDecoration: CompositionDecoration;
    guideSegments: GuideSegment[];
    diagnosticDecorations: DiagnosticDecoration[];
    maxGutterIcons: number;
    linkedEditingRects: LinkedEditingRect[];
    bracketHighlightRects: BracketHighlightRect[];
    gutterIcons: GutterIconRenderItem[];
    foldMarkers: FoldMarkerRenderItem[];
    verticalScrollbar: ScrollbarModel;
    horizontalScrollbar: ScrollbarModel;
}
export interface LayoutMetrics {
    fontHeight: number;
    fontAscent: number;
    lineSpacingAdd: number;
    lineSpacingMult: number;
    lineNumberMargin: number;
    lineNumberWidth: number;
    contentStartPadding: number;
    maxGutterIcons: number;
    inlayHintPadding: number;
    inlayHintMargin: number;
    foldArrowMode: FoldArrowMode;
    hasFoldRegions: boolean;
}
//# sourceMappingURL=EditorTypes.d.ts.map