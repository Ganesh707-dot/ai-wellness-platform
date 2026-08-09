import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments, paginate } from "@/lib/demo-data";
import {
  canViewEncounter,
  clinicianDoctorIdForEmail,
  enrichSeedAppointment,
  listLiveEncounters,
} from "@/lib/demo-store";
import { resolveClinicianDoctorId } from "@/lib/user-store";
import { denyUnlessPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role as
    | "PATIENT"
    | "DOCTOR"
    | "CLINICAL_LEAD"
    | "ADMIN"
    | undefined;
  const email = session?.user?.email;

  const gate = denyUnlessPermission(role, "appointments:read_panel");
  if (gate.ok === false) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 25);

  const myDoctorId =
    (session?.user as { doctorId?: string } | undefined)?.doctorId ||
    (await resolveClinicianDoctorId(email)) ||
    clinicianDoctorIdForEmail(email);
  const liveAll = await listLiveEncounters();
  const live = liveAll.filter((e) =>
    canViewEncounter(e, { role, email, doctorId: myDoctorId })
  );

  const pending = live.filter((e) => e.status === "PENDING_REVIEW");

  // Seed rows: fresher → own panel only; lead/admin → clinic seed panel
  const seed = demoAppointments
    .filter((a) => {
      if (role === "DOCTOR") return a.doctorId === (myDoctorId || "doc_01");
      return a.doctorId === "doc_01" || a.doctorId === "doc_lead";
    })
    .map((a) => enrichSeedAppointment(a));

  const merged = [...live, ...seed];
  const result = paginate(merged, page, pageSize);

  return NextResponse.json({
    appointments: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      liveCount: live.length,
      pendingCount: pending.length,
      panelDoctorId: myDoctorId,
      visibility:
        role === "DOCTOR"
          ? "own_panel_only"
          : "clinic_wide_oversight",
      platformTotal: 28460,
    },
  });
}
