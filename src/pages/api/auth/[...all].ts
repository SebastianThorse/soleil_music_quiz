// src/pages/api/auth/[...all].ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  const { auth } = await import('../../../lib/auth');
  return auth.handler(ctx.request);
};
