"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { RoleShell } from "@/components/layout/role-shell";

type BiPayload = {
  bi: {
    totals: {
      liveEncounters: number;
      patientsOnPanel: number;
      pendingReview: number;
      confirmed: number;
      highPriority: number;
      riskPatients: number;
    };
    bySpecialty: { id: string; count: number }[];
    byStatus: { id: string; count: number }[];
    byClinician: { id: string; name: string; count: number }[];
    topPathways: { label: string; count: number }[];
    model: string;
  };
  iam: {
    totalUsers: number;
    pendingUsers: number;
    activeClinicians: number;
    bookablePanels: number;
  };
};

function BarRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-stone-800">
          {label.replaceAll("_", " ")}
        </span>
        <span className="text-stone-500">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-teal-800 transition-all"
          style={{ width: `${Math.max(pct, count ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminCareBiPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<BiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/care-bi")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed to load BI");
        setData(j);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const bi = data?.bi;
  const iam = data?.iam;
  const maxSpec = Math.max(...(bi?.bySpecialty.map((x) => x.count) || [1]), 1);
  const maxDoc = Math.max(...(bi?.byClinician.map((x) => x.count) || [1]), 1);

  return (
    <RoleShell role="ADMIN" title="Care intelligence (BI)">
      <div className="mb-6 rounded-2xl bg-[#0f3d38] p-5 text-white sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100">
          Healthcare BI · {bi?.model || "aw-care-bi-v1"}
        </p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
          Specialty load, clinician panels, IAM readiness
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-teal-50/90">
          Live booking demand by specialty + pending clinician activations —
          unique ops view for an AI wellness network, not a generic admin
          dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="bg-white text-teal-950 hover:bg-teal-50">
            <Link href="/admin/users">User management</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/admin/rbac">RBAC guide</Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Live encounters", bi?.totals.liveEncounters],
          ["Pending review", bi?.totals.pendingReview],
          ["High / critical", bi?.totals.highPriority],
          ["Risk patients", bi?.totals.riskPatients],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">
              {value ?? 0}
            </p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", iam?.totalUsers],
          ["Pending activate", iam?.pendingUsers],
          ["Active clinicians", iam?.activeClinicians],
          ["Bookable panels", iam?.bookablePanels],
        ].map(([label, value]) => (
          <Card key={String(label)} className="border-teal-900/10 bg-[#f3f7f4] p-5">
            <p className="text-xs uppercase tracking-wide text-teal-800">
              IAM · {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-teal-950">
              {value ?? 0}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
            Demand by specialty
          </p>
          <div className="space-y-3">
            {(bi?.bySpecialty.length
              ? bi.bySpecialty
              : [{ id: "No live bookings yet", count: 0 }]
            ).map((row) => (
              <BarRow
                key={row.id}
                label={row.id}
                count={row.count}
                max={maxSpec}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
            Load by clinician panel
          </p>
          <div className="space-y-3">
            {(bi?.byClinician.length
              ? bi.byClinician
              : [{ id: "—", name: "No assignments yet", count: 0 }]
            ).map((row) => (
              <BarRow
                key={row.id}
                label={row.name}
                count={row.count}
                max={maxDoc}
              />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
            Encounter status mix
          </p>
          <div className="flex flex-wrap gap-2">
            {(bi?.byStatus || []).map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800"
              >
                {s.id.replaceAll("_", " ")} · {s.count}
              </span>
            ))}
            {!bi?.byStatus?.length && (
              <p className="text-sm text-stone-500">
                Book a consult to populate status analytics.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
            Top AI care pathways
          </p>
          <ul className="space-y-2 text-sm">
            {(bi?.topPathways || []).slice(0, 6).map((p) => (
              <li
                key={p.label}
                className="flex justify-between border-b border-stone-100 pb-2"
              >
                <span className="text-stone-800">{p.label}</span>
                <span className="font-semibold text-teal-900">{p.count}</span>
              </li>
            ))}
            {!bi?.topPathways?.length && (
              <li className="text-stone-500">No pathway volume yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </RoleShell>
  );
}
