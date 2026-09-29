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
