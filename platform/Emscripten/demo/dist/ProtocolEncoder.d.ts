import { EditorOptions, TextRange } from './types/EditorTypes';
export declare class ProtocolEncoder {
    private buffer;
    private view;
    private offset;
    private textEncoder;
    constructor(initialSize?: number);
    private ensureCapacity;
    writeInt8(value: number): void;
    writeUInt8(value: number): void;
    writeInt16(value: number): void;
    writeUInt16(value: number): void;
    writeInt32(value: number): void;
    writeUInt32(value: number): void;
    writeInt64(value: bigint | number): void;
    writeUInt64(value: bigint | number): void;
    writeFloat32(value: number): void;
    writeFloat64(value: number): void;
    writeBool(value: boolean): void;
    writeString(value: string): void;
    writePoint(x: number, y: number): void;
    writeTextPosition(line: number, column: number): void;
    writeTextRange(range: TextRange): void;
    getBuffer(): ArrayBuffer;
    getBytes(): Uint8Array;
    reset(): void;
    static encodeEditorOptions(options: EditorOptions): Uint8Array;
    static encodeLineSpans(line: number, layer: number, spans: Array<{
        startColumn: number;
        endColumn: number;
        styleId: number;
    }>): Uint8Array;
    static encodeInlayHints(line: number, hints: Array<{
        column: number;
        text?: string;
        iconId?: number;
        colorValue?: number;
        position: number;
    }>): Uint8Array;
    static encodeGutterIcons(line: number, icons: Array<{
        iconId: number;
        position: number;
    }>): Uint8Array;
    static encodeFoldRegions(regions: Array<{
        startLine: number;
        endLine: number;
        collapsed: boolean;
    }>): Uint8Array;
    static encodeDiagnostic(line: number, diagnostics: Array<{
        startColumn: number;
        endColumn: number;
        severity: number;
        message: string;
        color: number;
    }>): Uint8Array;
    static encodeGuideSegments(segments: Array<{
        direction: number;
        type: number;
        style: number;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
        arrowEnd: boolean;
    }>): Uint8Array;
    static encodeLinkedEditingRanges(ranges: Array<{
        line: number;
        startColumn: number;
        endColumn: number;
    }>): Uint8Array;
}
//# sourceMappingURL=ProtocolEncoder.d.ts.map