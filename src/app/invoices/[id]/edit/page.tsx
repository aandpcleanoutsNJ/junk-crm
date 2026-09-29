import EditInvoiceClient from "./EditInvoiceClient";

export default async function EditInvoicePage(props: PageProps<"/invoices/[id]/edit">) {
  const { id } = await props.params;
  return <EditInvoiceClient invoiceId={id} />;
}
