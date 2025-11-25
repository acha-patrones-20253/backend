import Elysia from "elysia";
import { createPurchase } from "./handlers";
import UserAuthMidd from "../middleware/UserAuthMidd";

export const payment = new Elysia({
  prefix: '/payment'
})
  .post("create", createPurchase, {
    beforeHandle: UserAuthMidd
  })