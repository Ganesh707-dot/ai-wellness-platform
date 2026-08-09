import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  hasPermission,
  type Permission,
} from "@/lib/rbac";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(...allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role || "";
  if (!allowedRoles.includes(userRole)) redirect("/unauthorized");
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!hasPermission(role, permission)) redirect("/unauthorized");
  return session;
}

export async function requirePatient() {
  return requirePermission("portal:patient");
}

export async function requireDoctor() {
  return requirePermission("portal:clinician");
}

export async function requireAdmin() {
  return requirePermission("portal:admin");
}
