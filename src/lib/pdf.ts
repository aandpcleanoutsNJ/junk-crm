import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, PageSizes, rgb, type PDFFont } from "pdf-lib";
import { company } from "@/config/company";
import { formatCents } from "./money";
import { formatDateOnly } from "./format";
import { getDict, type Lang } from "./i18n";
import type { Invoice } from "./types";

const MARGIN = 50;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [""];
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function rightAlignedX(text: string, font: PDFFont, size: number, rightEdge: number): number {
  return rightEdge - font.widthOfTextAtSize(text, size);
}

/** Renders one invoice as a clean, one-page PDF. Language follows the app's EN/ES setting. */
export async function generateInvoicePdf(invoice: Invoice, lang: Lang): Promise<Uint8Array> {
  const t = getDict(lang);
  const locale = lang === "es" ? "es" : "en-US";

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const contentRight = pageWidth - MARGIN;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.08, 0.09, 0.16);
  const gray = rgb(0.42, 0.42, 0.46);
  const lightGray = rgb(0.85, 0.85, 0.88);
  const brandBlue = rgb(0, 0.5, 0.8);

  let y = pageHeight - MARGIN;
  const logoTopY = y;

  // Logo, top-left. Optional — an invoice with a missing/broken logo file
  // should still generate rather than fail.
  let logoHeight = 0;
  try {
    const logoBytes = readFileSync(join(process.cwd(), "public", company.logoPath));
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const maxW = 130;
    const maxH = 40;
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
    const dims = logoImage.scale(scale);
    logoHeight = dims.height;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: logoTopY - dims.height,
      width: dims.width,
      height: dims.height,
    });
  } catch {
    // No logo file present — that's fine.
  }

  // "INVOICE" title + number, top-right.
  const titleSize = 22;
  const titleText = t.invoiceDetail.invoiceTitle;
  page.drawText(titleText, {
    x: rightAlignedX(titleText, bold, titleSize, contentRight),
    y: logoTopY - titleSize + 6,
    size: titleSize,
    font: bold,
    color: dark,
  });
  page.drawText(invoice.invoiceNumber, {
    x: rightAlignedX(invoice.invoiceNumber, font, 12, contentRight),
    y: logoTopY - titleSize - 10,
    size: 12,
    font,
    color: gray,
  });

  y = logoTopY - Math.max(logoHeight, titleSize + 24) - 16;

  // Company info (left) and issue/due dates (right), side by side.
  const companyLines = [
    company.name,
    company.phone,
    company.email,
    company.addressLine1,
    company.addressLine2,
  ].filter((line) => line && line.trim().length > 0);

  const dateLines = [
    `${t.invoiceDetail.issueDate}: ${formatDateOnly(invoice.issueDate, locale)}`,
    `${t.invoiceDetail.dueDate}: ${formatDateOnly(invoice.dueDate, locale)}`,
  ];

  const rowCount = Math.max(companyLines.length, dateLines.length);
  const rowStartY = y;
  companyLines.forEach((line, i) => {
    page.drawText(line, { x: MARGIN, y: rowStartY - i * 13, size: 10, font, color: gray });
  });
  dateLines.forEach((line, i) => {
    page.drawText(line, {
      x: rightAlignedX(line, font, 10, contentRight),
      y: rowStartY - i * 13,
      size: 10,
      font,
      color: gray,
    });
  });
  y = rowStartY - rowCount * 13 - 14;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: contentRight, y }, thickness: 1, color: lightGray });
  y -= 24;

  // Bill To block.
  page.drawText(t.invoiceDetail.billTo.toUpperCase(), {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: brandBlue,
  });
  y -= 15;

  const cityStateZip = [
    [invoice.billToCity, invoice.billToState].filter(Boolean).join(", "),
    invoice.billToZip,
  ]
    .filter(Boolean)
    .join(" ");
  const billLines = [invoice.billToName, invoice.billToStreet, cityStateZip, invoice.billToPhone, invoice.billToEmail].filter(
    (line) => line && line.trim().length > 0
  );
  for (const line of billLines) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: dark });
    y -= 14;
  }

  y -= 12;

  // Items table.
  const colProperty = MARGIN;
  const colDescription = MARGIN + 125;
  const colQty = MARGIN + 280;
  const colPrice = MARGIN + 325;
  const propertyColWidth = 120;
  const descriptionColWidth = 145;

  function drawTableHeader() {
    page.drawText(t.invoiceWizard.propertyAddressLabel, { x: colProperty, y, size: 9, font: bold, color: gray });
    page.drawText(t.invoiceWizard.descriptionLabel, { x: colDescription, y, size: 9, font: bold, color: gray });
    page.drawText(t.invoiceWizard.quantityLabel, { x: colQty, y, size: 9, font: bold, color: gray });
    page.drawText(t.invoiceWizard.unitPriceLabel, { x: colPrice, y, size: 9, font: bold, color: gray });
    const amountLabel = t.invoiceWizard.amountLabel;
    page.drawText(amountLabel, {
      x: rightAlignedX(amountLabel, bold, 9, contentRight),
      y,
      size: 9,
      font: bold,
      color: gray,
    });
    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: contentRight, y }, thickness: 1, color: lightGray });
    y -= 14;
  }

  drawTableHeader();

  for (const item of invoice.items) {
    const propLines = wrapText(item.propertyAddress, font, 9, propertyColWidth);
    const descLines = wrapText(item.description, font, 9, descriptionColWidth);
    const rowLines = Math.max(propLines.length, descLines.length, 1);
    const rowTopY = y;

    propLines.forEach((line, i) =>
      page.drawText(line, { x: colProperty, y: rowTopY - i * 11, size: 9, font, color: dark })
    );
    descLines.forEach((line, i) =>
      page.drawText(line, { x: colDescription, y: rowTopY - i * 11, size: 9, font, color: dark })
    );

    const qtyText = String(item.quantity);
    page.drawText(qtyText, { x: colQty, y: rowTopY, size: 9, font, color: dark });

    const priceText = formatCents(item.unitPriceCents);
    page.drawText(priceText, { x: colPrice, y: rowTopY, size: 9, font, color: dark });

    const amountText = formatCents(item.lineAmountCents);
    page.drawText(amountText, {
      x: rightAlignedX(amountText, font, 9, contentRight),
      y: rowTopY,
      size: 9,
      font,
      color: dark,
    });

    y = rowTopY - rowLines * 11 - 8;
  }

  page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: contentRight, y: y + 4 }, thickness: 1, color: lightGray });
  y -= 14;

  // Totals, right-aligned.
  function drawTotalLine(label: string, value: string, opts?: { emphasize?: boolean }) {
    const size = opts?.emphasize ? 13 : 10;
    const f = opts?.emphasize ? bold : font;
    page.drawText(label, { x: contentRight - 180, y, size, font: f, color: dark });
    page.drawText(value, { x: rightAlignedX(value, f, size, contentRight), y, size, font: f, color: dark });
    y -= size + 8;
  }

  drawTotalLine(t.invoiceWizard.subtotalLabel, formatCents(invoice.subtotalCents));
  drawTotalLine(`${t.invoiceWizard.taxLabel} (${invoice.taxRate}%)`, formatCents(invoice.taxCents));
  drawTotalLine(t.invoiceWizard.totalLabel, formatCents(invoice.totalCents), { emphasize: true });

  y -= 10;

  // Notes.
  if (invoice.notes.trim()) {
    page.drawText(t.invoiceDetail.notesHeading.toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: gray,
    });
    y -= 14;
    for (const line of wrapText(invoice.notes, font, 10, contentRight - MARGIN)) {
      page.drawText(line, { x: MARGIN, y, size: 10, font, color: dark });
      y -= 13;
    }
  }

  // Payment instructions, pinned near the bottom of the page.
  const footerLines = wrapText(company.paymentInstructions, font, 9, contentRight - MARGIN);
  let footerY = MARGIN + footerLines.length * 12;
  for (const line of footerLines) {
    page.drawText(line, { x: MARGIN, y: footerY, size: 9, font, color: gray });
    footerY -= 12;
  }

  return pdfDoc.save();
}
