import {
  createSweetEditor,
  CompletionItem,
  CompletionResult,
  DecorationApplyMode,
  DecorationTextChangeMode,
  DecorationResultDispatchMode,
  DecorationProviderCallMode,
  DecorationResult,
} from "../index.js?v=20260326_10";
import loadSweetLineModule from "../libs/sweetline/libsweetline.js?v=20260326_10";

const DEMO_FILE_FALLBACKS = Object.freeze({
  "View.java": `package demo;

import android.view.View;

public class DemoView extends View {
    // TODO: replace demo magic color
    private static final int PRIMARY = 0XFF4ADE80;

    public DemoView(android.content.Context context) {
        super(context);
    }

    @Override
    protected void onDraw(android.graphics.Canvas canvas) {
        super.onDraw(canvas);
        if (canvas != null) {
            canvas.drawColor(PRIMARY);
        }
    }
}
`,
  "example.kt": `package demo

class DemoKotlin {
    // FIXME: compute from config
    private val accent = 0XFF60A5FA

    fun greet(name: String): String {
        return "Hello, $name"
    }
}
`,
  "example.lua": `local color = 0XFF34D399
local name = "OpenSweetEditor"

-- TODO: move to config
function greet(user)
  if user == nil then
    return "Hello, " .. name
  end
  return "Hello, " .. user
end
`,
  "nlohmann-json.hpp": `#pragma once
#include <string>
#include <vector>

namespace nlohmann {
class json {
public:
    // TODO: keep this demo header tiny for wasm page responsiveness
    static json parse(const std::string& text);
    bool contains(const std::string& key) const;
    std::string dump(int indent = -1) const;
};
}
`,
});

const STYLE = Object.freeze({
  KEYWORD: 1,
  TYPE: 2,
  STRING: 3,
  COMMENT: 4,
  BUILTIN: 5,
  NUMBER: 6,
  CLASS: 7,
  FUNCTION: 8,
  VARIABLE: 9,
  ANNOTATION: 10,
  PUNCTUATION: 11,
  PREPROCESSOR: 12,
  COLOR: 13,
});

const INLAY_COLOR_TYPE = 2;
const MAX_RENDER_LINES_PER_PASS = 420;
const SYNTAX_JSON_FILES = Object.freeze(["cpp.json", "java.json", "kotlin.json", "lua.json"]);

const MEMBER_COMPLETIONS = Object.freeze({
  cpp: [
    { label: "size", detail: "size_t", kind: CompletionItem.KIND_FUNCTION, insertText: "size()", sortKey: "a_size" },
    { label: "begin", detail: "iterator", kind: CompletionItem.KIND_FUNCTION, insertText: "begin()", sortKey: "b_begin" },
    { label: "end", detail: "iterator", kind: CompletionItem.KIND_FUNCTION, insertText: "end()", sortKey: "c_end" },
    { label: "push_back", detail: "void push_back(T)", kind: CompletionItem.KIND_FUNCTION, insertText: "push_back()", sortKey: "d_push_back" },
  ],
  java: [
    { label: "length", detail: "int", kind: CompletionItem.KIND_PROPERTY, insertText: "length", sortKey: "a_length" },
    { label: "substring", detail: "String substring(int, int)", kind: CompletionItem.KIND_FUNCTION, insertText: "substring()", sortKey: "b_substring" },
    { label: "toString", detail: "String", kind: CompletionItem.KIND_FUNCTION, insertText: "toString()", sortKey: "c_toString" },
    { label: "equals", detail: "boolean equals(Object)", kind: CompletionItem.KIND_FUNCTION, insertText: "equals()", sortKey: "d_equals" },
  ],
  kotlin: [
    { label: "length", detail: "Int", kind: CompletionItem.KIND_PROPERTY, insertText: "length", sortKey: "a_length" },
    { label: "contains", detail: "Boolean contains(CharSequence)", kind: CompletionItem.KIND_FUNCTION, insertText: "contains()", sortKey: "b_contains" },
    { label: "substring", detail: "String", kind: CompletionItem.KIND_FUNCTION, insertText: "substring()", sortKey: "c_substring" },
    { label: "toInt", detail: "Int", kind: CompletionItem.KIND_FUNCTION, insertText: "toInt()", sortKey: "d_toInt" },
  ],
  lua: [
    { label: "len", detail: "number", kind: CompletionItem.KIND_FUNCTION, insertText: "len()", sortKey: "a_len" },
    { label: "sub", detail: "string.sub", kind: CompletionItem.KIND_FUNCTION, insertText: "sub()", sortKey: "b_sub" },
    { label: "upper", detail: "string.upper", kind: CompletionItem.KIND_FUNCTION, insertText: "upper()", sortKey: "c_upper" },
    { label: "lower", detail: "string.lower", kind: CompletionItem.KIND_FUNCTION, insertText: "lower()", sortKey: "d_lower" },
  ],
});

