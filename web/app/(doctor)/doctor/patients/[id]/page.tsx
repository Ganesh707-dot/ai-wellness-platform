"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type Dossier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  lastVisit: string;
  totalVisits: number;
  status: string;
  riskFlags: string[];
  chiefComplaints: string[];
  encounters: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    consultationType: string;
    chiefComplaint: string;
    aiSpecialty?: string;
    aiPathway?: string;
    source?: string;
  }>;
  prescriptions: Array<{
    id: string;
    medicine: string;
    potency?: string;
    status: string;
    dosage: string;
    frequency: string;
  }>;
  analytics: {
    visitCount: number;
    completedCount: number;
    upcomingCount: number;
    openRiskCount: number;
    topPathways: { label: string; count: number }[];
    adherenceScore: number;
    symptomBurden: number;
    lastConcern: string;
  };
  ai: {
    summary: string;
    insights: string[];
    suggestedFocus: string;
    soapDraft: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    intentHits: Array<{
      label: string;
      score: number;
      whyMatched: string[];
      doctorAnswer: string[];
      differentials: string[];
    }>;
  };
};

export default function DoctorPatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const router = useRouter();
  const [patient, setPatient] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    fetch(`/api/doctor/patients/${id}`)
      .then((r) => r.json())
      .then((d) => setPatient(d.patient || null))
      .finally(() => setLoading(false));
  }, [status, id]);

  const askAi = () => {
    if (!patient || !q.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/doctor/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, patientId: patient.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setAiNote("AI search failed.");
        return;
      }
      const lines = [
        `Grounded on ${patient.name} · last concern: ${patient.analytics.lastConcern}`,
        `Top intent: ${data.topIntent?.label || "—"} (${data.topIntent?.score ?? "—"})`,
        "",
        "Doctor actions:",
        ...(data.analyticsAnswer?.forDoctor || []).map(
          (s: string, i: number) => `${i + 1}. ${s}`
        ),
        "",
        `Differentials: ${(data.analyticsAnswer?.differentials || []).join(" · ")}`,
        `Red flags: ${(data.analyticsAnswer?.redFlags || []).join("; ")}`,
        "",
        data.copilot?.aiSummary || "",
      ];
      setAiNote(lines.filter(Boolean).join("\n"));
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patient) {
    return (
      <RoleShell role="DOCTOR" title="Patient chart">
        <Card className="p-8 text-center text-sm">
          Patient not found.{" "}
          <Link href="/doctor/patients" className="text-teal-800 underline">
            Back
          </Link>
        </Card>
      </RoleShell>
    );
  }

  const a = patient.analytics;

  return (
    <RoleShell role="DOCTOR" title={patient.name}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/doctor/patients">← Panel</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/doctor/copilot">Encounter CDS</Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Visits", a.visitCount],
          ["Upcoming", a.upcomingCount],
          ["Adherence", `${a.adherenceScore}%`],
          ["Symptom burden", `${a.symptomBurden}%`],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-xs uppercase text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Demographics & contact
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-stone-500">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Age / sex</p>
              <p className="font-medium">
                {patient.age} · {patient.gender}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Last visit</p>
              <p className="font-medium">
                {new Date(patient.lastVisit).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
          {!!patient.riskFlags.length && (
            <div className="flex flex-wrap gap-2">
              {patient.riskFlags.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-900"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-[#f3f7f4] p-4 ring-1 ring-teal-900/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
              Latest reason for contact
            </p>
            <p className="mt-1 font-medium text-stone-900">{a.lastConcern}</p>
            {patient.chiefComplaints.length > 1 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone-600">
                {patient.chiefComplaints.slice(1, 5).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            CDS chart analytics
          </p>
          <p className="text-sm text-stone-800">{patient.ai.summary}</p>
          <p className="text-xs font-semibold text-teal-900">
            Focus: {patient.ai.suggestedFocus}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
            {patient.ai.insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase text-stone-500">SOAP</p>
            <p className="mt-2">
              <strong>S:</strong> {patient.ai.soapDraft.subjective}
            </p>
            <p>
              <strong>O:</strong> {patient.ai.soapDraft.objective}
            </p>
            <p>
              <strong>A:</strong> {patient.ai.soapDraft.assessment}
            </p>
            <p>
              <strong>P:</strong> {patient.ai.soapDraft.plan}
            </p>
          </div>
          {!!a.topPathways.length && (
            <p className="text-xs text-stone-500">
              Pathways:{" "}
              {a.topPathways.map((p) => `${p.label} (${p.count})`).join(" · ")}
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-4 space-y-3 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
          CDS query on this patient
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='e.g. "headache triggers", "sleep", "allergy follow-up"'
            className="bg-white"
          />
          <Button onClick={askAi} disabled={pending || !q.trim()}>
            {pending ? "Searching…" : "Intent search"}
          </Button>
        </div>
        {aiNote && (
          <pre className="whitespace-pre-wrap rounded-xl bg-[#f3f7f4] p-4 text-sm text-stone-800 ring-1 ring-stone-200">
            {aiNote}
          </pre>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Encounter history
          </p>
          <div className="space-y-3">
            {patient.encounters.length === 0 ? (
              <p className="text-sm text-stone-500">No encounters yet.</p>
            ) : (
              patient.encounters.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-stone-100 p-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">{e.chiefComplaint}</p>
                    <Link
                      href={`/doctor/encounters/${e.id}`}
                      className="text-xs text-teal-800 underline"
                    >
                      Open
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(e.scheduledAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {e.status} · {e.aiPathway || e.consultationType}
                    {e.source === "live-booking" ? " · live" : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Prescriptions
          </p>
          <div className="space-y-3">
            {patient.prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="rounded-xl border border-stone-100 p-3 text-sm"
              >
                <p className="font-medium">
                  {rx.medicine}
                  {rx.potency ? ` · ${rx.potency}` : ""}
                </p>
                <p className="text-xs text-stone-500">
                  {rx.dosage} · {rx.frequency} · {rx.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </RoleShell>
  );
}
