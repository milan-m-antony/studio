
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// These should be set in your Vercel/Netlify environment variables for deployment
// For local development, Next.js will pick them up from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MAINTENANCE_PAGE_PATH = '/maintenance';
const ADMIN_SITE_SETTINGS_ID = 'global_settings';

// Paths to exclude from maintenance mode
const EXCLUDED_PATHS = [
  '/admin', // Exclude all admin paths
  '/api',   // Exclude all API routes
  MAINTENANCE_PAGE_PATH, // Don't redirect the maintenance page itself
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  // Add any other essential public paths or specific asset paths here
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the path is excluded
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Middleware: Supabase URL or Anon Key is not defined. Skipping maintenance check.');
    return NextResponse.next();
  }

  // Create a Supabase client instance specifically for the middleware
  // Note: Middleware runtime is different, so we create a client here.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Not needed for read-only anon access
    }
  });

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('is_maintenance_mode_enabled')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error('Middleware: Error fetching site settings:', error.message);
      // Proceed without maintenance mode if settings can't be fetched
      return NextResponse.next();
    }

    if (data?.is_maintenance_mode_enabled) {
      // Rewrite to the maintenance page
      const url = request.nextUrl.clone();
      url.pathname = MAINTENANCE_PAGE_PATH;
      return NextResponse.rewrite(url);
    }
  } catch (e) {
    console.error('Middleware: Exception during site settings fetch:', e);
    // Fallback to normal behavior in case of unexpected error
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Matcher to specify which paths the middleware should run on
// This avoids running it on unnecessary paths like internal Next.js assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin panel)
     * - maintenance (the maintenance page itself)
     * This should cover most public pages.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|maintenance).*)',
  ],
};
