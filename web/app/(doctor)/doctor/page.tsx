"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";
import { useRbac } from "@/hooks/use-rbac";
import { RbacSessionBadge } from "@/components/common/rbac-session-badge";

interface DoctorStats {
  todaysAppointments: number;
  totalPatients: number;
  completedThisWeek: number;
  aiAssistedNotes?: number;
  averageRating?: number;
  revenueThisMonth?: number;
}

interface Copilot {
  aiSummary: string;
  aiInsights: string[];
  suggestedSoap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  model: string;
}

const FRESH_DOCTOR_PLAYBOOK = [
  {
    title: "See why they booked",
    body: "Every encounter opens with chief complaint + AI pathway — never a blank chart.",
    href: "/doctor/appointments",
  },
  {
    title: "Run Encounter CDS",
    body: "Context-intent search, differentials to consider, red flags, SOAP documentation support.",
    href: "/doctor/copilot",
  },
  {
    title: "Pull full patient intelligence",
    body: "Search by symptom intent (e.g. headache) and open analytics-rich dossiers.",
    href: "/doctor/patients",
  },
];

const SAFETY_CHECKLIST = [
  "Screen emergency red flags before telehealth advice",
  "Confirm allergies / meds before any Rx discussion",
  "Document what patient already tried (first-aid shared by Navigator)",
  "Escalate uncertain cases via Clinical Lead when needed",
];

export default function DoctorDashboard() {
  const { session, status, can, role, tier } = useRbac();
  const router = useRouter();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [copilot, setCopilot] = useState<Copilot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !can("portal:clinician")) {
      router.push("/unauthorized");
    }
  }, [status, can, router]);

  useEffect(() => {
    if (status !== "authenticated" || !can("portal:clinician")) return;
    Promise.all([
      fetch("/api/doctor/dashboard-stats").then((r) => r.json()),
      can("cds:encounter")
        ? fetch("/api/ai/consultation-copilot").then((r) => r.json())
        : Promise.resolve(null),
    ])
      .then(([s, c]) => {
        setStats(s);
        setCopilot(c?.result || null);
      })
      .finally(() => setLoading(false));
  }, [status, can]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isLead = role === "CLINICAL_LEAD" || tier === "LEAD";
  const isJunior = tier === "JUNIOR" || (!isLead && role === "DOCTOR");

  return (
    <RoleShell
      role="DOCTOR"
      title={
        isLead
          ? `Clinical lead · ${session?.user?.name || ""}`
          : `Clinician studio · ${session?.user?.name || ""}`
      }
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_45%,#1c1917_100%)] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-100">
              {isJunior
                ? "Fresh clinician problem-solver"
                : "Clinical oversight"}
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
              {isJunior
                ? "Never face a blank consult again"
                : "Guide juniors and protect quality"}
            </h2>
            <p className="mt-3 text-sm text-teal-50/90">
              Maha turns patient intake into clinician-ready intelligence —
              chief complaint, intent pathway, red flags, and SOAP support —
              so early-career doctors deliver confident, safe telehealth.
            </p>
          </div>
          <div className="min-w-[200px]">
            <RbacSessionBadge className="border-white/20 bg-white/10 text-teal-50 [&_p]:text-teal-50 [&_.text-stone-900]:text-white [&_.text-stone-500]:text-teal-100/80 [&_.text-teal-800]:text-teal-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Today", stats?.todaysAppointments ?? 0],
          ["Panel", stats?.totalPatients?.toLocaleString() ?? 0],
          ["Week done", stats?.completedThisWeek ?? 0],
          ["CDS assists", stats?.aiAssistedNotes ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      {isJunior && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {FRESH_DOCTOR_PLAYBOOK.map((item) => (
            <Card key={item.title} className="flex flex-col p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
                Playbook
              </p>
              <h3 className="mt-2 font-serif text-xl text-stone-900">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-stone-600">{item.body}</p>
              <Button asChild size="sm" className="mt-4 w-fit">
                <Link href={item.href}>Open</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Next-encounter CDS brief
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/doctor/copilot">Open Encounter CDS</Link>
            </Button>
          </div>
          {copilot ? (
            <>
              <p className="text-stone-800">{copilot.aiSummary}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
                {(copilot.aiInsights || []).slice(0, 4).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-stone-500">No brief loaded.</p>
          )}
        </Card>

        <Card className="space-y-3 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Safety checklist · every visit
          </p>
          <ul className="space-y-2 text-sm text-stone-700">
            {SAFETY_CHECKLIST.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-0.5 text-teal-800">▹</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          {isJunior && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
              Junior tier: use <strong>cds:escalation</strong> when uncertain —
              Clinical Lead can review.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {can("appointments:read_panel") && (
          <Button asChild>
            <Link href="/doctor/appointments">Clinic schedule</Link>
          </Button>
        )}
        {can("patients:read_panel") && (
          <Button asChild variant="outline">
            <Link href="/doctor/patients">Patient intelligence</Link>
          </Button>
        )}
        {can("cds:encounter") && (
          <Button asChild variant="outline">
            <Link href="/doctor/copilot">Encounter CDS</Link>
          </Button>
        )}
      </div>
    </RoleShell>
  );
}
