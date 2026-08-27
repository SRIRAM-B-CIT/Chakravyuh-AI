#!/usr/bin/env bash
# =========================================================================
# Chakravyuh AI: 1-Click Docker Startup Script for Linux / macOS / WSL
# =========================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}================================================================${NC}"
echo -e "${CYAN}${BOLD}       🛡️  CHAKRAVYUH AI: WORLD MODEL CYBER DEFENSE CORE        ${NC}"
echo -e "${CYAN}${BOLD}                 Docker Containerized Environment               ${NC}"
echo -e "${CYAN}${BOLD}================================================================${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed or not in your PATH.${NC}"
    echo -e "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose (plugin or standalone)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose is not installed.${NC}"
    echo -e "Please install Docker Compose plugin."
    exit 1
fi

echo -e "${GREEN}[1/3]${NC} Docker environment verified."
echo -e "${GREEN}[2/3]${NC} Building and starting Chakravyuh AI containers..."
echo ""

# Build and start all core services in detached mode
$DOCKER_COMPOSE_CMD up --build -d backend sniffer frontend

echo ""
echo -e "${GREEN}[3/3]${NC} ${BOLD}Services successfully started!${NC}"
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e " 🌐 ${BOLD}Next.js Cyber Command Dashboard:${NC}  ${GREEN}http://localhost:3000${NC}"
echo -e " ⚡ ${BOLD}FastAPI Backend & API Docs:${NC}       ${GREEN}http://localhost:8000/docs${NC}"
echo -e " 📡 ${BOLD}Real-Time WebSocket Stream:${NC}       ${GREEN}ws://localhost:8000/ws/stream${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Useful Management Commands:${NC}"
echo -e "  - View live logs:            ${BOLD}$DOCKER_COMPOSE_CMD logs -f${NC}"
echo -e "  - View backend logs:         ${BOLD}$DOCKER_COMPOSE_CMD logs -f backend${NC}"
echo -e "  - View sniffer logs:         ${BOLD}$DOCKER_COMPOSE_CMD logs -f sniffer${NC}"
echo -e "  - Launch attack suite:       ${BOLD}$DOCKER_COMPOSE_CMD run --rm attack-suite${NC}"
echo -e "  - Stop all services:         ${BOLD}$DOCKER_COMPOSE_CMD down${NC}"
echo ""
