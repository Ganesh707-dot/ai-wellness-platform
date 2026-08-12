import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-[2rem] border border-teal-900/10 bg-[#0f3d38] shadow-[0_40px_80px_-40px_rgba(15,61,56,0.65)]">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[320px] p-8 md:p-12 lg:min-h-[480px]">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 40%, #5eead4 0%, transparent 35%), radial-gradient(circle at 70% 60%, #99f6e4 0%, transparent 30%), radial-gradient(circle at 50% 80%, #14b8a6 0%, transparent 25%)",
                }}
              />
              <div className="relative flex h-full flex-col justify-end">
                <div className="mb-6 flex flex-wrap gap-2">
                  {["Bioink", "3D tissue", "CDS handoff"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-teal-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="font-serif text-3xl leading-snug text-white md:text-4xl">
                  Bioprinting reshapes how tissue is studied, tested, and restored
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white/95 p-8 md:p-12">
              <p className="text-lg leading-relaxed text-stone-700">
                Living cells are becoming the building blocks of medical
                innovation. By depositing cell-rich bioinks layer by layer,
                bioprinting creates three-dimensional tissue structures for
                regenerative medicine, drug testing, and personalized care.
              </p>
              <p className="mt-5 text-lg leading-relaxed text-stone-700">
                While fully functional organs remain a future goal, the
                technology is steadily reshaping how human tissue can be studied,
                tested, and restored.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/ai/concierge">Discuss with AI Navigator</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/book-appointment">Book wellness consult</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-serif text-xl text-teal-950">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-[#eef6f2] px-6 py-8 ring-1 ring-teal-900/10 md:px-10">
          <h2 className="font-serif text-2xl text-stone-900">
            How this connects to AI Wellness
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
            Our platform routes patient concerns through conversational AI,
            specialty intent matching, and clinician encounter handoff — the same
            pipeline that would support regenerative-care referrals, trial
            eligibility screening, and longitudinal recovery coaching.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href="/docs/hand-on"
              className="font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              Hands-on study guide →
            </Link>
            <Link
              href="/ai"
              className="font-medium text-teal-800 underline-offset-2 hover:underline"
            >
              AI tools hub →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
