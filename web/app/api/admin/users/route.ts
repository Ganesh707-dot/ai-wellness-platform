import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  activateManagedUser,
  createManagedUser,
  listAssignableDoctorPanels,
  listManagedUsers,
  updateManagedUser,
} from "@/lib/user-store";
import { CLINICIAN_SPECIALTIES } from "@/lib/doctor-panel-store";
import {
  denyUnlessPermission,
  permissionsForRole,
  PERMISSION_CATALOG,
  ROLE_POLICY,
  type AppRole,
} from "@/lib/rbac";

async function requirePerm(
  permission: "users:read" | "users:write" | "users:suspend"
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const gate = denyUnlessPermission(role, permission);
  if (gate.ok === false) {
    return {
      error: NextResponse.json(
        { error: gate.error },
        { status: gate.status }
      ),
    };
  }
  return { session };
}

export async function GET() {
  const gate = await requirePerm("users:read");
  if (gate.error) return gate.error;

  const users = await listManagedUsers();
  const doctorPanels = await listAssignableDoctorPanels();
  return NextResponse.json({
    users: users.map(({ password: _p, ...u }) => u),
    total: users.length,
    pendingCount: users.filter(
      (u) => !u.isActive || u.accessStatus === "pending"
    ).length,
    doctorPanels,
    specialties: CLINICIAN_SPECIALTIES,
    rolePermissionPresets: Object.fromEntries(
      (Object.keys(ROLE_POLICY) as AppRole[]).map((role) => [
        role,
        permissionsForRole(role).map((id) => ({
          id,
          ...PERMISSION_CATALOG[id],
        })),
      ])
    ),
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  role: z.enum(["PATIENT", "DOCTOR", "CLINICAL_LEAD", "ADMIN"]),
  password: z.string().min(6).max(72).optional(),
  doctorId: z.string().min(3).max(40).optional(),
  specialization: z.string().min(3).max(40).optional(),
  createPanel: z.boolean().optional(),
});

export async function POST(request: Request) {
  const gate = await requirePerm("users:write");
  if (gate.error) return gate.error;

  try {
    const body = createSchema.parse(await request.json());
    const { user, tempPassword } = await createManagedUser(body);
    const { password: _p, ...safe } = user;
    return NextResponse.json({
      success: true,
      user: safe,
      tempPassword,
      isActive: false,
      accessStatus: "pending",
      message: safe.doctorId
        ? `Pending user created with panel ${safe.doctorId}. Activate to allow sign-in.`
        : "User created as Pending. Activate before sign-in.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Create failed",
      },
      { status: 400 }
    );
  }
}

const patchSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["PATIENT", "DOCTOR", "CLINICAL_LEAD", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  accessStatus: z.enum(["pending", "active", "suspended"]).optional(),
  grantedPermissions: z.array(z.string()).optional(),
  doctorId: z.string().min(3).max(40).optional().nullable(),
  password: z.string().min(6).max(72).optional(),
  specialization: z.string().min(3).max(40).optional(),
  createPanel: z.boolean().optional(),
  activate: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  /** Default true when activating — grants full role preset */
  useFullRoleAccess: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const gate = await requirePerm("users:write");
  if (gate.error) return gate.error;

  try {
    const body = patchSchema.parse(await request.json());

    if (body.activate) {
      if (!body.role) {
        return NextResponse.json(
          { success: false, error: "Role is required to activate" },
          { status: 400 }
        );
      }
      const perms = body.permissions || body.grantedPermissions || [];
      const updated = await activateManagedUser({
        id: body.id,
        role: body.role,
        permissions: perms,
        doctorId: body.doctorId || undefined,
        specialization: body.specialization,
        createPanel: body.createPanel,
        useFullRoleAccess: body.useFullRoleAccess,
      });
      const { password: _p, ...safe } = updated;
      return NextResponse.json({
        success: true,
        user: safe,
        message: `Activated ${safe.email}${
          safe.doctorId ? ` · panel ${safe.doctorId}` : ""
        }. They must sign out and sign in again for access to apply.`,
      });
    }

    const {
      id,
      activate: _a,
      permissions: _perms,
      useFullRoleAccess: _full,
      doctorId,
      ...rest
    } = body;

    const patch = {
      ...rest,
      doctorId: doctorId === null ? undefined : doctorId,
    };

    if (patch.isActive === false) {
      patch.accessStatus = patch.accessStatus || "suspended";
      patch.grantedPermissions = [];
    }

    const updated = await updateManagedUser(id, patch);
    const { password: _p, ...safe } = updated;
    return NextResponse.json({
      success: true,
      user: safe,
      message: patch.password
        ? `Updated ${safe.email} (password reset).`
        : `Updated ${safe.email}${
            safe.doctorId ? ` · panel ${safe.doctorId}` : ""
          }.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 400 }
    );
  }
}
