import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { DbNotConnectedError } from "./jobs";
import { computeInvoiceTotals, lineAmountCents } from "./money";
import type {
  Invoice,
  InvoiceFormInput,
  InvoiceItem,
  InvoiceStatus,
  InvoiceSummary,
} from "./types";

/** Thrown when one or more selected jobs already belong to a different invoice. */
export class JobAlreadyInvoicedError extends Error {
  constructor() {
    super("JOB_ALREADY_INVOICED");
  }
}

/** Thrown when trying to edit an invoice that's already marked Paid. */
export class InvoiceLockedError extends Error {
  constructor() {
    super("INVOICE_LOCKED");
  }
}

function requireDb() {
  const sql = getDb();
  if (!sql) throw new DbNotConnectedError();
  return sql;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  bill_to_name: string;
  bill_to_phone: string;
  bill_to_email: string;
  bill_to_street: string;
  bill_to_city: string;
  bill_to_state: string;
  bill_to_zip: string;
  issue_date: string;
  due_date: string;
  status: string;
  tax_rate: string;
  notes: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  job_id: string | null;
  property_address: string;
  description: string;
  quantity: string;
  unit_price_cents: number;
  sort_order: number;
}

function mapItem(row: InvoiceItemRow): InvoiceItem {
  const quantity = Number(row.quantity);
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    jobId: row.job_id,
    propertyAddress: row.property_address,
    description: row.description,
    quantity,
    unitPriceCents: row.unit_price_cents,
    lineAmountCents: lineAmountCents(quantity, row.unit_price_cents),
    sortOrder: row.sort_order,
  };
}

function mapInvoice(row: InvoiceRow, items: InvoiceItem[]): Invoice {
  const { subtotalCents, taxCents, totalCents } = computeInvoiceTotals(
    items,
    Number(row.tax_rate)
  );
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    billToName: row.bill_to_name,
    billToPhone: row.bill_to_phone,
    billToEmail: row.bill_to_email,
    billToStreet: row.bill_to_street,
    billToCity: row.bill_to_city,
    billToState: row.bill_to_state,
    billToZip: row.bill_to_zip,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as InvoiceStatus,
    taxRate: Number(row.tax_rate),
    notes: row.notes,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    subtotalCents,
    taxCents,
    totalCents,
  };
}

/** Aggregated list for the invoices screen — no items, cheap subtotal via SQL. */
export async function listInvoices(): Promise<InvoiceSummary[]> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT
      i.*,
      COALESCE(SUM(ROUND(ii.quantity * ii.unit_price_cents)), 0) AS subtotal_cents
    FROM invoices i
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `) as unknown as (InvoiceRow & { subtotal_cents: string })[];

  return rows.map((row) => {
    const subtotalCents = Number(row.subtotal_cents);
    const taxRate = Number(row.tax_rate);
    const taxCents = Math.round(subtotalCents * (taxRate / 100));
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      billToName: row.bill_to_name,
      status: row.status as InvoiceStatus,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      createdAt: row.created_at,
    };
  });
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM invoices WHERE id = ${id}
  `) as unknown as InvoiceRow[];
  if (rows.length === 0) return null;
  const itemRows = (await sql`
    SELECT * FROM invoice_items WHERE invoice_id = ${id} ORDER BY sort_order ASC
  `) as unknown as InvoiceItemRow[];
  return mapInvoice(rows[0], itemRows.map(mapItem));
}

async function assertJobsAreInvoiceable(
  sql: ReturnType<typeof getDb>,
  jobIds: string[],
  excludingInvoiceId?: string
) {
  if (!sql || jobIds.length === 0) return;
  const rows = (await sql`
    SELECT id FROM jobs
    WHERE id = ANY(${jobIds})
      AND invoice_id IS NOT NULL
      ${excludingInvoiceId ? sql`AND invoice_id != ${excludingInvoiceId}` : sql``}
  `) as unknown as { id: string }[];
  if (rows.length > 0) throw new JobAlreadyInvoicedError();
}

