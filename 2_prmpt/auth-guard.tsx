"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface ProtectedProps {
  children: ReactNode;
  requiredRole?: string | string[];
  fallback?: ReactNode;
}

export function Protected({
  children,
  requiredRole,
  fallback,
}: ProtectedProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return fallback || <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (requiredRole) {
    const userRole = (session?.user as any)?.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(userRole)) {
      router.push("/unauthorized");
      return null;
    }
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return fallback || <LoadingSpinner />;
  }

  const userRole = (session?.user as any)?.role;

  if (!roles.includes(userRole)) {
    return fallback || null;
  }

  return <>{children}</>;
}
