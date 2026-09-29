"use client";

import { useLang } from "./LanguageProvider";

/** Small persistent EN/ES switch shown on every screen, including login. */
export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="fixed right-3 top-3 z-40 flex overflow-hidden rounded-full border-2 border-gray-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-3 py-2 text-sm font-bold ${
          lang === "en" ? "bg-blue-600 text-white" : "text-gray-500"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
        className={`px-3 py-2 text-sm font-bold ${
          lang === "es" ? "bg-blue-600 text-white" : "text-gray-500"
        }`}
      >
        ES
      </button>
    </div>
  );
}
