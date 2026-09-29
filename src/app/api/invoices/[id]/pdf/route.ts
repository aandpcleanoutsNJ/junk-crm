import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getInvoiceById } from "@/lib/invoices";
import { generateInvoicePdf } from "@/lib/pdf";
import { dbErrorResponse } from "@/lib/apiHelpers";
import { getServerDict, getServerLang } from "@/lib/i18n-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoiceById(id);
  } catch (err) {
    return dbErrorResponse(err);
  }
  if (!invoice) {
    return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
  }

  const lang = await getServerLang();
  const pdfBytes = Buffer.from(await generateInvoicePdf(invoice, lang));

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
