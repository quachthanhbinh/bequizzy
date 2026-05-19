import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Maintenance mode switch.
 *
 * To enable:  set NEXT_PUBLIC_MAINTENANCE_MODE=1 in your .env or cloud secret.
 * To disable: remove the variable (or set to anything other than "1").
 *
 * The middleware bypasses the maintenance page for:
 *   - The /maintenance page itself (to avoid redirect loop)
 *   - Static assets (_next/static, _next/image, favicon.ico)
 */
const MAINTENANCE_ON = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard", "/campaigns", "/leads", "/sequences",
  "/inbox", "/ai-brain", "/scoring", "/analytics",
  "/meetings", "/crm", "/settings", "/onboarding", "/billing",
  "/automation", "/outreach", "/channels", "/integrations",
  "/forms", "/content-studio", "/advisor", "/revenue",
  "/workspace", "/solo",
];

// Auth routes — redirect to dashboard if already signed in
const AUTH_PREFIXES = ["/sign-in", "/sign-up", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Maintenance mode ──────────────────────────────────────────────────────
  if (MAINTENANCE_ON) {
    const isExempt =
      pathname === "/maintenance" ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/favicon");
    if (!isExempt) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
    return NextResponse.next();
  }

  // ── Auth protection ───────────────────────────────────────────────────────
  const authed = request.cookies.get("rl-auth")?.value === "1";

  // Redirect unauthenticated users away from protected routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect authenticated users away from auth routes
  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p)) && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - monitoring  (Sentry tunnel route — must bypass middleware)
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     */
    "/((?!monitoring|_next/static|_next/image|favicon.ico).*)",
  ],
};

