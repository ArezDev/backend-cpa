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

## Swappines

```bash
# Cek nilai saat ini
cat /proc/sys/vm/swappiness

# Ubah ke 10
sudo sysctl vm.swappiness=10

# Buat permanen
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
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
    server_name domainanda.com www.domainanda.com;

    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:3000; 
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        
        proxy_read_timeout 90s;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.domainanda.com) { return 301 https://$host$request_uri; }
    if ($host = domainanda.com) { return 301 https://$host$request_uri; }
    listen 80;
    server_name domainanda.com www.domainanda.com;
    return 404; 
}
```

# Lanjut symlink

```bash
sudo ln -s /etc/nginx/sites-available/app-nextjs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

# UFW FIREWALL

```bash
# Blokir port 3000 dari akses luar (hanya biarkan Nginx internal yang akses)
sudo ufw deny 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

# Deploy gaskennn

```bash
chmod +x deploy.sh && ./deploy.sh
```