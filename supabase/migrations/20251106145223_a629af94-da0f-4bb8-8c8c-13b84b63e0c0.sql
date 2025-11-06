-- Update all inspection templates that have empty items arrays to include a default item matching the template name
UPDATE inspection_templates 
SET items = jsonb_build_array(
  jsonb_build_object(
    'id', EXTRACT(EPOCH FROM now())::bigint::text,
    'description', name,
    'notes', ''
  )
)
WHERE items = '[]'::jsonb OR jsonb_array_length(items) = 0;