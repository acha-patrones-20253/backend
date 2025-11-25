import Elysia from "elysia";
import AdminAuthMidd from "../middleware/AdminAuthMidd";

export const supabase = new Elysia({
  prefix: '/supabase'
})
  .all("*", ({ request, params, set, headers }) => {
    const path = params['*']
    const proxyUrl = new URL(path, import.meta.env.SUPABASE_URL);

    const originalUrl = new URL(request.url);
    proxyUrl.search = originalUrl.search;


    const proxyHeaders = {
      ...headers,
      'apikey': import.meta.env.SUPABASE_TOKEN!,
      'authorization': `Bearer ${import.meta.env.SUPABASE_TOKEN!}`,
      'host': proxyUrl.host,
      'accept-encoding': 'identity'
    };

    return fetch(proxyUrl.href, {
      method: request.method,
      headers: proxyHeaders,
      body: request.body
    })

  }, {
    beforeHandle: AdminAuthMidd
  })