import type { Context } from "elysia"
import type { AuthUser } from "../types/auth.types"
import supabaseClient from "../lib/supabaseClient";
import { SchemaEventCreator } from "@acha/pdsoft/schemas";

export const createEvent = async (context: Context & {
  user: AuthUser
}) => {

  const { user_id, organizer_id } = context.user;

  try {
    // let admin = (
    //   context.user.organizer_id ?
    //     await supabaseClient.from("organizer").select("*").eq("organizer_id", organizer_id!) :
    //     await supabaseClient.from("admin").select("*,organizer(organizer_id,organization_name)").eq("user_id", user_id)
    // )

    const is_organizer = context.user.organizer_id ? true : false;

    if (!is_organizer) {
      return new Response("You're not an Organizer", {
        status: 401
      })
    }

    const body = await SchemaEventCreator.schema.safeParseAsync(context.body)

    if (body.error) {
      return new Response(JSON.stringify(body.error.issues), {
        status: 401
      })
    }

    const event = await supabaseClient.from("events").insert([{
      ...body.data,
      organizer_id: context.user.organizer_id
    }]).select("*");

    console.log(body.data, event)

    if(event.error) {
      console.log(event.error)
      return new Response("Internal server error", {
        status: 500
      })
    }

    return new Response(JSON.stringify(event), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    })
  } catch (err) {
    console.log(err)
    return new Response("Internal Server Error", {
      status: 500
    })
  }

}