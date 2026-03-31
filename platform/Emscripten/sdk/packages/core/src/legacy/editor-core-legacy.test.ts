import { describe, expect, it } from "vitest";

import { WebEditorCore } from "./editor-core-legacy.js";

class FakeNativeEditorCore {
  lastDeleteRange: Record<string, unknown> | null = null;
  lastReplaceRange: { range: Record<string, unknown>; newText: string } | null = null;

  constructor(_textMeasurerCallbacks: Record<string, unknown>, _options: Record<string, unknown>) {}

  deleteText(range: Record<string, unknown>) {
    this.lastDeleteRange = range;
    return { changed: true, changes: [] };
  }

  replaceText(range: Record<string, unknown>, newText: string) {
    this.lastReplaceRange = { range, newText };
    return { changed: true, changes: [] };
  }
}

function createCore() {
  const wasmModule = {
    EditorCore: FakeNativeEditorCore,
  };
  const core = new WebEditorCore(wasmModule, {});
  return {
    core,
    native: core.getNative() as unknown as FakeNativeEditorCore,
  };
}

describe("WebEditorCore edit range normalization", () => {
  it("normalizes reversed range before delete", () => {
    const { core, native } = createCore();
    core.deleteText({
      start: { line: 4, column: 8 },
      end: { line: 2, column: 3 },
    });

    expect(native.lastDeleteRange).toEqual({
      start: { line: 2, column: 3 },
      end: { line: 4, column: 8 },
    });
  });

  it("keeps forward range for delete", () => {
    const { core, native } = createCore();
    core.deleteText({
      start: { line: 1, column: 0 },
      end: { line: 1, column: 5 },
    });

    expect(native.lastDeleteRange).toEqual({
      start: { line: 1, column: 0 },
      end: { line: 1, column: 5 },
    });
  });

  it("normalizes reversed range before replace", () => {
    const { core, native } = createCore();
    core.replaceText({
      start: { line: 3, column: 7 },
      end: { line: 0, column: 2 },
    }, "X");

    expect(native.lastReplaceRange).toEqual({
      range: {
        start: { line: 0, column: 2 },
        end: { line: 3, column: 7 },
      },
      newText: "X",
    });
  });
});
