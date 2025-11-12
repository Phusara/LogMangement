set -e  # Exit on error

echo "========================================="
echo "  LogManagement Production Environment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    echo -n "Checking Docker status... "
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}FAILED${NC}"
        echo "Error: Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo -e "${GREEN}OK${NC}"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    echo -n "Checking Docker Compose... "
    if ! docker-compose --version > /dev/null 2>&1; then
        echo -e "${RED}FAILED${NC}"
        echo "Error: Docker Compose is not installed."
        exit 1
    fi
    echo -e "${GREEN}OK${NC}"
}

# Function to create production .env files
create_env_files() {
    echo "Setting up production environment files..."
    echo ""
    
    # Create backend/.env if it doesn't exist
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}[!]${NC} backend/.env not found, creating production configuration..."
        
        # Generate a secure random secret key
        SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
        
        cat > backend/.env << EOF
DATABASE_URL="postgresql://postgres:mysql@db:5432/logs_user"
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174,http://localhost,http://40.81.187.175:80
EOF
        echo -e "${GREEN}[+]${NC} backend/.env created with secure secret key"
        echo -e "${YELLOW}    Note: SECRET_KEY has been auto-generated${NC}"
    else
        echo -e "${GREEN}[+]${NC} backend/.env exists"
    fi
    
    # Create frontend/.env if it doesn't exist
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW}[!]${NC} frontend/.env not found, creating..."
        cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=/api
EOF
        echo -e "${GREEN}[+]${NC} frontend/.env created"
        echo -e "${YELLOW}    Note: API requests will be proxied through nginx${NC}"
    else
        echo -e "${GREEN}[+]${NC} frontend/.env exists"
    fi
    
    # Create root .env if it doesn't exist (for docker-compose)
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}[!]${NC} .env not found, creating..."
        cat > .env << 'EOF'
POSTGRES_USER=postgres
POSTGRES_DB=logs_user
EOF
        echo -e "${GREEN}[+]${NC} .env created"
    else
        echo -e "${GREEN}[+]${NC} .env exists"
    fi
    
    echo ""
}

check_python_deps() {
    echo ""
    echo "Checking Python dependencies (requests)..."
    # If pip3 is not present on the host, fall back to running the seeding script inside the backend container.
    USE_DOCKER_PYTHON=0
    if ! command -v pip3 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} pip3 not found on host. The demo seeding will be executed inside the backend container."
        USE_DOCKER_PYTHON=1
        return 0
    fi

    # If pip3 exists, prefer installing from requirements.txt if available, otherwise try to install requests directly.
    if ! pip3 show requests > /dev/null 2>&1; then
        if [ -f "requirements.txt" ]; then
            echo -e "${YELLOW}⚠${NC} 'requests' not found. Installing from requirements.txt..."
            if pip3 install -r requirements.txt; then
                echo -e "${GREEN}✓${NC} Python dependencies installed."
            else
                echo -e "${YELLOW}⚠${NC} Failed to install from requirements.txt. Will attempt to run seeding inside backend container."
                USE_DOCKER_PYTHON=1
            fi
        else
            echo -e "${YELLOW}⚠${NC} 'requests' not found and requirements.txt missing. The demo seeding will be executed inside the backend container."
            USE_DOCKER_PYTHON=1
        fi
    else
        echo -e "${GREEN}✓${NC} 'requests' library already installed on host."
    fi
}


# Function to check required files
check_files() {
    echo "Checking required files..."
    
    local missing_files=0
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}[-]${NC} docker-compose.yml not found"
        missing_files=1
    else
        echo -e "${GREEN}[+]${NC} docker-compose.yml"
    fi
    
    if [ ! -f "backend/Dockerfile.prod" ]; then
        echo -e "${RED}[-]${NC} backend/Dockerfile.prod not found"
        missing_files=1
    else
        echo -e "${GREEN}[+]${NC} backend/Dockerfile.prod"
    fi
    
    if [ ! -f "frontend/Dockerfile.prod" ]; then
        echo -e "${RED}[-]${NC} frontend/Dockerfile.prod not found"
        missing_files=1
    else
        echo -e "${GREEN}[+]${NC} frontend/Dockerfile.prod"
    fi
    
    if [ $missing_files -eq 1 ]; then
        echo -e "${RED}Error: Required files are missing${NC}"
        exit 1
    fi
}

