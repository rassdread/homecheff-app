# Deployment script voor HomeCheff
param(
    [string]$message = "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$skipBuild,
    [switch]$preview
)

Write-Host "🚀 HomeCheff Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Build (als niet overgeslagen)
if (-not $skipBuild) {
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
}

# Git add
Write-Host "📝 Staging changes..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git add failed!" -ForegroundColor Red
    exit 1
}

# Git commit (alleen als er changes zijn)
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m $message
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Git commit failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Committed: $message" -ForegroundColor Green
    Write-Host ""
    
    # Git push
    Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Git push failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Cyan
    Write-Host ""
}

# Vercel deploy
if ($preview) {
    Write-Host "🔍 Deploying preview..." -ForegroundColor Yellow
    vercel
} else {
    Write-Host "🚀 Deploying to production..." -ForegroundColor Yellow
    vercel --prod
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "🌐 Check your Vercel dashboard for the live URL" -ForegroundColor Cyan

