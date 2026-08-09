"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { readClinicBoard, writeClinicBoard } from "@/lib/clinic-board";
import type { LiveEncounter } from "@/lib/demo-store";
import { preferEncounter } from "@/lib/encounter-merge";

/** Sync browser clinic board ↔ server; server decisions win over stale PENDING. */
export function useClinicBoardSync() {
  const { status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const local = readClinicBoard();
        let remote: LiveEncounter[] = [];

        if (local.length > 0) {
          const syncRes = await fetch("/api/bookings/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encounters: local }),
          });
          if (syncRes.ok) {
            const data = await syncRes.json();
            remote = Array.isArray(data.encounters) ? data.encounters : [];
          }
        }

        if (!remote.length) {
          const res = await fetch("/api/bookings/sync");
          if (res.ok) {
            const data = await res.json();
            remote = Array.isArray(data.encounters) ? data.encounters : [];
          }
        }

        if (remote.length && !cancelled) {
          const map = new Map<string, LiveEncounter>();
          for (const e of [...local, ...remote]) {
            const prev = map.get(e.id);
            map.set(e.id, prev ? preferEncounter(prev, e) : e);
          }
          writeClinicBoard([...map.values()]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return ready;
}
