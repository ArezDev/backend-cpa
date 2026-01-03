#!/bin/sh
set -e

echo "🚀 Running Database Migrations..."
# npx prisma migrate deploy menjalankan migrasi tanpa mereset database
npx prisma migrate deploy

echo "🌐 Starting Next.js Server..."
node server.js