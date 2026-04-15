import { handleGmailOAuthCallback } from "../_shared/gmail.ts";

Deno.serve((request) => handleGmailOAuthCallback(request));
