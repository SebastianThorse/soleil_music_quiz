import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.PUBLIC_APP_URL,
});

export const { useSession } = createAuthClient({
  baseURL: process.env.PUBLIC_APP_URL,
});
