import type { Context } from "elysia";
import zUserCreator from "../schemas/zUserCreator";
import supabaseClient from "../lib/supabaseClient";
import { hashSync } from "bcrypt";

const register = async (context: Context) => {
  const { body } = context

  let parseBody = zUserCreator.safeParse(body)

  if (parseBody.error) {
    console.log("Error auth/register")
    return new Response(`Invalid query\n${parseBody.error.message}`, {
      status: 400
    })
  }

  let { username, full_name, password, email } = parseBody.data;

  const oldUser = await supabaseClient.from("users").select("*").or(`email.eq.${email},username.eq.${username}`)

  if (oldUser.error) {
    return new Response("Internal Server Error", {
      status: 500
    })
  }

  if (oldUser.data.length > 0) {
    return new Response("This user already exists", {
      status: 400
    })
  }

  const password_hash = hashSync(password, 10)

  const createQuery = await supabaseClient.from("users").insert([{
    username,
    full_name,
    email,
    password_hash,

    contact_email: true,
    email_verified: true, // Por ahora dejarlo así
    send_promotional: true,
    send_sec_advices: true,
  }]).select()

  if (createQuery.error) {
    return new Response("Internal Server Error, cannot create user", {
      status: 500
    })
  }

  return new Response(
    JSON.stringify(createQuery.data),
    {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    }
  )
}

export { register }