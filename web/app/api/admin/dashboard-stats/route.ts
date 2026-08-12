import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/demo-data";
import { denyUnlessPermission } from "@/lib/rbac";
import { useDatabaseMode, apiAdminStats } from "@/lib/api-service";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const gate = denyUnlessPermission(role, "analytics:ops");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  if (useDatabaseMode()) {
    const stats = await apiAdminStats();
    return NextResponse.json({ ...stats, dataSource: "neon" });
  }

  return NextResponse.json(getAdminStats());
}
