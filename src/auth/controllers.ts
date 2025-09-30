import Elysia from "elysia";
import { changePassword, login, register, sendRecoverMail } from './handlers.ts'
import UserAuthMidd from "../middleware/UserAuthMidd.ts";

export const auth = new Elysia({
  prefix: '/auth'
})
  .post("register", register)
  .post("login", login)
  .get("recover", sendRecoverMail)
  .post("change-pass", changePassword, {
    beforeHandle: UserAuthMidd
  })