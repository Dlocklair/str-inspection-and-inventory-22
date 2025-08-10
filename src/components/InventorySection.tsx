import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Save, X, Trash2, Package2, AlertTriangle, CheckCircle, CalendarIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  restockLevel: number;
  unit: string;
  supplier: string;
  cost: number;
  notes: string;
  lastUpdated: string;
  restockRequested: boolean;
  requestDate?: string;
}

interface RestockRequest {
  id: string;
  itemId: string;
  itemName: string;
  requestedQuantity: number;
  requestDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'ordered' | 'received';
}

export const InventorySection = () => {
  const { toast } = useToast();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'All-Purpose Cleaner',
      category: 'Cleaning Supplies',
      currentStock: 5,
      restockLevel: 10,
      unit: 'bottles',
      supplier: 'CleanCorp',
      cost: 12.99,
      notes: 'Use for general surface cleaning',
      lastUpdated: new Date().toISOString(),
      restockRequested: true,
      requestDate: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      name: 'Toilet Paper',
      category: 'Bathroom Supplies',
      currentStock: 20,
      restockLevel: 15,
      unit: 'rolls',
      supplier: 'Paper Plus',
      cost: 1.50,
      notes: '2-ply premium quality',
      lastUpdated: new Date().toISOString(),
      restockRequested: false
    }
  ]);

  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: 0,
    restockLevel: 0,
    unit: '',
    supplier: '',
    cost: 0,
    notes: ''
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<InventoryItem>>({});
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedInventory = localStorage.getItem('inventory-items');
    const savedRequests = localStorage.getItem('restock-requests');
    
    if (savedInventory) {
      setInventoryItems(JSON.parse(savedInventory));
    }
    
    if (savedRequests) {
      setRestockRequests(JSON.parse(savedRequests));
    }
  }, []);

  // Save inventory items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('inventory-items', JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  // Save restock requests to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('restock-requests', JSON.stringify(restockRequests));
  }, [restockRequests]);

  const addNewItem = (closeForm = false) => {
    if (!newItem.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an item name.",
        variant: "destructive"
      });
      return;
    }

    const item: InventoryItem = {
      id: Date.now().toString(),
      ...newItem,
      lastUpdated: new Date().toISOString(),
      restockRequested: newItem.currentStock <= newItem.restockLevel,
      requestDate: newItem.currentStock <= newItem.restockLevel ? new Date().toISOString().split('T')[0] : undefined
    };

    setInventoryItems(prev => [...prev, item]);
    setNewItem({
      name: '',
      category: '',
      currentStock: 0,
      restockLevel: 0,
      unit: '',
      supplier: '',
      cost: 0,
      notes: ''
    });

    if (closeForm) {
      setShowAddForm(false);
    }

    toast({
      title: "Item added",
      description: `${item.name} has been added to inventory.`,
    });
  };

  const deleteItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item deleted",
      description: "Item has been removed from inventory.",
    });
  };

  const startEditing = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditingData({ ...item });
  };

  const saveEdit = () => {
    if (editingItem && editingData) {
      const updatedItem = {
        ...editingData,
        lastUpdated: new Date().toISOString(),
        restockRequested: (editingData.currentStock || 0) <= (editingData.restockLevel || 0),
        requestDate: (editingData.currentStock || 0) <= (editingData.restockLevel || 0) 
          ? new Date().toISOString().split('T')[0] 
          : undefined
      };
      
      setInventoryItems(prev => prev.map(item => 
        item.id === editingItem 
          ? { ...item, ...updatedItem }
          : item
      ));
      setEditingItem(null);
      setEditingData({});
      
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingData({});
  };

  const createRestockRequest = (item: InventoryItem) => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a request date.",
        variant: "destructive"
      });
      return;
    }

    const suggestedQuantity = Math.max(item.restockLevel - item.currentStock, item.restockLevel);
    
    const request: RestockRequest = {
      id: Date.now().toString(),
      itemId: item.id,
      itemName: item.name,
      requestedQuantity: suggestedQuantity,
      requestDate: format(selectedDate, 'yyyy-MM-dd'),
      reason: `Stock level (${item.currentStock}) below restock level (${item.restockLevel})`,
      status: 'pending'
    };

    setRestockRequests(prev => [...prev, request]);
    setSelectedDate(undefined);

    toast({
      title: "Restock request created",
      description: `Request for ${item.name} has been created.`,
    });
  };

  const updateRequestStatus = (requestId: string, status: RestockRequest['status']) => {
    setRestockRequests(prev => prev.map(request =>
      request.id === requestId 
        ? { ...request, status }
        : request
    ));

    toast({
      title: "Status updated",
      description: `Request status has been updated to ${status}.`,
    });
  };

  const deleteRequest = (requestId: string) => {
    setRestockRequests(prev => prev.filter(request => request.id !== requestId));
    toast({
      title: "Request deleted",
      description: "Restock request has been deleted.",
    });
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return { status: 'out', color: 'destructive', icon: AlertTriangle };
    if (item.currentStock <= item.restockLevel) return { status: 'low', color: 'destructive', icon: AlertTriangle };
    return { status: 'good', color: 'default', icon: CheckCircle };
  };

  const getStatusBadgeColor = (status: RestockRequest['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'default';
      case 'ordered': return 'secondary';
      case 'received': return 'success';
      default: return 'default';
    }
  };

  const handleEmailSettingsChange = (emails: string[]) => {
    console.log('Email settings updated:', emails);
    // The EmailNotificationSettings component already handles localStorage saving
    // This callback can be used for additional logic if needed in the future
  };

  const sendRestockRequests = () => {
    const itemsNeedingRestock = inventoryItems.filter(item => 
      item.currentStock <= item.restockLevel && item.restockRequested
    );

    if (itemsNeedingRestock.length === 0) {
      toast({
        title: "No restock requests",
        description: "No items currently need restocking.",
        variant: "default"
      });
      return;
    }

    // Get email settings from localStorage
    const savedEmails = localStorage.getItem('inventory-email-notifications');
    const emailList = savedEmails ? JSON.parse(savedEmails).emails : [];

    // Create email content
    const emailSubject = `Inventory Restock Request - ${itemsNeedingRestock.length} Item${itemsNeedingRestock.length > 1 ? 's' : ''} Need Restocking`;
    
    const emailBody = `Dear Supplier,

We need to restock the following inventory items:

${itemsNeedingRestock.map(item => 
  `• ${item.name} (${item.category})
  Current Stock: ${item.currentStock} ${item.unit}
  Restock Level: ${item.restockLevel} ${item.unit}
  Supplier: ${item.supplier}
  Cost per Unit: $${item.cost.toFixed(2)}`
).join('\n\n')}

Please process these restock orders at your earliest convenience.

Thank you,
Inventory Management Team`;

    // Create mailto URL
    const emailRecipients = emailList.join(',');
    const mailtoUrl = `mailto:${emailRecipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Create restock requests for items that need them
    const newRequests = itemsNeedingRestock.map(item => ({
      id: Date.now().toString() + item.id,
      itemId: item.id,
      itemName: item.name,
      requestedQuantity: Math.max(item.restockLevel - item.currentStock, item.restockLevel),
      requestDate: formatDateShort(new Date().toISOString()),
      reason: `Stock level (${item.currentStock}) below restock level (${item.restockLevel})`,
      status: 'pending' as const
    }));

    setRestockRequests(prev => [...prev, ...newRequests]);

    // Open email client
    if (emailList.length > 0) {
      window.open(mailtoUrl, '_blank');
      toast({
        title: "Email prepared",
        description: `Email with ${itemsNeedingRestock.length} restock request(s) prepared and requests added to table.`,
      });
    } else {
      toast({
        title: "No email addresses configured",
        description: `${itemsNeedingRestock.length} restock request(s) added to table. Please configure email addresses in Email Notifications tab.`,
        variant: "destructive"
      });
    }
  };

  const getUniqueCategories = () => {
    const categories = inventoryItems.map(item => item.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
  };

  // Sort inventory items by category
  const sortedInventoryItems = [...inventoryItems].sort((a, b) => 
    (a.category || '').localeCompare(b.category || '')
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Inventory Item
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Inventory Items
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Restock Requests
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Email Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="mt-4">
          <div className="space-y-6">

            {/* Add New Item Form */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Inventory Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    />
                     <Select 
                       value={newItem.category} 
                       onValueChange={(value) => {
                         if (value === 'add-new') {
                           setNewCategory('');
                         } else {
                           setNewItem(prev => ({ ...prev, category: value }));
                         }
                       }}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Select category" />
                       </SelectTrigger>
                       <SelectContent>
                         {getUniqueCategories().map(category => (
                           <SelectItem key={category} value={category}>
                             {category}
                           </SelectItem>
                         ))}
                         <SelectItem value="add-new">+ Add new category</SelectItem>
                       </SelectContent>
                     </Select>
                     {newItem.category === '' && (
                       <Input
                         placeholder="Enter new category"
                         value={newCategory}
                         onChange={(e) => {
                           setNewCategory(e.target.value);
                           setNewItem(prev => ({ ...prev, category: e.target.value }));
                         }}
                       />
                     )}
                    <Input
                      type="number"
                      placeholder="Current stock"
                      value={newItem.currentStock || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                    />
                    <Input
                      type="number"
                      placeholder="Restock level"
                      value={newItem.restockLevel || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, restockLevel: Number(e.target.value) }))}
                    />
                    <Input
                      placeholder="Unit (e.g., bottles, rolls)"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    />
                    <Input
                      placeholder="Supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Cost per unit"
                      value={newItem.cost || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="mt-4">
                    <Textarea
                      placeholder="Notes (optional)"
                      value={newItem.notes}
                      onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => addNewItem(false)} className="flex items-center gap-2">
                      Accept and Next
                    </Button>
                    <Button onClick={() => addNewItem(true)} variant="outline" className="flex items-center gap-2">
                      Accept and Close
                    </Button>
                    <Button onClick={() => setShowAddForm(false)} variant="ghost" className="flex items-center gap-2">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory Items List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Inventory</CardTitle>
                  <Button 
                    onClick={sendRestockRequests}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Restock Requests
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">Category</th>
                         <th className="text-center p-2">Stock</th>
                         <th className="text-center p-2">Restock<br/>Level</th>
                        <th className="text-left p-2">Unit</th>
                        <th className="text-left p-2">Supplier</th>
                        <th className="text-left p-2">Cost</th>
                        <th className="text-center p-2">Request</th>
                        <th className="text-center p-2">Date</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                     <tbody>
                       {sortedInventoryItems.map(item => {
                        const stockStatus = getStockStatus(item);
                        const StatusIcon = stockStatus.icon;
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <Badge 
                                variant={stockStatus.color as any} 
                                className={cn(
                                  "flex items-center gap-1 w-fit",
                                  stockStatus.status === 'low' && "bg-red-500 hover:bg-red-600 text-white",
                                  stockStatus.status === 'good' && "bg-green-500 hover:bg-green-600 text-white"
                                )}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {stockStatus.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {editingItem === item.id ? (
                                <Input
                                  value={editingData.name || ''}
                                  onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                                  className="text-sm"
                                />
                              ) : (
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.notes && <div className="text-sm text-muted-foreground">{item.notes}</div>}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              {editingItem === item.id ? (
                                <Input
                                  value={editingData.category || ''}
                                  onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                                  className="text-sm"
                                />
                              ) : (
                                item.category
                              )}
                            </td>
                             <td className="p-2 text-center">
                               {editingItem === item.id ? (
                                 <Input
                                   type="number"
                                   value={editingData.currentStock || ''}
                                   onChange={(e) => setEditingData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                                   className="text-sm w-20 text-center"
                                 />
                               ) : (
                                 <span className="select-text cursor-text">{item.currentStock}</span>
                               )}
                             </td>
                             <td className="p-2 text-center select-none">
                               {editingItem === item.id ? (
                                 <Input
                                   type="number"
                                   value={editingData.restockLevel || ''}
                                   onChange={(e) => setEditingData(prev => ({ ...prev, restockLevel: Number(e.target.value) }))}
                                   className="text-sm w-20 text-center"
                                 />
                               ) : (
                                 item.restockLevel
                               )}
                             </td>
                            <td className="p-2">
                              {editingItem === item.id ? (
                                <Input
                                  value={editingData.unit || ''}
                                  onChange={(e) => setEditingData(prev => ({ ...prev, unit: e.target.value }))}
                                  className="text-sm"
                                />
                              ) : (
                                item.unit
                              )}
                            </td>
                            <td className="p-2">
                              {editingItem === item.id ? (
                                <Input
                                  value={editingData.supplier || ''}
                                  onChange={(e) => setEditingData(prev => ({ ...prev, supplier: e.target.value }))}
                                  className="text-sm"
                                />
                              ) : (
                                item.supplier
                              )}
                            </td>
                            <td className="p-2">
                              {editingItem === item.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingData.cost || ''}
                                  onChange={(e) => setEditingData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                                  className="text-sm w-24"
                                />
                              ) : (
                                `$${item.cost.toFixed(2)}`
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <Checkbox
                                id={`request-${item.id}`}
                                checked={item.restockRequested}
                                onCheckedChange={(checked) => {
                                  setInventoryItems(prev => prev.map(prevItem => 
                                    prevItem.id === item.id 
                                      ? { 
                                          ...prevItem, 
                                          restockRequested: !!checked,
                                          requestDate: checked ? new Date().toISOString().split('T')[0] : undefined
                                        }
                                      : prevItem
                                  ));
                                }}
                                className="mx-auto"
                              />
                            </td>
                             <td className="p-2 text-center">
                               {formatDateShort(item.requestDate || '')}
                             </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                {editingItem === item.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={saveEdit}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditing(item)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteItem(item.id)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Restock Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {restockRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">Request Date</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restockRequests.map(request => (
                        <tr key={request.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{request.itemName}</td>
                          <td className="p-2">{request.requestedQuantity}</td>
                          <td className="p-2">{formatDateShort(request.requestDate)}</td>
                          <td className="p-2 text-sm">{request.reason}</td>
                          <td className="p-2">
                            <Badge variant={getStatusBadgeColor(request.status) as any}>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                                disabled={request.status !== 'pending'}
                                className="text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteRequest(request.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No restock requests yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <EmailNotificationSettings onEmailSettingsChange={handleEmailSettingsChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
