"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/compressImage";
import { useLang } from "./LanguageProvider";
import ConfirmDialog from "./ConfirmDialog";

interface PhotoItem {
  id: string;
  previewUrl: string;
  url: string | null;
  status: "working" | "done" | "error";
  error?: string;
}

interface PhotoPickerProps {
  onChange: (urls: string[]) => void;
}

let nextId = 0;

/**
 * "Take / Add Photos" button + thumbnail strip. Compresses each photo in the
 * browser, uploads it right away, and reports the growing list of uploaded
 * URLs to the parent form via onChange.
 */
export default function PhotoPicker({ onChange }: PhotoPickerProps) {
  const { t } = useLang();
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [removing, setRemoving] = useState<PhotoItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange(items.filter((i) => i.status === "done" && i.url).map((i) => i.url as string));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    for (const file of files) {
      const id = `p${nextId++}`;
      const previewUrl = URL.createObjectURL(file);
      setItems((prev) => [
        ...prev,
        { id, previewUrl, url: null, status: "working" },
      ]);

      try {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t.errors.couldNotUploadGeneric);
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, url: data.url, status: "done" } : i
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "error",
                  error: err instanceof Error ? err.message : t.errors.couldNotUploadGeneric,
                }
              : i
          )
        );
      }
    }
  }

  function confirmRemove() {
    if (!removing) return;
    const target = removing;
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    setRemoving(null);
    if (target.url) {
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.url }),
      }).catch(() => {
        // Best-effort cleanup; nothing for the user to do if this fails.
      });
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-blue"
        onClick={() => inputRef.current?.click()}
      >
        📷 {t.photoPicker.takeAddPhotos}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={t.photoPicker.jobPhotoAlt}
                className="h-full w-full rounded-xl object-cover"
              />
              {item.status === "working" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-sm font-semibold text-white">
                  {t.photoPicker.uploading}
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-600/80 p-1 text-center text-xs font-semibold text-white">
                  {t.photoPicker.couldntUpload}
                </div>
              )}
              <button
                type="button"
                aria-label={t.jobDetail.removePhotoAria}
                onClick={() => setRemoving(item)}
                className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {removing && (
        <ConfirmDialog
          message={t.photoPicker.removePhotoConfirm}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
