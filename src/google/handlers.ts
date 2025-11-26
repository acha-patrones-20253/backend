import { randomUUIDv7 } from "bun";
import Elysia from "elysia";
import getServiceAccount from "../utils/getServiceAccount";
import jwt from 'jsonwebtoken'
import supabaseClient from "../lib/supabaseClient";
import AdminAuthMidd from "../middleware/AdminAuthMidd";

export const google = new Elysia({
  prefix: '/google'
})
  .get("qr-code", async ({ request }) => {
    const serviceAccount = getServiceAccount()

    const requestURL = request.url;
    const searchParams = new URL(requestURL).searchParams

    const user_id = searchParams.get("user_id")

    if (!user_id) {
      return new Response("Invalid request", {
        status: 400
      })
    }

    let user;
    let eventTicket;
    let lodgingTicket;

    try {
      user = await supabaseClient.from("users").select("*").eq("user_id", user_id)

      if (!user || !user.data || !user.data[0] || user.error) throw new Error("User not found - !user = true")

        const eventQuery = await supabaseClient
        .from("event_access") 
        .select("event_access_id")
        .eq("client_id", user_id)
        .maybeSingle(); // Puede ser null si no compró evento

      eventTicket = eventQuery.data;

      const lodgingQuery = await supabaseClient
        .from("lodging_access") 
        .select("lodging_access_id")
        .eq("client_id", user_id)
        .maybeSingle(); // Puede ser null si no reservó hotel

      lodgingTicket = lodgingQuery.data;

        if (!eventTicket && !lodgingTicket) {
        throw new Error("User has no active tickets (Event or Lodging)");
      }

    } catch (err) {
      return new Response("Invalid request or User/Ticket(s) not found", {
        status: 400
      })
    }

    const ticketHolderName = user.data[0].full_name

    const value = {
      event_access_id: eventTicket?.event_access_id || null,     // Llave del Evento
      lodging_access_id: lodgingTicket?.lodging_access_id || null, // Llave del Hotel
      user_id: user_id,
      timestamp: Date.now()
    }

    const ticket_token = jwt.sign(value, import.meta.env.TICKETS_KEY_JWT!)

    const mainTicketId = randomUUIDv7();

    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: {
        eventTicketObjects: [
          {
            id: `${import.meta.env['google-issuer-id']}.${mainTicketId}`,
            classId: `${import.meta.env['google-issuer-id']}.demo_class1`,
            state: "ACTIVE",
            barcode: {
              type: 'qrCode',
              value: ticket_token
            },
            ticketHolderName
          }
        ]
      }
    }

    const token = jwt.sign(payload, serviceAccount.private_key!, { algorithm: "RS256" });

    const link = "https://pay.google.com/gp/v/save/" + token;

    return new Response(JSON.stringify({ link, ticket_token, value, }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  }, {
    beforeHandle: AdminAuthMidd
  })