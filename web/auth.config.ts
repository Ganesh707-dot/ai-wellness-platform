import type { NextAuthConfig } from "next-auth";
import {
  clinicianTierFor,
  homeForRole,
  permissionsForRole,
  requiredPermissionForPath,
  sessionHasPermission,
} from "@/lib/rbac";

/** Edge-safe auth fragment — no bcrypt / Prisma / Node APIs */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const role = (user as { role?: string }).role;
        const active = (user as { isActive?: boolean }).isActive !== false;
        const granted = (user as { permissions?: string[] }).permissions;
        token.id = user.id;
        token.role = role;
        token.email = user.email;
        token.isActive = active;
        // Prefer admin-granted permissions from activation; else role preset
        token.permissions =
          granted?.length ? granted : permissionsForRole(role);
        token.clinicianTier = clinicianTierFor(role);
        token.doctorId = (user as { doctorId?: string }).doctorId;
      }
      if (token.isActive === false) {
        token.permissions = [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "PATIENT"
          | "DOCTOR"
          | "CLINICAL_LEAD"
          | "ADMIN";
        session.user.isActive = token.isActive !== false;
        session.user.permissions =
          token.isActive === false
            ? []
            : (token.permissions as string[]) || [];
        session.user.clinicianTier =
          (token.clinicianTier as "JUNIOR" | "STANDARD" | "LEAD" | "NONE") ||
          "NONE";
        session.user.doctorId = token.doctorId as string | undefined;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/doctor") ||
        pathname.startsWith("/admin") ||
        pathname === "/docs/hand-on" ||
        pathname.startsWith("/docs/hand-on/");

      if (isProtected && !isLoggedIn) return false;

      const role = (auth?.user as { role?: string } | undefined)?.role;
      const needed = requiredPermissionForPath(pathname);
      const granted = (auth?.user as { permissions?: string[] } | undefined)
        ?.permissions;

      if (needed && role && !sessionHasPermission(role, needed, granted)) {
        const home = homeForRole(role);
        if (home && home !== pathname) {
          return Response.redirect(new URL(home, request.nextUrl));
        }
        return Response.redirect(new URL("/unauthorized", request.nextUrl));
      }

      if (
        pathname.startsWith("/dashboard") &&
        role &&
        !sessionHasPermission(role, "portal:patient", granted)
      ) {
        return Response.redirect(new URL(homeForRole(role), request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "veridian-clinical-demo-secret-change-in-prod",
} satisfies NextAuthConfig;
