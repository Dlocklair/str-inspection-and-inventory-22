import { InventoryItem } from "@/hooks/useInventory";

export interface AmazonBusinessCSVRow {
  ASIN: string;
  'Merchant ID': string;
  'Quantity': number;
  'Unit Price': string;
  'Product Name': string;
  'Notes': string;
}

/**
 * Export inventory items to Amazon Business CSV format
 * @param items Array of inventory items with ASIN
 * @param propertyName Optional property name for notes
 */
export function exportToAmazonBusinessCSV(
  items: InventoryItem[], 
  propertyName?: string
): void {
  // Filter items with ASIN
  const itemsWithAsin = items.filter(item => item.asin);
  
  if (itemsWithAsin.length === 0) {
    console.warn('No items with ASIN to export');
    return;
  }

  // Build CSV content
  const headers = ['ASIN', 'Merchant ID', 'Quantity', 'Unit Price', 'Product Name', 'Notes'];
  const csvRows: string[] = [headers.join(',')];

  itemsWithAsin.forEach(item => {
    const quantity = item.reorder_quantity || 1;
    const unitPrice = item.cost_per_package?.toString() || '';
    const productName = `"${item.amazon_title || item.name}"`;
    const notes = `"${propertyName ? `Property: ${propertyName} | ` : ''}${item.description || ''}"`;
    
    csvRows.push([
      item.asin,
      '', // Merchant ID (leave empty for default)
      quantity.toString(),
      unitPrice,
      productName,
      notes
    ].join(','));
  });

  const csvContent = csvRows.join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = propertyName 
    ? `amazon-order-${propertyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    : `amazon-order-${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
