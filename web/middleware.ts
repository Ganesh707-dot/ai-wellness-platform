import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import {
  homeForRole,
  requiredPermissionForPath,
  sessionHasPermission,
} from "@/lib/rbac";
import { LEGACY_SITE_HOSTS, LIVE_SITE_URL } from "@/lib/app-brand";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const host = req.headers.get("host")?.toLowerCase().replace(/:\d+$/, "");
  if (host && (LEGACY_SITE_HOSTS as readonly string[]).includes(host)) {
    const dest = new URL(`${pathname}${req.nextUrl.search}`, LIVE_SITE_URL);
    return NextResponse.redirect(dest, 308);
  }

  const isLoggedIn = !!req.auth?.user;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const granted = (
    req.auth?.user as { permissions?: string[] } | undefined
  )?.permissions;

  const publicPrefixes = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/register",
    "/forgot-password",
    "/unauthorized",
    "/articles",
    "/book-appointment",
    "/appointment-confirmed",
    "/ai",
    "/guest",
    "/innovation",
    "/docs",
    "/api/innovation",
    "/api/auth",
    "/api/articles",
    "/api/doctors",
    "/api/ai",
    "/api/appointments",
  ];

  const isPublic = publicPrefixes.some(
    (p) =>
      pathname === p ||
      (p !== "/" && pathname.startsWith(p + "/")) ||
      (p !== "/" && pathname.startsWith(p))
  );

  if (pathname === "/") return NextResponse.next();

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/patient") ||
    pathname.startsWith("/api/doctor") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/users");

  if (isProtected && !isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isProtected) {
    const needed = requiredPermissionForPath(pathname);
    if (needed && !sessionHasPermission(role, needed, granted)) {
      // Wrong portal (e.g. doctor hit /dashboard) → send to role home, not Access Denied
      const home = homeForRole(role);
      if (
        home &&
        home !== pathname &&
        !pathname.startsWith(home + "/") &&
        sessionHasPermission(
          role,
          requiredPermissionForPath(home) || needed,
          granted
        )
      ) {
        return NextResponse.redirect(new URL(home, req.nextUrl));
      }
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden", missingPermission: needed },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }

    if (
      pathname.startsWith("/dashboard") &&
      !sessionHasPermission(role, "portal:patient", granted)
    ) {
      return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl));
    }
    if (
      pathname.startsWith("/admin") &&
      !sessionHasPermission(role, "portal:admin", granted) &&
      !sessionHasPermission(role, "rbac:read", granted)
    ) {
      return NextResponse.redirect(new URL(homeForRole(role), req.nextUrl));
    }
  }

  if (isPublic || isProtected) return NextResponse.next();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