# Function to show production warnings
show_production_warnings() {
    echo ""
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}  PRODUCTION DEPLOYMENT CHECKLIST${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    echo ""
    echo "Please ensure you have configured:"
    echo "  1. Strong SECRET_KEY in backend/.env"
    echo "  2. Production domain in CORS_ORIGINS"
    echo "  3. Production API URL in frontend/.env"
    echo "  4. SSL certificates in /etc/letsencrypt (if using HTTPS)"
    echo "  5. Database password (change from 'mysql' in docker-compose.yml)"
    echo "  6. Firewall rules for ports 80, 443, and syslog ports"
    echo ""
    read -p "Have you reviewed the above checklist? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled. Please review the checklist.${NC}"
        exit 0
    fi
}

# Function to stop existing containers
stop_containers() {
    echo ""
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    echo -e "${GREEN}Containers stopped${NC}"
}

# Function to clean up (optional)
cleanup() {
    echo ""
    read -p "Do you want to remove volumes (database data will be lost)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing volumes..."
        docker-compose -f docker-compose.yml down -v
        echo -e "${GREEN}Volumes removed${NC}"
    fi
}

# Function to pull latest images
pull_images() {
    echo ""
    echo "Pulling latest base images..."
    docker-compose -f docker-compose.yml pull db vector 2>/dev/null || true
    echo -e "${GREEN}Base images updated${NC}"
}

