import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  siteAccessCookieValue,
  verifySitePassword,
} from "@/lib/site-access";

export async function POST(req: NextRequest) {
  if (!process.env.SITE_ACCESS_PASSWORD?.trim()) {
    return NextResponse.json({ ok: true, lock: false });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifySitePassword(body.password ?? "")) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, siteAccessCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
