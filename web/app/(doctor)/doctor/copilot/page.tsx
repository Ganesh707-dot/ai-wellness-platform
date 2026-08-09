"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type Soap = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type Copilot = {
  aiSummary: string;
  aiInsights: string[];
  suggestedSoap: Soap;
  model: string;
  riskScore?: number;
  specialty?: string;
};

export default function DoctorCopilotPage() {
  const { status } = useSession();
  const router = useRouter();
  const [copilot, setCopilot] = useState<Copilot | null>(null);
  const [notes, setNotes] = useState(
    "Patient reports headache for 2 days after long screen hours, poor sleep, mild nausea. No fever."
  );
  const [draft, setDraft] = useState("");
  const [matchedPatients, setMatchedPatients] = useState<
    Array<{ id: string; name: string; lastConcern?: string }>
  >([]);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/ai/consultation-copilot?concern=" + encodeURIComponent(notes))
      .then((r) => r.json())
      .then((d) => setCopilot(d.result || null))
      .finally(() => setLoading(false));
  }, [status]);

  const runAssist = () => {
    startTransition(async () => {
      const [chatRes, searchRes, copilotRes] = await Promise.all([
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: notes, role: "doctor", history: [] }),
        }),
        fetch("/api/doctor/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: notes }),
        }),
        fetch("/api/ai/consultation-copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concern: notes }),
        }),
      ]);
      const chat = await chatRes.json();
      const search = await searchRes.json();
      const c = await copilotRes.json();
      setDraft(chat.content || "Unable to draft.");
      setCopilot(c.result || null);
      setMatchedPatients(search.matchedPatients || []);
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
    <RoleShell role="DOCTOR" title="Encounter CDS">
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        Clinician-only clinical decision support — separate from the patient
        Symptom Navigator. Paste notes to retrieve intent matches, differentials
        to consider, SOAP documentation support, and matching patient charts.
        Not a diagnosis; licensed judgment required.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Encounter notes / symptom search
          </p>
          <Textarea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={runAssist} disabled={pending}>
            {pending ? "Analyzing…" : "Run doctor intent + analytics"}
          </Button>
          {draft && (
            <div className="whitespace-pre-wrap rounded-xl bg-[#f3f7f4] p-4 text-sm text-stone-800 ring-1 ring-stone-200">
              {draft}
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            SOAP + insights
          </p>
          {copilot ? (
            <>
              <p className="text-sm text-stone-800">{copilot.aiSummary}</p>
              <div className="space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
                <p>
                  <strong>S:</strong> {copilot.suggestedSoap.subjective}
                </p>
                <p>
                  <strong>O:</strong> {copilot.suggestedSoap.objective}
                </p>
                <p>
                  <strong>A:</strong> {copilot.suggestedSoap.assessment}
                </p>
                <p>
                  <strong>P:</strong> {copilot.suggestedSoap.plan}
                </p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
                {(copilot.aiInsights || []).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="text-xs text-stone-500">{copilot.model}</p>
            </>
          ) : (
            <p className="text-sm text-stone-500">No copilot packet loaded.</p>
          )}

          {!!matchedPatients.length && (
            <div className="border-t border-stone-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-teal-800">
                Patients matching this intent
              </p>
              <div className="space-y-2">
                {matchedPatients.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/doctor/patients/${p.id}`}
                    className="block rounded-lg bg-[#f3f7f4] px-3 py-2 text-sm hover:ring-1 hover:ring-teal-800/20"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {p.lastConcern}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </RoleShell>
  );
}
