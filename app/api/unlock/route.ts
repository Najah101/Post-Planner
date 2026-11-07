import { NextResponse } from "next/server";
import { COOKIE_NAME, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string };
  const expected = process.env.APP_PASSCODE;
  if (!expected || code !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
