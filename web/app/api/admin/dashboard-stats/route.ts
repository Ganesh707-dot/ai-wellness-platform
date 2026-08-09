import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/demo-data";
import { denyUnlessPermission } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const gate = denyUnlessPermission(role, "analytics:ops");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  return NextResponse.json(getAdminStats());
}
