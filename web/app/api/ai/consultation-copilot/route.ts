import { NextResponse } from "next/server";
import { buildClinicalCopilot } from "@/lib/ai-client";
import { getConsultationAiInsights } from "@/lib/demo-data";
import { getLiveEncounter } from "@/lib/demo-store";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId");
  const concern = searchParams.get("concern");

  if (appointmentId) {
    const live = await getLiveEncounter(appointmentId);
    if (live) {
      return NextResponse.json({
        success: true,
        result: {
          ...buildClinicalCopilot(live.chiefComplaint || live.concern),
          encounterId: live.id,
          patientName: live.patientName,
          whyContacted: live.chiefComplaint,
          suggestedSoap: live.soapDraft,
        },
      });
    }
  }

  if (concern) {
    return NextResponse.json({
      success: true,
      result: buildClinicalCopilot(concern),
    });
  }

  return NextResponse.json({
    success: true,
    result: getConsultationAiInsights(),
  });
}

const postSchema = z.object({
  concern: z.string().min(3).max(2000),
  appointmentId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = postSchema.parse(await request.json());
    let concern = body.concern;
    if (body.appointmentId) {
      const live = await getLiveEncounter(body.appointmentId);
      if (live) concern = live.chiefComplaint || live.concern;
    }
    return NextResponse.json({
      success: true,
      result: buildClinicalCopilot(concern),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}
