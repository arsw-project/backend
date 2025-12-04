#!/bin/bash

# Nexus Backend - Docker Management Script

set -e

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.full.yml"
ENV_FILE="$DOCKER_DIR/.env.docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║            🚀 NEXUS BACKEND - Docker Manager              ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  .env.docker not found. Creating from example...${NC}"
        if [ -f "$DOCKER_DIR/.env.docker.example" ]; then
            cp "$DOCKER_DIR/.env.docker.example" "$ENV_FILE"
            echo -e "${RED}❌ Please edit $ENV_FILE with your Google OAuth credentials${NC}"
            exit 1
        else
            echo -e "${RED}❌ .env.docker.example not found${NC}"
            exit 1
        fi
    fi
}

start() {
    print_header
    check_env_file
    echo -e "${GREEN}▶️  Starting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo ""
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo "📍 Access points:"
    echo "   • API Gateway:    http://localhost:8080"
    echo "   • Swagger (Main): http://localhost:8080/api/monolith"
    echo "   • Swagger (Tickets): http://localhost:8080/api/tickets"
    echo "   • Swagger (Video): http://localhost:8080/api/video-call"
    echo ""
}

stop() {
    print_header
    echo -e "${YELLOW}⏹️  Stopping all services...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

restart() {
    print_header
    echo -e "${YELLOW}🔄 Restarting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    echo -e "${GREEN}✅ Services restarted${NC}"
}

logs() {
    docker compose -f "$COMPOSE_FILE" logs -f "$@"
}

status() {
    print_header
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker compose -f "$COMPOSE_FILE" ps
}

rebuild() {
    print_header
    check_env_file
    echo -e "${YELLOW}🔨 Rebuilding all services...${NC}"
    docker compose -f "$COMPOSE_FILE" build --no-cache
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo -e "${GREEN}✅ Services rebuilt and started${NC}"
}

clean() {
    print_header
    echo -e "${RED}🗑️  Stopping and removing all containers and volumes...${NC}"
    docker compose -f "$COMPOSE_FILE" down -v
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

help() {
    print_header
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - View logs (use: ./docker.sh logs [service])"
    echo "  status   - Show status of all services"
    echo "  rebuild  - Rebuild and restart all services"
    echo "  clean    - Stop and remove all containers and volumes"
    echo "  help     - Show this help message"
    echo ""
    echo "Services: monolith, tickets-ms, video-call-ms, api-gateway"
    echo ""
}

case "${1:-help}" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    logs)    shift; logs "$@" ;;
    status)  status ;;
    rebuild) rebuild ;;
    clean)   clean ;;
    help)    help ;;
    *)       echo "Unknown command: $1"; help ;;
esac
