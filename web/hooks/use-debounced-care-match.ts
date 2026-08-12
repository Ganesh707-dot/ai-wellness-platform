"use client";

import { useEffect, useRef, useState } from "react";
import type { AiMatchHint } from "@/components/booking/step-concern";

const MIN_CHARS = 12;
const DEBOUNCE_MS = 600;

/**
 * Debounced AI specialty + clinician preview for booking concern field.
 * Aborts stale requests; only fires after user pauses typing.
 */
export function useDebouncedCareMatch(concern: string) {
  const [matching, setMatching] = useState(false);
  const [hint, setHint] = useState<AiMatchHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastFetched = useRef("");

  useEffect(() => {
    const trimmed = concern.trim();
    if (trimmed.length < MIN_CHARS) {
      setHint(null);
      setError(null);
      setMatching(false);
      return;
    }
    if (trimmed === lastFetched.current) return;

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setMatching(true);
      setError(null);

      try {
        const res = await fetch("/api/ai/match-clinician", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concern: trimmed, limit: 6 }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!json.success) {
          setHint(null);
          setError(json.error || "Match failed");
          return;
        }
        lastFetched.current = trimmed;
        const top = json.clinicians?.[0];
        setHint({
          summary: json.summary,
          specialty: json.specialty,
          specialtyLabel: json.specialtyLabel,
          recommendedDoctorId: json.recommendedDoctorId,
          recommendedName: top?.name,
          firstAid: json.carePath?.firstAid,
          isEmergency: json.carePath?.isEmergency,
          confidence: json.intentConfidence,
          whyMatched: json.whyMatched,
        });
      } catch (e) {
        if (!controller.signal.aborted) {
          setHint(null);
          setError("Could not reach AI matcher");
        }
      } finally {
        if (!controller.signal.aborted) setMatching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [concern]);

  return { matching, hint, error, clearHint: () => setHint(null) };
}
