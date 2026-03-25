import {
  createSweetEditor,
  CompletionItem,
  CompletionResult,
  DecorationApplyMode,
  DecorationResult,
} from "../index.js?v=20260325_12";

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
  KEYWORD: 3201,
  TYPE: 3202,
  STRING: 3203,
  COMMENT: 3204,
  NUMBER: 3205,
  PREPROCESSOR: 3206,
  FUNCTION: 3207,
  ANNOTATION: 3208,
  COLOR: 3209,
});

const INLAY_COLOR_TYPE = 2;

const KEYWORDS = Object.freeze({
  cpp: new Set([
    "if", "else", "for", "while", "switch", "case", "default", "break", "continue", "return",
    "class", "struct", "namespace", "template", "typename", "public", "private", "protected",
    "const", "constexpr", "auto", "static", "virtual", "override", "new", "delete",
  ]),
  java: new Set([
    "if", "else", "for", "while", "switch", "case", "default", "break", "continue", "return",
    "class", "interface", "enum", "package", "import", "public", "private", "protected",
    "static", "final", "new", "extends", "implements", "void", "null", "true", "false",
  ]),
  kotlin: new Set([
    "if", "else", "when", "for", "while", "return", "class", "object", "fun", "val", "var",
    "package", "import", "private", "public", "internal", "override", "open", "null",
    "true", "false",
  ]),
  lua: new Set([
    "if", "then", "else", "elseif", "for", "while", "do", "end", "function",
    "local", "return", "nil", "true", "false",
  ]),
});

const TYPES = Object.freeze({
  cpp: new Set([
    "void", "int", "float", "double", "bool", "char", "long", "short", "size_t", "std",
    "string", "vector", "map",
  ]),
  java: new Set([
    "void", "int", "long", "float", "double", "boolean", "char", "String", "Object", "View",
  ]),
  kotlin: new Set([
    "Int", "Long", "Float", "Double", "Boolean", "String", "Unit", "Any",
  ]),
  lua: new Set(["table", "string", "number", "boolean"]),
});

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

function lineColumnToOffset(text, line, column) {
  const targetLine = Math.max(0, Number(line) | 0);
  const targetColumn = Math.max(0, Number(column) | 0);
  let offset = 0;
  let currentLine = 0;

  while (offset < text.length && currentLine < targetLine) {
    if (text.charCodeAt(offset) === 10) {
      currentLine += 1;
    }
    offset += 1;
  }

  let currentColumn = 0;
  while (offset < text.length && currentColumn < targetColumn) {
    if (text.charCodeAt(offset) === 10) {
      break;
    }
    offset += 1;
    currentColumn += 1;
  }
  return offset;
}

