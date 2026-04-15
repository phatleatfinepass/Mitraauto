import { jsonResponse, withCors } from "../_shared/booking.ts";
import { syncGmailBookingThreads } from "../_shared/gmail.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = request.method === "GET"
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await request.json().catch(() => ({}));

    const result = await syncGmailBookingThreads({
      bookingId: typeof body?.bookingId === "string" && body.bookingId.trim() ? body.bookingId : undefined,
      mailboxEmail: typeof body?.mailboxEmail === "string" && body.mailboxEmail.trim()
        ? body.mailboxEmail
        : undefined,
    });

    return jsonResponse(result);
  }));
