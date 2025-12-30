#!/bin/bash
echo "🚀 Memulai Deployment..."

# Tarik kode terbaru dari Git (Opsional jika pakai Git)
# git pull origin main

# Build dan jalankan ulang container
docker compose up -d --build

# Bersihkan image lama yang tidak terpakai (menghemat disk)
docker image prune -f

echo "✅ Deployment Selesai!"
docker compose ps