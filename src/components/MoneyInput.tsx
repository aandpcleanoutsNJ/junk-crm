"use client";

interface MoneyInputProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

/** Dollar amount input with a number keypad on phones. */
export default function MoneyInput({ value, onChange, id }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className="field-input pl-8"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      />
    </div>
  );
}
