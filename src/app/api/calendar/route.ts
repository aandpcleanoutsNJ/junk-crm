import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listJobsByDateRange } from "@/lib/jobs";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export async function GET(request: Request) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }

  const url = new URL(request.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year")) || now.getFullYear();
  const month = Number(url.searchParams.get("month")) || now.getMonth() + 1;

  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${pad2(month)}-01`;
  const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;

  try {
    const jobs = await listJobsByDateRange(startDate, endDate);
    return NextResponse.json({ jobs });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
