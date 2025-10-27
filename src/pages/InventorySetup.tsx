import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  restockLevel: number;
  unit: string;
  supplier: string;
  supplierUrl?: string;
  unitsPerPackage?: number;
  costPerPackage?: number;
  cost: number;
  notes: string;
  lastUpdated: string;
  restockRequested: boolean;
  requestDate?: string;
  asin?: string | null;
  amazon_image_url?: string | null;
  image_url?: string | null;
}

const InventorySetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([
    'Linen and Bedding',
    'Bathroom Supplies',
    'Cleaning Supplies',
    'Kitchen Supplies',
    'Paper Goods',
    'Guest Amenities',
    'Maintenance and Repair',
    'Safety and Security',
    'Technology and Entertainment',
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = () => {
    try {
      const stored = localStorage.getItem('inventoryItems');
      if (stored) {
        const items = JSON.parse(stored) as InventoryItem[];
        setInventoryItems(items);
        // Extract unique categories from items
        const itemCategories = [...new Set(items.map(item => item.category))];
        setCategories(prev => {
          const combined = [...new Set([...prev, ...itemCategories])];
          return combined.sort();
        });
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const saveItemEdit = () => {
    if (!editingItem) return;

    try {
      const updatedItems = inventoryItems.map(item =>
        item.id === editingItem.id ? editingItem : item
      );
      localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
      setInventoryItems(updatedItems);

      toast({
        title: 'Item updated',
        description: `"${editingItem.name}" has been updated.`,
      });

      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: 'Error updating item',
        description: 'Failed to save changes.',
        variant: 'destructive',
      });
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a category name.',
        variant: 'destructive',
      });
      return;
    }

    if (categories.includes(newCategory.trim())) {
      toast({
        title: 'Duplicate category',
        description: 'This category already exists.',
        variant: 'destructive',
      });
      return;
    }

    setCategories((prev) => [...prev, newCategory.trim()].sort());
    setNewCategory('');
    toast({
      title: 'Category added',
      description: `"${newCategory.trim()}" has been added to categories.`,
    });
  };

  const openDeleteDialog = (category: string) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const deleteCategory = () => {
    if (!categoryToDelete) return;

    // Get items that will be deleted
    const itemsToDelete = inventoryItems.filter(
      (item) => item.category.toLowerCase() === categoryToDelete.toLowerCase()
    );
    
    // Remove category from list
    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== categoryToDelete.toLowerCase()));
    
    // Remove all items in this category from localStorage
    const updatedItems = inventoryItems.filter(
      (item) => item.category.toLowerCase() !== categoryToDelete.toLowerCase()
    );
    localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
    setInventoryItems(updatedItems);
    
    toast({
      title: 'Category deleted',
      description: `"${categoryToDelete}" and ${itemsToDelete.length} item(s) have been removed.`,
    });
    
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const startEditing = (category: string) => {
    setEditingCategory(category);
    setEditedName(category);
  };

  const saveEdit = () => {
    if (!editedName.trim()) {
      toast({
        title: 'Category name required',
        description: 'Please enter a category name.',
        variant: 'destructive',
      });
      return;
    }

    if (editedName.trim() !== editingCategory && categories.includes(editedName.trim())) {
      toast({
        title: 'Duplicate category',
        description: 'This category already exists.',
        variant: 'destructive',
      });
      return;
    }

    setCategories((prev) =>
      prev.map((c) => (c === editingCategory ? editedName.trim() : c)).sort()
    );
    toast({
      title: 'Category updated',
      description: `Category renamed to "${editedName.trim()}".`,
    });
    setEditingCategory(null);
    setEditedName('');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditedName('');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Inventory Setup
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage inventory categories and settings
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
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCategory();
                    }
                  }}
                />
                <Button onClick={addCategory} className="flex items-center gap-2">
                  Add
                </Button>
              </div>
            </div>

            {/* Categories with Items */}
            <div className="space-y-4">
              <Label>Categories and Items ({categories.length} categories)</Label>
              <div className="space-y-3">
                {categories.map((category) => {
                  const itemsInCategory = inventoryItems.filter(
                    (item) => item.category.toLowerCase() === category.toLowerCase()
                  );
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <Collapsible
                      key={category}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category)}
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
                            {editingCategory === category ? (
                              <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                className="flex-1 h-8"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-base">
                                {category} ({itemsInCategory.length})
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingCategory === category ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={saveEdit}>
                                  Save
                                </Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(category)}
                                  className="hover:text-primary"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(category)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Items in Category */}
                        <CollapsibleContent>
                          <div className="p-3 space-y-2 bg-background">
                            {itemsInCategory.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">
                                No items in this category yet
                              </p>
                            ) : (
                              itemsInCategory.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Stock: {item.currentStock} | Restock Level:{' '}
                                      {item.restockLevel} | Cost: ${item.costPerPackage?.toFixed(2) || item.cost.toFixed(2)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(item)}
                                    className="hover:text-primary"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
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

        {/* Delete Category Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Category
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Deleting a category will also delete all items in that category.
                </p>
                {categoryToDelete && (
                  <p className="font-semibold">
                    This will delete {inventoryItems.filter(
                      (item) => item.category.toLowerCase() === categoryToDelete.toLowerCase()
                    ).length} item(s) in "{categoryToDelete}".
                  </p>
                )}
                <p className="text-destructive font-medium">
                  Do you want to proceed?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteCategory}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Category
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Item Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={editingItem.category}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, category: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Current Stock</Label>
                    <Input
                      type="number"
                      value={editingItem.currentStock}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          currentStock: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Restock Level</Label>
                    <Input
                      type="number"
                      value={editingItem.restockLevel}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          restockLevel: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Package</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.costPerPackage || editingItem.cost}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          costPerPackage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={editingItem.supplier}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, supplier: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingItem.image_url || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, image_url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amazon ASIN</Label>
                  <Input
                    value={editingItem.asin || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, asin: e.target.value })
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
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveItemEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventorySetup;
