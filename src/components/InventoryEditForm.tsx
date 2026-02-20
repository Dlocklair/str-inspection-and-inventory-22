import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Plus, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { extractAsin } from '@/lib/amazon';
import { ItemPhotoUpload } from './ItemPhotoUpload';
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
interface InventoryEditFormProps {
  item: InventoryItem;
  onSave: (updatedItem: InventoryItem) => void;
  onCancel: () => void;
  onDelete?: () => void;
  categories: string[];
  onAssignToProperty?: () => void;
}
export const InventoryEditForm = ({
  item,
  onSave,
  onCancel,
  onDelete,
  categories,
  onAssignToProperty
}: InventoryEditFormProps) => {
  const {
    toast
  } = useToast();
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
      requestDate: editingData.currentStock <= editingData.restockLevel ? new Date().toISOString().split('T')[0] : undefined
    };
    onSave(updatedItem);
    toast({
      title: "Item updated",
      description: "Inventory item has been updated successfully."
    });
  };
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-cyan">Edit Inventory Item</CardTitle>
      </CardHeader>
      <CardContent className="pb-20 md:pb-6">
        {/* Desktop: Sticky Action Buttons at Top */}
        <div className="hidden md:flex gap-2 mb-6 flex-wrap sticky top-0 bg-card z-10 py-2 -mt-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {onAssignToProperty && (
            <Button onClick={onAssignToProperty} variant="secondary" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Assign to Properties
            </Button>
          )}
          {onDelete && (
            <Button onClick={onDelete} variant="destructive" className="flex items-center gap-2 ml-auto">
              <Trash2 className="h-4 w-4" />
              Delete Item
            </Button>
          )}
        </div>

        {/* Mobile: Sticky bottom save bar */}
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-50 bg-background border-t p-3 flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Item Name - First field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Item Name</label>
            <Input placeholder="Enter the name of the inventory item" value={editingData.name} onFocus={e => e.target.select()} onChange={e => setEditingData(prev => ({
            ...prev,
            name: e.target.value
          }))} />
          </div>

          {/* Category - Second field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Category</label>
            <Select value={editingData.category} onValueChange={value => {
            if (value === 'add-new-category') {
              setShowNewCategoryPopover(true);
            } else {
              setEditingData(prev => ({
                ...prev,
                category: value
              }));
            }
          }}>
              <SelectTrigger>
                <SelectValue placeholder="Select product category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>)}
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
                    onChange={e => setNewCategory(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter' && newCategory.trim()) {
                        setEditingData(prev => ({
                          ...prev,
                          category: newCategory.trim()
                        }));
                        setNewCategory('');
                        setShowNewCategoryPopover(false);
                        toast({
                          title: "Category added",
                          description: `Category "${newCategory.trim()}" has been added.`
                        });
                      }
                    }} 
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="submit"
                      size="sm" 
                      onClick={() => {
                        if (newCategory.trim()) {
                          setEditingData(prev => ({
                            ...prev,
                            category: newCategory.trim()
                          }));
                          setNewCategory('');
                          setShowNewCategoryPopover(false);
                          toast({
                            title: "Category added",
                            description: `Category "${newCategory.trim()}" has been added.`
                          });
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setShowNewCategoryPopover(false);
                      setNewCategory('');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Units - Third field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Units</label>
            <Input placeholder="How items are counted (bottles, rolls, boxes, etc.)" value={editingData.unit} onFocus={e => e.target.select()} onChange={e => setEditingData(prev => ({
            ...prev,
            unit: e.target.value
          }))} />
          </div>
          
          {/* Supplier - Fourth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Supplier</label>
            <Input placeholder="Name of supplier or vendor" value={editingData.supplier} onFocus={e => e.target.select()} onChange={e => setEditingData(prev => ({
            ...prev,
            supplier: e.target.value
          }))} />
          </div>
          
          {/* URL - Fifth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Supplier URL</label>
            <Input placeholder="Website URL for ordering this item (Amazon links auto-extract ASIN)" value={editingData.supplierUrl || ''} onFocus={e => e.target.select()} onChange={e => {
            const link = e.target.value;
            const asin = extractAsin(link) || editingData.asin || '';
            setEditingData(prev => ({
              ...prev,
              supplierUrl: link,
              asin: asin
            }));
          }} />
          </div>
          
          {/* Units per Package - Sixth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Units per Package</label>
            <Input type="number" min="1" placeholder="Number of units in each package" value={editingData.unitsPerPackage || ''} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onFocus={e => e.target.select()} onChange={e => {
            const unitsPerPkg = Number(e.target.value) || 1;
            const costPerUnit = (editingData.costPerPackage || 0) / unitsPerPkg;
            setEditingData(prev => ({
              ...prev,
              unitsPerPackage: unitsPerPkg,
              cost: costPerUnit
            }));
          }} />
          </div>

          {/* Cost per Package - Seventh field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Cost per Package</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input 
                type="text" 
                placeholder="1,234.56" 
                value={typeof editingData.costPerPackage === 'number' ? editingData.costPerPackage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : editingData.costPerPackage || ''} 
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-[120px] pl-7" 
                onFocus={e => {
                  e.target.select();
                }}
                onChange={e => {
                  const value = e.target.value.replace(/,/g, '');
                  // Allow empty, numbers, and one decimal point with up to 2 decimals
                  if (value && !/^\d{0,4}\.?\d{0,2}$/.test(value)) return;
                  
                  // Check if value exceeds max when it's a complete number
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue > 9999.99) return;
                  
                  const costPerUnit = (parseFloat(value) || 0) / (editingData.unitsPerPackage || 1);
                  setEditingData(prev => ({
                    ...prev,
                    costPerPackage: parseFloat(value) || 0,
                    cost: costPerUnit
                  }));
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Max: $9,999.99
            </p>
          </div>
          
          {/* Cost per unit - CALCULATED - Eighth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Cost per Unit (Calculated)</label>
            <Input type="text" readOnly value={editingData.cost ? `$${editingData.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'} className="bg-muted" />
          </div>
          
          {/* Restock level - Ninth field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Restock Level (Units)</label>
            <Input type="text" placeholder="Minimum quantity before reordering" value={editingData.restockLevel ? editingData.restockLevel.toLocaleString('en-US') : ''} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onFocus={e => e.target.select()} onChange={e => {
            const value = e.target.value.replace(/,/g, '');
            if (/^\d{0,4}$/.test(value)) {
              setEditingData(prev => ({
                ...prev,
                restockLevel: parseInt(value) || 0
              }));
            }
          }} />
          </div>
          
          {/* Current stock */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">Current Stock</label>
            <Input type="text" placeholder="How many you have right now" value={editingData.currentStock ? editingData.currentStock.toLocaleString('en-US') : ''} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onFocus={e => e.target.select()} onChange={e => {
            const value = e.target.value.replace(/,/g, '');
            if (/^\d{0,4}$/.test(value)) {
              setEditingData(prev => ({
                ...prev,
                currentStock: parseInt(value) || 0
              }));
            }
          }} />
          </div>
        </div>
        
        {/* New category input if needed */}
        {editingData.category === '' && <div className="mt-4">
            <Input placeholder="Enter new category name" value={newCategory} onChange={e => {
          setNewCategory(e.target.value);
          setEditingData(prev => ({
            ...prev,
            category: e.target.value
          }));
        }} />
          </div>}
        
        {/* Product Image Section */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-cyan mb-3">Product Photo</h4>
          <div className="flex gap-4 items-start flex-wrap">
            <ItemPhotoUpload
              itemId={editingData.id}
              currentImageUrl={editingData.image_url ?? null}
              amazonImageUrl={editingData.amazon_image_url ?? null}
              onPhotoUploaded={(url) => setEditingData(prev => ({ ...prev, image_url: url }))}
            />
            <div className="flex-1 space-y-2 min-w-[200px]">
              <label className="text-sm font-medium text-cyan">Image URL</label>
              <Input placeholder="Paste image URL or copy/paste an image directly" value={editingData.image_url ?? ''} onFocus={e => e.target.select()} onChange={e => setEditingData(prev => ({
              ...prev,
              image_url: e.target.value
            }))} onPaste={e => {
              const items = e.clipboardData.items;
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                  const blob = items[i].getAsFile();
                  if (blob) {
                    const reader = new FileReader();
                    reader.onload = event => {
                      setEditingData(prev => ({
                        ...prev,
                        image_url: event.target?.result as string
                      }));
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                  }
                }
              }
            }} />
              <p className="text-xs text-muted-foreground">
                Paste image URL, snap a photo, or upload from device
              </p>
            </div>
          </div>
        </div>

        {/* Amazon Section */}
        <div className="mt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan">ASIN (Amazon Standard Identification Number)</label>
            <Input placeholder="XXXXXXXXXX" value={editingData.asin ?? ''} onFocus={e => e.target.select()} onChange={e => setEditingData(prev => ({
            ...prev,
            asin: e.target.value.toUpperCase()
          }))} maxLength={10} />
            <p className="text-xs text-muted-foreground">
              10-character Amazon product code
            </p>
          </div>
        </div>

        {/* Notes - Last field */}
        <div className="mt-4">
          <label className="text-sm font-medium text-cyan">Additional Notes</label>
          <Textarea placeholder="Additional notes, special instructions, or details about this item" value={editingData.notes} onChange={e => setEditingData(prev => ({
          ...prev,
          notes: e.target.value
        }))} rows={2} className="mt-2" />
        </div>
      </CardContent>
    </Card>;
};