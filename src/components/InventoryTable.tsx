import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Trash2, Check, X } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';

interface PendingChange {
  itemId: string;
  type: 'stock' | 'restock';
  value: number;
  originalValue: number;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  onUpdateStock: (itemId: string, newQuantity: number) => void;
  onUpdateRestock: (itemId: string, newThreshold: number) => void;
  onDeleteItem?: (itemId: string) => void;
  expandAll: boolean;
  collapseAll: boolean;
}
export const InventoryTable = ({
  items,
  onEditItem,
  onUpdateStock,
  onUpdateRestock,
  onDeleteItem,
  expandAll,
  collapseAll
}: InventoryTableProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<string>('');
  const [editingRestock, setEditingRestock] = useState<string | null>(null);
  const [restockValue, setRestockValue] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [restockRequired, setRestockRequired] = useState<Map<string, boolean>>(new Map());

  // Initialize restock required state based on stock levels
  useEffect(() => {
    const initialRestockMap = new Map<string, boolean>();
    items.forEach(item => {
      initialRestockMap.set(item.id, item.current_quantity <= item.restock_threshold);
    });
    setRestockRequired(initialRestockMap);
  }, [items]);

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
        icon: AlertTriangle
      };
    } else if (item.current_quantity <= item.restock_threshold) {
      return {
        label: 'Low Stock',
        color: 'warning',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'In Stock',
        color: 'success',
        icon: CheckCircle
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
  
  const handleStockChange = (itemId: string, currentStock: number) => {
    const newQty = parseFormattedNumber(stockValue);
    if (newQty !== currentStock) {
      setPendingChanges(prev => {
        const updated = new Map(prev);
        updated.set(`${itemId}-stock`, {
          itemId,
          type: 'stock',
          value: newQty,
          originalValue: currentStock
        });
        return updated;
      });
    }
    setEditingStock(null);
    setStockValue('');
  };
  
  const handleStockAccept = (itemId: string) => {
    const change = pendingChanges.get(`${itemId}-stock`);
    if (change) {
      onUpdateStock(itemId, Math.max(0, change.value));
      setPendingChanges(prev => {
        const updated = new Map(prev);
        updated.delete(`${itemId}-stock`);
        return updated;
      });
    }
  };
  
  const handleStockCancel = (itemId: string) => {
    setPendingChanges(prev => {
      const updated = new Map(prev);
      updated.delete(`${itemId}-stock`);
      return updated;
    });
  };

  const handleStockKeyDown = (e: React.KeyboardEvent, itemId: string, currentStock: number) => {
    if (e.key === 'Enter') {
      handleStockChange(itemId, currentStock);
    } else if (e.key === 'Escape') {
      setEditingStock(null);
      setStockValue('');
    }
  };
  
  const handleRestockEdit = (itemId: string, currentRestock: number) => {
    setEditingRestock(itemId);
    setRestockValue(currentRestock.toString());
  };
  
  const handleRestockChange = (itemId: string, currentRestock: number) => {
    const newThreshold = parseFormattedNumber(restockValue);
    if (newThreshold !== currentRestock) {
      setPendingChanges(prev => {
        const updated = new Map(prev);
        updated.set(`${itemId}-restock`, {
          itemId,
          type: 'restock',
          value: newThreshold,
          originalValue: currentRestock
        });
        return updated;
      });
    }
    setEditingRestock(null);
    setRestockValue('');
  };
  
  const handleRestockAccept = (itemId: string) => {
    const change = pendingChanges.get(`${itemId}-restock`);
    if (change) {
      onUpdateRestock(itemId, Math.max(0, change.value));
      setPendingChanges(prev => {
        const updated = new Map(prev);
        updated.delete(`${itemId}-restock`);
        return updated;
      });
    }
  };
  
  const handleRestockCancel = (itemId: string) => {
    setPendingChanges(prev => {
      const updated = new Map(prev);
      updated.delete(`${itemId}-restock`);
      return updated;
    });
  };

  const handleRestockKeyDown = (e: React.KeyboardEvent, itemId: string, currentRestock: number) => {
    if (e.key === 'Enter') {
      handleRestockChange(itemId, currentRestock);
    } else if (e.key === 'Escape') {
      setEditingRestock(null);
      setRestockValue('');
    }
  };
  
  const handleRestockRequiredToggle = (item: InventoryItem, checked: boolean) => {
    setRestockRequired(prev => {
      const updated = new Map(prev);
      updated.set(item.id, checked);
      return updated;
    });
    
    // If manually checked, adjust stock to equal restock level
    if (checked && item.current_quantity > item.restock_threshold) {
      onUpdateStock(item.id, item.restock_threshold);
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
  return <div className="border rounded-lg overflow-hidden">
      {/* Fixed Table Headers */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/30 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium w-[30%]">Item</th>
              <th className="text-center p-2 font-medium w-[10%]">Stock</th>
              <th className="text-center p-2 font-medium w-[12%]">Restock Level</th>
              <th className="text-center p-2 font-medium w-[10%]">Restock Required</th>
              <th className="text-center p-2 font-medium w-[12%]">Status</th>
              <th className="text-center p-2 font-medium w-[12%]">Supplier</th>
              <th className="text-center p-2 font-medium w-[14%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map(categoryName => {
            const categoryItems = groupedItems[categoryName];
            const isExpanded = expandedCategories.has(categoryName);
            return <>
                  {/* Category Header Row */}
                  <tr key={categoryName} className="bg-muted/50 hover:bg-muted/70 cursor-pointer">
                    <td colSpan={7} onClick={() => toggleCategory(categoryName)} className="p-2 py-[4px]">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-semibold text-cyan-400">{categoryName}</span>
                        <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Category Items */}
                  {isExpanded && categoryItems.map(item => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                const isEditingStock = editingStock === item.id;
                const isEditingRestock = editingRestock === item.id;
                const stockChange = pendingChanges.get(`${item.id}-stock`);
                const restockChange = pendingChanges.get(`${item.id}-restock`);
                const displayStock = stockChange ? stockChange.value : item.current_quantity;
                const displayRestock = restockChange ? restockChange.value : item.restock_threshold;
                const isRestockRequired = restockRequired.get(item.id) ?? (item.current_quantity <= item.restock_threshold);
                
                return <tr key={item.id} className="border-b hover:bg-muted/30">
                        <td className="px-2 py-1 w-[30%]">
                          <div className="flex items-center gap-3">
                            {item.amazon_image_url && <img src={item.amazon_image_url} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                            <div>
                              <div className="font-medium py-0 my-0 px-0 mx-[40px]">{item.name}</div>
                              {item.unit && <div className="text-sm text-muted-foreground">{item.unit}</div>}
                            </div>
                          </div>
                        </td>
                        <td className={`px-2 py-1 w-[10%] ${stockChange ? 'bg-yellow-500/20' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            {isEditingStock ? (
                              <Input 
                                type="text" 
                                value={stockValue} 
                                onChange={e => {
                                  const value = e.target.value.replace(/,/g, '');
                                  if (/^\d{0,4}$/.test(value)) {
                                    setStockValue(value);
                                  }
                                }} 
                                onBlur={() => handleStockChange(item.id, item.current_quantity)} 
                                onKeyDown={e => handleStockKeyDown(e, item.id, item.current_quantity)} 
                                onFocus={e => e.target.select()} 
                                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                autoFocus 
                              />
                            ) : stockChange ? (
                              <>
                                <div className="font-medium text-yellow-600 dark:text-yellow-400">{formatNumber(displayStock)}</div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleStockAccept(item.id)} className="h-6 w-6 p-0">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleStockCancel(item.id)} className="h-6 w-6 p-0">
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded" onClick={() => handleStockEdit(item.id, item.current_quantity)}>
                                <span className="font-medium">{formatNumber(item.current_quantity)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`px-2 py-1 w-[12%] ${restockChange ? 'bg-yellow-500/20' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            {isEditingRestock ? (
                              <Input 
                                type="text" 
                                value={restockValue} 
                                onChange={e => {
                                  const value = e.target.value.replace(/,/g, '');
                                  if (/^\d{0,4}$/.test(value)) {
                                    setRestockValue(value);
                                  }
                                }} 
                                onBlur={() => handleRestockChange(item.id, item.restock_threshold)} 
                                onKeyDown={e => handleRestockKeyDown(e, item.id, item.restock_threshold)} 
                                onFocus={e => e.target.select()} 
                                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                autoFocus 
                              />
                            ) : restockChange ? (
                              <>
                                <div className="font-medium text-yellow-600 dark:text-yellow-400">{formatNumber(displayRestock)}</div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleRestockAccept(item.id)} className="h-6 w-6 p-0">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleRestockCancel(item.id)} className="h-6 w-6 p-0">
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded" onClick={() => handleRestockEdit(item.id, item.restock_threshold)}>
                                <span className="font-medium">{formatNumber(item.restock_threshold)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1 w-[10%]">
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={isRestockRequired}
                              onCheckedChange={(checked) => handleRestockRequiredToggle(item, checked as boolean)}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-1 w-[12%]">
                          <div className="flex justify-center">
                            <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-2 py-1 text-center w-[12%]">{item.supplier || '-'}</td>
                        <td className="px-2 py-1 w-[14%]">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                        onEditItem(item);
                        // Scroll to top of page
                        window.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                      }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {onDeleteItem && <Button size="sm" variant="ghost" onClick={() => onDeleteItem(item.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>}
                          </div>
                        </td>
                      </tr>;
              })}
                </>;
          })}
          </tbody>
        </table>
      </div>
    </div>;
};