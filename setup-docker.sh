#!/usr/bin/env bash
# =============================================================================
# QuantBot Pro - Automated 1-Click Docker Deployment Script
# =============================================================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}   QuantBot Pro - Full-Stack Docker Deployment Installer         ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed. Please install Docker Engine or Docker Desktop first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}[1/3] Docker verified:${NC} $(docker --version)"

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] docker compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}[2/3] Building and starting QuantBot containers in background...${NC}"
$COMPOSE_CMD up -d --build

echo -e "${GREEN}[3/3] Deployment complete!${NC}"
echo -e "${CYAN}------------------------------------------------------------------${NC}"
echo -e "Web Terminal:        ${GREEN}http://localhost:3000${NC}"
echo -e "Autonomous Bot:      ${GREEN}Active in background (Paper Trading)${NC}"
echo -e "View Bot Live Logs:  ${YELLOW}$COMPOSE_CMD logs -f quantbot-bot${NC}"
echo -e "View Web Live Logs:  ${YELLOW}$COMPOSE_CMD logs -f quantbot-web${NC}"
echo -e "Stop All Services:   ${YELLOW}$COMPOSE_CMD down${NC}"
echo -e "${CYAN}------------------------------------------------------------------${NC}"
