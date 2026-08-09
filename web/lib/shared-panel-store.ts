/**
 * Cross-user clinician panel catalog for serverless.
 * Admin-created specialty panels sync here so patients can book them.
 */

import type { DoctorPanel } from "@/lib/doctor-panel-store";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const KEY = STORAGE_KEYS.sharedPanelsRedis;

function redisCreds() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(command: unknown[]) {
  const creds = redisCreds();
  if (!creds) return null;
  const res = await fetch(creds.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function sharedListPanels(): Promise<DoctorPanel[] | null> {
  if (!redisCreds()) return null;
  try {
    const data = await redisCommand(["GET", KEY]);
    const raw = data?.result;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as DoctorPanel[]) : [];
  } catch {
    return [];
  }
}

export async function sharedWritePanels(
  panels: DoctorPanel[]
): Promise<boolean> {
  if (!redisCreds()) return false;
  try {
    const managed = panels
      .filter((p) => p.source === "managed")
      .slice(0, 80);
    const data = await redisCommand(["SET", KEY, JSON.stringify(managed)]);
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function sharedUpsertPanel(panel: DoctorPanel): Promise<boolean> {
  const existing = await sharedListPanels();
  if (existing === null) return false;
  const next = [
    panel,
    ...existing.filter((p) => p.id !== panel.id),
  ].slice(0, 80);
  return sharedWritePanels(next);
}
