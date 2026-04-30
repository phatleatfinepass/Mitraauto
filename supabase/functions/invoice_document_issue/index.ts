import { handleInvoiceDocumentIssue } from "../_shared/invoice_document.ts";

Deno.serve((request) => handleInvoiceDocumentIssue(request));
