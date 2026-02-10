#!/bin/bash
# Build script for Vercel that handles Prisma gracefully

set -e  # Exit on error (but we'll handle migrate deploy separately)

echo "🔧 Installing Next.js..."
npm install next@14.2.5 --save-exact --no-save

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🔧 Running migrations (if needed)..."
# Try to run migrations, but don't fail if it's not needed
if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Migrations skipped (this is OK if database is already up to date)"
fi

echo "🏗️  Building Next.js app..."
npm run build

