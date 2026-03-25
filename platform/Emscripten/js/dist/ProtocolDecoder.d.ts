import { EditorRenderModel, VisualLine, VisualRun, Cursor, SelectionRect, SelectionHandle, CompositionDecoration, GuideSegment, DiagnosticDecoration, LinkedEditingRect, BracketHighlightRect, GutterIconRenderItem, FoldMarkerRenderItem, ScrollbarModel, ScrollbarRect, GestureResult, HitTarget, TextPosition, TextRange, LayoutMetrics, ScrollMetrics } from './types/EditorTypes';
export declare class ProtocolDecoder {
    private dataView;
    private offset;
    private textDecoder;
    constructor(buffer: ArrayBuffer | Uint8Array);
    get remaining(): number;
    readInt8(): number;
    readUInt8(): number;
    readInt16(): number;
    readUInt16(): number;
    readInt32(): number;
    readUInt32(): number;
    readInt64(): bigint;
    readUInt64(): bigint;
    readFloat32(): number;
    readFloat64(): number;
    readBool(): boolean;
    readString(): string;
    readPoint(): {
        x: number;
        y: number;
    };
    readTextPosition(): TextPosition;
    readTextRange(): TextRange;
    readTextStyle(): {
        fontStyle: number;
        color: number;
        backgroundColor: number;
    };
    readVisualRun(): VisualRun;
    readVisualLine(): VisualLine;
    readCursor(): Cursor;
    readSelectionRect(): SelectionRect;
    readSelectionHandle(): SelectionHandle;
    readCompositionDecoration(): CompositionDecoration;
    readGuideSegment(): GuideSegment;
    readDiagnosticDecoration(): DiagnosticDecoration;
    readLinkedEditingRect(): LinkedEditingRect;
    readBracketHighlightRect(): BracketHighlightRect;
    readGutterIconRenderItem(): GutterIconRenderItem;
    readFoldMarkerRenderItem(): FoldMarkerRenderItem;
    readScrollbarRect(): ScrollbarRect;
    readScrollbarModel(): ScrollbarModel;
    readEditorRenderModel(): EditorRenderModel;
    readHitTarget(): HitTarget;
    readGestureResult(): GestureResult;
    readLayoutMetrics(): LayoutMetrics;
    readScrollMetrics(): ScrollMetrics;
}
//# sourceMappingURL=ProtocolDecoder.d.ts.map