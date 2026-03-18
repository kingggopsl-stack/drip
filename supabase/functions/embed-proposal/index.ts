// supabase/functions/embed-proposal/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ""

serve(async (req) => {
  const { proposal_id, content } = await req.json()

  // 1. Get embedding from OpenAI
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: content,
      model: "text-embedding-3-small", // or text-embedding-ada-002
    }),
  })

  const { data } = await response.json()
  const embedding = data[0].embedding

  // 2. Update proposal record
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await supabase
    .from("proposals")
    .update({ embedding })
    .eq("id", proposal_id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
