"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

interface Apt {
  id: string;
  patientName: string;
  doctorName: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
}

export default function AdminAppointmentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/appointments?pageSize=40")
      .then((r) => r.json())
      .then((data) =>
        setAppointments(Array.isArray(data.appointments) ? data.appointments : [])
      )
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <RoleShell role="ADMIN" title="Encounter ops">
      <div className="grid gap-3">
        {appointments.map((a) => (
          <Card key={a.id} className="p-4 text-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <p className="font-semibold text-stone-900">
                  {a.patientName} → {a.doctorName}
                </p>
                <p className="text-xs uppercase text-teal-800">
                  {(a.consultationType || "").replaceAll("_", " ")}
                </p>
              </div>
              <div className="sm:text-right">
                <p>
                  {new Date(a.scheduledAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-xs font-semibold text-teal-900">{a.status}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </RoleShell>
  );
}
