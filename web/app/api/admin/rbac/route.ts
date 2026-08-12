import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  AUDIT_EVENTS_SEED,
  buildRbacMatrix,
  denyUnlessPermission,
} from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const gate = denyUnlessPermission(role, "rbac:read");
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    );
  }

  const matrix = buildRbacMatrix();
  return NextResponse.json({
    success: true,
    ...matrix,
    audit: AUDIT_EVENTS_SEED,
    sessionPermissions:
      (session?.user as { permissions?: string[] })?.permissions ||
      matrix.roles.find((r) => r.role === role)?.permissions ||
      [],
    policyVersion: "vcln-rbac-v1",
    enforcement: "middleware + API permission guards",
  });
}
