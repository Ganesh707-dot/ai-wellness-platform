import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments } from "@/lib/demo-data";
import {
  decideLiveEncounter,
  enrichSeedAppointment,
  getLiveEncounter,
} from "@/lib/demo-store";
import { denyUnlessPermission } from "@/lib/rbac";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const live = await getLiveEncounter(id);
  if (live) {
    return NextResponse.json(live);
  }

  const existing = demoAppointments.find((a) => a.id === id);
  if (existing) {
    return NextResponse.json(enrichSeedAppointment(existing));
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Clinician accept / decline for live booking requests */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role as
    | "PATIENT"
    | "DOCTOR"
    | "CLINICAL_LEAD"
    | "ADMIN"
    | undefined;

  const gate = denyUnlessPermission(role, "appointments:read_panel");
  if (gate.ok === false) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    decision?: "accept" | "decline";
    note?: string;
  };

  if (body.decision !== "accept" && body.decision !== "decline") {
    return NextResponse.json(
      { error: "decision must be accept | decline" },
      { status: 400 }
    );
  }

  const updated = await decideLiveEncounter(
    id,
    body.decision,
    session?.user?.name || session?.user?.email || "Clinician",
    body.note
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Only live booking requests can be decided in this demo" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    appointment: updated,
  });
}
