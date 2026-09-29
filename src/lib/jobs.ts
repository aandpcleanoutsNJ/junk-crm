import { getDb } from "./db";
import type { Job, JobFormInput, JobPhoto, JobStatus, PhotoKind } from "./types";

/** Thrown by every function here when DATABASE_URL isn't set yet. */
export class DbNotConnectedError extends Error {
  constructor() {
    super("DB_NOT_CONNECTED");
  }
}

function requireDb() {
  const sql = getDb();
  if (!sql) throw new DbNotConnectedError();
  return sql;
}

interface JobRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_street: string;
  customer_city: string;
  customer_state: string;
  customer_zip: string;
  job_different_address: boolean;
  job_street: string;
  job_city: string;
  job_state: string;
  job_zip: string;
  description: string;
  job_value: string;
  paid: boolean;
  paid_at: string | null;
  status: string;
  scheduled_date: string | null;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PhotoRow {
  id: string;
  job_id: string;
  url: string;
  kind: string;
  created_at: string;
}

function mapJob(row: JobRow, photos: JobPhoto[] = []): Job {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    customerStreet: row.customer_street,
    customerCity: row.customer_city,
    customerState: row.customer_state,
    customerZip: row.customer_zip,
    jobDifferentAddress: row.job_different_address,
    jobStreet: row.job_street,
    jobCity: row.job_city,
    jobState: row.job_state,
    jobZip: row.job_zip,
    description: row.description,
    jobValue: Number(row.job_value),
    paid: row.paid,
    paidAt: row.paid_at,
    status: row.status as JobStatus,
    scheduledDate: row.scheduled_date,
    invoiceId: row.invoice_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos,
  };
}

function mapPhoto(row: PhotoRow): JobPhoto {
  return {
    id: row.id,
    url: row.url,
    kind: (row.kind as PhotoKind) || "general",
    createdAt: row.created_at,
  };
}

export async function listJobs(): Promise<{ jobs: Job[]; notPaidTotal: number }> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM jobs ORDER BY created_at DESC
  `) as unknown as JobRow[];
  const totalRows = (await sql`
    SELECT COALESCE(SUM(job_value), 0) AS total FROM jobs WHERE paid = false
  `) as unknown as { total: string }[];
  return {
    jobs: rows.map((r) => mapJob(r)),
    notPaidTotal: Number(totalRows[0]?.total ?? 0),
  };
}

export async function getJobById(id: string): Promise<Job | null> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ${id}
  `) as unknown as JobRow[];
  if (rows.length === 0) return null;
  const photoRows = (await sql`
    SELECT * FROM job_photos WHERE job_id = ${id} ORDER BY created_at ASC
  `) as unknown as PhotoRow[];
  return mapJob(rows[0], photoRows.map(mapPhoto));
}

export async function createJob(input: JobFormInput): Promise<Job> {
  const sql = requireDb();
  const paidAt = input.paid ? new Date().toISOString() : null;
  const rows = (await sql`
    INSERT INTO jobs (
      customer_name, customer_phone, customer_email,
      customer_street, customer_city, customer_state, customer_zip,
      job_different_address, job_street, job_city, job_state, job_zip,
      description, job_value, paid, paid_at, status, scheduled_date
    ) VALUES (
      ${input.customerName}, ${input.customerPhone}, ${input.customerEmail},
      ${input.customerStreet}, ${input.customerCity}, ${input.customerState}, ${input.customerZip},
      ${input.jobDifferentAddress}, ${input.jobStreet}, ${input.jobCity}, ${input.jobState}, ${input.jobZip},
      ${input.description}, ${input.jobValue}, ${input.paid}, ${paidAt}, 'open', ${input.scheduledDate}
    )
    RETURNING *
  `) as unknown as JobRow[];

  const job = mapJob(rows[0]);
  const photos: JobPhoto[] = [];
  for (const url of input.photoUrls) {
    photos.push(await addPhoto(job.id, url));
  }
  job.photos = photos;
  return job;
}

