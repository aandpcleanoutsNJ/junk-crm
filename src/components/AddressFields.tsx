"use client";

import { useLang } from "./LanguageProvider";
import type { Address } from "@/lib/types";

interface AddressFieldsProps {
  value: Address;
  onChange: (next: Address) => void;
  idPrefix: string;
}

/** Street / city / state / zip inputs, reused for both customer and job addresses. */
export default function AddressFields({
  value,
  onChange,
  idPrefix,
}: AddressFieldsProps) {
  const { t } = useLang();

  function set<K extends keyof Address>(key: K, v: Address[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-street`}>
          {t.addressFields.street}
        </label>
        <input
          id={`${idPrefix}-street`}
          className="field-input"
          type="text"
          autoComplete="street-address"
          value={value.street}
          onChange={(e) => set("street", e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-city`}>
          {t.addressFields.city}
        </label>
        <input
          id={`${idPrefix}-city`}
          className="field-input"
          type="text"
          autoComplete="address-level2"
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-state`}>
            {t.addressFields.state}
          </label>
          <input
            id={`${idPrefix}-state`}
            className="field-input"
            type="text"
            autoComplete="address-level1"
            value={value.state}
            onChange={(e) => set("state", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-zip`}>
            {t.addressFields.zip}
          </label>
          <input
            id={`${idPrefix}-zip`}
            className="field-input"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={value.zip}
            onChange={(e) => set("zip", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
