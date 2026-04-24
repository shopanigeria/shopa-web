import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

// ─── Route definitions ───────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/vendor/login", "/vendor/signup", "/vendor/forgot-password", "/vendor/reset-password", "/vendor/mock-login", "/admin/mock-login", "/superadmin/mock-login"];
const VENDOR_ROUTES = ["/vendor"];
const ADMIN_ROUTES = ["/admin"];
const SUPER_ADMIN_ROUTES = ["/superadmin"];

const ROLE_REDIRECT: Record<string, string> = {
  customer: "/home",
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/superadmin/dashboard",
};

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

function getTokenFromRequest(request: NextRequest): string | null {
  return (
    request.cookies.get("shopa_access_token")?.value ??
    request.headers.get("Authorization")?.replace("Bearer ", "") ??
    null
  );
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getRoleFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.role;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes + Next.js internals
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Dev-only: mock session bypasses token check
  const isMockVendor = request.cookies.get("shopa_mock_vendor")?.value === "1";
  if (isMockVendor && process.env.NODE_ENV === "development") {
    if (VENDOR_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();
  }
  const isMockAdmin = request.cookies.get("shopa_mock_admin")?.value === "1";
  if (isMockAdmin && process.env.NODE_ENV === "development") {
    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();
  }
  const isMockSuperAdmin = request.cookies.get("shopa_mock_superadmin")?.value === "1";
  if (isMockSuperAdmin && process.env.NODE_ENV === "development") {
    if (SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  // No token → redirect to login
  if (!token || isTokenExpired(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = getRoleFromToken(token);
  if (!role) return NextResponse.redirect(new URL("/login", request.url));

  // Guard role-specific routes
  if (VENDOR_ROUTES.some((r) => pathname.startsWith(r)) && role !== "vendor") {
    return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? "/login", request.url));
  }
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && !["admin", "super_admin"].includes(role)) {
    return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? "/login", request.url));
  }
  if (SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "super_admin") {
    return NextResponse.redirect(new URL(ROLE_REDIRECT[role] ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
