import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { demoPrescriptions, isDemoMode } from "@/lib/demo-data";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isDemoMode()) {
    return NextResponse.json({ prescriptions: demoPrescriptions });
  }
  return NextResponse.json({ prescriptions: demoPrescriptions });
}
