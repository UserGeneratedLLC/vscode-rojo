#!/usr/bin/env bash
# Publish Atlas extension to VS Code Marketplace and Open VSX
set -euo pipefail

# Load .env file from script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
    echo "Loaded .env"
fi

echo "Building Atlas extension..."

npm install
npm run package

echo "Packaging extension..."

npx --yes @vscode/vsce package --no-dependencies

vsix=$(ls -t *.vsix 2>/dev/null | head -n1)

if [ -z "$vsix" ]; then
    echo "Error: No .vsix file found after packaging." >&2
    exit 1
fi

echo "Publishing $vsix..."

# VS Code Marketplace
if [ -z "${VSCE_PAT:-}" ]; then
    echo "Warning: VSCE_PAT not set, skipping VS Code Marketplace publish."
else
    echo "Publishing to VS Code Marketplace..."
    npx --yes @vscode/vsce publish --no-dependencies --pat "$VSCE_PAT"
    echo "Published to VS Code Marketplace."
fi

# Open VSX
if [ -z "${OVSX_PAT:-}" ]; then
    echo "Warning: OVSX_PAT not set, skipping Open VSX publish."
else
    echo "Publishing to Open VSX..."
    npx --yes ovsx publish "$vsix" --pat "$OVSX_PAT"
    echo "Published to Open VSX."
fi

echo "Done."
