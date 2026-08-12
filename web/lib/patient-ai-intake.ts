/**
 * Patient ↔ AI conversation transcript — flows to booking & clinician view.
 * Persists in localStorage + optional server sync (Redis) for cross-device handoff.
 */

import { STORAGE_KEYS } from "@/lib/storage-keys";

export type AiTurn = {
  role: "user" | "assistant";
  content: string;
  intentLabel?: string;
  specialty?: string;
  intentScore?: number;
  whyMatched?: string[];
  mode?: string;
  at: string;
};

const DEVICE_KEY = "aw_device_session_v1";
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastConversationConcern = "";

function storageKey() {
  return STORAGE_KEYS.aiTranscript;
}

function readRaw(): AiTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(storageKey()) ||
      sessionStorage.getItem(storageKey()) ||
      sessionStorage.getItem(STORAGE_KEYS.legacyAiTranscript);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AiTurn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(turns: AiTurn[]) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(turns.slice(-24));
  try {
    localStorage.setItem(storageKey(), payload);
    sessionStorage.setItem(storageKey(), payload);
  } catch {
    try {
      sessionStorage.setItem(storageKey(), payload);
    } catch {
      /* quota */
    }
  }
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev_${Date.now()}`;
  }
}

export function readAiTranscript(): AiTurn[] {
  return readRaw();
}

export function setConversationConcern(text: string) {
  lastConversationConcern = text.trim();
}

export function getConversationConcern(): string {
  if (lastConversationConcern) return lastConversationConcern;
  const users = readRaw().filter((t) => t.role === "user");
  return users.map((t) => t.content).join(". ");
}

export function appendAiTurn(turn: Omit<AiTurn, "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const prev = readRaw();
  const next: AiTurn[] = [
    ...prev,
    { ...turn, at: turn.at || new Date().toISOString() },
  ].slice(-24);
  writeRaw(next);
  scheduleServerSync();
}

export function replaceAiTranscript(turns: AiTurn[]) {
  writeRaw(turns.slice(-24));
}

export function clearAiTranscript() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey());
  sessionStorage.removeItem(storageKey());
  sessionStorage.removeItem(STORAGE_KEYS.legacyAiTranscript);
  lastConversationConcern = "";
}

function scheduleServerSync() {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncAiIntakeToServer(getDeviceId());
  }, 400);
}

export async function syncAiIntakeToServer(deviceId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const id = deviceId || getDeviceId();
  const turns = readRaw();
  if (!id) return false;
  try {
    const res = await fetch("/api/ai/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: id,
        turns,
        conversationConcern: getConversationConcern() || undefined,
      }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function hydrateAiTranscriptFromServer(
  deviceId?: string
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const id = deviceId || getDeviceId();
  try {
    const res = await fetch(
      `/api/ai/intake?deviceId=${encodeURIComponent(id)}`
    );
    const data = await res.json();
    if (!data.success || !data.packet?.turns?.length) return false;

    const local = readRaw();
    const remote = data.packet.turns as AiTurn[];
    if (remote.length <= local.length && local.length > 0) return false;

    replaceAiTranscript(remote);
    if (data.packet.conversationConcern) {
      lastConversationConcern = data.packet.conversationConcern;
    }
    return true;
  } catch {
    return false;
  }
}

/** Compact packet for doctor encounter / booking notes */
export function summarizeTranscriptForDoctor(maxTurns = 8): string {
  const turns = readRaw().slice(-maxTurns);
  if (!turns.length) return "";

  const lastIntent = [...turns]
    .reverse()
    .find((t) => t.role === "assistant" && (t.intentLabel || t.specialty));

  const header = lastIntent
    ? `AI intent summary: ${lastIntent.intentLabel || "matched"} → ${lastIntent.specialty || "—"}${
        lastIntent.intentScore != null
          ? ` (score ${lastIntent.intentScore.toFixed(1)})`
          : ""
      }${
        lastIntent.whyMatched?.length
          ? `\nWhy matched: ${lastIntent.whyMatched.slice(0, 3).join(" · ")}`
          : ""
      }\n`
    : "";

  const lines = turns.map((t) => {
    const tag =
      t.role === "assistant" && (t.intentLabel || t.specialty)
        ? ` [→ ${t.specialty || "—"}${t.intentLabel ? ` · ${t.intentLabel}` : ""}${
            t.intentScore != null ? ` ${t.intentScore.toFixed(1)}` : ""
          }]`
        : "";
    return `${t.role === "user" ? "Patient" : "AI"}: ${t.content.slice(0, 220)}${tag}`;
  });

  return `${header}Symptom Navigator transcript:\n${lines.join("\n")}`;
}

export function latestIntentFromTranscript() {
  const assistantTurns = readRaw().filter((t) => t.role === "assistant");
  const last = [...assistantTurns]
    .reverse()
    .find((t) => t.intentLabel || t.specialty);
  const userLines = readRaw()
    .filter((t) => t.role === "user")
    .map((t) => t.content);
  return last || userLines.length
    ? {
        label: last?.intentLabel,
        specialty: last?.specialty,
        score: last?.intentScore,
        concern: userLines.join(". "),
        whyMatched: last?.whyMatched,
      }
    : null;
}

export function buildBookingIntakePayload() {
  const summary = summarizeTranscriptForDoctor();
  const concern = getConversationConcern();
  const latest = latestIntentFromTranscript();
  return {
    aiIntakeSummary: summary,
    conversationConcern: concern || latest?.concern || "",
  };
}
