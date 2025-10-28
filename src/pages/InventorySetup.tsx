import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Pencil, ChevronDown, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useInventoryItems, useInventoryCategories, InventoryItem } from '@/hooks/useInventory';

const InventorySetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { items, isLoading, updateItem, deleteItem, addCategory } = useInventoryItems();
  const { data: categories = [] } = useInventoryCategories();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogItem, setDeleteDialogItem] = useState<InventoryItem | null>(null);

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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a category name.',
        variant: 'destructive',
      });
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast({
        title: 'Duplicate category',
        description: 'This category already exists.',
        variant: 'destructive',
      });
      return;
    }

    addCategory({ name: newCategoryName.trim() });
    setNewCategoryName('');
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const saveItemEdit = () => {
    if (!editingItem) return;

    if (!editingItem.name?.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter an item name.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate unit_price from cost_per_package and units_per_package
    let unitPrice = editingItem.unit_price;
    if (editingItem.cost_per_package && editingItem.units_per_package && editingItem.units_per_package > 0) {
      unitPrice = editingItem.cost_per_package / editingItem.units_per_package;
    }

    updateItem({
      id: editingItem.id,
      name: editingItem.name.trim(),
      category_id: editingItem.category_id,
      current_quantity: editingItem.current_quantity,
      restock_threshold: editingItem.restock_threshold,
      unit_price: unitPrice,
      unit: editingItem.unit,
      units_per_package: editingItem.units_per_package,
      cost_per_package: editingItem.cost_per_package,
      supplier: editingItem.supplier,
      description: editingItem.description,
      notes: editingItem.notes,
      amazon_link: editingItem.amazon_link,
      asin: editingItem.asin,
      amazon_image_url: editingItem.amazon_image_url,
    });

    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!deleteDialogItem) return;
    deleteItem(deleteDialogItem.id);
    setDeleteDialogItem(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const categoriesWithItems = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id)
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Inventory Setup
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage inventory categories and items
            </p>
          </div>
          <Button onClick={() => navigate('/inventory')} variant="outline">
            Back to Inventory
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Category */}
            <div className="space-y-2">
              <Label>Add New Category</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
                <Button onClick={handleAddCategory}>Add</Button>
              </div>
            </div>

            {/* Categories with Items */}
            <div className="space-y-4">
              <Label>Categories and Items ({categoriesWithItems.length} categories)</Label>
              <div className="space-y-3">
                {categoriesWithItems.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);

                  return (
                    <Collapsible
                      key={category.id}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category.name)}
                    >
                      <div className="border rounded-lg">
                        {/* Category Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <div className="flex items-center gap-2 flex-1">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <span className="font-semibold text-base">
                              {category.name} ({category.items.length})
                            </span>
                          </div>
                        </div>

                        {/* Items in Category */}
                        <CollapsibleContent>
                          <div className="p-3 space-y-2 bg-background">
                            {category.items.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">
                                No items in this category yet
                              </p>
                            ) : (
                              category.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Stock: {item.current_quantity} | Restock: {item.restock_threshold} | 
                                      {item.cost_per_package ? ` $${item.cost_per_package.toFixed(2)}/pkg` : 
                                       item.unit_price ? ` $${item.unit_price.toFixed(2)}/unit` : ''}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(item)}
                                      className="hover:text-primary"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteDialogItem(item)}
                                      className="hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Item Confirmation Dialog */}
        <AlertDialog open={!!deleteDialogItem} onOpenChange={(open) => !open && setDeleteDialogItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Item
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialogItem?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Item Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={editingItem.category_id}
                      onValueChange={(value) =>
                        setEditingItem({ ...editingItem, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Current Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingItem.current_quantity}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          current_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Restock Level</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingItem.restock_threshold}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          restock_threshold: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={editingItem.unit || ''}
                      placeholder="bottles, rolls, boxes"
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, unit: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Units per Package</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editingItem.units_per_package || 1}
                      onChange={(e) => {
                        const units = parseFloat(e.target.value) || 1;
                        setEditingItem({
                          ...editingItem,
                          units_per_package: units,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Package</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.cost_per_package || 0}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setEditingItem({
                          ...editingItem,
                          cost_per_package: cost,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Unit</Label>
                    <Input
                      type="number"
                      disabled
                      value={
                        editingItem.cost_per_package && editingItem.units_per_package
                          ? (editingItem.cost_per_package / editingItem.units_per_package).toFixed(2)
                          : editingItem.unit_price?.toFixed(2) || '0.00'
                      }
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={editingItem.supplier || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, supplier: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={editingItem.notes || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {editingItem.amazon_image_url && (
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <img
                      src={editingItem.amazon_image_url}
                      alt={editingItem.name}
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveItemEdit}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventorySetup;