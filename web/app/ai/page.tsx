import Link from "next/link";

const tools = [
  {
    href: "/ai/concierge",
    title: "Symptom Navigator",
    body: "Multi-turn Groq AI chat. Sentence intent → specialty → clinician handoff.",
    tag: "Live AI",
    cta: "Start chat",
  },
  {
    href: "/guest",
    title: "Guest Intake",
    body: "One-step CDS — no account. Book or register after AI guidance.",
    tag: "Public",
    cta: "Try now",
  },
  {
    href: "/ai/wellness-coach",
    title: "Wellness Coach",
    body: "Sleep, stress, habits between visits — conversational continuity.",
    tag: "Continuity",
    cta: "Open coach",
  },
  {
    href: "/ai/symptom-checker",
    title: "Structured Triage",
    body: "Urgency bands, confidence scores, matched clinicians, audit IDs.",
    tag: "Triage",
    cta: "Run triage",
  },
];

export default function AiHubPage() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#d5ebe3,transparent_45%),radial-gradient(circle_at_100%_0%,#e8dcc8,transparent_40%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          AI Wellness · Clinical Decision Support
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl text-stone-900 md:text-5xl">
          Conversational AI tools — live on Groq
        </h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          Assistive CDS for intake, triage, and care continuity. Not a diagnosis
          service — licensed clinicians decide.
        </p>
        <a
          href="/api/ai/status"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-teal-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-950"
        >
          Check live AI status ↗
        </a>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="w-fit rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                {t.tag}
              </span>
              <h2 className="mt-4 font-serif text-2xl text-stone-900 group-hover:text-teal-900">
                {t.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-stone-600">{t.body}</p>
              <span className="mt-5 inline-flex w-fit rounded-full bg-teal-900 px-4 py-2 text-xs font-semibold text-white group-hover:bg-teal-950">
                {t.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
