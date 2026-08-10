/**
 * Version constant — single source of truth for the entire monorepo.
 * 
 * Update this value, then run:
 *   node scripts/sync-version.js
 * 
 * This will propagate the version to all package.json files.
 * Then commit and run:
 *   bash scripts/tag-release.sh
 * 
 * to create a git tag and push to GitHub.
 */
export const VERSION = "0.1.1";
