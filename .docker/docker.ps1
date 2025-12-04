# Nexus Backend - Docker Management Script (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1, ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

$DOCKER_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$COMPOSE_FILE = Join-Path $DOCKER_DIR "docker-compose.full.yml"
$ENV_FILE = Join-Path $DOCKER_DIR ".env.docker"

function Write-Header {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║            🚀 NEXUS BACKEND - Docker Manager              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-EnvFile {
    if (-not (Test-Path $ENV_FILE)) {
        Write-Host "⚠️  .env.docker not found. Creating from example..." -ForegroundColor Yellow
        $exampleFile = Join-Path $DOCKER_DIR ".env.docker.example"
        if (Test-Path $exampleFile) {
            Copy-Item $exampleFile $ENV_FILE
            Write-Host "❌ Please edit $ENV_FILE with your Google OAuth credentials" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "❌ .env.docker.example not found" -ForegroundColor Red
            exit 1
        }
    }
}

function Start-Services {
    Write-Header
    Test-EnvFile
    Write-Host "▶️  Starting all services..." -ForegroundColor Green
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    Write-Host ""
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Access points:" -ForegroundColor Cyan
    Write-Host "   • API Gateway:       http://localhost:8080"
    Write-Host "   • Swagger (Main):    http://localhost:8080/api/monolith"
    Write-Host "   • Swagger (Tickets): http://localhost:8080/api/tickets"
    Write-Host "   • Swagger (Video):   http://localhost:8080/api/video-call"
    Write-Host ""
}

function Stop-Services {
    Write-Header
    Write-Host "⏹️  Stopping all services..." -ForegroundColor Yellow
    docker compose -f $COMPOSE_FILE down
    Write-Host "✅ Services stopped" -ForegroundColor Green
}

function Restart-Services {
    Write-Header
    Write-Host "🔄 Restarting all services..." -ForegroundColor Yellow
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart
    Write-Host "✅ Services restarted" -ForegroundColor Green
}

function Show-Logs {
    param([string[]]$ServiceArgs)
    if ($ServiceArgs) {
        docker compose -f $COMPOSE_FILE logs -f @ServiceArgs
    } else {
        docker compose -f $COMPOSE_FILE logs -f
    }
}

function Show-Status {
    Write-Header
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker compose -f $COMPOSE_FILE ps
}

function Rebuild-Services {
    Write-Header
    Test-EnvFile
    Write-Host "🔨 Rebuilding all services..." -ForegroundColor Yellow
    docker compose -f $COMPOSE_FILE build --no-cache
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    Write-Host "✅ Services rebuilt and started" -ForegroundColor Green
}

function Clean-Services {
    Write-Header
    Write-Host "🗑️  Stopping and removing all containers and volumes..." -ForegroundColor Red
    docker compose -f $COMPOSE_FILE down -v
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

function Show-Help {
    Write-Header
    Write-Host "Usage: .\docker.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  start    - Start all services"
    Write-Host "  stop     - Stop all services"
    Write-Host "  restart  - Restart all services"
    Write-Host "  logs     - View logs (use: .\docker.ps1 logs [service])"
    Write-Host "  status   - Show status of all services"
    Write-Host "  rebuild  - Rebuild and restart all services"
    Write-Host "  clean    - Stop and remove all containers and volumes"
    Write-Host "  help     - Show this help message"
    Write-Host ""
    Write-Host "Services: monolith, tickets-ms, video-call-ms, api-gateway" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\docker.ps1 start           # Start everything"
    Write-Host "  .\docker.ps1 logs monolith   # View monolith logs"
    Write-Host "  .\docker.ps1 rebuild         # Rebuild after code changes"
    Write-Host ""
}

switch ($Command.ToLower()) {
    "start"   { Start-Services }
    "stop"    { Stop-Services }
    "restart" { Restart-Services }
    "logs"    { Show-Logs -ServiceArgs $Args }
    "status"  { Show-Status }
    "rebuild" { Rebuild-Services }
    "clean"   { Clean-Services }
    "help"    { Show-Help }
    default   { 
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help 
    }
}
