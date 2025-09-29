import z from "zod";

export default z.object({
  username: z.string(),
  full_name: z.string(),
  password: z.string(),
  email: z.string()
})