"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { appendAiTurn } from "@/lib/patient-ai-intake";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "I sleep poorly after 1am and feel stressed at work",
  "Gentle 2-week reset for energy and mood",
  "How can I reduce screen-time before bed?",
];

export default function WellnessCoachPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your between-visit wellness coach. Share sleep, stress, or lifestyle goals and I'll suggest gentle habits (not a diagnosis or prescription). What would you like support with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    appendAiTurn({ role: "user", content: trimmed });
    const priorHistory = messages.slice(1);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            role: "wellness",
            history: priorHistory.slice(-8),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Coach failed");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
        appendAiTurn({
          role: "assistant",
          content: data.content,
          intentLabel: data.intent?.label,
          specialty: data.analytics?.specialty,
          mode: data.mode,
        });
        setMeta(
          `${data.provider} · ${data.mode}${
            data.intent?.label ? ` · ${data.intent.label}` : ""
          }`
        );
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I couldn't reach the live coach model — please retry. The intent engine will still guide sleep/stress tips when available.",
          },
        ]);
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
        Care continuity · conversational AI
      </p>
      <h1 className="mt-2 font-serif text-4xl text-stone-900">
        Between-Visit Guidance
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Chat about sleep, stress, and recovery. Your conversation can attach to
        a clinician booking so your doctor sees intent context too.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <p className="text-sm font-semibold text-stone-900">Wellness coach</p>
          {meta && (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] text-teal-900">
              {meta}
            </span>
          )}
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-teal-900 text-white"
                    : "bg-[#f3f7f4] text-stone-800 ring-1 ring-stone-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <p className="text-xs text-stone-500">Coach is thinking…</p>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700 hover:bg-teal-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe sleep, stress, habits…"
              className="resize-none"
            />
            <Button type="submit" disabled={pending || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/ai/concierge" className="text-teal-800 hover:underline">
          Symptom Navigator →
        </Link>
        <Link href="/book-appointment" className="text-teal-800 hover:underline">
          Book clinician follow-up →
        </Link>
      </div>
    </div>
  );
}
