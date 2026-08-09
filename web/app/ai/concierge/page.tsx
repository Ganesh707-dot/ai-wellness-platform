"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Headache — give me instant first aid",
  "Eye pain and swelling — what can I do now?",
  "Seasonal sneezing and itchy eyes for 5 days",
  "My toddler has a mild fever and low appetite",
  "I'm stressed and waking at 3am — first aid for sleep?",
];

export default function AiConciergePage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Welcome to Maha Symptom Navigator (clinical decision support). Describe symptoms in your words — I run context-intent matching for pathway suggestions and visit prep. This is not a medical diagnosis. How can I assist your intake today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState<string>("");
  const [lastConcern, setLastConcern] = useState("");
  const [bookHref, setBookHref] = useState("/book-appointment");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const nextHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setLastConcern(trimmed);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            role: "patient",
            history: nextHistory
              .filter((m) => m.role !== "assistant" || nextHistory.indexOf(m) > 0)
              .slice(-8)
              .map(({ role, content }) => ({ role, content })),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
        setMeta(
          `${data.provider} · ${data.model} · ${data.mode}${
            data.intent?.label ? ` · ${data.intent.label}` : ""
          }`
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
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I hit a temporary network issue contacting live models. Please retry, or use structured triage while I recover.",
          },
        ]);
      }
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
              Context-intent pathway matching for specialty referral and visit
              preparation. Assistive only — not a diagnosis or emergency service.
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
                  onClick={() => send(s)}
                  className="w-full rounded-xl border border-stone-200 bg-[#f7faf8] px-3 py-2 text-left text-xs text-stone-700 transition hover:border-teal-700/40 hover:bg-teal-50"
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
            {lastConcern && (
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href={bookHref}>Book with this concern</Link>
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
                key={`${m.role}-${i}`}
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
            {pending && (
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
              send(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe symptoms, duration, and what you need help with…"
              rows={3}
              className="resize-none border-stone-200 bg-[#fbfcfb]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-500">
                Emergency symptoms → call local emergency services first.
              </p>
              <Button type="submit" disabled={pending || !input.trim()}>
                Send
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
