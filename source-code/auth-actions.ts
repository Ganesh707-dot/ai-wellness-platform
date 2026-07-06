"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  doctorRegistrationSchema,
  type LoginInput,
  type RegisterInput,
  type DoctorRegistrationInput,
} from "@/lib/validation";

export async function loginAction(input: LoginInput) {
  try {
    const validated = loginSchema.parse(input);

    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        error: result.error || "Login failed",
      };
    }

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred",
    };
  }
}

export async function registerAction(input: RegisterInput) {
  try {
    const validated = registerSchema.parse(input);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email already registered",
      };
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
      },
    });

    // Create patient profile if role is PATIENT
    if (validated.role === "PATIENT") {
      await db.patientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return {
      success: true,
      message: "Registration successful",
      userId: user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
}

export async function doctorRegistrationAction(
  input: DoctorRegistrationInput
) {
  try {
    const validated = doctorRegistrationSchema.parse(input);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email already registered",
      };
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: "DOCTOR",
      },
    });

    // Create doctor profile
    await db.doctorProfile.create({
      data: {
        userId: user.id,
        specialization: validated.specialization,
        licenseNumber: validated.licenseNumber,
        qualifications: validated.qualifications.split(",").map((q) => q.trim()),
        experience: validated.experience,
        consultationFee: validated.consultationFee,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });

    return {
      success: true,
      message: "Doctor registration successful. Pending verification.",
      userId: user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Doctor registration failed",
    };
  }
}

export async function logoutAction() {
  try {
    await signOut({ redirect: false });
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Logout failed",
    };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: "If email exists, reset link has been sent",
      };
    }

    // TODO: Generate reset token and send email via Resend
    // For now, just return success

    return {
      success: true,
      message: "Password reset link sent to your email",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred",
    };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
) {
  try {
    // TODO: Verify token and update password
    // For now, just return error

    return {
      success: false,
      error: "Token verification not implemented",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Password reset failed",
    };
  }
}
