import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getJobById, updateJobDetails, setPaid, setStatus } from "@/lib/jobs";
import { dbErrorResponse, parseJobFormInput } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;
  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: t.errors.jobNotFound }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  try {
    if (body?.action === "setPaid") {
      const job = await setPaid(id, Boolean(body.paid));
      if (!job) return NextResponse.json({ error: t.errors.jobNotFound }, { status: 404 });
      return NextResponse.json({ job });
    }

    if (body?.action === "setStatus") {
      const status = body.status === "done" ? "done" : "open";
      const job = await setStatus(id, status);
      if (!job) return NextResponse.json({ error: t.errors.jobNotFound }, { status: 404 });
      return NextResponse.json({ job });
    }

    const parsed = parseJobFormInput(body, t);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const job = await updateJobDetails(id, parsed.input);
    if (!job) return NextResponse.json({ error: t.errors.jobNotFound }, { status: 404 });
    return NextResponse.json({ job });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