export async function updateJobDetails(
  id: string,
  input: JobFormInput
): Promise<Job | null> {
  const sql = requireDb();
  await sql`
    UPDATE jobs SET
      customer_name = ${input.customerName},
      customer_phone = ${input.customerPhone},
      customer_email = ${input.customerEmail},
      customer_street = ${input.customerStreet},
      customer_city = ${input.customerCity},
      customer_state = ${input.customerState},
      customer_zip = ${input.customerZip},
      job_different_address = ${input.jobDifferentAddress},
      job_street = ${input.jobStreet},
      job_city = ${input.jobCity},
      job_state = ${input.jobState},
      job_zip = ${input.jobZip},
      description = ${input.description},
      job_value = ${input.jobValue},
      scheduled_date = ${input.scheduledDate},
      updated_at = now()
    WHERE id = ${id}
  `;
  for (const url of input.photoUrls) {
    await addPhoto(id, url);
  }
  return getJobById(id);
}

export async function setPaid(id: string, paid: boolean): Promise<Job | null> {
  const sql = requireDb();
  const paidAt = paid ? new Date().toISOString() : null;
  await sql`
    UPDATE jobs SET paid = ${paid}, paid_at = ${paidAt}, updated_at = now()
    WHERE id = ${id}
  `;
  return getJobById(id);
}

export async function setStatus(
  id: string,
  status: JobStatus
): Promise<Job | null> {
  const sql = requireDb();
  await sql`
    UPDATE jobs SET status = ${status}, updated_at = now() WHERE id = ${id}
  `;
  return getJobById(id);
}

export async function addPhoto(
  jobId: string,
  url: string,
  kind: PhotoKind = "general"
): Promise<JobPhoto> {
  const sql = requireDb();
  const rows = (await sql`
    INSERT INTO job_photos (job_id, url, kind) VALUES (${jobId}, ${url}, ${kind}) RETURNING *
  `) as unknown as PhotoRow[];
  return mapPhoto(rows[0]);
}

/** Deletes the photo row and returns its blob URL for cleanup, or null if not found. */
export async function deletePhotoRecord(photoId: string): Promise<string | null> {
  const sql = requireDb();
  const rows = (await sql`
    DELETE FROM job_photos WHERE id = ${photoId} RETURNING url
  `) as unknown as { url: string }[];
  return rows[0]?.url ?? null;
}

/** Looks up a single photo's stored blob URL, for the authenticated /api/photos/[id] route. */
export async function getPhotoUrl(photoId: string): Promise<string | null> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT url FROM job_photos WHERE id = ${photoId}
  `) as unknown as { url: string }[];
  return rows[0]?.url ?? null;
}

/** All jobs that have a scheduled date within [startDate, endDate] (inclusive, YYYY-MM-DD). */
export async function listJobsByDateRange(
  startDate: string,
  endDate: string
): Promise<Job[]> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM jobs
    WHERE scheduled_date BETWEEN ${startDate} AND ${endDate}
    ORDER BY scheduled_date ASC, created_at ASC
  `) as unknown as JobRow[];
  return rows.map((r) => mapJob(r));
}

/** All jobs that don't yet belong to an invoice — the pool the invoice wizard picks from. */
export async function listUninvoicedJobs(): Promise<Job[]> {
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM jobs WHERE invoice_id IS NULL ORDER BY created_at DESC
  `) as unknown as JobRow[];
  return rows.map((r) => mapJob(r));
}

/** Fetches a specific set of jobs by id, e.g. to validate an invoice's selected jobs. */
export async function getJobsByIds(ids: string[]): Promise<Job[]> {
  if (ids.length === 0) return [];
  const sql = requireDb();
  const rows = (await sql`
    SELECT * FROM jobs WHERE id = ANY(${ids})
  `) as unknown as JobRow[];
  return rows.map((r) => mapJob(r));
}
