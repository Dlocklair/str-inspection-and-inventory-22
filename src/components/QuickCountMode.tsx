import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, CheckCircle, Clock, AlertTriangle, Search, ScanBarcode } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';
import { formatDistanceToNow } from 'date-fns';

interface QuickCountModeProps {
  items: InventoryItem[];
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  onMarkCounted: (itemId: string, quantity: number) => void;
  onScanBarcode: () => void;
}

export const QuickCountMode = ({ items, onUpdateStock, onMarkCounted, onScanBarcode }: QuickCountModeProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staleFilter, setStaleFilter] = useState<string>('all');
  const [countValues, setCountValues] = useState<Record<string, number>>({});
  const [countedItems, setCountedItems] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(lower) || i.barcode?.toLowerCase().includes(lower));
    }

    if (staleFilter !== 'all') {
      const days = parseInt(staleFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(i => !i.last_counted_at || new Date(i.last_counted_at) < cutoff);
    }

    return result;
  }, [items, searchTerm, staleFilter]);

  const getCountValue = (item: InventoryItem) => {
    return countValues[item.id] ?? item.current_quantity;
  };

  const setCountValue = (itemId: string, value: number) => {
    setCountValues(prev => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const handleMarkCounted = (item: InventoryItem) => {
    const qty = getCountValue(item);
    onMarkCounted(item.id, qty);
    setCountedItems(prev => new Set(prev).add(item.id));
    // Clear from pending values
    setCountValues(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.current_quantity === 0) return <Badge variant="destructive" className="text-xs">Out</Badge>;
    if (item.current_quantity <= item.restock_threshold) return <Badge variant="default" className="text-xs bg-yellow-500/80">Low</Badge>;
    return <Badge variant="secondary" className="text-xs">OK</Badge>;
  };

  const getLastCounted = (item: InventoryItem) => {
    if (!item.last_counted_at) return <span className="text-xs text-muted-foreground italic">Never counted</span>;
    const d = new Date(item.last_counted_at);
    const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    const color = daysAgo > 30 ? 'text-destructive' : daysAgo > 7 ? 'text-yellow-600' : 'text-muted-foreground';
    return <span className={`text-xs ${color}`}>{formatDistanceToNow(d, { addSuffix: true })}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items or barcodes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={onScanBarcode} className="gap-2">
          <ScanBarcode className="h-4 w-4" />
          Scan
        </Button>
        <Select value={staleFilter} onValueChange={setStaleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stale filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="3">Not counted in 3 days</SelectItem>
            <SelectItem value="7">Not counted in 7 days</SelectItem>
            <SelectItem value="14">Not counted in 14 days</SelectItem>
            <SelectItem value="30">Not counted in 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>{countedItems.size} of {filteredItems.length} counted this session</span>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No items match your filters.</p>
        )}
        {filteredItems.map(item => {
          const justCounted = countedItems.has(item.id);
          const currentCount = getCountValue(item);
          const hasChange = countValues[item.id] !== undefined && countValues[item.id] !== item.current_quantity;

          return (
            <Card key={item.id} className={`transition-colors ${justCounted ? 'border-green-500/50 bg-green-500/5' : ''}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Item info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {(item.image_url || item.amazon_image_url) && (
                      <img
                        src={item.image_url || item.amazon_image_url!}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        {getStockBadge(item)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        {getLastCounted(item)}
                      </div>
                    </div>
                  </div>

                  {/* Count stepper */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 p-0 inline-btn"
                        onClick={() => setCountValue(item.id, currentCount - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={currentCount}
                        onChange={e => setCountValue(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-10 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={0}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 p-0 inline-btn"
                        onClick={() => setCountValue(item.id, currentCount + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant={justCounted ? 'secondary' : hasChange ? 'default' : 'outline'}
                      className="gap-1 ml-2 whitespace-nowrap inline-btn"
                      onClick={() => handleMarkCounted(item)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {justCounted ? 'Counted' : 'Mark Counted'}
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
