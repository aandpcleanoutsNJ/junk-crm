import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getPhotoUrl } from "@/lib/jobs";
import { getPhotoStream, isBlobConfigured } from "@/lib/blob";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

/**
 * Streams a job photo from the private Blob store. Every other part of the
 * app (thumbnails, gallery, lightbox) points <img> tags at this route
 * instead of a raw Blob URL, so a photo can only be viewed by someone with a
 * valid session cookie.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json({ error: t.errors.blobNotConnected }, { status: 503 });
  }

  const { id } = await params;

  let url: string | null;
  try {
    url = await getPhotoUrl(id);
  } catch (err) {
    return dbErrorResponse(err);
  }
  if (!url) {
    return NextResponse.json({ error: t.errors.photoNotFound }, { status: 404 });
  }

  const result = await getPhotoStream(url);
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: t.errors.photoNotFound }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
