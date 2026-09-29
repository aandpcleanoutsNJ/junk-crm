"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InvoiceItemsEditor from "@/components/InvoiceItemsEditor";
import { useLang } from "@/components/LanguageProvider";
import type { Invoice, InvoiceItemInput } from "@/lib/types";

interface ReviewState {
  items: InvoiceItemInput[];
  taxRate: number;
  notes: string;
}

export default function EditInvoiceClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { t } = useLang();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadError, setLoadError] = useState("");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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

  async function handleSave() {
    if (!invoice || !review || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billToName: invoice.billToName,
          billToPhone: invoice.billToPhone,
          billToEmail: invoice.billToEmail,
          billToStreet: invoice.billToStreet,
          billToCity: invoice.billToCity,
          billToState: invoice.billToState,
          billToZip: invoice.billToZip,
          taxRate: review.taxRate,
          notes: review.notes,
          items: review.items,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || t.errors.generic);
        return;
      }
      router.push(`/invoices/${invoiceId}?saved=1`);
    } catch {
      setSaveError(t.errors.network);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <BackButton invoiceId={invoiceId} label={t.common.back} />
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

  if (invoice.status === "paid") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <BackButton invoiceId={invoiceId} label={t.common.back} />
        <p className="banner banner-error">{t.errors.cannotEditInvoice}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <BackButton invoiceId={invoiceId} label={t.common.back} />
        <h1 className="text-2xl font-extrabold text-gray-900">{t.invoiceDetail.editInvoiceTitle}</h1>
      </div>

      {saveError && <p className="banner banner-error">{saveError}</p>}

      <InvoiceItemsEditor
        initialItems={invoice.items.map((item) => ({
          jobId: item.jobId,
          propertyAddress: item.propertyAddress,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        }))}
        initialTaxRate={invoice.taxRate}
        initialNotes={invoice.notes}
        onChange={setReview}
      />

      <button type="button" className="btn btn-green" onClick={handleSave} disabled={saving}>
        {saving ? t.jobForm.savingEllipsis : `✅ ${t.invoiceWizard.saveInvoice}`}
      </button>
    </main>
  );
}

function BackButton({ invoiceId, label }: { invoiceId: string; label: string }) {
  return (
    <Link
      href={`/invoices/${invoiceId}`}
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
      aria-label={label}
    >
      ←
    </Link>
  );
}
