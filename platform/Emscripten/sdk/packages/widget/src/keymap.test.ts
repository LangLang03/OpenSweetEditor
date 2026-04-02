import { describe, expect, it, vi } from "vitest";
import { EditorCommand, KeyCode, KeyModifier } from "@sweeteditor/core";
import { EditorKeyMap, defaultKeyMap, vscode } from "./keymap.js";

describe("EditorKeyMap", () => {
  it("keeps defaultKeyMap and vscode factories equivalent", () => {
    const fromDefault = defaultKeyMap();
    const fromVscode = vscode();
    expect(fromDefault.toKeyMap()).toEqual(fromVscode.toKeyMap());
  });

  it("allocates custom command ids for registerCommand", () => {
    const map = new EditorKeyMap();
    const handler = vi.fn();

    const commandId = map.registerCommand({
      first: { modifiers: KeyModifier.CTRL, keyCode: KeyCode.D },
      second: { modifiers: KeyModifier.NONE, keyCode: KeyCode.NONE },
      command: EditorCommand.NONE,
    }, handler);

    expect(commandId).toBeGreaterThan(EditorCommand.BUILT_IN_MAX);
    expect(map.getCommandHandler(commandId)).toBe(handler);

    const resolved = map.resolve({ modifiers: KeyModifier.CTRL, keyCode: KeyCode.D });
    expect(resolved.status).toBe("matched");
    expect(resolved.command).toBe(commandId);
  });

  it("supports two-chord bindings", () => {
    const map = new EditorKeyMap({
      bindings: [
        {
          first: { modifiers: KeyModifier.CTRL, keyCode: KeyCode.K },
          second: { modifiers: KeyModifier.CTRL, keyCode: KeyCode.C },
          command: EditorCommand.COPY,
        },
      ],
    });

    const first = map.resolve({ modifiers: KeyModifier.CTRL, keyCode: KeyCode.K });
    expect(first.status).toBe("pending");

    const second = map.resolve({ modifiers: KeyModifier.CTRL, keyCode: KeyCode.C });
    expect(second.status).toBe("matched");
    expect(second.command).toBe(EditorCommand.COPY);
  });
});
