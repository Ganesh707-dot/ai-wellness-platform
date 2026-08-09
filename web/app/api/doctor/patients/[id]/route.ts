import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { buildPatientDossier } from "@/lib/patient-chart";
import { resolveClinicianDoctorId } from "@/lib/user-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "DOCTOR" && role !== "CLINICAL_LEAD" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionDoctorId = (session.user as { doctorId?: string }).doctorId;
  const resolved =
    sessionDoctorId ||
    (await resolveClinicianDoctorId(session.user.email));
  const doctorId = role === "DOCTOR" ? resolved || undefined : undefined;

  const { id } = await context.params;
  const dossier = await buildPatientDossier(id, doctorId);
  if (!dossier) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, patient: dossier });
}
