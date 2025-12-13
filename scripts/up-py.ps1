Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose -f compose.yaml -f compose.py.yaml up -d --build
