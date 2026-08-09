"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TriageResult = {
  urgency: "LOW" | "MODERATE" | "HIGH";
  confidence: number;
  likelyCategory: string;
  summary: string;
  recommendedNextStep: string;
  careTips: string[];
  flags: string[];
  matchedDoctors: {
    id: string;
    name: string;
    rating: number;
    consultationFee: number;
    bookUrl: string;
  }[];
  evidenceLinks: { label: string; url: string }[];
  disclaimer: string;
  model: string;
  traceId: string;
  latencyMs: number;
};

export default function AiTriagePage() {
  const [age, setAge] = useState(32);
  const [gender, setGender] = useState("FEMALE");
  const [symptoms, setSymptoms] = useState(
    "Seasonal sneezing, itchy eyes, and poor sleep for 5 days"
  );
  const [durationDays, setDurationDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/symptom-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, gender, symptoms, durationDays }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Triage failed");
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Triage failed");
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor =
    result?.urgency === "HIGH"
      ? "text-red-800 bg-red-50"
      : result?.urgency === "MODERATE"
        ? "text-amber-900 bg-amber-50"
        : "text-teal-900 bg-teal-50";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
        Structured triage · clinical decision support
      </p>
      <h1 className="mt-2 font-serif text-4xl text-stone-900">
        Urgency banding with clinician referral
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Returns urgency, confidence, specialty, matched doctors, evidence links,
        and an auditable trace ID — production can swap the model behind the same contract.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="duration">Days</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                rows={5}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Running triage…" : "Run structured triage"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          {!result ? (
            <p className="text-sm text-stone-500">
              Triage packet appears here with routing + matched clinicians.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-md px-3 py-1 font-semibold ${urgencyColor}`}>
                  {result.urgency}
                </span>
                <span className="rounded-md bg-stone-100 px-3 py-1 font-medium text-stone-700">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-stone-800">{result.summary}</p>
              <p className="text-stone-600">{result.recommendedNextStep}</p>
              {result.flags.length > 0 && (
                <ul className="list-disc pl-5 text-stone-600">
                  {result.flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              <div>
                <p className="font-semibold text-stone-900">Matched clinicians</p>
                <ul className="mt-2 space-y-2">
                  {result.matchedDoctors.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 border-b border-stone-100 py-2"
                    >
                      <span>
                        {d.name}
                        <span className="block text-xs text-stone-500">
                          ★ {d.rating} · ₹{d.consultationFee}
                        </span>
                      </span>
                      <Link href={d.bookUrl} className="text-teal-800 hover:underline">
                        Book
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-xs text-stone-500">
                {result.disclaimer}
                <br />
                {result.model} · {result.latencyMs}ms · {result.traceId}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
