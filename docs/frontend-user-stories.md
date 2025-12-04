# Historias de Usuario - Frontend Nexus

Este documento contiene las historias de usuario para el desarrollo del frontend de Nexus, basadas en las funcionalidades implementadas en el backend y alineadas con las épicas definidas en el Product Backlog.

---

## Índice

1. [EPIC-AUT: Autenticación y Autorización](#epic-aut-autenticación-y-autorización)
2. [EPIC-ORG: Organizaciones y Membresías](#epic-org-organizaciones-y-membresías)
3. [EPIC-USR: Gestión de Usuarios](#epic-usr-gestión-de-usuarios)
4. [EPIC-TCK: Gestión de Tickets](#epic-tck-gestión-de-tickets)
5. [EPIC-WSS: Colaboración en Tiempo Real](#epic-wss-colaboración-en-tiempo-real)
6. [EPIC-VCC: Videollamadas](#epic-vcc-videollamadas)
7. [EPIC-AIP: IA para Generación y Enriquecimiento](#epic-aip-ia-para-generación-y-enriquecimiento)
8. [Principios de Desarrollo Frontend](#principios-de-desarrollo-frontend)

---

## EPIC-AUT: Autenticación y Autorización

### Objetivo Estratégico
Habilitar el acceso seguro a la plataforma mediante una interfaz de usuario intuitiva que soporte login nativo y autenticación con proveedores externos (OAuth/OIDC), gestionando la sesión del usuario de forma transparente.

### Métricas de Éxito Frontend
- Tiempo de carga de página de login < 1 segundo
- Flujo de autenticación completo en máximo 3 clicks
- 100% de rutas protegidas redirigen correctamente a login
- UI responsive funcional en dispositivos móviles y desktop

---

### FEAT-AUT-01: Páginas de Autenticación

#### US-FE-AUT-001: Página de Registro de Usuario

**Como** un nuevo usuario,  
**Quiero** ver un formulario de registro claro y accesible,  
**Para** poder crear mi cuenta en la plataforma de forma rápida e intuitiva.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización del formulario de registro
  Given que estoy en la página de registro
  When la página carga completamente
  Then debo ver campos para email y contraseña
  And debo ver un botón de "Registrarse"
  And debo ver un enlace para ir a la página de login

Scenario: Validación de campos en tiempo real
  Given que estoy completando el formulario de registro
  When ingreso un email con formato inválido
  Then debo ver un mensaje de error indicando el formato correcto
  And el campo debe marcarse visualmente como inválido

Scenario: Validación de contraseña
  Given que estoy completando el formulario de registro
  When ingreso una contraseña menor a 8 caracteres
  Then debo ver un mensaje indicando la longitud mínima requerida

Scenario: Registro exitoso
  Given que he completado el formulario con datos válidos
  When presiono el botón de "Registrarse"
  Then debo ver un indicador de carga
  And al completarse, debo ser redirigido al dashboard
  And debo estar autenticado en la aplicación

Scenario: Email duplicado
  Given que ingreso un email ya registrado
  When intento completar el registro
  Then debo ver un mensaje de error indicando que el email ya existe
  And debo permanecer en la página de registro
```

**Especificaciones Técnicas:**
- Componente: `RegisterForm`
- Ruta: `/register`
- Validación con Zod/React Hook Form
- Integración con `POST /auth/register` (pendiente backend)
- Estados de loading, error y success

---

#### US-FE-AUT-002: Página de Inicio de Sesión

**Como** un usuario registrado,  
**Quiero** iniciar sesión con mi email y contraseña,  
**Para** acceder a mi cuenta y continuar trabajando en mis proyectos.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización del formulario de login
  Given que estoy en la página de login
  When la página carga completamente
  Then debo ver campos para email y contraseña
  And debo ver un botón de "Iniciar Sesión"
  And debo ver un botón para "Iniciar con Google"
  And debo ver un enlace para ir a la página de registro

Scenario: Login exitoso con credenciales válidas
  Given que he ingresado credenciales válidas
  When presiono el botón de "Iniciar Sesión"
  Then debo ver un indicador de carga
  And al completarse, debo ser redirigido al dashboard
  And mi sesión debe persistir (cookie session-token)

Scenario: Login fallido con credenciales inválidas
  Given que he ingresado credenciales incorrectas
  When intento iniciar sesión
  Then debo ver un mensaje de error genérico
  And no debo revelar si el email existe o no (seguridad)

Scenario: Validación de campos vacíos
  Given que los campos están vacíos
  When intento enviar el formulario
  Then debo ver mensajes de validación en los campos requeridos
```

**Especificaciones Técnicas:**
- Componente: `LoginForm`
- Ruta: `/login`
- Integración con `POST /auth/login`
- Manejo de cookies HTTP-only (session-token)
- Estados de loading, error y success

---

#### US-FE-AUT-003: Autenticación con Google OAuth

**Como** un usuario,  
**Quiero** poder autenticarme usando mi cuenta de Google,  
**Para** acceder rápidamente sin necesidad de crear nuevas credenciales.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Iniciar flujo OAuth con Google
  Given que estoy en la página de login
  When presiono el botón "Iniciar con Google"
  Then debo ser redirigido a la página de autenticación de Google
  And las cookies de estado OAuth deben establecerse

Scenario: Callback exitoso de Google
  Given que he autorizado la aplicación en Google
  When soy redirigido al callback
  Then debo ser redirigido automáticamente al dashboard
  And mi sesión debe estar activa

Scenario: Error en flujo OAuth
  Given que ocurre un error durante la autenticación
  When soy redirigido al callback
  Then debo ser redirigido a la página de login
  And debo ver un mensaje de error apropiado
```

**Especificaciones Técnicas:**
- Componente: `GoogleLoginButton`
- Integración con `GET /auth/google/login`
- Manejo de callback `GET /auth/google/login/callback`
- Redirect configurable vía `GOOGLE_LOGIN_REDIRECT`

---

#### US-FE-AUT-004: Cierre de Sesión

**Como** un usuario autenticado,  
**Quiero** poder cerrar mi sesión de forma segura,  
**Para** proteger mi cuenta cuando no esté usando la aplicación.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Logout desde el menú de usuario
  Given que estoy autenticado en la aplicación
  When presiono el botón de "Cerrar Sesión"
  Then debo ver un diálogo de confirmación
  And al confirmar, mi sesión debe invalidarse
  And debo ser redirigido a la página de login

Scenario: Sesión expirada
  Given que mi sesión ha expirado
  When intento acceder a una ruta protegida
  Then debo ser redirigido automáticamente al login
  And debo ver un mensaje indicando que la sesión expiró
```

**Especificaciones Técnicas:**
- Componente: `LogoutButton`, `UserMenu`
- Integración con `POST /auth/logout`
- Limpieza de estado local (Context/Store)
- Guard de autenticación para rutas protegidas

---

#### US-FE-AUT-005: Obtener Perfil del Usuario Autenticado

**Como** un usuario autenticado,  
**Quiero** ver mi información de perfil en la aplicación,  
**Para** confirmar que estoy usando la cuenta correcta.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización del perfil en header
  Given que estoy autenticado
  When la aplicación carga
  Then debo ver mi nombre/email en el header
  And debo ver mi avatar (si uso Google OAuth)

Scenario: Acceso a página de perfil
  Given que estoy autenticado
  When navego a mi perfil
  Then debo ver mi información completa (nombre, email, proveedor de auth)
  And debo ver la fecha de creación de mi cuenta
```

**Especificaciones Técnicas:**
- Componentes: `UserAvatar`, `ProfilePage`, `AuthContext`
- Integración con `GET /auth/me`
- Cache del estado de usuario en Context/Store
- Refresh automático al cargar la aplicación

---

### FEAT-AUT-02: Gestión de Estado de Autenticación

#### US-FE-AUT-006: Protección de Rutas

**Como** desarrollador,  
**Quiero** implementar guards de autenticación en el router,  
**Para** proteger las rutas que requieren usuario autenticado.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Acceso a ruta protegida sin autenticación
  Given que no estoy autenticado
  When intento acceder a "/dashboard"
  Then debo ser redirigido a "/login"
  And la URL original debe guardarse para redirección post-login

Scenario: Acceso a ruta protegida con autenticación
  Given que estoy autenticado
  When accedo a "/dashboard"
  Then debo ver el contenido del dashboard

Scenario: Acceso a ruta pública estando autenticado
  Given que estoy autenticado
  When intento acceder a "/login"
  Then debo ser redirigido al dashboard
```

**Especificaciones Técnicas:**
- Componentes: `ProtectedRoute`, `PublicRoute`, `AuthProvider`
- Implementación con React Router v6+
- Almacenamiento de returnUrl para redirección

---

## EPIC-ORG: Organizaciones y Membresías

### Objetivo Estratégico
Permitir a los usuarios crear y gestionar organizaciones, administrar membresías y roles, proporcionando una interfaz clara para la colaboración en equipo.

### Métricas de Éxito Frontend
- Tiempo de creación de organización < 30 segundos
- Gestión de miembros completamente funcional
- UI clara para visualizar roles y permisos

---

### FEAT-ORG-01: Gestión de Organizaciones

#### US-FE-ORG-001: Listado de Organizaciones

**Como** un usuario autenticado,  
**Quiero** ver la lista de organizaciones a las que pertenezco,  
**Para** poder navegar entre mis diferentes equipos de trabajo.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización de lista de organizaciones
  Given que estoy autenticado
  When accedo a la página de organizaciones
  Then debo ver una lista con todas mis organizaciones
  And cada organización debe mostrar nombre y descripción
  And debo ver mi rol en cada organización

Scenario: Lista vacía
  Given que no pertenezco a ninguna organización
  When accedo a la página de organizaciones
  Then debo ver un mensaje indicando que no hay organizaciones
  And debo ver un botón para crear una nueva organización

Scenario: Búsqueda de organizaciones
  Given que tengo múltiples organizaciones
  When uso el campo de búsqueda
  Then la lista debe filtrarse en tiempo real
```

**Especificaciones Técnicas:**
- Componentes: `OrganizationList`, `OrganizationCard`
- Ruta: `/organizations`
- Integración con `GET /organizations`
- Implementar búsqueda por nombre con query param `?name=`

---

#### US-FE-ORG-002: Creación de Organización

**Como** un usuario autenticado,  
**Quiero** crear una nueva organización,  
**Para** poder invitar a mi equipo y comenzar a colaborar.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización del formulario de creación
  Given que estoy en la página de organizaciones
  When presiono "Nueva Organización"
  Then debo ver un modal/formulario con campos para nombre y descripción

Scenario: Creación exitosa
  Given que he completado el formulario con datos válidos
  When presiono "Crear"
  Then la organización debe crearse
  And debo ser redirigido a la página de la organización
  And debo aparecer como "owner" de la organización

Scenario: Nombre duplicado
  Given que ingreso un nombre de organización existente
  When intento crear la organización
  Then debo ver un error de conflicto
  And debo permanecer en el formulario
```

**Especificaciones Técnicas:**
- Componentes: `CreateOrganizationModal`, `OrganizationForm`
- Integración con `POST /organizations`
- Validación de nombre (requerido, longitud)

---

#### US-FE-ORG-003: Detalle de Organización

**Como** un miembro de una organización,  
**Quiero** ver los detalles de la organización,  
**Para** conocer información relevante del equipo.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización de detalles
  Given que soy miembro de una organización
  When accedo a la página de detalle
  Then debo ver nombre, descripción y fecha de creación
  And debo ver la lista de miembros
  And debo ver mi rol actual

Scenario: Organización no encontrada
  Given que accedo a una organización inexistente
  When la página carga
  Then debo ver una página 404 o mensaje de error apropiado
```

**Especificaciones Técnicas:**
- Componentes: `OrganizationDetail`, `OrganizationHeader`
- Ruta: `/organizations/:id`
- Integración con `GET /organizations/:id`

---

#### US-FE-ORG-004: Actualización de Organización

**Como** un administrador de organización,  
**Quiero** editar la información de mi organización,  
**Para** mantener los datos actualizados.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Acceso a edición (admin/owner)
  Given que soy admin o owner de la organización
  When estoy en la página de detalle
  Then debo ver un botón de "Editar"

Scenario: Actualización exitosa
  Given que he modificado los campos
  When presiono "Guardar"
  Then los cambios deben persistirse
  And debo ver un mensaje de éxito

Scenario: Sin permisos de edición
  Given que soy member o viewer
  When estoy en la página de detalle
  Then no debo ver el botón de "Editar"
```

**Especificaciones Técnicas:**
- Componentes: `EditOrganizationModal`
- Integración con `PATCH /organizations/:id`
- Control de permisos basado en rol

---

#### US-FE-ORG-005: Eliminación de Organización

**Como** el owner de una organización,  
**Quiero** poder eliminar la organización,  
**Para** limpiar organizaciones que ya no necesito.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Confirmación de eliminación
  Given que soy owner de la organización
  When presiono "Eliminar Organización"
  Then debo ver un diálogo de confirmación con advertencia
  And debo escribir el nombre de la organización para confirmar

Scenario: Eliminación exitosa
  Given que he confirmado la eliminación
  When la operación completa
  Then debo ser redirigido a la lista de organizaciones
  And la organización ya no debe aparecer en mi lista
```

**Especificaciones Técnicas:**
- Componentes: `DeleteOrganizationDialog`
- Integración con `DELETE /organizations/:id`
- Confirmación con escritura del nombre (patrón GitHub)

---

### FEAT-ORG-02: Gestión de Membresías

#### US-FE-ORG-006: Listado de Miembros

**Como** un miembro de organización,  
**Quiero** ver la lista de todos los miembros,  
**Para** conocer quiénes forman parte del equipo.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización de miembros
  Given que estoy en la página de la organización
  When accedo a la sección de miembros
  Then debo ver una tabla/lista con todos los miembros
  And cada miembro debe mostrar nombre, email y rol
  And los miembros deben ordenarse por rol (owner > admin > member > viewer)

Scenario: Búsqueda de miembros
  Given que la organización tiene muchos miembros
  When uso el campo de búsqueda
  Then la lista debe filtrarse por nombre o email
```

**Especificaciones Técnicas:**
- Componentes: `MembersList`, `MemberRow`, `MemberCard`
- Ruta: `/organizations/:id/members`
- Integración con `GET /organizations/:organizationId/members`

---

#### US-FE-ORG-007: Agregar Miembro a Organización

**Como** un administrador de organización,  
**Quiero** agregar nuevos miembros a mi organización,  
**Para** expandir el equipo de trabajo.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Formulario de agregar miembro
  Given que soy admin o owner
  When presiono "Agregar Miembro"
  Then debo ver un formulario para seleccionar usuario y rol

Scenario: Agregar miembro exitosamente
  Given que he seleccionado un usuario y rol
  When presiono "Agregar"
  Then el miembro debe agregarse a la lista
  And debo ver un mensaje de éxito

Scenario: Usuario ya es miembro
  Given que intento agregar un usuario existente
  When envío el formulario
  Then debo ver un error de conflicto

Scenario: Sin permisos
  Given que soy member o viewer
  When estoy en la página de miembros
  Then no debo ver el botón "Agregar Miembro"
```

**Especificaciones Técnicas:**
- Componentes: `AddMemberModal`, `UserSelect`, `RoleSelect`
- Integración con `POST /organizations/:organizationId/members`
- Roles disponibles: `owner`, `admin`, `member`, `viewer`

---

#### US-FE-ORG-008: Actualizar Rol de Miembro

**Como** un administrador de organización,  
**Quiero** cambiar el rol de un miembro,  
**Para** ajustar sus permisos según sus responsabilidades.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Cambio de rol exitoso
  Given que soy admin o owner
  When cambio el rol de un miembro
  Then el nuevo rol debe guardarse
  And debo ver confirmación del cambio

Scenario: Protección del último owner
  Given que intento cambiar el rol del único owner
  When el nuevo rol no es "owner"
  Then debo ver un error indicando que debe haber al menos un owner

Scenario: Dropdown de roles
  Given que estoy editando un miembro
  When abro el selector de rol
  Then debo ver las opciones: Owner, Admin, Member, Viewer
```

**Especificaciones Técnicas:**
- Componentes: `RoleDropdown`, `EditMemberRole`
- Integración con `PATCH /organizations/:organizationId/members/:membershipId`
- Validación: no permitir remover último owner

---

#### US-FE-ORG-009: Remover Miembro de Organización

**Como** un administrador de organización,  
**Quiero** remover miembros de la organización,  
**Para** gestionar el acceso del equipo.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Confirmación de remoción
  Given que presiono "Remover" en un miembro
  When se muestra el diálogo de confirmación
  Then debo ver el nombre del miembro a remover
  And debo ver advertencia sobre la acción irreversible

Scenario: Remoción exitosa
  Given que confirmo la remoción
  When la operación completa
  Then el miembro debe desaparecer de la lista
  And debo ver mensaje de éxito

Scenario: No remover último owner
  Given que intento remover al único owner
  When confirmo la acción
  Then debo ver un error de prohibición
```

**Especificaciones Técnicas:**
- Componentes: `RemoveMemberDialog`
- Integración con `DELETE /organizations/:organizationId/members/:membershipId`
- Validación de último owner en backend

---

## EPIC-USR: Gestión de Usuarios

### Objetivo Estratégico
Proporcionar interfaces de administración para la gestión de usuarios del sistema (funcionalidad de administrador).

---

### FEAT-USR-01: Panel de Administración de Usuarios

#### US-FE-USR-001: Listado de Usuarios (Admin)

**Como** un administrador del sistema,  
**Quiero** ver la lista completa de usuarios,  
**Para** gestionar las cuentas de la plataforma.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Acceso al panel de usuarios
  Given que soy administrador
  When accedo a "/admin/users"
  Then debo ver una tabla con todos los usuarios
  And cada usuario debe mostrar: nombre, email, rol, proveedor de auth, fecha de creación

Scenario: Paginación
  Given que hay más de 20 usuarios
  When la tabla carga
  Then debo ver controles de paginación

Scenario: Sin permisos de admin
  Given que soy usuario regular
  When intento acceder a "/admin/users"
  Then debo ver una página de acceso denegado o ser redirigido
```

**Especificaciones Técnicas:**
- Componentes: `UsersTable`, `AdminLayout`
- Ruta: `/admin/users`
- Integración con `GET /users`
- Guard de rol `admin`

---

#### US-FE-USR-002: Crear Usuario (Admin)

**Como** un administrador,  
**Quiero** crear usuarios manualmente,  
**Para** agregar cuentas sin necesidad de registro.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Formulario de creación
  Given que estoy en el panel de usuarios
  When presiono "Nuevo Usuario"
  Then debo ver un formulario con campos: nombre, email, contraseña, rol, proveedor

Scenario: Creación exitosa
  Given que completo el formulario correctamente
  When presiono "Crear"
  Then el usuario debe aparecer en la lista
  And debo ver mensaje de éxito
```

**Especificaciones Técnicas:**
- Componentes: `CreateUserModal`
- Integración con `POST /users`

---

#### US-FE-USR-003: Editar Usuario (Admin)

**Como** un administrador,  
**Quiero** editar la información de usuarios,  
**Para** corregir datos o actualizar roles.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Edición de usuario
  Given que estoy viendo la lista de usuarios
  When presiono "Editar" en un usuario
  Then debo ver el formulario con los datos actuales

Scenario: Actualización exitosa
  Given que he modificado los datos
  When presiono "Guardar"
  Then los cambios deben reflejarse en la lista
```

**Especificaciones Técnicas:**
- Componentes: `EditUserModal`
- Integración con `PATCH /users/:id`

---

#### US-FE-USR-004: Eliminar Usuario (Admin)

**Como** un administrador,  
**Quiero** eliminar usuarios del sistema,  
**Para** remover cuentas innecesarias o problemáticas.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Confirmación de eliminación
  Given que presiono "Eliminar" en un usuario
  When se muestra el diálogo
  Then debo ver advertencia sobre la acción irreversible

Scenario: Eliminación exitosa
  Given que confirmo la eliminación
  When la operación completa
  Then el usuario debe desaparecer de la lista
```

**Especificaciones Técnicas:**
- Componentes: `DeleteUserDialog`
- Integración con `DELETE /users/:id`

---

## EPIC-TCK: Gestión de Tickets

### Objetivo Estratégico
Implementar el CRUD completo de tickets con campos personalizables, filtros avanzados y asignación de responsables.

> **Nota:** Esta épica requiere implementación en backend antes de las historias de frontend.

---

### FEAT-TCK-01: CRUD de Tickets

#### US-FE-TCK-001: Tablero Kanban de Tickets

**Como** un miembro de organización,  
**Quiero** ver mis tickets en un tablero Kanban,  
**Para** visualizar el estado de las tareas de forma clara.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Visualización del tablero
  Given que estoy en un proyecto
  When accedo al tablero de tickets
  Then debo ver columnas por estado (To Do, In Progress, Review, Done)
  And cada ticket debe mostrar título, asignado y prioridad

Scenario: Drag and Drop
  Given que estoy en el tablero
  When arrastro un ticket a otra columna
  Then el estado del ticket debe actualizarse
  And debo ver confirmación visual del cambio

Scenario: Filtros de tickets
  Given que hay múltiples tickets
  When aplico filtros (asignado, prioridad, etiquetas)
  Then solo debo ver tickets que cumplan los criterios
```

**Especificaciones Técnicas:**
- Componentes: `KanbanBoard`, `KanbanColumn`, `TicketCard`
- Librería: react-beautiful-dnd o @dnd-kit
- WebSocket para actualizaciones en tiempo real

---

#### US-FE-TCK-002: Crear Ticket

**Como** un miembro de organización,  
**Quiero** crear nuevos tickets,  
**Para** registrar tareas y requerimientos.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Formulario de creación
  Given que estoy en el tablero
  When presiono "Nuevo Ticket"
  Then debo ver un formulario con campos: título, descripción, prioridad, asignado

Scenario: Creación rápida
  Given que presiono "+" en una columna
  When ingreso solo el título
  Then el ticket debe crearse en esa columna
```

**Especificaciones Técnicas:**
- Componentes: `CreateTicketModal`, `QuickAddTicket`
- Editor de descripción: Markdown con preview

---

#### US-FE-TCK-003: Detalle de Ticket

**Como** un miembro de organización,  
**Quiero** ver el detalle completo de un ticket,  
**Para** entender el contexto y los criterios de aceptación.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Vista de detalle
  Given que presiono en un ticket
  When se abre el panel de detalle
  Then debo ver: título, descripción, criterios de aceptación
  And debo ver: asignado, reportador, prioridad, etiquetas
  And debo ver el historial de actividad

Scenario: Panel lateral
  Given que abro un ticket
  Then debe abrirse como panel lateral (no nueva página)
  And debo poder seguir viendo el tablero detrás
```

**Especificaciones Técnicas:**
- Componentes: `TicketDetailPanel`, `TicketActivity`
- Ruta: Modal sobre `/board?ticket=:id`

---

## EPIC-WSS: Colaboración en Tiempo Real

### Objetivo Estratégico
Habilitar actualizaciones instantáneas, presencia de usuarios y chat contextual por ticket utilizando WebSockets.

---

### FEAT-WSS-01: Presencia de Usuarios

#### US-FE-WSS-001: Indicadores de Presencia en Tiempo Real

**Como** un miembro de organización,  
**Quiero** ver quiénes están conectados y qué están viendo,  
**Para** colaborar de forma efectiva con mi equipo.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Avatares de usuarios conectados
  Given que estoy en el tablero
  When otros usuarios están viendo el mismo tablero
  Then debo ver sus avatares con indicador de "online"

Scenario: Cursores en tiempo real (estilo Figma)
  Given que estoy en modo colaborativo
  When otro usuario mueve su cursor
  Then debo ver su cursor con su nombre/avatar

Scenario: Usuario viendo ticket específico
  Given que un usuario está viendo un ticket
  Then el ticket debe mostrar un indicador de "siendo visto por X"
```

**Especificaciones Técnicas:**
- Componentes: `PresenceAvatars`, `LiveCursor`, `ViewingIndicator`
- WebSocket events: `user:joined`, `user:left`, `cursor:move`
- Redis Adapter para escalar horizontalmente

---

### FEAT-WSS-02: Chat Contextual

#### US-FE-WSS-002: Chat por Ticket

**Como** un miembro de organización,  
**Quiero** chatear en el contexto de un ticket,  
**Para** discutir detalles sin salir de la plataforma.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Panel de chat en ticket
  Given que estoy viendo un ticket
  When abro el panel de chat
  Then debo ver el historial de mensajes del ticket
  And debo poder enviar nuevos mensajes

Scenario: Notificaciones de nuevos mensajes
  Given que alguien escribe en un ticket que sigo
  When llega el mensaje
  Then debo ver una notificación
  And el contador de mensajes no leídos debe incrementar

Scenario: Menciones a usuarios
  Given que escribo "@" en el chat
  Then debo ver un autocompletado de usuarios
  And al seleccionar, debe mencionarse al usuario
```

**Especificaciones Técnicas:**
- Componentes: `TicketChat`, `ChatMessage`, `UserMention`
- WebSocket events: `chat:message`, `chat:typing`
- Persistencia de mensajes en backend

---

### FEAT-WSS-03: Actualizaciones en Tiempo Real

#### US-FE-WSS-003: Sincronización de Cambios del Tablero

**Como** un miembro de organización,  
**Quiero** ver cambios de otros usuarios en tiempo real,  
**Para** mantenerme actualizado sin refrescar la página.

**Prioridad:** P1 (Must)

**Criterios de Aceptación:**

```gherkin
Scenario: Ticket movido por otro usuario
  Given que estoy viendo el tablero
  When otro usuario mueve un ticket
  Then debo ver el ticket moverse animadamente a la nueva columna

Scenario: Ticket creado por otro usuario
  Given que estoy viendo el tablero
  When otro usuario crea un ticket
  Then el ticket debe aparecer en el tablero con animación

Scenario: Ticket editado por otro usuario
  Given que estoy viendo un ticket
  When otro usuario lo edita
  Then debo ver los cambios reflejados inmediatamente
  And debo ver indicador de "editado por X"
```

**Especificaciones Técnicas:**
- WebSocket events: `ticket:created`, `ticket:updated`, `ticket:moved`, `ticket:deleted`
- Optimistic updates con rollback en caso de error
- Manejo de conflictos de edición concurrente

---

## EPIC-VCC: Videollamadas

### Objetivo Estratégico
Permitir llamadas P2P 1:1 y en pequeños grupos directamente desde un ticket usando WebRTC.

---

### FEAT-VCC-01: Videollamadas en Ticket

#### US-FE-VCC-001: Iniciar Videollamada desde Ticket

**Como** un miembro de organización,  
**Quiero** iniciar una videollamada desde un ticket,  
**Para** discutir temas complejos cara a cara.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Botón de videollamada
  Given que estoy viendo un ticket
  When presiono el botón de videollamada
  Then debo ver opciones de "Solo Audio" y "Video"

Scenario: Sala de espera
  Given que inicio una llamada
  When otros usuarios son invitados
  Then deben ver una notificación para unirse
  And deben poder aceptar o rechazar

Scenario: Interfaz de llamada
  Given que estoy en una llamada
  Then debo ver: video de participantes, controles de mute/video, botón de colgar
  And debo ver indicador de quién está hablando
```

**Especificaciones Técnicas:**
- Componentes: `VideoCall`, `CallControls`, `ParticipantGrid`
- WebRTC para conexión P2P
- TURN server (coturn) para NAT traversal
- Señalización via WebSocket

---

#### US-FE-VCC-002: Compartir Pantalla

**Como** un participante de videollamada,  
**Quiero** compartir mi pantalla,  
**Para** mostrar código, diseños o documentos.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Iniciar compartir pantalla
  Given que estoy en una llamada
  When presiono "Compartir Pantalla"
  Then debo ver opciones de qué compartir (pantalla completa, ventana, tab)

Scenario: Visualización de pantalla compartida
  Given que alguien está compartiendo
  Then la pantalla compartida debe ser prominente en la vista
  And debo poder hacer doble click para ampliar
```

**Especificaciones Técnicas:**
- API: `getDisplayMedia()`
- Layout: Picture-in-picture o grid adaptativo

---

## EPIC-AIP: IA para Generación y Enriquecimiento

### Objetivo Estratégico
Generar y enriquecer historias de usuario y criterios de aceptación usando IA, con salida JSON estándar.

---

### FEAT-AIP-01: Asistente de IA para Tickets

#### US-FE-AIP-001: Generación de Historia de Usuario con IA

**Como** un miembro de organización,  
**Quiero** que la IA me ayude a escribir historias de usuario,  
**Para** crear tickets claros y bien estructurados.

**Prioridad:** P2 (Should)

**Criterios de Aceptación:**

```gherkin
Scenario: Activar asistente de IA
  Given que estoy creando un ticket
  When presiono el botón de "Asistente IA"
  Then debo ver un panel de chat con la IA

Scenario: Generación desde descripción natural
  Given que escribo "Los usuarios deben poder filtrar productos por precio"
  When la IA procesa mi input
  Then debo ver una historia de usuario estructurada
  And debo ver criterios de aceptación sugeridos en formato Gherkin

Scenario: Preguntas de clarificación
  Given que mi descripción es ambigua
  When la IA detecta ambigüedad
  Then debe hacerme preguntas de clarificación
  And debe refinar la historia con mis respuestas
```

**Especificaciones Técnicas:**
- Componentes: `AIAssistant`, `AIChatPanel`, `SuggestedUserStory`
- Integración con API de IA del backend
- Streaming de respuestas para UX fluida

---

#### US-FE-AIP-002: Enriquecimiento de Ticket Existente

**Como** un miembro de organización,  
**Quiero** que la IA enriquezca tickets existentes,  
**Para** mejorar la calidad de tickets mal definidos.

**Prioridad:** P3 (Could)

**Criterios de Aceptación:**

```gherkin
Scenario: Sugerir mejoras
  Given que tengo un ticket con descripción vaga
  When presiono "Mejorar con IA"
  Then la IA debe sugerir: descripción mejorada, criterios de aceptación, subtareas

Scenario: Aceptar/Rechazar sugerencias
  Given que la IA ha generado sugerencias
  Then debo poder aceptar individualmente cada sugerencia
  Or rechazar y solicitar alternativas
```

**Especificaciones Técnicas:**
- Componentes: `AIEnhanceButton`, `SuggestionsDiff`
- Mostrar cambios en formato diff antes de aplicar

---

## Principios de Desarrollo Frontend

### Estándares de Código

#### Arquitectura de Componentes
- Usar componentes funcionales con hooks
- Separar componentes presentacionales de contenedores
- Implementar custom hooks para lógica reutilizable
- Organizar por feature/dominio

#### TypeScript
- Strict mode habilitado
- Interfaces para props y estado
- Evitar `any`, usar generics cuando sea apropiado

#### Estado y Data Fetching
- React Query/TanStack Query para server state
- Context API o Zustand para client state
- Optimistic updates para mejor UX

#### Estilos
- TailwindCSS o CSS Modules
- Sistema de diseño consistente (colores, espaciado, tipografía)
- Mobile-first responsive design

#### Testing
- Unit tests con Vitest
- Component tests con Testing Library
- E2E tests con Playwright (críticos)

### Definition of Ready (DoR) - Frontend

Una historia de usuario está lista para desarrollo cuando:

- [ ] Tiene criterios de aceptación claros en formato Gherkin
- [ ] Los endpoints de backend están documentados y funcionando
- [ ] Los diseños/mockups están aprobados (si aplica)
- [ ] Las dependencias de otras historias están completadas
- [ ] El equipo ha estimado el esfuerzo

### Definition of Done (DoD) - Frontend

Una historia de usuario está completada cuando:

- [ ] El código cumple los criterios de aceptación
- [ ] Los componentes tienen tests unitarios (>80% cobertura)
- [ ] El código pasa linting (Biome/ESLint)
- [ ] La funcionalidad es responsive (mobile + desktop)
- [ ] La accesibilidad básica está implementada (ARIA, keyboard nav)
- [ ] El código ha sido revisado por al menos un compañero
- [ ] La documentación de componentes está actualizada (Storybook si aplica)
- [ ] No hay errores en consola
- [ ] La funcionalidad ha sido probada en navegadores principales

---

## Resumen de Endpoints Backend Disponibles

### Autenticación (`/auth`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/auth/me` | Obtener usuario autenticado |
| POST | `/auth/login` | Login con email/password |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/google/login` | Iniciar OAuth Google |
| GET | `/auth/google/login/callback` | Callback OAuth Google |

### Usuarios (`/users`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Listar usuarios (admin) |
| POST | `/users` | Crear usuario (admin) |
| GET | `/users/:id` | Obtener usuario por ID |
| PATCH | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Eliminar usuario |

### Organizaciones (`/organizations`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/organizations` | Listar organizaciones |
| GET | `/organizations?name=X` | Buscar por nombre |
| POST | `/organizations` | Crear organización |
| GET | `/organizations/:id` | Obtener por ID |
| PATCH | `/organizations/:id` | Actualizar organización |
| DELETE | `/organizations/:id` | Eliminar organización |

### Membresías (`/organizations/:organizationId/members`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/organizations/:orgId/members` | Listar miembros |
| POST | `/organizations/:orgId/members` | Agregar miembro |
| PATCH | `/organizations/:orgId/members/:memberId` | Actualizar rol |
| DELETE | `/organizations/:orgId/members/:memberId` | Remover miembro |

---

## Roadmap de Implementación Sugerido

### Sprint 1: Fundamentos de Autenticación
1. US-FE-AUT-001: Página de Registro
2. US-FE-AUT-002: Página de Login
3. US-FE-AUT-004: Logout
4. US-FE-AUT-005: Perfil de Usuario
5. US-FE-AUT-006: Protección de Rutas

### Sprint 2: OAuth y Organizaciones Base
1. US-FE-AUT-003: Google OAuth
2. US-FE-ORG-001: Listado de Organizaciones
3. US-FE-ORG-002: Crear Organización
4. US-FE-ORG-003: Detalle de Organización

### Sprint 3: Gestión de Membresías
1. US-FE-ORG-006: Listado de Miembros
2. US-FE-ORG-007: Agregar Miembro
3. US-FE-ORG-008: Actualizar Rol
4. US-FE-ORG-009: Remover Miembro

### Sprint 4: Tablero de Tickets (requiere backend)
1. US-FE-TCK-001: Tablero Kanban
2. US-FE-TCK-002: Crear Ticket
3. US-FE-TCK-003: Detalle de Ticket

### Sprint 5: Colaboración en Tiempo Real
1. US-FE-WSS-001: Presencia de Usuarios
2. US-FE-WSS-002: Chat por Ticket
3. US-FE-WSS-003: Sincronización en Tiempo Real

### Sprint 6: Features Avanzados
1. US-FE-VCC-001: Videollamadas
2. US-FE-AIP-001: Asistente IA
3. Panel de Administración

---

*Documento generado para el proyecto Nexus - Última actualización: Diciembre 2024*
