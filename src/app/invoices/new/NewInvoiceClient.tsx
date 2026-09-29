"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import InvoiceItemsEditor from "@/components/InvoiceItemsEditor";
import { useLang } from "@/components/LanguageProvider";
import { formatAddress, jobAddress as computeJobAddress } from "@/lib/format";
import { dollarsToCents } from "@/lib/money";
import type { CustomerSummary, InvoiceItemInput, Job } from "@/lib/types";

type Step = 1 | 2 | 3;

interface ReviewState {
  items: InvoiceItemInput[];
  taxRate: number;
  notes: string;
}

export default function NewInvoiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectJobId = searchParams.get("jobId");
  const { t } = useLang();

  const [step, setStep] = useState<Step>(1);
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const [review, setReview] = useState<ReviewState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/customers")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || t.errors.generic);
          return;
        }
        const list: CustomerSummary[] = data.customers;
        setCustomers(list);

        if (preselectJobId) {
          const match = list.find((c) =>
            c.uninvoicedJobs.some((j) => j.id === preselectJobId)
          );
          if (match) {
            setSelectedCustomer(match);
            setSelectedJobIds(new Set([preselectJobId]));
            setStep(2);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t.errors.couldNotLoadCustomers);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const jobsByAddress = useMemo(() => {
    if (!selectedCustomer) return [];
    const map = new Map<string, Job[]>();
    for (const job of selectedCustomer.uninvoicedJobs) {
      const address = formatAddress(computeJobAddress(job)) || t.home.noAddress;
      const list = map.get(address) ?? [];
      list.push(job);
      map.set(address, list);
    }
    return Array.from(map.entries());
  }, [selectedCustomer, t.home.noAddress]);

  function pickCustomer(customer: CustomerSummary) {
    setSelectedCustomer(customer);
    setSelectedJobIds(new Set());
    setStep(2);
  }

  function toggleJob(jobId: string) {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  function selectAll() {
    if (!selectedCustomer) return;
    setSelectedJobIds((prev) => {
      const allIds = selectedCustomer.uninvoicedJobs.map((j) => j.id);
      const allSelected = allIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }

  const [continueError, setContinueError] = useState("");

  function goToReview() {
    if (selectedJobIds.size === 0) {
      setContinueError(t.errors.noJobsSelected);
      return;
    }
    setContinueError("");
    setStep(3);
  }

  const initialItems: InvoiceItemInput[] = useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.uninvoicedJobs
      .filter((job) => selectedJobIds.has(job.id))
      .map((job) => ({
        jobId: job.id,
        propertyAddress: formatAddress(computeJobAddress(job)),
        description: job.description,
        quantity: 1,
        unitPriceCents: dollarsToCents(job.jobValue),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleSave() {
    if (!selectedCustomer || !review || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billToName: selectedCustomer.name,
          billToPhone: selectedCustomer.phone,
          billToEmail: selectedCustomer.email,
          billToStreet: selectedCustomer.street,
          billToCity: selectedCustomer.city,
          billToState: selectedCustomer.state,
          billToZip: selectedCustomer.zip,
          taxRate: review.taxRate,
          notes: review.notes,
          items: review.items,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || t.errors.couldNotCreateInvoice);
        return;
      }
      router.push(`/invoices/${data.invoice.id}?saved=1`);
    } catch {
      setSaveError(t.errors.network);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  const title =
    step === 1 ? t.invoiceWizard.step1Title : step === 2 ? t.invoiceWizard.step2Title : t.invoiceWizard.step3Title;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        {step === 1 ? (
          <Link
            href="/invoices"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
            aria-label={t.common.back}
          >
            ←
          </Link>
        ) : (
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
            aria-label={t.common.back}
          >
            ←
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
      </div>

      {loadError && <p className="banner banner-error">{loadError}</p>}

      {step === 1 && (
        <>
          <input
            type="search"
            className="field-input"
            placeholder={t.invoiceWizard.searchCustomers}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!customers && !loadError && (
            <p className="py-8 text-center text-lg text-gray-500">{t.common.loading}</p>
          )}
          {customers && filteredCustomers.length === 0 && (
            <p className="py-8 text-center text-lg text-gray-500">{t.invoiceWizard.noCustomers}</p>
          )}
          <div className="flex flex-col gap-3">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.key}
                type="button"
                onClick={() => pickCustomer(customer)}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm active:bg-gray-50"
              >
                <p className="text-xl font-bold text-gray-900">{customer.name}</p>
                {customer.phone && <p className="text-base text-gray-600">{customer.phone}</p>}
                <p className="text-base font-semibold text-blue-700">
                  {customer.uninvoicedJobs.length} {t.invoiceWizard.uninvoicedJobsLabel}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && selectedCustomer && (
        <>
          <button type="button" className="btn btn-outline" onClick={selectAll}>
            {t.invoiceWizard.selectAll}
          </button>

          {selectedCustomer.uninvoicedJobs.length === 0 && (
            <p className="py-8 text-center text-lg text-gray-500">
              {t.invoiceWizard.noUninvoicedJobs}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {jobsByAddress.map(([address, jobs]) => (
              <div key={address}>
                <h2 className="mb-2 text-base font-bold text-gray-700">{address}</h2>
                <div className="flex flex-col gap-3">
                  {jobs.map((job) => {
                    const checked = selectedJobIds.has(job.id);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => toggleJob(job.id)}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left shadow-sm ${
                          checked ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border-2 text-base font-bold text-white ${
                            checked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                          }`}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-semibold text-gray-900">
                            {job.description || job.customerName}
                          </span>
                          <span className="block text-base font-bold text-gray-700">
                            ${job.jobValue.toFixed(2)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {continueError && <p className="banner banner-error">{continueError}</p>}

          <button type="button" className="btn btn-green" onClick={goToReview}>
            {t.invoiceWizard.continueButton}
          </button>
        </>
      )}

      {step === 3 && selectedCustomer && (
        <>
          {saveError && <p className="banner banner-error">{saveError}</p>}
          <InvoiceItemsEditor initialItems={initialItems} onChange={setReview} />
          <button
            type="button"
            className="btn btn-green"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t.jobForm.savingEllipsis : `✅ ${t.invoiceWizard.saveInvoice}`}
          </button>
        </>
      )}
    </main>
  );
}
