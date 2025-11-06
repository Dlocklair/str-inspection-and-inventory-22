import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Save, X, Send, Loader2, AlertTriangle, CheckCircle, Package2, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInventoryItems, useInventoryCategories, InventoryItem } from '@/hooks/useInventory';
import { InventoryEditForm } from './InventoryEditForm';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { supabase } from '@/integrations/supabase/client';
import { InventoryTable } from './InventoryTable';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { PropertySelector } from './PropertySelector';
import { InventoryPropertyAssignment } from './InventoryPropertyAssignment';
import { RestockRequestsManager } from './RestockRequestsManager';

export const InventorySection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { rolesLoaded, hasAnyRole } = useAuth();
  const { selectedProperty } = usePropertyContext();
  
  // Only enable queries when roles are loaded
  const queriesEnabled = rolesLoaded && hasAnyRole();
  const { items, isLoading, updateItem, addItem } = useInventoryItems(queriesEnabled);
  const { data: categories = [] } = useInventoryCategories(queriesEnabled);
  
  // Get tab from URL params
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'inventory');
  
  // Email recipients state
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);

  // Load saved email settings on component mount
  useEffect(() => {
    const savedEmails = localStorage.getItem('inventory-email-notifications');
    if (savedEmails) {
      const emailSettings = JSON.parse(savedEmails);
      setEmailRecipients(emailSettings.emails || []);
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [expandAll, setExpandAll] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPropertyAssignment, setShowPropertyAssignment] = useState(false);
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

  // Show loading until roles are loaded and queries can run
  if (!rolesLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">
          {!rolesLoaded ? 'Loading permissions...' : 'Loading inventory...'}
        </span>
      </div>
    );
  }

  // Show message if user doesn't have the required role
  if (!hasAnyRole()) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You don't have permission to view inventory.</p>
      </div>
    );
  }

  // Filter items based on search, selected property, and stock status
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !selectedProperty || item.property_id === selectedProperty.id;
    
    let matchesStockFilter = true;
    if (stockFilter === 'low') {
      matchesStockFilter = item.current_quantity > 0 && item.current_quantity <= item.restock_threshold;
    } else if (stockFilter === 'out') {
      matchesStockFilter = item.current_quantity === 0;
    }
    
    return matchesSearch && matchesProperty && matchesStockFilter;
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

  const handleStockUpdate = (itemId: string, newQuantity: number) => {
    updateItem({
      id: itemId,
      current_quantity: Math.max(0, newQuantity),
    });
  };

  const handleExpandAll = () => {
    setExpandAll(true);
    setCollapseAll(false);
    setTimeout(() => setExpandAll(false), 100);
  };

  const handleCollapseAll = () => {
    setCollapseAll(true);
    setExpandAll(false);
    setTimeout(() => setCollapseAll(false), 100);
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
      property_id: selectedProperty?.id || null,
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

    if (emailRecipients.length === 0) {
      toast({
        title: 'No email recipients configured',
        description: 'Please add email recipients in the Email Notifications tab.',
        variant: 'destructive',
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
            category: item.category_name || 'Other',
            currentStock: item.current_quantity,
            restockLevel: item.restock_threshold,
            unit: item.unit || 'units',
            supplier: item.supplier || 'N/A',
            supplierUrl: item.reorder_link || item.amazon_link || '',
            cost: item.unit_price || 0,
            notes: item.notes || '',
          })),
          recipients: emailRecipients,
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

  const handleAssignToProperties = async (item: InventoryItem, propertyIds: string[]) => {
    try {
      // Create a copy for each selected property
      for (const propertyId of propertyIds) {
        const { category_id, category_name, ...itemData } = item;
        await addItem({
          ...itemData,
          property_id: propertyId,
          id: undefined, // Remove ID to create new item
          created_at: undefined,
          updated_at: undefined,
        } as any);
      }
      
      toast({
        title: 'Success',
        description: `Created ${propertyIds.length} cop${propertyIds.length === 1 ? 'y' : 'ies'} of "${item.name}"`,
      });
    } catch (error: any) {
      console.error('Error assigning to properties:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign item to properties',
        variant: 'destructive',
      });
    }
  };

  // Calculate counts based on filtered items (respects property and stock filter)
  const lowStockItems = filteredItems.filter(item => 
    item.current_quantity > 0 && item.current_quantity <= item.restock_threshold
  );
  const outOfStockItems = filteredItems.filter(item => item.current_quantity === 0);

  return (
    <div className="space-y-6">
      {/* Property Selector with Highlight */}
      <div className="p-4 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg">
        <PropertySelector />
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
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
          {/* Search and Filters */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={stockFilter} onValueChange={(value: 'all' | 'low' | 'out') => setStockFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock Only</SelectItem>
                <SelectItem value="out">Out of Stock Only</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate('/inventory-setup')}>
              Manage Categories
            </Button>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
            <Button onClick={handleExpandAll} variant="outline" size="sm">
              <ChevronsDownUp className="h-4 w-4 mr-2" />
              Expand All
            </Button>
            <Button onClick={handleCollapseAll} variant="outline" size="sm">
              <ChevronsUpDown className="h-4 w-4 mr-2" />
              Collapse All
            </Button>
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
            <>
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
                onAssignToProperty={() => setShowPropertyAssignment(true)}
              />
              
              {/* Property Assignment Dialog */}
              <InventoryPropertyAssignment
                item={editingItem}
                open={showPropertyAssignment}
                onOpenChange={setShowPropertyAssignment}
                onAssign={handleAssignToProperties}
              />
            </>
          )}

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-4">
              <InventoryTable
                items={filteredItems}
                onEditItem={setEditingItem}
                onUpdateStock={handleStockUpdate}
                expandAll={expandAll}
                collapseAll={collapseAll}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <RestockRequestsManager 
            items={items.filter(item => !selectedProperty || item.property_id === selectedProperty.id)}
            onUpdateItem={updateItem}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <EmailNotificationSettings onEmailSettingsChange={(emails) => {
            setEmailRecipients(emails.filter(email => email.trim() !== ''));
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};