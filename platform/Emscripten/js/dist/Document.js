export class Document {
    constructor(module, handle) {
        this.module = module;
        this.handle = handle;
    }
    static createFromText(module, text) {
        const handle = module.createDocumentFromUtf8(text);
        return new Document(module, handle);
    }
    static createFromFile(module, path) {
        const handle = module.createDocumentFromFile(path);
        if (handle === 0)
            return null;
        return new Document(module, handle);
    }
    getHandle() {
        return this.handle;
    }
    getText() {
        return this.module.getDocumentText(this.handle);
    }
    getLineCount() {
        return this.module.getDocumentLineCount(this.handle);
    }
    getLineText(line) {
        return this.module.getDocumentLineText(this.handle, line);
    }
    dispose() {
        if (this.handle !== 0) {
            this.module.freeDocument(this.handle);
            this.handle = 0;
        }
    }
}
//# sourceMappingURL=Document.js.map