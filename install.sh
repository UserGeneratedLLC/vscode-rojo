#!/usr/bin/env bash
# Install Atlas VS Code/Cursor extension locally
set -euo pipefail

echo "Building Atlas extension..."

npm install
npm run compile

echo "Packaging extension..."

npx --yes @vscode/vsce package --no-dependencies

vsix=$(ls -t *.vsix 2>/dev/null | head -n1)

if [ -z "$vsix" ]; then
    echo "Error: No .vsix file found after packaging." >&2
    exit 1
fi

echo "Installing $vsix..."

installed=false

if command -v cursor &>/dev/null; then
    cursor --install-extension "$vsix"
    echo "Installed to Cursor."
    installed=true
fi

if command -v code &>/dev/null; then
    code --install-extension "$vsix"
    echo "Installed to VS Code."
    installed=true
fi

if [ "$installed" = false ]; then
    echo "Built: $vsix"
    echo "No editor CLI found. Install manually with: <editor> --install-extension $vsix"
fi

echo "Done. Restart your editor to activate."
