\
# apply.ps1
Param([string]$ProjectRoot = ".")

$ErrorActionPreference = "Stop"

$src = Join-Path $PSScriptRoot "app\api\messages\[conversationId]\route.ts"
$dst = Join-Path $ProjectRoot "app\api\messages\[conversationId]\route.ts"

$dstDir = Split-Path $dst -Parent
if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }

Copy-Item -LiteralPath $src -Destination $dst -Force

$next = Join-Path $ProjectRoot ".next"
if (Test-Path $next) { Remove-Item -Recurse -Force $next }

Write-Host "Patched: $dst"
