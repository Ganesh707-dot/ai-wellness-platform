import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments, paginate } from "@/lib/demo-data";
import {
  canViewEncounter,
  enrichSeedAppointment,
  listLiveEncounters,
} from "@/lib/demo-store";
import { useDatabaseMode, apiListAppointments } from "@/lib/api-service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 20);

  if (useDatabaseMode()) {
    const userId =
      (session.user as { role?: string }).role === "PATIENT" ? session.user.id : undefined;
    const doctorId = (session.user as { doctorId?: string }).doctorId;

    const { appointments, pagination } = await apiListAppointments({
      userId,
      doctorId: doctorId || undefined,
      page,
      limit: pageSize,
    });

    return NextResponse.json({
      appointments,
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        platformTotal: pagination.total,
      },
      dataSource: "neon",
    });
  }

  const role = (session.user as { role?: string }).role;
  const email = session.user.email || "";

  const live = (await listLiveEncounters()).filter((e) =>
    canViewEncounter(e, { role, email })
  );

  let rows =
    role === "PATIENT"
      ? [
          ...live,
          ...demoAppointments
            .filter((a) => a.patientName === "Asha Patel")
            .map((a) => enrichSeedAppointment(a)),
        ]
      : [
          ...live,
          ...demoAppointments.slice(0, 40).map((a) => enrichSeedAppointment(a)),
        ];

  const result = paginate(rows, page, pageSize);
  return NextResponse.json({
    appointments: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      platformTotal: result.total,
    },
  });
}
