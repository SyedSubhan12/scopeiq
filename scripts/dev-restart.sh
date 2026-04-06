#!/bin/bash
# Clean and restart the Next.js dev server with Turbopack

echo "🧹 Clearing build caches..."
rm -rf apps/web/.next
rm -rf apps/web/.turbo
rm -rf apps/api/.turbo
rm -rf .turbo

echo "✅ Cache cleared. Starting dev server with Turbopack..."
echo "⚡ HMR should now be 5-10x faster!"
echo ""

pnpm dev
