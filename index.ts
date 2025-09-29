import Elysia from "elysia";
import { program } from "commander";
import genJWT from "./src/utils/genJWT";
import validateJWT from "./src/utils/validateJWT";
import { supabase } from "./src/supabase/handlers";
import { google } from "./src/google/handlers";
import { auth } from "./src/auth/controllers";

program
  .name('Unlocked Backend Server')
  .description("Backend")
  .version('0.0.1')
  .option('-s , --serve', 'Start backend server')
  .option('-g , --generatejwt', 'Generate API key')

program.parse()


const options = program.opts();
const serve = options.serve ? true : false;
const generatejwt = options.generatejwt ? true : false;

if (!(generatejwt || serve)) {
  program.help()
}

if (generatejwt) {
  console.log("Generando JWT...")

  const { token } = genJWT()

  console.log(`TOKEN: Bearer ${token}`)
}
if (serve) {

  const app = new Elysia()
    .onBeforeHandle(({ headers }) => {
      const token = (headers['Authorization'] ?? headers["authorization"])?.split(" ")?.at(-1)

      try {
        if (!token) throw new Error("No token provided")
        validateJWT({ token })
      } catch (err) {
        return new Response("Invalid Credentials", {
          status: 401
        })
      }
    })
    .use(supabase)
    .use(google)
    .use(auth)

  app.on('start', () => {
    console.log(`Elysia Listening Port = ${import.meta.env.PORT}`)
  })

  app.listen(import.meta.env.PORT!)
}

