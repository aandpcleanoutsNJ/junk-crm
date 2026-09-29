"use client";

import { useLang } from "./LanguageProvider";

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Full-screen "Are you sure?" prompt with two big buttons, used before any delete. */
export default function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <p className="mb-5 text-center text-xl font-semibold text-gray-900">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" className="btn btn-red" onClick={onConfirm}>
            🗑️ {confirmLabel ?? t.confirmDialog.yesRemove}
          </button>
          <button type="button" className="btn btn-gray" onClick={onCancel}>
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
