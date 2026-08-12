import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validation";
import { findDemoUser, isDemoMode } from "@/lib/demo-data";
import { effectivePermissions, findManagedUser } from "@/lib/user-store";

async function authorizeDemo(email: string, password: string) {
  // Prefer admin-managed users (includes overrides), then seed accounts
  const user =
    (await findManagedUser(email)) || findDemoUser(email) || null;
  // Pending / suspended accounts cannot authenticate
  if (!user?.isActive || user.accessStatus === "pending") return null;

  // Demo reliability: accept known demo password + bcrypt hash
  const ok =
    password === "password123" || (await compare(password, user.password));
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    isActive: true,
    permissions: effectivePermissions(user),
    doctorId: user.doctorId,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse({
            email: credentials?.email,
            password: credentials?.password,
          });
          if (!parsed.success) return null;

          if (isDemoMode()) {
            return authorizeDemo(parsed.data.email, parsed.data.password);
          }

          const { db } = await import("@/lib/db");
          const { permissionsForRole } = await import("@/lib/rbac");
          const user = await db.user.findUnique({
            where: { email: parsed.data.email },
            include: { doctorProfile: true },
          });
          if (!user?.password || !user.isActive) return null;
          const ok = await compare(parsed.data.password, user.password);
          if (!ok) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            isActive: user.isActive,
            permissions: permissionsForRole(user.role),
            doctorId: user.doctorProfile?.id,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
