import { handleBookingManageAction, jsonResponse, withCors } from "../_shared/booking.ts";

Deno.serve((request) =>
  withCors(request, async () => {
    const body = request.method === "GET"
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await request.json();
    const action = String(body?.action ?? body?.mode ?? "get_booking") as Parameters<typeof handleBookingManageAction>[0];
    const result = await handleBookingManageAction(action, body);
    return jsonResponse(result);
  }));
