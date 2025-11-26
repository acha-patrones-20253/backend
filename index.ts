import Elysia from "elysia";
import { program } from "commander";
import genJWT from "./src/utils/genJWT";
import { supabase } from "./src/supabase/handlers";
import { google } from "./src/google/handlers";
import { auth } from "./src/auth/controllers";
import { cors } from "@elysiajs/cors"
import { payment } from "./src/payment/controllers";
import { admin_auth } from "./src/admin-auth/controllers";
import { events } from "./src/events/controllers";
import { locations } from "./src/locations/controllers";
import { accomodations } from "./src/accomodations/controllers";

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
    .use(supabase)
    .use(google)
    .use(auth)
    .use(payment)
    .use(admin_auth)
    .use(events)
    .use(locations)
    .use(accomodations)
    .use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
      })
    )

  app.on('start', () => {
    console.log(`Elysia Listening Port = ${import.meta.env.PORT}`)
  })

  app.listen(import.meta.env.PORT!)
}

