#!/bin/bash

echo "🔍 Entity change detected — checking schema diff..."

output=$(npm run migration:generate -- src/database/migrations/AutoMigration 2>&1)
echo "$output"

if echo "$output" | grep -q "has been generated successfully"; then
  echo "📦 Migration generated — applying..."
  npm run migration:run
  echo "✅ Migration applied."
elif echo "$output" | grep -q "No changes in database schema"; then
  echo "⏭️  No schema changes — skipping."
else
  echo "❌ Migration generation failed. Check the output above."
  exit 1
fi
