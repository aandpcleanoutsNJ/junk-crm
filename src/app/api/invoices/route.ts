import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listInvoices, createInvoice } from "@/lib/invoices";
import { invoiceErrorResponse, parseInvoiceFormInput } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

export async function GET() {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  try {
    const invoices = await listInvoices();
    return NextResponse.json({ invoices });
  } catch (err) {
    return invoiceErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = parseInvoiceFormInput(body, t);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const invoice = await createInvoice(parsed.input);
    return NextResponse.json({ invoice });
  } catch (err) {
    return invoiceErrorResponse(err);
  }
}
