import { createInstallBookingFromOrder, getOrderInstallContext } from "../_shared/order_email.ts";
import { jsonResponse, withCors } from "../_shared/booking.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = request.method === "GET"
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await request.json();
    const action = String(body?.action ?? "context");
    const token = String(body?.token ?? body?.install_token ?? "").trim();
    if (!token) throw new Error("Missing install token");

    if (action === "context") {
      return jsonResponse(await getOrderInstallContext(token));
    }

    if (action === "create") {
      return jsonResponse(await createInstallBookingFromOrder(token, body));
    }

    throw new Error(`Unsupported action: ${action}`);
  }));
