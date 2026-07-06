import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await auth();

  // Public routes - no auth required
  const publicRoutes = [
    "/",
    "/about",
    "/services",
    "/conditions",
    "/articles",
    "/testimonials",
    "/contact",
    "/book-appointment",
    "/privacy",
    "/terms",
    "/login",
    "/register",
    "/auth",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Protected routes - auth required
  const protectedRoutes = ["/dashboard", "/doctor", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Patient-only routes
  const patientRoutes = ["/dashboard"];
  const isPatientRoute = patientRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Doctor-only routes
  const doctorRoutes = ["/doctor"];
  const isDoctorRoute = doctorRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Admin-only routes
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public routes - allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access control
  if (session) {
    const userRole = (session.user as any)?.role;

    // Patient routes
    if (isPatientRoute && userRole !== "PATIENT") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Doctor routes
    if (isDoctorRoute && userRole !== "DOCTOR") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Admin routes
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
