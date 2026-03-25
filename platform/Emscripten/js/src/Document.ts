export class Document {
    private handle: number;
    private module: any;

    constructor(module: any, handle: number) {
        this.module = module;
        this.handle = handle;
    }

    static createFromText(module: any, text: string): Document {
        const handle = module.createDocumentFromUtf8(text);
        return new Document(module, handle);
    }

    static createFromFile(module: any, path: string): Document | null {
        const handle = module.createDocumentFromFile(path);
        if (handle === 0) return null;
        return new Document(module, handle);
    }

    getHandle(): number {
        return this.handle;
    }

    getText(): string {
        return this.module.getDocumentText(this.handle);
    }

    getLineCount(): number {
        return this.module.getDocumentLineCount(this.handle);
    }

    getLineText(line: number): string {
        return this.module.getDocumentLineText(this.handle, line);
    }

    dispose(): void {
        if (this.handle !== 0) {
            this.module.freeDocument(this.handle);
            this.handle = 0;
        }
    }
}
