import { NextResponse } from "next/server";
import { z } from "zod";
import { matchCliniciansForConcern } from "@/lib/match-clinician";

const schema = z.object({
  age: z.coerce.number().min(1).max(120),
  gender: z.string().min(1),
  symptoms: z.string().min(8),
  durationDays: z.coerce.number().min(1).max(365),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const match = await matchCliniciansForConcern({
      concern: input.symptoms,
      limit: 3,
    });

    const path = match.carePath;
    let urgency: "LOW" | "MODERATE" | "HIGH" = "LOW";
    if (path.isEmergency) urgency = "HIGH";
    else if (
      /(fever|migraine|dizzy|rash|vomit|severe pain)/i.test(input.symptoms)
    ) {
      urgency = "MODERATE";
    }

    const flags: string[] = [];
    if (input.durationDays >= 14) flags.push("Persistence ≥ 14 days");
    if (input.age >= 60) flags.push("Age escalation threshold");
    if (input.age <= 12) flags.push("Pediatric pathway suggested");
    if (path.isEmergency) flags.push("Emergency-pattern language detected");

    const result = {
      urgency,
      confidence: path.isEmergency ? 0.91 : 0.78,
      likelyCategory: match.specialty,
      summary: match.summary,
      recommendedNextStep: path.isEmergency
        ? "Escalate to emergency services now. Do not rely on telehealth for red-flag symptoms."
        : match.recommendedDoctorId
          ? `Book ${match.clinicians[0]?.name || "the AI-recommended clinician"} — request routes only to their panel.`
          : "Ask admin to add a clinician panel for this specialty, then book.",
      careTips: path.firstAid,
      flags,
      matchedDoctors: match.clinicians.map((d) => ({
        id: d.id,
        name: d.name,
        rating: d.rating,
        consultationFee: d.consultationFee,
        profileImage: d.profileImage,
        matchScore: d.matchScore,
        aiRecommended: d.aiRecommended,
        bookUrl: `/book-appointment?doctorId=${d.id}&type=${match.specialty}&concern=${encodeURIComponent(input.symptoms.slice(0, 120))}`,
      })),
      evidenceLinks: [
        {
          label: "Care pathway card",
          url: `https://knowledge.maha-ai.health/pathways/${match.specialty.toLowerCase()}`,
        },
      ],
      disclaimer:
        "AI triage is clinical decision support only — not a diagnosis or emergency service.",
      model: match.model,
      traceId: `trace_${Date.now().toString(36)}`,
      carePath: path,
    };

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