const GLOBAL_COMPLETIONS = Object.freeze({
  cpp: [
    { label: "std::string", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "std::string", sortKey: "a_std_string" },
    { label: "std::vector", detail: "template class", kind: CompletionItem.KIND_CLASS, insertText: "std::vector<>", sortKey: "b_std_vector" },
    { label: "std::cout", detail: "ostream", kind: CompletionItem.KIND_VARIABLE, insertText: "std::cout", sortKey: "c_std_cout" },
    { label: "if", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "if (${1:condition}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_if" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_for" },
    { label: "class", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "class ${1:ClassName} {\npublic:\n\t${1:ClassName}() {$2}\n\t~${1:ClassName}() {$3}\n$0\n};", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "f_class" },
  ],
  java: [
    { label: "String", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "String", sortKey: "a_string" },
    { label: "ArrayList", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "ArrayList<>", sortKey: "b_arraylist" },
    { label: "System.out.println", detail: "method", kind: CompletionItem.KIND_FUNCTION, insertText: "System.out.println($0);", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "c_println" },
    { label: "if", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "if (${1:condition}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_if" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_for" },
  ],
  kotlin: [
    { label: "println", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "println($0)", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "a_println" },
    { label: "mutableListOf", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "mutableListOf()", sortKey: "b_mutable_list" },
    { label: "when", detail: "keyword", kind: CompletionItem.KIND_KEYWORD, insertText: "when (${1:value}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "c_when" },
    { label: "data class", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "data class ${1:Name}(${2:val id: Int})", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_data_class" },
  ],
  lua: [
    { label: "print", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "print($0)", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "a_print" },
    { label: "pairs", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "pairs()", sortKey: "b_pairs" },
    { label: "ipairs", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "ipairs()", sortKey: "c_ipairs" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for ${1:i} = 1, ${2:n} do\n\t$0\nend", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_for" },
    { label: "function", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "function ${1:name}(${2:args})\n\t$0\nend", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_function" },
  ],
});

function normalizeNewlines(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function resolveLanguageKind(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".kt")) return "kotlin";
  if (lower.endsWith(".lua")) return "lua";
  return "cpp";
}

function resolveLanguageConfiguration(fileName) {
  const kind = resolveLanguageKind(fileName);
  if (kind === "lua") {
    return {
      bracketPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
      ],
    };
  }
  return {
    bracketPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "{", close: "}" },
      { open: "\"", close: "\"", autoClose: false, surround: false },
      { open: "'", close: "'", autoClose: false, surround: false },
    ],
  };
}

function clampVisibleRange(start, end, totalLines) {
  const total = Math.max(0, Number(totalLines) | 0);
  if (total <= 0) {
    return { start: 0, end: -1 };
  }

  let s = Math.max(0, Number(start) | 0);
  let e = Math.max(s, Number(end) | 0);
  s = Math.min(s, total - 1);
  e = Math.min(e, total - 1);

  if (e - s + 1 > MAX_RENDER_LINES_PER_PASS) {
    e = Math.min(total - 1, s + MAX_RENDER_LINES_PER_PASS - 1);
  }

  return { start: s, end: e };
}

function applyLineChangeToLines(lines, range, newText) {
  if (!range || !range.start || !range.end) {
    return;
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    lines.splice(0, lines.length, "");
  }

  let startLine = Math.max(0, Number(range.start.line) | 0);
  let endLine = Math.max(0, Number(range.end.line) | 0);
  if (startLine > endLine) {
    const t = startLine;
    startLine = endLine;
    endLine = t;
  }
  startLine = Math.min(startLine, lines.length - 1);
  endLine = Math.min(endLine, lines.length - 1);

  let startColumn = Math.max(0, Number(range.start.column) | 0);
  let endColumn = Math.max(0, Number(range.end.column) | 0);
  if (range.start.line > range.end.line) {
    const t = startColumn;
    startColumn = endColumn;
    endColumn = t;
  }

  const startText = lines[startLine] || "";
  const endText = lines[endLine] || "";
  startColumn = Math.min(startColumn, startText.length);
  endColumn = Math.min(endColumn, endText.length);

  const prefix = startText.slice(0, startColumn);
  const suffix = endText.slice(endColumn);

  const inserted = normalizeNewlines(newText).split("\n");
  if (inserted.length === 0) {
    inserted.push("");
  }

  const replacement = [];
  if (inserted.length === 1) {
    replacement.push(`${prefix}${inserted[0]}${suffix}`);
  } else {
    replacement.push(`${prefix}${inserted[0]}`);
    for (let i = 1; i < inserted.length - 1; i += 1) {
      replacement.push(inserted[i]);
    }
    replacement.push(`${inserted[inserted.length - 1]}${suffix}`);
  }

  lines.splice(startLine, endLine - startLine + 1, ...replacement);
}

function truncateDemoTextForWeb(text) {
  return {
    text: normalizeNewlines(text),
    truncated: false,
  };
}

function parseColorLiteralArgb(literal) {
  if (!literal || !/^0X[0-9A-Fa-f]{6,8}$/.test(literal)) {
    return null;
  }
  let hex = literal.slice(2);
  if (hex.length === 6) {
    hex = `FF${hex}`;
  }
  const value = Number.parseInt(hex, 16);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value >>> 0;
}

function findLineCommentStart(line, marker) {
  if (!marker || marker.length === 0) {
    return -1;
  }
  let quote = "";
  let escaped = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "'" || ch === "\"") {
      quote = ch;
      escaped = false;
      continue;
    }

    if (line.startsWith(marker, i)) {
      return i;
    }
  }
  return -1;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.trunc(n);
}

