"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { upsertClinicBoard } from "@/lib/clinic-board";
import { STORAGE_KEYS } from "@/lib/storage-keys";

interface AppointmentConfirmed {
  id: string;
  doctorName: string;
  doctorId?: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  videoCallUrl: string;
  meetingCode: string;
  concern?: string;
  chiefComplaint?: string;
  aiSpecialty?: string;
  aiPathway?: string;
  aiFirstAid?: string[];
  priorityBand?: string;
  doctorBrief?: string;
}

export default function AppointmentConfirmedPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  const [appointment, setAppointment] = useState<AppointmentConfirmed | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    (async () => {
      // 1) Same-tab handoff (survives cookie/serverless gaps)
      try {
        const cached =
          sessionStorage.getItem(
            STORAGE_KEYS.appointmentCache(appointmentId)
          ) ||
          sessionStorage.getItem(
            STORAGE_KEYS.legacyAppointmentCache(appointmentId)
          );
        if (cached) {
          const parsed = JSON.parse(cached) as AppointmentConfirmed;
          if (!cancelled) {
            setAppointment(parsed);
            upsertClinicBoard(parsed as never);
            setLoading(false);
          }
        }
      } catch {
        /* ignore */
      }

      // 2) Server cookie / shared store
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`);
        if (res.ok) {
          const data = (await res.json()) as AppointmentConfirmed;
          if (!cancelled) {
            setAppointment(data);
            upsertClinicBoard(data as never);
            sessionStorage.setItem(
              STORAGE_KEYS.appointmentCache(appointmentId),
              JSON.stringify(data)
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-stone-900">Request not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          The booking handoff expired in this browser tab. Submit the request
          again and keep this tab open.
        </p>
        <Button asChild className="mt-6">
          <Link href="/book-appointment">Book again</Link>
        </Button>
      </div>
    );
  }

  const when = new Date(appointment.scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const why = appointment.chiefComplaint || appointment.concern || "—";
  const awaiting = appointment.status === "PENDING_REVIEW";
  const confirmed = appointment.status === "CONFIRMED";

  return (
    <div className="relative min-h-[75vh] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#d5ebe3,transparent_40%)]" />
      <div className="relative mx-auto max-w-2xl space-y-5">
        <Card className="overflow-hidden border-0 bg-[#0f3d38] p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
            {awaiting
              ? "Awaiting clinician"
              : confirmed
                ? "Encounter confirmed"
                : appointment.status}
          </p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
            {awaiting
              ? "Request sent to the clinic"
              : confirmed
                ? "Your consult is confirmed"
                : "Booking update"}
          </h1>
          <p className="mt-2 text-teal-50/90">
            {awaiting
              ? `Assigned to ${appointment.doctorName}. Only that clinician (or clinical lead) can accept.`
              : "Your clinician can open the encounter with your chief complaint attached."}
          </p>
        </Card>

        <Card className="space-y-4 p-6 text-sm">
          <div className="rounded-xl bg-[#f3f7f4] p-4 ring-1 ring-teal-900/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
              Why you contacted
            </p>
            <p className="mt-1 font-medium text-stone-900">{why}</p>
            {(appointment.aiPathway || appointment.aiSpecialty) && (
              <p className="mt-1 text-xs text-stone-500">
                AI path: {appointment.aiPathway}
                {appointment.aiSpecialty ? ` → ${appointment.aiSpecialty}` : ""}
                {appointment.priorityBand
                  ? ` · priority ${appointment.priorityBand}`
                  : ""}
              </p>
            )}
          </div>
          <Row label="Status" value={appointment.status} />
          <Row label="Clinician" value={appointment.doctorName} />
          <Row
            label="Specialty"
            value={appointment.consultationType.replaceAll("_", " ")}
          />
          <Row label="Requested time" value={when} />
          <Row label="Meeting code" value={appointment.meetingCode} />
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          {confirmed && (
            <Button asChild className="sm:flex-1">
              <a
                href={appointment.videoCallUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open video room
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="sm:flex-1">
            <Link href="/dashboard/appointments">Track my request</Link>
          </Button>
          <Button asChild variant="outline" className="sm:flex-1">
            <Link href="/login">Clinician sign-in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-stone-100 pb-3 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="break-all font-medium text-stone-900 sm:text-right">
        {value}
      </span>
    </div>
  );
}
