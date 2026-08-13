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
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 font-mono text-lg font-semibold ${accent ?? "text-stone-900"}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-stone-500">{unit}</span>}
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
        <div className="border-b border-stone-100 bg-[#eef6f2] px-4 py-3 md:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-800">
            Bioprint lab · anatomy review
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 md:text-sm">
            Living cells deposited layer-by-layer — inspect the 3D construct while controlling deposition from the panel beside it.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
          {/* 3D viewport — primary, visible first on mobile */}
          <div className="order-1 min-h-[420px] lg:min-h-[540px]">
            <Bioprint3DViewer
              applicationId={appId}
              totalLayers={app.layers}
              currentLayer={layer}
              printing={printing}
              fillHeight
              className="h-full min-h-[420px] rounded-none border-0 lg:min-h-[540px]"
            />
          </div>

          {/* Operator panel — right on desktop, directly under 3D on mobile */}
          <aside className="order-2 flex flex-col gap-3 border-t border-stone-200 bg-stone-50/80 p-4 lg:border-l lg:border-t-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Tissue</p>
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
                        ? "border-teal-600 bg-teal-50 font-semibold text-teal-900"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
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
                className="flex-1 bg-teal-900 text-white hover:bg-teal-800"
                onClick={printing ? pausePrint : playOrResume}
              >
                {printing ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                {printing ? "Pause" : layer > 0 && layer < app.layers ? "Resume" : "Start"}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <MetricTile label="Viability" value={viability} unit="%" icon={Activity} accent="text-emerald-600" />
              <MetricTile label="Flow" value={flowRate} unit="µL/s" icon={Beaker} />
              <MetricTile label="Integrity" value={integrity} unit="%" icon={Layers} />
              <MetricTile label="Nozzle" value={printing ? "37.2" : "—"} unit="°C" icon={Thermometer} />
            </div>

            <div className="min-h-0 flex-1 rounded-md border border-stone-200 bg-white p-2">
              <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-teal-800">
                <Cpu className="h-3 w-3" /> Log
              </p>
              <div className="max-h-[88px] space-y-0.5 overflow-y-auto font-mono text-[9px] lg:max-h-[120px]">
                {logs.length === 0 && <p className="text-stone-400">Start bioprint…</p>}
                {logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.level === "ok"
                        ? "text-emerald-700"
                        : entry.level === "warn"
                          ? "text-amber-700"
                          : "text-stone-600"
                    }
                  >
                    <span className="text-stone-400">{entry.time}</span> {entry.message}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] leading-snug text-stone-500">
              <strong className="text-stone-700">{app.name}</strong> — {app.tissue}
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
