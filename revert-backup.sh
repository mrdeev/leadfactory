#!/bin/bash
# Revert all redesigned files back to their original versions
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP="$DIR/src/_backup"

echo "🔄 Reverting all files from backup..."

cp "$BACKUP/app/globals.css" "$DIR/src/app/globals.css"
cp "$BACKUP/app/layout.tsx" "$DIR/src/app/layout.tsx"
cp "$BACKUP/app/page.tsx" "$DIR/src/app/page.tsx"
cp "$BACKUP/app/dashboard/layout.tsx" "$DIR/src/app/dashboard/layout.tsx"
cp "$BACKUP/app/dashboard/page.tsx" "$DIR/src/app/dashboard/page.tsx"
cp "$BACKUP/app/dashboard/contacts/page.tsx" "$DIR/src/app/dashboard/contacts/page.tsx"
cp "$BACKUP/app/dashboard/messages/page.tsx" "$DIR/src/app/dashboard/messages/page.tsx"
cp "$BACKUP/app/dashboard/meetings/page.tsx" "$DIR/src/app/dashboard/meetings/page.tsx"
cp "$BACKUP/app/dashboard/linkedin-scraper/page.tsx" "$DIR/src/app/dashboard/linkedin-scraper/page.tsx"
cp "$BACKUP/app/dashboard/[productId]/page.tsx" "$DIR/src/app/dashboard/[productId]/page.tsx"
cp "$BACKUP/components/layout/Sidebar.tsx" "$DIR/src/components/layout/Sidebar.tsx"
cp "$BACKUP/components/layout/DashboardLayout.tsx" "$DIR/src/components/layout/DashboardLayout.tsx"

# Remove new files that didn't exist before
rm -f "$DIR/src/lib/supabase.ts"
rm -f "$DIR/src/hooks/useAuth.ts"
rm -f "$DIR/src/components/providers/AuthProvider.tsx"
rm -rf "$DIR/src/app/(auth)"
rm -f "$DIR/src/middleware.ts"

echo "✅ All files reverted successfully!"
echo "Run 'npm run dev' to see the original version."
