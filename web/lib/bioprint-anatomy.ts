import type { BioprintApplication } from "@/lib/bioprint-data";

/** 3D body region targeted by each bioprint application (meter-scale human rig). */
export type AnatomyRegion = {
  id: string;
  label: string;
  /** Local position on human rig (Y up, origin at feet). */
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  tissueLabel: string;
};

export const ANATOMY_REGIONS: Record<string, AnatomyRegion> = {
  skin: {
    id: "left_forearm",
    label: "Left forearm · dermal scaffold",
    position: [0.42, 1.08, 0.06],
    radius: 0.11,
    color: "#5eead4",
    emissive: "#2dd4bf",
    tissueLabel: "Epidermal + dermal matrix",
  },
  cartilage: {
    id: "left_knee",
    label: "Left knee · hyaline cartilage",
    position: [-0.14, 0.52, 0.08],
    radius: 0.13,
    color: "#6ee7b7",
    emissive: "#34d399",
    tissueLabel: "Hyaline cartilage patch",
  },
  "organ-chip": {
    id: "liver",
    label: "Hepatic region · organ-on-a-chip",
    position: [0.12, 1.02, 0.12],
    radius: 0.15,
    color: "#a78bfa",
    emissive: "#8b5cf6",
    tissueLabel: "Microfluidic liver model",
  },
  cardiac: {
    id: "heart",
    label: "Cardiac region · myocardial patch",
    position: [0.04, 1.18, 0.18],
    radius: 0.14,
    color: "#fca5a5",
    emissive: "#f87171",
    tissueLabel: "Patient-derived cardiomyocytes",
  },
};

export type BodyModelPayload = {
  modelVersion: string;
  viewer: "human-body-3d";
  applicationId: string;
  applicationName: string;
  region: AnatomyRegion;
  deposition: {
    currentLayer: number;
    totalLayers: number;
    progress: number;
    status: "idle" | "printing" | "complete";
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  live: boolean;
  fetchedAt: string;
};

export function buildBodyModelPayload(
  application: BioprintApplication,
  layer: number,
  printing: boolean,
  liveMeta: { live: boolean; fetchedAt: string }
): BodyModelPayload {
  const region = ANATOMY_REGIONS[application.id] ?? ANATOMY_REGIONS.skin;
  const progress =
    application.layers > 0 ? Math.min(1, Math.max(0, layer / application.layers)) : 0;

  return {
    modelVersion: "aw-anatomy-v1",
    viewer: "human-body-3d",
    applicationId: application.id,
    applicationName: application.name,
    region,
    deposition: {
      currentLayer: layer,
      totalLayers: application.layers,
      progress,
      status:
        layer >= application.layers && application.layers > 0
          ? "complete"
          : printing
            ? "printing"
            : layer > 0
              ? "complete"
              : "idle",
    },
    camera: {
      position: [0.6, 1.35, 2.4],
      target: [0, 1.05, 0],
    },
    live: liveMeta.live,
    fetchedAt: liveMeta.fetchedAt,
  };
}
