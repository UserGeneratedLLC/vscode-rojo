# Install Atlas VS Code/Cursor extension locally
$ErrorActionPreference = "Stop"

Write-Host "Building Atlas extension..." -ForegroundColor Cyan

npm install
npm run compile

Write-Host "Packaging extension..." -ForegroundColor Cyan

npx --yes @vscode/vsce package --no-dependencies

$vsix = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $vsix) {
    Write-Host "Error: No .vsix file found after packaging." -ForegroundColor Red
    exit 1
}

Write-Host "Installing $($vsix.Name)..." -ForegroundColor Cyan

$installed = $false

if (Get-Command cursor -ErrorAction SilentlyContinue) {
    cursor --install-extension $vsix.FullName
    Write-Host "Installed to Cursor." -ForegroundColor Green
    $installed = $true
}

if (Get-Command code -ErrorAction SilentlyContinue) {
    code --install-extension $vsix.FullName
    Write-Host "Installed to VS Code." -ForegroundColor Green
    $installed = $true
}

if (-not $installed) {
    Write-Host "Built: $($vsix.Name)" -ForegroundColor Yellow
    Write-Host "No editor CLI found. Install manually with: <editor> --install-extension $($vsix.FullName)" -ForegroundColor Yellow
}

Write-Host "Done. Restart your editor to activate." -ForegroundColor Green
