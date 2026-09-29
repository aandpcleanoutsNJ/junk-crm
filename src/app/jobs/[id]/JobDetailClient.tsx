"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import SharePhotoDialog from "@/components/SharePhotoDialog";
import { useLang } from "@/components/LanguageProvider";
import { compressImage } from "@/lib/compressImage";
import {
  formatAddress,
  formatDate,
  formatDateOnly,
  formatMoney,
  isAddressEmpty,
  jobAddress as computeJobAddress,
  mapsDirectionsUrl,
  mapsEmbedUrl,
  telHref,
} from "@/lib/format";
import type { Job, JobPhoto, PhotoKind } from "@/lib/types";

export default function JobDetailClient({ jobId }: { jobId: string }) {
  const searchParams = useSearchParams();
  const { t, lang } = useLang();

  const [job, setJob] = useState<Job | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [showSaved, setShowSaved] = useState(searchParams.get("saved") === "1");
  const [busy, setBusy] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [sharingPhotoId, setSharingPhotoId] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<PhotoKind | null>(null);

  const generalFileInput = useRef<HTMLInputElement>(null);
  const beforeFileInput = useRef<HTMLInputElement>(null);
  const afterFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/${jobId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || t.errors.generic);
          return;
        }
        setJob(data.job);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t.errors.couldNotLoadJob);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [showSaved]);

  async function togglePaid() {
    if (!job || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPaid", paid: !job.paid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.couldNotUpdate);
        return;
      }
      setJob(data.job);
    } catch {
      setError(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    if (!job || busy) return;
    setBusy(true);
    setError("");
    try {
      const nextStatus = job.status === "done" ? "open" : "done";
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setStatus", status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.couldNotUpdate);
        return;
      }
      setJob(data.job);
    } catch {
      setError(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddPhotos(fileList: FileList | null, kind: PhotoKind) {
    if (!fileList || fileList.length === 0 || !job) return;
    setUploadingKind(kind);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(fileList)) {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || t.errors.couldNotUploadGeneric);
        urls.push(data.url);
      }
      const res = await fetch(`/api/jobs/${jobId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.errors.couldNotAddPhotos);
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.couldNotAddPhotos);
    } finally {
      setUploadingKind(null);
    }
  }

  async function confirmRemovePhoto() {
    if (!removingPhotoId || !job) return;
    const photoId = removingPhotoId;
    setRemovingPhotoId(null);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/photos/${photoId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.couldNotRemovePhoto);
        return;
      }
      setJob({ ...job, photos: job.photos.filter((p) => p.id !== photoId) });
    } catch {
      setError(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <BackButton label={t.common.back} />
        <p className="banner banner-error">{loadError}</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <p className="py-8 text-center text-lg text-gray-500">{t.common.loading}</p>
      </main>
    );
  }

  const address = computeJobAddress(job);
  const hasAddress = !isAddressEmpty(address);
  const addressStr = formatAddress(address);
  const customerAddressStr = formatAddress({
    street: job.customerStreet,
    city: job.customerCity,
    state: job.customerState,
    zip: job.customerZip,
  });

  const generalPhotos = job.photos.filter((p) => p.kind === "general");
  const beforePhotos = job.photos.filter((p) => p.kind === "before");
  const afterPhotos = job.photos.filter((p) => p.kind === "after");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <BackButton label={t.common.back} />
        <h1 className="truncate text-2xl font-extrabold text-gray-900">
          {job.customerName}
        </h1>
      </div>

      {showSaved && <p className="banner banner-success">{t.jobDetail.jobSaved}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        {job.customerPhone && (
          <a href={telHref(job.customerPhone)} className="btn btn-blue">
            📞 {t.jobDetail.call} {job.customerPhone}
          </a>
        )}
        {job.customerEmail && (
          <p className="text-lg text-gray-700">✉️ {job.customerEmail}</p>
        )}
        <p className="text-lg text-gray-700">
          {customerAddressStr || t.jobDetail.noCustomerAddress}
        </p>
        {job.scheduledDate && (
          <p className="text-lg font-semibold text-blue-700">
            📅 {t.jobDetail.scheduledFor}{" "}
            {formatDateOnly(job.scheduledDate, lang === "es" ? "es" : "en-US")}
          </p>
        )}
      </section>

      {hasAddress && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900">{t.jobDetail.jobLocation}</h2>
          <p className="text-lg text-gray-700">{addressStr}</p>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <iframe
              title="Job location map"
              src={mapsEmbedUrl(addressStr)}
              className="h-56 w-full"
              loading="lazy"
            />
          </div>
          <a
            href={mapsDirectionsUrl(addressStr)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-blue"
          >
            📍 {t.jobDetail.getDirections}
          </a>
        </section>
      )}

      {job.description && (
        <section>
          <h2 className="mb-1 text-lg font-bold text-gray-900">
            {t.jobDetail.descriptionHeading}
          </h2>
          <p className="whitespace-pre-wrap text-lg text-gray-700">{job.description}</p>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
          <span className="text-lg font-semibold text-gray-700">
            {t.jobDetail.jobValueHeading}
          </span>
          <span className="text-2xl font-extrabold text-gray-900">
            {formatMoney(job.jobValue)}
          </span>
        </div>
        <button
          type="button"
          className={`btn ${job.paid ? "btn-red" : "btn-green"}`}
          onClick={togglePaid}
          disabled={busy}
        >
          {job.paid ? `❌ ${t.jobDetail.markNotPaid}` : `💵 ${t.jobDetail.markPaid}`}
        </button>
        {job.paid && job.paidAt && (
          <p className="text-center text-base text-gray-500">
            {t.jobDetail.paidOn} {formatDate(job.paidAt)}
          </p>
        )}
      </section>

      <PhotoSection
        heading={t.jobDetail.photosHeading}
        photos={generalPhotos}
        addLabel={t.jobDetail.addMorePhotos}
        uploadingLabel={t.photoPicker.uploading}
        uploading={uploadingKind === "general"}
        showShare={false}
        onAdd={() => generalFileInput.current?.click()}
        onEnlarge={setLightboxPhotoId}
        onRemove={setRemovingPhotoId}
        onShare={setSharingPhotoId}
        enlargeAlt={t.jobDetail.enlargeAlt}
        removeAria={t.jobDetail.removePhotoAria}
        shareLabel={t.jobDetail.shareButton}
      />
      <input
        ref={generalFileInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddPhotos(e.target.files, "general");
          e.target.value = "";
        }}
      />

      <PhotoSection
        heading={t.jobDetail.beforePhotosHeading}
        photos={beforePhotos}
        addLabel={t.jobDetail.addBeforePhotos}
        uploadingLabel={t.photoPicker.uploading}
        uploading={uploadingKind === "before"}
        showShare
        onAdd={() => beforeFileInput.current?.click()}
        onEnlarge={setLightboxPhotoId}
        onRemove={setRemovingPhotoId}
        onShare={setSharingPhotoId}
        enlargeAlt={t.jobDetail.enlargeAlt}
        removeAria={t.jobDetail.removePhotoAria}
        shareLabel={t.jobDetail.shareButton}
      />
      <input
        ref={beforeFileInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddPhotos(e.target.files, "before");
          e.target.value = "";
        }}
      />

      <PhotoSection
        heading={t.jobDetail.afterPhotosHeading}
        photos={afterPhotos}
        addLabel={t.jobDetail.addAfterPhotos}
        uploadingLabel={t.photoPicker.uploading}
        uploading={uploadingKind === "after"}
        showShare
        onAdd={() => afterFileInput.current?.click()}
        onEnlarge={setLightboxPhotoId}
        onRemove={setRemovingPhotoId}
        onShare={setSharingPhotoId}
        enlargeAlt={t.jobDetail.enlargeAlt}
        removeAria={t.jobDetail.removePhotoAria}
        shareLabel={t.jobDetail.shareButton}
      />
      <input
        ref={afterFileInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddPhotos(e.target.files, "after");
          e.target.value = "";
        }}
      />

      <Link href={`/jobs/${jobId}/edit`} className="btn btn-outline">
        ✏️ {t.jobDetail.editButton}
      </Link>

      <button
        type="button"
        className={`btn ${job.status === "done" ? "btn-outline" : "btn-green"}`}
        onClick={toggleStatus}
        disabled={busy}
      >
        {job.status === "done" ? `↩️ ${t.jobDetail.reopen}` : `✅ ${t.jobDetail.markDone}`}
      </button>

      {lightboxPhotoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhotoId(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${lightboxPhotoId}`}
            alt="Job photo enlarged"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}

      {removingPhotoId && (
        <ConfirmDialog
          message={t.photoPicker.removePhotoConfirm}
          onConfirm={confirmRemovePhoto}
          onCancel={() => setRemovingPhotoId(null)}
        />
      )}

      {sharingPhotoId && (
        <SharePhotoDialog
          photoId={sharingPhotoId}
          onClose={() => setSharingPhotoId(null)}
        />
      )}
    </main>
  );
}

