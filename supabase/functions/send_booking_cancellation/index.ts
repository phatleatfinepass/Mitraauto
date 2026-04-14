import { jsonResponse, sendManagedBookingMail, supabaseAdmin, withCors } from "../_shared/booking.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? "");
    if (!bookingId) throw new Error("Missing bookingId");
    const cancellationNote = typeof body?.cancellationNote === "string" ? body.cancellationNote.trim() : null;

    const { error: cancelError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_note: cancellationNote || null,
        customer_last_action_at: new Date().toISOString(),
        customer_action_state: "cancelled",
      })
      .eq("id", bookingId);

    if (cancelError) {
      throw cancelError;
    }

    const result = await sendManagedBookingMail({
      bookingId,
      type: "cancellation",
      incrementSequence: true,
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
