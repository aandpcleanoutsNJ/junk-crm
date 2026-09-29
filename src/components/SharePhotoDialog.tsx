"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LanguageProvider";
import { formatDateOnly } from "@/lib/format";

interface SharePhotoDialogProps {
  photoId: string;
  onClose: () => void;
}

type Status = "loading" | "ready" | "error";

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Shows a before/after photo with an editable date stamp burned onto a copy,
 * then hands it to the phone's native share sheet (or falls back to a plain
 * download when Web Share with files isn't supported).
 */
export default function SharePhotoDialog({ photoId, onClose }: SharePhotoDialogProps) {
  const { t, lang } = useLang();
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState<Status>("loading");
  const [shareError, setShareError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await fetch(`/api/photos/${photoId}`);
        if (!res.ok) throw new Error("load failed");
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("decode failed"));
          img.src = objectUrl as string;
        });
        if (cancelled) return;
        imageRef.current = img;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  useEffect(() => {
    if (status !== "ready") return;
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const label = formatDateOnly(date, lang === "es" ? "es" : "en-US");
    const fontSize = Math.max(28, Math.round(canvas.width * 0.045));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const paddingX = fontSize * 0.6;
    const paddingY = fontSize * 0.5;
    const textWidth = ctx.measureText(label).width;
    const barHeight = fontSize + paddingY * 2;
    const barY = canvas.height - barHeight;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, barY, textWidth + paddingX * 2, barHeight);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, paddingX, barY + barHeight / 2);
  }, [status, date, lang]);

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setShareError("");
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (!blob) return;
    const file = new File([blob], `photo-${date}.jpg`, { type: "image/jpeg" });

    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { files: File[] }) => Promise<void>;
    };

    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setShareError(t.shareModal.shareFailed);
        }
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
          {t.shareModal.title}
        </h2>

        {status === "loading" && (
          <p className="py-10 text-center text-lg text-gray-500">{t.shareModal.preparing}</p>
        )}
        {status === "error" && <p className="banner banner-error">{t.errors.generic}</p>}
        {shareError && <p className="banner banner-error mb-4">{shareError}</p>}

        {status === "ready" && (
          <>
            <canvas ref={canvasRef} className="mb-4 w-full rounded-xl" />
            <div className="mb-4">
              <label className="field-label" htmlFor="shareDate">
                {t.shareModal.dateLabel}
              </label>
              <input
                id="shareDate"
                type="date"
                className="field-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {!canNativeShare && (
              <p className="mb-4 text-center text-base text-gray-500">
                {t.shareModal.notSupportedHint}
              </p>
            )}
          </>
        )}

        <div className="flex flex-col gap-3">
          {status === "ready" && (
            <button type="button" className="btn btn-blue" onClick={handleShare}>
              📤 {canNativeShare ? t.shareModal.share : t.shareModal.download}
            </button>
          )}
          <button type="button" className="btn btn-gray" onClick={onClose}>
            {t.shareModal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
