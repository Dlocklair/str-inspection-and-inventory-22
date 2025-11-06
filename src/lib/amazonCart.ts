/**
 * Build an Amazon cart URL with multiple items
 * @param items Array of items with ASIN and quantity
 * @returns Amazon cart URL
 */
export function buildAmazonCartUrl(items: Array<{ asin: string; quantity: number }>): string {
  const baseUrl = 'https://www.amazon.com/gp/aws/cart/add.html';
  
  const params = items.map((item, index) => {
    const position = index + 1;
    return `ASIN.${position}=${item.asin}&Quantity.${position}=${item.quantity}`;
  }).join('&');
  
  return `${baseUrl}?${params}`;
}
