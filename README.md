## API BACKEND CPA ##
Sebelum deploy=>

## File Docker build production
DockerfileBuild > Dockerfile
docker-compose-build > docker-compose.yml

## SWAP File 4GB

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# Agar permanen setelah reboot:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

# Setting Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

# path app

```bash
sudo nano /etc/nginx/sites-available/app-nextjs
```
```bash
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;

    # Optimalisasi Ukuran Upload (Jika ada upload file)
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout lebih lama karena ada proses Kafka/Prisma yang mungkin delay
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

# Lanjut symlink

```bash
sudo ln -s /etc/nginx/sites-available/app-nextjs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

# Deploy gaskennn

```bash
chmod +x deploy.sh && ./deploy.sh
```