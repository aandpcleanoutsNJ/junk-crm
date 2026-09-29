import EditJobClient from "./EditJobClient";

export default async function EditJobPage(props: PageProps<"/jobs/[id]/edit">) {
  const { id } = await props.params;
  return <EditJobClient jobId={id} />;
}
