import Elysia from "elysia";
import { register } from './handlers.ts'

export const auth = new Elysia({
  prefix: '/auth'
}).post("register", register)
