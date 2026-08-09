"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { BookingFormData } from "./appointment-wizard";

const TYPES = [
  { value: "HOMEOPATHY", label: "Homeopathy" },
  { value: "PEDIATRICS", label: "Pediatrics" },
  { value: "FERTILITY", label: "Fertility" },
  { value: "WOMENS_WELLNESS", label: "Women's Wellness" },
  { value: "EMOTIONAL_WELLNESS", label: "Emotional Wellness" },
  { value: "FAMILY_WELLNESS", label: "Family Wellness" },
  { value: "PREVENTIVE_CARE", label: "Preventive Care" },
] as const;

export type AiMatchHint = {
  summary: string;
  specialty: string;
  specialtyLabel: string;
  recommendedDoctorId: string | null;
  recommendedName?: string;
  firstAid?: string[];
  isEmergency?: boolean;
};

interface StepConcernProps {
  data: BookingFormData;
  onChange: (field: keyof BookingFormData, value: string) => void;
  onAiMatch?: (hint: AiMatchHint | null) => void;
  aiMatch?: AiMatchHint | null;
}

export default function StepConcern({
  data,
  onChange,
  onAiMatch,
  aiMatch,
}: StepConcernProps) {
  const [matching, setMatching] = useState(false);
  const lastConcern = useRef("");
  const userLockedSpecialty = useRef(false);
  const onAiMatchRef = useRef(onAiMatch);
  const onChangeRef = useRef(onChange);
  onAiMatchRef.current = onAiMatch;
  onChangeRef.current = onChange;

  useEffect(() => {
    const concern = data.concern.trim();
    if (concern.length < 8) {
      onAiMatchRef.current?.(null);
      return;
    }
    if (concern === lastConcern.current) return;

    const t = setTimeout(async () => {
      setMatching(true);
      try {
        const res = await fetch("/api/ai/match-clinician", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concern, limit: 6 }),
        });
        const json = await res.json();
        if (!json.success) {
          onAiMatchRef.current?.(null);
          return;
        }
        lastConcern.current = concern;
        const top = json.clinicians?.[0];
        const hint: AiMatchHint = {
          summary: json.summary,
          specialty: json.specialty,
          specialtyLabel: json.specialtyLabel,
          recommendedDoctorId: json.recommendedDoctorId,
          recommendedName: top?.name,
          firstAid: json.carePath?.firstAid,
          isEmergency: json.carePath?.isEmergency,
        };
        onAiMatchRef.current?.(hint);
        // Auto-route specialty unless the patient overrode the chip
        if (
          !userLockedSpecialty.current &&
          json.specialty &&
          json.specialty !== data.consultationType
        ) {
          onChangeRef.current("consultationType", json.specialty);
        }
      } catch {
        onAiMatchRef.current?.(null);
      } finally {
        setMatching(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [data.concern, data.consultationType]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          Care need
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Describe your concern — AI maps it to a specialty and ranks clinicians
          in that panel (including doctors you add in Admin).
        </p>
      </div>

      <div>
        <Label htmlFor="concern">Main concern *</Label>
        <Input
          id="concern"
          value={data.concern}
          onChange={(e) => onChange("concern", e.target.value)}
          className="mt-1"
          placeholder="e.g. Seasonal allergies with sleep disruption"
        />
      </div>

      {(matching || aiMatch) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
            aiMatch?.isEmergency
              ? "bg-red-50 text-red-950 ring-red-200"
              : "bg-[#eef6f2] text-teal-950 ring-teal-900/15"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            {matching ? "AI matching…" : "AI care match"}
          </p>
          {aiMatch && !matching && (
            <>
              <p className="mt-1 font-medium">{aiMatch.summary}</p>
              {aiMatch.firstAid?.[0] && (
                <p className="mt-2 text-xs opacity-90">
                  First-aid hint: {aiMatch.firstAid[0]}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div>
        <Label className="mb-2 block">
          Specialty{" "}
          <span className="font-normal text-stone-500">
            (AI suggests · you can override)
          </span>
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TYPES.map((t) => {
            const active = data.consultationType === t.value;
            const aiPick = aiMatch?.specialty === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  userLockedSpecialty.current = true;
                  onChange("consultationType", t.value);
                }}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-teal-800 bg-teal-50 font-semibold text-teal-950"
                    : "border-stone-200 bg-white text-stone-700 hover:border-teal-700/40"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  {t.label}
                  {aiPick && (
                    <span className="rounded-full bg-teal-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      AI
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional context</Label>
        <Textarea
          id="notes"
          rows={4}
          value={data.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          className="mt-1"
          placeholder="Duration, triggers, medications, goals…"
        />
      </div>
    </div>
  );
}
