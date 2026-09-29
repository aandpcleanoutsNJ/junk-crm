import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  isAuthConfigured,
  type SessionData,
} from "@/lib/session";

// Every page and API route requires a logged-in session, except the login
// page itself and the login API it calls (see `config.matcher` below).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  let loggedIn = false;

  if (isAuthConfigured()) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (cookie) {
      try {
        const data = await unsealData<SessionData>(cookie, {
          password: process.env.SESSION_SECRET as string,
          ttl: SESSION_MAX_AGE,
        });
        loggedIn = Boolean(data.isLoggedIn);
      } catch {
        loggedIn = false;
      }
    }
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json(
      { error: "Please log in again." },
      { status: 401 }
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!login|api/auth/login|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.json|icons/|brand/|sw.js).*)",
  ],
};
