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
    let ticket;

    try {
      user = await supabaseClient.from("users").select("*").eq("user_id", user_id)

      if (!user || !user.data || !user.data[0] || user.error) throw new Error("User not found - !user = true")

        ticket = await supabaseClient
        .from("event_access") 
        .select("event_access_id, event_id")
        .eq("client_id", user_id)
        .maybeSingle();

        if (!ticket.data) throw new Error("User has no tickets");

    } catch (err) {
      return new Response("Invalid request or User/Ticket not found", {
        status: 400
      })
    }

    const ticketHolderName = user.data[0].full_name

    const ticket_id = ticket.data.event_access_id;
    const value = {
      event_access_id: ticket_id,
      user_id: user_id,
      key: `${user_id}-${ticket_id}`
    }

    const ticket_token = jwt.sign(value, import.meta.env.TICKETS_KEY_JWT!)

    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: {
        eventTicketObjects: [
          {
            id: `${import.meta.env['google-issuer-id']}.${ticket_id}`,
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