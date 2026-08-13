import Link from "next/link";
import { PLATFORM_SCALE } from "@/lib/demo-data";
import { HomeAuthCta } from "@/components/home-auth-cta";
import { APP_NAME } from "@/lib/app-brand";
import { Button } from "@/components/ui/button";
import { BioprintHomePreview } from "@/components/innovation/bioprint-home-preview";

const QUICK_LINKS = [
  {
    href: "/ai/concierge",
    title: "Symptom Navigator",
    desc: "Conversational AI · Groq live · sentence intent",
    accent: "from-teal-600 to-emerald-700",
  },
  {
    href: "/book-appointment",
    title: "Book Consult",
    desc: "AI specialty match → ranked clinicians",
    accent: "from-stone-700 to-teal-900",
  },
  {
    href: "/innovation",
    title: "Bio-Innovation",
    desc: "Bioprinting & regenerative medicine",
    accent: "from-emerald-800 to-teal-950",
  },
  {
    href: "/docs/hand-on",
    title: "Study Guide",
    desc: "Git · Vercel · scenario interviews",
    accent: "from-amber-800 to-stone-800",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=2000&q=80"
            alt="Next-gen telehealth"
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,32,28,0.94)_0%,rgba(12,55,48,0.78)_45%,rgba(20,18,14,0.5)_100%)]" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-4 py-24 md:min-h-[88vh] md:py-28">
          <p className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-100 backdrop-blur">
            {APP_NAME}
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.02] text-white md:text-6xl lg:text-7xl">
            Conversational care that routes to the right clinician
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-teal-50/90">
            Live Groq AI, sentence-based specialty mapping, and full encounter
            handoff — built for telehealth demos that impress at scale.
          </p>
          <HomeAuthCta />

          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              [PLATFORM_SCALE.patients.toLocaleString(), "Patients"],
              [PLATFORM_SCALE.doctors.toLocaleString(), "Clinicians"],
              [PLATFORM_SCALE.appointments.toLocaleString(), "Encounters"],
              ["Live", "Groq AI"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 backdrop-blur"
              >
                <p className="text-2xl font-semibold text-white md:text-3xl">{v}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-teal-100/80">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          Start here
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
              />
              <h2 className="font-serif text-xl text-stone-900 group-hover:text-teal-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-stone-600">{item.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-teal-800">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">
              Regenerative frontier
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-snug text-stone-900 md:text-4xl">
              Interactive 3D bioprint lab
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Explore organ-level 3D models — heart, liver, knee, and full-body graft
              zones — with live deposition simulation powered by public research APIs.
            </p>
            <Button asChild className="mt-6 bg-teal-900 text-white hover:bg-teal-800">
              <Link href="/innovation">Open full lab →</Link>
            </Button>
          </div>
          <div className="relative min-h-[360px] sm:min-h-[420px]">
            <BioprintHomePreview />
            <Link
              href="/innovation"
              className="absolute bottom-4 right-4 z-30 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-950 shadow-lg ring-1 ring-stone-200 hover:bg-teal-50"
            >
              Full lab →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <h2 className="font-serif text-3xl text-stone-900 md:text-4xl">
              Enterprise-grade from day one
            </h2>
            <p className="mt-3 max-w-xl text-stone-600">
              Auth.js RBAC, encounter CDS, AI intake sync, and Healthcare BI —
              permission bundles across patient, clinician, lead, and admin
              portals.
            </p>
          </div>
          <div className="rounded-2xl bg-[#0f3d38] p-6 text-sm text-teal-50">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
              Demo logins · password123
            </p>
            <p className="mt-3 leading-relaxed">
              patient@test.com · doctor@test.com
              <br />
              lead@test.com · admin@test.com
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Live conversational AI",
              body: "Groq LLM + intent engine fallback. Multi-turn context flows to booking and doctor encounter.",
              href: "/ai/concierge",
            },
            {
              title: "Clinician studio",
              body: "Encounter CDS, patient intelligence filters, SOAP drafts, AI-ranked panels.",
              href: "/login",
            },
            {
              title: "Guest → book → doctor",
              body: "Zero-login intake, transcript handoff, specialty chip, ranked clinician match.",
              href: "/guest",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="font-serif text-2xl text-stone-900 group-hover:text-teal-900">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-stone-600">{item.body}</p>
              <span className="mt-5 inline-block text-sm font-medium text-teal-800">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
