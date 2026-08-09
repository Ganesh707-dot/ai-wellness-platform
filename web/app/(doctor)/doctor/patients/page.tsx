"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type MatchedIntent = { label: string; score: number; specialty: string };

type PatientCard = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  lastVisit: string;
  totalVisits: number;
  status: string;
  specialty?: string;
  riskFlags?: string[];
  lastConcern?: string;
  whyContacted?: string[];
  matchedIntents?: MatchedIntent[];
  score?: number;
};

type IntentPreview = {
  label: string;
  score: number;
  specialty: string;
};

type Facet = { id: string; count: number };

const SPECIALTY_FILTERS = [
  { id: "", label: "All specialties" },
  { id: "HOMEOPATHY", label: "Homeopathy" },
  { id: "FAMILY_WELLNESS", label: "Family Wellness" },
  { id: "EMOTIONAL_WELLNESS", label: "Emotional" },
  { id: "PEDIATRICS", label: "Pediatrics" },
  { id: "WOMENS_WELLNESS", label: "Women's" },
  { id: "FERTILITY", label: "Fertility" },
  { id: "PREVENTIVE_CARE", label: "Preventive" },
];

const STATUS_FILTERS = [
  { id: "", label: "All status" },
  { id: "PENDING_REVIEW", label: "Pending review" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "RISK", label: "Has risk flags" },
];

const INTENT_CHIPS = ["headache", "eye pain", "allergy", "sleep", "Asha"];

