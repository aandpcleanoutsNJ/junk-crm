export type JobStatus = "open" | "done";

export type PhotoKind = "general" | "before" | "after";

export interface JobPhoto {
  id: string;
  url: string;
  kind: PhotoKind;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Job {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  jobDifferentAddress: boolean;
  jobStreet: string;
  jobCity: string;
  jobState: string;
  jobZip: string;
  description: string;
  jobValue: number;
  paid: boolean;
  paidAt: string | null;
  status: JobStatus;
  /** Optional scheduled date (YYYY-MM-DD), null if not scheduled. */
  scheduledDate: string | null;
  /** Set once this job has been added to an invoice; null if still invoiceable. */
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  photos: JobPhoto[];
}

/** Shape sent from the New Job / Edit Job form to the API. */
export interface JobFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  jobDifferentAddress: boolean;
  jobStreet: string;
  jobCity: string;
  jobState: string;
  jobZip: string;
  description: string;
  jobValue: number;
  paid: boolean;
  scheduledDate: string | null;
  photoUrls: string[];
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  jobId: string | null;
  propertyAddress: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** round(quantity * unitPriceCents), the source of truth for line totals. */
  lineAmountCents: number;
  sortOrder: number;
}

/** Full invoice with line items and computed totals — GET /api/invoices/[id]. */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  billToName: string;
  billToPhone: string;
  billToEmail: string;
  billToStreet: string;
  billToCity: string;
  billToState: string;
  billToZip: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  /** Percentage, e.g. 7.5 for 7.5%. */
  taxRate: number;
  notes: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

/** Lightweight row for the invoice list screen — no items, aggregated totals. */
export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  billToName: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
}

/** One line item as sent from the New Invoice / Edit Invoice form. */
export interface InvoiceItemInput {
  jobId: string | null;
  propertyAddress: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
}

/** Shape sent from the New Invoice / Edit Invoice form to the API. */
export interface InvoiceFormInput {
  billToName: string;
  billToPhone: string;
  billToEmail: string;
  billToStreet: string;
  billToCity: string;
  billToState: string;
  billToZip: string;
  taxRate: number;
  notes: string;
  items: InvoiceItemInput[];
}

/** A customer derived from grouping jobs by phone (or name as fallback). */
export interface CustomerSummary {
  key: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  uninvoicedJobs: Job[];
}
