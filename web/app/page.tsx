import Link from "next/link";
import { PLATFORM_SCALE } from "@/lib/demo-data";
import { HomeAuthCta } from "@/components/home-auth-cta";
import { APP_NAME } from "@/lib/app-brand";

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=2000&q=80"
            alt="Enterprise telehealth clinician studio"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,32,28,0.93)_0%,rgba(12,55,48,0.84)_42%,rgba(20,18,14,0.55)_100%)]" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:min-h-[92vh] md:justify-center md:pb-24 md:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
            {APP_NAME} · Enterprise CDS
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] text-white md:text-6xl">
            The problem-solver platform for fresh doctors
          </h1>
          <p className="mt-5 max-w-xl text-lg text-teal-50/90">
            Permission-based RBAC, patient-to-clinician handoff, and Encounter
            CDS so early-career physicians never open a blank consult. Scalable
            AI-powered wellness operations — clinicians decide.
          </p>
          <HomeAuthCta />

          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/20 pt-8 md:grid-cols-4">
            {[
              [PLATFORM_SCALE.patients.toLocaleString(), "Patients"],
              [PLATFORM_SCALE.doctors.toLocaleString(), "Clinicians"],
              [PLATFORM_SCALE.appointments.toLocaleString(), "Encounters"],
              [PLATFORM_SCALE.aiTriageRuns.toLocaleString(), "CDS assists"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-semibold text-white md:text-3xl">{v}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-teal-100">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <h2 className="font-serif text-3xl text-stone-900 md:text-4xl">
              Enterprise-grade from day one
            </h2>
            <p className="mt-3 max-w-xl text-stone-600">
              Not a simple role dashboard. The platform enforces a permission
              matrix across portals, APIs, and CDS surfaces — with junior
              clinician playbooks, lead escalation, and admin IAM.
            </p>
          </div>
          <div className="rounded-2xl bg-[#0f3d38] p-6 text-sm text-teal-50">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
              Demo credentials
            </p>
            <p className="mt-3 leading-relaxed">
              patient@test.com · doctor@test.com (fresh)
              <br />
              lead@test.com · admin@test.com
              <br />
              password123
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Permission RBAC",
              body: "resource:action grants on middleware + APIs. Roles are policy bundles — PATIENT, DOCTOR, CLINICAL_LEAD, ADMIN.",
              href: "/login",
            },
            {
              title: "Fresh-doctor studio",
              body: "Chief complaint handoff, intent search, red-flag checklists, SOAP CDS — built to solve early-career telehealth risk.",
              href: "/login",
            },
            {
              title: "Patient → clinician loop",
              body: "Guest/Navigator intake becomes clinician-visible encounter intelligence with audit-ready traces.",
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

      <section className="border-y border-stone-200 bg-[#eef4f0] py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:items-center">
          <div className="overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80"
              alt="Clinician using decision support"
              className="h-full min-h-[280px] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-3xl text-stone-900">
              Game-changer for new clinicians
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-stone-700">
              <li>• Never open a blank chart — why-patient-contacted is first</li>
              <li>• Encounter CDS: intent, differentials, red flags, SOAP</li>
              <li>• Escalate to Clinical Lead under RBAC</li>
              <li>• Admin IAM + live permission matrix + audit trail</li>
            </ul>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-md bg-teal-900 px-4 py-2 text-sm font-medium text-white hover:bg-teal-950"
            >
              Demo as fresh doctor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
