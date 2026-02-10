
#!/usr/bin/env bash
set -euo pipefail

echo "Removing legacy API files causing route conflicts (if they exist)..."
rm -f app/api/upload.ts || true
rm -f app/api/profile/photo.ts || true

echo "Done. Only folder-based route handlers should remain (e.g., app/api/upload/route.ts)."