function safeDelete(handle) {
  if (handle && typeof handle.delete === "function") {
    handle.delete();
  }
}

function forSweetLineList(list, fn) {
  if (!list || typeof fn !== "function") {
    return;
  }

  if (Array.isArray(list)) {
    list.forEach((item, index) => fn(item, index));
    return;
  }

  if (typeof list.size === "function" && typeof list.get === "function") {
    const size = Math.max(0, toInt(list.size(), 0));
    for (let i = 0; i < size; i += 1) {
      fn(list.get(i), i);
    }
  }
}

function extractLineSpanItem(token, fallbackLine = 0) {
  if (!token || !token.range || !token.range.start || !token.range.end) {
    return null;
  }

  const styleId = toInt(token.styleId ?? token.style_id, 0);
  if (styleId <= 0) {
    return null;
  }

  const startColumn = Math.max(0, toInt(token.range.start.column, 0));
  const endColumn = Math.max(0, toInt(token.range.end.column, 0));
  if (endColumn <= startColumn) {
    return null;
  }

  const rawStartLine = toInt(token.range.start.line, toInt(fallbackLine, 0));
  const rawEndLine = toInt(token.range.end.line, rawStartLine);
  const line = rawStartLine === rawEndLine ? rawStartLine : toInt(fallbackLine, 0);

  return {
    line: Math.max(0, line),
    column: startColumn,
    length: endColumn - startColumn,
    styleId,
  };
}

function buildDemoInlayAndDiagnostics(lines, fileName, startLine, endLine, liteMode = false) {
  const kind = resolveLanguageKind(fileName);

  const inlayHints = new Map();
  const diagnostics = new Map();

  for (let line = startLine; line <= endLine; line += 1) {
    const lineText = lines[line] ?? "";

    if (liteMode) {
      continue;
    }

    for (const colorMatch of lineText.matchAll(/\b0X[0-9A-Fa-f]{6,8}\b/g)) {
      const color = parseColorLiteralArgb(colorMatch[0]);
      if (color == null) {
        continue;
      }
      if (!inlayHints.has(line)) {
        inlayHints.set(line, []);
      }
      inlayHints.get(line).push({
        type: INLAY_COLOR_TYPE,
        column: (colorMatch.index ?? 0) + colorMatch[0].length + 1,
        color,
      });
    }

    const commentMarker = kind === "lua" ? "--" : "//";
    const commentPos = findLineCommentStart(lineText, commentMarker);
    if (commentPos >= 0) {
      const comment = lineText.slice(commentPos);
      const fixmePos = comment.toUpperCase().indexOf("FIXME");
      if (fixmePos >= 0) {
        if (!diagnostics.has(line)) diagnostics.set(line, []);
        diagnostics.get(line).push({
          column: commentPos + fixmePos,
          length: 5,
          severity: 0,
          color: 0,
        });
      }

      const todoPos = comment.toUpperCase().indexOf("TODO");
      if (todoPos >= 0) {
        if (!diagnostics.has(line)) diagnostics.set(line, []);
        diagnostics.get(line).push({
          column: commentPos + todoPos,
          length: 4,
          severity: 1,
          color: 0,
        });
      }
    }
  }

  return { inlayHints, diagnostics };
}

