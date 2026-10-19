import { createAuthClient } from 'better-auth/react';

// No baseURL: the client uses the current origin, so production and preview deploys both work.
export const authClient = createAuthClient();

export const { useSession } = authClient;
