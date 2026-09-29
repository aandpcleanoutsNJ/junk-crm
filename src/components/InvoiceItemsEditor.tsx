"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useLang } from "./LanguageProvider";
import {
  computeInvoiceTotals,
  formatCents,
  centsToDollars,
  dollarsToCents,
  lineAmountCents,
} from "@/lib/money";
import type { InvoiceItemInput } from "@/lib/types";

interface EditableItem {
  key: string;
  jobId: string | null;
  propertyAddress: string;
  description: string;
  quantityInput: string;
  priceInput: string;
}

interface InvoiceItemsEditorState {
  items: InvoiceItemInput[];
  taxRate: number;
  notes: string;
}

interface InvoiceItemsEditorProps {
  initialItems: InvoiceItemInput[];
  initialTaxRate?: number;
  initialNotes?: string;
  onChange: (state: InvoiceItemsEditorState) => void;
}

let nextKey = 0;

function toEditable(item: InvoiceItemInput): EditableItem {
  return {
    key: `i${nextKey++}`,
    jobId: item.jobId,
    propertyAddress: item.propertyAddress,
    description: item.description,
    quantityInput: String(item.quantity),
    priceInput: centsToDollars(item.unitPriceCents).toFixed(2),
  };
}

function toItemInput(item: EditableItem): InvoiceItemInput {
  const quantity = Number(item.quantityInput);
  const dollars = Number(item.priceInput.replace(/[^0-9.-]/g, ""));
  return {
    jobId: item.jobId,
    propertyAddress: item.propertyAddress,
    description: item.description,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitPriceCents: Number.isFinite(dollars) ? dollarsToCents(dollars) : 0,
  };
}

/**
 * Editable invoice line items + tax rate + notes, with a live subtotal/tax/
 * total footer. Uncontrolled by design: it owns its own state (so per-line
 * dollar inputs don't fight a parent re-render mid-keystroke) and just
 * reports the current derived state upward via onChange.
 */
export default function InvoiceItemsEditor({
  initialItems,
  initialTaxRate = 0,
  initialNotes = "",
  onChange,
}: InvoiceItemsEditorProps) {
  const { t } = useLang();
  const [items, setItems] = useState<EditableItem[]>(() => initialItems.map(toEditable));
  const [taxRateInput, setTaxRateInput] = useState(String(initialTaxRate));
  const [notes, setNotes] = useState(initialNotes);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const taxRate = Number(taxRateInput);
    onChangeRef.current({
      items: items.map(toItemInput),
      taxRate: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 0,
      notes,
    });
  }, [items, taxRateInput, notes]);

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addLine() {
    setItems((prev) => [
      ...prev,
      {
        key: `i${nextKey++}`,
        jobId: null,
        propertyAddress: "",
        description: "",
        quantityInput: "1",
        priceInput: "",
      },
    ]);
  }

  function confirmRemove() {
    if (!removingKey) return;
    setItems((prev) => prev.filter((i) => i.key !== removingKey));
    setRemovingKey(null);
  }

  const totals = computeInvoiceTotals(items.map(toItemInput), Number(taxRateInput) || 0);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const { quantity, unitPriceCents } = toItemInput(item);
        const amountCents = lineAmountCents(quantity, unitPriceCents);
        return (
          <div key={item.key} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-lg font-bold text-gray-900">{formatCents(amountCents)}</span>
              <button
                type="button"
                aria-label={t.invoiceWizard.removeLine}
                onClick={() => setRemovingKey(item.key)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">{t.invoiceWizard.propertyAddressLabel}</label>
                <input
                  className="field-input"
                  type="text"
                  value={item.propertyAddress}
                  onChange={(e) => updateItem(item.key, { propertyAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">{t.invoiceWizard.descriptionLabel}</label>
                <input
                  className="field-input"
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.key, { description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{t.invoiceWizard.quantityLabel}</label>
                  <input
                    className="field-input"
                    type="text"
                    inputMode="decimal"
                    value={item.quantityInput}
                    onChange={(e) =>
                      updateItem(item.key, { quantityInput: e.target.value.replace(/[^0-9.]/g, "") })
                    }
                  />
                </div>
                <div>
                  <label className="field-label">{t.invoiceWizard.unitPriceLabel}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
                      $
                    </span>
                    <input
                      className="field-input pl-8"
                      type="text"
                      inputMode="text"
                      value={item.priceInput}
                      onChange={(e) =>
                        updateItem(item.key, {
                          priceInput: e.target.value.replace(/[^0-9.-]/g, ""),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn btn-outline" onClick={addLine}>
        {t.invoiceWizard.addLine}
      </button>

      <div>
        <label className="field-label">{t.invoiceWizard.taxLabel}</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          value={taxRateInput}
          onChange={(e) => setTaxRateInput(e.target.value.replace(/[^0-9.]/g, ""))}
        />
      </div>

      <div>
        <label className="field-label">{t.invoiceWizard.notesLabel}</label>
        <textarea
          className="field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.invoiceWizard.notesPlaceholder}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex justify-between py-1 text-lg text-gray-700">
          <span>{t.invoiceWizard.subtotalLabel}</span>
          <span>{formatCents(totals.subtotalCents)}</span>
        </div>
        <div className="flex justify-between py-1 text-lg text-gray-700">
          <span>{t.invoiceWizard.taxLabel}</span>
          <span>{formatCents(totals.taxCents)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 py-2 text-xl font-extrabold text-gray-900">
          <span>{t.invoiceWizard.totalLabel}</span>
          <span>{formatCents(totals.totalCents)}</span>
        </div>
      </div>

      {removingKey && (
        <ConfirmDialog
          message={t.invoiceWizard.removeLineConfirm}
          onConfirm={confirmRemove}
          onCancel={() => setRemovingKey(null)}
        />
      )}
    </div>
  );
}
