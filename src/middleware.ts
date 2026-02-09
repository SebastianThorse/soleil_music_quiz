// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { auth } = await import('./lib/auth');

  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/quiz'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    context.url.pathname.startsWith(route),
  );

  // Redirect to login if trying to access protected route without session
  if (isProtectedRoute && !isAuthed) {
    return context.redirect(
      '/login?redirect=' + encodeURIComponent(context.url.pathname),
    );
  }

  // Redirect to dashboard if logged in user tries to access login page
  if (context.url.pathname === '/login' && isAuthed) {
    const redirectParam = context.url.searchParams.get('redirect');
    return context.redirect(redirectParam || '/dashboard');
  }

  return next();
});
