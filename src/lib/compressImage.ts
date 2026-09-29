/**
 * Shrinks a photo in the browser before it's uploaded, so field crews on slow
 * mobile connections aren't stuck waiting to send full-size camera photos.
 * Resizes so the longest side is at most `maxSize` px and re-encodes as JPEG.
 */
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.8
): Promise<File> {
  const bitmap = await loadBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSize);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas not available for some reason; fall back to the original file.
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some HEIC/edge-case files fail createImageBitmap; fall through.
    }
  }
  return await loadImageElement(file);
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read photo."));
    };
    img.src = url;
  });
}

function fitWithin(width: number, height: number, maxSize: number) {
  if (width <= maxSize && height <= maxSize) return { width, height };
  const scale = width > height ? maxSize / width : maxSize / height;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
