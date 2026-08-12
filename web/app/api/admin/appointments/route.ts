import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments, paginate } from "@/lib/demo-data";
import { useDatabaseMode, apiListAppointments } from "@/lib/api-service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 30);

  if (useDatabaseMode()) {
    const { appointments, pagination } = await apiListAppointments({ page, limit: pageSize });
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

  const result = paginate(demoAppointments, page, pageSize);
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
