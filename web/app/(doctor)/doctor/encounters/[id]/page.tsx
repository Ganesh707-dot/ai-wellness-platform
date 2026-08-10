"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type Encounter = {
  id: string;
  patientName: string;
  consultationType: string;
  scheduledAt: string;
  status: string;
  concern: string;
  chiefComplaint?: string;
  notes?: string;
  aiSpecialty?: string;
  aiPathway?: string;
  intentLabel?: string;
  intentScore?: number;
  aiFirstAid?: string[];
  visitPrep?: string[];
  redFlags?: string;
  doctorBrief?: string;
  aiInsights?: string[];
  soapDraft?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  meetingCode?: string;
  videoCallUrl?: string;
  source?: string;
};

type Copilot = {
  aiSummary: string;
  aiInsights: string[];
  suggestedSoap: Encounter["soapDraft"];
  model: string;
  intent?: { label: string; score: number; whyMatched?: string[] };
  analytics?: {
    whyMatched?: string[];
    differentials?: string[];
    allIntents?: { label: string; score: number }[];
  };
};

export default function DoctorEncounterPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const router = useRouter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [copilot, setCopilot] = useState<Copilot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    (async () => {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        const data = res.ok ? await res.json() : null;
        setEncounter(data);
        const concern = data?.chiefComplaint || data?.concern || "";
        const cRes = await fetch(
          `/api/ai/consultation-copilot?appointmentId=${id}&concern=${encodeURIComponent(concern)}`
        );
        const cData = await cRes.json();
        setCopilot(cData.result || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, id]);

  const refreshCopilot = () => {
    if (!encounter) return;
    startTransition(async () => {
      const res = await fetch("/api/ai/consultation-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: encounter.id,
          concern: encounter.chiefComplaint || encounter.concern,
        }),
      });
      const data = await res.json();
      if (data.result) setCopilot(data.result);
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!encounter) {
    return (
      <RoleShell role="DOCTOR" title="Encounter">
        <Card className="p-8 text-center text-sm text-stone-600">
          Encounter not found.{" "}
          <Link href="/doctor/appointments" className="text-teal-800 underline">
            Back to schedule
          </Link>
        </Card>
      </RoleShell>
    );
  }

  const why = encounter.chiefComplaint || encounter.concern;
  const soap = copilot?.suggestedSoap || encounter.soapDraft;

  return (
    <RoleShell role="DOCTOR" title={`Encounter · ${encounter.patientName}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/doctor/appointments">← Schedule</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/doctor/copilot">Encounter CDS</Link>
        </Button>
        {encounter.source === "live-booking" && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            From live patient booking
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
              Why patient contacted you
            </p>
            <h2 className="mt-2 font-serif text-2xl text-stone-900">{why}</h2>
            <p className="mt-2 text-sm text-stone-600">
              AI pathway: <strong>{encounter.aiPathway || "—"}</strong> →{" "}
              <strong>{encounter.aiSpecialty || "—"}</strong>
            </p>
          </div>

          <div className="rounded-xl bg-[#0f3d38] p-4 text-sm text-teal-50">
            <p className="text-xs uppercase tracking-wide text-teal-200">
              Clinician brief (Encounter CDS)
            </p>
            <p className="mt-2">
              {encounter.doctorBrief || copilot?.aiSummary}
            </p>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-stone-500">When</p>
              <p className="font-medium">
                {new Date(encounter.scheduledAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Status</p>
              <p className="font-medium">{encounter.status}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Specialty booked</p>
              <p className="font-medium">
                {(encounter.consultationType || "").replaceAll("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Meeting</p>
              <p className="font-medium">{encounter.meetingCode}</p>
            </div>
          </div>

          {encounter.notes && (
            <div className="rounded-xl bg-amber-50/60 p-3 text-sm text-stone-700 ring-1 ring-amber-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Patient notes + AI transcript
              </p>
              <p className="mt-1 whitespace-pre-wrap">{encounter.notes}</p>
            </div>
          )}

          {(encounter.intentLabel || encounter.aiPathway) && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-900">
                Intent analytics (from patient AI intake)
              </p>
              <p className="mt-2 font-medium text-stone-900">
                {encounter.intentLabel || encounter.aiPathway}
                {typeof encounter.intentScore === "number"
                  ? ` · score ${encounter.intentScore.toFixed(1)}`
                  : ""}
              </p>
              <p className="mt-1 text-stone-600">
                Specialty: {encounter.aiSpecialty || "—"}
              </p>
              {copilot?.analytics?.whyMatched && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone-600">
                  {copilot.analytics.whyMatched.slice(0, 4).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
              Encounter CDS (clinician-only)
            </p>
            <Button size="sm" variant="outline" onClick={refreshCopilot} disabled={pending}>
              {pending ? "Refreshing…" : "Regenerate"}
            </Button>
          </div>

          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {(copilot?.aiInsights || []).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>

          {soap && (
            <div className="space-y-2 rounded-xl bg-[#f3f7f4] p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-teal-900">
                SOAP draft
              </p>
              <p>
                <strong>S:</strong> {soap.subjective}
              </p>
              <p>
                <strong>O:</strong> {soap.objective}
              </p>
              <p>
                <strong>A:</strong> {soap.assessment}
              </p>
              <p>
                <strong>P:</strong> {soap.plan}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">
              First-aid already shared with patient
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
              {(encounter.aiFirstAid || []).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>

          <p className="text-xs text-amber-800">
            Red flags: {encounter.redFlags}
          </p>
        </Card>
      </div>
    </RoleShell>
  );
}
