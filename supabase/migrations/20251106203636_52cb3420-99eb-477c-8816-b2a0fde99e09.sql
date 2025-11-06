-- Fix the foreign key constraint for category_id
ALTER TABLE inventory_items 
ADD CONSTRAINT fk_inventory_items_category 
FOREIGN KEY (category_id) 
REFERENCES inventory_categories(id) 
ON DELETE RESTRICT;

-- Update sample data with units and cost information
UPDATE inventory_items
SET 
  units_per_package = 12,
  unit = 'rolls',
  cost_per_package = 18.99
WHERE name = 'Toilet Paper';

UPDATE inventory_items
SET 
  units_per_package = 6,
  unit = 'bottles',
  cost_per_package = 24.99
WHERE name = 'Cleaning Solution';

UPDATE inventory_items
SET 
  units_per_package = 24,
  unit = 'bars',
  cost_per_package = 12.49
WHERE name = 'Hand Soap';

UPDATE inventory_items
SET 
  units_per_package = 12,
  unit = 'rolls',
  cost_per_package = 15.99
WHERE name = 'Paper Towels';

UPDATE inventory_items
SET 
  units_per_package = 4,
  unit = 'bottles',
  cost_per_package = 19.99
WHERE name = 'Dish Soap';

UPDATE inventory_items
SET 
  units_per_package = 6,
  unit = 'bottles',
  cost_per_package = 32.99
WHERE name = 'Laundry Detergent';