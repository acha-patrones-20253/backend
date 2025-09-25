import Elysia from "elysia";

export const supabase = new Elysia({
  prefix: '/supabase'
})
.all("*", ({request, params, set}) => {
  const path = params['*']
  const proxyUrl = new URL(path, import.meta.env.SUPABASE_URL);

  const originalUrl = new URL(request.url);
  proxyUrl.search = originalUrl.search;

  return fetch(proxyUrl.href, {
    method: request.method,
    headers: {
      ...request.headers,
      'apiKey': import.meta.env.SUPABASE_TOKEN!,
      'Authorization': `Bearer ${import.meta.env.SUPABASE_TOKEN!}`
    },
    body: request.body
  })
  
})