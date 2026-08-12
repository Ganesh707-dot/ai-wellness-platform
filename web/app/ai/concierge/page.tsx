"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { appendAiTurn, setConversationConcern } from "@/lib/patient-ai-intake";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAiIntakeSync } from "@/hooks/use-ai-intake-sync";

const STARTERS = [
  "Headache — give me instant first aid",
  "Eye pain and swelling — what can I do now?",
  "Seasonal sneezing and itchy eyes for 5 days",
  "My toddler has a mild fever and low appetite",
  "Health is not well for mother after child birth",
  "I'm stressed and waking at 3am — first aid for sleep?",
];

export default function AiConciergePage() {
  useAiIntakeSync();
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState<string>("");
  const [bookHref, setBookHref] = useState("/book-appointment");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, send, isLoading, sessionMeta } = useAiChat(
    "Hi — I'm your Symptom Navigator. Describe how you feel in your own words and I'll match clinical intent, suggest safe first-aid steps, and prepare a handoff for your clinician. This is decision support, not a diagnosis. What's going on today?"
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    appendAiTurn({ role: "user", content: trimmed });

    void send(trimmed, {
      role: "patient",
      onMeta: (m) => {
        setMeta(
          `${m.provider} · ${m.mode}${
            m.intentLabel ? ` · intent: ${m.intentLabel}` : ""
          }${m.specialty ? ` → ${m.specialty}` : ""}${
            m.mode === "clinical-engine"
              ? " · add GROQ_API_KEY on Vercel for live LLM"
              : ""
          }`
        );
        const concern = m.conversationConcern || trimmed;
        setConversationConcern(concern);
        const type = m.consultationType || "PREVENTIVE_CARE";
        const href = `/book-appointment?concern=${encodeURIComponent(concern)}&type=${type}`;
        setBookHref(href);
        try {
          sessionStorage.setItem(
            "aw_booking_intake",
            JSON.stringify({ concern, consultationType: type })
          );
        } catch {
          /* ignore */
        }
      },
      onSuccess: (data) => {
        appendAiTurn({
          role: "assistant",
          content: String(data.content),
          intentLabel: (data.intent as { label?: string })?.label,
          specialty:
            (data.analytics as { specialty?: string })?.specialty ||
            (data.carePath as { specialty?: string })?.specialty,
          intentScore: (data.intent as { score?: number })?.score,
          whyMatched: (data.analytics as { whyMatched?: string[] })?.whyMatched,
          mode: data.mode as string,
        });
      },
    });
  };

  return (
    <div className="relative min-h-[85vh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#cfe8df_0%,transparent_40%),radial-gradient(circle_at_90%_10%,#e7dcc8_0%,transparent_35%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-teal-900/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
              Patient CDS · Symptom Navigator
            </p>
            <h1 className="mt-2 font-serif text-3xl text-stone-900">
              Guided clinical intake
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Sentence-based intent matching for specialty referral — not naive
              keyword overlap.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Quick starts
            </p>
            <div className="mt-3 space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-stone-200 bg-[#f7faf8] px-3 py-2 text-left text-xs text-stone-700 transition hover:border-teal-700/40 hover:bg-teal-50 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/ai/symptom-checker" className="text-teal-800 hover:underline">
              Structured triage →
            </Link>
            <Link href="/ai/wellness-coach" className="text-teal-800 hover:underline">
              Wellness coach →
            </Link>
            <Link href={bookHref} className="text-teal-800 hover:underline">
              Book clinician →
            </Link>
            {sessionMeta?.conversationConcern && (
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href={bookHref}>Book with full conversation context</Link>
              </Button>
            )}
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white/90 shadow-[0_20px_60px_-30px_rgba(15,70,60,0.45)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div>
              <p className="font-semibold text-stone-900">Intake assistant</p>
              <p className="text-xs text-stone-500">
                Clinical decision support · not a diagnosis
              </p>
            </div>
            {meta && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] text-teal-900">
                {meta}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-teal-900 text-white"
                      : "bg-[#f3f7f4] text-stone-800 ring-1 ring-stone-200/80"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-700" />
                Analyzing intake…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="border-t border-stone-100 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe symptoms, duration, and what you need help with…"
              rows={3}
              className="resize-none border-stone-200 bg-[#fbfcfb]"
              disabled={isLoading}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-500">
                Emergency symptoms → call local emergency services first.
              </p>
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