export default function DoctorPatientsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [intentPreview, setIntentPreview] = useState<IntentPreview[]>([]);
  const [facets, setFacets] = useState<{
    specialties: Facet[];
    statuses: Facet[];
    riskCount: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiBlock, setAiBlock] = useState<{
    forDoctor: string[];
    differentials: string[];
    redFlags: string[];
    specialty: string;
  } | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const runSearch = useCallback(
    (q: string, spec: string, st: string) => {
      const id = ++reqId.current;
      startTransition(async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            pageSize: "40",
            q,
          });
          if (spec) params.set("specialty", spec);
          if (st === "RISK") params.set("riskOnly", "1");
          else if (st) params.set("status", st);

          const res = await fetch(`/api/doctor/patients?${params}`);
          const data = await res.json();
          if (id !== reqId.current) return;

          setPatients(Array.isArray(data.patients) ? data.patients : []);
          setTotal(data.pagination?.total || 0);
          setIntentPreview(data.intentPreview || []);
          setFacets(data.facets || null);

          if (q.trim().length >= 2) {
            const aiRes = await fetch("/api/doctor/ai-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: q,
                specialty: spec || undefined,
              }),
            });
            const ai = await aiRes.json();
            if (id !== reqId.current) return;
            if (ai.success) setAiBlock(ai.analyticsAnswer);
            else setAiBlock(null);
          } else {
            setAiBlock(null);
          }
        } catch {
          if (id === reqId.current) setPatients([]);
        } finally {
          if (id === reqId.current) setLoading(false);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    const t = setTimeout(
      () => runSearch(searchTerm, specialty, statusFilter),
      searchTerm ? 280 : 0
    );
    return () => clearTimeout(t);
  }, [searchTerm, specialty, statusFilter, status, runSearch]);

  if (status === "loading" && loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <RoleShell role="DOCTOR" title="Patient intelligence">
      <p className="mb-4 text-sm text-stone-600">
        Context search + filters — try <strong>headache</strong>,{" "}
        <strong>eye pain</strong>, <strong>allergy</strong>, or a name. Results
        are ranked by clinical intent and scoped to your panel.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder='Intent search: "headache", "sleep", "Asha"…'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl bg-white"
        />
        <div className="flex flex-wrap gap-2">
          {INTENT_CHIPS.map((chip) => (
            <Button
              key={chip}
              size="sm"
              variant={searchTerm === chip ? "default" : "outline"}
              onClick={() => setSearchTerm(chip)}
            >
              {chip}
            </Button>
          ))}
          {(searchTerm || specialty || statusFilter) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setSpecialty("");
                setStatusFilter("");
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5 space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
            Filter by specialty
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_FILTERS.map((f) => (
              <Button
                key={f.id || "all-spec"}
                size="sm"
                variant={specialty === f.id ? "default" : "outline"}
                onClick={() => setSpecialty(f.id)}
              >
                {f.label}
                {f.id && facets?.specialties
                  ? ` (${facets.specialties.find((x) => x.id === f.id)?.count ?? 0})`
                  : ""}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
            Filter by status
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.id || "all-st"}
                size="sm"
                variant={statusFilter === f.id ? "default" : "outline"}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
                {f.id === "RISK" && facets
                  ? ` (${facets.riskCount})`
                  : f.id && facets?.statuses
                    ? ` (${facets.statuses.find((x) => x.id === f.id)?.count ?? 0})`
                    : ""}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {aiBlock && (
        <Card className="mb-5 space-y-3 border-teal-900/10 bg-[#0f3d38] p-5 text-teal-50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200">
            Clinician CDS analytics · {aiBlock.specialty}
            {pending ? " · updating…" : ""}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {aiBlock.forDoctor.slice(0, 4).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {!!aiBlock.differentials.length && (
            <p className="text-xs text-teal-100/90">
              Differentials: {aiBlock.differentials.join(" · ")}
            </p>
          )}
          <p className="text-xs text-amber-200">
            Red flags: {aiBlock.redFlags.join("; ")}
          </p>
        </Card>
      )}

      {!!intentPreview.length && (
        <div className="mb-5 flex flex-wrap gap-2">
          {intentPreview.map((i) => (
            <span
              key={i.label}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-900 ring-1 ring-teal-200"
            >
              {i.label} · {i.score.toFixed(1)}
            </span>
          ))}
        </div>
      )}

      <p className="mb-3 text-sm text-stone-500">
        {total.toLocaleString()} matches
        {specialty
          ? ` · ${specialty.replaceAll("_", " ")}`
          : ""}
        {statusFilter ? ` · ${statusFilter.replaceAll("_", " ")}` : ""}
        {" · "}
        click a patient for full chart + AI
      </p>

      {loading && !patients.length ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : patients.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-600">
          No patients match these filters. Clear specialty/status or try another
          intent chip.
        </Card>
      ) : (
        <div className="grid gap-3">
          {patients.map((p) => (
            <Card
              key={p.id}
              className="p-5 transition hover:ring-1 hover:ring-teal-800/20"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      {p.name}
                    </h3>
                    <span className="text-xs text-stone-500">
                      {p.age}y · {p.totalVisits} visits
                    </span>
                    {p.specialty && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 ring-1 ring-teal-200">
                        {p.specialty.replaceAll("_", " ")}
                      </span>
                    )}
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
                      {p.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{p.email}</p>

                  <div className="mt-3 rounded-xl bg-[#f3f7f4] p-3 ring-1 ring-teal-900/10">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">
                      Why they contacted
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-900">
                      {p.lastConcern || "—"}
                    </p>
                    {!!p.whyContacted?.length && p.whyContacted.length > 1 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Also: {p.whyContacted.slice(1).join(" · ")}
                      </p>
                    )}
                  </div>

                  {!!p.matchedIntents?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.matchedIntents.map((m) => (
                        <span
                          key={m.label}
                          className="rounded-full bg-white px-2 py-0.5 text-[11px] text-teal-900 ring-1 ring-stone-200"
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                  {!!p.riskFlags?.length && (
                    <div className="flex flex-wrap gap-1 lg:justify-end">
                      {p.riskFlags.map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button asChild size="sm">
                    <Link href={`/doctor/patients/${p.id}`}>
                      Full chart + AI
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </RoleShell>
  );
}
