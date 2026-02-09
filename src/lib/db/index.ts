// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create the Turso client
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL!,
  authToken: import.meta.env.TURSO_AUTH_TOKEN!,
});

// Create and export the Drizzle instance
export const db = drizzle(client, { schema });
