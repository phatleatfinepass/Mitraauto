import { handleEReceiptDownload } from "../_shared/ereceipt.ts";

Deno.serve((request) => handleEReceiptDownload(request));