function computeDueDate(issueDate: string): string {
  const [y, m, d] = issueDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + 15);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function createInvoice(input: InvoiceFormInput): Promise<Invoice> {
  const sql = requireDb();
  const jobIds = input.items
    .map((item) => item.jobId)
    .filter((id): id is string => Boolean(id));

  await assertJobsAreInvoiceable(sql, jobIds);

  const invoiceId = randomUUID();
  const issueDate = todayIso();
  const dueDate = computeDueDate(issueDate);

  const queries = [
    sql`
      INSERT INTO invoices (
        id, invoice_number, bill_to_name, bill_to_phone, bill_to_email,
        bill_to_street, bill_to_city, bill_to_state, bill_to_zip,
        issue_date, due_date, status, tax_rate, notes
      ) VALUES (
        ${invoiceId}, 'JH-' || nextval('invoice_number_seq')::text,
        ${input.billToName}, ${input.billToPhone}, ${input.billToEmail},
        ${input.billToStreet}, ${input.billToCity}, ${input.billToState}, ${input.billToZip},
        ${issueDate}, ${dueDate}, 'draft', ${input.taxRate}, ${input.notes}
      )
    `,
    ...input.items.map((item, i) =>
      sql`
        INSERT INTO invoice_items (
          id, invoice_id, job_id, property_address, description, quantity, unit_price_cents, sort_order
        ) VALUES (
          ${randomUUID()}, ${invoiceId}, ${item.jobId}, ${item.propertyAddress},
          ${item.description}, ${item.quantity}, ${item.unitPriceCents}, ${i}
        )
      `
    ),
    ...jobIds.map(
      (jobId) => sql`UPDATE jobs SET invoice_id = ${invoiceId}, updated_at = now() WHERE id = ${jobId}`
    ),
  ];

  await sql.transaction(queries);

  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice creation failed unexpectedly.");
  return invoice;
}

/**
 * Replaces every line item on a draft/sent invoice and updates the tax rate
 * and notes. Deletes+reinserts items rather than diffing — simpler and
 * correct, since the review UI always submits the full current item list.
 * Jobs removed from the item list are freed (invoice_id reset to null); jobs
 * newly referenced are linked, after checking they aren't on another invoice.
 */
export async function updateInvoiceItems(
  id: string,
  input: Pick<InvoiceFormInput, "taxRate" | "notes" | "items">
): Promise<Invoice | null> {
  const sql = requireDb();

  const existing = await getInvoiceById(id);
  if (!existing) return null;
  if (existing.status === "paid") {
    throw new InvoiceLockedError();
  }

  const oldJobIds = new Set(
    existing.items.map((item) => item.jobId).filter((jid): jid is string => Boolean(jid))
  );
  const newJobIds = new Set(
    input.items.map((item) => item.jobId).filter((jid): jid is string => Boolean(jid))
  );

  const toLink = [...newJobIds].filter((jid) => !oldJobIds.has(jid));
  const toUnlink = [...oldJobIds].filter((jid) => !newJobIds.has(jid));

  await assertJobsAreInvoiceable(sql, toLink, id);

  const queries = [
    sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`,
    ...input.items.map((item, i) =>
      sql`
        INSERT INTO invoice_items (
          id, invoice_id, job_id, property_address, description, quantity, unit_price_cents, sort_order
        ) VALUES (
          ${randomUUID()}, ${id}, ${item.jobId}, ${item.propertyAddress},
          ${item.description}, ${item.quantity}, ${item.unitPriceCents}, ${i}
        )
      `
    ),
    sql`UPDATE invoices SET tax_rate = ${input.taxRate}, notes = ${input.notes}, updated_at = now() WHERE id = ${id}`,
    ...toLink.map(
      (jobId) => sql`UPDATE jobs SET invoice_id = ${id}, updated_at = now() WHERE id = ${jobId}`
    ),
    ...toUnlink.map(
      (jobId) => sql`UPDATE jobs SET invoice_id = NULL, updated_at = now() WHERE id = ${jobId}`
    ),
  ];

  await sql.transaction(queries);
  return getInvoiceById(id);
}

export async function markInvoiceSent(id: string): Promise<Invoice | null> {
  const sql = requireDb();
  await sql`
    UPDATE invoices SET status = 'sent', updated_at = now()
    WHERE id = ${id} AND status != 'paid'
  `;
  return getInvoiceById(id);
}

/** Marking paid also marks every job on the invoice paid; unmarking reverses both. */
export async function setInvoicePaid(id: string, paid: boolean): Promise<Invoice | null> {
  const sql = requireDb();
  const nowIso = new Date().toISOString();
  const newStatus = paid ? "paid" : "sent";
  const jobPaidAt = paid ? nowIso : null;

  await sql.transaction([
    sql`
      UPDATE invoices SET status = ${newStatus}, paid_at = ${paid ? nowIso : null}, updated_at = now()
      WHERE id = ${id}
    `,
    sql`
      UPDATE jobs SET paid = ${paid}, paid_at = ${jobPaidAt}, updated_at = now()
      WHERE invoice_id = ${id}
    `,
  ]);

  return getInvoiceById(id);
}

/** Deletes the invoice; the jobs FK (ON DELETE SET NULL) frees its jobs automatically. */
export async function deleteInvoice(id: string): Promise<boolean> {
  const sql = requireDb();
  const rows = (await sql`
    DELETE FROM invoices WHERE id = ${id} RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}
