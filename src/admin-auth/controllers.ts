import Elysia from "elysia";
import { getUser, login, register } from './handlers.ts'
import UserAuthMidd from "../middleware/UserAuthMidd.ts";

export const admin_auth = new Elysia({
  prefix: '/admin/auth'
})
  .post("login", login)
  .post("register", register)
  .get("me", getUser, {
    beforeHandle: UserAuthMidd
  })