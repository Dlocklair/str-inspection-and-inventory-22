-- Add ASINs to sample inventory items for testing Amazon cart feature
UPDATE inventory_items 
SET asin = 'B08J6F2ZGF', 
    amazon_link = 'https://www.amazon.com/dp/B08J6F2ZGF',
    amazon_image_url = 'https://m.media-amazon.com/images/I/71F8YqJv6OL._AC_SL1500_.jpg',
    reorder_quantity = 10
WHERE name ILIKE '%paper towel%' AND asin IS NULL;

UPDATE inventory_items 
SET asin = 'B07FZ8S74R',
    amazon_link = 'https://www.amazon.com/dp/B07FZ8S74R',
    amazon_image_url = 'https://m.media-amazon.com/images/I/81+GAmz5CgL._AC_SL1500_.jpg',
    reorder_quantity = 12
WHERE name ILIKE '%toilet paper%' AND asin IS NULL;

UPDATE inventory_items 
SET asin = 'B08VDCYY4M',
    amazon_link = 'https://www.amazon.com/dp/B08VDCYY4M',
    amazon_image_url = 'https://m.media-amazon.com/images/I/71TN76D8YBL._AC_SL1500_.jpg',
    reorder_quantity = 6
WHERE name ILIKE '%trash bag%' AND asin IS NULL;

UPDATE inventory_items 
SET asin = 'B00OONXQW0',
    amazon_link = 'https://www.amazon.com/dp/B00OONXQW0',
    amazon_image_url = 'https://m.media-amazon.com/images/I/71iwGZQqinL._AC_SL1500_.jpg',
    reorder_quantity = 8
WHERE name ILIKE '%dish soap%' AND asin IS NULL;

UPDATE inventory_items 
SET asin = 'B07RK75VH4',
    amazon_link = 'https://www.amazon.com/dp/B07RK75VH4',
    amazon_image_url = 'https://m.media-amazon.com/images/I/81-6v75F+4L._AC_SL1500_.jpg',
    reorder_quantity = 5
WHERE name ILIKE '%hand soap%' AND asin IS NULL;