function BackButton({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
      aria-label={label}
    >
      ←
    </Link>
  );
}

interface PhotoSectionProps {
  heading: string;
  photos: JobPhoto[];
  addLabel: string;
  uploadingLabel: string;
  uploading: boolean;
  showShare: boolean;
  onAdd: () => void;
  onEnlarge: (photoId: string) => void;
  onRemove: (photoId: string) => void;
  onShare: (photoId: string) => void;
  enlargeAlt: string;
  removeAria: string;
  shareLabel: string;
}

function PhotoSection({
  heading,
  photos,
  addLabel,
  uploadingLabel,
  uploading,
  showShare,
  onAdd,
  onEnlarge,
  onRemove,
  onShare,
  enlargeAlt,
  removeAria,
  shareLabel,
}: PhotoSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square">
              <button
                type="button"
                className="h-full w-full"
                onClick={() => onEnlarge(photo.id)}
                aria-label={enlargeAlt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/photos/${photo.id}`}
                  alt="Job photo"
                  className="h-full w-full rounded-xl object-cover"
                />
              </button>
              <button
                type="button"
                aria-label={removeAria}
                onClick={() => onRemove(photo.id)}
                className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow"
              >
                ✕
              </button>
              {showShare && (
                <button
                  type="button"
                  onClick={() => onShare(photo.id)}
                  className="absolute -bottom-2 -left-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-base text-white shadow"
                  aria-label={shareLabel}
                >
                  📤
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-blue" onClick={onAdd} disabled={uploading}>
        {uploading ? uploadingLabel : `📷 ${addLabel}`}
      </button>
    </section>
  );
}
