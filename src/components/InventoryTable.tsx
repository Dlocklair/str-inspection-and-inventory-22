import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  onUpdateRestock: (itemId: string, newThreshold: number) => void;
  expandAll: boolean;
  collapseAll: boolean;
}

export const InventoryTable = ({ items, onEditItem, onUpdateStock, onUpdateRestock, expandAll, collapseAll }: InventoryTableProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<string>('');
  const [editingRestock, setEditingRestock] = useState<string | null>(null);
  const [restockValue, setRestockValue] = useState<string>('');

  // Handle expand/collapse all
  useEffect(() => {
    if (expandAll) {
      const categories = [...new Set(items.map(item => item.category_name || 'Other'))];
      setExpandedCategories(new Set(categories));
    }
  }, [expandAll, items]);

  useEffect(() => {
    if (collapseAll) {
      setExpandedCategories(new Set());
    }
  }, [collapseAll]);

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

  const handleRestockEdit = (itemId: string, currentRestock: number) => {
    setEditingRestock(itemId);
    setRestockValue(currentRestock.toString());
  };

  const handleRestockSave = (item: InventoryItem) => {
    const newThreshold = parseFormattedNumber(restockValue);
    onUpdateRestock(item.id, Math.max(0, newThreshold));
    setEditingRestock(null);
    setRestockValue('');
  };

  const handleRestockKeyDown = (e: React.KeyboardEvent, item: InventoryItem) => {
    if (e.key === 'Enter') {
      handleRestockSave(item);
    } else if (e.key === 'Escape') {
      setEditingRestock(null);
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
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed Table Headers */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/30 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium w-[35%]">Item</th>
              <th className="text-center p-2 font-medium w-[12%]">Stock</th>
              <th className="text-center p-2 font-medium w-[15%]">Restock Level</th>
              <th className="text-center p-2 font-medium w-[15%]">Status</th>
              <th className="text-center p-2 font-medium w-[15%]">Supplier</th>
              <th className="text-center p-2 font-medium w-[8%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((categoryName) => {
              const categoryItems = groupedItems[categoryName];
              const isExpanded = expandedCategories.has(categoryName);

              return (
                <>
                  {/* Category Header Row */}
                  <tr key={categoryName} className="bg-muted/50 hover:bg-muted/70 cursor-pointer">
                    <td 
                      colSpan={6} 
                      className="p-2"
                      onClick={() => toggleCategory(categoryName)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold text-cyan-400">{categoryName}</span>
                        <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Category Items */}
                  {isExpanded && categoryItems.map((item) => {
                    const status = getStockStatus(item);
                    const StatusIcon = status.icon;
                    const isEditing = editingStock === item.id;

                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 w-[35%]">
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
                        <td className="p-2 w-[12%]">
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
                        <td className="p-2 w-[15%]">
                          <div className="flex justify-center">
                            {editingRestock === item.id ? (
                              <Input
                                type="text"
                                value={restockValue}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/,/g, '');
                                  if (/^\d{0,4}$/.test(value)) {
                                    setRestockValue(value);
                                  }
                                }}
                                onBlur={() => handleRestockSave(item)}
                                onKeyDown={(e) => handleRestockKeyDown(e, item)}
                                onFocus={(e) => e.target.select()}
                                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded"
                                onClick={() => handleRestockEdit(item.id, item.restock_threshold)}
                              >
                                <span className="font-medium">{formatNumber(item.restock_threshold)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 w-[15%]">
                          <div className="flex justify-center">
                            <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2 text-center w-[15%]">{item.supplier || '-'}</td>
                        <td className="p-2 w-[8%]">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                onEditItem(item);
                                // Scroll to top of page
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
