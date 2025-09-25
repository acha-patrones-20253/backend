import jwt from "jsonwebtoken"

export default ({ token }: {
  token: string
}) => {
  try {
    const decoded = jwt.verify(token, import.meta.env.JWT_KEY!);

    return ({
      ok: true,
      err: undefined,
      valid: true
    })

  } catch (err) {
    return ({
      ok: false,
      err,
      valid: false
    })
  }

}