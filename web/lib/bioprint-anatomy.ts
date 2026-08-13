import type { BioprintApplication } from "@/lib/bioprint-data";

export type OrganModelKind = "human" | "heart" | "knee" | "liver";

/** 3D focus region per bioprint application. */
export type AnatomyRegion = {
  id: string;
  label: string;
  organ: OrganModelKind;
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  tissueLabel: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
};

export const ANATOMY_REGIONS: Record<string, AnatomyRegion> = {
  skin: {
    id: "left_forearm",
    label: "Dermal scaffold · forearm graft zone",
    organ: "human",
    position: [0.42, 1.08, 0.06],
    radius: 0.11,
    color: "#5eead4",
    emissive: "#2dd4bf",
    tissueLabel: "Epidermal + dermal matrix",
    camera: { position: [0.4, 1.2, 2.1], target: [0, 0.95, 0], fov: 38 },
  },
  cartilage: {
    id: "left_knee",
    label: "Hyaline cartilage · knee joint patch",
    organ: "knee",
    position: [0, 0, 0],
    radius: 0.2,
    color: "#6ee7b7",
    emissive: "#34d399",
    tissueLabel: "Hyaline cartilage construct",
    camera: { position: [0.55, 0.35, 1.4], target: [0, 0.15, 0], fov: 42 },
  },
  "organ-chip": {
    id: "liver",
    label: "Hepatic organ-on-a-chip · microfluidic model",
    organ: "liver",
    position: [0, 0.05, 0],
    radius: 0.22,
    color: "#c4b5fd",
    emissive: "#8b5cf6",
    tissueLabel: "Microfluidic liver spheroids",
    camera: { position: [0.5, 0.45, 1.35], target: [0, 0.1, 0], fov: 40 },
  },
  cardiac: {
    id: "heart",
    label: "Myocardial patch · cardiac bioprint",
    organ: "heart",
    position: [0, 0, 0],
    radius: 0.2,
    color: "#fca5a5",
    emissive: "#ef4444",
    tissueLabel: "Patient-derived cardiomyocytes",
    camera: { position: [0.35, 0.25, 1.55], target: [0, 0.05, 0], fov: 40 },
  },
};

export type BodyModelPayload = {
  modelVersion: string;
  viewer: "organ-hero-3d";
  applicationId: string;
  applicationName: string;
  region: AnatomyRegion;
  deposition: {
    currentLayer: number;
    totalLayers: number;
    progress: number;
    status: "idle" | "printing" | "complete";
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
    modelVersion: "aw-anatomy-v2",
    viewer: "organ-hero-3d",
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
    live: liveMeta.live,
    fetchedAt: liveMeta.fetchedAt,
  };
}
