import { put, del, get } from "@vercel/blob";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Uploads to the private Blob store. The returned URL is only fetchable
 * server-side with BLOB_READ_WRITE_TOKEN (see getPhotoStream) — it is never
 * given to the browser directly. Photos are served through /api/photos/[id]
 * instead, which checks the session first.
 */
export async function uploadPhoto(
  filename: string,
  file: Blob
): Promise<string> {
  const blob = await put(filename, file, {
    access: "private",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deletePhoto(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Best-effort cleanup; if it fails we still remove the DB record.
  }
}

/** Streams a private photo's bytes for an authenticated route to relay to the browser. */
export async function getPhotoStream(url: string) {
  return get(url, { access: "private" });
}
