import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listJobs, createJob } from "@/lib/jobs";
import { dbErrorResponse, parseJobFormInput } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

export async function GET() {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  try {
    const { jobs, notPaidTotal } = await listJobs();
    return NextResponse.json({ jobs, notPaidTotal });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = parseJobFormInput(body, t);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const job = await createJob(parsed.input);
    return NextResponse.json({ job });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
