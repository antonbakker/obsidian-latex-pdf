// File: scripts/gh-release.js
// Purpose: Create a GitHub Release for the current package.json version
// using the GitHub CLI (`gh`). This script is intended to be invoked from
// an npm script after the version bump, build, commit, and push.

/* eslint-disable @typescript-eslint/no-var-requires */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function readJson(p) {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

(function main() {
  const projectRoot = process.cwd();
  const pkgPath = path.join(projectRoot, "package.json");
  const pkg = readJson(pkgPath);

  const version = pkg.version;
  if (!version) {
    console.error("package.json does not contain a version field");
    process.exit(1);
  }

  const tag = `v${version}`;
  const title = tag;

  try {
    // Ensure gh is available
    execSync("gh --version", { stdio: "ignore" });
  } catch (err) {
    console.error("GitHub CLI (gh) is not installed or not on PATH.");
    console.error("Install it and run 'gh auth login' before using this script.");
    process.exit(1);
  }

  console.log(`Creating GitHub release for ${tag}...`);

  try {
    // This will create the tag on GitHub if it does not yet exist, and
    // associate the release with it. It uses the current default branch's
    // HEAD on GitHub as the target.
    execSync(
      `gh release create ${tag} manifest.json main.js styles.css --title "${title}"`,
      { stdio: "inherit" }
    );
  } catch (err) {
    console.error("Failed to create GitHub release via gh.");
    process.exit(1);
  }
})();
