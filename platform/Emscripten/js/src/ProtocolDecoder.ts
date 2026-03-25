import {
    EditorRenderModel,
    VisualLine,
    VisualRun,
    VisualRunType,
    Cursor,
    SelectionRect,
    SelectionHandle,
    CompositionDecoration,
    GuideSegment,
    GuideDirection,
    GuideType,
    GuideStyle,
    DiagnosticDecoration,
    LinkedEditingRect,
    BracketHighlightRect,
    GutterIconRenderItem,
    FoldMarkerRenderItem,
    FoldState,
    ScrollbarModel,
    ScrollbarRect,
    CurrentLineRenderMode,
    GestureResult,
    GestureType,
    HitTarget,
    HitTargetType,
    TextPosition,
    TextRange,
    LayoutMetrics,
    FoldArrowMode,
    ScrollMetrics,
} from './types/EditorTypes';

export class ProtocolDecoder {
    private dataView: DataView;
    private offset: number = 0;
    private textDecoder: TextDecoder;

    constructor(buffer: ArrayBuffer | Uint8Array) {
        if (buffer instanceof Uint8Array) {
            this.dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } else {
            this.dataView = new DataView(buffer);
        }
        this.textDecoder = new TextDecoder('utf-8');
    }

    get remaining(): number {
        return this.dataView.byteLength - this.offset;
    }

