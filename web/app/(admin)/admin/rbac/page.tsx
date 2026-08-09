"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type RoleRow = {
  role: string;
  label: string;
  blurb: string;
  home: string;
  permissions: string[];
  clinicianTier: string;
};

type MatrixRow = {
  permission: string;
  grants: Record<string, boolean>;
};

type Audit = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

const PORTAL_KEYS: Record<string, string> = {
  PATIENT: "portal:patient",
  DOCTOR: "portal:clinician",
  CLINICAL_LEAD: "portal:clinician",
  ADMIN: "portal:admin",
};

export default function AdminRbacPage() {
  const { status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [policyVersion, setPolicyVersion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/rbac")
      .then((r) => r.json())
      .then((d) => {
        setRoles(d.roles || []);
        setMatrix(d.matrix || []);
        setAudit(d.audit || []);
        setPolicyVersion(d.policyVersion || "");
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const roleKeys = roles.map((r) => r.role);

  return (
    <RoleShell role="ADMIN" title="Access control (RBAC)">
      <div className="mb-6 rounded-2xl bg-[#0f3d38] p-5 text-white shadow-lg sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100">
          How access works
        </p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
          Role → permissions → portal
        </h2>
        <ol className="mt-4 grid gap-3 text-sm text-teal-50/95 sm:grid-cols-3">
          <li className="rounded-xl bg-white/10 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-100">
              1. Assign role
            </span>
            <p className="mt-1">
              Admin → Users → Activate. DOCTOR opens clinician portal; PATIENT
              opens patient dashboard.
            </p>
          </li>
          <li className="rounded-xl bg-white/10 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-100">
              2. Grant access
            </span>
            <p className="mt-1">
              Leave <strong>Full DOCTOR access</strong> checked — that includes{" "}
              <code className="text-teal-100">portal:clinician</code>. Empty
              permissions = Access Denied.
            </p>
          </li>
          <li className="rounded-xl bg-white/10 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-100">
              3. Link specialty panel
            </span>
            <p className="mt-1">
              Link Ganesh / Ananya / any live panel. Bookings for that panel
              only hit that clinician’s inbox.
            </p>
          </li>
        </ol>
        <p className="mt-4 text-xs text-teal-100/80">
          After any change the user must <strong>sign out and sign in
          again</strong> — permissions live in the login session. Policy{" "}
          <code className="rounded bg-black/20 px-1">{policyVersion}</code>
        </p>
        <Button asChild className="mt-4 bg-white text-teal-950 hover:bg-teal-50">
          <Link href="/admin/users">Go to Users → Activate &amp; grant access</Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {roles.map((r) => {
          const portal = PORTAL_KEYS[r.role] || "—";
          return (
            <Card key={r.role} className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
                {r.role}
                {r.clinicianTier !== "NONE" ? ` · ${r.clinicianTier}` : ""}
              </p>
              <h3 className="mt-1 font-semibold text-stone-900">{r.label}</h3>
              <p className="mt-1 text-xs text-stone-600">{r.blurb}</p>
              <p className="mt-3 rounded-lg bg-teal-50 px-2 py-1.5 font-mono text-[11px] text-teal-900">
                Must have: {portal}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                {r.permissions.length} permissions · home {r.home}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6 overflow-x-auto p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
          Permission matrix
        </p>
        <p className="mb-3 text-xs text-stone-500">
          ✓ = this role’s preset includes the permission. Custom grants are set
          per user on the Users page.
        </p>
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="py-2 pr-3 font-medium">Permission</th>
              {roleKeys.map((rk) => (
                <th key={rk} className="px-2 py-2 font-medium">
                  {rk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => {
              const isPortal = row.permission.startsWith("portal:");
              return (
                <tr
                  key={row.permission}
                  className={`border-b border-stone-100 ${
                    isPortal ? "bg-teal-50/40" : ""
                  }`}
                >
                  <td className="py-2 pr-3 font-mono text-[11px] text-stone-800">
                    {row.permission}
                    {isPortal && (
                      <span className="ml-2 rounded-full bg-teal-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        portal key
                      </span>
                    )}
                  </td>
                  {roleKeys.map((rk) => (
                    <td key={rk} className="px-2 py-2 text-center">
                      {row.grants[rk] ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-900">
                          ✓
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
          Recent audit events
        </p>
        <div className="space-y-3">
          {audit.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-1 border-b border-stone-100 pb-3 text-sm last:border-0 sm:flex-row sm:justify-between"
            >
              <div>
                <p className="font-medium text-stone-900">{a.detail}</p>
                <p className="text-xs text-stone-500">
                  {a.actor} · <span className="font-mono">{a.action}</span>
                </p>
              </div>
              <p className="text-xs text-stone-500">
                {new Date(a.at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </RoleShell>
  );
}
