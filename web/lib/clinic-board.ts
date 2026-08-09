/** Client-side clinic board — bridges patient → doctor on the same browser. */

import type { LiveEncounter } from "@/lib/demo-store";
import { STORAGE_KEYS } from "@/lib/storage-keys";

function boardKeyCandidates() {
  return [STORAGE_KEYS.clinicBoard, STORAGE_KEYS.legacyClinicBoard];
}

export function readClinicBoard(): LiveEncounter[] {
  if (typeof window === "undefined") return [];
  try {
    for (const key of boardKeyCandidates()) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LiveEncounter[];
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function upsertClinicBoard(encounter: LiveEncounter) {
  if (typeof window === "undefined") return;
  const prev = readClinicBoard().filter((e) => e.id !== encounter.id);
  const next = [encounter, ...prev].slice(0, 20);
  localStorage.setItem(STORAGE_KEYS.clinicBoard, JSON.stringify(next));
}

export function writeClinicBoard(list: LiveEncounter[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEYS.clinicBoard,
    JSON.stringify(list.slice(0, 20))
  );
}
