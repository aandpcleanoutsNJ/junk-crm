import type { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
}

export const SESSION_COOKIE_NAME = "junkcrm_session";

// 90 days, in seconds.
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

// iron-session requires a password/secret of at least 32 characters.
// We only build real session options once we know SESSION_SECRET is set;
// callers must check isAuthConfigured() first.
export function getSessionOptions(): SessionOptions {
  return {
    password: process.env.SESSION_SECRET as string,
    cookieName: SESSION_COOKIE_NAME,
    // ttl controls how long the encrypted cookie itself stays valid; it must
    // be set explicitly (it does not follow cookieOptions.maxAge) or it
    // silently defaults to 14 days and logs everyone out early.
    ttl: SESSION_MAX_AGE,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
    },
  };
}

// True once an admin has set both env vars needed for login to work.
export function isAuthConfigured(): boolean {
  const pin = process.env.APP_PIN;
  const secret = process.env.SESSION_SECRET;
  return Boolean(pin && pin.length > 0 && secret && secret.length >= 32);
}
