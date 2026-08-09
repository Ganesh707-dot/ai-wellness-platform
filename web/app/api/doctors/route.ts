import { NextResponse } from "next/server";
import { paginate } from "@/lib/demo-data";
import { listBookableDoctors } from "@/lib/doctor-panel-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get("specialization");
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 12);

  const doctors = await listBookableDoctors(specialization);
  const result = paginate(doctors, page, pageSize);

  return NextResponse.json({
    doctors: result.data,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      networkDoctors: doctors.length,
    },
  });
}
