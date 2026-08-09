import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { denyUnlessPermission } from "@/lib/rbac";
import { buildCareBiSnapshot } from "@/lib/patient-chart";
import { listManagedUsers } from "@/lib/user-store";
import { listBookableDoctors } from "@/lib/doctor-panel-store";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const gate = denyUnlessPermission(role, "analytics:ops");
  if (gate.ok === false) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const [bi, users, panels] = await Promise.all([
    buildCareBiSnapshot(),
    listManagedUsers(),
    listBookableDoctors(),
  ]);

  const pendingUsers = users.filter(
    (u) => !u.isActive || u.accessStatus === "pending"
  ).length;
  const activeClinicians = users.filter(
    (u) =>
      u.isActive &&
      (u.role === "DOCTOR" || u.role === "CLINICAL_LEAD")
  ).length;

  return NextResponse.json({
    success: true,
    bi,
    iam: {
      totalUsers: users.length,
      pendingUsers,
      activeClinicians,
      bookablePanels: panels.length,
    },
  });
}
