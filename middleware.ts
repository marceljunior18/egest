import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si l'utilisateur tente d'accéder au dashboard
  if (pathname.startsWith('/dashboard')) {
    // Vérification du token Supabase ou cookie de session si configuré
    const supabaseToken = request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value;

    // En environnement de développement avec fallback démo, on autorise l'accès fluide
    const isDev = process.env.NODE_ENV !== 'production';

    // Si pas de session et en production stricte, rediriger vers login
    if (!supabaseToken && !isDev) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
