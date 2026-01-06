// File: scripts/release.js (project root: obsidian-latex-pdf)
// Purpose: Centralised release helper to bump plugin version (patch/minor/major)
//          in package.json, manifest.json, and versions.json, and optionally
//          run build. This script is designed to be called from npm scripts.

/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Parse a semantic version string (e.g. "0.1.10") into numeric components.
 * @param {string} version
 * @returns {{ major: number; minor: number; patch: number }}
 */
function parseVersion(version) {
  const parts = version.split(".").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  const [major, minor, patch] = parts;
  return { major, minor, patch };
}

/**
 * Bump a semantic version string according to the given level.
 * @param {string} current
 * @param {"patch"|"minor"|"major"} level
 * @returns {string}
 */
function bumpVersion(current, level) {
  const { major, minor, patch } = parseVersion(current);

  switch (level) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Read and parse a JSON file from disk.
 * @param {string} path
 * @returns {any}
 */
function readJson(path) {
  const fs = require("fs");
  const raw = fs.readFileSync(path, "utf8");
  return JSON.parse(raw);
}

/**
 * Write an object as pretty-printed JSON to disk.
 * @param {string} path
 * @param {any} data
 */
function writeJson(path, data) {
  const fs = require("fs");
  const content = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(path, content, "utf8");
}

(function main() {
  const path = require("path");

  const level = (process.argv[2] || "patch").toLowerCase();
  if (!["patch", "minor", "major"].includes(level)) {
    console.error(
      `Invalid release level '${level}'. Use one of: patch, minor, major.`,
    );
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, "package.json");
  const manifestPath = path.join(projectRoot, "manifest.json");
  const versionsPath = path.join(projectRoot, "versions.json");

  const pkg = readJson(packageJsonPath);
  const manifest = readJson(manifestPath);
  const versions = readJson(versionsPath);

  const currentVersion = pkg.version;
  const nextVersion = bumpVersion(currentVersion, level);

  // Update package.json
  pkg.version = nextVersion;

  // Update manifest.json version to match package.json
  manifest.version = nextVersion;

  // Ensure versions.json maps plugin version to minAppVersion.
  const minAppVersion = manifest.minAppVersion || "1.5.0";
  versions[nextVersion] = minAppVersion;

  writeJson(packageJsonPath, pkg);
  writeJson(manifestPath, manifest);
  writeJson(versionsPath, versions);

  console.log(
    `Release bump (${level}) completed: ${currentVersion} -> ${nextVersion}`,
  );
  console.log(
    "Remember to run 'npm run build' so main.js is in sync before committing.",
  );
})();
