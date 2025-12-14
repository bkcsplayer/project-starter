---
description: How to scaffold new modules and extend the project structure
---

# Scaffold New Modules

## Add a New API Route (Node)

1. Create route file in `services/api-node/src/routes/`:
```typescript
// services/api-node/src/routes/myroute.ts
import { FastifyInstance } from 'fastify';
import { query } from '../db.js';

export default async function myRoute(app: FastifyInstance) {
  app.get('/my-endpoint', async (req, reply) => {
    // Your logic here
    return { data: 'hello' };
  });
}
```

2. Register in `src/index.ts`:
```typescript
import myRoute from './routes/myroute.js';
app.register(myRoute, { prefix: '/api' });
```

## Add a New Database Table

1. Create migration file `db/migrations/00X_create_tablename.sql`:
```sql
CREATE TABLE IF NOT EXISTS tablename (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

2. Add seed data in `db/seed/seed_tablename.sql` if needed

3. Update `db/init.sql` to include new files

## Add a New React-Admin Resource

1. Update `apps/admin/src/ra/App.tsx`:
```typescript
import { MyResourceList, MyResourceShow } from './MyResource';

<Resource 
  name="myresource" 
  list={MyResourceList}
  show={MyResourceShow}
/>
```

2. Create components for the resource
