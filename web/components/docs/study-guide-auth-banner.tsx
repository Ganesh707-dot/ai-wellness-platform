import { ShieldCheck, UserCircle2 } from "lucide-react";
import type { Session } from "next-auth";

export function StudyGuideAuthBanner({ session }: { session: Session }) {
  const role = session.user?.role ?? "USER";
  const email = session.user?.email ?? "";
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];

  return (
    <div className="mb-8 rounded-2xl border border-teal-900/15 bg-gradient-to-r from-[#eef6f2] via-white to-[#eef6f2] px-4 py-4 shadow-sm md:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-800">
              Enterprise IAM · RBAC enforced
            </p>
            <p className="mt-1 text-sm text-stone-700">
              This study guide is protected by NextAuth JWT sessions and permission{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-teal-900">
                content:study_guide
              </code>
              . Middleware blocks unauthenticated and unauthorized access — not UI-only hiding.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
          <UserCircle2 className="h-4 w-4 text-teal-800" />
          <div>
            <p className="font-medium text-stone-900">{email}</p>
            <p className="text-[10px] uppercase tracking-wider text-teal-700">
              {role.replace("_", " ")} · {permissions.length} grants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
