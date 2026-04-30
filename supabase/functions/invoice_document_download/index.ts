import { handleInvoiceDocumentDownload } from "../_shared/invoice_document.ts";

Deno.serve((request) => handleInvoiceDocumentDownload(request));