function buildAnalysisUri(fileName) {
  return `file:///${String(fileName || "example.cpp")}`;
}

function withSweetLineRange(sweetLine, range, fn) {
  const slRange = new sweetLine.TextRange();
  const start = new sweetLine.TextPosition();
  const end = new sweetLine.TextPosition();

  start.line = Math.max(0, toInt(range?.start?.line, 0));
  start.column = Math.max(0, toInt(range?.start?.column, 0));
  start.index = 0;

  end.line = Math.max(0, toInt(range?.end?.line, start.line));
  end.column = Math.max(0, toInt(range?.end?.column, start.column));
  end.index = 0;

  slRange.start = start;
  slRange.end = end;

  try {
    return fn(slRange);
  } finally {
    safeDelete(start);
    safeDelete(end);
    safeDelete(slRange);
  }
}

function registerSweetLineStyleMap(engine) {
  engine.registerStyleName("keyword", STYLE.KEYWORD);
  engine.registerStyleName("type", STYLE.TYPE);
  engine.registerStyleName("string", STYLE.STRING);
  engine.registerStyleName("comment", STYLE.COMMENT);
  engine.registerStyleName("preprocessor", STYLE.PREPROCESSOR);
  engine.registerStyleName("macro", STYLE.PREPROCESSOR);
  engine.registerStyleName("method", STYLE.FUNCTION);
  engine.registerStyleName("function", STYLE.FUNCTION);
  engine.registerStyleName("variable", STYLE.VARIABLE);
  engine.registerStyleName("field", STYLE.VARIABLE);
  engine.registerStyleName("number", STYLE.NUMBER);
  engine.registerStyleName("class", STYLE.CLASS);
  engine.registerStyleName("builtin", STYLE.BUILTIN);
  engine.registerStyleName("annotation", STYLE.ANNOTATION);
  engine.registerStyleName("color", STYLE.COLOR);
  engine.registerStyleName("punctuation", STYLE.PUNCTUATION);
}

let sweetLineRuntimePromise = null;

async function ensureSweetLineRuntime(versionTag) {
  if (sweetLineRuntimePromise) {
    return sweetLineRuntimePromise;
  }

  sweetLineRuntimePromise = (async () => {
    const sweetLine = await loadSweetLineModule({
      locateFile: (path) => {
        if (String(path).endsWith(".wasm")) {
          return new URL(`../libs/sweetline/${path}?v=${versionTag}`, import.meta.url).href;
        }
        return new URL(`../libs/sweetline/${path}`, import.meta.url).href;
      },
    });

    const config = new sweetLine.HighlightConfig();
    config.showIndex = false;
    config.inlineStyle = false;
    config.tabSize = 4;

    const engine = new sweetLine.HighlightEngine(config);
    registerSweetLineStyleMap(engine);

    let compiled = 0;
    for (const syntaxFile of SYNTAX_JSON_FILES) {
      const candidates = [
        new URL(`./syntaxes/${syntaxFile}?v=${versionTag}`, import.meta.url),
        new URL(`../../../_res/syntaxes/${syntaxFile}?v=${versionTag}`, import.meta.url),
      ];

      let loaded = false;
      for (const syntaxUrl of candidates) {
        try {
          const response = await fetch(syntaxUrl.href, { cache: "no-store" });
          if (!response.ok) {
            continue;
          }
          engine.compileSyntaxFromJson(await response.text());
          compiled += 1;
          loaded = true;
          break;
        } catch (_) {
          // try next candidate
        }
      }

      if (!loaded) {
        console.warn(`SweetLine syntax load failed: ${syntaxFile}`);
      }
    }

    if (compiled === 0) {
      console.warn("SweetLine syntax load skipped: no syntax JSON compiled.");
    }

    return { sweetLine, engine };
  })();

  return sweetLineRuntimePromise;
}

