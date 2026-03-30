import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");

const PACKAGE_DEFS = [
  {
    name: "@sweeteditor/sdk",
    packageJson: "platform/Emscripten/sdk/packages/sdk/package.json",
    files: [
      "platform/Emscripten/sdk/packages/sdk/dist/index.d.ts",
      "platform/Emscripten/sdk/packages/sdk/dist/editor/editor-instance.d.ts",
      "platform/Emscripten/sdk/packages/sdk/dist/types.d.ts",
    ],
  },
  {
    name: "@sweeteditor/providers-sweetline",
    packageJson: "platform/Emscripten/sdk/packages/providers-sweetline/package.json",
    files: [
      "platform/Emscripten/sdk/packages/providers-sweetline/dist/index.d.ts",
    ],
  },
  {
    name: "@sweeteditor/widget",
    packageJson: "platform/Emscripten/sdk/packages/widget/package.json",
    files: [
      "platform/Emscripten/sdk/packages/widget/dist/index.d.ts",
      "platform/Emscripten/sdk/packages/widget/dist/legacy/sweet-editor-widget-legacy.d.ts",
    ],
  },
  {
    name: "@sweeteditor/core",
    packageJson: "platform/Emscripten/sdk/packages/core/package.json",
    files: [
      "platform/Emscripten/sdk/packages/core/dist/index.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/base/lifecycle.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/editor/model.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/platform/wasm.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/legacy/embind-contracts.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/legacy/editor-input-types.d.ts",
      "platform/Emscripten/sdk/packages/core/dist/legacy/editor-core-legacy.d.ts",
    ],
  },
];

function headingAnchor(pkgName) {
  return pkgName.replace("@", "").replace("/", "");
}

async function readUtf8(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return readFile(fullPath, "utf8");
}

async function loadPackageVersions() {
  const versions = new Map();
  for (const pkg of PACKAGE_DEFS) {
    const jsonText = await readUtf8(pkg.packageJson);
    const manifest = JSON.parse(jsonText);
    versions.set(pkg.name, String(manifest.version ?? "0.0.0"));
  }
  return versions;
}

function buildIntro(lang) {
  if (lang === "zh") {
    return [
      "# Web SDK v2 完整 API 参考（100% 覆盖）",
      "",
      "本文档以 `platform/Emscripten/sdk/packages/*/dist/*.d.ts` 为唯一真值来源，逐文件镜像公开声明，保证覆盖 100% 对外 API。",
      "",
      "- 覆盖范围：`@sweeteditor/sdk`、`@sweeteditor/core`、`@sweeteditor/widget`、`@sweeteditor/providers-sweetline`",
      "- 同步策略：发布前先 `pnpm -r build`，再执行 `pnpm docs:api`，声明文件变化即 API 变化",
      "- 说明：以下声明中以 `_` 前缀命名的方法属于 legacy/internal 暴露面，默认不承诺长期稳定，请优先使用 `@sweeteditor/sdk` 的高层 API",
      "",
      "## 包版本",
    ];
  }

  return [
    "# Web SDK v2 Full API Reference (100% Coverage)",
    "",
    "This document uses `platform/Emscripten/sdk/packages/*/dist/*.d.ts` as the single source of truth and mirrors public declarations file-by-file for full API coverage.",
    "",
    "- Scope: `@sweeteditor/sdk`, `@sweeteditor/core`, `@sweeteditor/widget`, `@sweeteditor/providers-sweetline`",
    "- Sync rule: run `pnpm -r build` and then `pnpm docs:api`; declaration changes mean API changes",
    "- Note: members prefixed with `_` are legacy/internal surface from historical bridge code; prefer high-level APIs in `@sweeteditor/sdk` for stable integration",
    "",
    "## Package Versions",
  ];
}

function buildContents(lang) {
  const lines = [];
  lines.push("");
  lines.push(lang === "zh" ? "## 目录" : "## Contents");
  for (const pkg of PACKAGE_DEFS) {
    lines.push(`- [${pkg.name}](#${headingAnchor(pkg.name)})`);
  }
  return lines;
}

async function buildPackageSection(pkg, version, lang) {
  const lines = [];
  lines.push("");
  lines.push(`## ${pkg.name}`);
  lines.push(lang === "zh" ? `版本：\`${version}\`` : `Version: \`${version}\``);
  lines.push("");
  lines.push(lang === "zh" ? "以下为对应声明文件的完整内容：" : "Complete declaration mirrors:");

  for (const relativePath of pkg.files) {
    const content = (await readUtf8(relativePath)).replace(/\r\n/g, "\n").trimEnd();
    lines.push("");
    lines.push(`### \`${relativePath.replace(/\\/g, "/")}\``);
    lines.push("");
    lines.push("```ts");
    lines.push(content);
    lines.push("```");
  }

  return lines;
}

async function generateDoc(lang, outPath, versions) {
  const lines = [];
  lines.push(...buildIntro(lang));

  for (const pkg of PACKAGE_DEFS) {
    lines.push(`- \`${pkg.name}@${versions.get(pkg.name)}\``);
  }

  lines.push(...buildContents(lang));

  for (const pkg of PACKAGE_DEFS) {
    const section = await buildPackageSection(pkg, versions.get(pkg.name), lang);
    lines.push(...section);
  }

  lines.push("");
  const output = `${lines.join("\n")}\n`;
  await writeFile(path.join(repoRoot, outPath), output, "utf8");
}

async function main() {
  const versions = await loadPackageVersions();
  const enOut = "docs/en/api-platform-web-sdk-v2-reference.md";
  const zhOut = "docs/zh/api-platform-web-sdk-v2-reference.md";
  await generateDoc("en", enOut, versions);
  await generateDoc("zh", zhOut, versions);
  process.stdout.write("Generated web SDK v2 API references:\n");
  process.stdout.write(`- ${path.join(repoRoot, enOut)}\n`);
  process.stdout.write(`- ${path.join(repoRoot, zhOut)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});

