import { Suspense } from "react";
import NewInvoiceClient from "./NewInvoiceClient";

function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
      <p className="py-8 text-center text-lg text-gray-500">Loading…</p>
    </main>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewInvoiceClient />
    </Suspense>
  );
}