class DemoDecorationProvider {
  constructor(sweetLine, highlightEngine) {
    this._sweetLine = sweetLine;
    this._highlightEngine = highlightEngine;
    this._sourceFileName = "example.kt";
    this._sourceLines = normalizeNewlines(DEMO_FILE_FALLBACKS["example.kt"]).split("\n");
    this._analysisDocument = null;
    this._documentAnalyzer = null;
    this._cacheHighlight = null;
    this._analyzedFileName = "";
    this._liteMode = false;
    this._refreshLiteMode();
  }

  setDocumentSource(fileName, text) {
    this._sourceFileName = String(fileName || "example.kt");
    this._sourceLines = normalizeNewlines(text).split("\n");
    if (this._sourceLines.length === 0) {
      this._sourceLines = [""];
    }
    this._refreshLiteMode();
    this._disposeAnalyzer();
  }

  _refreshLiteMode() {
    this._liteMode = this._sourceLines.length > 1200;
  }

  _disposeAnalyzer() {
    safeDelete(this._documentAnalyzer);
    safeDelete(this._analysisDocument);
    this._documentAnalyzer = null;
    this._analysisDocument = null;
    this._cacheHighlight = null;
    this._analyzedFileName = "";
  }

  _rebuildAnalyzer(fileName) {
    this._disposeAnalyzer();
    const sourceText = this._sourceLines.join("\n");
    this._analysisDocument = new this._sweetLine.Document(buildAnalysisUri(fileName), sourceText);
    this._documentAnalyzer = this._highlightEngine.loadDocument(this._analysisDocument);
    this._cacheHighlight = this._documentAnalyzer.analyze();
    this._analyzedFileName = fileName;
  }

  _applyIncrementalChanges(changes) {
    if (!this._documentAnalyzer || changes.length === 0) {
      return true;
    }

    try {
      for (const change of changes) {
        const newText = normalizeNewlines(change?.newText ?? "");
        if (!change?.range) {
          continue;
        }
        withSweetLineRange(this._sweetLine, change.range, (slRange) => {
          this._cacheHighlight = this._documentAnalyzer.analyzeIncremental(slRange, newText);
        });
      }
      return true;
    } catch (error) {
      console.error("SweetLine incremental analyze failed:", error);
      return false;
    }
  }

  _collectSyntaxSpans(startLine, endLine) {
    const syntaxSpans = new Map();
    const lineHighlights = this._cacheHighlight?.lines;
    if (!lineHighlights) {
      return syntaxSpans;
    }

    const appendFromLineHighlight = (lineHighlight, fallbackLine) => {
      if (!lineHighlight) {
        return;
      }
      forSweetLineList(lineHighlight.spans, (token) => {
        const span = extractLineSpanItem(token, fallbackLine);
        if (!span) {
          return;
        }
        if (span.line < startLine || span.line > endLine) {
          return;
        }
        if (!syntaxSpans.has(span.line)) {
          syntaxSpans.set(span.line, []);
        }
        syntaxSpans.get(span.line).push({
          column: span.column,
          length: span.length,
          styleId: span.styleId,
        });
      });
    };

    if (typeof lineHighlights.size === "function" && typeof lineHighlights.get === "function") {
      const lineCount = Math.max(0, toInt(lineHighlights.size(), 0));
      for (let i = 0; i < lineCount; i += 1) {
        appendFromLineHighlight(lineHighlights.get(i), i);
      }
    } else if (Array.isArray(lineHighlights)) {
      lineHighlights.forEach((lineHighlight, i) => appendFromLineHighlight(lineHighlight, i));
    } else {
      return syntaxSpans;
    }

    syntaxSpans.forEach((spans) => {
      spans.sort((a, b) => a.column - b.column);
    });

    return syntaxSpans;
  }

