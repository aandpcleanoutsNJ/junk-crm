import { listUninvoicedJobs } from "./jobs";
import type { CustomerSummary, Job } from "./types";

/** Strips everything but digits, e.g. "(555) 123-4567" -> "5551234567". */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function customerKey(job: Job): string {
  const digits = normalizePhone(job.customerPhone);
  if (digits) return `phone:${digits}`;
  return `name:${job.customerName.trim().toLowerCase()}`;
}

/**
 * Groups uninvoiced jobs into "customers". There's no customers table —
 * jobs with the same normalized phone number are treated as one customer;
 * jobs with no phone fall back to an exact (case-insensitive) name match.
 * Only customers with at least one uninvoiced job are returned, since this
 * list only feeds the "start a new invoice" picker.
 */
export async function getCustomers(): Promise<CustomerSummary[]> {
  const jobs = await listUninvoicedJobs(); // newest first
  const byKey = new Map<string, CustomerSummary>();

  for (const job of jobs) {
    const key = customerKey(job);
    const existing = byKey.get(key);
    if (existing) {
      existing.uninvoicedJobs.push(job);
      continue;
    }
    // First job seen per key is the most recent (listUninvoicedJobs is
    // newest-first), so its contact info represents the customer.
    byKey.set(key, {
      key,
      name: job.customerName,
      phone: job.customerPhone,
      email: job.customerEmail,
      street: job.customerStreet,
      city: job.customerCity,
      state: job.customerState,
      zip: job.customerZip,
      uninvoicedJobs: [job],
    });
  }

  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}
