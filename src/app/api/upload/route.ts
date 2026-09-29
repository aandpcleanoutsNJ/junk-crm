import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { isBlobConfigured, uploadPhoto, deletePhoto } from "@/lib/blob";
import { getServerDict } from "@/lib/i18n-server";

export async function POST(request: Request) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json({ error: t.errors.blobNotConnected }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: t.errors.noPhotoSent }, { status: 400 });
  }

  const name = file instanceof File ? file.name : "photo.jpg";
  try {
    const url = await uploadPhoto(name, file);
    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: t.errors.couldNotUploadPhoto }, { status: 500 });
  }
}

/**
 * Removes a photo that was uploaded but not yet attached to a saved job
 * (e.g. the user tapped X while still filling out the New Job form).
 * Photos already attached to a job are removed via
 * /api/jobs/[id]/photos/[photoId] instead, which also deletes the DB row.
 */
export async function DELETE(request: Request) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url : "";
  if (!url) {
    return NextResponse.json({ error: t.errors.noPhotoUrl }, { status: 400 });
  }
  await deletePhoto(url);
  return NextResponse.json({ ok: true });
}
