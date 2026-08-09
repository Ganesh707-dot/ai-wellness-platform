"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useRbac } from "@/hooks/use-rbac";

const LINKS = {
  PATIENT: [
    { href: "/dashboard", label: "Overview", perm: "portal:patient" as const },
    {
      href: "/dashboard/appointments",
      label: "Appointments",
      perm: "appointments:read_own" as const,
    },
    {
      href: "/dashboard/prescriptions",
      label: "Prescriptions",
      perm: "prescriptions:read_own" as const,
    },
    {
      href: "/book-appointment",
      label: "Book",
      perm: "appointments:write_own" as const,
    },
    {
      href: "/ai/concierge",
      label: "Symptom Navigator",
      perm: "cds:patient_navigator" as const,
    },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Overview", perm: "portal:clinician" as const },
    {
      href: "/doctor/appointments",
      label: "Schedule",
      perm: "appointments:read_panel" as const,
    },
    {
      href: "/doctor/patients",
      label: "Patient panel",
      perm: "patients:read_panel" as const,
    },
    {
      href: "/doctor/copilot",
      label: "Encounter CDS",
      perm: "cds:encounter" as const,
    },
  ],
  CLINICAL_LEAD: [
    { href: "/doctor", label: "Overview", perm: "portal:clinician" as const },
    {
      href: "/doctor/appointments",
      label: "Schedule",
      perm: "appointments:read_panel" as const,
    },
    {
      href: "/doctor/patients",
      label: "Patient panel",
      perm: "patients:read_panel" as const,
    },
    {
      href: "/doctor/copilot",
      label: "Encounter CDS",
      perm: "cds:encounter" as const,
    },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", perm: "portal:admin" as const },
    { href: "/admin/users", label: "User admin", perm: "users:read" as const },
    {
      href: "/admin/care-bi",
      label: "Care BI",
      perm: "analytics:ops" as const,
    },
    { href: "/admin/rbac", label: "RBAC", perm: "rbac:read" as const },
    {
      href: "/admin/appointments",
      label: "Encounters",
      perm: "appointments:manage_all" as const,
    },
  ],
} as const;

type ShellRole = keyof typeof LINKS;

export function RoleShell({
  role,
  title,
  children,
}: {
  role: ShellRole;
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { can, role: sessionRole, tier } = useRbac();
  const effectiveRole: ShellRole =
    sessionRole === "CLINICAL_LEAD"
      ? "CLINICAL_LEAD"
      : sessionRole && sessionRole in LINKS
        ? (sessionRole as ShellRole)
        : role;
  const links = LINKS[effectiveRole] || LINKS[role as ShellRole];

  const eyebrow =
    effectiveRole === "PATIENT"
      ? "Patient portal · RBAC"
      : effectiveRole === "CLINICAL_LEAD"
        ? "Clinical lead studio · RBAC"
        : effectiveRole === "DOCTOR"
          ? `Clinician studio · ${tier} · RBAC`
          : "Enterprise control plane · RBAC";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-stone-900">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links
            .filter((l) => can(l.perm))
            .map((l) => {
              const active =
                pathname === l.href ||
                (l.href !== "/dashboard" &&
                  l.href !== "/doctor" &&
                  l.href !== "/admin" &&
                  pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-teal-900 text-white"
                      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-teal-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
        </nav>
      </div>
      {children}
    </div>
  );
}
