/**
 * All invoice money math happens in integer cents to avoid floating-point
 * rounding errors. Jobs still store dollars (job_value) — see format.ts's
 * formatMoney for that side; this file is invoice-specific.
 */

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export interface InvoiceLineInput {
  quantity: number;
  unitPriceCents: number;
}

/** Rounds a single line to the nearest cent — the one place rounding happens. */
export function lineAmountCents(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

export interface InvoiceTotals {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

/** Sums already-rounded line amounts, then applies tax — matches the SQL aggregate used for the invoice list. */
export function computeInvoiceTotals(
  items: InvoiceLineInput[],
  taxRatePercent: number
): InvoiceTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + lineAmountCents(item.quantity, item.unitPriceCents),
    0
  );
  const taxCents = Math.round(subtotalCents * (taxRatePercent / 100));
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
