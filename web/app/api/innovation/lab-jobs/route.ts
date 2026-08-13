import { NextRequest, NextResponse } from "next/server";
import { BIOPRINT_APPLICATIONS } from "@/lib/bioprint-data";
import { ANATOMY_REGIONS, buildBodyModelPayload } from "@/lib/bioprint-anatomy";
import { fetchBioprintLiveData } from "@/lib/bioprint-external-api";

type JobAction = "start" | "pause" | "reset";

/**
 * POST /api/innovation/lab-jobs
 * Server-side print job orchestration — validates profile, returns telemetry baseline
 * seeded from live ClinicalTrials.gov + PubMed data.
 */
export async function POST(req: NextRequest) {
  let body: { action?: JobAction; applicationId?: string; layer?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const app =
    BIOPRINT_APPLICATIONS.find((a) => a.id === body.applicationId) ??
    BIOPRINT_APPLICATIONS[0];

  const live = await fetchBioprintLiveData();
  const action = body.action ?? "start";
  const layer = Math.max(0, Math.min(body.layer ?? 0, app.layers));

  const progress = app.layers > 0 ? layer / app.layers : 0;
  const viability = (88 + progress * (app.viabilityTarget - 88)).toFixed(1);
  const integrity = layer > 0 ? Math.min(99.2, 92 + progress * 7).toFixed(1) : "—";
  const region = ANATOMY_REGIONS[app.id] ?? ANATOMY_REGIONS.skin;
  const printing = action === "start" && layer < app.layers;

  const bodyModel = buildBodyModelPayload(
    app,
    layer,
    printing,
    { live: live.live, fetchedAt: live.fetchedAt }
  );

  return NextResponse.json({
    jobId: `job-${app.id}-${Date.now()}`,
    action,
    application: app,
    telemetry: {
      layer,
      totalLayers: app.layers,
      viability: parseFloat(viability),
      flowRateUlS: printing ? 11.5 + progress * 2 + Math.sin(layer) * 0.3 : 0,
      integrityPct: integrity === "—" ? null : parseFloat(integrity),
      nozzleTempC: printing ? 36.8 + progress * 0.6 : null,
      status:
        action === "reset"
          ? "idle"
          : layer >= app.layers
            ? "maturation"
            : action === "pause"
              ? "paused"
              : printing
                ? "printing"
                : "idle",
    },
    printResults: {
      depositedVolumeUl: Math.round(layer * 4.2 * 10) / 10,
      layerHeightMm: 0.05,
      crosslinkPct: layer > 0 ? Math.min(99, 78 + progress * 20).toFixed(1) : null,
      constructQuality:
        action === "reset" || layer === 0
          ? "idle"
          : progress >= 1
            ? "clinical-grade"
            : progress > 0.5
              ? "acceptable"
              : "forming",
      meshProgress: progress,
      organ: region.organ,
      regionLabel: region.label,
      tissueLabel: region.tissueLabel,
      deposition: bodyModel.deposition,
    },
    bodyModel,
    liveContext: {
      bioprintTrials: live.stats.bioprintTrials,
      pubMedArticles: live.stats.pubMedArticles,
      fetchedAt: live.fetchedAt,
      live: live.live,
    },
  });
}

/** GET /api/innovation/lab-jobs — health check */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/innovation/lab-jobs",
    methods: ["GET", "POST"],
    postBody: { action: "start|pause|reset", applicationId: "skin|cartilage|...", layer: 0 },
  });
}
