-- This file is auto-run by PostgreSQL Docker image on first start
-- It runs ALL migrations and seeds in order

-- Run migrations
\i /docker-entrypoint-initdb.d/migrations/001_init.sql

-- Run seed data
\i /docker-entrypoint-initdb.d/seed/seed.sql
