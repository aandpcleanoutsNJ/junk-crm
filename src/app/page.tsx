"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatAddress, formatDate, formatMoney, jobAddress } from "@/lib/format";
import type { Job } from "@/lib/types";

export default function HomePage() {
  const { t } = useLang();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [notPaidTotal, setNotPaidTotal] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [unpaidOnly, setUnpaidOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jobs")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || t.errors.generic);
          return;
        }
        setJobs(data.jobs);
        setNotPaidTotal(data.notPaidTotal);
      })
      .catch(() => {
        if (!cancelled) {
          setError(t.errors.couldNotLoadJobs);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (unpaidOnly && job.paid) return false;
      if (!q) return true;
      const address = formatAddress(jobAddress(job)).toLowerCase();
      return (
        job.customerName.toLowerCase().includes(q) ||
        job.customerPhone.toLowerCase().includes(q) ||
        address.includes(q)
      );
    });
  }, [jobs, search, unpaidOnly]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/junk-helpers-navy-trimmed.png"
        alt="Junk Helpers"
        className="mx-auto h-10 w-auto"
      />

      <Link href="/jobs/new" className="btn btn-green">
        ➕ {t.home.newJob}
      </Link>

      <Link href="/calendar" className="btn btn-blue">
        📅 {t.home.calendar}
      </Link>

      {jobs && (
        <button
          type="button"
          onClick={() => setUnpaidOnly((v) => !v)}
          className={`rounded-2xl border-2 px-4 py-3 text-left text-xl font-bold ${
            unpaidOnly
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-gray-200 bg-white text-red-700"
          }`}
        >
          {t.home.notPaidLabel} {formatMoney(notPaidTotal)}
          {unpaidOnly && (
            <span className="ml-2 text-sm font-semibold text-red-500">
              {t.home.unpaidHint}
            </span>
          )}
        </button>
      )}

      <input
        type="search"
        inputMode="search"
        placeholder={t.home.searchPlaceholder}
        className="field-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="banner banner-error">{error}</p>}

      {!jobs && !error && (
        <p className="py-8 text-center text-lg text-gray-500">{t.home.loadingJobs}</p>
      )}

      {jobs && filtered.length === 0 && (
        <p className="py-8 text-center text-lg text-gray-500">
          {jobs.length === 0 ? t.home.noJobsYet : t.home.noJobsMatch}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-gray-900">
                  {job.customerName}
                </p>
                <p className="truncate text-base text-gray-600">
                  {formatAddress(jobAddress(job)) || t.home.noAddress}
                </p>
                <p className="text-sm text-gray-400">{formatDate(job.createdAt)}</p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(job.jobValue)}
                </span>
                <span
                  className={`badge ${job.paid ? "bg-green-600" : "bg-red-600"}`}
                >
                  {job.paid ? t.home.paidBadge : t.home.notPaidBadge}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-sm font-semibold ${
                  job.status === "done" ? "text-gray-500" : "text-blue-700"
                }`}
              >
                {job.status === "done" ? t.home.statusDone : t.home.statusOpen}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
