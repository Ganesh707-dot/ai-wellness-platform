"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
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
import { BioprintHumanScene, type BioprintViewerHandle } from "@/components/innovation/bioprint-human-scene";

export const VIEWPORT_HEIGHT_COMPACT = 380;
export const VIEWPORT_HEIGHT_DEFAULT = 520;

export type Bioprint3DViewerHandle = {
  resetView: () => void;
};

type Bioprint3DViewerProps = {
  applicationId: string;
  totalLayers: number;
  currentLayer: number;
  printing: boolean;
  compact?: boolean;
  fillHeight?: boolean;
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
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

export const Bioprint3DViewer = forwardRef<Bioprint3DViewerHandle, Bioprint3DViewerProps>(
function Bioprint3DViewer(
  {
  applicationId,
  totalLayers,
  currentLayer,
  printing,
  compact = false,
  fillHeight = false,
  className = "",
}: Bioprint3DViewerProps,
  ref
) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const viewerApiRef = useRef<BioprintViewerHandle | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const region: AnatomyRegion = ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;
  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  const viewportPx = compact ? VIEWPORT_HEIGHT_COMPACT : VIEWPORT_HEIGHT_DEFAULT;

  const api = () => viewerApiRef.current;

  const handleControlsReady = useCallback((handle: BioprintViewerHandle) => {
    viewerApiRef.current = handle;
  }, []);

  useImperativeHandle(ref, () => ({
    resetView: () => viewerApiRef.current?.resetView(),
  }), []);

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
  }, [fullscreen, compact, fillHeight]);

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

  const shellStyle = fullscreen
    ? { height: "100vh" as const }
    : fillHeight
      ? { height: "100%", minHeight: `${viewportPx}px` }
      : { height: `${viewportPx}px` };

  return (
    <div
      ref={shellRef}
      className={`flex w-full flex-col overflow-hidden bg-[#101a18] ${className}`}
      style={shellStyle}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1513] px-3 sm:px-4">
        <div className="min-w-0 pr-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-400/90">
            {region.organ} · clinical viewport
          </p>
          <p className="truncate text-xs font-medium text-white">{region.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {printing && (
            <span className="hidden items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex">
              L{Math.min(currentLayer, totalLayers)}/{totalLayers}
            </span>
          )}
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              engaged ? "bg-teal-500/20 text-teal-200" : "bg-white/5 text-stone-400"
            }`}
          >
            {engaged ? "Drag" : "Scroll"}
          </span>
        </div>
      </header>

      <div
        ref={canvasHostRef}
        className="relative min-h-0 flex-1 bg-[#101a18]"
        style={{ touchAction: engaged ? "none" : "pan-y" }}
      >
        {canvasSize.w > 0 && canvasSize.h > 0 && (
          <div className="absolute inset-0">
            <BioprintHumanScene
              region={region}
              progress={progress}
              printing={printing}
              autoRotate={autoRotate && printing && !engaged}
              interactive={engaged}
              width={canvasSize.w}
              height={canvasSize.h}
              onControlsReady={handleControlsReady}
            />
          </div>
        )}

        {!engaged && (
          <button
            type="button"
            onClick={() => setEngaged(true)}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#101a18]/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-teal-400/50 bg-teal-950/90 text-teal-200">
              <MousePointer2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-white sm:text-sm">Tap to drag &amp; zoom</span>
          </button>
        )}

        {progress > 0 && (
          <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-black/50 px-2 py-1 text-[10px] text-emerald-300">
            {Math.round(progress * 100)}% deposited
          </div>
        )}
      </div>

      <footer className="relative z-30 shrink-0 border-t border-white/10 bg-[#0c1513] px-2 py-2">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <DockBtn label="Rotate left" onClick={() => { api()?.rotateLeft(); }}>
              <RotateCcw className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Rotate right" onClick={() => { api()?.rotateRight(); }}>
              <RotateCw className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Zoom in" onClick={() => { api()?.zoomIn(); }}>
              <Plus className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Zoom out" onClick={() => { api()?.zoomOut(); }}>
              <Minus className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Reset view" onClick={() => { api()?.resetView(); }}>
              <Rotate3d className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </DockBtn>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <DockBtn label="Auto-orbit" active={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
              <RotateCw
                className={`h-4 w-4 ${autoRotate ? "animate-spin" : ""}`}
                style={{ animationDuration: "4s" }}
              />
            </DockBtn>
            <DockBtn label="Engage drag" active={engaged} onClick={() => setEngaged((v) => !v)}>
              <Hand className="h-4 w-4" />
            </DockBtn>
            <DockBtn label="Fullscreen" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </DockBtn>
          </div>
        </div>
      </footer>
    </div>
  );
});

Bioprint3DViewer.displayName = "Bioprint3DViewer";
