"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Hand,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Plus,
  Rotate3d,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { ANATOMY_REGIONS, type AnatomyRegion } from "@/lib/bioprint-anatomy";
import type { BioprintViewerHandle } from "@/components/innovation/bioprint-human-scene";

const BioprintHumanScene = dynamic(
  () =>
    import("@/components/innovation/bioprint-human-scene").then((m) => m.BioprintHumanScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#0d1816] to-[#071010]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-400/80 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-teal-100/60">Initializing viewport…</p>
        </div>
      </div>
    ),
  }
);

type Bioprint3DViewerProps = {
  applicationId: string;
  totalLayers: number;
  currentLayer: number;
  printing: boolean;
  compact?: boolean;
  className?: string;
};

function DockBtn({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-teal-500/25 text-teal-100 ring-1 ring-teal-400/40"
          : "text-teal-100/80 hover:bg-white/8 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function Bioprint3DViewer({
  applicationId,
  totalLayers,
  currentLayer,
  printing,
  compact = false,
  className = "",
}: Bioprint3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BioprintViewerHandle>(null);
  const [engaged, setEngaged] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const region: AnatomyRegion = ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;
  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  const release = useCallback(() => setEngaged(false), []);

  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") release();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engaged, release]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
      setEngaged(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col overflow-hidden bg-gradient-to-b from-[#0d1816] to-[#071010] ${
        compact ? "min-h-[320px]" : "min-h-[420px] lg:min-h-0 lg:h-full"
      } ${fullscreen ? "h-screen min-h-0" : ""} ${className}`}
    >
      {/* Viewport chrome header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-black/30 px-3 py-2 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">
            Anatomy viewport · {region.organ}
          </p>
          <p className="truncate text-xs font-medium text-white/90">{region.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {printing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Layer {Math.min(currentLayer, totalLayers)}/{totalLayers}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              engaged
                ? "bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/30"
                : "bg-white/5 text-stone-400 ring-1 ring-white/10"
            }`}
          >
            {engaged ? "3D active" : "Scroll mode"}
          </span>
        </div>
      </div>

      {/* Canvas area — fixed flex fill */}
      <div
        className="relative min-h-0 flex-1"
        style={{ touchAction: engaged ? "none" : "pan-y" }}
      >
        <BioprintHumanScene
          ref={viewerRef}
          region={region}
          progress={progress}
          printing={printing}
          autoRotate={autoRotate && !printing && engaged}
          interactive={engaged}
        />

        {/* Engage overlay — page scroll passes through until click */}
        {!engaged && (
          <button
            type="button"
            onClick={() => setEngaged(true)}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/35 backdrop-blur-[2px] transition hover:bg-black/45"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-teal-400/40 bg-teal-950/80 text-teal-200 shadow-lg shadow-teal-900/40">
              <MousePointer2 className="h-5 w-5" />
            </span>
            <span className="max-w-[220px] text-center text-sm font-medium text-white">
              Click to engage 3D controls
            </span>
            <span className="text-[11px] text-teal-100/55">
              Scroll the page freely · drag &amp; zoom inside viewport
            </span>
          </button>
        )}

        {/* Tissue focus badge */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="text-[9px] uppercase tracking-wider text-teal-300/70">Deposition zone</p>
          <p className="text-[11px] font-medium text-white">{region.tissueLabel}</p>
          {progress > 0 && (
            <p className="mt-0.5 text-[10px] text-emerald-300">{Math.round(progress * 100)}% deposited</p>
          )}
        </div>
      </div>

      {/* Enterprise control dock */}
      <div className="shrink-0 border-t border-white/8 bg-[#0a1210]/95 px-2 py-2 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-0.5">
            <DockBtn label="Rotate left" onClick={() => viewerRef.current?.rotateLeft()} disabled={!engaged}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Left</span>
            </DockBtn>
            <DockBtn label="Rotate right" onClick={() => viewerRef.current?.rotateRight()} disabled={!engaged}>
              <RotateCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Right</span>
            </DockBtn>
            <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
            <DockBtn label="Zoom in" onClick={() => viewerRef.current?.zoomIn()} disabled={!engaged}>
              <Plus className="h-3.5 w-3.5" />
            </DockBtn>
            <DockBtn label="Zoom out" onClick={() => viewerRef.current?.zoomOut()} disabled={!engaged}>
              <Minus className="h-3.5 w-3.5" />
            </DockBtn>
            <DockBtn label="Reset view" onClick={() => viewerRef.current?.resetView()} disabled={!engaged}>
              <Rotate3d className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </DockBtn>
          </div>

          <div className="flex flex-wrap items-center gap-0.5">
            <DockBtn
              label="Auto-rotate"
              active={autoRotate}
              onClick={() => setAutoRotate((v) => !v)}
            >
              <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
              <span className="hidden md:inline">Orbit</span>
            </DockBtn>
            <DockBtn label={engaged ? "Release (Esc)" : "Engage 3D"} active={engaged} onClick={() => setEngaged((v) => !v)}>
              <Hand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{engaged ? "Release" : "Engage"}</span>
            </DockBtn>
            <DockBtn label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </DockBtn>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-teal-100/45">
          {engaged
            ? "Drag to rotate · scroll wheel to zoom · Esc to return to page scroll"
            : "Page scroll enabled — click viewport or Engage to control the 3D model"}
        </p>
      </div>
    </div>
  );
}
