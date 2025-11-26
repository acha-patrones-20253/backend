import type { Context } from "elysia";
import supabaseClient from "../lib/supabaseClient";
import type { AuthUser } from "../types/auth.types";
import { z } from "zod";
import generateTicketToken from "../utils/generateTicketToken";
import { GoogleWalletAdapter } from "../utils/walletLink/adapters/GoogleWalletAdapter";
import type WalletLinkAdapter from "../utils/walletLink/WalletLinkAdapter";
import { sendEmail } from "../lib/resendClient";


const PurchaseSchema = z.object({
  event_id: z.string().uuid(),
  tickets_quantity: z.number().min(1),
  accommodations: z.array(z.object({
    accommodation_id: z.string().uuid(),
    quantity: z.number().min(1)
  })).optional()
});

const createPurchase = async (context: Context & { user: AuthUser }) => {

  const linkGenerator: WalletLinkAdapter = new GoogleWalletAdapter();

  const { body, user } = context;

  const parseBody = PurchaseSchema.safeParse(body);

  if (!parseBody.success) {
    return new Response(`Invalid request body\n${parseBody.error.message}`, {
      status: 400
    });
  }


  const { event_id, tickets_quantity, accommodations } = parseBody.data;

  const ticketsToInsert = Array.from({ length: tickets_quantity }).map(() => ({
    client_id: user.user_id,
    event_id: event_id,
    access_type: 'GENERAL'
  }));
  const { data: createdTickets, error: ticketError } = await supabaseClient
    .from("event_access")
    .insert(ticketsToInsert)
    .select("event_access_id"); // tomamos los ids generados

  if (ticketError || !createdTickets || createdTickets.length === 0) {
    console.error("Error creating tickets:", ticketError);
    return new Response("Error processing tickets", { status: 500 });
  }

  for (const ticket of createdTickets) {
    console.log("Created ticket ID:", ticket.event_access_id);

    const ticket_token = generateTicketToken({
      event_access_id: ticket.event_access_id,
      user_id: user.user_id
    })

    const google_link = linkGenerator.getWalletLink({
      ticket_token,
      id: ticket.event_access_id,
      ticketHolderName: user.username
    })

    await supabaseClient.from("event_access")
      .update({
        ticket: ticket_token,
        wallet_link: google_link
      })
      .eq("event_access_id", ticket.event_access_id);
  }

  if (accommodations && accommodations.length > 0) {
    const lodgingsToInsert = accommodations.flatMap((acc) => {
      return Array.from({ length: acc.quantity }).map(() => ({
        client_id: user.user_id,
        accomodation_id: acc.accommodation_id,
        indications: 'Reserva vía Web',
        guest_number: 1
      }));
    });


    const { error: lodgingError, data: lodgingsAdded } = await supabaseClient
      .from("lodging_access")
      .insert(lodgingsToInsert)
      .select("*")

    if (lodgingError) {
      console.error("Error creating lodging:", lodgingError);
      return new Response("Error processing accommodation booking", { status: 500 });
    }

    for (const lodging of lodgingsAdded) {
      console.log("Created ticket ID:", lodging.accomodation_id);

      const ticket_token = generateTicketToken({
        lodging_access_id: lodging.lodging_access_id,
        user_id: user.user_id
      })

      const google_link = linkGenerator.getWalletLink({
        ticket_token,
        id: lodging.lodging_access_id,
        ticketHolderName: user.username
      })

      await supabaseClient.from("lodging_access")
        .update({
          ticket: ticket_token,
          wallet_link: google_link
        })
        .eq("loding_access_id", lodging.lodging_access_id);
    }
  }

  const paymentsToInsert = await Promise.all(createdTickets.map(async (ticket) => {
    const amount = await supabaseClient.from("events")
      .select("basePrice")
      .eq("event_id", event_id)
      .single();


    return ({
      client_id: user.user_id,
      event_access_id: ticket.event_access_id,
      amount: amount.data?.basePrice || 0,
      payment_method: 'CREDIT_CARD',
      payment_date: new Date().toISOString(),
      status: 'COMPLETED'
    })
  }));


  const { error: paymentError, data } = await supabaseClient
    .from("payments")
    .insert(paymentsToInsert)
    .select("payment_id");

  if (paymentError) {
    console.error("Error registering payment:", paymentError);
    return new Response("Error registering payment", { status: 500 });
  }

  sendEmail({
    to: [user.email],
    subject: "Confirmación de compra y siguientes pasos",
    html: `
    <p>Hola <strong>${user.username}</strong>,</p>
    
    <p>¡Gracias por tu compra! Confirmamos que has adquirido exitosamente <strong>${tickets_quantity} entrada(s)</strong> para el evento.</p>
    
    <p>Para completar tu experiencia, es necesario que realices lo siguiente:</p>
    
    <ol>
      <li><strong>Confirma tu registro:</strong> Revisa los detalles en tu perfil.</li>
      <li><strong>Entra a la App:</strong> Tus entradas digitales solo estarán disponibles a través de nuestra web.</li>
    </ol>

    <p>¡Nos vemos pronto!</p>
    <p>Atentamente,<br/>El equipo del evento</p>
  `
  }).catch((err) => {
    console.error("Error al enviar el correo de confirmación:", err);
  });

  return new Response(JSON.stringify({
    message: "Purchase successful",
    tickets_created: createdTickets.length,
    payment_references: data.map(d => d.payment_id)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export { createPurchase };