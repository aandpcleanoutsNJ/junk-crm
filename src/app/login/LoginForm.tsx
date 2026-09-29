"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Big number keypad. Kept dumb on purpose: no length assumptions about the PIN. */
export default function LoginForm() {
  const { t } = useLang();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function press(d: string) {
    setError("");
    setPin((p) => (p.length < 12 ? p + d : p));
  }

  function backspace() {
    setError("");
    setPin((p) => p.slice(0, -1));
  }

  async function submit() {
    if (!pin || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errors.wrongPin);
        setPin("");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex min-h-9 items-center justify-center text-3xl tracking-[0.5em] text-gray-800">
        {pin.length > 0 ? (
          "•".repeat(pin.length)
        ) : (
          <span className="text-lg tracking-normal text-gray-400">
            {t.login.enterPin}
          </span>
        )}
      </div>

      {error && (
        <p className="mb-4 text-center text-lg font-semibold text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            className="btn btn-outline !text-3xl"
            onClick={() => press(d)}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline !text-2xl"
          aria-label="Backspace"
          onClick={backspace}
        >
          ⌫
        </button>
        <button
          type="button"
          className="btn btn-outline !text-3xl"
          onClick={() => press("0")}
        >
          0
        </button>
        <button
          type="button"
          className="btn btn-green !text-3xl"
          aria-label="Log in"
          onClick={submit}
          disabled={loading || !pin}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
