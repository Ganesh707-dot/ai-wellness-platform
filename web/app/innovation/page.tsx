import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BioprintLabStudio } from "@/components/innovation/bioprint-lab-studio";

const PILLARS = [
  {
    title: "Regenerative medicine",
    body: "Layer-by-layer tissue constructs support wound healing, cartilage repair, and organ-on-a-chip research.",
  },
  {
    title: "Drug testing",
    body: "3D human tissue models reduce animal testing and improve how compounds are screened before trials.",
  },
  {
    title: "Personalized care",
    body: "Patient-derived cells enable bespoke grafts and precision pathways aligned to individual biology.",
  },
];

export default function InnovationPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#cfe8df_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,#e8dcc8_0%,transparent_45%)]" />

      <section className="relative mx-auto max-w-6xl px-4 pb-8 pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">
          Future of care · Bio-innovation
        </p>
        <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-stone-900 md:text-5xl">
          Living cells as the building blocks of medical innovation
        </h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          Interactive bioprint lab — run a live deposition simulation, switch tissue
          profiles, and trace the full clinical pipeline.
        </p>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <BioprintLabStudio />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-serif text-xl text-teal-950">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-[#eef6f2] px-6 py-8 ring-1 ring-teal-900/10 md:px-10">
          <h2 className="font-serif text-2xl text-stone-900">
            How this connects to AI Wellness
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
            Our platform routes patient concerns through conversational AI, specialty
            intent matching, and clinician encounter handoff — the same pipeline that
            supports regenerative-care referrals, trial eligibility screening, and
            longitudinal recovery coaching.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/ai/concierge?topic=regenerative-care">AI regenerative intake</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/hand-on">Hands-on study guide</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