    readInt8(): number {
        const val = this.dataView.getInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readUInt8(): number {
        const val = this.dataView.getUint8(this.offset);
        this.offset += 1;
        return val;
    }

    readInt16(): number {
        const val = this.dataView.getInt16(this.offset, true);
        this.offset += 2;
        return val;
    }

    readUInt16(): number {
        const val = this.dataView.getUint16(this.offset, true);
        this.offset += 2;
        return val;
    }

    readInt32(): number {
        const val = this.dataView.getInt32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readUInt32(): number {
        const val = this.dataView.getUint32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readInt64(): bigint {
        const val = this.dataView.getBigInt64(this.offset, true);
        this.offset += 8;
        return val;
    }

    readUInt64(): bigint {
        const val = this.dataView.getBigUint64(this.offset, true);
        this.offset += 8;
        return val;
    }

    readFloat32(): number {
        const val = this.dataView.getFloat32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readFloat64(): number {
        const val = this.dataView.getFloat64(this.offset, true);
        this.offset += 8;
        return val;
    }

    readBool(): boolean {
        return this.readInt32() !== 0;
    }

    readString(): string {
        const len = this.readInt32();
        if (len <= 0) return '';
        const bytes = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, len);
        this.offset += len;
        return this.textDecoder.decode(bytes);
    }

    readPoint(): { x: number; y: number } {
        const x = this.readFloat32();
        const y = this.readFloat32();
        return { x, y };
    }

    readTextPosition(): TextPosition {
        const line = Number(this.readUInt64());
        const column = Number(this.readUInt64());
        return { line, column };
    }

    readTextRange(): TextRange {
        const start = this.readTextPosition();
        const end = this.readTextPosition();
        return { start, end };
    }

    readTextStyle(): { fontStyle: number; color: number; backgroundColor: number } {
        const fontStyle = this.readInt32();
        const color = this.readInt32();
        const backgroundColor = this.readInt32();
        return { fontStyle, color, backgroundColor };
    }

    readVisualRun(): VisualRun {
        const type = this.readInt32() as VisualRunType;
        const column = Number(this.readUInt64());
        const length = Number(this.readUInt64());
        const x = this.readFloat32();
        const y = this.readFloat32();
        const text = this.readString();
        const style = this.readTextStyle();
        const iconId = this.readInt32();
        const colorValue = this.readInt32();
        const width = this.readFloat32();
        const padding = this.readFloat32();
        const margin = this.readFloat32();
        return { type, column, length, x, y, text, style, iconId, colorValue, width, padding, margin };
    }

    readVisualLine(): VisualLine {
        const logicalLine = Number(this.readUInt64());
        const wrapIndex = Number(this.readUInt64());
        const lineNumberPosition = this.readPoint();
        const runsCount = this.readInt32();
        const runs: VisualRun[] = [];
        for (let i = 0; i < runsCount; i++) {
            runs.push(this.readVisualRun());
        }
        const isPhantomLine = this.readBool();
        const foldState = this.readInt32() as FoldState;
        return { logicalLine, wrapIndex, lineNumberPosition, runs, isPhantomLine, foldState };
    }

    readCursor(): Cursor {
        const textPosition = this.readTextPosition();
        const position = this.readPoint();
        const height = this.readFloat32();
        const visible = this.readBool();
        const showDragger = this.readBool();
        return { textPosition, position, height, visible, showDragger };
    }

    readSelectionRect(): SelectionRect {
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { origin, width, height };
    }

    readSelectionHandle(): SelectionHandle {
        const position = this.readPoint();
        const height = this.readFloat32();
        const visible = this.readBool();
        return { position, height, visible };
    }

    readCompositionDecoration(): CompositionDecoration {
        const active = this.readBool();
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { active, origin, width, height };
    }

    readGuideSegment(): GuideSegment {
        const direction = this.readInt32() as GuideDirection;
        const type = this.readInt32() as GuideType;
        const style = this.readInt32() as GuideStyle;
        const start = this.readPoint();
        const end = this.readPoint();
        const arrowEnd = this.readBool();
        return { direction, type, style, start, end, arrowEnd };
    }

    readDiagnosticDecoration(): DiagnosticDecoration {
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        const severity = this.readInt32();
        const color = this.readInt32();
        return { origin, width, height, severity, color };
    }

    readLinkedEditingRect(): LinkedEditingRect {
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        const isActive = this.readBool();
        return { origin, width, height, isActive };
    }

    readBracketHighlightRect(): BracketHighlightRect {
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { origin, width, height };
    }

    readGutterIconRenderItem(): GutterIconRenderItem {
        const logicalLine = Number(this.readUInt64());
        const iconId = this.readInt32();
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { logicalLine, iconId, origin, width, height };
    }

    readFoldMarkerRenderItem(): FoldMarkerRenderItem {
        const logicalLine = Number(this.readUInt64());
        const foldState = this.readInt32() as FoldState;
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { logicalLine, foldState, origin, width, height };
    }

    readScrollbarRect(): ScrollbarRect {
        const origin = this.readPoint();
        const width = this.readFloat32();
        const height = this.readFloat32();
        return { origin, width, height };
    }

    readScrollbarModel(): ScrollbarModel {
        const visible = this.readBool();
        const alpha = this.readFloat32();
        const track = this.readScrollbarRect();
        const thumb = this.readScrollbarRect();
        return { visible, alpha, track, thumb };
    }

    readEditorRenderModel(): EditorRenderModel {
        const splitX = this.readFloat32();
        const splitLineVisible = this.readBool();
        const scrollX = this.readFloat32();
        const scrollY = this.readFloat32();
        const viewportWidth = this.readFloat32();
        const viewportHeight = this.readFloat32();
        const currentLine = this.readPoint();
        const currentLineRenderMode = this.readInt32() as CurrentLineRenderMode;

        const linesCount = this.readInt32();
        const lines: VisualLine[] = [];
        for (let i = 0; i < linesCount; i++) {
            lines.push(this.readVisualLine());
        }

        const cursor = this.readCursor();

        const selectionRectsCount = this.readInt32();
        const selectionRects: SelectionRect[] = [];
        for (let i = 0; i < selectionRectsCount; i++) {
            selectionRects.push(this.readSelectionRect());
        }

        const selectionStartHandle = this.readSelectionHandle();
        const selectionEndHandle = this.readSelectionHandle();
        const compositionDecoration = this.readCompositionDecoration();

        const guideSegmentsCount = this.readInt32();
        const guideSegments: GuideSegment[] = [];
        for (let i = 0; i < guideSegmentsCount; i++) {
            guideSegments.push(this.readGuideSegment());
        }

        const diagnosticDecorationsCount = this.readInt32();
        const diagnosticDecorations: DiagnosticDecoration[] = [];
        for (let i = 0; i < diagnosticDecorationsCount; i++) {
            diagnosticDecorations.push(this.readDiagnosticDecoration());
        }

        const maxGutterIcons = this.readUInt32();

        const linkedEditingRectsCount = this.readInt32();
        const linkedEditingRects: LinkedEditingRect[] = [];
        for (let i = 0; i < linkedEditingRectsCount; i++) {
            linkedEditingRects.push(this.readLinkedEditingRect());
        }

        const bracketHighlightRectsCount = this.readInt32();
        const bracketHighlightRects: BracketHighlightRect[] = [];
        for (let i = 0; i < bracketHighlightRectsCount; i++) {
            bracketHighlightRects.push(this.readBracketHighlightRect());
        }

        const gutterIconsCount = this.readInt32();
        const gutterIcons: GutterIconRenderItem[] = [];
        for (let i = 0; i < gutterIconsCount; i++) {
            gutterIcons.push(this.readGutterIconRenderItem());
        }

        const foldMarkersCount = this.readInt32();
        const foldMarkers: FoldMarkerRenderItem[] = [];
        for (let i = 0; i < foldMarkersCount; i++) {
            foldMarkers.push(this.readFoldMarkerRenderItem());
        }

        const verticalScrollbar = this.readScrollbarModel();
        const horizontalScrollbar = this.readScrollbarModel();

        return {
            splitX,
            splitLineVisible,
            scrollX,
            scrollY,
            viewportWidth,
            viewportHeight,
            currentLine,
            currentLineRenderMode,
            lines,
            cursor,
            selectionRects,
            selectionStartHandle,
            selectionEndHandle,
            compositionDecoration,
            guideSegments,
            diagnosticDecorations,
            maxGutterIcons,
            linkedEditingRects,
            bracketHighlightRects,
            gutterIcons,
            foldMarkers,
            verticalScrollbar,
            horizontalScrollbar,
        };
    }

    readHitTarget(): HitTarget {
        const type = this.readInt32() as HitTargetType;
        const line = Number(this.readUInt64());
        const column = Number(this.readUInt64());
        const iconId = this.readInt32();
        const colorValue = this.readInt32();
        return { type, line, column, iconId, colorValue };
    }

    readGestureResult(): GestureResult {
        const type = this.readInt32() as GestureType;
        const tapPoint = this.readPoint();
        const scale = this.readFloat32();
        const scrollX = this.readFloat32();
        const scrollY = this.readFloat32();
        const modifiers = this.readInt32();
        const cursorPosition = this.readTextPosition();
        const hasSelection = this.readBool();
        const selection = this.readTextRange();
        const viewScrollX = this.readFloat32();
        const viewScrollY = this.readFloat32();
        const viewScale = this.readFloat32();
        const hitTarget = this.readHitTarget();
        const needsEdgeScroll = this.readBool();
        return {
            type,
            tapPoint,
            scale,
            scrollX,
            scrollY,
            modifiers,
            cursorPosition,
            hasSelection,
            selection,
            viewScrollX,
            viewScrollY,
            viewScale,
            hitTarget,
            needsEdgeScroll,
        };
    }

    readLayoutMetrics(): LayoutMetrics {
        const fontHeight = this.readFloat32();
        const fontAscent = this.readFloat32();
        const lineSpacingAdd = this.readFloat32();
        const lineSpacingMult = this.readFloat32();
        const lineNumberMargin = this.readFloat32();
        const lineNumberWidth = this.readFloat32();
        const contentStartPadding = this.readFloat32();
        const maxGutterIcons = this.readUInt32();
        const inlayHintPadding = this.readFloat32();
        const inlayHintMargin = this.readFloat32();
        const foldArrowMode = this.readInt32() as FoldArrowMode;
        const hasFoldRegions = this.readBool();
        return {
            fontHeight,
            fontAscent,
            lineSpacingAdd,
            lineSpacingMult,
            lineNumberMargin,
            lineNumberWidth,
            contentStartPadding,
            maxGutterIcons,
            inlayHintPadding,
            inlayHintMargin,
            foldArrowMode,
            hasFoldRegions,
        };
    }

    readScrollMetrics(): ScrollMetrics {
        const scale = this.readFloat32();
        const scrollX = this.readFloat32();
        const scrollY = this.readFloat32();
        const maxScrollX = this.readFloat32();
        const maxScrollY = this.readFloat32();
        const contentWidth = this.readFloat32();
        const contentHeight = this.readFloat32();
        const viewportWidth = this.readFloat32();
        const viewportHeight = this.readFloat32();
        const textAreaX = this.readFloat32();
        const textAreaWidth = this.readFloat32();
        const canScrollX = this.readBool();
        const canScrollY = this.readBool();
        return {
            scale,
            scrollX,
            scrollY,
            maxScrollX,
            maxScrollY,
            contentWidth,
            contentHeight,
            viewportWidth,
            viewportHeight,
            textAreaX,
            textAreaWidth,
            canScrollX,
            canScrollY,
        };
    }
}
