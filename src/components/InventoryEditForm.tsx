import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        <CardTitle>Edit Inventory Item</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category - First field */}
          <Select 
            value={editingData.category} 
            onValueChange={(value) => {
              if (value === 'add-new') {
                setNewCategory('');
              } else {
                setEditingData(prev => ({ ...prev, category: value }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
              <SelectItem value="add-new">+ Add new category</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Item - Second field */}
          <Input
            placeholder="Item name"
            value={editingData.name}
            onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
          />
          
          {/* Units - Third field */}
          <Input
            placeholder="Units (e.g., bottles, rolls)"
            value={editingData.unit}
            onChange={(e) => setEditingData(prev => ({ ...prev, unit: e.target.value }))}
          />
          
          {/* Supplier - Fourth field */}
          <Input
            placeholder="Supplier"
            value={editingData.supplier}
            onChange={(e) => setEditingData(prev => ({ ...prev, supplier: e.target.value }))}
          />
          
          {/* URL - Fifth field */}
          <Input
            placeholder="Supplier URL"
            value={editingData.supplierUrl || ''}
            onChange={(e) => setEditingData(prev => ({ ...prev, supplierUrl: e.target.value }))}
          />
          
          {/* Cost per unit - Sixth field */}
          <Input
            type="number"
            step="0.01"
            placeholder="Cost per unit"
            value={editingData.cost || ''}
            onChange={(e) => setEditingData(prev => ({ ...prev, cost: Number(e.target.value) }))}
          />
          
          {/* Restock level - Seventh field */}
          <Input
            type="number"
            placeholder="Restock level"
            value={editingData.restockLevel || ''}
            onChange={(e) => setEditingData(prev => ({ ...prev, restockLevel: Number(e.target.value) }))}
          />
          
          {/* Current stock */}
          <Input
            type="number"
            placeholder="Current stock"
            value={editingData.currentStock || ''}
            onChange={(e) => setEditingData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
          />
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
          <Textarea
            placeholder="Notes (optional)"
            value={editingData.notes}
            onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};