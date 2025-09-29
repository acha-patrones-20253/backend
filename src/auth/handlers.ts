import type { Context } from "elysia";
import zUserCreator from "../schemas/zUserCreator";
import supabaseClient from "../lib/supabaseClient";
import { compareSync, hashSync } from "bcrypt";
import zUserLogin from "../schemas/zUserLogin";
import { sign } from "jsonwebtoken";

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

const login = async (context: Context) => {
  const { body } = context

  let parseBody = zUserLogin.safeParse(body)

  if (parseBody.error) {
    console.log("Error auth/login")
    return new Response(`Invalid query\n${parseBody.error.message}`, {
      status: 400
    })
  }

  let { username, password } = parseBody.data;

  const user = await supabaseClient.from("users").select("username,password_hash,email").eq("username", username)

  if (user.error) {
    return new Response("Internal Server Error", {
      status: 500
    })
  }
  
  if (!user.data || user.data.length == 0 || !Boolean(user.data.at(0)?.password_hash)) {
    return new Response("Cannot LogIn", {
      status: 401
    })
  }


  const passwordIsCorrect = compareSync(password, user.data.at(0)?.password_hash!)

  if (!passwordIsCorrect) {
    return new Response("Cannot LogIn", {
      status: 401
    })
  }

  const payload = {
    token: sign({
      username,
      email: user.data?.at(0)?.email!
    }, import.meta.env.AUTH_JWT!, {
      expiresIn: '1w'
    }),
    username,
    email: user.data?.at(0)?.email!
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

export { register, login }