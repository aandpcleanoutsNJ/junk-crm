import { Suspense } from "react";
import JobDetailClient from "./JobDetailClient";

function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 py-6">
      <p className="py-8 text-center text-lg text-gray-500">Loading…</p>
    </main>
  );
}

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  return (
    <Suspense fallback={<Loading />}>
      <JobDetailClient jobId={id} />
    </Suspense>
  );
}
