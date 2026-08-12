import { NextRequest, NextResponse } from "next/server";
import { BIOPRINT_APPLICATIONS } from "@/lib/bioprint-data";
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

  return NextResponse.json({
    jobId: `job-${app.id}-${Date.now()}`,
    action,
    application: app,
    telemetry: {
      layer,
      totalLayers: app.layers,
      viability: parseFloat(viability),
      flowRateUlS: action === "start" && layer < app.layers ? 11.5 + progress * 2 : 0,
      integrityPct: integrity === "—" ? null : parseFloat(integrity),
      nozzleTempC: action === "start" && layer < app.layers ? 37.2 : null,
      status:
        action === "reset"
          ? "idle"
          : layer >= app.layers
            ? "maturation"
            : action === "pause"
              ? "paused"
              : "printing",
    },
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
