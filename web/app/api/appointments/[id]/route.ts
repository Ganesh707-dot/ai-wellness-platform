import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments } from "@/lib/demo-data";
import {
  decideLiveEncounter,
  enrichSeedAppointment,
  getLiveEncounter,
} from "@/lib/demo-store";
import { denyUnlessPermission } from "@/lib/rbac";
import { useDatabaseMode, apiUpdateAppointment } from "@/lib/api-service";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (useDatabaseMode()) {
    const row = await db.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: row.id,
      status: row.status,
      scheduledAt: row.scheduledAt.toISOString(),
      concern: row.concern,
      patientName: row.patient.user.name,
      doctorName: row.doctor.user.name,
      dataSource: "neon",
    });
  }

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

  if (useDatabaseMode()) {
    const status = body.decision === "accept" ? "CONFIRMED" : "CANCELLED";
    const updated = await apiUpdateAppointment(id, {
      status,
      notes: body.note,
      cancellationReason: body.decision === "decline" ? body.note : undefined,
    });
    return NextResponse.json({ success: true, appointment: updated, dataSource: "neon" });
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
