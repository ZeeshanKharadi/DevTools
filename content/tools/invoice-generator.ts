import type { ToolContent } from "./types";

export const invoiceGeneratorContent: ToolContent = {
  privacy:
    "Preview, print, and PDF stay in your browser. Signing in to save an invoice is optional and stores structured invoice details in your InfyraTools account — not generated PDF files.",
  intro:
    "This free invoice generator builds a professional invoice in your browser. Add seller and customer details, line items, tax, and discounts, then print or download a PDF. The printed document is the invoice only — not the site chrome. Sign in only if you want to save invoices.",
  howTo: [
    {
      title: "Enter both parties",
      body: "Fill in your business details and the customer you are billing. Empty fields are left off the invoice. A logo stays on this device unless you later use a hosted brand kit.",
    },
    {
      title: "Add line items and totals",
      body: "Each row has a description, quantity, unit price, and a tax percent applied to that row (quantity × unit price). An invoice discount then reduces the subtotal only — it does not reduce line tax. Total = subtotal − discount + tax. Amount paid reduces the balance due. Currency formatting follows the code you select, including JPY with no decimal places.",
    },
    {
      title: "Choose a template and export",
      body: "Classic, Modern, and Compact update the live preview. Print opens only the invoice document. Download PDF saves the same totals. Reset clears the form on this page.",
    },
  ],
  examples: [
    {
      title: "Simple service invoice",
      body: "One design-sprint line at a day rate, 8.5% tax, Net 14 terms, and a PO number. Useful when you need a clean PDF without accounting software.",
    },
    {
      title: "Multi-currency freelance bill",
      body: "Switch to EUR, GBP, PKR, INR, AED, SAR, or JPY. Unit prices are stored in that currency’s minor units so rounding stays consistent.",
    },
  ],
  bestPractices: [
    {
      title: "This is a document, not a tax engine",
      body: "Per-line tax percents are arithmetic, not a filing. Confirm rates, tax IDs, and required fields for the country you invoice in.",
    },
    {
      title: "Keep records",
      body: "Anonymous invoices are not stored. Download the PDF if you need a copy, or sign in to save structured invoice data to your account. This tool still does not send email or collect payment.",
    },
  ],
  bestPracticesHeading: "Invoice tips",
  faq: [
    {
      question: "Is this a free invoice generator?",
      answer:
        "Yes. You can build, print, and download an invoice in the browser without an account. Saving invoices is optional after you sign in.",
    },
    {
      question: "Does the PDF or printout include the website UI?",
      answer:
        "No. Print uses a standalone invoice document. Download PDF writes the invoice totals and details only — not navigation, buttons, or the editor.",
    },
    {
      question: "Can I email invoices or collect payment here?",
      answer:
        "No. This tool does not send email, create payment links, or connect to Stripe. Those would need a server and are reserved for a later Pro design.",
    },
    {
      question: "How are tax and discounts calculated?",
      answer:
        "Tax is calculated on each line’s amount (quantity × unit price) before any invoice-level discount. A percent or fixed discount then reduces the subtotal only. Total = subtotal − discount + tax. Amount paid reduces the balance due. Rounding uses half-up integer arithmetic in the currency’s minor units.",
    },
    {
      question: "Will this satisfy every country’s invoice laws?",
      answer:
        "No. Required fields, tax schemes, and e-invoicing rules differ. Use this as a professional document starter and check local requirements.",
    },
  ],
};
