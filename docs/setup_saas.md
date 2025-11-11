# Setup Log Management System
### Hardware requirement
- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 40 GB Disk

## 1.Install Docker, Docker-compose and Git
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git
git --version  # ตรวจสอบ version

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# put user in docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Checking versions
git --version
docker --version
docker-compose --version

# Restart session
exit
# Login SSH again
```
## 2.Clone project to VM
```bash
# Clone repository
git clone https://github.com/pigglegiggle/log-management.git
cd log-management
```
## 3.Run script file
```bash
# Make it executable (first time only)
chmod +x Makefile/runProd.sh

# Run the script
./Makefile/runProd.sh

# Or with clean option
./Makefile/runProd.sh --clean
```
## Additional info
### URLs 
**Frontend**: http://VM-public-ip:80 or your domain <br>
**Backend API**: http://VM-public-ip:8080 <br>
**Ingest Service**: http://VM-public-ip or domain with port security group
### Security Group Configuration
|Port | IP|
|---|---|
|Port 22   (SSH)     | - Your IP   |
|Port 80   (HTTP)     |- 0.0.0.0/0|
|Port 443  (HTTPS)    |- 0.0.0.0/0|
|Port 9000 - 9004 (Ingest)   |- 0.0.0.0/0|
|Port 443 (Frontend) |- 0.0.0.0/0|
|Port 8000 (Backend)  |- 0.0.0.0/0|
|Port 514  (Syslog)   |- 0.0.0.0/0|
|Port 515  (Syslog)   |- 0.0.0.0/0|



