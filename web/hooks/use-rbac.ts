"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  permissionsForRole,
  clinicianTierFor,
  ROLE_META,
  sessionHasPermission,
  type Permission,
  type AppRole,
} from "@/lib/rbac";

export function useRbac() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role as
    | AppRole
    | undefined;

  const permissions = useMemo(() => {
    const fromSession = (
      session?.user as { permissions?: string[] } | undefined
    )?.permissions;
    return fromSession?.length ? fromSession : permissionsForRole(role);
  }, [session, role]);

  const tier = useMemo(
    () =>
      (session?.user as { clinicianTier?: string } | undefined)?.clinicianTier ||
      clinicianTierFor(role),
    [session, role]
  );

  const meta = role ? ROLE_META[role] : null;
  const isActive =
    (session?.user as { isActive?: boolean } | undefined)?.isActive !== false;

  const can = useCallback(
    (p: Permission) => sessionHasPermission(role, p, permissions),
    [role, permissions]
  );

  return {
    status,
    session,
    role,
    permissions,
    tier,
    meta,
    can,
    isActive,
  };
}