# Function to build and start containers
start_production() {
    # ... (rest of function) ...
    
    # Build and start in detached mode
    if docker-compose -f docker-compose.yml up --build -d; then
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}  Production environment is running!${NC}"
        # ... (all your echo statements for services) ...
        
        # Wait a moment for services to initialize
        echo "Waiting for services to initialize..."
        sleep 5
        
        # Show container status
        echo "Container Status:"
        docker-compose -f docker-compose.yml ps
        
        # --- START OF NEW SECTION ---
        echo ""
        echo "-----------------------------------------"
        echo -e "  Seeding Production Demo Data"
        echo "-----------------------------------------"
        echo "Waiting 10s for API to be ready..."
        sleep 10 # Wait for API

        echo "Running demo_dataPROD.py..."
        if [ "${USE_DOCKER_PYTHON:-0}" -eq 1 ]; then
            echo "Running demo seeding inside backend container..."

            # Get backend container id (if running)
            BACKEND_CID=$(docker-compose -f docker-compose.yml ps -q backend || true)

            # If container not found, try to start it short-lived to ensure it exists
            if [ -z "$BACKEND_CID" ]; then
                echo -e "${YELLOW}⚠${NC} Backend container not found. Attempting to ensure backend service is started..."
                docker-compose -f docker-compose.yml up -d backend || true
                sleep 2
                BACKEND_CID=$(docker-compose -f docker-compose.yml ps -q backend || true)
            fi

            # Try common paths inside container first
            if docker-compose -f docker-compose.yml exec -T backend python3 init/demo_dataPROD.py 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Demo data successfully seeded (inside container: init/)."
            elif docker-compose -f docker-compose.yml exec -T backend python3 /app/init/demo_dataPROD.py 2>/dev/null; then
                echo -e "${GREEN}✓${NC} Demo data successfully seeded (inside container: /app/init/)."
            else
                # Not present inside container — try to copy from host into container and run
                echo -e "${YELLOW}⚠${NC} demo_dataPROD.py not found inside container. Will try copying from host into container."

                # Candidate host locations (add any known host paths here)
                HOST_CANDIDATES=(
                    "backend/init/demo_dataPROD.py"
                    "backend/init/demoProd.py"
                    "/home/azureuser/LogMangement/init/demo_dataPROD.py"
                    "/home/azureuser/LogMangement/init/demoProd.py"
                )

                FOUND_HOST_FILE=""
                for p in "${HOST_CANDIDATES[@]}"; do
                    if [ -f "$p" ]; then
                        FOUND_HOST_FILE="$p"
                        break
                    fi
                done

                if [ -n "$FOUND_HOST_FILE" ] && [ -n "$BACKEND_CID" ]; then
                    echo "Found seeding script on host at: $FOUND_HOST_FILE"
                    echo "Copying into backend container ($BACKEND_CID) -> /tmp/demo_seed.py"
                    docker cp "$FOUND_HOST_FILE" "${BACKEND_CID}":/tmp/demo_seed.py
                    if docker-compose -f docker-compose.yml exec -T backend python3 /tmp/demo_seed.py; then
                        echo -e "${GREEN}✓${NC} Demo data successfully seeded (copied into container)."
                    else
                        echo -e "${RED}✗${NC} Failed to run copied demo_dataPROD.py inside container. Check backend logs."
                    fi
                else
                    if [ -z "$FOUND_HOST_FILE" ]; then
                        echo -e "${RED}✗${NC} No seeding script found on host. Looked at: ${HOST_CANDIDATES[*]}"
                        echo "Add backend/init/demo_dataPROD.py to the repo or update the Docker image to include it."
                    else
                        echo -e "${RED}✗${NC} Backend container not available to copy script into."
                    fi

                    # As a last resort attempt a one-off run (may fail if script missing in image)
                    echo -e "${YELLOW}⚠${NC} Attempting one-off container run as fallback..."
                    if docker-compose -f docker-compose.yml run --rm backend python3 init/demo_dataPROD.py; then
                        echo -e "${GREEN}✓${NC} Demo data successfully seeded (one-off container run)."
                    else
                        echo -e "${RED}✗${NC} Failed to seed demo data. Check backend logs and ensure seeding script is present in the image or on host."
                    fi
                fi
            fi
        else
            if python3 init/demo_dataPROD.py; then
                echo -e "${GREEN}✓${NC} Demo data successfully seeded (host python)."
            else
                echo -e "${RED}✗${NC} Failed to seed demo data using host python. If pip3 is missing or dependencies aren't installed, re-run with a system python/pip or let the script seed inside the backend container."
            fi
        fi
        echo "-----------------------------------------"
        # --- END OF NEW SECTION ---
        
        echo ""
        echo -e "${GREEN}Production deployment completed successfully!${NC}"
        echo ""
        
        # This prompt is now at the end
        read -p "Do you want to view logs now? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Showing logs (press Ctrl+C to exit)..."
            docker-compose -f docker-compose.yml logs -f
        fi
    else
        echo -e "${RED}Failed to start containers${NC}"
        echo "Check the logs with: docker-compose -f docker-compose.yml logs"
        exit 1
    fi
}

# Function to backup database
backup_database() {
    echo ""
    echo "Creating database backup..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f docker-compose.yml exec -T db pg_dump -U postgres logs_user > "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}Database backed up to: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}Warning: Could not create backup (database may not be running)${NC}"
    fi
}

# Main execution
main() {
    # Change to script directory
    cd "$(dirname "$0")/.." || exit 1
    
    echo "Working directory: $(pwd)"
    echo ""
    
    # Run checks
    check_docker
    check_docker_compose
    check_files
    check_python_deps
    
    # Create .env files if they don't exist
    create_env_files
    
    # Show production warnings
    if [ "$1" != "--skip-warnings" ]; then
        show_production_warnings
    fi
    
    # Backup database if it exists
    if [ "$1" == "--backup" ] || [ "$2" == "--backup" ]; then
        backup_database
    fi
    
    # Pull latest images
    pull_images
    
    # Stop existing containers
    stop_containers
    
    # Optional cleanup
    if [ "$1" == "--clean" ] || [ "$1" == "-c" ]; then
        cleanup
    fi
    
    # Start production environment
    start_production
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --clean, -c           Remove volumes before starting"
        echo "  --backup              Backup database before starting"
        echo "  --skip-warnings       Skip production checklist prompt"
        echo "  --help, -h            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    Start production environment"
        echo "  $0 --clean            Clean and start production environment"
        echo "  $0 --backup           Backup database and start production"
        echo "  $0 --skip-warnings    Start without prompts (for automation)"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
