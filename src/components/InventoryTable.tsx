import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  expandAll: boolean;
  collapseAll: boolean;
}

export const InventoryTable = ({ items, onEditItem, onUpdateStock, expandAll, collapseAll }: InventoryTableProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<string>('');

  // Handle expand/collapse all
  useState(() => {
    if (expandAll) {
      const categories = [...new Set(items.map(item => item.category_name || 'Other'))];
      setExpandedCategories(new Set(categories));
    } else if (collapseAll) {
      setExpandedCategories(new Set());
    }
  });

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_quantity === 0) {
      return {
        label: 'Out of Stock',
        color: 'destructive',
        icon: AlertTriangle,
      };
    } else if (item.current_quantity <= item.restock_threshold) {
      return {
        label: 'Low Stock',
        color: 'warning',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'In Stock',
        color: 'success',
        icon: CheckCircle,
      };
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const parseFormattedNumber = (str: string): number => {
    return parseInt(str.replace(/,/g, ''), 10) || 0;
  };

  const handleStockEdit = (itemId: string, currentStock: number) => {
    setEditingStock(itemId);
    setStockValue(currentStock.toString());
  };

  const handleStockSave = (itemId: string) => {
    const newQty = parseFormattedNumber(stockValue);
    onUpdateStock(itemId, Math.max(0, newQty));
    setEditingStock(null);
    setStockValue('');
  };

  const handleStockKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleStockSave(itemId);
    } else if (e.key === 'Escape') {
      setEditingStock(null);
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category_name || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const sortedCategories = Object.keys(groupedItems).sort();

  return (
    <div className="space-y-2">
      {sortedCategories.map((categoryName) => {
        const categoryItems = groupedItems[categoryName];
        const isExpanded = expandedCategories.has(categoryName);

        return (
          <div key={categoryName} className="border rounded-lg overflow-hidden">
            {/* Category Header */}
            <div 
              className="flex items-center gap-2 p-2 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => toggleCategory(categoryName)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-semibold text-cyan-400">{categoryName}</span>
              <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
            </div>

            {/* Category Items */}
            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-center p-3 font-medium">Stock</th>
                      <th className="text-center p-3 font-medium">Restock Level</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Supplier</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.map((item) => {
                      const status = getStockStatus(item);
                      const StatusIcon = status.icon;
                      const isEditing = editingStock === item.id;

                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.amazon_image_url && (
                                <img
                                  src={item.amazon_image_url}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.unit && (
                                  <div className="text-sm text-muted-foreground">{item.unit}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={stockValue}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '');
                                    if (/^\d{0,4}$/.test(value)) {
                                      setStockValue(value);
                                    }
                                  }}
                                  onBlur={() => handleStockSave(item.id)}
                                  onKeyDown={(e) => handleStockKeyDown(e, item.id)}
                                  onFocus={(e) => e.target.select()}
                                  className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded"
                                  onClick={() => handleStockEdit(item.id, item.current_quantity)}
                                >
                                  <span className="font-medium">{formatNumber(item.current_quantity)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">{formatNumber(item.restock_threshold)}</td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-center">{item.supplier || '-'}</td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
