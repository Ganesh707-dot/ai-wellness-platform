"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { appendAiTurn } from "@/lib/patient-ai-intake";

/**
 * Anonymous guest portal — one-step Symptom Navigator.
 * No login required. Public CDS intake → optional book / register.
 */
export default function GuestPortalPage() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState("");
  const [bookHref, setBookHref] = useState("/book-appointment");
  const [pending, startTransition] = useTransition();

  const run = () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    startTransition(async () => {
      try {
        appendAiTurn({ role: "user", content: trimmed });
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            role: "patient",
            history: [],
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed");
        setAnswer(data.content);
        appendAiTurn({
          role: "assistant",
          content: data.content,
          intentLabel: data.intent?.label,
          specialty: data.analytics?.specialty,
          intentScore: data.intent?.score,
          mode: data.mode,
        });
        setMeta(
          [
            data.intent?.label,
            data.analytics?.specialty || data.carePath?.specialty,
            data.mode,
          ]
            .filter(Boolean)
            .join(" · ")
        );
        const type = data.carePath?.consultationType || "PREVENTIVE_CARE";
        const href = `/book-appointment?concern=${encodeURIComponent(trimmed)}&type=${type}`;
        setBookHref(href);
        try {
          sessionStorage.setItem(
            "aw_booking_intake",
            JSON.stringify({ concern: trimmed, consultationType: type })
          );
        } catch {
          /* ignore */
        }
      } catch {
        setAnswer(
          "Temporary issue running clinical decision support. Please retry, or book a clinician directly."
        );
      }
    });
  };

  return (
    <div className="relative min-h-[85vh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,#d5ebe3_0%,transparent_42%),radial-gradient(circle_at_90%_10%,#e8dcc8_0%,transparent_40%)]" />
      <div className="relative mx-auto max-w-2xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          Guest portal · no account required
        </p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900">
          One-step symptom intake
        </h1>
        <p className="mt-3 text-stone-600">
          Describe your concern once. Symptom Navigator returns pathway
          suggestions and visit prep. Clinical decision support only — not a
          diagnosis. Create an account later for full data history.
        </p>

        <div className="mt-8 rounded-3xl border border-stone-200 bg-white/95 p-5 shadow-sm sm:p-7">
          <Textarea
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: Headache for 2 days after long screen hours — what should I do before booking?"
            className="resize-none bg-[#fbfcfb]"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-stone-500">
              Emergencies → call local emergency services first.
            </p>
            <Button
              type="button"
              onClick={run}
              disabled={pending || !input.trim()}
            >
              {pending ? "Analyzing…" : "Get CDS guidance"}
            </Button>
          </div>

          {meta && (
            <p className="mt-4 text-xs font-medium text-teal-900">{meta}</p>
          )}

          {answer && (
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f3f7f4] p-4 text-sm leading-relaxed text-stone-800 ring-1 ring-stone-200">
              {answer}
            </div>
          )}

          {answer && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href={bookHref}>Book with this concern</Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/register">Create patient account</Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">
          Prefer the full chat workspace?{" "}
          <Link href="/ai/concierge" className="text-teal-800 underline">
            Open Symptom Navigator
          </Link>
        </p>
      </div>
    </div>
  );
}
