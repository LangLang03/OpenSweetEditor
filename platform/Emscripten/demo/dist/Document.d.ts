export declare class Document {
    private handle;
    private module;
    constructor(module: any, handle: number);
    static createFromText(module: any, text: string): Document;
    static createFromFile(module: any, path: string): Document | null;
    getHandle(): number;
    getText(): string;
    getLineCount(): number;
    getLineText(line: number): string;
    dispose(): void;
}
//# sourceMappingURL=Document.d.ts.map