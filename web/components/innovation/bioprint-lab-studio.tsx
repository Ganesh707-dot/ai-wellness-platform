"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Beaker,
  Cpu,
  ExternalLink,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Thermometer,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BIOPRINT_APPLICATIONS,
  BIOPRINT_ENTERPRISE_STATS,
  BIOPRINT_PIPELINE,
} from "@/lib/bioprint-data";
import { Bioprint3DViewer } from "@/components/innovation/bioprint-3d-viewer";

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
  recentTrials: LiveTrial[];
};

function nowStamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Activity;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-teal-200/80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 font-mono text-lg font-semibold ${accent ?? "text-white"}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-teal-100/70">{unit}</span>}
      </p>
    </div>
  );
}

export function BioprintLabStudio({ compact = false }: { compact?: boolean }) {
  const [appId, setAppId] = useState(BIOPRINT_APPLICATIONS[0].id);
  const [stageId, setStageId] = useState("deposition");
  const [printing, setPrinting] = useState(false);
  const [layer, setLayer] = useState(0);
  const [headX, setHeadX] = useState(50);
  const [headY, setHeadY] = useState(35);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tick, setTick] = useState(0);
  const [liveData, setLiveData] = useState<LiveDataPayload | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const logId = useRef(0);
  const jobIdRef = useRef<string | null>(null);

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
        if (data.jobId) jobIdRef.current = data.jobId;
        return data;
      } catch {
        return null;
      }
    },
    [appId]
  );

  const reset = useCallback(() => {
    setPrinting(false);
    setLayer(0);
    setHeadX(50);
    setHeadY(35);
    void syncJob("reset", 0);
    pushLog("Print cycle reset — awaiting operator command", "warn");
  }, [pushLog, syncJob]);

  const startPrint = useCallback(() => {
    if (printing) return;
    setLayer(0);
    setPrinting(true);
    setStageId("deposition");
    void syncJob("start", 0);
    pushLog(`Initiating ${app.name} — ${app.bioink}`, "ok");
  }, [app, printing, pushLog, syncJob]);

  useEffect(() => {
    if (!printing) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(t);
  }, [printing]);

  useEffect(() => {
    if (!printing) return;

    const layerTimer = window.setInterval(() => {
      setLayer((prev) => {
        const next = prev + 1;
        if (next >= app.layers) {
          setPrinting(false);
          setStageId("maturation");
          pushLog(`Construct complete — ${app.layers} layers, routing to maturation`, "ok");
          return app.layers;
        }
        if (next % 4 === 0) {
          pushLog(`Layer ${next} crosslinked · viability within band`, "info");
          void syncJob("start", next);
        }
        return next;
      });
    }, 420);

    const headTimer = window.setInterval(() => {
      setHeadX((x) => {
        const dir = x > 85 ? -1 : x < 15 ? 1 : Math.random() > 0.5 ? 1 : -1;
        return Math.min(92, Math.max(8, x + dir * (8 + Math.random() * 12)));
      });
      setHeadY((y) => {
        const dir = y > 80 ? -1 : y < 20 ? 1 : Math.random() > 0.5 ? 1 : -1;
        return Math.min(88, Math.max(12, y + dir * (6 + Math.random() * 10)));
      });
    }, 180);

    return () => {
      window.clearInterval(layerTimer);
      window.clearInterval(headTimer);
    };
  }, [printing, app.layers, app.name, pushLog, syncJob]);

  const viability = useMemo(() => {
    const progress = app.layers > 0 ? layer / app.layers : 0;
    const base = 88 + progress * (app.viabilityTarget - 88);
    const jitter = printing ? Math.sin(tick * 0.7) * 0.4 : 0;
    if (layer === 0 && !printing) return "91.2";
    return (printing ? base + jitter : app.viabilityTarget - 0.3).toFixed(1);
  }, [app, layer, printing, tick]);

  const flowRate = printing ? (11.5 + Math.sin(layer) * 0.8).toFixed(1) : "0.0";
  const integrity = layer > 0 ? Math.min(99.2, 92 + (layer / app.layers) * 7).toFixed(1) : "—";
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
      <div className="relative min-h-[280px] overflow-hidden rounded-3xl ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[#0a2824]" />
        <div className="relative grid h-full min-h-[280px] grid-rows-[1fr_auto]">
          <Bioprint3DViewer
            totalLayers={app.layers}
            currentLayer={printing ? layer : Math.min(6, app.layers)}
            printing={printing}
            headX={headX}
            headY={headY}
            compact
          />
          <div className="border-t border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-teal-100/90">
                {printing ? "Live deposition" : liveData?.live ? "Live API connected" : "Bioprint lab preview"}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 bg-white/15 text-xs text-white hover:bg-white/25"
                onClick={printing ? () => { setPrinting(false); void syncJob("pause", layer); } : startPrint}
              >
                {printing ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
                {printing ? "Pause" : "Run demo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Live API status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-900/10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          {liveData?.live ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-600" />
          )}
          <span className="font-medium text-stone-800">
            {liveLoading
              ? "Syncing live research APIs…"
              : liveData?.live
                ? "Connected to ClinicalTrials.gov + PubMed (free public APIs)"
                : "Using cached fallback — external API unavailable"}
          </span>
        </div>
        {liveData?.live && (
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={liveData.sources.clinicalTrialsGov}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-900 hover:bg-teal-100"
            >
              ClinicalTrials.gov <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={liveData.sources.pubMed}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-900 hover:bg-teal-100"
            >
              PubMed <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Enterprise header strip — live from APIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map(([label, val]) => (
          <div
            key={label}
            className="rounded-2xl border border-teal-900/10 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-800">
              {label}
            </p>
            <p className="mt-1 font-serif text-2xl text-stone-900">{val}</p>
          </div>
        ))}
      </div>

      {/* Main lab console */}
      <div className="overflow-hidden rounded-[2rem] border border-teal-900/10 bg-[#0f3d38] shadow-[0_40px_80px_-40px_rgba(15,61,56,0.65)]">
        <div className="border-b border-white/10 px-6 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-200">
                Enterprise bioprint lab · aw-bioprint-v2 · API-driven
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white md:text-3xl">
                Bioprinting reshapes how tissue is studied, tested, and restored
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-emerald-400 text-teal-950 hover:bg-emerald-300"
                onClick={printing ? () => { setPrinting(false); void syncJob("pause", layer); } : startPrint}
              >
                {printing ? (
                  <>
                    <Pause className="mr-1.5 h-4 w-4" /> Pause print
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" /> Start deposition
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10"
                onClick={reset}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Visual + telemetry */}
          <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
            <Bioprint3DViewer
              totalLayers={app.layers}
              currentLayer={layer}
              printing={printing}
              headX={headX}
              headY={headY}
            />

            <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 md:grid-cols-4 md:p-6">
              <MetricTile label="Viability" value={viability} unit="%" icon={Activity} accent="text-emerald-300" />
              <MetricTile label="Flow rate" value={flowRate} unit="µL/s" icon={Beaker} />
              <MetricTile label="Integrity" value={integrity} unit="%" icon={Layers} />
              <MetricTile label="Nozzle" value={printing ? "37.2" : "—"} unit="°C" icon={Thermometer} />
            </div>
          </div>

          {/* Controls + log */}
          <div className="flex flex-col bg-[#0a2824]/80 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              Application profile
            </p>
            <div className="mt-3 grid gap-2">
              {BIOPRINT_APPLICATIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAppId(a.id);
                    reset();
                    pushLog(`Profile switched → ${a.name}`, "info");
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    appId === a.id
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="mt-0.5 text-[11px] text-teal-100/75">{a.useCase}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-wider text-teal-200/80">Selected construct</p>
              <p className="mt-2 text-sm text-white">{app.tissue}</p>
              <p className="mt-1 text-xs text-teal-100/70">{app.bioink}</p>
              <p className="mt-2 text-xs text-teal-100/60">{app.clinicalPath}</p>
            </div>

            <div className="mt-6 flex-1">
              <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-teal-200/80">
                <Cpu className="h-3.5 w-3.5" /> Live event log
              </p>
              <div className="max-h-[140px] space-y-1.5 overflow-y-auto font-mono text-[11px]">
                {logs.length === 0 && (
                  <p className="text-teal-100/50">Press Start deposition to begin telemetry stream…</p>
                )}
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded px-2 py-1 ${
                      entry.level === "ok"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : entry.level === "warn"
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-white/5 text-teal-100/85"
                    }`}
                  >
                    <span className="text-teal-300/60">{entry.time}</span> {entry.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
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

      {/* Regulatory + copy */}
      <div className="rounded-2xl bg-[#eef6f2] px-6 py-8 ring-1 ring-teal-900/10 md:px-10">
        <p className="text-lg leading-relaxed text-stone-700">
          Living cells are becoming the building blocks of medical innovation. By depositing
          cell-rich bioinks layer by layer, bioprinting creates three-dimensional tissue
          structures for regenerative medicine, drug testing, and personalized care. While fully
          functional organs remain a future goal, the technology is steadily reshaping how human
          tissue can be studied, tested, and restored.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
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
