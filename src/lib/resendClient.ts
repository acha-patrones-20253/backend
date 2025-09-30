import { Resend } from "resend";
import { type ResendSendEmail } from "../types/resend.types";
const resendClient = new Resend(import.meta.env.RESEND_API_KEY!)

const sendEmail = ({html, subject, to }: ResendSendEmail) => {
  return resendClient.emails.send({
    from: "Patrones Diseño <patrones@acha.dev>",
    to,
    subject,
    html
  })
}

export {
  sendEmail
}