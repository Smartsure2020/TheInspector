import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/spike"];
const CLIENT_PREFIX = "/c/";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === "/_not-found" || pathname.startsWith("/_next"))
    return NextResponse.next();

  // Client routes use OTP, not staff sessions
  if (pathname.startsWith(CLIENT_PREFIX)) return NextResponse.next();

  const sessionCookie = request.cookies.get("inspector.session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
