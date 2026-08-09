import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { paginate } from "@/lib/demo-data";
import { searchPatientsForDoctor } from "@/lib/patient-chart";
import { resolveClinicianDoctorId } from "@/lib/user-store";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "DOCTOR" && role !== "CLINICAL_LEAD" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 30);
  const q = searchParams.get("q") || "";
  const specialty = searchParams.get("specialty") || undefined;
  const statusFilter = searchParams.get("status") || undefined;
  const riskOnly = searchParams.get("riskOnly") === "1";

  const sessionDoctorId = (session.user as { doctorId?: string }).doctorId;
  const resolved =
    sessionDoctorId ||
    (await resolveClinicianDoctorId(session.user.email));

  // Fresher doctors see their panel; lead/admin see clinic-wide
  const doctorId =
    role === "DOCTOR" ? resolved || undefined : undefined;

  const { patients, intentPreview, query, facets } =
    await searchPatientsForDoctor(q, {
      specialty,
      status: statusFilter,
      riskOnly,
      doctorId,
    });
  const result = paginate(patients, page, pageSize);

  return NextResponse.json({
    patients: result.data,
    intentPreview,
    query,
    facets,
    searchMode: q ? "context-intent" : "panel",
    panelScope: doctorId || "clinic",
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}
