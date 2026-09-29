import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getInvoiceById,
  updateInvoiceItems,
  markInvoiceSent,
  setInvoicePaid,
  deleteInvoice,
} from "@/lib/invoices";
import { invoiceErrorResponse, parseInvoiceFormInput } from "@/lib/apiHelpers";
import { getServerDict } from "@/lib/i18n-server";

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
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
    }
    return NextResponse.json({ invoice });
  } catch (err) {
    return invoiceErrorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  try {
    if (body?.action === "markSent") {
      const invoice = await markInvoiceSent(id);
      if (!invoice) return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
      return NextResponse.json({ invoice });
    }

    if (body?.action === "markPaid" || body?.action === "markUnpaid") {
      const invoice = await setInvoicePaid(id, body.action === "markPaid");
      if (!invoice) return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
      return NextResponse.json({ invoice });
    }

    const parsed = parseInvoiceFormInput(body, t);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const invoice = await updateInvoiceItems(id, parsed.input);
    if (!invoice) return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (err) {
    return invoiceErrorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getServerDict();
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: t.errors.pleaseLogin }, { status: 401 });
  }
  const { id } = await params;
  try {
    const deleted = await deleteInvoice(id);
    if (!deleted) {
      return NextResponse.json({ error: t.errors.invoiceNotFound }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return invoiceErrorResponse(err);
  }
}
