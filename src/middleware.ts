import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseBrowserConfig } from '@/lib/env';

const publicRoutes = new Set(['/', '/login']);

const adminRoutePermissions: Array<{ prefix: string; moduleKey: string; action: string }> = [
  { prefix: '/admin/users', moduleKey: 'users', action: 'read' },
  { prefix: '/admin/groups', moduleKey: 'groups', action: 'read' },
  { prefix: '/admin/modules', moduleKey: 'modules', action: 'read' },
  { prefix: '/admin/master-files', moduleKey: 'master_files', action: 'read' },
  { prefix: '/admin/internal-officers', moduleKey: 'internal_officers', action: 'read' },
];

function getAdminRoutePermission(pathname: string) {
  return adminRoutePermissions.find((permission) => pathname.startsWith(permission.prefix));
}

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname);
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => (
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  ));
}

function hasPageSessionMarker(request: NextRequest) {
  return request.cookies.get('dlpp-session')?.value === 'active';
}

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabaseBrowserConfig();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const hasAuthCookie = hasSupabaseAuthCookie(request) || hasPageSessionMarker(request);

    if (!user && !hasAuthCookie && !isPublicRoute(pathname) && !isApiRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname + request.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    if (!user && !isPublicRoute(pathname) && isApiRoute(pathname)) {
      return response;
    }

    if (user && pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = request.nextUrl.searchParams.get('redirectedFrom') || '/cases';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === '/admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/users';
      return NextResponse.redirect(redirectUrl);
    }

    const adminPermission = getAdminRoutePermission(pathname);
    if (user && adminPermission) {
      const { data: allowed, error } = await supabase.rpc('user_has_permission', {
        p_user_id: user.id,
        p_module_key: adminPermission.moduleKey,
        p_action: adminPermission.action,
      });

      if (error || allowed !== true) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        redirectUrl.search = '';
        return NextResponse.redirect(redirectUrl);
      }
    }

    return response;
  } catch {
    if (isPublicRoute(pathname)) {
      return response;
    }

    if (!isApiRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname + request.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
