import type { Context } from "elysia";
import supabaseClient from "../lib/supabaseClient";
import { compareSync, hashSync } from "bcrypt";
import { sign } from "jsonwebtoken";
import type { AuthUser } from "../types/auth.types";
import { SchemaUserLogIn } from "@acha/pdsoft/schemas";
import z from "zod";

const register = async (context: Context) => {
  const { body } = context

  const schema = z.object({
    username: z.string().min(3).max(30),
    full_name: z.string().min(3).max(100),
    password: z.string().min(4).max(100),
    email: z.email().max(100),
    organizer_id: z.string(),
  })

  let parseBody = schema.safeParse(body)

  if (parseBody.error) {
    console.log("Error auth/register")
    return new Response(`Invalid query\n${parseBody.error.message}`, {
      status: 400
    })
  }

  let { username, organizer_id, password, email, full_name } = parseBody.data;

  const oldUser = await supabaseClient.from("admin").select("*").or(`email.eq.${email},username.eq.${username}`)

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

  const createQuery = await supabaseClient.from("admin").insert([{
    username,
    email,
    password_hash,
    organizer_id,
    full_name
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
      admin: true
    }, import.meta.env.USER_AUTH_JWT!, {
      expiresIn: '1w'
    }),
    username,
    email: user.data?.at(0)?.email!,
    admin: true
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

  const user = await supabaseClient.from("admin").select("*").eq("email", email)
  const organizer = await supabaseClient.from("organizer").select("*").eq("email", email)

  if (user.error || organizer.error) {
    return new Response("Internal Server Error", {
      status: 500
    })
  }

  if (!user.data || user.data.length == 0 || !Boolean(user.data.at(0)?.password_hash)) {

    if (!organizer.data || organizer.data.length == 0 || !Boolean(organizer.data.at(0)?.password_hash)) {

      return new Response("Cannot LogIn", {
        status: 401
      })

    }

    const passwordIsCorrect = compareSync(password, organizer.data.at(0)?.password_hash!)

    if (!passwordIsCorrect) {
      return new Response("Cannot LogIn", {
        status: 401
      })
    }

    const username = organizer.data.at(0)?.username
    const payload = {
      token: sign({
        username,
        email: organizer.data?.at(0)?.email!,
        organizer_id: organizer.data?.at(0)?.organizer_id!,
        admin: true,
        user_id: organizer.data?.at(0)?.organizer_id!
      }, import.meta.env.USER_AUTH_JWT!, {
        expiresIn: '1w'
      }),
      username,
      email: organizer.data?.at(0)?.email!,
      organizer: true,
      admin: true,
      organizer_id: organizer.data?.at(0)?.organizer_id!
    }

    return new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json"
      }
    })

  }


  const passwordIsCorrect = compareSync(password, user.data.at(0)?.password_hash!)

  if (!passwordIsCorrect) {
    return new Response("Cannot LogIn", {
      status: 401
    })
  }

  const username = user.data.at(0)?.usename

  const payload = {
    token: sign({
      username,
      email: user.data?.at(0)?.email!,
      user_id: user.data?.at(0)?.user_id!,
      admin: true
    }, import.meta.env.USER_AUTH_JWT!, {
      expiresIn: '1w'
    }),
    username,
    email: user.data?.at(0)?.email!,
    admin: true
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

const getUser = async (context: Context & {
  user: AuthUser
}) => {

  const { user_id, organizer_id } = context.user;

  const admin = (
    context.user.organizer_id ?
      await supabaseClient.from("organizer").select("*").eq("organizer_id", organizer_id!) :
      await supabaseClient.from("admin").select("*").eq("user_id", user_id)
  )

  return new Response(JSON.stringify(admin?.data![0]), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

const createOrganizer = async (context: Context) => {
  const { body } = context

  const schema = z.object({
    username: z.string().min(3).max(100),
    email: z.email().max(100),
    organization_name: z.string().min(3).max(100),
    password: z.string().min(4).max(100),
  })

  let parseBody = schema.safeParse(body)

  if (parseBody.error) {
    console.log("Error auth/register")
    return new Response(`Invalid query\n${parseBody.error.message}`, {
      status: 400
    })
  }

  let { username, organization_name, email, password } = parseBody.data;

  const password_hash = hashSync(password, 10)

  const oldOrganizer = await supabaseClient.from("organizer").select("*").or(`email.eq.${email},organization_name.eq.${organization_name}`)
  if (oldOrganizer.error) {
    return new Response("Internal Server Error", {
      status: 500
    })
  }

  if (oldOrganizer.data.length > 0) {
    return new Response("This organizer already exists", {
      status: 400
    })
  }

  const createQuery = await supabaseClient.from("organizer").insert([{
    username,
    email,
    organization_name,
    password_hash,
  }]).select()

  if (createQuery.error) {
    return new Response("Internal Server Error, cannot create organizer", {
      status: 500
    })
  }

  const organizer = createQuery.data?.at(0)

  return new Response(JSON.stringify(organizer), {
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export { register, login, getUser, createOrganizer }