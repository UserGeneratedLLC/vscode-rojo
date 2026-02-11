# Publish Atlas extension to VS Code Marketplace and Open VSX
$ErrorActionPreference = "Stop"

# Load .env file from script directory
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
    Write-Host "Loaded .env" -ForegroundColor Gray
}

Write-Host "Building Atlas extension..." -ForegroundColor Cyan

npm install
npm run package

Write-Host "Packaging extension..." -ForegroundColor Cyan

npx --yes @vscode/vsce package --no-dependencies

$vsix = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $vsix) {
    Write-Host "Error: No .vsix file found after packaging." -ForegroundColor Red
    exit 1
}

Write-Host "Publishing $($vsix.Name)..." -ForegroundColor Cyan

# VS Code Marketplace
if (-not $env:VSCE_PAT) {
    Write-Host "Warning: VSCE_PAT not set, skipping VS Code Marketplace publish." -ForegroundColor Yellow
} else {
    Write-Host "Publishing to VS Code Marketplace..." -ForegroundColor Cyan
    npx --yes @vscode/vsce publish --packagePath $vsix.FullName --pat $env:VSCE_PAT
    Write-Host "Published to VS Code Marketplace." -ForegroundColor Green
}

# Open VSX
if (-not $env:OVSX_PAT) {
    Write-Host "Warning: OVSX_PAT not set, skipping Open VSX publish." -ForegroundColor Yellow
} else {
    Write-Host "Publishing to Open VSX..." -ForegroundColor Cyan
    npx --yes ovsx publish $vsix.FullName --pat $env:OVSX_PAT
    Write-Host "Published to Open VSX." -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Green
