"use client";

import { useEffect, useMemo, useState } from "react";

type Bioprint3DViewerProps = {
  totalLayers: number;
  currentLayer: number;
  printing: boolean;
  headX: number;
  headY?: number;
  compact?: boolean;
};

function useViewport() {
  const [size, setSize] = useState({ w: 1024, h: 768, touch: false });

  useEffect(() => {
    const update = () => {
      setSize({
        w: window.innerWidth,
        h: window.innerHeight,
        touch: window.matchMedia("(pointer: coarse)").matches,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

export function Bioprint3DViewer({
  totalLayers,
  currentLayer,
  printing,
  headX,
  headY = 35,
  compact = false,
}: Bioprint3DViewerProps) {
  const { w, touch } = useViewport();
  const isMobile = w < 640 || touch;

  const gridSize = isMobile ? 8 : compact ? 10 : 12;
  const filledRatio = totalLayers > 0 ? Math.min(1, currentLayer / totalLayers) : 0;
  const filledHeight = Math.round(filledRatio * gridSize);

  const rotation = useMemo(() => {
    if (!printing) return { rotateX: 58, rotateZ: -42 };
    return { rotateX: 58 + Math.sin(currentLayer * 0.15) * 2, rotateZ: -42 };
  }, [printing, currentLayer]);

  const cellSize = isMobile ? 14 : compact ? 16 : 18;
  const stageHeight = gridSize * cellSize + (isMobile ? 48 : 64);

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden ${
        compact ? "min-h-[240px]" : "min-h-[320px] md:min-h-[380px]"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {/* Ambient lab lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(94,234,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.1) 1px, transparent 1px)",
            backgroundSize: isMobile ? "16px 16px" : "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(20,184,166,0.35),transparent_60%)]" />
        <div className="absolute bottom-0 left-1/2 h-32 w-[80%] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      {/* Isometric 3D chamber */}
      <div
        className="relative"
        style={{
          perspective: isMobile ? "600px" : "900px",
          perspectiveOrigin: "50% 40%",
          height: stageHeight,
          width: "100%",
          maxWidth: isMobile ? 280 : 420,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.rotateX}deg) rotateZ(${rotation.rotateZ}deg) scale(${isMobile ? 0.85 : 1})`,
          }}
        >
          {/* Print bed base */}
          <div
            className="absolute left-1/2 top-1/2 rounded-lg border border-teal-400/30 bg-teal-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{
              width: gridSize * cellSize + 24,
              height: gridSize * cellSize + 24,
              transform: "translate(-50%, -50%) translateZ(-8px)",
            }}
          />

          {/* Voxel construct — layer stack in 3D */}
          <div
            className="absolute left-1/2 top-1/2 grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              transform: "translate(-50%, -50%) translateZ(0px)",
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const x = idx % gridSize;
              const y = Math.floor(idx / gridSize);
              const dist = Math.hypot(x - gridSize / 2, y - gridSize / 2);
              const radius = gridSize * 0.42;
              const inShape = dist < radius;
              const layerAtCell = Math.floor((1 - y / gridSize) * filledHeight);
              const isFilled = inShape && layerAtCell > 0 && y >= gridSize - filledHeight;
              const isSurface = isFilled && y === gridSize - filledHeight;
              const zLift = isFilled ? layerAtCell * 2 : 0;

              return (
                <div
                  key={idx}
                  className="rounded-[2px] transition-all duration-300"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    opacity: inShape ? (isFilled ? 1 : 0.2) : 0.05,
                    transform: `translateZ(${zLift}px)`,
                    background: isFilled
                      ? isSurface
                        ? "linear-gradient(135deg, #5eead4, #34d399, #14b8a6)"
                        : "linear-gradient(135deg, rgba(45,212,191,0.85), rgba(16,185,129,0.75))"
                      : "rgba(15,118,110,0.35)",
                    boxShadow: isSurface
                      ? "0 0 12px rgba(94,234,212,0.6), inset 0 1px 0 rgba(255,255,255,0.3)"
                      : isFilled
                        ? "inset 0 -2px 4px rgba(0,0,0,0.2)"
                        : undefined,
                  }}
                />
              );
            })}
          </div>

          {/* Extrusion nozzle — moves in X/Y during print */}
          {printing && filledHeight > 0 && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${12 + (headX / 100) * (gridSize * cellSize)}px`,
                top: `${12 + (headY / 100) * (gridSize * cellSize)}px`,
                transform: "translateZ(24px)",
              }}
            >
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_16px_#5eead4,0_0_32px_#2dd4bf]" />
                <div className="absolute left-1/2 top-3 h-8 w-0.5 -translate-x-1/2 bg-gradient-to-b from-teal-200 to-transparent opacity-80 animate-pulse" />
              </div>
            </div>
          )}

          {/* Chamber frame — 3D edges */}
          {!isMobile && (
            <>
              <div
                className="absolute border-l-2 border-teal-400/40"
                style={{
                  left: "50%",
                  top: "50%",
                  width: 2,
                  height: gridSize * cellSize + 40,
                  transform: `translate(-50%, -50%) translateX(${gridSize * cellSize * 0.5 + 12}px) translateZ(12px) rotateY(90deg)`,
                }}
              />
              <div
                className="absolute border-l-2 border-teal-400/40"
                style={{
                  left: "50%",
                  top: "50%",
                  width: 2,
                  height: gridSize * cellSize + 40,
                  transform: `translate(-50%, -50%) translateY(${-gridSize * cellSize * 0.5 - 12}px) translateZ(12px) rotateX(90deg)`,
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center px-3">
        <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] font-medium text-teal-100 backdrop-blur-sm md:text-xs">
          {printing ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              3D deposition · layer {Math.min(currentLayer, totalLayers)} / {totalLayers}
            </span>
          ) : currentLayer > 0 ? (
            <span>Construct ready · {currentLayer} layers · isometric view</span>
          ) : (
            <span>{isMobile ? "Touch Run demo to start 3D print" : "Isometric 3D bioprint chamber"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
