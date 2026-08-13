import type { BioprintApplication } from "@/lib/bioprint-data";

export type OrganModelKind = "human" | "heart" | "knee" | "liver" | "brain" | "kidney";

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
    position: [-0.52, 0.02, 0.08],
    radius: 0.09,
    color: "#5eead4",
    emissive: "#2dd4bf",
    tissueLabel: "Epidermal + dermal matrix",
    camera: { position: [0.15, 0.12, 1.25], target: [0, 0.08, 0], fov: 40 },
  },
  cartilage: {
    id: "left_knee",
    label: "Hyaline cartilage · knee joint patch",
    organ: "knee",
    position: [0, 0.06, 0.14],
    radius: 0.14,
    color: "#6ee7b7",
    emissive: "#34d399",
    tissueLabel: "Hyaline cartilage construct",
    camera: { position: [0.32, 0.18, 0.95], target: [0, 0.06, 0], fov: 36 },
  },
  "organ-chip": {
    id: "liver",
    label: "Hepatic organ-on-a-chip · microfluidic model",
    organ: "liver",
    position: [0, 0.08, 0.12],
    radius: 0.16,
    color: "#c4b5fd",
    emissive: "#8b5cf6",
    tissueLabel: "Microfluidic liver spheroids",
    camera: { position: [0.38, 0.22, 0.95], target: [0, 0.06, 0], fov: 36 },
  },
  cardiac: {
    id: "heart",
    label: "Myocardial patch · cardiac bioprint",
    organ: "heart",
    position: [0.02, 0.1, 0.18],
    radius: 0.14,
    color: "#fca5a5",
    emissive: "#ef4444",
    tissueLabel: "Patient-derived cardiomyocytes",
    camera: { position: [0.28, 0.18, 0.98], target: [0, 0.06, 0], fov: 36 },
  },
  brain: {
    id: "cortex",
    label: "Cortical organoid · neural bioprint",
    organ: "brain",
    position: [0, 0.12, 0.16],
    radius: 0.13,
    color: "#f9a8d4",
    emissive: "#ec4899",
    tissueLabel: "iPSC-derived cortical organoid",
    camera: { position: [0.3, 0.2, 0.95], target: [0, 0.08, 0], fov: 36 },
  },
  kidney: {
    id: "nephron",
    label: "Renal tubule scaffold · kidney bioprint",
    organ: "kidney",
    position: [0, 0.06, 0.14],
    radius: 0.14,
    color: "#fdba74",
    emissive: "#f97316",
    tissueLabel: "Nephron tubule organoid matrix",
    camera: { position: [0.34, 0.16, 0.95], target: [0, 0.04, 0], fov: 36 },
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
  printResults: {
    depositedVolumeUl: number;
    layerHeightMm: number;
    crosslinkPct: number | null;
    constructQuality: "idle" | "forming" | "acceptable" | "clinical-grade";
    meshProgress: number;
    organ: OrganModelKind;
    regionLabel: string;
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
    modelVersion: "aw-anatomy-v3",
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
    printResults: {
      depositedVolumeUl: Math.round(layer * 4.2 * 10) / 10,
      layerHeightMm: 0.05,
      crosslinkPct: layer > 0 ? Math.min(99, 78 + progress * 20) : null,
      constructQuality:
        layer === 0
          ? "idle"
          : progress >= 1
            ? "clinical-grade"
            : progress > 0.5
              ? "acceptable"
              : "forming",
      meshProgress: progress,
      organ: region.organ,
      regionLabel: region.label,
    },
    live: liveMeta.live,
    fetchedAt: liveMeta.fetchedAt,
  };
}
