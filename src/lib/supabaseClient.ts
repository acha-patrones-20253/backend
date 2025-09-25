import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/database.types";

export default createClient<Database>(
  import.meta.env.SUPABASE_URL!,
  import.meta.env.SUPABASE_TOKEN!
)