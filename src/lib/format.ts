import type { Address } from "./types";

export function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** The address to actually drive to / show on the map for a job. */
export function jobAddress(job: {
  jobDifferentAddress: boolean;
  jobStreet: string;
  jobCity: string;
  jobState: string;
  jobZip: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
}): Address {
  if (job.jobDifferentAddress) {
    return {
      street: job.jobStreet,
      city: job.jobCity,
      state: job.jobState,
      zip: job.jobZip,
    };
  }
  return {
    street: job.customerStreet,
    city: job.customerCity,
    state: job.customerState,
    zip: job.customerZip,
  };
}

export function isAddressEmpty(a: Address): boolean {
  return !a.street.trim() && !a.city.trim() && !a.state.trim() && !a.zip.trim();
}

export function formatAddress(a: Address): string {
  const cityStateZip = [a.city, a.state].filter(Boolean).join(", ");
  const line2 = [cityStateZip, a.zip].filter(Boolean).join(" ");
  return [a.street, line2].filter(Boolean).join(", ");
}

export function mapsEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function mapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a plain "YYYY-MM-DD" value (no time/timezone, e.g. scheduled_date).
 * Parses the parts manually and builds a local-time Date — passing the raw
 * string to `new Date()` gets read as UTC midnight, which renders as the
 * previous day in any timezone behind UTC.
 */
export function formatDateOnly(isoDate: string, locale: string = "en-US"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
