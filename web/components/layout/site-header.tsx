"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { homeForRole } from "@/lib/rbac";
import { APP_NAME } from "@/lib/app-brand";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const signedIn = status === "authenticated" && Boolean(session?.user);

  const workspaceHref = homeForRole(role);
  const logoHref = signedIn ? workspaceHref : "/";
  const aiHref =
    role === "DOCTOR" || role === "CLINICAL_LEAD"
      ? "/doctor/copilot"
      : "/ai/concierge";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f4f7f4]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <Link
          href={logoHref}
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-teal-950"
        >
          {APP_NAME}
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-stone-700 md:gap-4">
          <Link href={aiHref} className="hover:text-teal-900">
            {role === "DOCTOR" || role === "CLINICAL_LEAD"
              ? "Encounter CDS"
              : "Symptom Navigator"}
          </Link>
          <Link href="/innovation" className="hover:text-teal-900">
            Innovation
          </Link>
          <Link
            href="/articles"
            className="hidden hover:text-teal-900 md:inline"
          >
            Knowledge
          </Link>
          {!signedIn && (
            <Link href="/guest" className="hover:text-teal-900">
              Guest intake
            </Link>
          )}
          {(role === "PATIENT" || !signedIn) && (
            <Link
              href="/book-appointment"
              className="hidden hover:text-teal-900 sm:inline"
            >
              Book
            </Link>
          )}

          {status === "loading" ? (
            <span className="rounded-md bg-stone-200 px-3 py-1.5 text-xs text-stone-500">
              …
            </span>
          ) : signedIn ? (
            <>
              <Link
                href={workspaceHref}
                className="rounded-md border border-teal-800/20 bg-white px-3 py-1.5 text-teal-950 hover:bg-teal-50"
              >
                {role === "DOCTOR" || role === "CLINICAL_LEAD"
                  ? "Clinician studio"
                  : role === "ADMIN"
                    ? "Admin console"
                    : "Patient portal"}
              </Link>
              <span className="hidden max-w-[140px] truncate text-xs text-stone-500 lg:inline">
                {session?.user?.name || session?.user?.email}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-teal-900 px-3 py-1.5 text-white hover:bg-teal-950"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
