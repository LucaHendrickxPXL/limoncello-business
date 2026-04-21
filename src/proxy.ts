import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME } from "./lib/auth-constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(AUTH_SESSION_COOKIE_NAME);

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
