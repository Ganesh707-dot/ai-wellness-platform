import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments, paginate } from "@/lib/demo-data";
import {
  canViewEncounter,
  enrichSeedAppointment,
  listLiveEncounters,
} from "@/lib/demo-store";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 20);
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
          ...demoAppointments
            .slice(0, 40)
            .map((a) => enrichSeedAppointment(a)),
        ];

  const result = paginate(rows, page, pageSize);
  return NextResponse.json({
    appointments: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      platformTotal: 28460,
    },
  });
}
