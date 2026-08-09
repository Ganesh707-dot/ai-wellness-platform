import { NextResponse } from "next/server";
import { z } from "zod";
import { matchCliniciansForConcern } from "@/lib/match-clinician";

const schema = z.object({
  concern: z.string().min(4).max(500),
  specialty: z.string().min(3).max(40).optional(),
  limit: z.coerce.number().min(1).max(12).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await matchCliniciansForConcern({
      concern: body.concern,
      specialty: body.specialty,
      limit: body.limit,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Match failed",
      },
      { status: 400 }
    );
  }
}
