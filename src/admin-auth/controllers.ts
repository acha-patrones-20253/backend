import Elysia from "elysia";
import { createOrganizer, getUser, login, register } from './handlers.ts'
import UserAuthMidd from "../middleware/UserAuthMidd.ts";

export const admin_auth = new Elysia({
  prefix: '/admin/auth'
})
  .post("login", login)
  .post("register", register)
  .post("organizer", createOrganizer)
  .get("me", getUser, {
    beforeHandle: UserAuthMidd
  })