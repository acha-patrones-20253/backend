import type { Context } from "elysia"
import type { AuthUser } from "../types/auth.types"
import supabaseClient from "../lib/supabaseClient";
import { SchemaEventCreator, SchemaLocationCreator } from "@acha/pdsoft/schemas";

export const createLocation = async (context: Context & {
  user: AuthUser
}) => {

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

    const body = await SchemaLocationCreator.schema.safeParseAsync(context.body)

    if (body.error) {
      return new Response(JSON.stringify(body.error.issues), {
        status: 401
      })
    }

    const event = await supabaseClient.from("locations").insert(body.data).select("*");

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