import { jsonResponse, withCors } from "../_shared/booking.ts";
import { sendBookingEReceipt } from "../_shared/ereceipt.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? body?.booking_id ?? "").trim();
    if (!bookingId) throw new Error("Missing bookingId");

    return jsonResponse(await sendBookingEReceipt({
      bookingId,
      lines: body?.lines,
      notes: body?.notes ?? null,
      recipientEmail: body?.recipientEmail ?? body?.recipient_email ?? null,
    }));
  }));
