#!/bin/bash

# runDev.sh - Automated script to start development environment
# This script manages Docker Compose for the LogManagement application

set -e  # Exit on error

echo "========================================="
echo "  LogManagement Development Environment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to create .env files if they don't exist
create_env_files() {
    echo "Setting up environment files..."
    
    # Create backend/.env if it doesn't exist
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}⚠${NC} backend/.env not found, creating..."
        cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://postgres:mysql@db:5432/logs_user
SECRET_KEY=a6lg9d3n5v1r8x2y7z0q4w2e5t8u1i3o6p
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5174
EOF
        echo -e "${GREEN}✓${NC} backend/.env created"
    else
        echo -e "${GREEN}✓${NC} backend/.env exists"
    fi
    
    # Create frontend/.env if it doesn't exist
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW}⚠${NC} frontend/.env not found, creating..."
        cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=http://localhost:8000
EOF
        echo -e "${GREEN}✓${NC} frontend/.env created"
    else
        echo -e "${GREEN}✓${NC} frontend/.env exists"
    fi
    
    # Create root .env if it doesn't exist (for docker-compose)
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠${NC} .env not found, creating..."
        cat > .env << 'EOF'
POSTGRES_USER=postgres
POSTGRES_DB=logs_user
EOF
        echo -e "${GREEN}✓${NC} .env created"
    else
        echo -e "${GREEN}✓${NC} .env exists"
    fi
}

# Function to check required files
check_files() {
    echo "Checking required files..."
    
    local missing_files=0
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}✗${NC} docker-compose.yml not found"
        missing_files=1
    else
        echo -e "${GREEN}✓${NC} docker-compose.yml"
    fi
    
    if [ ! -f "docker-compose.override.yml" ]; then
        echo -e "${YELLOW}⚠${NC} docker-compose.override.yml not found (optional)"
    else
        echo -e "${GREEN}✓${NC} docker-compose.override.yml"
    fi
    
    if [ $missing_files -eq 1 ]; then
        echo -e "${RED}Error: Required files are missing${NC}"
        exit 1
    fi
}

# Function to stop existing containers
stop_containers() {
    echo ""
    echo "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    echo -e "${GREEN}Containers stopped${NC}"
}

# Function to clean up (optional)
cleanup() {
    echo ""
    read -p "Do you want to remove volumes (database data will be lost)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing volumes..."
        docker-compose down -v
        echo -e "${GREEN}Volumes removed${NC}"
    fi
}

# Function to build and start containers
start_dev() {
    echo ""
    echo "Building and starting development environment..."
    echo "This may take a few minutes on first run..."
    echo ""
    
    # Build and start in detached mode
    if docker-compose up --build -d; then
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}  Development environment is running!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Services:"
        echo "  Frontend:  http://localhost:3000"
        echo "  Backend:   http://localhost:8000"
        echo "  API Docs:  http://localhost:8000/docs"
        echo "  Vector Syslog Ports: 514, 515, 9000-9004 (UDP)"
        echo ""
        echo "Commands:"
        echo "  View logs:    docker-compose logs -f"
        echo "  Stop:         docker-compose down"
        echo "  Restart:      docker-compose restart"
        echo ""
        
        # Show container status
        echo "Container Status:"
        docker-compose ps
        
        echo ""
        read -p "Do you want to view logs now? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Showing logs (press Ctrl+C to exit)..."
            docker-compose logs -f
        fi
    else
        echo -e "${RED}Failed to start containers${NC}"
        echo "Check the logs with: docker-compose logs"
        exit 1
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
    
    # Create .env files if they don't exist
    create_env_files
    
    # Stop existing containers
    stop_containers
    
    # Optional cleanup
    if [ "$1" == "--clean" ] || [ "$1" == "-c" ]; then
        cleanup
    fi
    
    # Start development environment
    start_dev
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --clean, -c    Remove volumes before starting"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0              Start development environment"
        echo "  $0 --clean      Clean and start development environment"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
