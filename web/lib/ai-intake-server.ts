/**
 * Server-side AI intake persistence (Upstash / Vercel KV).
 * Enables cross-tab and cross-device handoff when Redis is configured.
 */

import type { AiTurn } from "@/lib/patient-ai-intake";

const PREFIX = "aw:ai-intake:v1";
const TTL_SEC = 60 * 60 * 24 * 14; // 14 days

export type AiIntakePacket = {
  turns: AiTurn[];
  conversationConcern?: string;
  updatedAt: string;
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

function keyFor(id: string) {
  return `${PREFIX}:${id}`;
}

export function aiIntakeStoreEnabled() {
  return Boolean(redisCreds());
}

export async function loadAiIntake(id: string): Promise<AiIntakePacket | null> {
  if (!id || !redisCreds()) return null;
  try {
    const data = await redisCommand(["GET", keyFor(id)]);
    const raw = data?.result;
    if (!raw) return null;
    const parsed =
      typeof raw === "string" ? (JSON.parse(raw) as AiIntakePacket) : raw;
    return parsed?.turns ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveAiIntake(
  id: string,
  packet: AiIntakePacket
): Promise<boolean> {
  if (!id || !redisCreds()) return false;
  try {
    const payload = JSON.stringify({
      ...packet,
      turns: packet.turns.slice(-24),
      updatedAt: new Date().toISOString(),
    });
    const data = await redisCommand([
      "SET",
      keyFor(id),
      payload,
      "EX",
      TTL_SEC,
    ]);
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function mergeAiIntake(
  id: string,
  incoming: AiIntakePacket
): Promise<AiIntakePacket> {
  const existing = (await loadAiIntake(id)) || {
    turns: [],
    updatedAt: new Date().toISOString(),
  };
  const byKey = new Map<string, AiTurn>();
  for (const t of [...existing.turns, ...incoming.turns]) {
    byKey.set(`${t.role}:${t.at}:${t.content.slice(0, 40)}`, t);
  }
  const turns = [...byKey.values()].slice(-24);
  const merged: AiIntakePacket = {
    turns,
    conversationConcern:
      incoming.conversationConcern || existing.conversationConcern,
    updatedAt: new Date().toISOString(),
  };
  await saveAiIntake(id, merged);
  return merged;
}
