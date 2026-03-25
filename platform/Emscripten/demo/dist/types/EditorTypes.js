export var EventType;
(function (EventType) {
    EventType[EventType["UNDEFINED"] = 0] = "UNDEFINED";
    EventType[EventType["TOUCH_DOWN"] = 1] = "TOUCH_DOWN";
    EventType[EventType["TOUCH_POINTER_DOWN"] = 2] = "TOUCH_POINTER_DOWN";
    EventType[EventType["TOUCH_MOVE"] = 3] = "TOUCH_MOVE";
    EventType[EventType["TOUCH_POINTER_UP"] = 4] = "TOUCH_POINTER_UP";
    EventType[EventType["TOUCH_UP"] = 5] = "TOUCH_UP";
    EventType[EventType["TOUCH_CANCEL"] = 6] = "TOUCH_CANCEL";
    EventType[EventType["MOUSE_DOWN"] = 7] = "MOUSE_DOWN";
    EventType[EventType["MOUSE_MOVE"] = 8] = "MOUSE_MOVE";
    EventType[EventType["MOUSE_UP"] = 9] = "MOUSE_UP";
    EventType[EventType["MOUSE_WHEEL"] = 10] = "MOUSE_WHEEL";
    EventType[EventType["MOUSE_RIGHT_DOWN"] = 11] = "MOUSE_RIGHT_DOWN";
    EventType[EventType["DIRECT_SCALE"] = 12] = "DIRECT_SCALE";
    EventType[EventType["DIRECT_SCROLL"] = 13] = "DIRECT_SCROLL";
})(EventType || (EventType = {}));
export var GestureType;
(function (GestureType) {
    GestureType[GestureType["UNDEFINED"] = 0] = "UNDEFINED";
    GestureType[GestureType["TAP"] = 1] = "TAP";
    GestureType[GestureType["DOUBLE_TAP"] = 2] = "DOUBLE_TAP";
    GestureType[GestureType["LONG_PRESS"] = 3] = "LONG_PRESS";
    GestureType[GestureType["SCALE"] = 4] = "SCALE";
    GestureType[GestureType["SCROLL"] = 5] = "SCROLL";
    GestureType[GestureType["FAST_SCROLL"] = 6] = "FAST_SCROLL";
    GestureType[GestureType["DRAG_SELECT"] = 7] = "DRAG_SELECT";
    GestureType[GestureType["CONTEXT_MENU"] = 8] = "CONTEXT_MENU";
})(GestureType || (GestureType = {}));
export var HitTargetType;
(function (HitTargetType) {
    HitTargetType[HitTargetType["NONE"] = 0] = "NONE";
    HitTargetType[HitTargetType["INLAY_HINT_TEXT"] = 1] = "INLAY_HINT_TEXT";
    HitTargetType[HitTargetType["INLAY_HINT_ICON"] = 2] = "INLAY_HINT_ICON";
    HitTargetType[HitTargetType["GUTTER_ICON"] = 3] = "GUTTER_ICON";
    HitTargetType[HitTargetType["FOLD_PLACEHOLDER"] = 4] = "FOLD_PLACEHOLDER";
    HitTargetType[HitTargetType["FOLD_GUTTER"] = 5] = "FOLD_GUTTER";
    HitTargetType[HitTargetType["INLAY_HINT_COLOR"] = 6] = "INLAY_HINT_COLOR";
})(HitTargetType || (HitTargetType = {}));
export var Modifier;
(function (Modifier) {
    Modifier[Modifier["NONE"] = 0] = "NONE";
    Modifier[Modifier["SHIFT"] = 1] = "SHIFT";
    Modifier[Modifier["CTRL"] = 2] = "CTRL";
    Modifier[Modifier["ALT"] = 4] = "ALT";
    Modifier[Modifier["META"] = 8] = "META";
})(Modifier || (Modifier = {}));
export var WrapMode;
(function (WrapMode) {
    WrapMode[WrapMode["NONE"] = 0] = "NONE";
    WrapMode[WrapMode["CHAR_BREAK"] = 1] = "CHAR_BREAK";
    WrapMode[WrapMode["WORD_BREAK"] = 2] = "WORD_BREAK";
})(WrapMode || (WrapMode = {}));
export var FoldArrowMode;
(function (FoldArrowMode) {
    FoldArrowMode[FoldArrowMode["AUTO"] = 0] = "AUTO";
    FoldArrowMode[FoldArrowMode["ALWAYS"] = 1] = "ALWAYS";
    FoldArrowMode[FoldArrowMode["HIDDEN"] = 2] = "HIDDEN";
})(FoldArrowMode || (FoldArrowMode = {}));
export var CurrentLineRenderMode;
(function (CurrentLineRenderMode) {
    CurrentLineRenderMode[CurrentLineRenderMode["BACKGROUND"] = 0] = "BACKGROUND";
    CurrentLineRenderMode[CurrentLineRenderMode["BORDER"] = 1] = "BORDER";
    CurrentLineRenderMode[CurrentLineRenderMode["NONE"] = 2] = "NONE";
})(CurrentLineRenderMode || (CurrentLineRenderMode = {}));
export var AutoIndentMode;
(function (AutoIndentMode) {
    AutoIndentMode[AutoIndentMode["NONE"] = 0] = "NONE";
    AutoIndentMode[AutoIndentMode["INDENT"] = 1] = "INDENT";
    AutoIndentMode[AutoIndentMode["ADVANCED"] = 2] = "ADVANCED";
})(AutoIndentMode || (AutoIndentMode = {}));
export var ScrollBehavior;
(function (ScrollBehavior) {
    ScrollBehavior[ScrollBehavior["TOP"] = 0] = "TOP";
    ScrollBehavior[ScrollBehavior["CENTER"] = 1] = "CENTER";
    ScrollBehavior[ScrollBehavior["BOTTOM"] = 2] = "BOTTOM";
})(ScrollBehavior || (ScrollBehavior = {}));
export var VisualRunType;
(function (VisualRunType) {
    VisualRunType[VisualRunType["TEXT"] = 0] = "TEXT";
    VisualRunType[VisualRunType["WHITESPACE"] = 1] = "WHITESPACE";
    VisualRunType[VisualRunType["NEWLINE"] = 2] = "NEWLINE";
    VisualRunType[VisualRunType["INLAY_HINT"] = 3] = "INLAY_HINT";
    VisualRunType[VisualRunType["PHANTOM_TEXT"] = 4] = "PHANTOM_TEXT";
    VisualRunType[VisualRunType["FOLD_PLACEHOLDER"] = 5] = "FOLD_PLACEHOLDER";
})(VisualRunType || (VisualRunType = {}));
export var FoldState;
(function (FoldState) {
    FoldState[FoldState["NONE"] = 0] = "NONE";
    FoldState[FoldState["EXPANDED"] = 1] = "EXPANDED";
    FoldState[FoldState["COLLAPSED"] = 2] = "COLLAPSED";
})(FoldState || (FoldState = {}));
export var GuideDirection;
(function (GuideDirection) {
    GuideDirection[GuideDirection["VERTICAL"] = 0] = "VERTICAL";
    GuideDirection[GuideDirection["HORIZONTAL"] = 1] = "HORIZONTAL";
})(GuideDirection || (GuideDirection = {}));
export var GuideType;
(function (GuideType) {
    GuideType[GuideType["INDENT"] = 0] = "INDENT";
    GuideType[GuideType["BRACKET"] = 1] = "BRACKET";
    GuideType[GuideType["FLOW"] = 2] = "FLOW";
    GuideType[GuideType["SEPARATOR"] = 3] = "SEPARATOR";
})(GuideType || (GuideType = {}));
export var GuideStyle;
(function (GuideStyle) {
    GuideStyle[GuideStyle["SOLID"] = 0] = "SOLID";
    GuideStyle[GuideStyle["DASHED"] = 1] = "DASHED";
    GuideStyle[GuideStyle["DOUBLE"] = 2] = "DOUBLE";
})(GuideStyle || (GuideStyle = {}));
//# sourceMappingURL=EditorTypes.js.map