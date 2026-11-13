import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, GUEST_COOKIE, isValidSession, parseGuestTokens } from "@/lib/auth";

// Coarse gate only. Which account a guest may see is checked server-side (lib/access.ts).
export async function proxy(request: NextRequest) {
  if (await isValidSession(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }
  if (parseGuestTokens(request.cookies.get(GUEST_COOKIE)?.value).length) {
    return NextResponse.next();
  }
  if (request.method !== "GET") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!unlock|api/unlock|s/|_next/static|_next/image|favicon.ico|icon.svg|uploads).*)"],
};
