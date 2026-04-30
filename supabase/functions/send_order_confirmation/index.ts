import { sendOrderConfirmationEmail } from "../_shared/order_email.ts";
import { jsonResponse, withCors } from "../_shared/booking.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = await request.json();
    const orderId = String(body?.orderId ?? body?.order_id ?? "").trim();
    if (!orderId) throw new Error("Missing orderId");
    return jsonResponse(await sendOrderConfirmationEmail(orderId));
  }));
