import { NextRequest, NextResponse } from "next/server";
import { BIOPRINT_APPLICATIONS } from "@/lib/bioprint-data";
import { buildBodyModelPayload } from "@/lib/bioprint-anatomy";
import { fetchBioprintLiveData } from "@/lib/bioprint-external-api";

/**
 * GET /api/innovation/body-model
 * API-driven 3D human anatomy config for the bioprint viewer.
 * Query: applicationId, layer, printing (optional)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId") ?? BIOPRINT_APPLICATIONS[0].id;
  const layer = Math.max(0, parseInt(searchParams.get("layer") ?? "0", 10) || 0);
  const printing = searchParams.get("printing") === "true";

  const application =
    BIOPRINT_APPLICATIONS.find((a) => a.id === applicationId) ??
    BIOPRINT_APPLICATIONS[0];

  const live = await fetchBioprintLiveData();

  const payload = buildBodyModelPayload(application, layer, printing, {
    live: live.live,
    fetchedAt: live.fetchedAt,
  });

  return NextResponse.json({
    ...payload,
    liveStats: live.stats,
    sources: live.sources,
    apiVersion: "aw-body-model-v1",
  });
}
