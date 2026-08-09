"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";
import { useClinicBoardSync } from "@/hooks/use-clinic-board-sync";

interface Appointment {
  id: string;
  doctorName: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  concern: string;
  chiefComplaint?: string;
  aiSpecialty?: string;
  aiPathway?: string;
  aiFirstAid?: string[];
  priorityBand?: string;
  source?: string;
  videoCallUrl?: string;
  decisionNote?: string;
  decidedBy?: string;
}

function statusTone(status: string) {
  if (status === "PENDING_REVIEW")
    return "bg-amber-50 text-amber-900 ring-amber-200";
  if (status === "CONFIRMED")
    return "bg-teal-50 text-teal-900 ring-teal-200";
  if (status === "DECLINED")
    return "bg-red-50 text-red-800 ring-red-200";
  return "bg-stone-50 text-stone-700 ring-stone-200";
}

export default function PatientAppointmentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const boardReady = useClinicBoardSync();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !boardReady) return;
    fetch("/api/patient/appointments")
      .then((r) => r.json())
      .then((data) =>
        setAppointments(
          Array.isArray(data.appointments) ? data.appointments : []
        )
      )
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [status, boardReady]);

  const filtered = useMemo(() => {
    if (filter === "all") return appointments;
    if (filter === "awaiting") {
      return appointments.filter((a) => a.status === "PENDING_REVIEW");
    }
    if (filter === "upcoming") {
      return appointments.filter((a) =>
        ["SCHEDULED", "CONFIRMED"].includes(a.status)
      );
    }
    return appointments.filter(
      (a) => (a.status || "").toLowerCase() === filter.toLowerCase()
    );
  }, [appointments, filter]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <RoleShell role="PATIENT" title="My appointments">
      <p className="mb-4 text-sm text-stone-600">
        Requests stay <strong>Pending review</strong> until a clinician accepts.
        AI specialty routing and first-aid are attached at booking time.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "awaiting", label: "Awaiting clinician" },
          { id: "upcoming", label: "Confirmed" },
          { id: "DECLINED", label: "Declined" },
          { id: "COMPLETED", label: "Completed" },
        ].map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
        <Button asChild size="sm" variant="outline">
          <Link href="/book-appointment">Book new</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/ai/concierge">Symptom Navigator</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-600">
          No appointments here yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((apt) => (
            <Card key={apt.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{apt.doctorName}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${statusTone(
                        apt.status
                      )}`}
                    >
                      {apt.status === "PENDING_REVIEW"
                        ? "Awaiting clinician"
                        : apt.status}
                    </span>
                    {apt.priorityBand && apt.source === "live-booking" && (
                      <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-600 ring-1 ring-stone-200">
                        AI {apt.priorityBand}
                      </span>
                    )}
                  </div>
                  <p className="text-xs uppercase text-teal-800">
                    {(apt.consultationType || "").replaceAll("_", " ")}
                    {apt.aiSpecialty ? ` · routed via ${apt.aiSpecialty}` : ""}
                  </p>
                  <div className="mt-3 rounded-xl bg-[#f3f7f4] p-3 text-sm ring-1 ring-stone-200/80">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                      Your concern
                    </p>
                    <p className="mt-1 font-medium text-stone-900">
                      {apt.chiefComplaint || apt.concern}
                    </p>
                    {apt.aiPathway && (
                      <p className="mt-1 text-xs text-stone-500">
                        Care path: {apt.aiPathway}
                      </p>
                    )}
                  </div>
                  {apt.aiFirstAid && apt.aiFirstAid.length > 0 && (
                    <ol className="mt-2 list-decimal pl-5 text-xs text-stone-600">
                      {apt.aiFirstAid.slice(0, 2).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {apt.decisionNote && (
                    <p className="mt-2 text-xs text-stone-500">
                      {apt.decisionNote}
                      {apt.decidedBy ? ` · ${apt.decidedBy}` : ""}
                    </p>
                  )}
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-medium">
                    {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {apt.status === "CONFIRMED" && apt.videoCallUrl && (
                    <Button asChild size="sm" className="mt-2" variant="outline">
                      <a
                        href={apt.videoCallUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join video
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </RoleShell>
  );
}
