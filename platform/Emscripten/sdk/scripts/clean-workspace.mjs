import path from "node:path";
import { fileURLToPath } from "node:url";

import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(__dirname, "..");
const packagesRoot = path.resolve(sdkRoot, "packages");
const demoDist = path.resolve(sdkRoot, "apps", "demo", "dist");
const buildArtifactPattern = /\.(?:js|js\.map|d\.ts|d\.ts\.map)$/u;
const tsBuildInfoPattern = /\.tsbuildinfo$/u;

async function removeIfExists(targetPath) {
  if (await fs.pathExists(targetPath)) {
    await fs.remove(targetPath);
    return 1;
  }
  return 0;
}

async function removeBuildArtifactsInSource(sourceRoot) {
  if (!(await fs.pathExists(sourceRoot))) {
    return 0;
  }

  let removedCount = 0;
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.resolve(sourceRoot, entry.name);
    if (entry.isDirectory()) {
      removedCount += await removeBuildArtifactsInSource(fullPath);
      continue;
    }
    if (buildArtifactPattern.test(entry.name)) {
      await fs.remove(fullPath);
      removedCount += 1;
    }
  }
  return removedCount;
}

async function removeTsBuildInfoFiles(rootPath) {
  if (!(await fs.pathExists(rootPath))) {
    return 0;
  }

  let removedCount = 0;
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === "node_modules") {
      continue;
    }
    const fullPath = path.resolve(rootPath, entry.name);
    if (entry.isDirectory()) {
      removedCount += await removeTsBuildInfoFiles(fullPath);
      continue;
    }
    if (tsBuildInfoPattern.test(entry.name)) {
      await fs.remove(fullPath);
      removedCount += 1;
    }
  }
  return removedCount;
}

async function main() {
  let removedDirs = 0;
  let removedFiles = 0;

  const packageNames = await fs.readdir(packagesRoot);
  for (const packageName of packageNames) {
    const packageRoot = path.resolve(packagesRoot, packageName);
    const stat = await fs.stat(packageRoot);
    if (!stat.isDirectory()) {
      continue;
    }

    removedDirs += await removeIfExists(path.resolve(packageRoot, "dist"));
    if (packageName === "sdk") {
      removedDirs += await removeIfExists(path.resolve(packageRoot, "runtime"));
    }
    removedFiles += await removeBuildArtifactsInSource(path.resolve(packageRoot, "src"));
    removedFiles += await removeTsBuildInfoFiles(packageRoot);
  }

  removedDirs += await removeIfExists(demoDist);
  removedFiles += await removeTsBuildInfoFiles(path.resolve(sdkRoot, "apps"));

  console.log(
    `[sdk] workspace cleaned: removed ${removedDirs} directories and ${removedFiles} files`,
  );
}

main().catch((error) => {
  console.error("[sdk] clean failed");
  console.error(error);
  process.exitCode = 1;
});
