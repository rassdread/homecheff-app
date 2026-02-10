#!/usr/bin/env bash
# apply.sh
set -euo pipefail
PROJECT_ROOT="${1:-.}"

SRC="$(dirname "$0")/app/api/messages/[conversationId]/route.ts"
DST="$PROJECT_ROOT/app/api/messages/[conversationId]/route.ts"

mkdir -p "$(dirname "$DST")"
cp -f "$SRC" "$DST"

if [ -d "$PROJECT_ROOT/.next" ]; then
  rm -rf "$PROJECT_ROOT/.next"
fi

echo "Patched: $DST"
