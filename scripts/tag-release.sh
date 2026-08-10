#!/bin/bash

##
# tag-release.sh
#
# Creates a git tag for the current version and pushes it to GitHub.
#
# Usage:
#   bash scripts/tag-release.sh
#
# This script:
# 1. Validates that the working tree is clean (no uncommitted changes)
# 2. Extracts VERSION from packages/shared/src/version.ts
# 3. Creates an annotated git tag (v{VERSION})
# 4. Pushes the tag to origin (GitHub)
# 5. Reports success or error
#
# Requirements:
# - Git must be installed and configured
# - Working directory must be clean (all changes committed)
# - Remote 'origin' must be configured
##

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$ROOT_DIR/packages/shared/src/version.ts"

echo "🏷️  Creating git tag for release..."
echo ""

# Check if working tree is clean
if ! git -C "$ROOT_DIR" diff-index --quiet HEAD --; then
  echo "❌ Error: Working tree is not clean."
  echo "   Please commit all changes before tagging a release."
  echo ""
  echo "   Uncommitted changes:"
  git -C "$ROOT_DIR" status --short
  exit 1
fi

# Extract VERSION from packages/shared/src/version.ts
if [ ! -f "$VERSION_FILE" ]; then
  echo "❌ Error: Version file not found at $VERSION_FILE"
  exit 1
fi

VERSION=$(grep -oP 'export\s+const\s+VERSION\s*=\s*"\K[^"]+' "$VERSION_FILE")

if [ -z "$VERSION" ]; then
  echo "❌ Error: Could not extract VERSION from $VERSION_FILE"
  echo "   Expected format: export const VERSION = \"X.Y.Z\";"
  exit 1
fi

TAG_NAME="v$VERSION"

echo "✓ Extracted VERSION: $VERSION"
echo "✓ Tag name: $TAG_NAME"
echo ""

# Check if tag already exists
if git -C "$ROOT_DIR" rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo "❌ Error: Tag '$TAG_NAME' already exists."
  echo "   To delete it locally: git tag -d $TAG_NAME"
  echo "   To delete it on GitHub: git push origin --delete $TAG_NAME"
  exit 1
fi

# Create annotated tag
echo "Creating annotated tag..."
git -C "$ROOT_DIR" tag -a "$TAG_NAME" -m "Release $TAG_NAME"

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to create git tag."
  exit 1
fi

echo "✓ Tag created locally: $TAG_NAME"
echo ""

# Push tag to origin
echo "Pushing tag to GitHub..."
git -C "$ROOT_DIR" push origin "$TAG_NAME"

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to push tag to GitHub."
  echo "   The local tag was created but not pushed."
  echo "   To retry: git push origin $TAG_NAME"
  exit 1
fi

echo "✓ Tag pushed to GitHub"
echo ""
echo "=================================================="
echo "✅ Release tagged successfully!"
echo ""
echo "Tag: $TAG_NAME"
echo "GitHub: https://github.com/$(git -C "$ROOT_DIR" config --get remote.origin.url | sed 's/.*://;s/.git$//')/releases/tag/$TAG_NAME"
echo ""
echo "Next steps:"
echo "  1. Create a GitHub release from the tag (optional)"
echo "  2. Deploy to production"
echo "=================================================="
