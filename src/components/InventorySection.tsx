import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Save, X, Send, Loader2, AlertTriangle, CheckCircle, Package2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInventoryItems, useInventoryCategories, InventoryItem } from '@/hooks/useInventory';
import { InventoryEditForm } from './InventoryEditForm';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { supabase } from '@/integrations/supabase/client';

export const InventorySection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { items, isLoading, updateItem, addItem } = useInventoryItems();
  const { data: categories = [] } = useInventoryCategories();
  
  // Get tab from URL params
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'inventory');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'currentStock' | 'restockLevel'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category_id: '',
    currentStock: 0,
    restockLevel: 5,
    unit: '',
    supplier: '',
    cost: 0,
    notes: ''
  });

  // Update active tab when URL changes
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter and sort items
  const filteredItems = items
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return multiplier * a.name.localeCompare(b.name);
      } else if (sortField === 'currentStock') {
        return multiplier * (a.current_quantity - b.current_quantity);
      } else {
        return multiplier * (a.restock_threshold - b.restock_threshold);
      }
    });

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_quantity === 0) {
      return {
        label: 'Out of Stock',
        color: 'destructive',
        icon: AlertTriangle,
      };
    } else if (item.current_quantity <= item.restock_threshold) {
      return {
        label: 'Low Stock',
        color: 'default',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'In Stock',
        color: 'secondary',
        icon: CheckCircle,
      };
    }
  };

  const handleQuickStockUpdate = (itemId: string, newQuantity: number) => {
    updateItem({
      id: itemId,
      current_quantity: Math.max(0, newQuantity),
    });
  };

  const handleEditSave = (updatedItem: any) => {
    updateItem(updatedItem);
    setEditingItem(null);
  };

  const handleAddNewItem = async () => {
    if (!newItem.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter an item name.',
        variant: 'destructive',
      });
      return;
    }

    if (!newItem.category_id) {
      // Default to "Other" category if not selected
      const otherCategory = categories.find(c => c.name === 'Other');
      if (otherCategory) {
        newItem.category_id = otherCategory.id;
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profile) {
      toast({
        title: 'Error',
        description: 'Unable to find user profile',
        variant: 'destructive',
      });
      return;
    }

    addItem({
      name: newItem.name.trim(),
      category_id: newItem.category_id,
      current_quantity: newItem.currentStock,
      restock_threshold: newItem.restockLevel,
      unit_price: newItem.cost,
      unit: newItem.unit,
      supplier: newItem.supplier,
      description: newItem.notes,
      reorder_quantity: 10,
      units_per_package: null,
      cost_per_package: null,
      amazon_image_url: null,
      amazon_title: null,
      amazon_link: null,
      asin: null,
      reorder_link: null,
      restock_requested: false,
      notes: newItem.notes,
      created_by: profile.id,
    } as any);

    // Reset form
    setNewItem({
      name: '',
      category_id: '',
      currentStock: 0,
      restockLevel: 5,
      unit: '',
      supplier: '',
      cost: 0,
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleSendRestockEmails = async () => {
    const itemsNeedingRestock = items.filter(
      item => item.current_quantity <= item.restock_threshold
    );

    if (itemsNeedingRestock.length === 0) {
      toast({
        title: 'No items need restocking',
        description: 'All inventory levels are sufficient.',
      });
      return;
    }

    try {
      // Call the edge function to send emails
      const { error } = await supabase.functions.invoke('send-inventory-emails', {
        body: {
          items: itemsNeedingRestock.map(item => ({
            id: item.id,
            name: item.name,
            current_quantity: item.current_quantity,
            restock_threshold: item.restock_threshold,
            supplier: item.supplier,
            category: item.category_name,
          })),
        },
      });

      if (error) throw error;

      // Mark items as restock_requested
      for (const item of itemsNeedingRestock) {
        updateItem({
          id: item.id,
          restock_requested: true,
        });
      }

      toast({
        title: 'Emails sent',
        description: `Restock notifications sent for ${itemsNeedingRestock.length} items`,
      });
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: 'Error sending emails',
        description: error.message || 'Failed to send restock notifications',
        variant: 'destructive',
      });
    }
  };

  const lowStockItems = items.filter(item => item.current_quantity <= item.restock_threshold);
  const outOfStockItems = items.filter(item => item.current_quantity === 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
          <TabsTrigger value="requests">Restock Requests</TabsTrigger>
          <TabsTrigger value="notifications">Email Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Search and Add */}
          <div className="flex gap-4">
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => navigate('/inventory-setup')}>
              Manage Categories
            </Button>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
            {lowStockItems.length > 0 && (
              <Button onClick={handleSendRestockEmails} variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send Restock Emails ({lowStockItems.length})
              </Button>
            )}
          </div>

          {/* Add Item Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Inventory Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name *</label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <Select
                      value={newItem.category_id}
                      onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Stock</label>
                    <Input
                      type="number"
                      min="0"
                      value={newItem.currentStock}
                      onChange={(e) => setNewItem({ ...newItem, currentStock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Restock Level</label>
                    <Input
                      type="number"
                      min="0"
                      value={newItem.restockLevel}
                      onChange={(e) => setNewItem({ ...newItem, restockLevel: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Input
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="bottles, rolls..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cost</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.cost}
                      onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Input
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNewItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editing Form */}
          {editingItem && (
            <InventoryEditForm
              item={{
                ...editingItem,
                category: editingItem.category_name || 'Other',
                currentStock: editingItem.current_quantity,
                restockLevel: editingItem.restock_threshold,
                cost: editingItem.unit_price || 0,
                unit: editingItem.unit || '',
                notes: editingItem.notes || '',
                lastUpdated: editingItem.updated_at,
                restockRequested: editingItem.restock_requested
              }}
              onSave={handleEditSave}
              onCancel={() => setEditingItem(null)}
              categories={categories.map(c => c.name)}
            />
          )}

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Item</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Stock</th>
                      <th className="text-left p-4 font-medium">Restock Level</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Supplier</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item);
                      const StatusIcon = status.icon;

                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {item.amazon_image_url && (
                                <img
                                  src={item.amazon_image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.unit && (
                                  <div className="text-sm text-muted-foreground">{item.unit}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{item.category_name}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.current_quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-12 text-center font-medium">{item.current_quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStockUpdate(item.id, item.current_quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td className="p-4">{item.restock_threshold}</td>
                          <td className="p-4">
                            <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-4">{item.supplier || '-'}</td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Restock Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Items with current stock at or below restock level:
              </p>
              <div className="mt-4 space-y-2">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">All inventory levels are sufficient</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {item.current_quantity} | Restock at: {item.restock_threshold}
                        </div>
                      </div>
                      {item.restock_requested && (
                        <Badge variant="secondary">Requested</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <EmailNotificationSettings onEmailSettingsChange={() => {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
};