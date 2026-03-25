export class Document {
  constructor(nativeDocument, kind) {
    if (new.target === Document) {
      throw new TypeError("Document is abstract. Use DocumentFactory.");
    }
    this._native = nativeDocument;
    this.kind = kind;
  }

  getNative() {
    return this._native;
  }

  getText() {
    return this._native.getU8Text();
  }

  getLineCount() {
    return this._native.getLineCount();
  }

  getLineText(line) {
    return this._native.getLineU16Text(line);
  }

  getPositionFromCharIndex(charIndex) {
    return this._native.getPositionFromCharIndex(charIndex);
  }

  getCharIndexFromPosition(position) {
    return this._native.getCharIndexFromPosition(position);
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }
}

class PieceTableDocumentImpl extends Document {
  constructor(nativeDocument) {
    super(nativeDocument, "piece-table");
  }
}

class LineArrayDocumentImpl extends Document {
  constructor(nativeDocument) {
    super(nativeDocument, "line-array");
  }
}

export class DocumentFactory {
  constructor(wasmModule) {
    this._wasm = wasmModule;
  }

  fromText(text, options = {}) {
    const kind = options.kind || "piece-table";
    if (kind === "line-array") {
      return this.fromLineArray(text);
    }
    return this.fromPieceTable(text);
  }

  fromPieceTable(text) {
    return new PieceTableDocumentImpl(new this._wasm.PieceTableDocument(text || ""));
  }

  fromLineArray(text) {
    return new LineArrayDocumentImpl(new this._wasm.LineArrayDocument(text || ""));
  }
}
