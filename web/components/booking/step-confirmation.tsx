"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { BookingFormData } from "./appointment-wizard";
import type { AiMatchHint } from "./step-concern";

export default function StepConfirmation({
  data,
  aiMatch,
}: {
  data: BookingFormData;
  aiMatch?: AiMatchHint | null;
}) {
  const [doctorName, setDoctorName] = useState(
    aiMatch?.recommendedName || "…"
  );

  useEffect(() => {
    if (!data.doctorId) return;
    let cancelled = false;
    fetch(`/api/doctors?pageSize=40`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const hit = (json.doctors || []).find(
          (d: { id: string; name: string }) => d.id === data.doctorId
        );
        if (hit?.name) setDoctorName(hit.name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [data.doctorId]);

  const rows = [
    ["Patient", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Clinician", doctorName],
    ["Specialty", data.consultationType.replaceAll("_", " ")],
    ["Date", data.preferredDate],
    ["Time", data.preferredTime],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          Submit for clinician review
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          This request goes to <strong>{doctorName}</strong> only. AI attaches
          the care pathway; they must Accept before the slot is held.
        </p>
      </div>

      {aiMatch?.summary && (
        <p className="rounded-xl bg-[#eef6f2] px-4 py-3 text-sm text-teal-950 ring-1 ring-teal-900/10">
          {aiMatch.summary}
        </p>
      )}

      <Card className="space-y-3 border-0 bg-[#f4f7f4] p-5 text-sm shadow-none">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-stone-200/70 pb-2 last:border-0"
          >
            <span className="text-stone-500">{k}</span>
            <span className="text-right font-medium text-stone-900">{v}</span>
          </div>
        ))}
        <div>
          <p className="text-stone-500">Concern</p>
          <p className="mt-1 font-medium text-stone-900">{data.concern}</p>
        </div>
      </Card>
    </div>
  );
}
