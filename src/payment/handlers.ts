import type { Context } from "elysia";
import supabaseClient from "../lib/supabaseClient";
import type { AuthUser } from "../types/auth.types";
import { z } from "zod";
import generateTicketToken from "../utils/generateTicketToken";
import generateGoogleWalletLink from "../utils/generateGoogleWalletLink";

// 1. Definimos el esquema de validación para el body de la compra
// Esto debería ir en tu archivo de schemas compartidos, pero lo pongo aquí para referencia
const PurchaseSchema = z.object({
  event_id: z.string().uuid(),
  tickets_quantity: z.number().min(1),
  accommodations: z.array(z.object({
    accommodation_id: z.string().uuid(),
    quantity: z.number().min(1) // Aquí quantity representa 'guest_number' o cantidad de reservas
  })).optional()
});

const createPurchase = async (context: Context & { user: AuthUser }) => {
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
    .select("event_access_id"); // Necesitamos los IDs generados

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

    const google_link = generateGoogleWalletLink({
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


    const { error: lodgingError } = await supabaseClient
      .from("lodging_access")
      .insert(lodgingsToInsert);

    for (const lodging of lodgingsToInsert) {
      console.log("Created ticket ID:", lodging.accomodation_id);

      const ticket_token = generateTicketToken({
        lodging_access_id: lodging.accomodation_id,
        user_id: user.user_id
      })

      const google_link = generateGoogleWalletLink({
        ticket_token,
        id: lodging.accomodation_id,
        ticketHolderName: user.username
      })

      await supabaseClient.from("lodging_access")
        .update({
          ticket: ticket_token,
          wallet_link: google_link
        })
        .eq("accomodation_id", lodging.accomodation_id);
    }

    if (lodgingError) {
      console.error("Error creating lodging:", lodgingError);
      return new Response("Error processing accommodation booking", { status: 500 });
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
      payment_method: 'CREDIT_CARD', // Hardcoded por ahora, vendría del frontend si hubiese pasarela real
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