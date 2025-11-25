import getServiceAccount from "./getServiceAccount"
import jwt from 'jsonwebtoken'

export default ({ ticket_token, ticketHolderName, id }: {
  ticket_token: string,
  ticketHolderName: string,
  id: string
}) => {
  const serviceAccount = getServiceAccount()

  const payload = {
    iss: serviceAccount.client_email,
    aud: "google",
    typ: "savetowallet",
    payload: {
      eventTicketObjects: [
        {
          id: `${import.meta.env['google-issuer-id']}.${id}`,
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

  return link
}