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
      <div className="absolute inset-0 flex items-center justify-center bg-[#101a18]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-400/80 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-teal-100/60">Initializing viewport…</p>
        </div>
      </div>
    ),
  }
);

/** Explicit viewport heights — avoids flex/grid collapse that clips the WebGL canvas. */
export const VIEWPORT_HEIGHT_COMPACT = 380;
export const VIEWPORT_HEIGHT_DEFAULT = 560;

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
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
        active
          ? "bg-teal-500/25 text-teal-100 ring-1 ring-teal-400/40"
          : "text-teal-100/85 hover:bg-white/10 hover:text-white"
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
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BioprintViewerHandle>(null);
  const [engaged, setEngaged] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const region: AnatomyRegion = ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;
  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  const viewportPx = compact ? VIEWPORT_HEIGHT_COMPACT : VIEWPORT_HEIGHT_DEFAULT;

  const release = useCallback(() => setEngaged(false), []);

  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") release();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engaged, release]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0) setCanvasSize({ w, h });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [fullscreen, compact]);

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
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
      ref={shellRef}
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-stone-700/40 bg-[#101a18] ${className}`}
      style={fullscreen ? { height: "100vh" } : { height: `${viewportPx}px` }}
    >
      {/* Header — fixed 48px, never overlaps canvas */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1513] px-4">
        <div className="min-w-0 pr-3">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-400/90">
            Clinical anatomy viewport · {region.organ}
          </p>
          <p className="truncate text-xs font-medium text-white">{region.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {printing && (
            <span className="hidden items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              L{Math.min(currentLayer, totalLayers)}/{totalLayers}
            </span>
          )}
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
              engaged
                ? "bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/30"
                : "bg-white/5 text-stone-400"
            }`}
          >
            {engaged ? "Drag mode" : "Scroll mode"}
          </span>
        </div>
      </header>

      {/* Canvas host — explicit remaining height, canvas fills 100% */}
      <div
        ref={canvasHostRef}
        className="relative min-h-0 flex-1 bg-[#101a18]"
        style={{ touchAction: engaged ? "none" : "pan-y" }}
      >
        {canvasSize.w > 0 && canvasSize.h > 0 && (
          <div
            className="absolute left-0 top-0"
            style={{ width: canvasSize.w, height: canvasSize.h }}
          >
            <BioprintHumanScene
              ref={viewerRef}
              region={region}
              progress={progress}
              printing={printing}
              autoRotate={autoRotate && !printing}
              interactive={engaged}
              width={canvasSize.w}
              height={canvasSize.h}
            />
          </div>
        )}

        {!engaged && (
          <button
            type="button"
            onClick={() => setEngaged(true)}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#101a18]/50 transition hover:bg-[#101a18]/65"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-teal-400/50 bg-teal-950/90 text-teal-200">
              <MousePointer2 className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-white">Click to drag &amp; zoom model</span>
            <span className="text-[11px] text-teal-100/50">Page scroll works until you click here</span>
          </button>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[55%] rounded-md border border-white/10 bg-black/55 px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-teal-300/70">{region.tissueLabel}</p>
          {progress > 0 && (
            <p className="text-[10px] text-emerald-300">{Math.round(progress * 100)}% deposited</p>
          )}
        </div>
      </div>

      {/* Control dock — fixed ~80px, outside canvas layer */}
      <footer className="shrink-0 border-t border-white/10 bg-[#0c1513] px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <DockBtn label="Rotate left" onClick={() => viewerRef.current?.rotateLeft()}>
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Left</span>
            </DockBtn>
            <DockBtn label="Rotate right" onClick={() => viewerRef.current?.rotateRight()}>
              <RotateCw className="h-4 w-4" />
              <span className="hidden sm:inline">Right</span>
            </DockBtn>
            <span className="mx-0.5 hidden h-5 w-px bg-white/10 sm:block" />
            <DockBtn label="Zoom in" onClick={() => viewerRef.current?.zoomIn()}>
              <Plus className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Zoom out" onClick={() => viewerRef.current?.zoomOut()}>
              <Minus className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Reset view" onClick={() => viewerRef.current?.resetView()}>
              <Rotate3d className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </DockBtn>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <DockBtn label="Auto-orbit" active={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
              <RotateCw
                className={`h-4 w-4 ${autoRotate ? "animate-spin" : ""}`}
                style={{ animationDuration: "4s" }}
              />
            </DockBtn>
            <DockBtn label={engaged ? "Release (Esc)" : "Engage drag"} active={engaged} onClick={() => setEngaged((v) => !v)}>
              <Hand className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Fullscreen" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </DockBtn>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-teal-100/40">
          Toolbar always active · click viewport to drag · Esc releases to page scroll
        </p>
      </footer>
    </div>
  );
}
