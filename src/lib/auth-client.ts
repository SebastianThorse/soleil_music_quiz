import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_APP_URL,
});

export const { useSession } = createAuthClient({
  baseURL: import.meta.env.PUBLIC_APP_URL,
});
