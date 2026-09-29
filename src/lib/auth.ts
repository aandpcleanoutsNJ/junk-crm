import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { getSessionOptions, isAuthConfigured, type SessionData } from "./session";

/** Reads (and can write to) the current request's session. */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

/**
 * Use in Server Components and Route Handlers as a second check behind the
 * proxy (see src/proxy.ts). Returns null if not logged in or not configured.
 */
export async function requireSession() {
  if (!isAuthConfigured()) return null;
  const session = await getSession();
  return session.isLoggedIn ? session : null;
}
