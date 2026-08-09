import { cookies } from "next/headers";
import { hash } from "bcryptjs";
import type { DemoUser, DemoRole } from "@/lib/demo-data";
import { demoDoctors, demoUsers } from "@/lib/demo-data";
import {
  permissionsForRole,
  type Permission,
  type AppRole,
} from "@/lib/rbac";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  listPanelsForAdmin,
  upsertDoctorPanel,
} from "@/lib/doctor-panel-store";

const COOKIE = STORAGE_KEYS.managedUsersCookie;
const MAX = 40;

type GlobalStore = { __awManagedUsers?: DemoUser[] };

function memory(): DemoUser[] {
  const g = globalThis as GlobalStore;
  if (!g.__awManagedUsers) g.__awManagedUsers = [];
  return g.__awManagedUsers;
}

async function readCookieUsers(): Promise<DemoUser[]> {
  try {
    const jar = await cookies();
    const raw =
      jar.get(COOKIE)?.value ||
      jar.get(STORAGE_KEYS.legacyManagedUsersCookie)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Cookie-safe shape (strip bulky fields so Vercel cookie limit is not hit). */
function toCookieUser(u: DemoUser): DemoUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    password: u.password,
    isActive: u.isActive,
    accessStatus: u.accessStatus,
    doctorId: u.doctorId,
    grantedPermissions: u.grantedPermissions,
  };
}

