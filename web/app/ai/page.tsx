import Link from "next/link";

const tools = [
  {
    href: "/ai/concierge",
    title: "Symptom Navigator",
    body: "Context-intent intake for specialty routing and visit preparation. Clinical decision support only — not a diagnosis.",
    tag: "Patient CDS",
  },
  {
    href: "/ai/symptom-checker",
    title: "Structured Triage",
    body: "Urgency banding, confidence, matched clinicians, and audit trace IDs for referral handoff.",
    tag: "Triage",
  },
  {
    href: "/ai/wellness-coach",
    title: "Between-Visit Guidance",
    body: "Non-diagnostic lifestyle plans for sleep, stress, and recovery between consultations.",
    tag: "Continuity",
  },
];

export default function AiHubPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#d5ebe3,transparent_45%),radial-gradient(circle_at_100%_0%,#e8dcc8,transparent_40%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          Clinical Decision Support
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl text-stone-900 md:text-5xl">
          Assistive CDS for intake, triage, and care continuity
        </h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          Built for telehealth referral workflows. These tools support
          information gathering and pathway suggestions. They do not provide a
          medical diagnosis or replace licensed clinical judgment.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                {t.tag}
              </span>
              <h2 className="mt-4 font-serif text-2xl text-stone-900">{t.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{t.body}</p>
              <span className="mt-5 inline-block text-sm font-medium text-teal-800">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