  provideDecorations(context, receiver) {
    const contextFileName = context?.editorMetadata?.fileName;
    if (contextFileName && contextFileName !== this._sourceFileName) {
      this._sourceFileName = contextFileName;
    }

    const changes = Array.isArray(context?.textChanges) ? context.textChanges : [];
    if (changes.length > 0) {
      for (const change of changes) {
        applyLineChangeToLines(this._sourceLines, change.range, normalizeNewlines(change.newText ?? ""));
      }
      this._refreshLiteMode();
    }

    const snapshotFileName = this._sourceFileName;
    const fileChanged = snapshotFileName !== this._analyzedFileName;
    if (fileChanged || !this._documentAnalyzer || !this._cacheHighlight) {
      try {
        this._rebuildAnalyzer(snapshotFileName);
      } catch (error) {
        console.error("SweetLine full analyze failed:", error);
        this._disposeAnalyzer();
      }
    } else if (changes.length > 0) {
      const incrementalOk = this._applyIncrementalChanges(changes);
      if (!incrementalOk || !this._cacheHighlight) {
        try {
          this._rebuildAnalyzer(snapshotFileName);
        } catch (error) {
          console.error("SweetLine fallback full analyze failed:", error);
          this._disposeAnalyzer();
        }
      }
    }

    const visibleRange = clampVisibleRange(
      context?.visibleStartLine ?? 0,
      context?.visibleEndLine ?? ((context?.visibleStartLine ?? 0) + 120),
      this._sourceLines.length,
    );
    if (visibleRange.end < visibleRange.start) {
      return;
    }

    const syntaxSpans = this._collectSyntaxSpans(visibleRange.start, visibleRange.end);
    const rendered = buildDemoInlayAndDiagnostics(
      this._sourceLines,
      snapshotFileName,
      visibleRange.start,
      visibleRange.end,
      this._liteMode,
    );

    receiver.accept(new DecorationResult({
      syntaxSpans,
      syntaxSpansMode: DecorationApplyMode.REPLACE_RANGE,
      inlayHints: rendered.inlayHints,
      inlayHintsMode: DecorationApplyMode.REPLACE_RANGE,
    }));

    if (this._liteMode) {
      receiver.accept(new DecorationResult({
        diagnostics: new Map(),
        diagnosticsMode: DecorationApplyMode.REPLACE_RANGE,
      }));
      return;
    }

    setTimeout(() => {
      if (receiver.isCancelled) {
        return;
      }
      receiver.accept(new DecorationResult({
        diagnostics: rendered.diagnostics,
        diagnosticsMode: DecorationApplyMode.REPLACE_RANGE,
      }));
    }, 90);
  }
}

class DemoCompletionProvider {
  constructor(getFileName) {
    this._getFileName = getFileName;
  }

  isTriggerCharacter(ch) {
    return ch === "." || ch === ":";
  }

  provideCompletions(context, receiver) {
    const fileName = context?.editorMetadata?.fileName || this._getFileName();
    const kind = resolveLanguageKind(fileName);

    if (context?.triggerKind === 1 && context?.triggerCharacter === ".") {
      const items = MEMBER_COMPLETIONS[kind] || MEMBER_COMPLETIONS.cpp;
      receiver.accept(new CompletionResult(items, false));
      return;
    }

    const items = GLOBAL_COMPLETIONS[kind] || GLOBAL_COMPLETIONS.cpp;
    setTimeout(() => {
      if (receiver.isCancelled) {
        return;
      }
      receiver.accept(new CompletionResult(items, false));
    }, 200);
  }
}

async function loadDemoFiles(versionTag) {
  const fileNames = Object.keys(DEMO_FILE_FALLBACKS).slice().sort((a, b) => a.localeCompare(b));
  const fileMap = new Map();
  const fileState = new Map();

  await Promise.all(fileNames.map(async (fileName) => {
    const fallback = DEMO_FILE_FALLBACKS[fileName];
    const url = new URL(`../../../_res/files/${encodeURIComponent(fileName)}?v=${versionTag}`, import.meta.url);
    try {
      const response = await fetch(url.href, { cache: "no-store" });
      if (!response.ok) {
        const fallbackResult = truncateDemoTextForWeb(fallback);
        fileMap.set(fileName, fallbackResult.text);
        fileState.set(fileName, { truncated: fallbackResult.truncated });
        return;
      }
      const loaded = truncateDemoTextForWeb(await response.text());
      fileMap.set(fileName, loaded.text);
      fileState.set(fileName, { truncated: loaded.truncated });
    } catch (_) {
      const fallbackResult = truncateDemoTextForWeb(fallback);
      fileMap.set(fileName, fallbackResult.text);
      fileState.set(fileName, { truncated: fallbackResult.truncated });
    }
  }));

  return { fileNames, fileMap, fileState };
}

