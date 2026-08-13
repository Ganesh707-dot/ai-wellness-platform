/**
 * Enterprise RBAC — permission-based access control.
 * Roles are bundles of permissions; APIs/routes enforce permissions, not just role names.
 */

export type AppRole = "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";

/** Clinician maturity — used for fresh-doctor problem-solver UX */
export type ClinicianTier = "JUNIOR" | "STANDARD" | "LEAD" | "NONE";

export type Permission =
  | "portal:patient"
  | "portal:clinician"
  | "portal:admin"
  | "appointments:read_own"
  | "appointments:write_own"
  | "appointments:read_panel"
  | "appointments:manage_all"
  | "patients:read_panel"
  | "patients:read_chart"
  | "patients:write_notes"
  | "prescriptions:read_own"
  | "prescriptions:issue"
  | "cds:patient_navigator"
  | "cds:encounter"
  | "cds:escalation"
  | "users:read"
  | "users:write"
  | "users:suspend"
  | "rbac:read"
  | "rbac:write"
  | "audit:read"
  | "analytics:ops"
  | "content:publish"
  | "content:study_guide";

export const PERMISSION_CATALOG: Record<
  Permission,
  { label: string; domain: string; description: string }
> = {
  "portal:patient": {
    label: "Patient portal",
    domain: "Portal",
    description: "Access patient workspace",
  },
  "portal:clinician": {
    label: "Clinician portal",
    domain: "Portal",
    description: "Access clinician workspace",
  },
  "portal:admin": {
    label: "Admin console",
    domain: "Portal",
    description: "Access platform control plane",
  },
  "appointments:read_own": {
    label: "Read own appointments",
    domain: "Encounters",
    description: "View personal bookings",
  },
  "appointments:write_own": {
    label: "Book / manage own",
    domain: "Encounters",
    description: "Create or cancel personal bookings",
  },
  "appointments:read_panel": {
    label: "Read clinic schedule",
    domain: "Encounters",
    description: "View assigned encounter queue",
  },
  "appointments:manage_all": {
    label: "Manage all encounters",
    domain: "Encounters",
    description: "Ops-level encounter control",
  },
  "patients:read_panel": {
    label: "Patient panel list",
    domain: "Charts",
    description: "Search and list panel patients",
  },
  "patients:read_chart": {
    label: "Open patient chart",
    domain: "Charts",
    description: "Full dossier + analytics",
  },
  "patients:write_notes": {
    label: "Write clinical notes",
    domain: "Charts",
    description: "Document encounter notes",
  },
  "prescriptions:read_own": {
    label: "Read own Rx",
    domain: "Pharmacy",
    description: "Patient prescription history",
  },
  "prescriptions:issue": {
    label: "Issue prescriptions",
    domain: "Pharmacy",
    description: "Clinician prescribing rights",
  },
  "cds:patient_navigator": {
    label: "Symptom Navigator",
    domain: "CDS",
    description: "Patient-facing clinical decision support",
  },
  "cds:encounter": {
    label: "Encounter CDS",
    domain: "CDS",
    description: "Clinician SOAP / intent analytics",
  },
  "cds:escalation": {
    label: "Clinical escalation",
    domain: "CDS",
    description: "Escalate junior cases to lead review",
  },
  "users:read": {
    label: "Read users",
    domain: "IAM",
    description: "View user directory",
  },
  "users:write": {
    label: "Provision users",
    domain: "IAM",
    description: "Create and update accounts",
  },
  "users:suspend": {
    label: "Suspend users",
    domain: "IAM",
    description: "Activate / suspend accounts",
  },
  "rbac:read": {
    label: "View RBAC matrix",
    domain: "IAM",
    description: "Inspect roles and permissions",
  },
  "rbac:write": {
    label: "Edit RBAC",
    domain: "IAM",
    description: "Change role permission grants (policy)",
  },
  "audit:read": {
    label: "Audit log",
    domain: "Security",
    description: "View access and change events",
  },
  "analytics:ops": {
    label: "Ops analytics",
    domain: "Analytics",
    description: "Platform health and volume metrics",
  },
  "content:publish": {
    label: "Publish content",
    domain: "Knowledge",
    description: "Publish clinical education content",
  },
  "content:study_guide": {
    label: "Study guide access",
    domain: "Knowledge",
    description: "Read secured hands-on master study guide",
  },
};

const PATIENT_PERMS: Permission[] = [
  "portal:patient",
  "appointments:read_own",
  "appointments:write_own",
  "prescriptions:read_own",
  "cds:patient_navigator",
];

const DOCTOR_PERMS: Permission[] = [
  "portal:clinician",
  "appointments:read_panel",
  "patients:read_panel",
  "patients:read_chart",
  "patients:write_notes",
  "prescriptions:issue",
  "cds:encounter",
  "cds:escalation",
  "content:publish",
  "content:study_guide",
];

const LEAD_PERMS: Permission[] = [
  ...DOCTOR_PERMS,
  "appointments:manage_all",
  "users:read",
  "analytics:ops",
  "audit:read",
];

const ADMIN_PERMS: Permission[] = [
  "portal:admin",
  "appointments:manage_all",
  "patients:read_panel",
  "patients:read_chart",
  "users:read",
  "users:write",
  "users:suspend",
  "rbac:read",
  "rbac:write",
  "audit:read",
  "analytics:ops",
  "content:publish",
  "content:study_guide",
  "cds:patient_navigator",
];

/** Base role → permissions (immutable policy defaults) */
export const ROLE_POLICY: Record<AppRole, Permission[]> = {
  PATIENT: PATIENT_PERMS,
  DOCTOR: DOCTOR_PERMS,
  CLINICAL_LEAD: LEAD_PERMS,
  ADMIN: ADMIN_PERMS,
};

