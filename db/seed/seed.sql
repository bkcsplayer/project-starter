-- Seed initial users using UPSERT to avoid duplicate errors on re-run
INSERT INTO users (id, name, email, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice Johnson', 'alice@example.com', NOW(), NOW()),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bob Smith', 'bob@example.com', NOW(), NOW()),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Charlie Brown', 'charlie@example.com', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();
