import { NextResponse } from "next/server";
import { DbNotConnectedError } from "./jobs";
import { getServerDict } from "./i18n-server";
import type { Dict } from "./i18n";
import type { JobFormInput } from "./types";

/** Turns a thrown error from the jobs data layer into a friendly response. */
export async function dbErrorResponse(err: unknown) {
  const t = await getServerDict();
  if (err instanceof DbNotConnectedError) {
    return NextResponse.json({ error: t.errors.dbNotConnected }, { status: 503 });
  }
  console.error(err);
  return NextResponse.json({ error: t.errors.generic }, { status: 500 });
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
