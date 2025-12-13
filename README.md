<img src="docs/assets/banner.svg" alt="project-starter banner" />

# project-starter

A **full-stack prototype template** you can reuse for every new project:

- **Web**: React + Vite + TypeScript + TailwindCSS  
- **Admin**: React-Admin (MUI)  
- **API (choose one)**: **Node (Fastify)** / Go (Gin) / Python (FastAPI)  
- **DB**: PostgreSQL  
- **Deploy**: Docker-first (great for VPS + 宝塔 reverse proxy)

> This repo is designed as a **GitHub Template**. Click **Use this template** to start a new project in seconds.

---

## ✨ What you get

- One command brings up **Web + Admin + API + Postgres + Gateway**
- Nginx gateway routes:
  - `/` → Web
  - `/admin/` → Admin
  - `/api/*` → API
- OpenRouter wrappers (Node + Python) that:
  - **Fetch `/models` on startup**
  - Prefer **reasoning models**
  - Use `reasoning: { effort: "high" }`

---

## 🧭 Architecture

<img src="docs/assets/architecture.svg" alt="Architecture diagram" />

---

## 🚀 Quick Start (Docker)

```bash
cp .env.example .env
# fill OPENROUTER_API_KEY if you want /api/ai/reason to work

docker compose up -d --build
```

Open:

- Web: http://localhost:8080/
- Admin: http://localhost:8080/admin/
- API: http://localhost:8080/api/hello

### Switch backend (Go / Python)

**Go**
```bash
docker compose -f compose.yaml -f compose.go.yaml up -d --build
```

**Python**
```bash
docker compose -f compose.yaml -f compose.py.yaml up -d --build
```

---

## 🧪 API endpoints

- `GET /healthz` → health check
- `GET /api/hello` → hello
- `POST /api/ai/reason` → reasoning example (works in **Node** and **Python** backends)

Example:

```bash
curl -X POST http://localhost:8080/api/ai/reason \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain why we must fetch /models before picking a reasoning model."}'
```

---

## 🖥️ Local Dev (without Docker)

### Web
```bash
cd apps/web
npm i
npm run dev
```

### Admin
```bash
cd apps/admin
npm i
npm run dev
```

### API (Node default)
```bash
cd services/api-node
npm i
npm run dev
```

---

## 🧱 Landing page (wireframe)

<img src="docs/assets/landingpage.svg" alt="Landing page wireframe" />

---

## 📦 Repo structure

```
apps/
  web/          # React Vite + Tailwind
  admin/        # React-Admin (MUI)
services/
  api-node/     # Node Fastify (default)
  api-go/       # Go Gin
  api-py/       # Python FastAPI
db/migrations/  # SQL migrations
infra/nginx/    # Gateway config
packages/shared/ai/  # OpenRouter wrappers
.cursor/commands/    # Cursor commands (optional)
```

---

## 🔐 Notes

- `.env` is ignored by git. Copy from `.env.example`.
- If you use GitHub "Upload files" UI, dotfiles like `.cursorrules` / `.cursor/` may be hidden. Use `git push` instead.

---

## License

MIT (or replace with your preferred license)
