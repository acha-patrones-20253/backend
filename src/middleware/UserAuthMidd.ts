import type { Context } from "elysia"
import validateJWT from "../utils/validateJWT"
import type { AuthUser } from "../types/auth.types"

export default (context: Context) => {
  const { headers } = context
  const token = (headers['Authorization'] ?? headers["authorization"])?.split(" ")?.at(-1)

  try {
    if (!token) throw new Error("No token provided")
    const { decoded } = validateJWT({ token, key: "USER_AUTH_JWT" })
  
    // @ts-expect-error
    context.user = decoded as AuthUser
  } catch (err) {
    return new Response("Invalid Credentials", {
      status: 401
    })
  }
}