"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import type { AiMatchHint } from "./step-concern";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  consultationFee: number;
  bio?: string;
  currency?: string;
  matchScore?: number;
  matchReason?: string;
  aiRecommended?: boolean;
  source?: string;
}

interface StepDoctorProps {
  consultationType: string;
  concern: string;
  selectedDoctorId: string;
  aiMatch?: AiMatchHint | null;
  onChange: (doctorId: string) => void;
}

export default function StepDoctor({
  consultationType,
  concern,
  selectedDoctorId,
  aiMatch,
  onChange,
}: StepDoctorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/match-clinician", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concern: concern || "general wellness consult",
            specialty: consultationType,
            limit: 8,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && Array.isArray(data.clinicians)) {
          setDoctors(data.clinicians);
          setSummary(data.summary || null);
          const preferred =
            aiMatch?.recommendedDoctorId || data.recommendedDoctorId;
          if (preferred && !selectedDoctorId) {
            onChange(preferred);
          } else if (
            selectedDoctorId &&
            !data.clinicians.some((d: Doctor) => d.id === selectedDoctorId)
          ) {
            // Specialty changed — clear stale selection, pick AI top
            if (data.recommendedDoctorId) onChange(data.recommendedDoctorId);
          }
        } else {
          // Fallback list
          const listRes = await fetch(
            `/api/doctors?specialization=${consultationType}&pageSize=8`
          );
          const list = await listRes.json();
          if (!cancelled) {
            setDoctors(Array.isArray(list.doctors) ? list.doctors : []);
            setSummary(null);
          }
        }
      } catch {
        if (!cancelled) {
          setDoctors([]);
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-rank when specialty/concern changes
  }, [consultationType, concern]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          AI-ranked clinicians
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Ranked for{" "}
          <strong>{consultationType.replaceAll("_", " ")}</strong> from your
          concern. The request goes only to the clinician you select — not the
          whole clinic.
        </p>
      </div>

      {summary && (
        <p className="rounded-xl bg-[#eef6f2] px-4 py-3 text-sm text-teal-950 ring-1 ring-teal-900/10">
          {summary}
        </p>
      )}

      {doctors.length === 0 ? (
        <Card className="p-6 text-center text-sm text-stone-600">
          No clinicians for this specialty yet. Ask an admin to add a doctor
          panel under{" "}
          <strong>{consultationType.replaceAll("_", " ")}</strong> in Users →
          Activate, then refresh.
        </Card>
      ) : (
        <div className="grid gap-3">
          {doctors.map((doctor) => {
            const active = selectedDoctorId === doctor.id;
            return (
              <button
                key={doctor.id}
                type="button"
                onClick={() => onChange(doctor.id)}
                className={`rounded-2xl border p-4 text-left transition sm:p-5 ${
                  active
                    ? "border-teal-800 bg-teal-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-teal-700/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {doctor.name}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 ring-1 ring-teal-200">
                      {doctor.specialization.replaceAll("_", " ")}
                    </p>
                    {doctor.matchReason && (
                      <p className="mt-2 text-xs text-stone-600">
                        {doctor.matchReason}
                        {typeof doctor.matchScore === "number"
                          ? ` · ${doctor.matchScore}% fit`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {doctor.aiRecommended && (
                      <span className="rounded-full bg-teal-900 px-2.5 py-1 text-[11px] font-medium text-white">
                        AI pick
                      </span>
                    )}
                    {active && (
                      <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white">
                        Selected
                      </span>
                    )}
                    {doctor.source === "managed" && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-teal-800">
                        Live panel
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-600">
                  <span>{doctor.experience} yrs</span>
                  <span>★ {doctor.rating}</span>
                  <span>
                    ₹{doctor.consultationFee}
                    {doctor.currency ? ` ${doctor.currency}` : ""}
                  </span>
                </div>
                {doctor.bio && (
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                    {doctor.bio}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
