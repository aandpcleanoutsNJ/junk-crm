"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AddressFields from "@/components/AddressFields";
import MoneyInput from "@/components/MoneyInput";
import PhotoPicker from "@/components/PhotoPicker";
import Toggle from "@/components/Toggle";
import { useLang } from "@/components/LanguageProvider";
import type { Address } from "@/lib/types";

const EMPTY_ADDRESS: Address = { street: "", city: "", state: "", zip: "" };

export default function NewJobPage() {
  const router = useRouter();
  const { t } = useLang();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState<Address>(EMPTY_ADDRESS);
  const [differentAddress, setDifferentAddress] = useState(false);
  const [jobAddress, setJobAddress] = useState<Address>(EMPTY_ADDRESS);
  const [description, setDescription] = useState("");
  const [jobValue, setJobValue] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [paid, setPaid] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (saving) return;
    if (!customerName.trim()) {
      setError(t.errors.nameRequired);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          customerStreet: customerAddress.street,
          customerCity: customerAddress.city,
          customerState: customerAddress.state,
          customerZip: customerAddress.zip,
          jobDifferentAddress: differentAddress,
          jobStreet: jobAddress.street,
          jobCity: jobAddress.city,
          jobState: jobAddress.state,
          jobZip: jobAddress.zip,
          description,
          jobValue: jobValue || "0",
          scheduledDate,
          paid,
          photoUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.generic);
        return;
      }
      router.push(`/jobs/${data.job.id}?saved=1`);
    } catch {
      setError(t.errors.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
          aria-label={t.common.back}
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">{t.jobForm.newJobTitle}</h1>
      </div>

      {error && <p className="banner banner-error">{error}</p>}

      <section className="flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="customerName">
            {t.jobForm.customerName}
          </label>
          <input
            id="customerName"
            className="field-input"
            type="text"
            autoComplete="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="customerPhone">
            {t.jobForm.phone}
          </label>
          <input
            id="customerPhone"
            className="field-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="customerEmail">
            {t.jobForm.emailOptional}
          </label>
          <input
            id="customerEmail"
            className="field-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">
          {t.jobForm.customerAddress}
        </h2>
        <AddressFields
          idPrefix="customer"
          value={customerAddress}
          onChange={setCustomerAddress}
        />
      </section>

      <Toggle
        label={t.jobForm.differentAddressToggle}
        checked={differentAddress}
        onChange={setDifferentAddress}
      />

      {differentAddress && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">{t.jobForm.jobAddress}</h2>
          <AddressFields idPrefix="job" value={jobAddress} onChange={setJobAddress} />
        </section>
      )}

      <div>
        <label className="field-label" htmlFor="description">
          {t.jobForm.descriptionLabel}
        </label>
        <textarea
          id="description"
          className="field-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.jobForm.descriptionPlaceholder}
        />
        <p className="mt-1 text-base text-gray-500">🎤 {t.jobForm.micHint}</p>
      </div>

      <div>
        <label className="field-label" htmlFor="jobValue">
          {t.jobForm.jobValueLabel}
        </label>
        <MoneyInput id="jobValue" value={jobValue} onChange={setJobValue} />
      </div>

      <div>
        <label className="field-label" htmlFor="scheduledDate">
          {t.jobForm.scheduledDateLabel}
        </label>
        <input
          id="scheduledDate"
          className="field-input"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
      </div>

      <div>
        <p className="field-label">{t.jobForm.paidQuestion}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`btn ${!paid ? "btn-red" : "btn-outline"}`}
            onClick={() => setPaid(false)}
          >
            {t.jobForm.notPaidButton}
          </button>
          <button
            type="button"
            className={`btn ${paid ? "btn-green" : "btn-outline"}`}
            onClick={() => setPaid(true)}
          >
            {t.jobForm.paidButton}
          </button>
        </div>
      </div>

      <div>
        <p className="field-label">{t.jobForm.photosLabel}</p>
        <PhotoPicker onChange={setPhotoUrls} />
      </div>

      <button
        type="button"
        className="btn btn-green"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? t.jobForm.savingEllipsis : `✅ ${t.jobForm.saveJob}`}
      </button>
    </main>
  );
}
