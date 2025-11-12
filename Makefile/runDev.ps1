# runDev.ps1 - Automated script to start development environment (PowerShell version)
# This script manages Docker Compose for the LogManagement application

param(
    [switch]$Clean,
    [switch]$Help
)

# Show help
if ($Help) {
    Write-Host @"
Usage: .\Makefile\runDev.ps1 [OPTIONS]

Options:
  -Clean         Remove volumes before starting (database data will be lost)
  -Help          Show this help message

Examples:
  .\Makefile\runDev.ps1              Start development environment
  .\Makefile\runDev.ps1 -Clean       Clean and start development environment
"@
    exit 0
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LogManagement Development Environment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is running
function Test-Docker {
    Write-Host "Checking Docker status... " -NoNewline
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not running"
        }
        Write-Host "OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    Write-Host "Checking Docker Compose... " -NoNewline
    try {
        $null = docker-compose --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose not found"
        }
        Write-Host "OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Write-Host "Error: Docker Compose is not installed." -ForegroundColor Red
        return $false
    }
}

# Function to create .env files if they don't exist
function New-EnvFiles {
    Write-Host "Setting up environment files..." -ForegroundColor Cyan
    
    # Create backend/.env if it doesn't exist
    if (-not (Test-Path "backend\.env")) {
        Write-Host "[!] backend\.env not found, creating..." -ForegroundColor Yellow
        @"
DATABASE_URL=postgresql://postgres:mysql@db:5432/logs_user
SECRET_KEY=a6lg9d3n5v1r8x2y7z0q4w2e5t8u1i3o6p
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174,http://localhost:8000
"@ | Set-Content -Path "backend\.env" -Encoding ASCII
        Write-Host "[+] backend\.env created" -ForegroundColor Green
    }
    else {
        Write-Host "[+] backend\.env exists" -ForegroundColor Green
    }
    
    # Create frontend/.env if it doesn't exist
    if (-not (Test-Path "frontend\.env")) {
        Write-Host "[!] frontend\.env not found, creating..." -ForegroundColor Yellow
        @"
VITE_API_BASE_URL=http://localhost:8000
"@ | Set-Content -Path "frontend\.env" -Encoding ASCII
        Write-Host "[+] frontend\.env created" -ForegroundColor Green
    }
    else {
        Write-Host "[+] frontend\.env exists" -ForegroundColor Green
    }
    
    # Create root .env if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-Host "[!] .env not found, creating..." -ForegroundColor Yellow
        @"
POSTGRES_USER=postgres
POSTGRES_DB=logs_user
"@ | Set-Content -Path ".env" -Encoding ASCII
        Write-Host "[+] .env created" -ForegroundColor Green
    }
    else {
        Write-Host "[+] .env exists" -ForegroundColor Green
    }
}

# --- NEW FUNCTION ---
# Function to check for python dependencies
function Test-PythonDeps {
    Write-Host ""
    Write-Host "Checking Python dependencies (requests)..." -ForegroundColor Cyan
    python3 -m pip show requests > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] 'requests' library not found. Installing..." -ForegroundColor Yellow
        python3 -m pip install requests
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[-] Failed to install 'requests'. Please install it manually." -ForegroundColor Red
            return $false
        }
        Write-Host "[+] 'requests' library installed." -ForegroundColor Green
    }
    else {
        Write-Host "[+] 'requests' library already installed." -ForegroundColor Green
    }
    return $true
}

# Function to check required files
function Test-RequiredFiles {
    Write-Host "Checking required files..." -ForegroundColor Cyan
    
    $missingFiles = $false
    
    if (-not (Test-Path "docker-compose.yml")) {
        Write-Host "[-] docker-compose.yml not found" -ForegroundColor Red
        $missingFiles = $true
    }
    else {
        Write-Host "[+] docker-compose.yml" -ForegroundColor Green
    }
    
    if (-not (Test-Path "docker-compose.override.yml")) {
        Write-Host "[!] docker-compose.override.yml not found (optional)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[+] docker-compose.override.yml" -ForegroundColor Green
    }
    
    if ($missingFiles) {
        Write-Host "Error: Required files are missing" -ForegroundColor Red
        return $false
    }
    return $true
}

# Function to stop existing containers
function Stop-Containers {
    Write-Host ""
    Write-Host "Stopping existing containers..." -ForegroundColor Cyan
    docker-compose down 2>$null
    Write-Host "Containers stopped" -ForegroundColor Green
}

# Function to clean up
function Remove-Volumes {
    Write-Host ""
    $response = Read-Host "Do you want to remove volumes (database data will be lost)? [y/N]"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Removing volumes..." -ForegroundColor Yellow
        docker-compose down -v
        Write-Host "Volumes removed" -ForegroundColor Green
    }
}

# Function to build and start containers
function Start-DevEnvironment {
    Write-Host ""
    Write-Host "Building and starting development environment..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    # Build and start in detached mode
    docker-compose up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  Development environment is running!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:"
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "  Vector Syslog Ports: 514, 515, 9000-9004 (UDP)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  View logs:    docker-compose logs -f"
        Write-Host "  Stop:         docker-compose down"
        Write-Host "  Restart:      docker-compose restart"
        Write-Host ""
        
        # Show container status
        Write-Host "Container Status:" -ForegroundColor Cyan
        docker-compose ps
        
        # --- START OF MODIFIED SECTION ---
        Write-Host ""
        Write-Host "-----------------------------------------" -ForegroundColor Cyan
        Write-Host "  Seeding Development Demo Data" -ForegroundColor Cyan
        Write-Host "-----------------------------------------" -ForegroundColor Cyan
        Write-Host "Waiting 10s for API to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        Write-Host "Running demo_dataDEV.py..."
        python3 init/demo_dataDEV.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[+] Demo data successfully seeded." -ForegroundColor Green # <-- DELETE THIS
        }
        else {
            Write-Host "[-] Failed to seed demo data. Check API status." -ForegroundColor Red
        }
        # --- END OF MODIFIED SECTION ---

        Write-Host ""
        $response = Read-Host "Do you want to view logs now? [y/N]"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host ""
            Write-Host "Showing logs (press Ctrl+C to exit)..." -ForegroundColor Yellow
            docker-compose logs -f
        }
    }
    else {
        Write-Host "Failed to start containers" -ForegroundColor Red
        Write-Host "Check the logs with: docker-compose logs" -ForegroundColor Yellow
        exit 1
    }
}

# Main execution
function Main {
    # Change to script directory
    $scriptPath = Split-Path -Parent $PSCommandPath
    $rootPath = Split-Path -Parent $scriptPath
    Set-Location $rootPath
    
    Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan
    Write-Host ""
    
    # Run checks
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-DockerCompose)) { exit 1 }
    if (-not (Test-RequiredFiles)) { exit 1 }
    if (-not (Test-PythonDeps)) { exit 1 } # <-- ADDED THIS LINE
    
    # Create .env files if they don't exist
    New-EnvFiles
    
    # Stop existing containers
    Stop-Containers
    
    # Optional cleanup
    if ($Clean) {
        Remove-Volumes
    }
    
    # Start development environment
    Start-DevEnvironment
}

# Run main function
Main