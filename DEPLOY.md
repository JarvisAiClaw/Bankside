# Deploy Bankside on Fasthosts VPS

Isolated stack: docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
Project name bankside-prod. App host port 3001. Postgres not published to host.
Copy .env.production.example to .env.production; set POSTGRES_PASSWORD and SESSION_SECRET.
Proxy: deploy/Caddyfile or deploy/nginx-bankside.conf for bankside.example.com next to existing site.
Update: rebuild with same compose file. Backup: pg_dump inside db service.
