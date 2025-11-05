import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const elkMountainEscapeId = '79280fbd-5476-47f5-bcc0-1fada823d922'

    // Update inspection records with null property_id
    const { error: recordsError } = await supabase
      .from('inspection_records')
      .update({ property_id: elkMountainEscapeId })
      .is('property_id', null)

    if (recordsError) throw recordsError

    // Update inventory items with null property_id
    const { error: inventoryError } = await supabase
      .from('inventory_items')
      .update({ property_id: elkMountainEscapeId })
      .is('property_id', null)

    if (inventoryError) throw inventoryError

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully updated all unassigned records to Elk Mountain Escape'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
