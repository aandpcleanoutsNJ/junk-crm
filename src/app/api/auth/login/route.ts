import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/session";
import { getServerDict } from "@/lib/i18n-server";

export async function POST(request: Request) {
  const t = await getServerDict();

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: t.errors.authNotConnected }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!pin || pin !== process.env.APP_PIN) {
    return NextResponse.json({ error: t.errors.wrongPin }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
