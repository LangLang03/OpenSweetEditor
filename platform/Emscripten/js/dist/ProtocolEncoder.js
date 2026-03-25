export class ProtocolEncoder {
    constructor(initialSize = 1024) {
        this.offset = 0;
        this.buffer = new ArrayBuffer(initialSize);
        this.view = new DataView(this.buffer);
        this.textEncoder = new TextEncoder();
    }
    ensureCapacity(bytes) {
        const required = this.offset + bytes;
        if (required > this.buffer.byteLength) {
            const newSize = Math.max(required, this.buffer.byteLength * 2);
            const newBuffer = new ArrayBuffer(newSize);
            new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
            this.buffer = newBuffer;
            this.view = new DataView(this.buffer);
        }
    }
    writeInt8(value) {
        this.ensureCapacity(1);
        this.view.setInt8(this.offset, value);
        this.offset += 1;
    }
    writeUInt8(value) {
        this.ensureCapacity(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }
    writeInt16(value) {
        this.ensureCapacity(2);
        this.view.setInt16(this.offset, value, true);
        this.offset += 2;
    }
    writeUInt16(value) {
        this.ensureCapacity(2);
        this.view.setUint16(this.offset, value, true);
        this.offset += 2;
    }
    writeInt32(value) {
        this.ensureCapacity(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }
    writeUInt32(value) {
        this.ensureCapacity(4);
        this.view.setUint32(this.offset, value, true);
        this.offset += 4;
    }
    writeInt64(value) {
        this.ensureCapacity(8);
        this.view.setBigInt64(this.offset, BigInt(value), true);
        this.offset += 8;
    }
    writeUInt64(value) {
        this.ensureCapacity(8);
        this.view.setBigUint64(this.offset, BigInt(value), true);
        this.offset += 8;
    }
    writeFloat32(value) {
        this.ensureCapacity(4);
        this.view.setFloat32(this.offset, value, true);
        this.offset += 4;
    }
    writeFloat64(value) {
        this.ensureCapacity(8);
        this.view.setFloat64(this.offset, value, true);
        this.offset += 8;
    }
    writeBool(value) {
        this.writeInt32(value ? 1 : 0);
    }
    writeString(value) {
        const bytes = this.textEncoder.encode(value);
        this.writeInt32(bytes.length);
        if (bytes.length > 0) {
            this.ensureCapacity(bytes.length);
            new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
            this.offset += bytes.length;
        }
    }
    writePoint(x, y) {
        this.writeFloat32(x);
        this.writeFloat32(y);
    }
    writeTextPosition(line, column) {
        this.writeUInt64(line);
        this.writeUInt64(column);
    }
    writeTextRange(range) {
        this.writeTextPosition(range.start.line, range.start.column);
        this.writeTextPosition(range.end.line, range.end.column);
    }
    getBuffer() {
        return this.buffer.slice(0, this.offset);
    }
    getBytes() {
        return new Uint8Array(this.buffer, 0, this.offset);
    }
    reset() {
        this.offset = 0;
    }
    static encodeEditorOptions(options) {
        const encoder = new ProtocolEncoder(64);
        encoder.writeFloat32(options.touchSlop ?? 10);
        encoder.writeInt64(options.doubleTapTimeout ?? 300);
        encoder.writeInt64(options.longPressMs ?? 500);
        encoder.writeInt64(options.maxUndoStackSize ?? 100);
        return encoder.getBytes();
    }
    static encodeLineSpans(line, layer, spans) {
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
    static encodeInlayHints(line, hints) {
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
    static encodeGutterIcons(line, icons) {
        const encoder = new ProtocolEncoder(16 + icons.length * 8);
        encoder.writeUInt64(line);
        encoder.writeInt32(icons.length);
        for (const icon of icons) {
            encoder.writeInt32(icon.iconId);
            encoder.writeInt32(icon.position);
        }
        return encoder.getBytes();
    }
    static encodeFoldRegions(regions) {
        const encoder = new ProtocolEncoder(4 + regions.length * 17);
        encoder.writeInt32(regions.length);
        for (const region of regions) {
            encoder.writeUInt64(region.startLine);
            encoder.writeUInt64(region.endLine);
            encoder.writeBool(region.collapsed);
        }
        return encoder.getBytes();
    }
    static encodeDiagnostic(line, diagnostics) {
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
    static encodeGuideSegments(segments) {
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
    static encodeLinkedEditingRanges(ranges) {
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
//# sourceMappingURL=ProtocolEncoder.js.map