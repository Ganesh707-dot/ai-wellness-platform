/**
 * Patient ↔ AI conversation transcript — flows to booking & clinician view.
 */

import { STORAGE_KEYS } from "@/lib/storage-keys";

export type AiTurn = {
  role: "user" | "assistant";
  content: string;
  intentLabel?: string;
  specialty?: string;
  intentScore?: number;
  mode?: string;
  at: string;
};

function key() {
  return STORAGE_KEYS.aiTranscript;
}

export function readAiTranscript(): AiTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      sessionStorage.getItem(key()) ||
      sessionStorage.getItem(STORAGE_KEYS.legacyAiTranscript);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AiTurn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAiTurn(turn: Omit<AiTurn, "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const prev = readAiTranscript();
  const next: AiTurn[] = [
    ...prev,
    { ...turn, at: turn.at || new Date().toISOString() },
  ].slice(-24);
  try {
    sessionStorage.setItem(key(), JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearAiTranscript() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key());
}

/** Compact packet for doctor encounter / booking notes */
export function summarizeTranscriptForDoctor(maxTurns = 6): string {
  const turns = readAiTranscript().slice(-maxTurns);
  if (!turns.length) return "";
  const lines = turns.map((t) => {
    const tag =
      t.role === "user" && t.intentLabel
        ? ` [intent: ${t.intentLabel}${t.intentScore ? ` ${t.intentScore.toFixed(1)}` : ""}]`
        : "";
    return `${t.role === "user" ? "Patient" : "AI"}: ${t.content.slice(0, 220)}${tag}`;
  });
  return `Symptom Navigator transcript:\n${lines.join("\n")}`;
}

export function latestIntentFromTranscript() {
  const userTurns = readAiTranscript().filter((t) => t.role === "user");
  const last = userTurns[userTurns.length - 1];
  return last
    ? {
        label: last.intentLabel,
        specialty: last.specialty,
        score: last.intentScore,
        concern: last.content,
      }
    : null;
}
