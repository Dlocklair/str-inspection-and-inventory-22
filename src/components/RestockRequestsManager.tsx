import { InventoryItem } from "@/hooks/useInventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToAmazonBusinessCSV } from "@/lib/csvExport";
import { ExternalLink, Package, FileDown, Copy, CheckCircle2, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface RestockRequestsManagerProps {
  items: InventoryItem[];
  onUpdateItem: (updates: Partial<InventoryItem> & { id: string }) => void;
}

type ItemStatus = 'pending' | 'ordered' | 'received';

export default function RestockRequestsManager({ items, onUpdateItem }: RestockRequestsManagerProps) {
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});

  const restockItems = items.filter(item => 
    item.restock_requested || item.current_quantity <= item.restock_threshold
  );

  // Group items by property
  const groupedByProperty = useMemo(() => {
    const groups: Record<string, { property: any; items: InventoryItem[] }> = {};
    
    restockItems.forEach(item => {
      const key = item.property_id || 'unassigned';
      if (!groups[key]) {
        groups[key] = {
          property: item.property_id ? { 
            id: item.property_id, 
            name: 'Property' // You may want to fetch actual property names
          } : null,
          items: []
        };
      }
      groups[key].items.push(item);
    });
    
    return groups;
  }, [restockItems]);

  const selectedItemsData = useMemo(() => 
    restockItems.filter(item => selectedItems.has(item.id)),
    [restockItems, selectedItems]
  );

  const handleStatusChange = (itemId: string, status: ItemStatus) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: status
    }));

    if (status === 'received') {
      const item = restockItems.find(i => i.id === itemId);
      if (!item) return;
      
      const qty = receivedQuantities[itemId] || item.reorder_quantity || 1;
      onUpdateItem({
        id: itemId,
        current_quantity: item.current_quantity + qty,
        restock_requested: false,
      });

      setReceivedQuantities(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });

      toast.success(`Received ${qty} units`);
    } else {
      toast.success(`Status updated to ${status}`);
    }
  };

  const handleSelectAll = (propertyItems: InventoryItem[]) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      propertyItems.forEach(item => next.add(item.id));
      return next;
    });
  };

  const handleDeselectAll = (propertyItems: InventoryItem[]) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      propertyItems.forEach(item => next.delete(item.id));
      return next;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleEmailRestockRequests = () => {
    const emailBody = restockItems.map(item => {
      const status = itemStatuses[item.id] || 'pending';
      return `${item.name}
- Current Stock: ${item.current_quantity}
- Restock Level: ${item.restock_threshold}
- Suggested Order: ${item.reorder_quantity || 1}
- Supplier: ${item.supplier || 'N/A'}
- Status: ${status.toUpperCase()}
`;
    }).join('\n');

    const subject = encodeURIComponent('Restock Requests');
    const body = encodeURIComponent(`Hi,\n\nPlease find the restock requests below:\n\n${emailBody}\n\nThank you.`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success("Email draft opened");
  };

  const handleExportPropertyCSV = (propertyItems: InventoryItem[], propertyName?: string) => {
    const itemsWithAsin = propertyItems.filter(item => item.asin);
    if (itemsWithAsin.length === 0) {
      toast.error("No items with ASIN to export");
      return;
    }
    exportToAmazonBusinessCSV(itemsWithAsin, propertyName);
    toast.success(`Exported ${itemsWithAsin.length} items to CSV`);
  };

  const handleCopyAsin = (asin: string) => {
    navigator.clipboard.writeText(asin);
    toast.success("ASIN copied to clipboard");
  };

  const formatUnitDisplay = (item: InventoryItem, quantity: number) => {
    if (item.units_per_package && item.unit) {
      return `${quantity} packages (${item.units_per_package} ${item.unit} each)`;
    }
    return `${quantity} ${item.unit || 'units'}`;
  };

  const calculateItemCost = (item: InventoryItem, quantity: number) => {
    if (item.cost_per_package) {
      return quantity * Number(item.cost_per_package);
    }
    return null;
  };

  const getStockStatusColor = (currentQty: number, threshold: number) => {
    if (currentQty === 0) return "destructive";
    if (currentQty <= threshold) return "warning";
    return "default";
  };

  if (restockItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No items currently need restocking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {restockItems.length} items need restocking
            </p>
            <Button onClick={handleEmailRestockRequests} variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Restock Requests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Groups */}
      {Object.entries(groupedByProperty).map(([propertyKey, { property, items: propertyItems }]) => {
        const itemsWithAsin = propertyItems.filter(item => item.asin);
        const itemsWithoutAsin = propertyItems.filter(item => !item.asin);
        const propertySelectedItems = propertyItems.filter(item => selectedItems.has(item.id));
        const allPropertySelected = propertySelectedItems.length === propertyItems.length;
        
        const totalCost = propertyItems.reduce((sum, item) => {
          const qty = item.reorder_quantity || 1;
          const cost = calculateItemCost(item, qty);
          return sum + (cost || 0);
        }, 0);

        return (
          <div key={propertyKey} className="space-y-4">
            {/* Property Header */}
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {property ? property.name : 'Unassigned Items'}
                    </CardTitle>
                    <CardDescription>
                      {propertyItems.length} items | Estimated Total: ${totalCost.toFixed(2)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {allPropertySelected ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeselectAll(propertyItems)}
                      >
                        Deselect All
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectAll(propertyItems)}
                      >
                        Select All
                      </Button>
                    )}
                    {itemsWithAsin.length > 0 && (
                      <Button 
                        size="sm"
                        onClick={() => handleExportPropertyCSV(itemsWithAsin, property?.name)}
                        className="gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Export Amazon items to CSV
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Amazon Items Section */}
            {itemsWithAsin.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Amazon Items ({itemsWithAsin.length})
                  </CardTitle>
                  <CardDescription>
                    Export to CSV for Amazon Business bulk upload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {itemsWithAsin.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const orderQty = item.reorder_quantity || 1;
                      const unitDisplay = formatUnitDisplay(item, orderQty);
                      const estimatedCost = calculateItemCost(item, orderQty);
                      const receivedQty = receivedQuantities[item.id] || orderQty;

                      return (
                        <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="mt-1"
                          />
                          {item.amazon_image_url && (
                            <img 
                              src={item.amazon_image_url} 
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium">{item.amazon_title || item.name}</h4>
                                <Badge 
                                  variant={getStockStatusColor(item.current_quantity, item.restock_threshold)}
                                  className="mt-1"
                                >
                                  {item.current_quantity === 0 ? "Out of Stock" : "Low Stock"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Current Stock: {item.current_quantity} | Restock Threshold: {item.restock_threshold}</p>
                              <p className="font-medium text-foreground">Suggested Order: {unitDisplay}</p>
                              {estimatedCost && (
                                <p className="text-foreground">
                                  Estimated Cost: ${estimatedCost.toFixed(2)} 
                                  {item.cost_per_package && (
                                    <span className="text-muted-foreground">
                                      {' '}({orderQty} × ${Number(item.cost_per_package).toFixed(2)}/package)
                                    </span>
                                  )}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">{item.asin}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyAsin(item.asin!)}
                                  className="h-6 px-2"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                {item.amazon_link && (
                                  <a 
                                    href={item.amazon_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                                  >
                                    View Product <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder={`Default: ${orderQty}`}
                              value={receivedQuantities[item.id] || orderQty}
                              onChange={(e) => setReceivedQuantities(prev => ({
                                ...prev,
                                [item.id]: parseInt(e.target.value) || orderQty
                              }))}
                              className="w-32"
                            />
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleStatusChange(item.id, 'pending')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'pending' || !itemStatuses[item.id] ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Pending
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(item.id, 'ordered')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'ordered' ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Ordered
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(item.id, 'received')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'received' ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Received
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Order Items Section */}
            {itemsWithoutAsin.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Manual Order Items ({itemsWithoutAsin.length})
                  </CardTitle>
                  <CardDescription>
                    Items without Amazon ASIN - Requires manual ordering
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {itemsWithoutAsin.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const orderQty = item.reorder_quantity || 1;
                      const unitDisplay = formatUnitDisplay(item, orderQty);
                      const estimatedCost = calculateItemCost(item, orderQty);
                      const receivedQty = receivedQuantities[item.id] || orderQty;

                      return (
                        <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                <Badge 
                                  variant={getStockStatusColor(item.current_quantity, item.restock_threshold)}
                                  className="mt-1"
                                >
                                  {item.current_quantity === 0 ? "Out of Stock" : "Low Stock"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Current Stock: {item.current_quantity} | Restock Threshold: {item.restock_threshold}</p>
                              <p className="font-medium text-foreground">Suggested Order: {unitDisplay}</p>
                              {estimatedCost && (
                                <p className="text-foreground">
                                  Estimated Cost: ${estimatedCost.toFixed(2)}
                                  {item.cost_per_package && (
                                    <span className="text-muted-foreground">
                                      {' '}({orderQty} × ${Number(item.cost_per_package).toFixed(2)}/package)
                                    </span>
                                  )}
                                </p>
                              )}
                              {item.supplier && <p>Supplier: {item.supplier}</p>}
                              {item.reorder_link && (
                                <a 
                                  href={item.reorder_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                                >
                                  Order Link <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder={`Default: ${orderQty}`}
                              value={receivedQuantities[item.id] || orderQty}
                              onChange={(e) => setReceivedQuantities(prev => ({
                                ...prev,
                                [item.id]: parseInt(e.target.value) || orderQty
                              }))}
                              className="w-32"
                            />
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleStatusChange(item.id, 'pending')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'pending' || !itemStatuses[item.id] ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Pending
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(item.id, 'ordered')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'ordered' ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Ordered
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(item.id, 'received')}
                                size="sm"
                                variant={itemStatuses[item.id] === 'received' ? 'default' : 'outline'}
                                className="px-2"
                              >
                                Received
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
