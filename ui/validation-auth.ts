import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["PATIENT", "DOCTOR"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const doctorRegistrationSchema = registerSchema.extend({
  specialization: z.enum([
    "HOMEOPATHY",
    "PEDIATRICS",
    "FERTILITY",
    "WOMENS_WELLNESS",
    "EMOTIONAL_WELLNESS",
    "FAMILY_WELLNESS",
    "PREVENTIVE_CARE",
  ]),
  licenseNumber: z.string().min(5, "Invalid license number"),
  qualifications: z.string().min(10, "Describe your qualifications"),
  experience: z.coerce.number().min(1, "Experience must be at least 1 year"),
  consultationFee: z.coerce.number().min(0, "Invalid fee"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DoctorRegistrationInput = z.infer<typeof doctorRegistrationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
