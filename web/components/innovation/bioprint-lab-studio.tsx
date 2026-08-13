"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BIOPRINT_APPLICATIONS,
  BIOPRINT_ENTERPRISE_STATS,
  BIOPRINT_PIPELINE,
} from "@/lib/bioprint-data";
import type { BodyModelPayload } from "@/lib/bioprint-anatomy";
import {
  Bioprint3DViewer,
  type Bioprint3DViewerHandle,
} from "@/components/innovation/bioprint-3d-viewer";
import {
  BioprintEnterpriseTelemetry,
  type DepositionState,
  type PrintTelemetry,
} from "@/components/innovation/bioprint-enterprise-telemetry";

type LogEntry = { id: number; time: string; message: string; level: "info" | "ok" | "warn" };

type LiveTrial = {
  nctId: string;
  title: string;
  status: string;
  organization: string;
  url: string;
};

type LiveDataPayload = {
  fetchedAt: string;
  live: boolean;
  error?: string;
  sources: { clinicalTrialsGov: string; pubMed: string };
  stats: {
    bioprintTrials: number;
    recruitingTrials: number;
    pubMedArticles: number;
    tissueEngineeringTrials: number;
  };
  organResearch?: {
    brain: { pubMedArticles: number; label: string };
    kidney: { pubMedArticles: number; label: string };
  };
  recentTrials: LiveTrial[];
};

function nowStamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const DEFAULT_TELEMETRY: PrintTelemetry = {
  viability: 91.2,
  flowRateUlS: 0,
  integrityPct: null,
  nozzleTempC: null,
  layer: 0,
  totalLayers: 24,
  status: "idle",
};

