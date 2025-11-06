import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/hooks/useInventory';
import { ShoppingCart, Package, ExternalLink, CheckCircle } from 'lucide-react';
import { buildAmazonCartUrl } from '@/lib/amazonCart';

interface RestockRequestsManagerProps {
  items: InventoryItem[];
  onUpdateItem: (updates: Partial<InventoryItem> & { id: string }) => void;
}

export const RestockRequestsManager = ({ items, onUpdateItem }: RestockRequestsManagerProps) => {
  const { toast } = useToast();
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

  // Items that need restocking (low or out of stock)
  const restockItems = items.filter(item => 
    item.current_quantity <= item.restock_threshold
  );

  // Group by ASIN availability
  const itemsWithAsin = restockItems.filter(item => item.asin);
  const itemsWithoutAsin = restockItems.filter(item => !item.asin);

  const handleReceiveItem = (item: InventoryItem) => {
    const receivedQty = receivedQuantities[item.id] || item.reorder_quantity || 0;
    
    if (receivedQty <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than 0',
        variant: 'destructive',
      });
      return;
    }

    onUpdateItem({
      id: item.id,
      current_quantity: item.current_quantity + receivedQty,
      restock_requested: false,
    });

    // Clear the input
    setReceivedQuantities(prev => {
      const newState = { ...prev };
      delete newState[item.id];
      return newState;
    });

    toast({
      title: 'Item Received',
      description: `${item.name}: Added ${receivedQty} to stock`,
    });
  };

  const handleOpenAmazonCart = () => {
    const cartItems = itemsWithAsin.map(item => ({
      asin: item.asin!,
      quantity: receivedQuantities[item.id] || item.reorder_quantity || 1,
    }));

    const cartUrl = buildAmazonCartUrl(cartItems);
    window.open(cartUrl, '_blank');

    toast({
      title: 'Amazon Cart Opened',
      description: `${cartItems.length} items added to cart`,
    });
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.current_quantity === 0) return 'destructive';
    if (item.current_quantity <= item.restock_threshold) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Amazon Items Section */}
      {itemsWithAsin.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Amazon Items ({itemsWithAsin.length})
              </CardTitle>
              <Button onClick={handleOpenAmazonCart} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Open Amazon Cart
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itemsWithAsin.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.amazon_image_url && (
                    <img
                      src={item.amazon_image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant={getStockStatusColor(item)}>
                        {item.current_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current: {item.current_quantity} | Threshold: {item.restock_threshold} | Suggested Order: {item.reorder_quantity || 10}
                    </div>
                    {item.amazon_link && (
                      <a
                        href={item.amazon_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View on Amazon <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={receivedQuantities[item.id] ?? item.reorder_quantity ?? ''}
                      onChange={(e) => setReceivedQuantities(prev => ({
                        ...prev,
                        [item.id]: parseInt(e.target.value) || 0
                      }))}
                      className="w-24"
                    />
                    <Button
                      onClick={() => handleReceiveItem(item)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Receive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Order Items Section */}
      {itemsWithoutAsin.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manual Order Items ({itemsWithoutAsin.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itemsWithoutAsin.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant={getStockStatusColor(item)}>
                        {item.current_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current: {item.current_quantity} | Threshold: {item.restock_threshold} | Suggested Order: {item.reorder_quantity || 10}
                    </div>
                    {item.supplier && (
                      <div className="text-sm">
                        Supplier: <span className="font-medium">{item.supplier}</span>
                      </div>
                    )}
                    {item.reorder_link && (
                      <a
                        href={item.reorder_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Order Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={receivedQuantities[item.id] ?? item.reorder_quantity ?? ''}
                      onChange={(e) => setReceivedQuantities(prev => ({
                        ...prev,
                        [item.id]: parseInt(e.target.value) || 0
                      }))}
                      className="w-24"
                    />
                    <Button
                      onClick={() => handleReceiveItem(item)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Receive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {restockItems.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>All items are stocked above threshold levels</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
