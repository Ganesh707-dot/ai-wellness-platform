"use client";

import { useRbac } from "@/hooks/use-rbac";

export function RbacSessionBadge({
  className = "",
}: {
  className?: string;
}) {
  const { role, tier, permissions, meta, isActive } = useRbac();
  if (!role) return null;
  return (
    <div
      className={`rounded-2xl border border-teal-900/10 bg-white px-4 py-3 text-xs ${className}`}
    >
      <p className="font-semibold uppercase tracking-[0.16em] text-teal-800">
        RBAC session
      </p>
      <p className="mt-1 text-sm font-medium text-stone-900">
        {meta?.label || role}
        {tier !== "NONE" ? ` · ${tier}` : ""}
      </p>
      <p className="mt-1 text-stone-500">
        {permissions.length} permissions ·{" "}
        <span className={isActive ? "text-teal-800" : "text-amber-700"}>
          {isActive ? "Active" : "Suspended"}
        </span>
      </p>
    </div>
  );
}
