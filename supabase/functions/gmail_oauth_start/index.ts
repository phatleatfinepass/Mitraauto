import { handleGmailOAuthStart } from "../_shared/gmail.ts";

Deno.serve((request) => handleGmailOAuthStart(request));
