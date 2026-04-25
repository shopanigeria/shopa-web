import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

// ─── Route definitions ───────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/vendor/login", "/vendor/signup", "/vendor/forgot-password", "/vendor/reset-password", "/vendor/mock-login", "/admin/mock-login", "/superadmin/mock-login"];
const VENDOR_ROUTES = ["/vendor"];
const ADMIN_ROUTES = ["/admin"];
const SUPER_ADMIN_ROUTES = ["/superadmin"];

// Keys are lowercased JWT role values (after normalisation in getRoleFromToken)
const ROLE_REDIRECT: Record<string, string> = {
  student:    "/home",       // backend sends "STUDENT" → normalised to "student"
  customer:   "/home",       // legacy fallback
  vendor:     "/vendor/dashboard",
  admin:      "/admin/dashboard",
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
    // Normalise to lowercase so middleware comparisons work regardless of
    // whether the backend sends "SUPER_ADMIN" or "super_admin"
    return decoded.role?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// ─── Subdomain role restriction ─────────────────────────────────────────────
const CUSTOMER_ROUTES = ["/home", "/categories", "/products", "/cart", "/checkout", "/orders", "/profile", "/saved", "/vouchers", "/referrals", "/help", "/terms", "/disputes", "/account-settings", "/referrals"];

function enforceAppRole(pathname: string, loginUrl: URL): NextResponse | null {
  const appRole = process.env.NEXT_PUBLIC_APP_ROLE;
  if (!appRole) return null; // No restriction — monorepo / local dev

  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isCustomerRoute = CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));

  switch (appRole) {
    case "customer":
      if (isVendorRoute || isAdminRoute || isSuperAdminRoute)
        return NextResponse.redirect(loginUrl);
      break;
    case "vendor":
      if (isCustomerRoute || isAdminRoute || isSuperAdminRoute)
        return NextResponse.redirect(loginUrl);
      break;
    case "admin":
      if (isCustomerRoute || isVendorRoute || isSuperAdminRoute)
        return NextResponse.redirect(loginUrl);
      break;
    case "superadmin":
      if (isCustomerRoute || isVendorRoute || isAdminRoute)
        return NextResponse.redirect(loginUrl);
      break;
  }
  return null;
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

  // Enforce subdomain role restrictions before anything else
  const loginUrl = new URL("/login", request.url);
  const roleBlock = enforceAppRole(pathname, loginUrl);
  if (roleBlock) return roleBlock;

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
