"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CoachResult = {
  focus: string;
  plan: string[];
  weeklyTargets: {
    sleepConsistency: string;
    movementMinutes: number;
    stressCheckIns: number;
  };
  relatedArticles: { title: string; url: string }[];
  model: string;
  disclaimer: string;
  narrative?: string;
  provider?: string;
  mode?: string;
};

export default function WellnessCoachPage() {
  const [prompt, setPrompt] = useState(
    "I sleep poorly after 1am, feel stressed at work, and want a gentle 2-week reset."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/wellness-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Coach failed");
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Coach failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
        Care continuity · non-diagnostic
      </p>
      <h1 className="mt-2 font-serif text-4xl text-stone-900">
        Between-Visit Guidance
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Lifestyle and recovery suggestions patients can follow until their next
        clinician visit. Not a diagnosis or treatment plan.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prompt">What do you want support with?</Label>
              <Textarea
                id="prompt"
                rows={7}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Preparing guidance…" : "Generate care guidance"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          {!result ? (
            <p className="text-sm text-stone-500">Your plan will appear here.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {result.narrative && (
                <p className="whitespace-pre-wrap rounded-xl bg-[#f3f7f4] p-3 text-stone-800 ring-1 ring-stone-200">
                  {result.narrative}
                </p>
              )}
              <p className="font-semibold text-stone-900">
                Focus: {result.focus}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-stone-700">
                {result.plan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="rounded-lg bg-stone-50 p-3 text-stone-700">
                <p>Sleep consistency: {result.weeklyTargets.sleepConsistency}</p>
                <p>Movement: {result.weeklyTargets.movementMinutes} min/week</p>
                <p>Stress check-ins: {result.weeklyTargets.stressCheckIns}</p>
              </div>
              <div>
                <p className="font-semibold">Related reading</p>
                <ul className="mt-1 space-y-1">
                  {result.relatedArticles.map((a) => (
                    <li key={a.url}>
                      <Link href={a.url} className="text-teal-800 hover:underline">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-stone-500">
                {result.disclaimer} · {result.model}
              </p>
              <Link href="/book-appointment" className="text-teal-800 hover:underline">
                Book clinician follow-up →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
