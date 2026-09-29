"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useLang } from "@/components/LanguageProvider";
import { formatDate, formatDateOnly } from "@/lib/format";
import { formatCents } from "@/lib/money";
import type { Invoice } from "@/lib/types";

const STATUS_COLORS: Record<Invoice["status"], string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-600",
  paid: "bg-green-600",
};

export default function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [showSaved, setShowSaved] = useState(searchParams.get("saved") === "1");
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invoices/${invoiceId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || t.errors.generic);
          return;
        }
        setInvoice(data.invoice);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t.errors.couldNotLoadInvoice);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [showSaved]);

  async function runAction(action: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.couldNotUpdate);
        return;
      }
      setInvoice(data.invoice);
    } catch {
      setError(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], `${invoice?.invoiceNumber ?? "invoice"}.pdf`, {
        type: "application/pdf",
      });

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[] }) => Promise<void>;
      };

      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file] });
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            setError(t.shareModal.shareFailed);
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
    } catch {
      setError(t.shareModal.shareFailed);
    } finally {
      setSharing(false);
    }
  }

  async function confirmDelete() {
    setShowDeleteConfirm(false);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.couldNotDeleteInvoice);
        return;
      }
      router.push("/invoices");
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

  if (!invoice) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <p className="py-8 text-center text-lg text-gray-500">{t.common.loading}</p>
      </main>
    );
  }

  const statusLabel =
    invoice.status === "draft"
      ? t.invoices.statusDraft
      : invoice.status === "sent"
        ? t.invoices.statusSent
        : t.invoices.statusPaid;

  const canEdit = invoice.status !== "paid";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <BackButton label={t.common.back} />
        <h1 className="truncate text-2xl font-extrabold text-gray-900">
          {invoice.invoiceNumber}
        </h1>
        <span className={`badge ${STATUS_COLORS[invoice.status]}`}>{statusLabel}</span>
      </div>

      {showSaved && <p className="banner banner-success">{t.invoiceDetail.invoiceSaved}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <section className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold uppercase text-blue-700">{t.invoiceDetail.billTo}</p>
        <p className="text-lg font-bold text-gray-900">{invoice.billToName}</p>
        {invoice.billToPhone && <p className="text-base text-gray-700">{invoice.billToPhone}</p>}
        {invoice.billToEmail && <p className="text-base text-gray-700">{invoice.billToEmail}</p>}
        {(invoice.billToStreet || invoice.billToCity) && (
          <p className="text-base text-gray-700">
            {[invoice.billToStreet, [invoice.billToCity, invoice.billToState].filter(Boolean).join(", "), invoice.billToZip]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        <div className="mt-2 flex justify-between text-base text-gray-600">
          <span>
            {t.invoiceDetail.issueDate}: {formatDateOnly(invoice.issueDate, locale)}
          </span>
          <span>
            {t.invoiceDetail.dueDate}: {formatDateOnly(invoice.dueDate, locale)}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-gray-900">{t.invoiceDetail.itemsHeading}</h2>
        <div className="flex flex-col gap-2">
          {invoice.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-gray-900">
                  {item.propertyAddress || item.description}
                </span>
                <span className="font-bold text-gray-900">{formatCents(item.lineAmountCents)}</span>
              </div>
              {item.propertyAddress && item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              <p className="text-sm text-gray-500">
                {item.quantity} × {formatCents(item.unitPriceCents)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex justify-between py-1 text-lg text-gray-700">
            <span>{t.invoiceWizard.subtotalLabel}</span>
            <span>{formatCents(invoice.subtotalCents)}</span>
          </div>
          <div className="flex justify-between py-1 text-lg text-gray-700">
            <span>
              {t.invoiceWizard.taxLabel} ({invoice.taxRate}%)
            </span>
            <span>{formatCents(invoice.taxCents)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-2 text-xl font-extrabold text-gray-900">
            <span>{t.invoiceWizard.totalLabel}</span>
            <span>{formatCents(invoice.totalCents)}</span>
          </div>
        </div>

        {invoice.status === "paid" && invoice.paidAt && (
          <p className="text-center text-base text-gray-500">
            {t.invoiceDetail.paidOn} {formatDate(invoice.paidAt)}
          </p>
        )}
      </section>

      {invoice.notes.trim() && (
        <section>
          <h2 className="mb-1 text-lg font-bold text-gray-900">{t.invoiceDetail.notesHeading}</h2>
          <p className="whitespace-pre-wrap text-lg text-gray-700">{invoice.notes}</p>
        </section>
      )}

      <a href={`/api/invoices/${invoiceId}/pdf`} download={`${invoice.invoiceNumber}.pdf`} className="btn btn-blue">
        📄 {t.invoiceDetail.downloadPdf}
      </a>

      <button type="button" className="btn btn-blue" onClick={handleShare} disabled={sharing}>
        📤 {t.invoiceDetail.share}
      </button>

      {canEdit && (
        <Link href={`/invoices/${invoiceId}/edit`} className="btn btn-outline">
          ✏️ {t.invoiceDetail.editButton}
        </Link>
      )}

      {invoice.status === "draft" && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => runAction("markSent")}
          disabled={busy}
        >
          ✉️ {t.invoiceDetail.markSent}
        </button>
      )}

      <button
        type="button"
        className={`btn ${invoice.status === "paid" ? "btn-red" : "btn-green"}`}
        onClick={() => runAction(invoice.status === "paid" ? "markUnpaid" : "markPaid")}
        disabled={busy}
      >
        💵 {invoice.status === "paid" ? t.invoiceDetail.markUnpaid : t.invoiceDetail.markPaid}
      </button>

      <button
        type="button"
        className="btn btn-red"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={busy}
      >
        🗑️ {t.invoiceDetail.deleteInvoice}
      </button>

      {showDeleteConfirm && (
        <ConfirmDialog
          message={t.invoiceDetail.deleteConfirm}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </main>
  );
}

function BackButton({ label }: { label: string }) {
  return (
    <Link
      href="/invoices"
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
      aria-label={label}
    >
      ←
    </Link>
  );
}
