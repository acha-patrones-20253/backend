import Elysia from "elysia";
import UserAuthMidd from "../middleware/UserAuthMidd";
import { createLocation } from "./handlers";

export const locations = new Elysia({
  prefix: '/location'
})
  .post("create", createLocation, {
    beforeHandle: UserAuthMidd
  })