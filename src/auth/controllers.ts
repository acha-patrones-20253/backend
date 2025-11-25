import Elysia from "elysia";
import { changePassword, getUser, login, register, sendRecoverMail } from './handlers.ts'
import UserAuthMidd from "../middleware/UserAuthMidd.ts";

export const auth = new Elysia({
  prefix: '/auth'
})
  .post("register", register)
  .post("login", login)
  .get("recover", sendRecoverMail)
  .get("me", getUser, {
    beforeHandle: UserAuthMidd
  })
  .post("change-pass", changePassword, {
    beforeHandle: UserAuthMidd
  })