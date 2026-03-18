// supabase/functions/search-similar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ""

serve(async (req) => {
  const { briefing_text, threshold = 0.5, limit = 5 } = await req.json()

  // 1. Get embedding for the briefing
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: briefing_text,
      model: "text-embedding-3-small", 
    }),
  })

  const { data: embeddingData } = await embeddingResponse.json()
  const queryEmbedding = embeddingData[0].embedding

  // 2. Call RPC function search_similar_proposals
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.rpc("search_similar_proposals", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data), { status: 200 })
})
