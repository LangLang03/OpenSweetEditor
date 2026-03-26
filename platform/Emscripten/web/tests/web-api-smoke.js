import { EditorEventType } from "../index.js?v=20260326_11";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function getPixel(ctx, x, y) {
  const sampleX = Math.max(0, Math.floor(x));
  const sampleY = Math.max(0, Math.floor(y));
  const data = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  return {
    r: data[0],
    g: data[1],
    b: data[2],
    a: data[3],
  };
}

function pixelNotBackground(pixel, threshold = 12) {
  return pixel.a > 0 && (pixel.r > threshold || pixel.g > threshold || pixel.b > threshold);
}

export async function runWebApiSmoke(editor) {
  assert(editor && typeof editor === "object", "editor instance is required");

  const requiredMethods = [
    "insert",
    "replace",
    "delete",
    "undo",
    "redo",
    "setSelection",
    "setCursorPosition",
    "gotoPosition",
    "setScroll",
    "toggleFoldAt",
    "insertSnippet",
    "clearAllDecorations",
    "setLineInlayHints",
    "setBatchLineInlayHints",
    "setLineGutterIcons",
    "setBatchLineGutterIcons",
    "setLineDiagnostics",
    "setBatchLineDiagnostics",
    "setIndentGuides",
    "setFoldRegions",
    "subscribe",
    "unsubscribe",
    "getSettings",
    "applyTheme",
    "getTheme",
    "setEditorIconProvider",
  ];
  requiredMethods.forEach((name) => {
    assert(typeof editor[name] === "function", `missing method: ${name}`);
  });

  const eventCounters = Object.create(null);
  const subs = [];
  Object.values(EditorEventType).forEach((eventType) => {
    eventCounters[eventType] = 0;
    subs.push(editor.subscribe(eventType, () => {
      eventCounters[eventType] += 1;
    }));
  });

  editor.loadText("alpha\nbeta\ngamma");
  editor.insert("!");
  editor.undo();
  editor.redo();
  editor.setSelection(0, 0, 0, 2);
  editor.clearSelection();
  editor.setScroll(0, 60);
  editor.setScale(1.1);
  editor.setFoldRegions([{ startLine: 0, endLine: 1, collapsed: false }]);
  editor.toggleFoldAt(0);
  editor.toggleFoldAt(0);

  editor.setEditorIconProvider((iconId) => {
    if (iconId === 2001) return { color: 0xFFFFD166 };
    if (iconId === 3001) return { color: 0xFFFF5A5F };
    return { color: 0xFF9CA3AF };
  });
  editor.setLineGutterIcons(0, [{ iconId: 2001 }]);
  editor.setLineInlayHints(0, [
    { type: 1, column: 1, iconId: 3001 },
    { type: 2, column: 2, color: 0xFF34D399 },
  ]);
  editor.setLineDiagnostics(0, [{ column: 0, length: 2, severity: 0, color: 0 }]);

  await waitFrame();
  await waitFrame();

  const container = editor.container;
  const canvas = container.querySelector("canvas");
  assert(!!canvas, "canvas not found");
  const ctx = canvas.getContext("2d");
  assert(!!ctx, "2d context not found");

  const model = editor.getCore().buildRenderModel();
  assert(!!model, "render model unavailable");

  let gutterSampleOk = false;
  const gutterIcons = model.gutter_icons;
  if (gutterIcons && typeof gutterIcons.size === "function" && gutterIcons.size() > 0) {
    const first = gutterIcons.get(0);
    const px = getPixel(
      ctx,
      (Number(first.origin?.x) || 0) + (Number(first.width) || 0) * 0.5,
      (Number(first.origin?.y) || 0) + (Number(first.height) || 0) * 0.5,
    );
    gutterSampleOk = pixelNotBackground(px);
  }

  let inlayColorSampleOk = false;
  const lines = model.lines;
  if (lines && typeof lines.size === "function" && lines.size() > 0) {
    for (let i = 0; i < lines.size() && !inlayColorSampleOk; i += 1) {
      const line = lines.get(i);
      const runs = line?.runs;
      if (!runs || typeof runs.size !== "function") continue;
      for (let j = 0; j < runs.size(); j += 1) {
        const run = runs.get(j);
        if (Number(run?.type) === 3 && Number(run?.color_value) !== 0) {
          const px = getPixel(
            ctx,
            (Number(run.x) || 0) + Math.max(1, (Number(run.width) || 0) * 0.25),
            (Number(run.y) || 0),
          );
          inlayColorSampleOk = pixelNotBackground(px);
          break;
        }
      }
    }
  }

  subs.forEach((dispose) => dispose());

  assert(eventCounters[EditorEventType.TEXT_CHANGED] > 0, "TextChanged not fired");
  assert(eventCounters[EditorEventType.CURSOR_CHANGED] > 0, "CursorChanged not fired");
  assert(eventCounters[EditorEventType.SELECTION_CHANGED] > 0, "SelectionChanged not fired");
  assert(eventCounters[EditorEventType.SCROLL_CHANGED] > 0, "ScrollChanged not fired");
  assert(eventCounters[EditorEventType.SCALE_CHANGED] > 0, "ScaleChanged not fired");
  assert(gutterSampleOk, "gutter icon render sample failed");
  assert(inlayColorSampleOk, "inlay color render sample failed");

  return {
    ok: true,
    events: eventCounters,
    render: {
      gutterSampleOk,
      inlayColorSampleOk,
    },
  };
}

