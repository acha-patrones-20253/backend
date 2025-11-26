import type { Context } from "elysia";
import supabaseClient from "../lib/supabaseClient";
import { compareSync, hashSync } from "bcrypt";
import { sign } from "jsonwebtoken";
import { sendEmail } from "../lib/resendClient";
import type { AuthUser } from "../types/auth.types";
import { SchemaUserChangePass, SchemaUserLogIn, SchemaUserRegister } from "@acha/pdsoft/schemas";

const register = async (context: Context) => {
  const { body } = context

  let parseBody = SchemaUserRegister.schema.safeParse(body)

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

  const user = createQuery

  const payload = {
    token: sign({
      username,
      email: user.data?.at(0)?.email!,
      user_id: user.data?.at(0)?.user_id!,
      admin: false
    }, import.meta.env.USER_AUTH_JWT!, {
      expiresIn: '1w'
    }),
    username,
    email: user.data?.at(0)?.email!,
    admin: false
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

const login = async (context: Context) => {
  const { body } = context

  let parseBody = SchemaUserLogIn.schema.safeParse(body)

  if (parseBody.error) {
    console.log("Error auth/login")
    return new Response(`Invalid query\n${parseBody.error.message}`, {
      status: 400
    })
  }

  let { email, password } = parseBody.data;

  const user = await supabaseClient.from("users").select("email,password_hash,email,user_id,username").eq("email", email)

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

  const username = user.data.at(0)?.username

  const payload = {
    token: sign({
      username,
      email: user.data?.at(0)?.email!,
      user_id: user.data?.at(0)?.user_id!,
      admin: false
    }, import.meta.env.USER_AUTH_JWT!, {
      expiresIn: '1w'
    }),
    username,
    email: user.data?.at(0)?.email!,
    admin: false
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

const sendRecoverMail = async (context: Context) => {
  const searchParams = (new URL(context.request.url)).searchParams
  const email = searchParams.get("email") ?? ""

  const user = await supabaseClient.from("users").select("username,password_hash,email").eq("email", email)

  if (user.error) {
    return new Response("Internal Server Error", {
      status: 500
    })
  }

  if (!user.data || user.data.length == 0) {
    return new Response("OK", { // Fake OK response
      status: 200
    })
  }

  const username = user.data?.at(0)?.username!

  const token = sign({
    username,
    email,
    admin: false
  }, import.meta.env.USER_AUTH_JWT!, {
    expiresIn: '1h'
  })

  sendEmail({
    subject: "Recovery Password - Patrones Proyecto",
    html: `
      1 HOUR VALIDITY!\n\n
      Click <a href="https://www.google.com/search?q=${token}">Here</a> to recover your password.
    `,
    to: [email]
  })

  return new Response("OK", {
    status: 200
  })
}

const changePassword = async (context: Context & {
  user: AuthUser
}) => {
  const { user_id, username, email } = context.user

  const zParse = await SchemaUserChangePass.schema.safeParseAsync(context.body)
  if (zParse.error) return new Response("Invalid Query", {
    status: 400
  })

  const { password } = zParse.data

  await supabaseClient.from("users")
    .update({
      password_hash: hashSync(password, 10)
    }).eq("user_id", user_id)

  return new Response("OK", { status: 200 })
}

const getUser = async (context: Context & {
  user: AuthUser
}) => {

  const { user_id } = context.user;

  const user = await supabaseClient.from("users").select("*").eq("user_id", user_id)

  return new Response(JSON.stringify(user?.data![0]), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

export { register, login, sendRecoverMail, changePassword, getUser }