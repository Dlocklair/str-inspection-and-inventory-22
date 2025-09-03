import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  restockLevel: number;
  unit: string;
  supplier: string;
  supplierUrl?: string;
  cost: number;
  notes: string;
  lastUpdated: string;
  restockRequested: boolean;
  requestDate?: string;
}

interface InventoryEditFormProps {
  item: InventoryItem;
  onSave: (updatedItem: InventoryItem) => void;
  onCancel: () => void;
  categories: string[];
}

export const InventoryEditForm = ({ item, onSave, onCancel, categories }: InventoryEditFormProps) => {
  const { toast } = useToast();
  const [editingData, setEditingData] = useState<InventoryItem>(item);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryPopover, setShowNewCategoryPopover] = useState(false);

  const handleSave = () => {
    if (!editingData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an item name.",
        variant: "destructive"
      });
      return;
    }

    const updatedItem = {
      ...editingData,
      lastUpdated: new Date().toISOString(),
      restockRequested: editingData.currentStock <= editingData.restockLevel,
      requestDate: editingData.currentStock <= editingData.restockLevel 
        ? new Date().toISOString().split('T')[0] 
        : undefined
    };
    
    onSave(updatedItem);
    
    toast({
      title: "Item updated",
      description: "Inventory item has been updated successfully.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-cyan">Edit Inventory Item</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category - First field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Category</label>
            <Select 
              value={editingData.category} 
              onValueChange={(value) => {
                if (value === 'add-new-category') {
                  setShowNewCategoryPopover(true);
                } else {
                  setEditingData(prev => ({ ...prev, category: value }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="add-new-category">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Add New Category
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* New Category Popover */}
            <Popover open={showNewCategoryPopover} onOpenChange={setShowNewCategoryPopover}>
              <PopoverTrigger asChild>
                <div />
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Category Name</label>
                  <Input
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newCategory.trim()) {
                        setEditingData(prev => ({ ...prev, category: newCategory.trim() }));
                        setNewCategory('');
                        setShowNewCategoryPopover(false);
                        toast({
                          title: "Category added",
                          description: `Category "${newCategory.trim()}" has been added.`,
                        });
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newCategory.trim()) {
                          setEditingData(prev => ({ ...prev, category: newCategory.trim() }));
                          setNewCategory('');
                          setShowNewCategoryPopover(false);
                          toast({
                            title: "Category added",
                            description: `Category "${newCategory.trim()}" has been added.`,
                          });
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryPopover(false);
                        setNewCategory('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Item - Second field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Item Name</label>
            <Input
              placeholder="Enter the name of the inventory item"
              value={editingData.name}
              onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          {/* Units - Third field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Unit</label>
            <Input
              placeholder="How items are counted (bottles, rolls, boxes, etc.)"
              value={editingData.unit}
              onChange={(e) => setEditingData(prev => ({ ...prev, unit: e.target.value }))}
            />
          </div>
          
          {/* Supplier - Fourth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Supplier</label>
            <Input
              placeholder="Name of supplier or vendor"
              value={editingData.supplier}
              onChange={(e) => setEditingData(prev => ({ ...prev, supplier: e.target.value }))}
            />
          </div>
          
          {/* URL - Fifth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Supplier URL</label>
            <Input
              placeholder="Website URL for ordering this item"
              value={editingData.supplierUrl || ''}
              onChange={(e) => setEditingData(prev => ({ ...prev, supplierUrl: e.target.value }))}
            />
          </div>
          
          {/* Cost per unit - Sixth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Cost per Unit</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Price per individual unit ($)"
              value={editingData.cost || ''}
              onChange={(e) => setEditingData(prev => ({ ...prev, cost: Number(e.target.value) }))}
            />
          </div>
          
          {/* Restock level - Seventh field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Restock Level</label>
            <Input
              type="number"
              placeholder="Minimum quantity before reordering"
              value={editingData.restockLevel || ''}
              onChange={(e) => setEditingData(prev => ({ ...prev, restockLevel: Number(e.target.value) }))}
            />
          </div>
          
          {/* Current stock */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Current Stock</label>
            <Input
              type="number"
              placeholder="How many you have right now"
              value={editingData.currentStock || ''}
              onChange={(e) => setEditingData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
            />
          </div>
        </div>
        
        {/* New category input if needed */}
        {editingData.category === '' && (
          <div className="mt-4">
            <Input
              placeholder="Enter new category name"
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                setEditingData(prev => ({ ...prev, category: e.target.value }));
              }}
            />
          </div>
        )}
        
        {/* Notes - Last field */}
        <div className="mt-4">
          <label className="text-sm font-medium text-cyan">Additional Notes</label>
          <Textarea
            placeholder="Additional notes, special instructions, or details about this item"
            value={editingData.notes}
            onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="mt-2"
          />
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Return to Current Inventory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};