function registerDemoStyles(editor) {
  editor.registerTextStyle(STYLE.KEYWORD, 0xFF7AA2F7, 0, 1);
  editor.registerTextStyle(STYLE.TYPE, 0xFF4EC9B0, 0, 0);
  editor.registerTextStyle(STYLE.STRING, 0xFFCE9178, 0, 0);
  editor.registerTextStyle(STYLE.COMMENT, 0xFF6A9955, 0, 2);
  editor.registerTextStyle(STYLE.BUILTIN, 0xFF7DCFFF, 0, 0);
  editor.registerTextStyle(STYLE.NUMBER, 0xFFB5CEA8, 0, 0);
  editor.registerTextStyle(STYLE.CLASS, 0xFFE0AF68, 0, 1);
  editor.registerTextStyle(STYLE.FUNCTION, 0xFF73DACA, 0, 0);
  editor.registerTextStyle(STYLE.VARIABLE, 0xFFD7DEE9, 0, 0);
  editor.registerTextStyle(STYLE.ANNOTATION, 0xFF4FC1FF, 0, 0);
  editor.registerTextStyle(STYLE.PUNCTUATION, 0xFFD4D4D4, 0, 0);
  editor.registerTextStyle(STYLE.PREPROCESSOR, 0xFFF7768E, 0, 0);
  editor.registerTextStyle(STYLE.COLOR, 0xFFFF9E64, 0, 1);
}

const host = document.getElementById("editor");
const fileSelect = document.getElementById("fileSelect");
const openLocalBtn = document.getElementById("openLocalBtn");
const localFileInput = document.getElementById("localFileInput");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const completeBtn = document.getElementById("completeBtn");
const statusText = document.getElementById("statusText");

const wasmVersion = Date.now();
const locale = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
const DEMO_DECORATION_OPTIONS = Object.freeze({
  // `INCREMENTAL`: pass textChanges to provider (provider can do incremental analyze)
  // `FULL`: force full analyze on every text change
  // `DISABLED`: ignore text-change driven refresh
  textChangeMode: DecorationTextChangeMode.INCREMENTAL,
  // `BOTH`: allow sync + async receiver.accept
  // `SYNC`: only allow sync results
  // `ASYNC`: only allow async results
  resultDispatchMode: DecorationResultDispatchMode.BOTH,
  // `SYNC`: call provider immediately
  // `ASYNC`: call provider in macrotask
  providerCallMode: DecorationProviderCallMode.SYNC,
  applySynchronously: false,
});

const { fileNames, fileMap, fileState } = await loadDemoFiles(wasmVersion);
const initialFileName = fileNames[0] || "example.kt";
const initialText = fileMap.get(initialFileName) || DEMO_FILE_FALLBACKS[initialFileName] || "";

const editor = await createSweetEditor(host, {
  modulePath: `../../../../build/wasm/bin/sweeteditor.js?v=${wasmVersion}`,
  locale,
  text: initialText,
  decorationOptions: DEMO_DECORATION_OPTIONS,
});

registerDemoStyles(editor);
const core = editor.getCore();
const sweetLineRuntime = await ensureSweetLineRuntime(wasmVersion);

let activeFileName = initialFileName;
const demoDecorationProvider = new DemoDecorationProvider(
  sweetLineRuntime.sweetLine,
  sweetLineRuntime.engine,
);
demoDecorationProvider.setDocumentSource(initialFileName, initialText);
editor.addDecorationProvider(demoDecorationProvider);

const demoCompletionProvider = new DemoCompletionProvider(() => activeFileName);
editor.addCompletionProvider(demoCompletionProvider);

function setStatus(message) {
  statusText.textContent = message;
}

function ensureFileOption(fileName) {
  for (let i = 0; i < fileSelect.options.length; i += 1) {
    if (fileSelect.options[i].value === fileName) {
      return;
    }
  }

  const option = document.createElement("option");
  option.value = fileName;
  option.textContent = fileName;
  fileSelect.appendChild(option);
}

