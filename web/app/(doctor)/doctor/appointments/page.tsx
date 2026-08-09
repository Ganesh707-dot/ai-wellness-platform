"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";
import { decideAppointmentAction } from "@/actions/appointment-actions";
import { useClinicBoardSync } from "@/hooks/use-clinic-board-sync";
import { upsertClinicBoard } from "@/lib/clinic-board";

interface AppointmentDoctor {
  id: string;
  patientName: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  concern: string;
  chiefComplaint?: string;
  aiSpecialty?: string;
  aiPathway?: string;
  doctorBrief?: string;
  aiInsights?: string[];
  priorityBand?: string;
  intentLabel?: string;
  intentScore?: number;
  aiModel?: string;
  source?: string;
  meetingCode?: string;
  videoCallUrl?: string;
  decidedBy?: string;
  decisionNote?: string;
}

export default function DoctorAppointmentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("inbox");
  const [pendingCount, setPendingCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [panelHint, setPanelHint] = useState<string | null>(null);
  const boardReady = useClinicBoardSync();

  const load = () => {
    fetch("/api/doctor/appointments?pageSize=50")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(
          Array.isArray(data.appointments) ? data.appointments : []
        );
        setPendingCount(data.pagination?.pendingCount || 0);
        if (data.pagination?.visibility === "own_panel_only") {
          setPanelHint(
            `Privacy: fresher panel only (${data.pagination.panelDoctorId || "doc_01"}). Book Dr. Meera Sharma to appear here. Lead sees clinic-wide.`
          );
        } else {
          setPanelHint(
            "Clinical lead oversight: you can see clinic-wide live requests."
          );
        }
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !boardReady) return;
    load();
  }, [status, boardReady]);

  const filtered = useMemo(() => {
    if (filter === "inbox") {
      return appointments.filter((a) => a.status === "PENDING_REVIEW");
    }
    if (filter === "live") {
      return appointments.filter((a) => a.source === "live-booking");
    }
    if (filter === "all") return appointments;
    return appointments.filter(
      (a) => (a.status || "").toLowerCase() === filter.toLowerCase()
    );
  }, [appointments, filter]);

  const onDecide = (id: string, decision: "accept" | "decline") => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await decideAppointmentAction(id, decision);
      setBusyId(null);
      if (!res.success) {
        setError(res.error || "Decision failed");
        return;
      }
      if (res.appointment) {
        upsertClinicBoard(res.appointment as never);
      }
      // Optimistic UI so Accept doesn't look pending before reload
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status:
                  decision === "accept" ? "CONFIRMED" : "DECLINED",
                ...(res.appointment || {}),
              }
            : a
        )
      );
      load();
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <RoleShell role="DOCTOR" title="Clinic schedule">
      <p className="mb-4 text-sm text-stone-600">
        Live intake queue: patient request → AI intent triage →{" "}
        <strong>you accept or decline</strong>. Only accepted slots become
        confirmed telehealth encounters.
      </p>
      {panelHint && (
        <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900 ring-1 ring-teal-100">
          {panelHint}
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: "inbox", label: `Inbox (${pendingCount})` },
          { id: "live", label: "Live intake" },
          { id: "CONFIRMED", label: "Confirmed" },
          { id: "DECLINED", label: "Declined" },
          { id: "all", label: "All" },
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
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-600">
          {filter === "inbox"
            ? "Inbox empty — book as patient@test.com to generate a live request."
            : "No appointments in this filter."}
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((apt) => {
            const why = apt.chiefComplaint || apt.concern;
            const isPending = apt.status === "PENDING_REVIEW";
            const band = apt.priorityBand || "ROUTINE";
            return (
              <Card key={apt.id} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-stone-900">
                        {apt.patientName}
                      </h3>
                      {apt.source === "live-booking" && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 ring-1 ring-amber-200">
                          Live request
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                          band === "CRITICAL"
                            ? "bg-red-50 text-red-800 ring-red-200"
                            : band === "HIGH"
                              ? "bg-orange-50 text-orange-800 ring-orange-200"
                              : "bg-stone-50 text-stone-700 ring-stone-200"
                        }`}
                      >
                        AI {band}
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-wide text-teal-800">
                      {(apt.consultationType || "").replaceAll("_", " ")}
                      {apt.aiSpecialty ? ` · AI → ${apt.aiSpecialty}` : ""}
                      {apt.intentLabel
                        ? ` · intent ${apt.intentLabel}${
                            apt.intentScore
                              ? ` (${apt.intentScore.toFixed(1)})`
                              : ""
                          }`
                        : ""}
                    </p>

                    <div className="mt-3 rounded-xl bg-[#f3f7f4] p-3 ring-1 ring-teal-900/10">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
                        Why patient contacted
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {why}
                      </p>
                      {apt.doctorBrief && (
                        <p className="mt-2 text-xs text-stone-600">
                          {apt.doctorBrief}
                        </p>
                      )}
                      {apt.aiInsights && apt.aiInsights.length > 0 && (
                        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-stone-600">
                          {apt.aiInsights.slice(0, 3).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      )}
                      {apt.aiModel && (
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-stone-400">
                          CDS · {apt.aiModel}
                        </p>
                      )}
                    </div>
                    {apt.decisionNote && (
                      <p className="mt-2 text-xs text-stone-500">
                        Decision: {apt.decisionNote}
                        {apt.decidedBy ? ` · ${apt.decidedBy}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 text-sm lg:items-end">
                    <p className="font-medium text-stone-900">
                      {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="text-xs font-semibold text-teal-900">
                      {apt.status}
                    </p>

                    {isPending && apt.source === "live-booking" ? (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          size="sm"
                          disabled={pending && busyId === apt.id}
                          onClick={() => onDecide(apt.id, "accept")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending && busyId === apt.id}
                          onClick={() => onDecide(apt.id, "decline")}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      apt.status === "CONFIRMED" && (
                        <Button asChild size="sm">
                          <Link href={`/doctor/encounters/${apt.id}`}>
                            Open encounter
                          </Link>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </RoleShell>
  );
}
