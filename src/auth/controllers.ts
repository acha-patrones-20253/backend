import Elysia from "elysia";
import { login, register } from './handlers.ts'

export const auth = new Elysia({
  prefix: '/auth'
})
  .post("register", register)
  .post("login", login)