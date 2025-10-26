// Helper to extract ASIN from Amazon URLs or direct ASIN input
export function extractAsin(input?: string | null): string | null {
  if (!input) return null;
  
  // Match ASIN patterns in URLs: /dp/ASIN or /gp/product/ASIN
  const urlMatch = input.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/);
  if (urlMatch) return urlMatch[1];
  
  // Match standalone 10-character ASIN (uppercase letters/numbers)
  const asinMatch = input.match(/\b([A-Z0-9]{10})\b/);
  if (asinMatch) return asinMatch[1];
  
  return null;
}