async function writeCookieUsers(users: DemoUser[]) {
  const jar = await cookies();
  const payload = JSON.stringify(users.slice(0, MAX).map(toCookieUser));
  if (payload.length > 3500) {
    // Prefer newest overrides; keep under typical ~4kb cookie limit
    const trimmed = users.slice(0, 12).map(toCookieUser);
    jar.set(COOKIE, JSON.stringify(trimmed), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return;
  }
  jar.set(COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

function withAccessDefaults(u: DemoUser): DemoUser {
  if (u.isActive && !u.accessStatus) {
    return {
      ...u,
      accessStatus: "active",
      grantedPermissions:
        u.grantedPermissions?.length
          ? u.grantedPermissions
          : permissionsForRole(u.role),
    };
  }
  if (!u.isActive && !u.accessStatus) {
    return {
      ...u,
      accessStatus: "pending",
      grantedPermissions: u.grantedPermissions || [],
    };
  }
  return u;
}

export async function listManagedUsers(): Promise<DemoUser[]> {
  const fromCookie = await readCookieUsers();
  const fromMem = memory();
  const map = new Map<string, DemoUser>();
  for (const u of demoUsers) map.set(u.email.toLowerCase(), withAccessDefaults(u));
  for (const u of [...fromMem, ...fromCookie]) {
    map.set(u.email.toLowerCase(), withAccessDefaults(u));
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function findManagedUser(email: string) {
  const all = await listManagedUsers();
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/** Assign a free clinician panel id for booking privacy */
export async function allocateDoctorId(
  role: DemoRole,
  preferred?: string
): Promise<string | undefined> {
  if (role !== "DOCTOR" && role !== "CLINICAL_LEAD") return undefined;
  const users = await listManagedUsers();
  const used = new Set(
    users.map((u) => u.doctorId).filter(Boolean) as string[]
  );

  if (preferred && !used.has(preferred)) return preferred;
  if (role === "CLINICAL_LEAD" && !used.has("doc_lead")) return "doc_lead";
  if (role === "DOCTOR" && !used.has("doc_01")) return "doc_01";

  for (const d of demoDoctors) {
    if (!used.has(d.id)) return d.id;
  }
  return `doc_custom_${Date.now()}`;
}

export type CreateUserInput = {
  name: string;
  email: string;
  role: DemoRole;
  password?: string;
  doctorId?: string;
  /** Required for clinicians when creating a new bookable panel */
  specialization?: string;
  /** default true for clinicians — creates panel under specialty */
  createPanel?: boolean;
  isActive?: boolean;
};

async function ensureClinicianPanel(opts: {
  role: DemoRole;
  name: string;
  email: string;
  doctorId?: string;
  specialization?: string;
  createPanel?: boolean;
}): Promise<string | undefined> {
  if (opts.role !== "DOCTOR" && opts.role !== "CLINICAL_LEAD") {
    return undefined;
  }

  // Explicit create → new bookable panel under specialty (enterprise path)
  if (opts.createPanel === true && opts.specialization) {
    const panel = await upsertDoctorPanel({
      name: opts.name,
      specialization: opts.specialization,
      linkedUserEmail: opts.email,
    });
    return panel.id;
  }

  // Link existing panel — do NOT overwrite that panel's name/specialty
  if (opts.doctorId && opts.createPanel !== true) {
    return opts.doctorId;
  }

  // Default for clinicians: create panel when specialty given
  if (opts.specialization) {
    const panel = await upsertDoctorPanel({
      name: opts.name,
      specialization: opts.specialization,
      linkedUserEmail: opts.email,
    });
    return panel.id;
  }

  return allocateDoctorId(opts.role, opts.doctorId);
}

export async function createManagedUser(input: CreateUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await findManagedUser(email);
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  if (
    (input.role === "DOCTOR" || input.role === "CLINICAL_LEAD") &&
    !input.specialization &&
    !input.doctorId
  ) {
    throw new Error(
      "Select a specialty (e.g. HOMEOPATHY) to create a bookable clinician panel"
    );
  }

  const passwordPlain = input.password?.trim() || "password123";
  const password = await hash(passwordPlain, 10);
  const doctorId = await ensureClinicianPanel({
    role: input.role,
    name: input.name.trim(),
    email,
    doctorId: input.doctorId,
    specialization: input.specialization,
    createPanel: input.createPanel,
  });

  const user: DemoUser = {
    id: `usr_live_${Date.now()}`,
    email,
    name: input.name.trim(),
    role: input.role,
    password,
    isActive: false,
    accessStatus: "pending",
    grantedPermissions: [],
    doctorId,
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
  };

  const list = memory();
  list.unshift(user);
  if (list.length > MAX) list.length = MAX;

  const cookieList = await readCookieUsers();
  const merged = [user, ...cookieList.filter((u) => u.email !== email)].slice(
    0,
    MAX
  );
  await writeCookieUsers(merged);

  return { user, tempPassword: passwordPlain };
}

export type ActivateUserInput = {
  id: string;
  role: DemoRole;
  permissions?: string[];
  doctorId?: string;
  specialization?: string;
  createPanel?: boolean;
  /** Default true: grant the full role preset (portal + all role perms). */
  useFullRoleAccess?: boolean;
};

export async function activateManagedUser(input: ActivateUserInput) {
  const all = await listManagedUsers();
  const target = all.find((u) => u.id === input.id);
  if (!target) throw new Error("User not found");

  const allowed = new Set(permissionsForRole(input.role as AppRole));
  const useFull = input.useFullRoleAccess !== false;
  const source =
    useFull || !input.permissions?.length
      ? [...allowed]
      : input.permissions;
  const granted = source.filter((p) => allowed.has(p as Permission));
  if (granted.length === 0) {
    throw new Error(
      "No permissions available for this role — pick DOCTOR / PATIENT / ADMIN"
    );
  }

  if (
    (input.role === "DOCTOR" || input.role === "CLINICAL_LEAD") &&
    input.createPanel === false &&
    !input.doctorId &&
    !target.doctorId
  ) {
    throw new Error(
      "Pick an existing specialty panel to link, or switch to “Create new panel”"
    );
  }

  const doctorId = await ensureClinicianPanel({
    role: input.role,
    name: target.name,
    email: target.email,
    doctorId: input.doctorId || target.doctorId,
    specialization: input.specialization,
    createPanel: input.createPanel,
  });

  // Always ensure portal permission for the assigned role
  const portal =
    input.role === "ADMIN"
      ? "portal:admin"
      : input.role === "PATIENT"
        ? "portal:patient"
        : "portal:clinician";
  const withPortal = granted.includes(portal)
    ? granted
    : [portal, ...granted];

  return updateManagedUser(input.id, {
    role: input.role,
    isActive: true,
    accessStatus: "active",
    grantedPermissions: withPortal,
    doctorId,
    specialization: input.specialization,
    // Panel already resolved above — do not create again
    createPanel: false,
  });
}

export type UpdateUserInput = Partial<
  Pick<
    DemoUser,
    | "name"
    | "role"
    | "isActive"
    | "grantedPermissions"
    | "accessStatus"
    | "doctorId"
  >
> & {
  /** Plaintext password — hashed before storage */
  password?: string;
  specialization?: string;
  createPanel?: boolean;
};

export async function updateManagedUser(id: string, patch: UpdateUserInput) {
  const all = await listManagedUsers();
  const target = all.find((u) => u.id === id);
  if (!target) throw new Error("User not found");

  if (
    (patch.isActive === false || patch.accessStatus === "suspended") &&
    target.role === "ADMIN" &&
    all.filter((u) => u.role === "ADMIN" && u.isActive).length <= 1
  ) {
    throw new Error("Cannot suspend the last active admin");
  }

  let accessStatus = patch.accessStatus ?? target.accessStatus;
  if (patch.isActive === true) accessStatus = "active";
  if (patch.isActive === false && accessStatus !== "pending") {
    accessStatus = "suspended";
  }

  const nextRole = patch.role ?? target.role;
  let doctorId = patch.doctorId ?? target.doctorId;
  if (nextRole === "DOCTOR" || nextRole === "CLINICAL_LEAD") {
    doctorId = await ensureClinicianPanel({
      role: nextRole,
      name: patch.name?.trim() || target.name,
      email: target.email,
      doctorId,
      specialization: patch.specialization,
      createPanel: patch.createPanel,
    });
  }
  if (nextRole === "PATIENT" || nextRole === "ADMIN") {
    doctorId = undefined;
  }

  let passwordHash = target.password;
  if (patch.password?.trim()) {
    if (patch.password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    passwordHash = await hash(patch.password.trim(), 10);
  }

  const updated: DemoUser = {
    ...target,
    name: patch.name?.trim() || target.name,
    role: nextRole,
    isActive: patch.isActive ?? target.isActive,
    accessStatus,
    doctorId,
    password: passwordHash,
    grantedPermissions:
      patch.grantedPermissions ?? target.grantedPermissions ?? [],
  };

  if (
    updated.isActive &&
    (!updated.grantedPermissions || updated.grantedPermissions.length === 0)
  ) {
    updated.grantedPermissions = permissionsForRole(updated.role);
  }

  const list = memory();
  const idx = list.findIndex((u) => u.id === id || u.email === target.email);
  if (idx >= 0) list[idx] = updated;
  else list.unshift(updated);

  const cookieList = await readCookieUsers();
  const merged = [
    updated,
    ...cookieList.filter(
      (u) =>
        u.id !== id && u.email.toLowerCase() !== target.email.toLowerCase()
    ),
  ].slice(0, MAX);
  await writeCookieUsers(merged);

  return updated;
}

export function effectivePermissions(user: DemoUser): string[] {
  if (!user.isActive) return [];
  if (user.grantedPermissions?.length) return user.grantedPermissions;
  return permissionsForRole(user.role);
}

export async function resolveClinicianDoctorId(
  email?: string | null
): Promise<string | null> {
  if (!email) return null;
  const user = await findManagedUser(email);
  if (user?.doctorId) return user.doctorId;
  const e = email.toLowerCase();
  if (e === "doctor@test.com") return "doc_01";
  if (e === "lead@test.com") return "doc_lead";
  return null;
}

export async function listAssignableDoctorPanels() {
  return listPanelsForAdmin();
}
