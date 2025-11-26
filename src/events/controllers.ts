import Elysia from "elysia";
import { createEvent } from "./handlers";
import UserAuthMidd from "../middleware/UserAuthMidd";

export const events = new Elysia({
  prefix: '/event'
})
  .post("create", createEvent, {
    beforeHandle: UserAuthMidd
  })