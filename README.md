# Enterprise Reports Hub

Aplicación full-stack construida como una prueba de desempeño profesional para un módulo de reportería. El proyecto implementa autenticación JWT segura con `jose`, rotación de refresh tokens, CRUD completo de reportes, dashboard con métricas, PDFs dinámicos, auditoría y cron jobs.

## Stack

- TypeScript
- React 19
- Next.js 16 App Router
- PostgreSQL
- Prisma ORM
- `jose`
- `bcryptjs`
- `dotenv`
- ESLint
- Prettier

## Arquitectura

La lógica backend está organizada por capas en `src/server/`:

- `controllers`: borde HTTP para App Router
- `services`: casos de uso y reglas de negocio
- `repositories`: acceso a base de datos con Prisma
- `middlewares`: autenticación y autorización
- `validators`: validación de payloads y query params
- `dtos`: contratos de entrada/salida
- `auth`: JWT, cookies, sesión y hash
- `prisma`: cliente Prisma
- `utils`: errores, respuestas y helpers
- `logs`: logging
- `auditoria`: trazabilidad persistente

## Funcionalidades

### Autenticación y autorización

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- Access token de 15 minutos
- Refresh token de 7 días
- Refresh token persistido en base de datos como hash
- Middleware con validación JWT desde header o cookie
- Roles `ADMIN` y `USER`

### CRUD de reportes

- `POST /api/v1/reportes`
- `GET /api/v1/reportes`
- `GET /api/v1/reportes/:id`
- `PUT /api/v1/reportes/:id`
- `DELETE /api/v1/reportes/:id`
- `GET /api/v1/reportes/search?q=`
- Paginación
- Filtros
- Búsqueda
- Soft delete
- Auditoría de acciones críticas

### Dashboard y reportería dinámica

- Métricas clave
- Gráficas con `recharts`
- Actividad reciente del sistema
- Exportación PDF
- Ejecución manual y automática de cron jobs

## Estructura de rutas UI

- `/login`
- `/register`
- `/dashboard`
- `/reportes`
- `/pdf`
- `/panel-administrativo`
- `/usuarios`

## Requisitos previos

- Node.js `18+`
- PostgreSQL corriendo localmente o en la nube
- Variables de entorno configuradas

## Instalación

```bash
npm install
cp .env.example .env
```

Actualiza `DATABASE_URL` y los secretos JWT en `.env`.

## Comandos

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### Calidad

```bash
npm run lint
npm run format
```

## Datos de prueba

Seed incluido con usuarios listos para validar flujo completo:

- Admin:
  `admin@reportes.com` / `Admin123!`
- Usuario estándar:
  `usuario@reportes.com` / `Usuario123!`

## Ejemplos de requests

### Signup

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "fullName": "Andrea Ruiz",
  "email": "andrea@empresa.com",
  "password": "Segura123!"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@reportes.com",
  "password": "Admin123!"
}
```

### Crear reporte

```http
POST /api/v1/reportes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tipo": "ADMINISTRATIVO",
  "fecha": "2026-04-28",
  "usuarioId": "UUID_DEL_USUARIO",
  "descripcion": "Resumen ejecutivo con KPIs operativos y auditoría del día."
}
```

## Entregables incluidos

- `README.md`
- `.env.example`
- `postman/reports-app.postman_collection.json`
- `docs/er-diagram.md`
- `docs/jwt-flow.md`
- `docs/architecture.md`
- migración Prisma
- seed reproducible

## Diagramas

- ER Diagram: [docs/er-diagram.md](docs/er-diagram.md)
- JWT Flow: [docs/jwt-flow.md](docs/jwt-flow.md)
- Architecture: [docs/architecture.md](docs/architecture.md)

## Notas

- El proyecto prepara todo para un repositorio público, pero la publicación en GitHub depende de acceso remoto y credenciales del entorno.
- El registro público crea usuarios `USER`. El rol `ADMIN` se entrega por seed para mantener el modelo seguro.
