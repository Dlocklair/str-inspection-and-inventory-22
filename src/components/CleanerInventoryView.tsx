import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';
import { PropertySelector } from './PropertySelector';
import { usePropertyContext } from '@/contexts/PropertyContext';

interface CleanerInventoryViewProps {
  items: InventoryItem[];
  isLoading: boolean;
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  onUpdateItem: (updates: Partial<InventoryItem> & { id: string }) => void;
}

export const CleanerInventoryView = ({ items, isLoading, onUpdateStock, onUpdateItem }: CleanerInventoryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedProperty } = usePropertyContext();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !selectedProperty || item.property_id === selectedProperty.id;
    return matchesSearch && matchesProperty;
  });

  const handleStockAdjust = (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.current_quantity + delta);
    onUpdateStock(item.id, newQty);
    if (newQty <= item.restock_threshold) {
      onUpdateItem({ id: item.id, restock_requested: true });
    }
  };

  const getStatusInfo = (item: InventoryItem) => {
    if (item.current_quantity === 0) return { label: 'Out', variant: 'destructive' as const, Icon: AlertTriangle };
    if (item.current_quantity <= item.restock_threshold) return { label: 'Low', variant: 'default' as const, Icon: AlertTriangle };
    return { label: 'OK', variant: 'secondary' as const, Icon: CheckCircle };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <PropertySelector />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No items found.</p>
        )}
        {filteredItems.map(item => {
          const status = getStatusInfo(item);
          return (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {(item.image_url || item.amazon_image_url) && (
                      <img
                        src={item.image_url || item.amazon_image_url!}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        <Badge variant={status.variant} className="text-[10px] shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Restock at {item.restock_threshold} {item.unit || 'units'}
                      </div>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 inline-btn"
                      onClick={() => handleStockAdjust(item, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg min-w-[2.5ch] text-center">{item.current_quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 p-0 inline-btn"
                      onClick={() => handleStockAdjust(item, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
