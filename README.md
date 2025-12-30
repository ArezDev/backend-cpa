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

# Docker Build

```bash
docker compose up -d --build
```