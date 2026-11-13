import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_COOKIE, parseGuestTokens } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// Opening a share link: remember the token in a cookie and go to that account.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const account = parseGuestTokens(token).length ? await getStore().findAccountByShareToken(token) : null;
  const url = request.nextUrl.clone();
  url.search = "";
  if (!account) {
    url.pathname = "/unlock";
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }
  url.pathname = `/${account.id}/calendar`;
  const res = NextResponse.redirect(url);
  const tokens = parseGuestTokens(request.cookies.get(GUEST_COOKIE)?.value).filter((t) => t !== token);
  res.cookies.set(GUEST_COOKIE, [token, ...tokens].slice(0, 20).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
