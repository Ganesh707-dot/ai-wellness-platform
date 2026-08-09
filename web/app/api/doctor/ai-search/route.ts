import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { searchClinicalIntent } from "@/lib/intent-search";
import { buildPatientDossier, searchPatientsForDoctor } from "@/lib/patient-chart";
import { buildClinicalCopilot } from "@/lib/ai-client";
import { resolveClinicianDoctorId } from "@/lib/user-store";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(2).max(500),
  patientId: z.string().optional(),
  specialty: z.string().optional(),
});

/**
 * Doctor AI analytics search:
 * - Intent search over clinical KB
 * - Optional patient dossier grounding
 * - Matched patients for the query (panel-scoped)
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "DOCTOR" && role !== "CLINICAL_LEAD" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = schema.parse(await request.json());
    const sessionDoctorId = (session.user as { doctorId?: string }).doctorId;
    const resolved =
      sessionDoctorId ||
      (await resolveClinicianDoctorId(session.user.email));
    const doctorId = role === "DOCTOR" ? resolved || undefined : undefined;

    const intents = searchClinicalIntent(body.query, 4);
    const top = intents[0];
    const matchedPatients = await searchPatientsForDoctor(body.query, {
      specialty: body.specialty,
      doctorId,
    });

    let dossier = null;
    if (body.patientId) {
      dossier = await buildPatientDossier(body.patientId, doctorId);
    }

    const groundedConcern =
      dossier?.analytics.lastConcern ||
      matchedPatients.patients[0]?.lastConcern ||
      body.query;

    const copilot = buildClinicalCopilot(groundedConcern);

    return NextResponse.json({
      success: true,
      query: body.query,
      intents,
      topIntent: top || null,
      matchedPatients: matchedPatients.patients.slice(0, 8),
      patient: dossier,
      analyticsAnswer: {
        forDoctor: top?.doctorAnswer || [],
        differentials: top?.differentials || [],
        redFlags: top?.redFlags || [],
        contextHints: top?.contextHints || [],
        whyMatched: top?.whyMatched || [],
        specialty: top?.specialty || "Family Wellness",
      },
      copilot,
      model: "aw-doctor-intent-analytics-v1",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
      },
      { status: 400 }
    );
  }
}
