import Link from "next/link";
import { APP_NAME, LIVE_SITE_URL } from "@/lib/app-brand";

const FOOTER_LINKS = {
  ai: [
    { href: "/ai/concierge", label: "Symptom Navigator" },
    { href: "/ai/wellness-coach", label: "Wellness Coach" },
    { href: "/ai/symptom-checker", label: "Structured Triage" },
    { href: "/guest", label: "Guest Intake" },
    { href: "/api/ai/status", label: "Live AI Status", external: true },
  ],
  care: [
    { href: "/book-appointment", label: "Book Consult" },
    { href: "/articles", label: "Knowledge Hub" },
    { href: "/innovation", label: "Bio-Innovation" },
    { href: "/about", label: "About Platform" },
  ],
  portals: [
    { href: "/login", label: "Sign In" },
    { href: "/register", label: "Register" },
    { href: "/dashboard", label: "Patient Portal" },
    { href: "/doctor", label: "Clinician Studio" },
    { href: "/admin", label: "Admin Console" },
  ],
  learn: [
    { href: "/docs/hand-on", label: "Study Guide · Secured" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-teal-900/10 bg-[linear-gradient(180deg,#0f3d38_0%,#0a2824_100%)] text-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-[family-name:var(--font-display)] text-2xl text-white">
              {APP_NAME}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-teal-100/85">
              Enterprise AI wellness — conversational intake, sentence-based
              specialty routing, clinician handoff, and regenerative medicine
              innovation stories. Clinical decision support only.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/ai/concierge"
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-teal-950 transition hover:bg-teal-50"
              >
                Try AI Navigator
              </Link>
              <Link
                href="/book-appointment"
                className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Book Clinician
              </Link>
            </div>
          </div>

          {(
            [
              ["AI Tools", FOOTER_LINKS.ai],
              ["Care & Innovation", FOOTER_LINKS.care],
              ["Portals", FOOTER_LINKS.portals],
              ["Study & Legal", FOOTER_LINKS.learn],
            ] as const
          ).map(([title, links]) => (
            <div key={title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200">
                {title}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {links.map((l) => (
                  <li key={l.href}>
                    {"external" in l && l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-100/90 transition hover:text-white"
                      >
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-teal-100/90 transition hover:text-white"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-8 text-xs text-teal-200/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. Demo platform — not emergency care.</p>
          <p>
            Live:{" "}
            <a
              href={LIVE_SITE_URL}
              className="underline hover:text-white"
            >
              {LIVE_SITE_URL.replace(/^https:\/\//, "")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
