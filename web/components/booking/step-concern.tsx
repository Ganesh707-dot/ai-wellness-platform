"use client";

import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDebouncedCareMatch } from "@/hooks/use-debounced-care-match";
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
  confidence?: number;
  whyMatched?: string[];
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
  const userLockedSpecialty = useRef(false);
  const lastAutoSpecialty = useRef<string | null>(null);
  const { matching, hint, error } = useDebouncedCareMatch(data.concern);

  useEffect(() => {
    onAiMatch?.(hint);
  }, [hint, onAiMatch]);

  useEffect(() => {
    if (
      !hint?.specialty ||
      userLockedSpecialty.current ||
      (hint.confidence != null && hint.confidence < 0.35)
    ) {
      return;
    }
    if (
      hint.specialty !== data.consultationType &&
      hint.specialty !== lastAutoSpecialty.current
    ) {
      lastAutoSpecialty.current = hint.specialty;
      onChange("consultationType", hint.specialty);
    }
  }, [hint, data.consultationType, onChange]);

  const displayHint = matching ? null : aiMatch ?? hint;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-900 sm:text-3xl">
          Care need
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Describe your concern in a full sentence — AI maps intent to specialty
          (not single keywords like “child” in “child birth”).
        </p>
      </div>

      <div>
        <Label htmlFor="concern">Main concern *</Label>
        <Input
          id="concern"
          value={data.concern}
          onChange={(e) => onChange("concern", e.target.value)}
          className="mt-1"
          placeholder="e.g. Health is not well for mother after child birth"
        />
        <p className="mt-1 text-[11px] text-stone-500">
          Type at least 12 characters — AI preview updates after you pause typing.
        </p>
      </div>

      {(matching || displayHint || error) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
            displayHint?.isEmergency
              ? "bg-red-50 text-red-950 ring-red-200"
              : "bg-[#eef6f2] text-teal-950 ring-teal-900/15"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            {matching ? "AI analyzing sentence intent…" : "AI care match"}
          </p>
          {displayHint && !matching && (
            <>
              <p className="mt-1 font-medium">{displayHint.summary}</p>
              {displayHint.whyMatched?.[0] && (
                <p className="mt-2 text-xs opacity-90">
                  Why: {displayHint.whyMatched.slice(0, 2).join(" · ")}
                </p>
              )}
              {displayHint.firstAid?.[0] && (
                <p className="mt-2 text-xs opacity-90">
                  First-aid hint: {displayHint.firstAid[0]}
                </p>
              )}
            </>
          )}
          {error && !matching && (
            <p className="mt-1 text-xs text-red-800">{error}</p>
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
            const aiPick = displayHint?.specialty === t.value;
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
