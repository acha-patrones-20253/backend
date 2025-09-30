import validateJWT from "../utils/validateJWT"

export default ({ headers }: any) => {
  const token = (headers['Authorization'] ?? headers["authorization"])?.split(" ")?.at(-1)

  try {
    if (!token) throw new Error("No token provided")
    validateJWT({ token, key: "ADMIN_AUTH_JWT" })
  } catch (err) {
    return new Response("Invalid Credentials", {
      status: 401
    })
  }
}