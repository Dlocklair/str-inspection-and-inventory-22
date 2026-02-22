import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Save, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInventoryItems, useInventoryCategories, InventoryItem } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AssignmentOverride {
  itemId: string;
  selected: boolean;
  restockThreshold: number;
}

export const AssignInventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { rolesLoaded, hasAnyRole } = useAuth();
  const { userProperties } = usePropertyContext();
  
  const queriesEnabled = rolesLoaded && hasAnyRole();
  const { items } = useInventoryItems(queriesEnabled);
  const { data: categories = [] } = useInventoryCategories(queriesEnabled);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [overrides, setOverrides] = useState<Record<string, AssignmentOverride>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Master items = items with no property_id (unassigned / master list)
  const masterItems = useMemo(() => items.filter(i => !i.property_id), [items]);
  
  // Items already assigned to the selected property
  const assignedItemNames = useMemo(() => {
    if (!selectedPropertyId) return new Set<string>();
    return new Set(
      items.filter(i => i.property_id === selectedPropertyId).map(i => i.name.toLowerCase())
    );
  }, [items, selectedPropertyId]);

  // Group master items by category
  const categorizedItems = useMemo(() => {
    const groups: Record<string, { categoryName: string; items: InventoryItem[] }> = {};
    masterItems.forEach(item => {
      const cat = categories.find(c => c.id === item.category_id);
      const catName = cat?.name || 'Uncategorized';
      if (!groups[item.category_id]) {
        groups[item.category_id] = { categoryName: catName, items: [] };
      }
      groups[item.category_id].items.push(item);
    });
    return groups;
  }, [masterItems, categories]);

  const getOverride = (itemId: string, item: InventoryItem): AssignmentOverride => {
    return overrides[itemId] || {
      itemId,
      selected: false,
      restockThreshold: item.restock_threshold,
    };
  };

  const toggleItem = (itemId: string, item: InventoryItem) => {
    setOverrides(prev => {
      const current = getOverride(itemId, item);
      return { ...prev, [itemId]: { ...current, selected: !current.selected } };
    });
  };

  const updateRestock = (itemId: string, item: InventoryItem, value: number) => {
    setOverrides(prev => {
      const current = getOverride(itemId, item);
      return { ...prev, [itemId]: { ...current, restockThreshold: value } };
    });
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectedItems = Object.values(overrides).filter(o => o.selected);

  const handleAssign = async () => {
    if (!selectedPropertyId || selectedItems.length === 0) {
      toast({ title: 'Nothing to assign', description: 'Select a property and at least one item.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const itemsToInsert = selectedItems.map(override => {
        const masterItem = masterItems.find(i => i.id === override.itemId);
        if (!masterItem) return null;
        return {
          name: masterItem.name,
          category_id: masterItem.category_id,
          current_quantity: 0,
          restock_threshold: override.restockThreshold,
          reorder_quantity: masterItem.reorder_quantity,
          unit_price: masterItem.unit_price,
          unit: masterItem.unit,
          units_per_package: masterItem.units_per_package,
          cost_per_package: masterItem.cost_per_package,
          supplier: masterItem.supplier,
          description: masterItem.description,
          notes: masterItem.notes,
          amazon_image_url: masterItem.amazon_image_url,
          amazon_title: masterItem.amazon_title,
          amazon_link: masterItem.amazon_link,
          asin: masterItem.asin,
          reorder_link: masterItem.reorder_link,
          restock_requested: false,
          property_id: selectedPropertyId,
          image_url: masterItem.image_url,
          barcode: masterItem.barcode,
          created_by: profile?.id,
        };
      }).filter(Boolean);

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert as any[]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Items assigned', description: `${itemsToInsert.length} item(s) assigned to the property.` });
      setOverrides({});
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign items.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    const newOverrides: Record<string, AssignmentOverride> = { ...overrides };
    masterItems.forEach(item => {
      if (!assignedItemNames.has(item.name.toLowerCase())) {
        newOverrides[item.id] = {
          itemId: item.id,
          selected: true,
          restockThreshold: overrides[item.id]?.restockThreshold ?? item.restock_threshold,
        };
      }
    });
    setOverrides(newOverrides);
  };

  const deselectAll = () => {
    const newOverrides: Record<string, AssignmentOverride> = {};
    Object.entries(overrides).forEach(([id, o]) => {
      newOverrides[id] = { ...o, selected: false };
    });
    setOverrides(newOverrides);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Assign Inventory to Property
        </CardTitle>
        <CardDescription>
          Select a property, then check the master inventory items you want to assign. Restock levels can be customized per property.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Selector */}
        <div className="space-y-2">
          <Label>Select Property</Label>
          <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setOverrides({}); }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a property..." />
            </SelectTrigger>
            <SelectContent>
              {userProperties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPropertyId && (
          <>
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              </div>
              <Badge variant="outline">{selectedItems.length} selected</Badge>
            </div>

            {/* Items grouped by category */}
            <div className="space-y-2">
              {Object.entries(categorizedItems).map(([catId, group]) => {
                const isExpanded = expandedCategories.has(catId);
                return (
                  <div key={catId} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 bg-muted hover:bg-accent/50 transition-colors text-left"
                      onClick={() => toggleCategory(catId)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm text-primary">{group.categoryName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{group.items.length}</Badge>
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {group.items.map(item => {
                          const override = getOverride(item.id, item);
                          const alreadyAssigned = assignedItemNames.has(item.name.toLowerCase());
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-2 rounded border ${alreadyAssigned ? 'opacity-50 bg-muted/30' : 'hover:bg-muted/20'}`}
                            >
                              <Checkbox
                                checked={override.selected}
                                disabled={alreadyAssigned}
                                onCheckedChange={() => toggleItem(item.id, item)}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm">{item.name}</span>
                                {alreadyAssigned && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Already assigned</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Restock:</Label>
                                <Input
                                  type="number"
                                  className="w-16 h-7 text-sm"
                                  value={override.restockThreshold}
                                  disabled={alreadyAssigned}
                                  onChange={(e) => updateRestock(item.id, item, parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(categorizedItems).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No master (unassigned) inventory items found. Add items without a property assignment in Manage Inventory first.
                </p>
              )}
            </div>

            {/* Save */}
            <Button onClick={handleAssign} disabled={saving || selectedItems.length === 0} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Assigning...' : `Assign ${selectedItems.length} Item(s) to Property`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};