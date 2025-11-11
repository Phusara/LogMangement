# Setup Guide: On-Premise Appliance

This guide details the setup of the LogMangement application using Docker.

## Prerequisites

Before you begin, ensure you have the following software installed on your host machine:
* **Git**: To clone the repository.
* **Docker**: To build and run the service containers.
* **Docker Compose**: To orchestrate the multi-container application.
* **Node**: To run Javascript
* **npm**: Install Packages and run Frontend

By Checking if you have one or not

```bash
node --version
npm --version
docker --version
docker-compose --version
```
If you doesn't have one yet 
### For windows
https://git-scm.com/install/windows <br>
www.docker.com/get-started <br>
https://nodejs.org/
#### Node and npm
1. Run the Installer
2. Once the .msi file has finished downloading, open it to begin the installation.
3. The setup wizard will appear. Click "Next" to continue.
4. Accept the license agreement and click "Next".
5. You can leave the destination folder as the default. Click "Next".
6. On the "Custom Setup" screen, just click "Next". The default settings are perfect and include npm package manager.
7. On the "Tools for Native Modules" screen, you can leave the box unchecked unless you know you'll be working with specific C/C++ modules. Click "Next".
8. Click "Install" to begin the installation. You may be asked to grant administrator permission.
---
### For MacOS
```bash
# Install Homebrew (If doesn't have one yet)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker 

# Install Node.js
brew install node

# Install Git
brew install git

```
www.docker.com/get-started
---
### For Linux
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# add user to docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Check versions
node --version
npm --version
docker --version
docker-compose --version

# Restart session
exit
```

---

## 1. Installation

First, clone the LogMangement repository to your local machine:

```bash
git clone https://github.com/Phusara/LogMangement.git
cd LogMangement
```
---
## 2. Start the Project
### For Windows
```
# Run this file with powershell
./Makefile/runDev.ps1
```
---
### For MacOs & Linux
```bash
# Make it executable (first time only)
chmod +x Makefile/runDev.sh

# Run the script
./Makefile/runDev.sh

# Or with clean option
./Makefile/runDev.sh --clean
```
