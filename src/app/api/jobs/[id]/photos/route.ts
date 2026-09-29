import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { addPhoto, getJobById } from "@/lib/jobs";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";
import type { PhotoKind } from "@/lib/types";

const VALID_KINDS: PhotoKind[] = ["general", "before", "after"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { urls?: unknown; kind?: unknown }
    | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((u): u is string => typeof u === "string")
    : [];
  const kind: PhotoKind = VALID_KINDS.includes(body?.kind as PhotoKind)
    ? (body!.kind as PhotoKind)
    : "general";
  if (urls.length === 0) {
    return NextResponse.json({ error: t.errors.noPhotosToAdd }, { status: 400 });
  }
  try {
    for (const url of urls) {
      await addPhoto(id, url, kind);
    }
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: t.errors.jobNotFound }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
