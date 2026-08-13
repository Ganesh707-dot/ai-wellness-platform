"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Minus,
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
      <div className="flex h-full w-full items-center justify-center bg-[#0a1210]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          <p className="text-sm text-teal-100/70">Loading 3D anatomy…</p>
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
  immersive?: boolean;
  compact?: boolean;
};

function useTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  return touch;
}

function ControlBtn({
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
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        active
          ? "border-teal-400/60 bg-teal-400/20 text-teal-200"
          : "border-white/15 bg-black/40 text-teal-50 hover:border-teal-400/40 hover:bg-teal-400/10"
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
  immersive = false,
  compact = false,
}: Bioprint3DViewerProps) {
  const touch = useTouch();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BioprintViewerHandle>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const region: AnatomyRegion = ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;
  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  const heightClass = compact
    ? "min-h-[340px] sm:min-h-[400px]"
    : immersive
      ? "min-h-[58vh] sm:min-h-[64vh] lg:min-h-[72vh]"
      : "min-h-[420px] md:min-h-[480px]";

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
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
      className={`relative w-full overflow-hidden bg-[#0a1210] ${heightClass} ${
        fullscreen ? "h-screen min-h-0" : ""
      }`}
      style={{ touchAction: "none" }}
    >
      <BioprintHumanScene
        ref={viewerRef}
        region={region}
        progress={progress}
        printing={printing}
        immersive={immersive || !compact}
        autoRotate={autoRotate && !printing}
      />

      {/* Region badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[65%] rounded-lg border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-teal-300/90">
          Enterprise 3D · {region.organ} model
        </p>
        <p className="mt-0.5 text-xs font-medium leading-snug text-white">{region.label}</p>
        <p className="mt-0.5 text-[10px] text-teal-200/60">{region.tissueLabel}</p>
      </div>

      {/* 3D control toolbar — enterprise */}
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-1.5">
        <ControlBtn label="Rotate left" onClick={() => viewerRef.current?.rotateLeft()}>
          <RotateCcw className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn label="Rotate right" onClick={() => viewerRef.current?.rotateRight()}>
          <RotateCw className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn label="Zoom in" onClick={() => viewerRef.current?.zoomIn()}>
          <Plus className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn label="Zoom out" onClick={() => viewerRef.current?.zoomOut()}>
          <Minus className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn label="Reset view" onClick={() => viewerRef.current?.resetView()}>
          <Rotate3d className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn
          label="Auto-rotate"
          active={autoRotate}
          onClick={() => setAutoRotate((v) => !v)}
        >
          <RotateCw className={`h-4 w-4 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
        </ControlBtn>
        <ControlBtn label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ControlBtn>
      </div>

      {/* Interaction hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-14 z-20 flex justify-center sm:right-16">
        <div className="rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[11px] font-medium text-teal-50 backdrop-blur-sm md:text-xs">
          {printing ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Layer {Math.min(currentLayer, totalLayers)}/{totalLayers}
              {!touch && " · drag rotate · scroll zoom"}
            </span>
          ) : (
            <span>
              {touch
                ? "Pinch & drag · use toolbar to rotate/zoom"
                : "Drag to rotate · scroll to zoom · toolbar for full 3D control"}
              {progress > 0 && ` · ${Math.round(progress * 100)}% deposited`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
