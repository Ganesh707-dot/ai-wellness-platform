"use client";

import { Activity, Beaker, Layers, Thermometer } from "lucide-react";

export type PrintTelemetry = {
  viability: number | null;
  flowRateUlS: number | null;
  integrityPct: number | null;
  nozzleTempC: number | null;
  layer: number;
  totalLayers: number;
  status: string;
};

export type DepositionState = {
  progress: number;
  status: "idle" | "printing" | "complete";
  currentLayer: number;
  totalLayers: number;
};

function GaugeRing({
  label,
  value,
  unit,
  pct,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  pct: number;
  icon: typeof Activity;
  accent: string;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-900/20 bg-gradient-to-br from-[#0c1513] via-[#101a18] to-[#152822] p-3 shadow-inner">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-500/10 blur-xl" />
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              className={accent}
            />
          </svg>
          <Icon className={`absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 ${accent}`} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-300/70">{label}</p>
          <p className={`mt-0.5 font-mono text-lg font-semibold leading-none text-white`}>
            {value}
            {unit && <span className="ml-0.5 text-[10px] font-normal text-teal-200/50">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowBar({ value, active }: { value: number; active: boolean }) {
  const pct = active ? Math.min(100, (value / 16) * 100) : 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-900/20 bg-gradient-to-br from-[#0c1513] via-[#101a18] to-[#152822] p-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-300/70">
          <Beaker className="h-3.5 w-3.5 text-cyan-400" />
          Flow
        </div>
        <p className="font-mono text-lg font-semibold text-white">
          {active ? value.toFixed(1) : "0.0"}
          <span className="ml-0.5 text-[10px] font-normal text-teal-200/50">µL/s</span>
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${active ? "bg-gradient-to-r from-cyan-500 to-teal-400" : "bg-stone-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LayerStack({ current, total, progress }: { current: number; total: number; progress: number }) {
  const slots = Math.min(total, 12);
  const filled = total > 0 ? Math.round((current / total) * slots) : 0;

  return (
    <div className="rounded-xl border border-teal-900/20 bg-[#0c1513]/90 p-3">
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-300/70">
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          3D deposition stack
        </span>
        <span className="font-mono text-teal-200">
          L{current}/{total}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-0.5" style={{ height: 36 }}>
        {Array.from({ length: slots }, (_, i) => {
          const h = 8 + (i / Math.max(1, slots - 1)) * 28;
          const done = i < filled;
          const active = i === filled && progress > 0 && progress < 1;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-300 ${
                done
                  ? "bg-gradient-to-t from-teal-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]"
                  : active
                    ? "animate-pulse bg-gradient-to-t from-amber-600 to-yellow-400"
                    : "bg-white/10"
              }`}
              style={{ height: h }}
            />
          );
        })}
      </div>
      <p className="mt-1.5 text-center font-mono text-[10px] text-emerald-300/90">
        {Math.round(progress * 100)}% construct deposited
      </p>
    </div>
  );
}

export function BioprintEnterpriseTelemetry({
  telemetry,
  deposition,
  jobId,
  apiLive,
}: {
  telemetry: PrintTelemetry;
  deposition: DepositionState;
  jobId: string | null;
  apiLive: boolean;
}) {
  const printing = deposition.status === "printing";
  const viability = telemetry.viability ?? 91.2;
  const integrity = telemetry.integrityPct ?? (deposition.currentLayer > 0 ? 92 : 0);
  const flow = telemetry.flowRateUlS ?? 0;
  const nozzle = telemetry.nozzleTempC;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-teal-800/30 bg-[#0c1513] px-2.5 py-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-teal-400/80">
          Live telemetry
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            apiLive ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {apiLive ? "API sync" : "local"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <GaugeRing
          label="Viability"
          value={viability.toFixed(1)}
          unit="%"
          pct={viability}
          icon={Activity}
          accent="text-emerald-400"
        />
        <GaugeRing
          label="Integrity"
          value={integrity > 0 ? integrity.toFixed(1) : "—"}
          unit={integrity > 0 ? "%" : undefined}
          pct={integrity > 0 ? integrity : 0}
          icon={Layers}
          accent="text-violet-400"
        />
      </div>

      <FlowBar value={flow} active={printing && flow > 0} />

      <div className="relative overflow-hidden rounded-xl border border-teal-900/20 bg-gradient-to-br from-[#0c1513] via-[#101a18] to-[#152822] p-3 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-300/70">
            <Thermometer className="h-3.5 w-3.5 text-orange-400" />
            Nozzle temp
          </div>
          <p className="font-mono text-lg font-semibold text-white">
            {nozzle != null ? nozzle.toFixed(1) : "—"}
            <span className="ml-0.5 text-[10px] font-normal text-teal-200/50">°C</span>
          </p>
        </div>
        {nozzle != null && (
          <div className="mt-2 flex gap-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i < 6 ? "bg-gradient-to-r from-orange-500 to-red-400" : "bg-white/10"}`}
              />
            ))}
          </div>
        )}
      </div>

      <LayerStack
        current={deposition.currentLayer}
        total={deposition.totalLayers}
        progress={deposition.progress}
      />

      {jobId && (
        <p className="truncate font-mono text-[8px] text-teal-300/40" title={jobId}>
          job · {jobId}
        </p>
      )}
    </div>
  );
}