function getUniqueLocalFileName(fileName) {
  const raw = String(fileName || "").trim();
  const base = raw.length > 0 ? raw : `local-${Date.now()}.txt`;
  if (!fileMap.has(base)) {
    return base;
  }

  const dot = base.lastIndexOf(".");
  const hasExt = dot > 0 && dot < base.length - 1;
  const stem = hasExt ? base.slice(0, dot) : base;
  const ext = hasExt ? base.slice(dot) : "";

  let index = 2;
  while (true) {
    const candidate = `${stem} (${index})${ext}`;
    if (!fileMap.has(candidate)) {
      return candidate;
    }
    index += 1;
  }
}

function applyFileContent(fileName, text, options = {}) {
  const { truncated = false } = options;
  fileMap.set(fileName, text);
  fileState.set(fileName, { truncated: !!truncated });
  ensureFileOption(fileName);
  fileSelect.value = fileName;
  loadFile(fileName);
}

function snapshotActiveFileContent() {
  if (!activeFileName) {
    return;
  }

  try {
    const currentText = String(editor.getText() ?? "");
    fileMap.set(activeFileName, currentText);
    fileState.set(activeFileName, { truncated: false });
  } catch (error) {
    console.warn("Snapshot active file failed:", error);
  }
}

function loadFile(fileName) {
  const normalizedFileName = String(fileName || "");
  if (!normalizedFileName) {
    setStatus("Load failed: empty file name");
    return;
  }

  if (activeFileName && activeFileName !== normalizedFileName) {
    snapshotActiveFileContent();
  }

  const knownFile = fileMap.has(normalizedFileName) || Object.prototype.hasOwnProperty.call(DEMO_FILE_FALLBACKS, normalizedFileName);
  if (!knownFile) {
    setStatus(`Load failed: ${normalizedFileName} not found`);
    return;
  }

  const text = fileMap.has(normalizedFileName)
    ? fileMap.get(normalizedFileName)
    : (DEMO_FILE_FALLBACKS[normalizedFileName] || "");

  try {
    activeFileName = normalizedFileName;
    if (typeof core.clearAllDecorations === "function") {
      core.clearAllDecorations();
    }
    demoDecorationProvider.setDocumentSource(normalizedFileName, text);
    editor.setMetadata({ fileName: normalizedFileName });
    editor.setLanguageConfiguration(resolveLanguageConfiguration(normalizedFileName));
    editor.loadText(text);
    try {
      core.call("setScroll", 0, 0);
    } catch (_) {
      // ignore when setScroll is not exposed in current runtime
    }
    editor.requestDecorationRefresh();
    setStatus(`Loaded: ${normalizedFileName}`);
  } catch (error) {
    console.error("Failed to load file:", normalizedFileName, error);
    setStatus(`Load failed: ${normalizedFileName}`);
  }
}

for (const fileName of fileNames) {
  const option = document.createElement("option");
  option.value = fileName;
  option.textContent = fileName;
  fileSelect.appendChild(option);
}

fileSelect.value = initialFileName;
loadFile(initialFileName);

const onFileSelectChanged = () => {
  loadFile(fileSelect.value);
};

fileSelect.addEventListener("change", onFileSelectChanged);
fileSelect.addEventListener("input", onFileSelectChanged);

if (openLocalBtn && localFileInput) {
  openLocalBtn.addEventListener("click", () => {
    localFileInput.click();
  });

  localFileInput.addEventListener("change", async () => {
    const localFile = localFileInput.files && localFileInput.files[0];
    if (!localFile) {
      return;
    }

    try {
      setStatus(`Loading local: ${localFile.name}...`);
      const rawText = await localFile.text();
      const truncated = truncateDemoTextForWeb(rawText);
      const fileName = getUniqueLocalFileName(localFile.name || "local.txt");
      applyFileContent(fileName, truncated.text, { truncated: truncated.truncated });
      setStatus(`Loaded local: ${fileName}`);
    } catch (error) {
      console.error("Failed to load local file:", error);
      setStatus("Load local failed");
    } finally {
      localFileInput.value = "";
    }
  });
}

undoBtn.addEventListener("click", () => {
  core.call("undo");
});

redoBtn.addEventListener("click", () => {
  core.call("redo");
});

completeBtn.addEventListener("click", () => {
  editor.triggerCompletion();
});


