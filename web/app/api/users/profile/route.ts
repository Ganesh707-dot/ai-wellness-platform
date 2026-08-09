import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { findDemoUser } from "@/lib/demo-data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = findDemoUser(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password: _password, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = findDemoUser(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    password: undefined,
    name: body.name || user.name,
    image: body.image || user.image,
  });
}
