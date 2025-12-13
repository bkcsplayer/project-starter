Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose -f compose.yaml -f compose.go.yaml up -d --build
