"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ANATOMY_REGIONS, type AnatomyRegion } from "@/lib/bioprint-anatomy";

const BioprintHumanScene = dynamic(
  () =>
    import("@/components/innovation/bioprint-human-scene").then((m) => m.BioprintHumanScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#030a09]">
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

export function Bioprint3DViewer({
  applicationId,
  totalLayers,
  currentLayer,
  printing,
  immersive = false,
  compact = false,
}: Bioprint3DViewerProps) {
  const touch = useTouch();
  const region: AnatomyRegion =
    ANATOMY_REGIONS[applicationId] ?? ANATOMY_REGIONS.skin;
  const progress =
    totalLayers > 0 ? Math.min(1, Math.max(0, currentLayer / totalLayers)) : 0;

  const heightClass = compact
    ? "min-h-[340px] sm:min-h-[400px]"
    : immersive
      ? "min-h-[52vh] sm:min-h-[60vh] lg:min-h-[68vh]"
      : "min-h-[420px] md:min-h-[480px]";

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#030a09] ${heightClass}`}
      style={{ touchAction: "none" }}
    >
      <BioprintHumanScene
        region={region}
        progress={progress}
        printing={printing}
        immersive={immersive || !compact}
      />

      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[70%] rounded-lg border border-white/10 bg-black/50 px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-teal-300/90">
          Live 3D · {region.organ} model
        </p>
        <p className="mt-0.5 text-xs font-medium text-white leading-snug">{region.label}</p>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex justify-center">
        <div className="rounded-full border border-white/10 bg-black/55 px-4 py-1.5 text-[11px] font-medium text-teal-50 md:text-xs">
          {printing ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Layer {Math.min(currentLayer, totalLayers)}/{totalLayers}
              {!touch && " · drag to rotate · scroll to zoom"}
            </span>
          ) : (
            <span>
              {touch ? "Pinch & drag to explore 3D organ" : "Drag · scroll zoom · tap Start to bioprint"}
              {progress > 0 && ` · ${Math.round(progress * 100)}% deposited`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
