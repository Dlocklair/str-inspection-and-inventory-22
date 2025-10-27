import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

  const deleteCategory = (category: string) => {
    setCategories((prev) => prev.filter((c) => c !== category));
    toast({
      title: 'Category deleted',
      description: `"${category}" has been removed.`,
    });
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
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <Label>Current Categories ({categories.length})</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    {editingCategory === category ? (
                      <>
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
                          className="flex-1 mr-2"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={saveEdit}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{category}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(category)}
                            className="hover:text-primary"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCategory(category)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventorySetup;
