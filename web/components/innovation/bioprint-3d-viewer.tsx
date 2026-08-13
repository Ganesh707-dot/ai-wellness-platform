"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ANATOMY_REGIONS,
  type AnatomyRegion,
  type BodyModelPayload,
} from "@/lib/bioprint-anatomy";

const BioprintHumanScene = dynamic(
  () =>
    import("@/components/innovation/bioprint-human-scene").then(
      (m) => m.BioprintHumanScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-teal-100/70">
        Loading 3D anatomy viewer…
      </div>
    ),
  }
);

type Bioprint3DViewerProps = {
  applicationId: string;
  totalLayers: number;
  currentLayer: number;
  printing: boolean;
  headX?: number;
  headY?: number;
  compact?: boolean;
};

function useViewport() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  return { touch };
}

export function Bioprint3DViewer({
  applicationId,
  totalLayers,
  currentLayer,
  printing,
  compact = false,
}: Bioprint3DViewerProps) {
  const { touch } = useViewport();
  const [model, setModel] = useState<BodyModelPayload | null>(null);

  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  useEffect(() => {
    const params = new URLSearchParams({
      applicationId,
      layer: String(currentLayer),
      printing: String(printing),
    });
    fetch(`/api/innovation/body-model?${params}`)
      .then((r) => r.json())
      .then((data: BodyModelPayload) => setModel(data))
      .catch(() => undefined);
  }, [applicationId, currentLayer, printing]);

  const region: AnatomyRegion =
    model?.region ?? ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden ${
        compact ? "min-h-[280px]" : "min-h-[360px] md:min-h-[420px]"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {/* Lab grid overlay */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(94,234,212,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(20,184,166,0.2),transparent_65%)]" />
      </div>

      {/* Three.js human body */}
      <div className="relative z-0 flex-1 min-h-[240px]">
        <BioprintHumanScene
          region={region}
          progress={progress}
          printing={printing}
          compact={compact}
        />
      </div>

      {/* HUD overlay */}
      <div className="absolute left-3 top-3 z-20 rounded-lg border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-teal-200/80">
          API · /api/innovation/body-model
        </p>
        <p className="mt-0.5 text-xs font-medium text-white">{region.label}</p>
        <p className="text-[10px] text-teal-100/65">{region.tissueLabel}</p>
      </div>

      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-3">
        <div className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-medium text-teal-100 backdrop-blur-sm md:text-xs">
          {printing ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Bioprinting · layer {Math.min(currentLayer, totalLayers)} / {totalLayers}
              {!touch && " · drag to rotate"}
            </span>
          ) : currentLayer > 0 ? (
            <span>
              {region.label} · {Math.round(progress * 100)}% deposited · drag to explore 3D body
            </span>
          ) : (
            <span>
              {touch ? "Tap Run demo — pinch/drag to rotate 3D body" : "Drag to rotate · scroll to zoom · Run demo to start bioprint"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
