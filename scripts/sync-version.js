#!/usr/bin/env node

/**
 * sync-version.js
 * 
 * Reads VERSION from packages/shared/src/version.ts and updates all package.json files.
 * 
 * Usage:
 *   node scripts/sync-version.js
 * 
 * This script:
 * 1. Extracts VERSION constant from packages/shared/src/version.ts using regex
 * 2. Updates version field in all 6 package.json files:
 *    - package.json (root)
 *    - apps/client/package.json
 *    - apps/server/package.json
 *    - packages/shared/package.json
 *    - packages/engine/package.json
 *    - packages/gamepad-input/package.json
 * 3. Validates that all updates succeeded
 * 4. Reports success or error
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// List of all package.json files to update
const packageJsonPaths = [
  "package.json",
  "apps/client/package.json",
  "apps/server/package.json",
  "packages/shared/package.json",
  "packages/engine/package.json",
  "packages/gamepad-input/package.json",
];

/**
 * Extract VERSION from packages/shared/src/version.ts
 * Looks for: export const VERSION = "X.Y.Z";
 */
function extractVersionFromTs() {
  const versionFilePath = path.join(rootDir, "packages/shared/src/version.ts");

  try {
    const content = fs.readFileSync(versionFilePath, "utf-8");
    // Match: export const VERSION = "X.Y.Z";
    const match = content.match(/export\s+const\s+VERSION\s*=\s*["']([^"']+)["']/);

    if (!match || !match[1]) {
      throw new Error(
        `Could not extract VERSION from ${versionFilePath}. Expected format: export const VERSION = "X.Y.Z";`
      );
    }

    return match[1];
  } catch (err) {
    console.error(`❌ Error reading version file: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Update version in a single package.json file
 */
function updatePackageJson(filePath, newVersion) {
  const fullPath = path.join(rootDir, filePath);

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const pkg = JSON.parse(content);

    const oldVersion = pkg.version;
    pkg.version = newVersion;

    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

    return { success: true, oldVersion, newVersion };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Main execution
 */
function main() {
  console.log("📦 Syncing version across all package.json files...\n");

  const newVersion = extractVersionFromTs();
  console.log(`✓ Extracted VERSION: ${newVersion}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const pkgPath of packageJsonPaths) {
    const result = updatePackageJson(pkgPath, newVersion);

    if (result.success) {
      console.log(`✓ ${pkgPath}`);
      console.log(`  ${result.oldVersion} → ${result.newVersion}`);
      successCount++;
    } else {
      console.error(`✗ ${pkgPath}`);
      console.error(`  Error: ${result.error}`);
      failureCount++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);

  if (failureCount === 0) {
    console.log(`✅ Success! Updated ${successCount} package.json files to v${newVersion}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Review changes: git diff`);
    console.log(`  2. Commit: git add -A && git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`  3. Tag: bash scripts/tag-release.sh`);
    process.exit(0);
  } else {
    console.error(
      `❌ Failed! ${failureCount} file(s) failed, ${successCount} succeeded.`
    );
    process.exit(1);
  }
}

main();
