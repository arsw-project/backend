# 🐳 Guía de Docker para Frontend - Nexus Backend

## Descripción

Este Docker Compose levanta **todo el backend de Nexus** en un solo comando:
- 🏛️ **Monolito** (Auth, Users, Organizations, Memberships)
- 🎫 **Tickets Microservice** (Gestión de tickets)
- 📹 **Video Call Microservice** (Video llamadas y chat)
- 🗄️ **3 Bases de datos PostgreSQL** (una por servicio)
- 🚪 **API Gateway** (NGINX - punto de entrada único)

---

## Requisitos

- **Docker** v20+
- **Docker Compose** v2+
- **Credenciales de Google OAuth** (para autenticación)

---

## Configuración Rápida

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/arsw-project/backend.git
cd backend
```

### 2️⃣ Crear archivo de configuración

```bash
cd .docker
cp .env.docker.example .env.docker
```

### 3️⃣ Configurar Google OAuth

Edita `.docker/.env.docker` con tus credenciales de Google:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_LOGIN_REDIRECT=http://localhost:5173
SERVICE_SECRET_KEY=nexus-secret-key-2024
```

> ⚠️ **Importante:** Configura en Google Cloud Console:
> - **Authorized JavaScript origins:** `http://localhost:5173`
> - **Authorized redirect URIs:** `http://localhost:8080/auth/google/callback`

### 4️⃣ Levantar todos los servicios

**Opción A - Usando Scripts (Recomendado):**

```powershell
# PowerShell (Windows)
.\docker.ps1 start
```

```bash
# Bash (Linux/Mac)
chmod +x docker.sh
./docker.sh start
```

**Opción B - Comando directo:**

```bash
docker compose -f docker-compose.full.yml --env-file .env.docker up -d
```

### 5️⃣ Verificar que todo esté corriendo

```powershell
# Con script
.\docker.ps1 status

# O manualmente
docker compose -f docker-compose.full.yml ps
```

Deberías ver 7 contenedores corriendo:
- `nexus-postgres-main`
- `nexus-postgres-tickets`
- `nexus-postgres-video-call`
- `nexus-monolith`
- `nexus-tickets-ms`
- `nexus-video-call-ms`
- `nexus-api-gateway`

### 6️⃣ Verificar health del gateway

```bash
curl http://localhost:8080/health
```

---

## 🔐 Usuario Admin (Creado Automáticamente)

Al levantar los contenedores, se crea automáticamente un usuario admin:

| Campo | Valor |
|-------|-------|
| **Email** | `admin@admin.com` |
| **Password** | `admin` |
| **Rol** | `admin` |

### Hacer Login:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@admin.com", "password": "admin"}'
```

**Respuesta:**
```json
{
  "user": {
    "name": "Admin",
    "email": "admin@admin.com",
    "role": "admin"
  }
}
```

La respuesta incluye un header `Set-Cookie` con el token de sesión. Usa esa cookie en las siguientes peticiones:

```bash
# Ejemplo: Obtener organizaciones
curl http://localhost:8080/organizations \
  -H "Cookie: session-token=TU_TOKEN_AQUI"
```

---

## 🛠️ Comandos del Script

| Comando | Descripción |
|---------|-------------|
| `.\docker.ps1 start` | Iniciar todos los servicios |
| `.\docker.ps1 stop` | Detener todos los servicios |
| `.\docker.ps1 restart` | Reiniciar todos los servicios |
| `.\docker.ps1 logs` | Ver logs de todos los servicios |
| `.\docker.ps1 logs monolith` | Ver logs de un servicio específico |
| `.\docker.ps1 status` | Ver estado de los contenedores |
| `.\docker.ps1 rebuild` | Reconstruir después de cambios |
| `.\docker.ps1 clean` | Eliminar todo (contenedores + volúmenes) |

---

## URLs de Acceso

### API Gateway (Punto de entrada único)

| URL | Descripción |
|-----|-------------|
| `http://localhost:8080` | API Gateway principal |
| `http://localhost:8080/health` | Health check del gateway |

### Documentación Swagger

| URL | Servicio |
|-----|----------|
| `http://localhost:8080/api/monolith` | Swagger del Monolito |
| `http://localhost:8080/api/tickets` | Swagger de Tickets |
| `http://localhost:8080/api/video-call` | Swagger de Video Call |

### Servicios Directos (Solo para debug)

| URL | Servicio |
|-----|----------|
| `http://localhost:3000` | Monolito directo |
| `http://localhost:3001` | Tickets MS directo |
| `http://localhost:3002` | Video Call MS directo |

---

## Rutas del API Gateway

### 🔐 Autenticación (Monolito)

```
GET  /auth/google          → Iniciar login con Google
GET  /auth/google/callback → Callback de Google OAuth
POST /auth/logout          → Cerrar sesión
```

### 👥 Usuarios (Monolito)

```
GET  /users                → Listar usuarios
GET  /users/:id            → Obtener usuario por ID
```

### 🏢 Organizaciones (Monolito)

```
GET    /organizations      → Listar organizaciones
POST   /organizations      → Crear organización
GET    /organizations/:id  → Obtener organización
PATCH  /organizations/:id  → Actualizar organización
DELETE /organizations/:id  → Eliminar organización
```

### 👥 Membresías (Monolito)

```
GET  /memberships          → Listar membresías
POST /memberships          → Crear membresía
```

### 🎫 Tickets (Microservicio)

