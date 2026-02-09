// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';

let authInstance: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (authInstance) return authInstance;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const client = createClient({
    url: tursoUrl || 'file:.astro/content.db',
    authToken: tursoToken,
  });

  const db = drizzle(client, { schema });

  authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:4321',
  });

  return authInstance;
}

export const auth = getAuth();
