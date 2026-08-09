import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  getLiveEncounter,
  listLiveEncounters,
  saveLiveEncounter,
  type LiveEncounter,
} from "@/lib/demo-store";
import { preferEncounter } from "@/lib/encounter-merge";

/**
 * Import live bookings from the browser clinic board into the httpOnly cookie
 * store. Never let a stale PENDING snapshot overwrite Accept/Decline.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    encounters?: LiveEncounter[];
  };
  const incoming = Array.isArray(body.encounters) ? body.encounters : [];
  if (incoming.length === 0) {
    const existing = await listLiveEncounters();
    return NextResponse.json({ ok: true, imported: 0, total: existing.length });
  }

  let imported = 0;
  for (const raw of incoming.slice(0, 20)) {
    if (!raw?.id || !raw?.concern || !raw?.doctorId) continue;
    const candidate: LiveEncounter = {
      ...raw,
      source: "live-booking",
      patientEmail: (raw.patientEmail || "").toLowerCase(),
    };
    const existing = await getLiveEncounter(candidate.id);
    const winner = existing
      ? preferEncounter(existing, candidate)
      : candidate;
    await saveLiveEncounter(winner);
    imported += 1;
  }

  const all = await listLiveEncounters();
  return NextResponse.json({
    ok: true,
    imported,
    total: all.length,
    encounters: all,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await listLiveEncounters();
  return NextResponse.json({ encounters: all });
}
