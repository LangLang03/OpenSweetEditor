import path from "node:path";
import { fileURLToPath } from "node:url";

import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(__dirname, "..");
const emscriptenRoot = path.resolve(sdkRoot, "..");
const repoRoot = path.resolve(emscriptenRoot, "..", "..");

const sdkPackageRuntimeRoot = path.resolve(sdkRoot, "packages", "sdk", "runtime");
const sweetlineAssetsRoot = path.resolve(sdkRoot, "assets", "sweetline");

function firstExistingPath(paths) {
  for (const candidate of paths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveRuntimeSource(binaryName) {
  const envKey = `OPENSWEETEDITOR_${binaryName.toUpperCase().replace(".", "_")}`;
  const envPath = process.env[envKey];

  return firstExistingPath([
    envPath ? path.resolve(envPath) : "",
    path.resolve(repoRoot, "build", "wasm", "bin", binaryName),
    path.resolve(emscriptenRoot, "web", "runtime", binaryName),
  ]);
}

async function main() {
  const wasmJsPath = resolveRuntimeSource("sweeteditor.js");
  const wasmBinaryPath = resolveRuntimeSource("sweeteditor.wasm");

  if (!wasmJsPath || !wasmBinaryPath) {
    throw new Error(
      "Missing wasm runtime files. Build wasm first (platform/Emscripten/build-wasm.ps1|.sh) " +
      "or set OPENSWEETEDITOR_SWEETEDITOR_JS / OPENSWEETEDITOR_SWEETEDITOR_WASM.",
    );
  }

  if (!(await fs.pathExists(sweetlineAssetsRoot))) {
    throw new Error(`Missing SweetLine assets: ${sweetlineAssetsRoot}`);
  }

  await fs.emptyDir(sdkPackageRuntimeRoot);
  await fs.copy(wasmJsPath, path.resolve(sdkPackageRuntimeRoot, "sweeteditor.js"));
  await fs.copy(wasmBinaryPath, path.resolve(sdkPackageRuntimeRoot, "sweeteditor.wasm"));
  await fs.copy(
    sweetlineAssetsRoot,
    path.resolve(sdkPackageRuntimeRoot, "libs", "sweetline"),
  );

  console.log(`[sdk] runtime prepared at ${sdkPackageRuntimeRoot}`);
}

main().catch((error) => {
  console.error("[sdk] prepare-runtime failed");
  console.error(error);
  process.exitCode = 1;
});