export function BioprintLabStudio({ compact = false }: { compact?: boolean }) {
  const viewerRef = useRef<Bioprint3DViewerHandle>(null);
  const [appId, setAppId] = useState(BIOPRINT_APPLICATIONS[0].id);
  const [stageId, setStageId] = useState("deposition");
  const [printing, setPrinting] = useState(false);
  const [layer, setLayer] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [liveData, setLiveData] = useState<LiveDataPayload | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<PrintTelemetry>(DEFAULT_TELEMETRY);
  const [bodyModel, setBodyModel] = useState<BodyModelPayload | null>(null);
  const [constructQuality, setConstructQuality] = useState<string>("idle");
  const logId = useRef(0);
  const [jobId, setJobId] = useState<string | null>(null);

  const app = useMemo(
    () => BIOPRINT_APPLICATIONS.find((a) => a.id === appId) ?? BIOPRINT_APPLICATIONS[0],
    [appId]
  );

  const pushLog = useCallback((message: string, level: LogEntry["level"] = "info") => {
    logId.current += 1;
    setLogs((prev) =>
      [{ id: logId.current, time: nowStamp(), message, level }, ...prev].slice(0, 8)
    );
  }, []);

  useEffect(() => {
    fetch("/api/innovation/live-data")
      .then((r) => r.json())
      .then((data: LiveDataPayload) => {
        setLiveData(data);
        if (data.live) {
          pushLog(
            `Live API sync — ${data.stats.bioprintTrials} bioprint trials · ${data.stats.pubMedArticles.toLocaleString()} PubMed articles`,
            "ok"
          );
        } else {
          pushLog(`API fallback — ${data.error ?? "offline"}`, "warn");
        }
      })
      .catch(() => pushLog("Could not reach /api/innovation/live-data", "warn"))
      .finally(() => setLiveLoading(false));
  }, [pushLog]);

  const syncJob = useCallback(
    async (action: "start" | "pause" | "reset", currentLayer: number) => {
      try {
        const res = await fetch("/api/innovation/lab-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, applicationId: appId, layer: currentLayer }),
        });
        const data = await res.json();
        if (data.jobId) setJobId(data.jobId);
        if (data.telemetry) {
          setTelemetry({
            viability: data.telemetry.viability,
            flowRateUlS: data.telemetry.flowRateUlS,
            integrityPct: data.telemetry.integrityPct,
            nozzleTempC: data.telemetry.nozzleTempC,
            layer: data.telemetry.layer,
            totalLayers: data.telemetry.totalLayers,
            status: data.telemetry.status,
          });
        }
        if (data.printResults?.constructQuality) {
          setConstructQuality(data.printResults.constructQuality);
        }
        if (data.bodyModel) setBodyModel(data.bodyModel);
        return data;
      } catch {
        return null;
      }
    },
    [appId]
  );

  const fetchBodyModel = useCallback(async (currentLayer: number, isPrinting: boolean) => {
    try {
      const params = new URLSearchParams({
        applicationId: appId,
        layer: String(currentLayer),
        printing: String(isPrinting),
      });
      const res = await fetch(`/api/innovation/body-model?${params}`);
      const data = (await res.json()) as BodyModelPayload;
      setBodyModel(data);
      if (data.printResults?.constructQuality) {
        setConstructQuality(data.printResults.constructQuality);
      }
    } catch {
      /* keep last payload */
    }
  }, [appId]);

  useEffect(() => {
    void fetchBodyModel(layer, printing);
  }, [appId, layer, printing, fetchBodyModel]);

  const reset = useCallback(() => {
    setPrinting(false);
    setLayer(0);
    setConstructQuality("idle");
    setJobId(null);
    viewerRef.current?.resetView();
    void syncJob("reset", 0);
    pushLog("Print cycle reset — viewport & deposition cleared", "warn");
  }, [pushLog, syncJob]);

  const stepLayerBack = useCallback(() => {
    setLayer((prev) => {
      const next = Math.max(0, prev - 1);
      void syncJob(printing ? "start" : "pause", next);
      pushLog(`Layer rewind → L${next}/${app.layers}`, "info");
      return next;
    });
  }, [app.layers, printing, pushLog, syncJob]);

  const stepLayerForward = useCallback(() => {
    setLayer((prev) => {
      const next = Math.min(app.layers, prev + 1);
      if (next >= app.layers) {
        setPrinting(false);
        setStageId("maturation");
        pushLog(`Construct complete — ${app.layers} layers`, "ok");
      } else {
        pushLog(`Layer advance → L${next}/${app.layers}`, "info");
      }
      void syncJob(printing ? "start" : "pause", next);
      return next;
    });
  }, [app.layers, printing, pushLog, syncJob]);

  const startPrint = useCallback(() => {
    if (printing) return;
    setLayer(0);
    setPrinting(true);
    setStageId("deposition");
    void syncJob("start", 0);
    pushLog(`Initiating ${app.name} — ${app.bioink}`, "ok");
  }, [app, printing, pushLog, syncJob]);

  const resumePrint = useCallback(() => {
    if (printing) return;
    setPrinting(true);
    setStageId("deposition");
    void syncJob("start", layer);
    pushLog(`Resuming at layer ${layer}/${app.layers} — deposition continues`, "ok");
  }, [app.layers, layer, printing, pushLog, syncJob]);

  const pausePrint = useCallback(() => {
    setPrinting(false);
    void syncJob("pause", layer);
    pushLog(`Paused at layer ${layer}/${app.layers} — inspect view, then Resume`, "info");
  }, [app.layers, layer, pushLog, syncJob]);

  const playOrResume = useCallback(() => {
    const canResume = layer > 0 && layer < app.layers;
    if (canResume) resumePrint();
    else startPrint();
  }, [app.layers, layer, resumePrint, startPrint]);

  useEffect(() => {
    if (!printing) return;

    const layerTimer = window.setInterval(() => {
      setLayer((prev) => {
        const next = prev + 1;
        if (next >= app.layers) {
          setPrinting(false);
          setStageId("maturation");
          pushLog(`Construct complete — ${app.layers} layers, routing to maturation`, "ok");
          void syncJob("pause", app.layers);
          return app.layers;
        }
        if (next % 4 === 0) {
          pushLog(`Layer ${next} crosslinked · viability within band`, "info");
        }
        void syncJob("start", next);
        return next;
      });
    }, 420);

    return () => window.clearInterval(layerTimer);
  }, [printing, app.layers, pushLog, syncJob]);

  const deposition: DepositionState = useMemo(
    () =>
      bodyModel?.deposition ?? {
        currentLayer: layer,
        totalLayers: app.layers,
        progress: app.layers > 0 ? layer / app.layers : 0,
        status: printing ? "printing" : layer >= app.layers ? "complete" : "idle",
      },
    [bodyModel, layer, app.layers, printing]
  );

  const stage = BIOPRINT_PIPELINE.find((s) => s.id === stageId) ?? BIOPRINT_PIPELINE[2];

  const kpiStats = liveData?.live
    ? [
        ["Bioprint trials", liveData.stats.bioprintTrials],
        ["PubMed articles", liveData.stats.pubMedArticles.toLocaleString()],
        ["Recruiting now", liveData.stats.recruitingTrials],
        ["Tissue eng. trials", liveData.stats.tissueEngineeringTrials],
      ]
    : [
        ["Clinical records", BIOPRINT_ENTERPRISE_STATS.clinicalRecords.toLocaleString()],
        ["Constructs printed", BIOPRINT_ENTERPRISE_STATS.constructsPrinted.toLocaleString()],
        ["Avg viability", `${BIOPRINT_ENTERPRISE_STATS.avgViability}%`],
        ["Partner labs", BIOPRINT_ENTERPRISE_STATS.partnerLabs],
      ];

  if (compact) {
    return (
      <div className="w-full">
        <Bioprint3DViewer
          applicationId={appId}
          totalLayers={app.layers}
          currentLayer={printing ? layer : Math.min(8, app.layers)}
          printing={printing}
          compact
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button
            size="sm"
            className="bg-teal-900 text-white hover:bg-teal-800"
            onClick={printing ? pausePrint : playOrResume}
          >
            {printing ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {printing ? "Pause" : layer > 0 && layer < app.layers ? "Resume" : "Start bioprint"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Compact API strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-sm">
        {liveData?.live ? (
          <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        )}
        <span className="font-medium text-stone-600">
          {liveLoading ? "Syncing APIs…" : liveData?.live ? "Live APIs" : "Fallback data"}
        </span>
        {kpiStats.slice(0, 3).map(([label, val]) => (
          <span key={label} className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-stone-700 first:ml-0 sm:ml-0">
            {label}: <strong>{val}</strong>
          </span>
        ))}
      </div>

      {/* Unified workspace — 3D + controls together, no scroll between them */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
        <div className="border-b border-stone-100 bg-gradient-to-r from-[#eef6f2] via-white to-[#eef6f2] px-4 py-3 md:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Bioprint lab · unified workspace
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 md:text-sm">
            3D construct in center · operator console on right · rotate, zoom, step layers, and trace
            live API telemetry from <code className="text-[10px] text-teal-700">/api/innovation/body-model</code>
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
          {/* 3D viewport — primary, visible first on mobile */}
          <div className="order-1 min-h-[420px] lg:min-h-[540px]">
            <Bioprint3DViewer
              ref={viewerRef}
              applicationId={appId}
              totalLayers={app.layers}
              currentLayer={layer}
              printing={printing}
              fillHeight
              className="h-full min-h-[420px] rounded-none border-0 lg:min-h-[540px]"
            />
          </div>

          {/* Operator panel — hospital-grade console */}
          <aside className="order-2 flex flex-col gap-3 border-t border-stone-800/20 bg-[#0c1513] p-4 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-400/90">
                Operator console
              </p>
              <span
                className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
                  constructQuality === "clinical-grade"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : constructQuality === "acceptable"
                      ? "bg-teal-500/20 text-teal-300"
                      : constructQuality === "forming"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/10 text-stone-400"
                }`}
              >
                {constructQuality.replace("-", " ")}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/50">Tissue profile</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1 lg:grid-cols-1">
                {BIOPRINT_APPLICATIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAppId(a.id);
                      reset();
                      pushLog(`Profile → ${a.name}`, "info");
                    }}
                    className={`rounded-md border px-2 py-1.5 text-left text-xs transition ${
                      appId === a.id
                        ? "border-teal-500/50 bg-teal-950/80 font-semibold text-teal-100"
                        : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    {a.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-teal-600 text-white hover:bg-teal-500"
                onClick={printing ? pausePrint : playOrResume}
              >
                {printing ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                {printing ? "Pause" : layer > 0 && layer < app.layers ? "Resume" : "Start"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 bg-white/5 text-stone-200 hover:bg-white/10"
                onClick={reset}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-white/15 bg-white/5 text-stone-200 hover:bg-white/10"
                onClick={stepLayerBack}
                disabled={layer <= 0}
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Layer back
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-white/15 bg-white/5 text-stone-200 hover:bg-white/10"
                onClick={stepLayerForward}
                disabled={layer >= app.layers}
              >
                Layer fwd <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            <BioprintEnterpriseTelemetry
              telemetry={{ ...telemetry, layer, totalLayers: app.layers }}
              deposition={deposition}
              jobId={jobId}
              apiLive={Boolean(liveData?.live)}
            />

            {bodyModel?.printResults && bodyModel.printResults.depositedVolumeUl > 0 && (
              <div className="rounded-lg border border-teal-800/30 bg-teal-950/40 px-2.5 py-2 text-[10px] text-teal-200/80">
                <span className="font-semibold text-teal-300">API print result · </span>
                {bodyModel.printResults.depositedVolumeUl} µL deposited · crosslink{" "}
                {bodyModel.printResults.crosslinkPct?.toFixed(1) ?? "—"}% · {bodyModel.region.label}
              </div>
            )}

            <div className="min-h-0 flex-1 rounded-md border border-white/10 bg-black/30 p-2">
              <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-teal-400/80">
                <Cpu className="h-3 w-3" /> Event log
              </p>
              <div className="max-h-[72px] space-y-0.5 overflow-y-auto font-mono text-[9px] lg:max-h-[96px]">
                {logs.length === 0 && <p className="text-stone-500">Start bioprint…</p>}
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.level === "ok"
                        ? "text-emerald-400"
                        : entry.level === "warn"
                          ? "text-amber-400"
                          : "text-stone-400"
                    }
                  >
                    <span className="text-stone-600">{entry.time}</span> {entry.message}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] leading-snug text-stone-500">
              <strong className="text-stone-300">{app.name}</strong> — {app.tissue}
              {liveData?.organResearch && appId === "brain" && (
                <span className="mt-1 block text-teal-400">
                  PubMed: {liveData.organResearch.brain.pubMedArticles.toLocaleString()} articles
                </span>
              )}
              {liveData?.organResearch && appId === "kidney" && (
                <span className="mt-1 block text-teal-400">
                  PubMed: {liveData.organResearch.kidney.pubMedArticles.toLocaleString()} articles
                </span>
              )}
            </p>
          </aside>
        </div>
      </div>

      {/* Pipeline stages */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
          End-to-end pipeline
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BIOPRINT_PIPELINE.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStageId(s.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                stageId === s.id
                  ? "bg-teal-900 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {s.short}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-serif text-xl text-stone-900">{stage.label}</h3>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900">
              {stage.duration}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">{stage.detail}</p>
          {stage.id === "clinical" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/ai/concierge?topic=regenerative-care">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  AI regenerative intake
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/book-appointment">Book consult</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Live trials from ClinicalTrials.gov */}
      {liveData && liveData.recentTrials.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
            Live bioprinting trials (ClinicalTrials.gov)
          </p>
          <div className="mt-4 space-y-3">
            {liveData.recentTrials.slice(0, 5).map((trial) => (
              <a
                key={trial.nctId}
                href={trial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-teal-800">{trial.nctId}</p>
                  <p className="mt-1 font-medium text-stone-900 group-hover:text-teal-900">
                    {trial.title}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{trial.organization}</p>
                </div>
                <span className="mt-2 shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 sm:mt-0">
                  {trial.status.replaceAll("_", " ")}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory pathways */}
      <div className="rounded-2xl border border-teal-900/10 bg-[#eef6f2] px-6 py-6 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Regulatory pathways</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BIOPRINT_ENTERPRISE_STATS.regulatoryPathways.map((r) => (
            <span
              key={r}
              className="rounded-full border border-teal-900/15 bg-white px-3 py-1 text-xs font-medium text-teal-900"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
