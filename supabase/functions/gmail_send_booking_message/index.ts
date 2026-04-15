import { jsonResponse, withCors } from "../_shared/booking.ts";
import { sendGmailBookingMessage } from "../_shared/gmail.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? "");
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!bookingId) throw new Error("Missing bookingId");
    if (!subject) throw new Error("Missing subject");
    if (!message) throw new Error("Missing message");

    const result = await sendGmailBookingMessage({
      bookingId,
      subject,
      message,
      mailboxEmail: typeof body?.mailboxEmail === "string" ? body.mailboxEmail : undefined,
    });

    return jsonResponse(result);
  }));
