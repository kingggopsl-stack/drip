// supabase/functions/update-job-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""

serve(async (req) => {
  const { job_id, status, error_message, result } = await req.json()

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  const updatePayload: any = { status, updated_at: new Date().toISOString() }
  if (error_message) updatePayload.error_message = error_message
  if (result) {
    if (status === 'researching') updatePayload.research_result = result
    if (status === 'synthesizing') updatePayload.synthesis_result = result
    if (status === 'done') updatePayload.final_proposal = result
  }

  const { data, error } = await supabase
    .from("generation_jobs")
    .update(updatePayload)
    .eq("id", job_id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
