import { NextResponse } from "next/server";
import { DbNotConnectedError } from "./jobs";
import { JobAlreadyInvoicedError, InvoiceLockedError } from "./invoices";
import { getServerDict } from "./i18n-server";
import type { Dict } from "./i18n";
import type { InvoiceFormInput, InvoiceItemInput, JobFormInput } from "./types";

/** Turns a thrown error from the jobs data layer into a friendly response. */
export async function dbErrorResponse(err: unknown) {
  const t = await getServerDict();
  if (err instanceof DbNotConnectedError) {
    return NextResponse.json({ error: t.errors.dbNotConnected }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: t.errors.generic }, { status: 500 });
}

/** Like dbErrorResponse, but also recognizes invoice-specific error types. */
export async function invoiceErrorResponse(err: unknown) {
  const t = await getServerDict();
  if (err instanceof JobAlreadyInvoicedError) {
    return NextResponse.json({ error: t.errors.jobAlreadyInvoiced }, { status: 409 });
  }
  if (err instanceof InvoiceLockedError) {
    return NextResponse.json({ error: t.errors.cannotEditInvoice }, { status: 409 });
  }
  return dbErrorResponse(err);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Normalizes an optional "YYYY-MM-DD" input to that string or null. */
function normalizeDate(v: unknown): string | null {
  const s = str(v).trim();
  return s.length > 0 ? s : null;
}

export function parseJobFormInput(
  body: unknown,
  t: Dict
): { input: JobFormInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: t.errors.missingJobDetails };
  }
  const b = body as Record<string, unknown>;

  const customerName = str(b.customerName).trim();
  if (!customerName) {
    return { error: t.errors.nameRequired };
  }

  const jobValueRaw = b.jobValue;
  const jobValue =
    typeof jobValueRaw === "number"
      ? jobValueRaw
      : Number(str(jobValueRaw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(jobValue) || jobValue < 0) {
    return { error: t.errors.jobValueInvalid };
  }

  const photoUrls = Array.isArray(b.photoUrls)
    ? b.photoUrls.filter((u): u is string => typeof u === "string")
    : [];

  return {
    input: {
      customerName,
      customerPhone: str(b.customerPhone).trim(),
      customerEmail: str(b.customerEmail).trim(),
      customerStreet: str(b.customerStreet).trim(),
      customerCity: str(b.customerCity).trim(),
      customerState: str(b.customerState).trim(),
      customerZip: str(b.customerZip).trim(),
      jobDifferentAddress: Boolean(b.jobDifferentAddress),
      jobStreet: str(b.jobStreet).trim(),
      jobCity: str(b.jobCity).trim(),
      jobState: str(b.jobState).trim(),
      jobZip: str(b.jobZip).trim(),
      description: str(b.description).trim(),
      jobValue,
      paid: Boolean(b.paid),
      scheduledDate: normalizeDate(b.scheduledDate),
      photoUrls,
    },
  };
}

function parseInvoiceItem(v: unknown): InvoiceItemInput {
  const b = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const jobId = typeof b.jobId === "string" && b.jobId.length > 0 ? b.jobId : null;

  const quantityRaw = Number(b.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;

  const unitPriceRaw =
    typeof b.unitPriceCents === "number" ? b.unitPriceCents : Number(b.unitPriceCents);
  const unitPriceCents = Number.isFinite(unitPriceRaw) ? Math.round(unitPriceRaw) : 0;

  return {
    jobId,
    propertyAddress: str(b.propertyAddress).trim(),
    description: str(b.description).trim(),
    quantity,
    unitPriceCents,
  };
}

export function parseInvoiceFormInput(
  body: unknown,
  t: Dict
): { input: InvoiceFormInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: t.errors.missingJobDetails };
  }
  const b = body as Record<string, unknown>;

  const billToName = str(b.billToName).trim();
  if (!billToName) {
    return { error: t.errors.nameRequired };
  }

  const items = Array.isArray(b.items) ? b.items.map(parseInvoiceItem) : [];
  if (items.length === 0) {
    return { error: t.errors.noJobsSelected };
  }

  const taxRateRaw = Number(b.taxRate);
  const taxRate = Number.isFinite(taxRateRaw) && taxRateRaw >= 0 ? taxRateRaw : 0;

  return {
    input: {
      billToName,
      billToPhone: str(b.billToPhone).trim(),
      billToEmail: str(b.billToEmail).trim(),
      billToStreet: str(b.billToStreet).trim(),
      billToCity: str(b.billToCity).trim(),
      billToState: str(b.billToState).trim(),
      billToZip: str(b.billToZip).trim(),
      taxRate,
      notes: str(b.notes).trim(),
      items,
    },
  };
}
