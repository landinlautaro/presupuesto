# Presupuesto 2026

Aplicacion web de presupuesto personal (single-user) con:

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: ASP.NET Core Web API + EF Core + PostgreSQL
- Auth: JWT con un unico usuario

## Estructura

```text
/backend
/frontend
docker-compose.yml
README.md
```

## Requisitos

- Node.js 20+
- npm 10+
- .NET SDK 10 (actualmente `TargetFramework: net10.0`)
- Docker Desktop (opcional, recomendado para DB local)

## Variables de entorno

### Frontend

Archivo: `frontend/.env`

```env
VITE_API_URL=http://localhost:8080
```

Referencia: `frontend/.env.example`

### Backend

Se toman de `backend/appsettings.Development.json` o de variables de entorno:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Secret`
- `Auth__Email`
- `Auth__PasswordHash`
- `Cors__Origins`

## Run local

## Opcion A: Docker Compose (backend + db) + frontend local

1. Levantar backend y PostgreSQL:

```bash
docker compose up --build
```

2. En otra terminal, levantar frontend:

```bash
cd frontend
npm install
npm run dev
```

3. URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Opcion B: todo manual

1. Levantar PostgreSQL local (o usar contenedor solo de DB).
2. Ajustar `backend/appsettings.Development.json`.
3. Aplicar migraciones:

```bash
cd backend
dotnet ef database update
```

4. Ejecutar backend:

```bash
cd backend
dotnet run
```

5. Ejecutar frontend:

```bash
cd frontend
npm install
npm run dev
```

## Docker (desarrollo)

- `backend/Dockerfile`: build/publish de la API y runtime en puerto `8080`.
- `docker-compose.yml`: servicios `backend` y `db` (PostgreSQL 16 + volumen `pgdata`).

## Deploy

## Backend en Railway

1. Crear proyecto en Railway y conectar el repo.
2. Configurar el servicio para usar `backend/Dockerfile`.
3. Definir variables de entorno:
- `ConnectionStrings__DefaultConnection` (Supabase Postgres URI)
- `Jwt__Secret` (minimo 32 chars)
- `Auth__Email`
- `Auth__PasswordHash` (BCrypt)
- `Cors__Origins` (URL publica del frontend en Vercel)
4. Exponer puerto `8080` (el contenedor ya escucha ahi).
5. Deploy.

## Frontend en Vercel

1. Importar repo en Vercel.
2. Configurar:
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
3. Variable de entorno:
- `VITE_API_URL=https://<tu-backend-railway>`
4. Deploy.

## Build checks

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

Backend:

```bash
cd backend
dotnet build
```

## Endpoints principales

- Auth: `POST /auth/login`
- Movimientos: `GET/POST/PUT/DELETE /movimientos`
- Asignacion: `GET/POST/PUT/DELETE /asignacion`
- FX: `GET /fx`, `GET /fx/{mes}`, `PUT /fx/{mes}`, `GET /fx/cotizacion-actual`
- Resumen: `GET /resumen/{mes}`, `GET /resumen/activos`
- Importar: `POST /import/xlsx`

## Notas

- App pensada para un solo usuario.
- El endpoint `/fx/cotizacion-actual` consulta y devuelve valores en tiempo real, pero no persiste.
- `monto_usd` de asignacion se calcula en backend (`monto_ars / tc`).
