"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";
import { useRbac } from "@/hooks/use-rbac";
import { RbacSessionBadge } from "@/components/common/rbac-session-badge";

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingVerification: number;
  systemHealth: number;
  aiTriageRuns?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { status, can, permissions } = useRbac();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !can("portal:admin")) {
      router.push("/unauthorized");
    }
  }, [status, can, router]);

  useEffect(() => {
    if (status !== "authenticated" || !can("analytics:ops")) {
      if (status === "authenticated") setLoading(false);
      return;
    }
    fetch("/api/admin/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [status, can]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <RoleShell role="ADMIN" title="Platform control plane">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="border-0 bg-[#0f3d38] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
            IAM · RBAC · Ops
          </p>
          <p className="mt-2 text-sm text-teal-50/90">
            Provision users as Pending, then activate with explicit role
            permissions. {permissions.length} permissions on this session.
          </p>
        </Card>
        <RbacSessionBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", stats?.totalUsers?.toLocaleString()],
          ["Patients", stats?.totalPatients?.toLocaleString()],
          ["Clinicians", stats?.totalDoctors?.toLocaleString()],
          ["Encounters", stats?.totalAppointments?.toLocaleString()],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs uppercase text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value ?? 0}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase text-stone-500">Pending verify</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">
            {stats?.pendingVerification ?? 0}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase text-stone-500">Health</p>
          <p className="mt-2 text-3xl font-semibold text-teal-800">
            {stats?.systemHealth ?? 100}%
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase text-stone-500">CDS assists</p>
          <p className="mt-2 text-3xl font-semibold">
            {stats?.aiTriageRuns?.toLocaleString() ?? 0}
          </p>
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {can("analytics:ops") && (
          <Button asChild>
            <Link href="/admin/care-bi">Care intelligence (BI)</Link>
          </Button>
        )}
        {can("users:read") && (
          <Button asChild variant="outline">
            <Link href="/admin/users">User administration</Link>
          </Button>
        )}
        {can("rbac:read") && (
          <Button asChild variant="outline">
            <Link href="/admin/rbac">RBAC matrix</Link>
          </Button>
        )}
        {can("appointments:manage_all") && (
          <Button asChild variant="outline">
            <Link href="/admin/appointments">Encounters</Link>
          </Button>
        )}
      </div>
    </RoleShell>
  );
}
