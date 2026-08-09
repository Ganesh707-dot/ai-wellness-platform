import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";
      isActive?: boolean;
      permissions?: string[];
      clinicianTier?: "JUNIOR" | "STANDARD" | "LEAD" | "NONE";
      doctorId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";
    isActive?: boolean;
    permissions?: string[];
    doctorId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "PATIENT" | "DOCTOR" | "CLINICAL_LEAD" | "ADMIN";
    isActive?: boolean;
    provider?: string;
    permissions?: string[];
    clinicianTier?: "JUNIOR" | "STANDARD" | "LEAD" | "NONE";
    doctorId?: string;
  }
}
