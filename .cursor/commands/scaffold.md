# scaffold
Create/verify the standard single-repo structure for this project and keep it minimal-runnable.

Requirements:
- Ensure directories exist: apps/web, apps/admin, services/api, packages/shared, db/migrations, infra/nginx, scripts, docs
- Ensure README.md includes: local dev, docker compose start, env variables, ports
- Ensure .env.example includes: OPENROUTER_API_KEY, APP_NAME, APP_URL, DATABASE_URL and Postgres defaults
- Ensure compose.yaml has postgres + api services (api can be minimal, but must expose /healthz)
- Do not generate heavy frontend scaffolding unless explicitly asked. Use placeholders (.gitkeep) if needed.
Return a checklist of what you created/changed.