function applyTextChange(text, range, newText) {
  if (!range || !range.start || !range.end) {
    return text;
  }
  let startOffset = lineColumnToOffset(text, range.start.line, range.start.column);
  let endOffset = lineColumnToOffset(text, range.end.line, range.end.column);
  if (startOffset > endOffset) {
    const tmp = startOffset;
    startOffset = endOffset;
    endOffset = tmp;
  }
  return `${text.slice(0, startOffset)}${newText}${text.slice(endOffset)}`;
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

function isRangeClear(occupied, start, endExclusive) {
  for (let i = start; i < endExclusive; i += 1) {
    if (occupied[i]) {
      return false;
    }
  }
  return true;
}

function markRange(occupied, start, endExclusive) {
  for (let i = start; i < endExclusive; i += 1) {
    occupied[i] = 1;
  }
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

function tokenizeLine(line, kind) {
  const keywords = KEYWORDS[kind] || KEYWORDS.cpp;
  const types = TYPES[kind] || TYPES.cpp;
  const commentMarker = kind === "lua" ? "--" : "//";
  const commentStart = findLineCommentStart(line, commentMarker);
  const codeEnd = commentStart >= 0 ? commentStart : line.length;

  const spans = [];
  const occupied = new Uint8Array(line.length);
  const addSpan = (start, endExclusive, styleId) => {
    const s = Math.max(0, start | 0);
    const e = Math.min(line.length, endExclusive | 0);
    if (e <= s) {
      return false;
    }
    if (!isRangeClear(occupied, s, e)) {
      return false;
    }
    markRange(occupied, s, e);
    spans.push({ column: s, length: e - s, styleId });
    return true;
  };

  if (kind === "cpp" && /^\s*#/.test(line.slice(0, codeEnd))) {
    const firstCode = line.slice(0, codeEnd).search(/\S/);
    if (firstCode >= 0) {
      addSpan(firstCode, codeEnd, STYLE.PREPROCESSOR);
    }
  }

  for (let i = 0; i < codeEnd; i += 1) {
    const ch = line[i];
    if (ch !== "'" && ch !== "\"") {
      continue;
    }
    const start = i;
    const quote = ch;
    i += 1;
    while (i < codeEnd) {
      if (line[i] === "\\") {
        i += 2;
        continue;
      }
      if (line[i] === quote) {
        i += 1;
        break;
      }
      i += 1;
    }
    addSpan(start, Math.min(i, codeEnd), STYLE.STRING);
    i -= 1;
  }

  if (commentStart >= 0) {
    addSpan(commentStart, line.length, STYLE.COMMENT);
  }

  if (kind === "java" || kind === "kotlin") {
    for (const match of line.slice(0, codeEnd).matchAll(/@\w+/g)) {
      addSpan(match.index ?? 0, (match.index ?? 0) + match[0].length, STYLE.ANNOTATION);
    }
  }

  for (const match of line.slice(0, codeEnd).matchAll(/\b0X[0-9A-Fa-f]{6,8}\b/g)) {
    addSpan(match.index ?? 0, (match.index ?? 0) + match[0].length, STYLE.COLOR);
  }

  for (const match of line.slice(0, codeEnd).matchAll(/\b(?:0[xX][0-9A-Fa-f]+|\d+(?:\.\d+)?)\b/g)) {
    addSpan(match.index ?? 0, (match.index ?? 0) + match[0].length, STYLE.NUMBER);
  }

  for (const match of line.slice(0, codeEnd).matchAll(/\b[A-Za-z_]\w*\b/g)) {
    const word = match[0];
    const start = match.index ?? 0;
    const end = start + word.length;
    if (keywords.has(word)) {
      addSpan(start, end, STYLE.KEYWORD);
      continue;
    }
    if (types.has(word)) {
      addSpan(start, end, STYLE.TYPE);
      continue;
    }

    let j = end;
    while (j < codeEnd && /\s/.test(line[j])) {
      j += 1;
    }
    if (j < codeEnd && line[j] === "(") {
      addSpan(start, end, STYLE.FUNCTION);
    }
  }

  spans.sort((a, b) => a.column - b.column);
  return spans;
}

function buildDecorations(text, fileName) {
  const lines = normalizeNewlines(text).split("\n");
  const kind = resolveLanguageKind(fileName);

  const syntaxSpans = new Map();
  const inlayHints = new Map();
  const diagnostics = new Map();

  lines.forEach((lineText, line) => {
    const spans = tokenizeLine(lineText, kind);
    if (spans.length > 0) {
      syntaxSpans.set(line, spans);
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

    const commentPos = kind === "lua"
      ? lineText.indexOf("--")
      : lineText.indexOf("//");
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
  });

  return { syntaxSpans, inlayHints, diagnostics };
}

class DemoDecorationProvider {
  constructor() {
    this._sourceFileName = "example.kt";
    this._sourceText = normalizeNewlines(DEMO_FILE_FALLBACKS["example.kt"]);
  }

  setDocumentSource(fileName, text) {
    this._sourceFileName = String(fileName || "example.cpp");
    this._sourceText = normalizeNewlines(text);
  }

  provideDecorations(context, receiver) {
    const contextFileName = context?.editorMetadata?.fileName;
    if (contextFileName && contextFileName !== this._sourceFileName) {
      this._sourceFileName = contextFileName;
    }

    const changes = Array.isArray(context?.textChanges) ? context.textChanges : [];
    if (changes.length > 0) {
      for (const change of changes) {
        this._sourceText = applyTextChange(this._sourceText, change.range, normalizeNewlines(change.newText ?? ""));
      }
    }

    const snapshotFileName = this._sourceFileName;
    const snapshotText = this._sourceText;
    const rendered = buildDecorations(snapshotText, snapshotFileName);

    receiver.accept(new DecorationResult({
      syntaxSpans: rendered.syntaxSpans,
      syntaxSpansMode: DecorationApplyMode.REPLACE_ALL,
      inlayHints: rendered.inlayHints,
      inlayHintsMode: DecorationApplyMode.REPLACE_ALL,
    }));

    setTimeout(() => {
      if (receiver.isCancelled) {
        return;
      }
      receiver.accept(new DecorationResult({
        diagnostics: rendered.diagnostics,
        diagnosticsMode: DecorationApplyMode.REPLACE_ALL,
      }));
    }, 140);
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

  await Promise.all(fileNames.map(async (fileName) => {
    const fallback = DEMO_FILE_FALLBACKS[fileName];
    const url = new URL(`../../../_res/files/${encodeURIComponent(fileName)}?v=${versionTag}`, import.meta.url);
    try {
      const response = await fetch(url.href, { cache: "no-store" });
      if (!response.ok) {
        fileMap.set(fileName, normalizeNewlines(fallback));
        return;
      }
      let text = await response.text();
      text = normalizeNewlines(text);
      if (text.length > 180000) {
        text = `${text.slice(0, 180000)}\n\n// [Web Demo] File truncated for smooth UI performance.\n`;
      }
      fileMap.set(fileName, text);
    } catch (_) {
      fileMap.set(fileName, normalizeNewlines(fallback));
    }
  }));

  return { fileNames, fileMap };
}

function registerDemoStyles(editor) {
  editor.registerTextStyle(STYLE.KEYWORD, 0xFF569CD6, 0, 1);
  editor.registerTextStyle(STYLE.TYPE, 0xFF4EC9B0, 0, 0);
  editor.registerTextStyle(STYLE.STRING, 0xFFCE9178, 0, 0);
  editor.registerTextStyle(STYLE.COMMENT, 0xFF6A9955, 0, 2);
  editor.registerTextStyle(STYLE.NUMBER, 0xFFB5CEA8, 0, 0);
  editor.registerTextStyle(STYLE.PREPROCESSOR, 0xFFC586C0, 0, 0);
  editor.registerTextStyle(STYLE.FUNCTION, 0xFFDCDCAA, 0, 0);
  editor.registerTextStyle(STYLE.ANNOTATION, 0xFF4FC1FF, 0, 0);
  editor.registerTextStyle(STYLE.COLOR, 0xFFFF9E64, 0, 1);
}

const host = document.getElementById("editor");
const fileSelect = document.getElementById("fileSelect");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const completeBtn = document.getElementById("completeBtn");
const statusText = document.getElementById("statusText");

const wasmVersion = Date.now();
const locale = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";

const { fileNames, fileMap } = await loadDemoFiles(wasmVersion);
const initialFileName = fileNames[0] || "example.cpp";
const initialText = fileMap.get(initialFileName) || DEMO_FILE_FALLBACKS[initialFileName] || "";

const editor = await createSweetEditor(host, {
  modulePath: `../../../../build/wasm/bin/sweeteditor.js?v=${wasmVersion}`,
  locale,
  text: initialText,
});

registerDemoStyles(editor);
const core = editor.getCore();

let activeFileName = initialFileName;
const demoDecorationProvider = new DemoDecorationProvider();
demoDecorationProvider.setDocumentSource(initialFileName, initialText);
editor.addDecorationProvider(demoDecorationProvider);

const demoCompletionProvider = new DemoCompletionProvider(() => activeFileName);
editor.addCompletionProvider(demoCompletionProvider);

function setStatus(message) {
  statusText.textContent = message;
}

function loadFile(fileName) {
  const text = fileMap.get(fileName) || DEMO_FILE_FALLBACKS[fileName] || "";
  activeFileName = fileName;
  demoDecorationProvider.setDocumentSource(fileName, text);
  editor.setMetadata({ fileName });
  editor.setLanguageConfiguration(resolveLanguageConfiguration(fileName));
  editor.loadText(text);
  editor.requestDecorationRefresh();
  setStatus(`Loaded: ${fileName}`);
}

for (const fileName of fileNames) {
  const option = document.createElement("option");
  option.value = fileName;
  option.textContent = fileName;
  fileSelect.appendChild(option);
}

fileSelect.value = initialFileName;
editor.setMetadata({ fileName: initialFileName });
editor.setLanguageConfiguration(resolveLanguageConfiguration(initialFileName));
editor.requestDecorationRefresh();
setStatus(`Loaded: ${initialFileName}`);

fileSelect.addEventListener("change", () => {
  loadFile(fileSelect.value);
});

undoBtn.addEventListener("click", () => {
  core.call("undo");
});

redoBtn.addEventListener("click", () => {
  core.call("redo");
});

completeBtn.addEventListener("click", () => {
  editor.triggerCompletion();
});
