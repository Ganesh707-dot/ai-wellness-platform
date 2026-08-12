"use server";

import { signOut } from "@/auth";
import { findDemoUser, isDemoMode } from "@/lib/demo-data";
import { createManagedUser, findManagedUser } from "@/lib/user-store";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation";

/** Kept for compatibility — login UI uses next-auth/react signIn */
export async function loginAction(input: LoginInput) {
  const validated = loginSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: "Invalid email or password" };
  }
  const user =
    (await findManagedUser(validated.data.email)) ||
    findDemoUser(validated.data.email);
  if (!user) {
    return {
      success: false,
      error: "Account not found. Register or use a demo login.",
    };
  }
  return {
    success: true,
    message: "Use the Sign in button on /login",
    role: user.role,
  };
}

export async function registerAction(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid registration",
    };
  }

  try {
    if (isDemoMode()) {
      const { user, tempPassword } = await createManagedUser({
        name: parsed.data.name,
        email: parsed.data.email,
        role: "PATIENT",
        password: parsed.data.password,
      });
      return {
        success: true,
        message: `Account created for ${user.email} as Pending. An admin must activate it and grant permissions before you can sign in.`,
        email: user.email,
        tempPassword,
        isActive: false,
        accessStatus: "pending",
      };
    }

    const { dbCreateUser } = await import("@/lib/db-api");
    const existing = await (await import("@/lib/db")).db.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return { success: false, error: "Email already registered" };
    }
    await dbCreateUser({
      name: parsed.data.name,
      email: parsed.data.email,
      role: "PATIENT",
      password: parsed.data.password,
      isActive: false,
    });
    return {
      success: true,
      message: `Account created for ${parsed.data.email}. An admin must activate it before you can sign in.`,
      email: parsed.data.email,
      isActive: false,
      accessStatus: "pending",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

export async function doctorRegistrationAction(_input?: unknown) {
  return {
    success: false,
    error: "Clinician accounts are provisioned by an ADMIN in User administration.",
  };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(_email?: string) {
  return {
    success: true as const,
    message: "Demo mode: use password123 for seeded accounts, or your admin-issued temp password.",
    error: undefined as string | undefined,
  };
}

export async function resetPasswordAction() {
  return { success: false, error: "Not available in demo mode" };
}
