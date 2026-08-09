import type { LiveEncounter } from "@/lib/demo-store";

/** Higher = more terminal / preferred over stale PENDING copies */
const STATUS_RANK: Record<string, number> = {
  PENDING_REVIEW: 1,
  SCHEDULED: 2,
  CONFIRMED: 3,
  DECLINED: 3,
  CANCELLED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

/**
 * Prefer clinician decisions over stale clinic-board PENDING snapshots.
 * Fixes: Accept → hard refresh → sync re-uploads old PENDING and clobbers CONFIRMED.
 */
export function preferEncounter(
  a: LiveEncounter,
  b: LiveEncounter
): LiveEncounter {
  const ra = STATUS_RANK[a.status] ?? 0;
  const rb = STATUS_RANK[b.status] ?? 0;
  if (ra !== rb) return ra > rb ? a : b;

  if (a.decidedAt && b.decidedAt) {
    return +new Date(a.decidedAt) >= +new Date(b.decidedAt) ? a : b;
  }
  if (a.decidedAt) return a;
  if (b.decidedAt) return b;

  return +new Date(a.createdAt) >= +new Date(b.createdAt) ? a : b;
}

export function mergeEncounterLists(
  ...lists: LiveEncounter[][]
): LiveEncounter[] {
  const map = new Map<string, LiveEncounter>();
  for (const list of lists) {
    for (const e of list) {
      if (!e?.id) continue;
      const prev = map.get(e.id);
      map.set(e.id, prev ? preferEncounter(prev, e) : e);
    }
  }
  return [...map.values()];
}
