#!/bin/bash

# runProd.sh - Automated script to start production environment
# This script manages Docker Compose for the LogManagement application in production mode

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
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174,http://localhost,http://40.81.187.175:8080
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
    if ! pip3 show requests > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} 'requests' library not found. Installing..."
        if ! pip3 install requests; then
             echo -e "${RED}Failed to install 'requests'. Please install it manually.${NC}"
             exit 1
        fi
    else
        echo -e "${GREEN}✓${NC} 'requests' library already installed."
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
        if python3 Makefile/demo_dataPROD.py; then
            echo -e "${GREEN}✓${NC} Demo data successfully seeded."
        else
            echo -e "${RED}✗${NC} Failed to seed demo data. Check API status."
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
