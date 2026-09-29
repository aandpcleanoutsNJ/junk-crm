"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/** Big on/off switch row, easier to tap than a tiny checkbox. */
export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-gray-200 bg-white px-4 py-4"
      style={{ minHeight: 64 }}
    >
      <span className="text-left text-lg font-semibold text-gray-900">
        {label}
      </span>
      <span
        className={`relative inline-flex h-9 w-16 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-green-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
