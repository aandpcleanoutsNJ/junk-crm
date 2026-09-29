"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatAddress, formatMoney, jobAddress } from "@/lib/format";
import type { Job } from "@/lib/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Monday-first week of short weekday labels in the given locale. */
function weekdayLabels(locale: string): string[] {
  // 2024-01-01 is a Monday; walking 7 days from there covers Mon..Sun.
  const base = new Date(2024, 0, 1);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return fmt.format(d);
  });
}

export default function CalendarPage() {
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || t.errors.generic);
          return;
        }
        setError("");
        setJobs(data.jobs);
      })
      .catch(() => {
        if (!cancelled) setError(t.errors.network);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs ?? []) {
      if (!job.scheduledDate) continue;
      const list = map.get(job.scheduledDate) ?? [];
      list.push(job);
      map.set(job.scheduledDate, list);
    }
    return map;
  }, [jobs]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  const firstOfMonth = new Date(year, month - 1, 1);
  // Monday-first offset: getDay() is 0=Sun..6=Sat, shift so Mon=0..Sun=6.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  function goToMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDate(null);
  }

  const selectedJobs = selectedDate ? jobsByDate.get(selectedDate) ?? [] : [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl"
          aria-label={t.common.back}
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">{t.calendar.title}</h1>
      </div>

      {error && <p className="banner banner-error">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label={t.calendar.previousMonth}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold"
        >
          ‹
        </button>
        <span className="text-xl font-bold capitalize text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label={t.calendar.nextMonth}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-gray-500">
        {weekdayLabels(locale).map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
          const dayJobs = jobsByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-lg font-semibold ${
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : isToday
                    ? "border-blue-300 bg-white text-gray-900"
                    : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              {day}
              {dayJobs.length > 0 && (
                <span className="absolute bottom-1 flex h-2 w-2 rounded-full bg-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {t.calendar.jobsOn}{" "}
            {new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(year, month - 1, Number(selectedDate.split("-")[2])))}
          </h2>
          {selectedJobs.length === 0 ? (
            <p className="text-lg text-gray-500">{t.calendar.noJobsThisDay}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <p className="truncate text-xl font-bold text-gray-900">
                    {job.customerName}
                  </p>
                  <p className="truncate text-base text-gray-600">
                    {formatAddress(jobAddress(job)) || t.home.noAddress}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatMoney(job.jobValue)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