export const ROLE_META: Record<
  AppRole,
  { label: string; blurb: string; home: string }
> = {
  PATIENT: {
    label: "Patient",
    blurb: "Book, track care, and use Symptom Navigator",
    home: "/dashboard",
  },
  DOCTOR: {
    label: "Clinician",
    blurb: "Fresh-doctor problem-solver workspace with Encounter CDS",
    home: "/doctor",
  },
  CLINICAL_LEAD: {
    label: "Clinical lead",
    blurb: "Senior oversight, escalations, and panel quality",
    home: "/doctor",
  },
  ADMIN: {
    label: "Platform admin",
    blurb: "IAM, RBAC policy, ops analytics, audit",
    home: "/admin",
  },
};

/** Path prefix → required permission (first match wins) */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/docs/hand-on", permission: "content:study_guide" },
  { prefix: "/admin/rbac", permission: "rbac:read" },
  { prefix: "/admin/users", permission: "users:read" },
  { prefix: "/admin", permission: "portal:admin" },
  { prefix: "/doctor/patients", permission: "patients:read_panel" },
  { prefix: "/doctor/encounters", permission: "appointments:read_panel" },
  { prefix: "/doctor/copilot", permission: "cds:encounter" },
  { prefix: "/doctor", permission: "portal:clinician" },
  { prefix: "/dashboard", permission: "portal:patient" },
  { prefix: "/api/admin/users", permission: "users:read" },
  { prefix: "/api/admin", permission: "portal:admin" },
  { prefix: "/api/doctor/patients", permission: "patients:read_panel" },
  { prefix: "/api/doctor/ai-search", permission: "cds:encounter" },
  { prefix: "/api/doctor", permission: "portal:clinician" },
  { prefix: "/api/patient", permission: "portal:patient" },
];

export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) return null;
  if (role === "CLINICAL_LEAD") return "CLINICAL_LEAD";
  if (role === "ADMIN") return "ADMIN";
  if (role === "DOCTOR") return "DOCTOR";
  if (role === "PATIENT") return "PATIENT";
  return null;
}

export function permissionsForRole(role?: string | null): Permission[] {
  const r = normalizeRole(role);
  if (!r) return [];
  return [...ROLE_POLICY[r]];
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  return permissionsForRole(role).includes(permission);
}

/** Prefer admin-granted JWT permissions; fall back to role preset. */
export function sessionHasPermission(
  role: string | null | undefined,
  permission: Permission,
  granted?: string[] | null
): boolean {
  if (granted && granted.length > 0) {
    return granted.includes(permission);
  }
  return hasPermission(role, permission);
}

export function hasAnyPermission(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function clinicianTierFor(role?: string | null): ClinicianTier {
  if (role === "CLINICAL_LEAD") return "LEAD";
  if (role === "DOCTOR") return "JUNIOR"; // demo: doctor@test.com = fresh clinician
  return "NONE";
}

export function requiredPermissionForPath(pathname: string): Permission | null {
  const hit = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  return hit?.permission ?? null;
}

export function homeForRole(role?: string | null): string {
  const r = normalizeRole(role);
  return r ? ROLE_META[r].home : "/login";
}

/** Legacy helpers used across the app */
export function checkRole(userRole: string, ...allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isPatient(userRole: string): boolean {
  return userRole === "PATIENT";
}

export function isDoctor(userRole: string): boolean {
  return userRole === "DOCTOR" || userRole === "CLINICAL_LEAD";
}

export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN";
}

/** API guard — returns NextResponse-ready payload */
export function denyUnlessPermission(
  role: string | null | undefined,
  permission: Permission,
  granted?: string[] | null
): { ok: true } | { ok: false; status: 401 | 403; error: string } {
  if (!role) return { ok: false, status: 401, error: "Unauthorized" };
  if (!sessionHasPermission(role, permission, granted)) {
    return {
      ok: false,
      status: 403,
      error: `Missing permission: ${permission}`,
    };
  }
  return { ok: true };
}

export function buildRbacMatrix() {
  const roles = Object.keys(ROLE_POLICY) as AppRole[];
  const permissions = Object.keys(PERMISSION_CATALOG) as Permission[];
  return {
    roles: roles.map((role) => ({
      role,
      ...ROLE_META[role],
      permissions: ROLE_POLICY[role],
      clinicianTier: clinicianTierFor(role),
    })),
    permissions: permissions.map((id) => ({
      id,
      ...PERMISSION_CATALOG[id],
    })),
    matrix: permissions.map((perm) => ({
      permission: perm,
      grants: Object.fromEntries(
        roles.map((role) => [role, ROLE_POLICY[role].includes(perm)])
      ) as Record<AppRole, boolean>,
    })),
  };
}

export const AUDIT_EVENTS_SEED = [
  {
    id: "aud_01",
    at: new Date(Date.now() - 3600_000).toISOString(),
    actor: "admin@test.com",
    action: "users:write",
    detail: "Provisioned clinician account",
  },
  {
    id: "aud_02",
    at: new Date(Date.now() - 7200_000).toISOString(),
    actor: "doctor@test.com",
    action: "cds:encounter",
    detail: "Encounter CDS run — headache intent",
  },
  {
    id: "aud_03",
    at: new Date(Date.now() - 10800_000).toISOString(),
    actor: "doctor@test.com",
    action: "cds:escalation",
    detail: "Junior clinician requested lead review",
  },
  {
    id: "aud_04",
    at: new Date(Date.now() - 14400_000).toISOString(),
    actor: "system",
    action: "rbac:read",
    detail: "Policy matrix loaded for admin console",
  },
];
