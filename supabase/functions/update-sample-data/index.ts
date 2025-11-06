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

    // Get all templates grouped by property_id
    const { data: templates } = await supabase
      .from('inspection_templates')
      .select('id, property_id')

    if (!templates || templates.length === 0) {
      throw new Error('No templates found in database')
    }

    // Get all inspection records with null template_id
    const { data: recordsWithoutTemplates } = await supabase
      .from('inspection_records')
      .select('id, property_id')
      .is('template_id', null)

    if (recordsWithoutTemplates && recordsWithoutTemplates.length > 0) {
      // Create a map of property_id to template_id
      const propertyTemplateMap = new Map()
      templates.forEach(template => {
        if (template.property_id && !propertyTemplateMap.has(template.property_id)) {
          propertyTemplateMap.set(template.property_id, template.id)
        }
      })

      // Find a fallback template (preferably one without property_id, or just the first one)
      const fallbackTemplate = templates.find(t => !t.property_id) || templates[0]

      // Update each record with appropriate template
      for (const record of recordsWithoutTemplates) {
        const templateId = record.property_id 
          ? (propertyTemplateMap.get(record.property_id) || fallbackTemplate.id)
          : fallbackTemplate.id

        const { error: updateError } = await supabase
          .from('inspection_records')
          .update({ template_id: templateId })
          .eq('id', record.id)

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError)
        }
      }
    }

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
