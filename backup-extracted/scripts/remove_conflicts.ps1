
Write-Host "Removing legacy API files causing route conflicts (if they exist)..."

$paths = @(
  "app/api/upload.ts",
  "app/api/profile/photo.ts"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item $p -Force
    Write-Host "Removed $p"
  } else {
    Write-Host "Not found: $p"
  }
}

Write-Host "Done. Only folder-based route handlers should remain (e.g., app/api/upload/route.ts)."