```
POST   /tickets                        → Crear ticket
GET    /tickets/:id                    → Obtener ticket
GET    /tickets/organization/:orgId    → Tickets por organización
GET    /tickets/assignee/:assigneeId   → Tickets por asignado
GET    /tickets/status/:status         → Tickets por estado
GET    /tickets/tag/:tag               → Tickets por etiqueta
PATCH  /tickets/:id                    → Actualizar ticket
PATCH  /tickets/:id/status             → Cambiar estado
PATCH  /tickets/:id/assignee           → Cambiar asignado
PATCH  /tickets/:id/acceptance-criteria → Actualizar criterios
DELETE /tickets/:id                    → Eliminar ticket
```

### 📹 Video Llamadas (Microservicio)

```
# REST API
GET /chat/:ticketId        → Historial de chat

# WebSocket
ws://localhost:8080/video-call  → Conexión WebSocket
```

---

## Conectar desde Frontend

### Configuración de Fetch/Axios

```javascript
// Usar el API Gateway como base URL
const API_URL = 'http://localhost:8080';

// Importante: incluir credentials para cookies de sesión
fetch(`${API_URL}/tickets`, {
  credentials: 'include'
});

// Con axios
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;
```

### Conexión WebSocket

```javascript
import { io } from 'socket.io-client';

// Conectar al namespace video-call a través del gateway
const socket = io('http://localhost:8080/video-call', {
  transports: ['websocket'],
  path: '/socket.io'
});

// Unirse a una sala
socket.emit('join-room', {
  ticketId: 'uuid-del-ticket',
  sessionToken: 'token-de-la-cookie-session-token'
});
```

### Obtener Session Token

```javascript
function getSessionToken() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'session-token') {
      return value;
    }
  }
  return null;
}
```

---

## Comandos Útiles

### Iniciar servicios

```bash
cd .docker
docker compose -f docker-compose.full.yml --env-file .env.docker up -d
```

### Ver logs

```bash
# Todos los servicios
docker compose -f docker-compose.full.yml logs -f

# Un servicio específico
docker compose -f docker-compose.full.yml logs -f monolith
docker compose -f docker-compose.full.yml logs -f tickets-ms
docker compose -f docker-compose.full.yml logs -f video-call-ms
docker compose -f docker-compose.full.yml logs -f api-gateway
```

### Detener servicios

```bash
docker compose -f docker-compose.full.yml down
```

### Detener y eliminar volúmenes (reset completo)

```bash
docker compose -f docker-compose.full.yml down -v
```

### Reconstruir imágenes

```bash
docker compose -f docker-compose.full.yml build --no-cache
docker compose -f docker-compose.full.yml --env-file .env.docker up -d
```

### Ver estado de contenedores

```bash
docker compose -f docker-compose.full.yml ps
```

---

## Troubleshooting

### Error: "Cannot connect to database"

Las bases de datos tardan unos segundos en estar listas. Espera 10-15 segundos y verifica:

```bash
docker compose -f docker-compose.full.yml logs postgres-main
```

### Error: "GOOGLE_CLIENT_ID is not set"

Asegúrate de crear el archivo `.env.docker` con tus credenciales de Google.

### Error: "Connection refused" en WebSocket

Verifica que el gateway esté corriendo:

```bash
curl http://localhost:8080/health
```

### Error de CORS

El gateway está configurado para aceptar todas las origins. Si tienes problemas, verifica que estés usando `credentials: 'include'` en fetch.

### Reiniciar un servicio específico

```bash
docker compose -f docker-compose.full.yml restart monolith
```

---

## Arquitectura

```
                                    ┌─────────────────┐
                                    │    Frontend     │
                                    │  localhost:5173 │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │ localhost:8080  │
                                    │     (NGINX)     │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │    Monolito     │            │   Tickets MS    │            │ Video Call MS   │
    │  localhost:3000 │            │ localhost:3001  │            │ localhost:3002  │
    │                 │            │                 │            │                 │
    │  • Auth         │            │  • CRUD Tickets │            │  • WebSocket    │
    │  • Users        │◀──────────▶│  • Filters      │◀──────────▶│  • WebRTC       │
    │  • Orgs         │  Internal  │                 │  Internal  │  • Chat         │
    │  • Memberships  │    API     │                 │    API     │                 │
    └────────┬────────┘            └────────┬────────┘            └────────┬────────┘
             │                              │                              │
             ▼                              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │   PostgreSQL    │            │   PostgreSQL    │            │   PostgreSQL    │
    │  localhost:5432 │            │ localhost:5433  │            │ localhost:5434  │
    │    nexus_db     │            │   tickets_db    │            │ video_call_db   │
    └─────────────────┘            └─────────────────┘            └─────────────────┘
```

---

## Puertos Utilizados

| Puerto | Servicio |
|--------|----------|
| 8080 | API Gateway (NGINX) |
| 3000 | Monolito |
| 3001 | Tickets Microservice |
| 3002 | Video Call Microservice |
| 5432 | PostgreSQL (Monolito) |
| 5433 | PostgreSQL (Tickets) |
| 5434 | PostgreSQL (Video Call) |

---

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google | `GOCSPX-xxx` |
| `GOOGLE_LOGIN_REDIRECT` | URL de redirect post-login | `http://localhost:5173` |
| `SERVICE_SECRET_KEY` | Clave secreta compartida | `nexus-secret-key-2024` |

---

## Contacto

Para dudas sobre la integración, contactar al equipo de backend.

**Repositorio:** `arsw-project/backend`
