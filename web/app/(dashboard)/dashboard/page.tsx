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

interface PatientStats {
  upcomingAppointments: number;
  activePrescriptions: number;
  medicalReports: number;
  doctorRating: number;
}

export default function PatientDashboard() {
  const router = useRouter();
  const { status, session, can, role } = useRbac();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !can("portal:patient")) {
      router.push("/unauthorized");
    }
  }, [status, can, router]);

  useEffect(() => {
    if (status !== "authenticated" || !can("portal:patient")) return;
    fetch("/api/patient/dashboard-stats")
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
    <RoleShell
      role="PATIENT"
      title={`Welcome, ${session?.user?.name || "Patient"}`}
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl bg-[linear-gradient(135deg,#115e59,#134e4a_55%,#1c1917)] p-6 text-white sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-100">
            Patient portal
          </p>
          <p className="mt-2 text-teal-50/90">
            Book, track care, and use Symptom Navigator — gated by your RBAC
            permissions ({role}).
          </p>
        </div>
        <RbacSessionBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Upcoming", stats?.upcomingAppointments ?? 0],
          ["Active Rx", stats?.activePrescriptions ?? 0],
          ["Reports", stats?.medicalReports ?? 0],
          ["Care rating", stats?.doctorRating ?? "—"],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs uppercase text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {can("appointments:write_own") && (
          <Button asChild>
            <Link href="/book-appointment">Book consult</Link>
          </Button>
        )}
        {can("cds:patient_navigator") && (
          <Button asChild variant="outline">
            <Link href="/ai/concierge">Symptom Navigator</Link>
          </Button>
        )}
        {can("appointments:read_own") && (
          <Button asChild variant="outline">
            <Link href="/dashboard/appointments">Appointments</Link>
          </Button>
        )}
      </div>
    </RoleShell>
  );
}
