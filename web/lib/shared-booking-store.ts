/**
 * Cross-user booking persistence for serverless.
 * Uses Upstash Redis REST / Vercel KV when env is configured.
 */

import type { LiveEncounter } from "@/lib/demo-store";

import { STORAGE_KEYS } from "@/lib/storage-keys";

const KEY = STORAGE_KEYS.sharedEncountersRedis;

export type SharedCompact = {
  id: string;
  pn: string;
  pe: string;
  pid: string;
  dn: string;
  did: string;
  ct: string;
  st: LiveEncounter["status"];
  at: string;
  c: string;
  n?: string;
  mc: string;
  cr: string;
  pb: LiveEncounter["priorityBand"];
  rs: number;
  dat?: string;
  dby?: string;
  dnote?: string;
};

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

export function encounterToSharedCompact(e: LiveEncounter): SharedCompact {
  return {
    id: e.id,
    pn: e.patientName,
    pe: e.patientEmail,
    pid: e.patientId,
    dn: e.doctorName,
    did: e.doctorId,
    ct: e.consultationType,
    st: e.status,
    at: e.scheduledAt,
    c: e.concern.slice(0, 280),
    n: e.notes?.slice(0, 120),
    mc: e.meetingCode,
    cr: e.createdAt,
    pb: e.priorityBand,
    rs: e.riskScore,
    dat: e.decidedAt,
    dby: e.decidedBy,
    dnote: e.decisionNote?.slice(0, 160),
  };
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

export function sharedStoreEnabled() {
  return Boolean(redisCreds());
}

export async function sharedListCompacts(): Promise<SharedCompact[] | null> {
  if (!redisCreds()) return null;
  try {
    const data = await redisCommand(["GET", KEY]);
    const raw = data?.result;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as SharedCompact[]) : [];
  } catch {
    return [];
  }
}

export async function sharedWriteCompacts(
  list: SharedCompact[]
): Promise<boolean> {
  if (!redisCreds()) return false;
  try {
    const data = await redisCommand([
      "SET",
      KEY,
      JSON.stringify(list.slice(0, 40)),
    ]);
    return Boolean(data);
  } catch {
    return false;
  }
}

const STATUS_RANK: Record<string, number> = {
  PENDING_REVIEW: 1,
  SCHEDULED: 2,
  CONFIRMED: 3,
  DECLINED: 3,
  CANCELLED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

function preferCompact(a: SharedCompact, b: SharedCompact): SharedCompact {
  const ra = STATUS_RANK[a.st] ?? 0;
  const rb = STATUS_RANK[b.st] ?? 0;
  if (ra !== rb) return ra > rb ? a : b;
  if (a.dat && b.dat) return +new Date(a.dat) >= +new Date(b.dat) ? a : b;
  if (a.dat) return a;
  if (b.dat) return b;
  return +new Date(a.cr) >= +new Date(b.cr) ? a : b;
}

export async function sharedUpsertEncounter(
  encounter: LiveEncounter
): Promise<boolean> {
  const existing = await sharedListCompacts();
  if (existing === null) return false;
  const compact = encounterToSharedCompact(encounter);
  const prev = existing.find((e) => e.id === compact.id);
  const winner = prev ? preferCompact(prev, compact) : compact;
  const next = [
    winner,
    ...existing.filter((e) => e.id !== winner.id),
  ].slice(0, 40);
  return sharedWriteCompacts(next);
}
