import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getCustomers } from "@/lib/customers";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

export async function GET() {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  try {
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
