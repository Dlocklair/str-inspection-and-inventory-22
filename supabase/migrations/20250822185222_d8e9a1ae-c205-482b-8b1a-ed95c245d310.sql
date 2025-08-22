-- Insert default inspection types
INSERT INTO public.inspection_types (name, frequency_days, is_custom) VALUES
  ('Per Visit', NULL, false),
  ('Monthly', 30, false),
  ('Quarterly', 90, false),
  ('Yearly', 365, false)
ON CONFLICT DO NOTHING;

-- Insert predefined inventory categories
INSERT INTO public.inventory_categories (name, description, is_predefined) VALUES
  ('Toiletries', 'Bathroom and hygiene supplies', true),
  ('Linen', 'Towels, sheets, and fabric items', true),
  ('Consumables', 'Food, beverages, and disposable items', true),
  ('Batteries', 'Various battery types', true),
  ('Stock Items', 'Replacement items and supplies', true)
ON CONFLICT DO NOTHING;

-- Insert predefined inventory items
DO $$
DECLARE
    toiletries_id UUID;
    linen_id UUID;
    consumables_id UUID;
    batteries_id UUID;
    stock_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO toiletries_id FROM public.inventory_categories WHERE name = 'Toiletries';
    SELECT id INTO linen_id FROM public.inventory_categories WHERE name = 'Linen';
    SELECT id INTO consumables_id FROM public.inventory_categories WHERE name = 'Consumables';
    SELECT id INTO batteries_id FROM public.inventory_categories WHERE name = 'Batteries';
    SELECT id INTO stock_id FROM public.inventory_categories WHERE name = 'Stock Items';

    -- Insert toiletries items
    INSERT INTO public.inventory_items (category_id, name, description, restock_threshold, reorder_quantity) VALUES
        (toiletries_id, 'Paper towels', 'Kitchen and bathroom paper towels', 5, 10),
        (toiletries_id, 'Toilet paper', 'Bathroom tissue', 8, 12),
        (toiletries_id, 'Kleenex', 'Facial tissues', 3, 6),
        (toiletries_id, 'Cotton balls', 'Cotton balls for makeup removal', 2, 4),
        (toiletries_id, 'Q-tips', 'Cotton swabs', 1, 3)
    ON CONFLICT DO NOTHING;

    -- Insert linen items
    INSERT INTO public.inventory_items (category_id, name, description, restock_threshold, reorder_quantity) VALUES
        (linen_id, 'Bath towels', 'Large bath towels', 4, 6),
        (linen_id, 'Hand towels', 'Medium hand towels', 4, 6),
        (linen_id, 'Wash cloths', 'Small wash cloths', 6, 10),
        (linen_id, 'Bath mat', 'Non-slip bath mats', 2, 3),
        (linen_id, 'Makeup removal towels', 'Dark colored towels for makeup', 3, 5),
        (linen_id, 'Pillow cases', 'Standard pillow cases', 4, 8),
        (linen_id, 'Fitted sheets - King', 'King size fitted sheets', 2, 4),
        (linen_id, 'Fitted sheets - Queen', 'Queen size fitted sheets', 2, 4),
        (linen_id, 'Sheets - King', 'King size flat sheets', 2, 4),
        (linen_id, 'Sheets - Queen', 'Queen size flat sheets', 2, 4)
    ON CONFLICT DO NOTHING;

    -- Insert consumables
    INSERT INTO public.inventory_items (category_id, name, description, restock_threshold, reorder_quantity) VALUES
        (consumables_id, 'Coffee', 'Ground coffee or pods', 2, 5),
        (consumables_id, 'Tea', 'Tea bags assortment', 1, 3),
        (consumables_id, 'Sugar', 'Granulated sugar packets', 3, 6),
        (consumables_id, 'Creamer', 'Coffee creamer', 2, 4),
        (consumables_id, 'Salt', 'Table salt', 1, 2),
        (consumables_id, 'Pepper', 'Black pepper', 1, 2),
        (consumables_id, 'Spray Pam', 'Cooking spray', 1, 3),
        (consumables_id, 'Popcorn', 'Microwave popcorn', 2, 5),
        (consumables_id, 'Brochures', 'Local area brochures', 5, 10),
        (consumables_id, 'Dishwashing pods', 'Dishwasher detergent pods', 1, 3),
        (consumables_id, 'Laundry pods', 'Laundry detergent pods', 1, 3),
        (consumables_id, 'Dish washing liquid soap', 'Hand dish soap', 1, 3),
        (consumables_id, 'Hand foaming soap', 'Bathroom hand soap', 2, 4),
        (consumables_id, 'Sponges', 'Kitchen cleaning sponges', 3, 6),
        (consumables_id, 'Shower Shampoo', 'Travel size shampoo', 3, 6),
        (consumables_id, 'Shower Soap', 'Travel size body wash', 3, 6),
        (consumables_id, 'Shower Conditioner', 'Travel size conditioner', 3, 6),
        (consumables_id, 'Pledge', 'Furniture polish', 1, 2),
        (consumables_id, 'Fantastic', 'All-purpose cleaner', 1, 3)
    ON CONFLICT DO NOTHING;

    -- Insert batteries
    INSERT INTO public.inventory_items (category_id, name, description, restock_threshold, reorder_quantity) VALUES
        (batteries_id, 'AA Batteries', 'Double A batteries', 4, 8),
        (batteries_id, 'AAA Batteries', 'Triple A batteries', 4, 8),
        (batteries_id, '9V Batteries', '9 volt batteries', 2, 4)
    ON CONFLICT DO NOTHING;

    -- Insert stock items
    INSERT INTO public.inventory_items (category_id, name, description, restock_threshold, reorder_quantity) VALUES
        (stock_id, 'Light bulbs - 60 watt', 'Standard 60W light bulbs', 3, 6),
        (stock_id, 'Light bulbs - Candelabras', 'Candelabra base bulbs', 2, 4),
        (stock_id, 'Light bulbs - Outdoor coil', 'Outdoor decorative coil bulbs', 2, 4)
    ON CONFLICT DO NOTHING;
END $$;