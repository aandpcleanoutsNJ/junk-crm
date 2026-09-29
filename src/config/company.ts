/**
 * Company details printed on invoice PDFs. Nothing here is secret — it's all
 * customer-facing — so fill in your real details directly in this file.
 */
export const company = {
  name: "Junk Helpers",
  phone: "(555) 555-5555",
  email: "billing@example.com",
  addressLine1: "123 Main Street",
  addressLine2: "Anytown, NJ 07000",
  /** Shown near the bottom of every invoice PDF, e.g. how the customer should pay. */
  paymentInstructions:
    "Please make checks payable to Junk Helpers. Venmo/Zelle: @your-handle-here.",
  /** Path under /public used as the PDF header logo. */
  logoPath: "brand/junk-helpers-navy-trimmed.png",
};
