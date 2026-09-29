import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deletePhotoRecord } from "@/lib/jobs";
import { deletePhoto } from "@/lib/blob";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { photoId } = await params;
  try {
    const url = await deletePhotoRecord(photoId);
    if (!url) {
      return NextResponse.json({ error: t.errors.photoNotFound }, { status: 404 });
    }
    await deletePhoto(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
