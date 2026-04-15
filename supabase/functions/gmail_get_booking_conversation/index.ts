import { jsonResponse, withCors } from "../_shared/booking.ts";
import { getBookingConversation } from "../_shared/gmail.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const url = new URL(request.url);
    const body = request.method === "GET" ? null : await request.json();
    const bookingId = (
      request.method === "GET"
        ? url.searchParams.get("bookingId")
        : String(body?.bookingId ?? "")
    )?.trim();

    if (!bookingId) throw new Error("Missing bookingId");

    const syncParam = request.method === "GET"
      ? url.searchParams.get("sync")
      : typeof body?.sync === "boolean"
      ? String(body.sync)
      : typeof body?.sync === "string"
      ? body.sync
      : undefined;
    const sync = syncParam === "1" || syncParam === "true";

    const result = await getBookingConversation({
      bookingId,
      sync,
    });

    return jsonResponse(result);
  }));
