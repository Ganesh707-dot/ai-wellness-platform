"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

interface Rx {
  id: string;
  medicine: string;
  potency?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
  doctorName: string;
  issuedAt: string;
}

export default function PatientPrescriptionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/patient/prescriptions")
      .then((r) => r.json())
      .then((data) =>
        setItems(Array.isArray(data.prescriptions) ? data.prescriptions : [])
      )
      .catch(() => setItems([]))
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
    <RoleShell role="PATIENT" title="Prescriptions">
      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-600">
          No prescriptions yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((rx) => (
            <Card key={rx.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {rx.medicine}
                    {rx.potency ? ` · ${rx.potency}` : ""}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {rx.dosage} · {rx.frequency} · {rx.duration}
                  </p>
                  {rx.instructions && (
                    <p className="mt-2 text-sm text-stone-500">{rx.instructions}</p>
                  )}
                </div>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">
                  {rx.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Issued by {rx.doctorName} ·{" "}
                {new Date(rx.issuedAt).toLocaleDateString("en-IN")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </RoleShell>
  );
}
