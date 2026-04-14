import { jsonResponse, sendManagedBookingMail, withCors } from "../_shared/booking.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? "");
    if (!bookingId) throw new Error("Missing bookingId");
    const result = await sendManagedBookingMail({
      bookingId,
      type: "confirmation",
      recipientEmail: typeof body?.recipientEmail === "string"
        ? body.recipientEmail
        : typeof body?.customerEmail === "string"
        ? body.customerEmail
        : typeof body?.customer_email === "string"
        ? body.customer_email
        : undefined,
    });
    return jsonResponse(result);
  }));
