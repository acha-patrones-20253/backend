import Elysia from "elysia";
import UserAuthMidd from "../middleware/UserAuthMidd";
import { createAccommodation } from "./handlers";

export const accomodations = new Elysia({
  prefix: '/accommodation'
})
  .post("create", createAccommodation, {
    beforeHandle: UserAuthMidd
  })