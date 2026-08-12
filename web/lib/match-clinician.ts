/**
 * AI care-path → specialty → ranked clinician panels.
 * Uses the same resolveCarePath engine as Concierge / encounter CDS.
 */

import { resolveCarePath, type CarePath } from "@/lib/care-path";
import {
  listBookableDoctors,
  type DoctorPanel,
} from "@/lib/doctor-panel-store";

export type RankedClinician = DoctorPanel & {
  matchScore: number;
  matchReason: string;
  aiRecommended: boolean;
};

export type ClinicianMatchResult = {
  carePath: CarePath;
  specialty: CarePath["consultationType"];
  specialtyLabel: string;
  clinicians: RankedClinician[];
  recommendedDoctorId: string | null;
  summary: string;
  model: string;
  intentConfidence: number;
  whyMatched: string[];
};

function scorePanel(
  panel: DoctorPanel,
  specialty: string,
  carePath: CarePath
): { score: number; reason: string } {
  let score = 40;
  const reasons: string[] = [];

  if (panel.specialization === specialty) {
    score += 40;
    reasons.push(`Matches ${carePath.specialty} pathway`);
  } else {
    score -= 15;
    reasons.push("Adjacent specialty");
  }

  if (panel.source === "managed") {
    score += 12;
    reasons.push("Live specialty panel");
  }

  score += Math.min(10, Math.round(panel.rating * 1.5));
  score += Math.min(8, Math.floor(panel.experience / 3));

  if (panel.linkedUserEmail) {
    score += 5;
    reasons.push("Linked clinician login");
  }

  return {
    score: Math.min(99, score),
    reason: reasons[0] || "Available on network",
  };
}

export async function matchCliniciansForConcern(opts: {
  concern: string;
  /** Patient override — AI still ranks within this specialty */
  specialty?: string | null;
  limit?: number;
}): Promise<ClinicianMatchResult> {
  const carePath = resolveCarePath(opts.concern || "");
  const specialty = (opts.specialty ||
    carePath.consultationType) as CarePath["consultationType"];

  const confidence = carePath.intentConfidence ?? 0;
  const whyMatched = carePath.whyMatched ?? [];

  let panels = await listBookableDoctors(specialty, { soft: false });
  let usedSoft = false;
  if (panels.length === 0) {
    panels = await listBookableDoctors(specialty, { soft: true });
    usedSoft = panels.length > 0;
  }

  const ranked: RankedClinician[] = panels
    .map((panel) => {
      const { score, reason } = scorePanel(panel, specialty, carePath);
      return {
        ...panel,
        matchScore: score,
        matchReason: reason,
        aiRecommended: false,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);

  if (ranked[0]) ranked[0].aiRecommended = true;

  const limited = ranked.slice(0, opts.limit ?? 8);
  const top = limited[0];

  const summary = top
    ? usedSoft
      ? `AI mapped “${carePath.concernLabel}” → ${carePath.specialty} (${Math.round(confidence * 100)}% intent match). No exact ${specialty.replaceAll("_", " ")} panel yet — suggesting best available: ${top.name}.`
      : `AI mapped “${carePath.concernLabel}” → ${carePath.specialty} (${Math.round(confidence * 100)}% intent match). Best match: ${top.name} (${top.matchScore}% fit).`
    : `AI mapped “${carePath.concernLabel}” → ${carePath.specialty}, but no bookable clinicians are online for that specialty yet. Ask admin to add a panel.`;

  return {
    carePath,
    specialty,
    specialtyLabel: carePath.specialty,
    clinicians: limited,
    recommendedDoctorId: top?.id ?? null,
    summary,
    model: "aw-match-v2",
    intentConfidence: confidence,
    whyMatched,
  };
}
