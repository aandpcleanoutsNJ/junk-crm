"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatCents } from "@/lib/money";
import type { InvoiceSummary } from "@/lib/types";

const STATUS_COLORS: Record<InvoiceSummary["status"], string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-600",
  paid: "bg-green-600",
};

export default function InvoicesPage() {
  const { t } = useLang();
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/invoices")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || t.errors.generic);
          return;
        }
        setInvoices(data.invoices);
      })
      .catch(() => {
        if (!cancelled) setError(t.errors.couldNotLoadInvoices);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unpaidTotalCents = useMemo(() => {
    if (!invoices) return 0;
    return invoices
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.totalCents, 0);
  }, [invoices]);

  const statusLabel = (status: InvoiceSummary["status"]) => {
    if (status === "draft") return t.invoices.statusDraft;
    if (status === "sent") return t.invoices.statusSent;
    return t.invoices.statusPaid;
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
          aria-label={t.common.back}
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">{t.invoices.title}</h1>
      </div>

      <Link href="/invoices/new" className="btn btn-green">
        🧾 {t.invoices.newInvoice}
      </Link>

      {invoices && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-left text-xl font-bold text-red-700">
          {t.invoices.unpaidLabel} {formatCents(unpaidTotalCents)}
        </div>
      )}

      {error && <p className="banner banner-error">{error}</p>}

      {!invoices && !error && (
        <p className="py-8 text-center text-lg text-gray-500">{t.common.loading}</p>
      )}

      {invoices && invoices.length === 0 && (
        <p className="py-8 text-center text-lg text-gray-500">{t.invoices.noInvoicesYet}</p>
      )}

      <div className="flex flex-col gap-3">
        {invoices?.map((invoice) => (
          <Link
            key={invoice.id}
            href={`/invoices/${invoice.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </p>
                <p className="truncate text-base text-gray-600">{invoice.billToName}</p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatCents(invoice.totalCents)}
                </span>
                <span className={`badge ${STATUS_COLORS[invoice.status]}`}>
                  {statusLabel(invoice.status)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
