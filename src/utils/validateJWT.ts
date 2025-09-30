import jwt from "jsonwebtoken"

export default ({ token, key = "ADMIN_AUTH_JWT" }: {
  token: string,
  key?: string
}) => {
  try {
    const decoded = jwt.verify(token, import.meta.env[key]!);

    return ({
      ok: true,
      err: undefined,
      valid: true,
      decoded
    })

  } catch (err) {
    return ({
      ok: false,
      err,
      valid: false
    })
  }

}