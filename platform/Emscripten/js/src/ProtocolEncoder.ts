import { EditorOptions, TextRange } from './types/EditorTypes';

export class ProtocolEncoder {
    private buffer: ArrayBuffer;
    private view: DataView;
    private offset: number = 0;
    private textEncoder: TextEncoder;

    constructor(initialSize: number = 1024) {
        this.buffer = new ArrayBuffer(initialSize);
        this.view = new DataView(this.buffer);
        this.textEncoder = new TextEncoder();
    }

    private ensureCapacity(bytes: number): void {
        const required = this.offset + bytes;
        if (required > this.buffer.byteLength) {
            const newSize = Math.max(required, this.buffer.byteLength * 2);
            const newBuffer = new ArrayBuffer(newSize);
            new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
            this.buffer = newBuffer;
            this.view = new DataView(this.buffer);
        }
    }

    writeInt8(value: number): void {
        this.ensureCapacity(1);
        this.view.setInt8(this.offset, value);
        this.offset += 1;
    }

    writeUInt8(value: number): void {
        this.ensureCapacity(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }

    writeInt16(value: number): void {
        this.ensureCapacity(2);
        this.view.setInt16(this.offset, value, true);
        this.offset += 2;
    }

    writeUInt16(value: number): void {
        this.ensureCapacity(2);
        this.view.setUint16(this.offset, value, true);
        this.offset += 2;
    }

    writeInt32(value: number): void {
        this.ensureCapacity(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }

    writeUInt32(value: number): void {
        this.ensureCapacity(4);
        this.view.setUint32(this.offset, value, true);
        this.offset += 4;
    }

    writeInt64(value: bigint | number): void {
        this.ensureCapacity(8);
        this.view.setBigInt64(this.offset, BigInt(value), true);
        this.offset += 8;
    }

    writeUInt64(value: bigint | number): void {
        this.ensureCapacity(8);
        this.view.setBigUint64(this.offset, BigInt(value), true);
        this.offset += 8;
    }

    writeFloat32(value: number): void {
        this.ensureCapacity(4);
        this.view.setFloat32(this.offset, value, true);
        this.offset += 4;
    }

    writeFloat64(value: number): void {
        this.ensureCapacity(8);
        this.view.setFloat64(this.offset, value, true);
        this.offset += 8;
    }

    writeBool(value: boolean): void {
        this.writeInt32(value ? 1 : 0);
    }

    writeString(value: string): void {
        const bytes = this.textEncoder.encode(value);
        this.writeInt32(bytes.length);
        if (bytes.length > 0) {
            this.ensureCapacity(bytes.length);
            new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
            this.offset += bytes.length;
        }
    }

    writePoint(x: number, y: number): void {
        this.writeFloat32(x);
        this.writeFloat32(y);
    }

    writeTextPosition(line: number, column: number): void {
        this.writeUInt64(line);
        this.writeUInt64(column);
    }

    writeTextRange(range: TextRange): void {
        this.writeTextPosition(range.start.line, range.start.column);
        this.writeTextPosition(range.end.line, range.end.column);
    }

    getBuffer(): ArrayBuffer {
        return this.buffer.slice(0, this.offset);
    }

    getBytes(): Uint8Array {
        return new Uint8Array(this.buffer, 0, this.offset);
    }

    reset(): void {
        this.offset = 0;
    }

    static encodeEditorOptions(options: EditorOptions): Uint8Array {
        const encoder = new ProtocolEncoder(64);
        encoder.writeFloat32(options.touchSlop ?? 10);
        encoder.writeInt64(options.doubleTapTimeout ?? 300);
        encoder.writeInt64(options.longPressMs ?? 500);
        encoder.writeInt64(options.maxUndoStackSize ?? 100);
        return encoder.getBytes();
    }

    static encodeLineSpans(
        line: number,
        layer: number,
        spans: Array<{ startColumn: number; endColumn: number; styleId: number }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(16 + spans.length * 24);
        encoder.writeUInt64(line);
        encoder.writeUInt8(layer);
        encoder.writeInt32(spans.length);
        for (const span of spans) {
            encoder.writeUInt64(span.startColumn);
            encoder.writeUInt64(span.endColumn);
            encoder.writeUInt32(span.styleId);
        }
        return encoder.getBytes();
    }

    static encodeInlayHints(
        line: number,
        hints: Array<{
            column: number;
            text?: string;
            iconId?: number;
            colorValue?: number;
            position: number;
        }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(16);
        encoder.writeUInt64(line);
        encoder.writeInt32(hints.length);
        for (const hint of hints) {
            encoder.writeUInt64(hint.column);
            encoder.writeString(hint.text ?? '');
            encoder.writeInt32(hint.iconId ?? 0);
            encoder.writeInt32(hint.colorValue ?? 0);
            encoder.writeInt32(hint.position);
        }
        return encoder.getBytes();
    }

    static encodeGutterIcons(
        line: number,
        icons: Array<{ iconId: number; position: number }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(16 + icons.length * 8);
        encoder.writeUInt64(line);
        encoder.writeInt32(icons.length);
        for (const icon of icons) {
            encoder.writeInt32(icon.iconId);
            encoder.writeInt32(icon.position);
        }
        return encoder.getBytes();
    }

    static encodeFoldRegions(
        regions: Array<{ startLine: number; endLine: number; collapsed: boolean }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(4 + regions.length * 17);
        encoder.writeInt32(regions.length);
        for (const region of regions) {
            encoder.writeUInt64(region.startLine);
            encoder.writeUInt64(region.endLine);
            encoder.writeBool(region.collapsed);
        }
        return encoder.getBytes();
    }

    static encodeDiagnostic(
        line: number,
        diagnostics: Array<{
            startColumn: number;
            endColumn: number;
            severity: number;
            message: string;
            color: number;
        }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(16);
        encoder.writeUInt64(line);
        encoder.writeInt32(diagnostics.length);
        for (const diag of diagnostics) {
            encoder.writeUInt64(diag.startColumn);
            encoder.writeUInt64(diag.endColumn);
            encoder.writeInt32(diag.severity);
            encoder.writeString(diag.message);
            encoder.writeInt32(diag.color);
        }
        return encoder.getBytes();
    }

    static encodeGuideSegments(
        segments: Array<{
            direction: number;
            type: number;
            style: number;
            startLine: number;
            startColumn: number;
            endLine: number;
            endColumn: number;
            arrowEnd: boolean;
        }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(4 + segments.length * 33);
        encoder.writeInt32(segments.length);
        for (const seg of segments) {
            encoder.writeInt32(seg.direction);
            encoder.writeInt32(seg.type);
            encoder.writeInt32(seg.style);
            encoder.writeUInt64(seg.startLine);
            encoder.writeUInt64(seg.startColumn);
            encoder.writeUInt64(seg.endLine);
            encoder.writeUInt64(seg.endColumn);
            encoder.writeBool(seg.arrowEnd);
        }
        return encoder.getBytes();
    }

    static encodeLinkedEditingRanges(
        ranges: Array<{ line: number; startColumn: number; endColumn: number }>
    ): Uint8Array {
        const encoder = new ProtocolEncoder(4 + ranges.length * 24);
        encoder.writeInt32(ranges.length);
        for (const range of ranges) {
            encoder.writeUInt64(range.line);
            encoder.writeUInt64(range.startColumn);
            encoder.writeUInt64(range.endColumn);
        }
        return encoder.getBytes();
    }
}
