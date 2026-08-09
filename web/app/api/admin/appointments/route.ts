import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoAppointments, paginate } from "@/lib/demo-data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 30);
  const result = paginate(demoAppointments, page, pageSize);
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
