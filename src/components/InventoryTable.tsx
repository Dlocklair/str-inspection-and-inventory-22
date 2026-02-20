import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Trash2, Plus, Minus } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onUpdateItem: (updates: Partial<InventoryItem> & { id: string }) => void;
  onDeleteItem?: (itemId: string) => void;
  expandAll: boolean;
  collapseAll: boolean;
}
export const InventoryTable = ({
  items,
  onEditItem,
  onUpdateStock,
  onUpdateRestock,
  onUpdateItem,
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
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const isMobile = useIsMobile();

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
  
  const acceptAllChanges = () => {
    if (pendingChanges.size === 0) {
      toast.info("No changes to save");
      return;
    }

    const changedItems = new Set<string>();
    pendingChanges.forEach((change) => {
      changedItems.add(change.itemId);
    });

    changedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const stockChange = pendingChanges.get(`${itemId}-stock`);
      const restockChange = pendingChanges.get(`${itemId}-restock`);

      let newStock = item.current_quantity;
      let newRestock = item.restock_threshold;

      if (stockChange) {
        newStock = Math.max(0, stockChange.value);
        onUpdateStock(itemId, newStock);
      }
      
      if (restockChange) {
        newRestock = Math.max(0, restockChange.value);
        onUpdateRestock(itemId, newRestock);
      }

      // Update restock_requested if stock is at or below threshold
      if (newStock <= newRestock) {
        onUpdateItem({ id: itemId, restock_requested: true });
      }
    });

    setPendingChanges(new Map());
    toast.success("All changes saved successfully");
  };

  const cancelAllChanges = () => {
    if (pendingChanges.size === 0) {
      toast.info("No changes to cancel");
      return;
    }
    setPendingChanges(new Map());
    toast.info("All changes cancelled");
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
  const hasPendingChanges = pendingChanges.size > 0;

  // Mobile quick stock adjust
  const handleMobileStockAdjust = (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.current_quantity + delta);
    onUpdateStock(item.id, newQty);
    if (newQty <= item.restock_threshold) {
      onUpdateItem({ id: item.id, restock_requested: true });
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {hasPendingChanges && (
          <div className="flex gap-2">
            <Button onClick={acceptAllChanges} variant="default" className="flex-1 gap-2 inline-btn">Accept All</Button>
            <Button variant="outline" onClick={cancelAllChanges} className="flex-1 gap-2 inline-btn">Cancel All</Button>
          </div>
        )}
        {sortedCategories.map(categoryName => {
          const categoryItems = groupedItems[categoryName];
          const isExpanded = expandedCategories.has(categoryName);
          return (
            <div key={categoryName}>
              <button
                onClick={() => toggleCategory(categoryName)}
                className="flex items-center gap-2 w-full py-2 px-1 text-left"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 inline-btn" /> : <ChevronRight className="h-4 w-4 shrink-0 inline-btn" />}
                <span className="font-semibold text-primary">{categoryName}</span>
                <span className="text-xs text-muted-foreground">({categoryItems.length})</span>
              </button>
              {isExpanded && (
                <div className="space-y-2 pl-1">
                  {categoryItems.map(item => {
                    const status = getStockStatus(item);
                    const StatusIcon = status.icon;
                    const isItemExpanded = expandedMobileItem === item.id;
                    return (
                      <div key={item.id} className="border rounded-lg bg-card overflow-hidden">
                        <button
                          onClick={() => setExpandedMobileItem(isItemExpanded ? null : item.id)}
                          className="flex items-center justify-between w-full p-3 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.amazon_image_url && <img src={item.amazon_image_url} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />}
                            <span className="font-medium text-sm truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Badge variant={status.color as any} className="text-[10px] px-1.5 py-0 inline-btn">
                              <StatusIcon className="h-3 w-3 mr-0.5 inline-btn" />
                              {item.current_quantity}
                            </Badge>
                            {isItemExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground inline-btn" /> : <ChevronRight className="h-4 w-4 text-muted-foreground inline-btn" />}
                          </div>
                        </button>
                        {isItemExpanded && (
                          <div className="px-3 pb-3 space-y-3 border-t pt-3">
                            {/* Stock adjust */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Stock</span>
                              <div className="flex items-center gap-3">
                                <Button size="sm" variant="outline" className="h-9 w-9 p-0 inline-btn" onClick={() => handleMobileStockAdjust(item, -1)}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold text-lg min-w-[2ch] text-center">{formatNumber(item.current_quantity)}</span>
                                <Button size="sm" variant="outline" className="h-9 w-9 p-0 inline-btn" onClick={() => handleMobileStockAdjust(item, 1)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Restock Level</span>
                              <span className="font-medium">{formatNumber(item.restock_threshold)}</span>
                            </div>
                            {item.supplier && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Supplier</span>
                                <span className="font-medium">{item.supplier}</span>
                              </div>
                            )}
                            {item.unit && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Unit</span>
                                <span className="font-medium">{item.unit}</span>
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline" className="flex-1 inline-btn" onClick={() => { onEditItem(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                <Edit className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              {onDeleteItem && (
                                <Button size="sm" variant="outline" className="text-destructive inline-btn" onClick={() => onDeleteItem(item.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="space-y-4">
      {/* Global action buttons */}
      {hasPendingChanges && (
        <div className="flex gap-2 justify-end">
          <Button onClick={acceptAllChanges} variant="default" className="gap-2">
            Accept All Changes
          </Button>
          <Button variant="outline" onClick={cancelAllChanges} className="gap-2">
            Cancel All Changes
          </Button>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
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
                        <span className="font-semibold text-primary">{categoryName}</span>
                        <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Category Items */}
                  {isExpanded && categoryItems.map(item => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                const isEditingStockItem = editingStock === item.id;
                const isEditingRestockItem = editingRestock === item.id;
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
                            {isEditingStockItem ? (
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
                            ) : (
                              <div className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded" onClick={() => handleStockEdit(item.id, item.current_quantity)}>
                                <span className={`font-medium ${stockChange ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                  {formatNumber(displayStock)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`px-2 py-1 w-[12%] ${restockChange ? 'bg-yellow-500/20' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            {isEditingRestockItem ? (
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
                            ) : (
                              <div className="cursor-pointer hover:bg-muted/50 px-3 py-1 rounded" onClick={() => handleRestockEdit(item.id, item.restock_threshold)}>
                                <span className={`font-medium ${restockChange ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                                  {formatNumber(displayRestock)}
                                </span>
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
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    </div>
    </div>
  );
};