---
description: Docker and Docker Compose best practices for this project
---

# Dockerize Commands

## Build and Run All Services
```bash
# Windows (PowerShell)
Copy-Item .env.example .env
docker compose up -d --build

# Mac/Linux
cp .env.example .env
docker compose up -d --build
```

## Switch Backend
```bash
# Go backend
docker compose -f compose.yaml -f compose.go.yaml up -d --build

# Python backend  
docker compose -f compose.yaml -f compose.py.yaml up -d --build

# Back to Node (default)
docker compose up -d --build
```

## View Logs
```bash
docker compose logs -f           # All services
docker compose logs -f api       # Only API
docker compose logs -f gateway   # Only gateway
```

## Rebuild Single Service
```bash
docker compose up -d --build api
docker compose up -d --build web
```

## Clean Restart (Reset DB)
```bash
docker compose down -v           # Remove volumes too
docker compose up -d --build
```

## Production Build Tips
- Use multi-stage Dockerfiles (already configured)
- Frontend apps build to static files served by nginx
- API services compile/build in separate stage
- Keep final images minimal (alpine base)

## Healthcheck Debug
```bash
docker compose ps                # Check health status
docker inspect --format='{{json .State.Health}}' project-starter-api-1
```
