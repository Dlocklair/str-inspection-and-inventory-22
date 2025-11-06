-- Update inspection records with null template_id
-- Assign templates based on matching property_id

UPDATE inspection_records ir
SET template_id = (
  SELECT it.id
  FROM inspection_templates it
  WHERE it.property_id = ir.property_id
  LIMIT 1
)
WHERE ir.template_id IS NULL
  AND ir.property_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM inspection_templates it2 
    WHERE it2.property_id = ir.property_id
  );

-- For any remaining records without templates, assign a default template
UPDATE inspection_records ir
SET template_id = (
  SELECT id
  FROM inspection_templates
  ORDER BY created_at
  LIMIT 1
)
WHERE ir.template_id IS NULL;