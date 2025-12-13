# dockerize
Make the repo Docker-first.

Requirements:
- Ensure services/api has a production Dockerfile (multi-stage preferred)
- Ensure compose.yaml starts postgres + api with healthcheck
- All configs via env vars; update .env.example
- Update README with: build/run commands, troubleshooting (ports, logs)
