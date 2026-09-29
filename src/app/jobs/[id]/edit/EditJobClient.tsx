"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddressFields from "@/components/AddressFields";
import MoneyInput from "@/components/MoneyInput";
import Toggle from "@/components/Toggle";
import { useLang } from "@/components/LanguageProvider";
import type { Address, Job } from "@/lib/types";

const EMPTY_ADDRESS: Address = { street: "", city: "", state: "", zip: "" };

export default function EditJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { t } = useLang();

  const [loadError, setLoadError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState<Address>(EMPTY_ADDRESS);
  const [differentAddress, setDifferentAddress] = useState(false);
  const [jobAddress, setJobAddress] = useState<Address>(EMPTY_ADDRESS);
  const [description, setDescription] = useState("");
  const [jobValue, setJobValue] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/${jobId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || t.errors.generic);
          return;
        }
        const job: Job = data.job;
        setCustomerName(job.customerName);
        setCustomerPhone(job.customerPhone);
        setCustomerEmail(job.customerEmail);
        setCustomerAddress({
          street: job.customerStreet,
          city: job.customerCity,
          state: job.customerState,
          zip: job.customerZip,
        });
        setDifferentAddress(job.jobDifferentAddress);
        setJobAddress({
          street: job.jobStreet,
          city: job.jobCity,
          state: job.jobState,
          zip: job.jobZip,
        });
        setDescription(job.description);
        setJobValue(job.jobValue ? String(job.jobValue) : "");
        setScheduledDate(job.scheduledDate ?? "");
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t.errors.couldNotLoadJob);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function handleSave() {
    if (saving) return;
    if (!customerName.trim()) {
      setError(t.errors.nameRequired);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
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
          photoUrls: [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.generic);
        return;
      }
      router.push(`/jobs/${jobId}?saved=1`);
    } catch {
      setError(t.errors.couldNotSave);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <BackButton jobId={jobId} label={t.common.back} />
        <p className="banner banner-error">{loadError}</p>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
        <p className="py-8 text-center text-lg text-gray-500">{t.common.loading}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <BackButton jobId={jobId} label={t.common.back} />
        <h1 className="text-2xl font-extrabold text-gray-900">{t.jobForm.editJobTitle}</h1>
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

function BackButton({ jobId, label }: { jobId: string; label: string }) {
  return (
    <Link
      href={`/jobs/${jobId}`}
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
      aria-label={label}
    >
      ←
    </Link>
  );
}
