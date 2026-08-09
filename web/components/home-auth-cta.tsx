"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { homeForRole } from "@/lib/rbac";

/** Landing primary actions — route by auth so clinicians are not sent to /login. */
export function HomeAuthCta() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const signedIn = status === "authenticated" && Boolean(session?.user);
  const home = homeForRole(role);

  if (status === "loading") {
    return (
      <div className="mt-8 h-10 w-64 animate-pulse rounded-md bg-white/20" />
    );
  }

  if (signedIn) {
    const label =
      role === "DOCTOR" || role === "CLINICAL_LEAD"
        ? "Back to clinician studio"
        : role === "ADMIN"
          ? "Open admin console"
          : "Open patient portal";

    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={home}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50"
        >
          {label}
        </Link>
        <Link
          href={
            role === "DOCTOR" || role === "CLINICAL_LEAD"
              ? "/doctor/appointments"
              : "/book-appointment"
          }
          className="rounded-md border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          {role === "DOCTOR" || role === "CLINICAL_LEAD"
            ? "Open schedule inbox"
            : "Book a consult"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/login"
        className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-teal-950 hover:bg-teal-50"
      >
        Sign in to workspace
      </Link>
      <Link
        href="/guest"
        className="rounded-md border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
      >
        Guest intake
      </Link>
    </div>
  );
}
