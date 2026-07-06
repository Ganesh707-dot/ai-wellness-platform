import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(...allowedRoles: string[]) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;

  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }

  return session;
}

export async function requirePatient() {
  return requireRole("PATIENT");
}

export async function requireDoctor() {
  return requireRole("DOCTOR");
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export function checkRole(userRole: string, ...allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isPatient(userRole: string): boolean {
  return userRole === "PATIENT";
}

export function isDoctor(userRole: string): boolean {
  return userRole === "DOCTOR";
}

export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN";
}

export const ROLE_PERMISSIONS = {
  PATIENT: {
    canViewDashboard: true,
    canBookAppointment: true,
    canViewOwnPrescriptions: true,
    canViewOwnReports: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canCancelAppointment: true,
    canRateDoctors: true,
  },
  DOCTOR: {
    canViewDashboard: true,
    canManageAppointments: true,
    canIssuePrescriptions: true,
    canUploadReports: true,
    canViewPatientProfiles: true,
    canPublishArticles: true,
    canManageAvailability: true,
    canViewConsultationHistory: true,
  },
  ADMIN: {
    canViewDashboard: true,
    canManageUsers: true,
    canManageContent: true,
    canManageAppointments: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canVerifyDoctors: true,
    canSuspendUsers: true,
    canViewAuditLogs: true,
  },
};

export function hasPermission(
  userRole: string,
  permission: keyof (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS]
): boolean {
  const roleKey = userRole as keyof typeof ROLE_PERMISSIONS;
  const permissions = ROLE_PERMISSIONS[roleKey];

  if (!permissions) return false;

  return permissions[permission as any] === true;
}
