import { randomUUIDv7 } from "bun";
import Elysia from "elysia";
import getServiceAccount from "../utils/getServiceAccount";
import jwt from 'jsonwebtoken'

export const google = new Elysia({
  prefix: '/google'
})
  .get("qr-code", ({ request }) => {
    const serviceAccount = getServiceAccount()

    console.log(getServiceAccount())

    const requestURL = request.url;
    const searchParams = new URL(requestURL).searchParams

    const user_id = searchParams.get("user_id")

    if(!user_id) {
      return new Response("Invalid request", {
        status: 400
      })
    }

    // TODO: GET User Name
    const ticketHolderName = "Miguel Vargas"

    const value = `${user_id}-${randomUUIDv7()}`

    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: {
        eventTicketObjects: [
          {
            id: `${import.meta.env['google-issuer-id']}.${randomUUIDv7()}`,
            classId: `${import.meta.env['google-issuer-id']}.demo_class1`,
            state: "ACTIVE",
            barcode: {
              type: 'qrCode',
              value
            },
            ticketHolderName
          }
        ]
      }
    }

    const token = jwt.sign(payload, serviceAccount.private_key!, { algorithm: "RS256" });

    const link = "https://pay.google.com/gp/v/save/" + token;


    return new Response(JSON.stringify({link}), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  })