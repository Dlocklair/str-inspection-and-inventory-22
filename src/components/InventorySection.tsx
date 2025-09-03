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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Save, X, Trash2, Package2, AlertTriangle, CheckCircle, CalendarIcon, Send, Home, ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { EmailNotificationSettings } from './EmailNotificationSettings';
import { InventoryEditForm } from './InventoryEditForm';
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
  supplierUrl?: string;
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
  supplierUrl?: string;
}
export const InventorySection = () => {
  const {
    toast
  } = useToast();
  const {
    profile
  } = useAuth();
  const navigate = useNavigate();

  // Debug: Log the profile to check the role
  console.log('InventorySection - Profile:', profile, 'Role:', profile?.role);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
  // Linen and Bedding
  {
    id: '1',
    name: 'Bed Sheets - Queen',
    category: 'Linen and Bedding',
    currentStock: 8,
    restockLevel: 6,
    unit: 'sets',
    supplier: 'LinenCorp',
    cost: 45.99,
    notes: 'White cotton blend',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '2',
    name: 'Bed Sheets - King',
    category: 'Linen and Bedding',
    currentStock: 4,
    restockLevel: 4,
    unit: 'sets',
    supplier: 'LinenCorp',
    cost: 52.99,
    notes: 'White cotton blend',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '3',
    name: 'Pillowcases',
    category: 'Linen and Bedding',
    currentStock: 12,
    restockLevel: 8,
    unit: 'pairs',
    supplier: 'LinenCorp',
    cost: 18.99,
    notes: 'Standard size white',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '4',
    name: 'Comforters - Queen',
    category: 'Linen and Bedding',
    currentStock: 3,
    restockLevel: 3,
    unit: 'pieces',
    supplier: 'BeddingPlus',
    cost: 89.99,
    notes: 'All-season down alternative',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '5',
    name: 'Comforters - King',
    category: 'Linen and Bedding',
    currentStock: 2,
    restockLevel: 2,
    unit: 'pieces',
    supplier: 'BeddingPlus',
    cost: 99.99,
    notes: 'All-season down alternative',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  },
  // Towels & Bath
  {
    id: '6',
    name: 'Bath Towels',
    category: 'Towels & Bath',
    currentStock: 15,
    restockLevel: 12,
    unit: 'pieces',
    supplier: 'TowelCorp',
    cost: 24.99,
    notes: 'White 100% cotton',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '7',
    name: 'Hand Towels',
    category: 'Towels & Bath',
    currentStock: 10,
    restockLevel: 8,
    unit: 'pieces',
    supplier: 'TowelCorp',
    cost: 14.99,
    notes: 'White 100% cotton',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '8',
    name: 'Washcloths',
    category: 'Towels & Bath',
    currentStock: 20,
    restockLevel: 15,
    unit: 'pieces',
    supplier: 'TowelCorp',
    cost: 8.99,
    notes: 'White 100% cotton',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '9',
    name: 'Shampoo & Conditioner',
    category: 'Towels & Bath',
    currentStock: 6,
    restockLevel: 8,
    unit: 'bottles',
    supplier: 'HotelSupply',
    cost: 12.99,
    notes: 'Travel size bottles',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }, {
    id: '10',
    name: 'Body Wash',
    category: 'Towels & Bath',
    currentStock: 4,
    restockLevel: 6,
    unit: 'bottles',
    supplier: 'HotelSupply',
    cost: 9.99,
    notes: 'Travel size bottles',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  },
  // Consumables
  {
    id: '11',
    name: 'Toilet Paper',
    category: 'Consumables',
    currentStock: 24,
    restockLevel: 20,
    unit: 'rolls',
    supplier: 'Paper Plus',
    cost: 1.50,
    notes: '2-ply premium quality',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '12',
    name: 'Paper Towels',
    category: 'Consumables',
    currentStock: 8,
    restockLevel: 10,
    unit: 'rolls',
    supplier: 'Paper Plus',
    cost: 3.99,
    notes: 'Select-a-size',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }, {
    id: '13',
    name: 'Trash Bags - Kitchen',
    category: 'Consumables',
    currentStock: 2,
    restockLevel: 4,
    unit: 'boxes',
    supplier: 'CleanCorp',
    cost: 15.99,
    notes: '13 gallon, drawstring',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }, {
    id: '14',
    name: 'Trash Bags - Bathroom',
    category: 'Consumables',
    currentStock: 3,
    restockLevel: 3,
    unit: 'boxes',
    supplier: 'CleanCorp',
    cost: 12.99,
    notes: '8 gallon, drawstring',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '15',
    name: 'Coffee K-Cups',
    category: 'Consumables',
    currentStock: 30,
    restockLevel: 24,
    unit: 'pods',
    supplier: 'CoffeeSupply',
    cost: 0.75,
    notes: 'Medium roast variety pack',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  },
  // Cleaning Supplies
  {
    id: '16',
    name: 'All-Purpose Cleaner',
    category: 'Cleaning Supplies',
    currentStock: 5,
    restockLevel: 8,
    unit: 'bottles',
    supplier: 'CleanCorp',
    cost: 12.99,
    notes: 'Use for general surface cleaning',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }, {
    id: '17',
    name: 'Dishwasher Detergent',
    category: 'Cleaning Supplies',
    currentStock: 3,
    restockLevel: 4,
    unit: 'boxes',
    supplier: 'CleanCorp',
    cost: 8.99,
    notes: 'Powder form, 45 count',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }, {
    id: '18',
    name: 'Laundry Detergent',
    category: 'Cleaning Supplies',
    currentStock: 2,
    restockLevel: 3,
    unit: 'bottles',
    supplier: 'CleanCorp',
    cost: 16.99,
    notes: 'Free & clear, 64 loads',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  },
  // Kitchen Supplies
  {
    id: '19',
    name: 'Sponges',
    category: 'Kitchen Supplies',
    currentStock: 12,
    restockLevel: 10,
    unit: 'pieces',
    supplier: 'KitchenCorp',
    cost: 2.99,
    notes: 'Non-scratch scrub sponges',
    lastUpdated: new Date().toISOString(),
    restockRequested: false
  }, {
    id: '20',
    name: 'Dish Soap',
    category: 'Kitchen Supplies',
    currentStock: 4,
    restockLevel: 6,
    unit: 'bottles',
    supplier: 'KitchenCorp',
    cost: 4.99,
    notes: 'Concentrated formula',
    lastUpdated: new Date().toISOString(),
    restockRequested: true,
    requestDate: new Date().toISOString().split('T')[0]
  }]);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: 0,
    restockLevel: 0,
    unit: '',
    supplier: '',
    supplierUrl: '',
    cost: 0,
    notes: ''
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<InventoryItem>>({});
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{
    [category: string]: boolean;
  }>({});
  const [autoDeleteTimeouts, setAutoDeleteTimeouts] = useState<{
    [requestId: string]: NodeJS.Timeout;
  }>({});
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(autoDeleteTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [autoDeleteTimeouts]);
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
      supplierUrl: '',
      cost: 0,
      notes: ''
    });
    setShowNewCategoryInput(false);
    setNewCategory('');
    if (closeForm) {
      setShowAddForm(false);
    }
    toast({
      title: "Item added",
      description: `${item.name} has been added to inventory.`
    });
  };
  const deleteItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item deleted",
      description: "Item has been removed from inventory."
    });
  };
  const startEditing = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditingData({
      ...item
    });
    setShowAddForm(false); // Hide add form when editing
  };
  const handleEditSave = (updatedItem: InventoryItem) => {
    setInventoryItems(prev => prev.map(item => item.id === editingItem ? updatedItem : item));
    setEditingItem(null);
    setEditingData({});
  };
  const handleEditCancel = () => {
    setEditingItem(null);
    setEditingData({});
  };
  const saveEdit = () => {
    if (editingItem && editingData) {
      const updatedItem = {
        ...editingData,
        lastUpdated: new Date().toISOString(),
        restockRequested: (editingData.currentStock || 0) <= (editingData.restockLevel || 0),
        requestDate: (editingData.currentStock || 0) <= (editingData.restockLevel || 0) ? new Date().toISOString().split('T')[0] : undefined
      };
      setInventoryItems(prev => prev.map(item => item.id === editingItem ? {
        ...item,
        ...updatedItem
      } : item));
      setEditingItem(null);
      setEditingData({});
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully."
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
      description: `Request for ${item.name} has been created.`
    });
  };
  const updateRequestStatus = (requestId: string, newStatus: RestockRequest['status']) => {
    setRestockRequests(prev => prev.map(request => request.id === requestId ? {
      ...request,
      status: newStatus
    } : request));

    // Auto-delete after 3 seconds if marked as received
    if (newStatus === 'received') {
      const timeout = setTimeout(() => {
        setRestockRequests(prev => prev.filter(request => request.id !== requestId));
        toast({
          title: "Request completed",
          description: "Received item has been removed from restock requests."
        });
      }, 3000);
      setAutoDeleteTimeouts(prev => ({
        ...prev,
        [requestId]: timeout
      }));
    } else {
      // Clear timeout if status changed from received to something else
      if (autoDeleteTimeouts[requestId]) {
        clearTimeout(autoDeleteTimeouts[requestId]);
        setAutoDeleteTimeouts(prev => {
          const {
            [requestId]: removed,
            ...rest
          } = prev;
          return rest;
        });
      }
    }
  };
  const deleteRequest = (requestId: string) => {
    setRestockRequests(prev => prev.filter(request => request.id !== requestId));
    toast({
      title: "Request deleted",
      description: "Restock request has been deleted."
    });
  };
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return {
      status: 'out',
      color: 'destructive',
      icon: AlertTriangle
    };
    if (item.currentStock <= item.restockLevel) return {
      status: 'low',
      color: 'destructive',
      icon: AlertTriangle
    };
    return {
      status: 'good',
      color: 'default',
      icon: CheckCircle
    };
  };
  const getStatusBadgeColor = (status: RestockRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'default';
      case 'ordered':
        return 'secondary';
      case 'received':
        return 'success';
      default:
        return 'default';
    }
  };
  const handleEmailSettingsChange = (emails: string[]) => {
    console.log('Email settings updated:', emails);
    // The EmailNotificationSettings component already handles localStorage saving
    // This callback can be used for additional logic if needed in the future
  };
  const sendRestockRequests = () => {
    const itemsNeedingRestock = inventoryItems.filter(item => item.restockRequested);
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

${itemsNeedingRestock.map(item => `• ${item.name} (${item.category})
  Current Stock: ${item.currentStock} ${item.unit}
  Restock Level: ${item.restockLevel} ${item.unit}
  Supplier: ${item.supplier}
  Cost per Unit: $${item.cost.toFixed(2)}${item.supplierUrl ? `
  Product URL: ${item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`}` : ''}`).join('\n\n')}

Please process these restock orders at your earliest convenience.

Thank you,
Inventory Management Team`;

    // Create mailto URL
    const emailRecipients = emailList.join(',');
    const mailtoUrl = `mailto:${emailRecipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Create restock requests for items that need them, but check for duplicates first
    const today = formatDateShort(new Date().toISOString());
    const newRequests = itemsNeedingRestock.filter(item => {
      // Check if request with same date already exists
      return !restockRequests.some(existing => existing.itemId === item.id && existing.requestDate === today);
    }).map(item => ({
      id: Date.now().toString() + item.id,
      itemId: item.id,
      itemName: item.name,
      supplierUrl: item.supplierUrl,
      requestedQuantity: Math.max(item.restockLevel - item.currentStock, item.restockLevel),
      requestDate: today,
      reason: `Stock level (${item.currentStock}) below restock level (${item.restockLevel})`,
      status: 'pending' as const
    }));
    if (newRequests.length > 0) {
      setRestockRequests(prev => [...prev, ...newRequests]);
    }

    // Open email client
    if (emailList.length > 0) {
      window.open(mailtoUrl, '_blank');
      toast({
        title: "Email prepared",
        description: `Email with ${itemsNeedingRestock.length} restock request(s) prepared. ${newRequests.length} new requests added to table.`
      });
    } else {
      toast({
        title: "No email addresses configured",
        description: `${newRequests.length} new restock request(s) added to table. Please configure email addresses in Email Notifications tab.`,
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
  const sortedInventoryItems = [...inventoryItems].sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  const [searchTerm, setSearchTerm] = useState('');

  // Filter inventory items based on search term
  const filteredInventoryItems = inventoryItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()) || item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="w-full">
      {/* Search Box and Add Button - Top Right */}
      <div className="flex items-center justify-end gap-4 mb-6">
        <div className="max-w-md">
          <Input placeholder="Search Inventory" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
        </div>
        {!showAddForm && !editingItem && <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Inventory Item
          </Button>}
      </div>

      {/* Show edit form only when editing */}
      {editingItem && editingData.id && <div className="mb-6">
          <InventoryEditForm item={editingData as InventoryItem} onSave={handleEditSave} onCancel={handleEditCancel} categories={getUniqueCategories()} />
        </div>}
      
      {/* Show add form only when adding */}
      {showAddForm && !editingItem && <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Add New Inventory Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Category - First field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-600">Category</label>
                   <Select value={newItem.category} onValueChange={value => {
                if (value === 'add-new-category') {
                  setShowNewCategoryInput(true);
                } else {
                  setShowNewCategoryInput(false);
                  setNewItem(prev => ({
                    ...prev,
                    category: value
                  }));
                }
              }}>
                     <SelectTrigger>
                       <SelectValue placeholder="Select product category" />
                     </SelectTrigger>
                     <SelectContent>
                       {getUniqueCategories().map(category => <SelectItem key={category} value={category}>
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
                </div>
                      
                        {/* Item - Second field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Item Name</label>
                         <Input placeholder="Enter the name of the inventory item" value={newItem.name} onChange={e => setNewItem(prev => ({
                ...prev,
                name: e.target.value
              }))} />
                       </div>
                       
                        {/* Units - Third field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Unit</label>
                         <Input placeholder="How items are counted (bottles, rolls, boxes, etc.)" value={newItem.unit} onChange={e => setNewItem(prev => ({
                ...prev,
                unit: e.target.value
              }))} />
                       </div>
                       
                        {/* Supplier - Fourth field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Supplier</label>
                         <Input placeholder="Name of supplier or vendor" value={newItem.supplier} onChange={e => setNewItem(prev => ({
                ...prev,
                supplier: e.target.value
              }))} />
                       </div>
                       
                        {/* URL - Fifth field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Supplier URL</label>
                         <Input placeholder="Website URL for ordering this item" value={newItem.supplierUrl || ''} onChange={e => setNewItem(prev => ({
                ...prev,
                supplierUrl: e.target.value
              }))} />
                       </div>
                       
                        {/* Cost per unit - Sixth field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Cost per Unit</label>
                         <Input type="number" step="0.01" placeholder="Price per individual unit ($)" value={newItem.cost || ''} onChange={e => setNewItem(prev => ({
                ...prev,
                cost: Number(e.target.value)
              }))} />
                       </div>
                       
                        {/* Restock level - Seventh field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Restock Level</label>
                         <Input type="number" placeholder="Minimum quantity before reordering" value={newItem.restockLevel || ''} onChange={e => setNewItem(prev => ({
                ...prev,
                restockLevel: Number(e.target.value)
              }))} />
                       </div>
                       
                        {/* Current stock */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-600">Current Stock</label>
                         <Input type="number" placeholder="How many you have right now" value={newItem.currentStock || ''} onChange={e => setNewItem(prev => ({
                ...prev,
                currentStock: Number(e.target.value)
              }))} />
                       </div>
                    </div>
                  
                    {/* New category input if needed */}
                    {showNewCategoryInput && <div className="mt-4">
                        <label className="text-sm font-medium block mb-2">New Category Name</label>
                        <Input placeholder="Enter new category name" value={newCategory} onChange={e => {
              setNewCategory(e.target.value);
              setNewItem(prev => ({
                ...prev,
                category: e.target.value
              }));
            }} autoFocus />
                      </div>}
                   
                    {/* Notes - Last field */}
                    <div className="mt-4">
                      <label className="text-sm font-medium text-blue-600 block mb-2">Notes</label>
                     <Textarea placeholder="Additional notes, special instructions, or details about this item" value={newItem.notes} onChange={e => setNewItem(prev => ({
              ...prev,
              notes: e.target.value
            }))} rows={2} />
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
                </div>
              </CardContent>
            </Card>}
      
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Current Inventory
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

            {/* Inventory Items List - Only show when not adding or editing */}
            {!showAddForm && !editingItem && <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Current Inventory</CardTitle>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setUpdateMode(!updateMode)} className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        {updateMode ? 'Exit Update Mode' : 'Update Inventory Levels'}
                      </Button>
                    <Button onClick={sendRestockRequests} className="bg-cyan hover:bg-cyan/90 text-cyan-foreground flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Email Restock Requests
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                   {getUniqueCategories().map(category => {
                  const categoryItems = filteredInventoryItems.filter(item => item.category === category);
                  const isExpanded = expandedCategories[category] !== false; // Default to expanded

                  return <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => toggleCategory(category)}>
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                             <h3 className="text-lg font-semibold text-cyan border-b border-border pb-2">
                               {category} ({categoryItems.length} items)
                             </h3>
                          </div>
                        </div>
                        
                        {isExpanded && <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                               <thead>
                                 <tr className="border-b bg-muted/30">
                                   <th className="text-left p-1 text-xs sticky left-0 bg-muted/30 z-10 min-w-[120px]">Item</th>
                                   <th className="text-center p-1 text-xs w-16">Status</th>
                                   <th className="text-center p-1 text-xs w-16">Stock</th>
                                   <th className="text-center p-1 text-xs w-20">Restock Level</th>
                                   <th className="text-center p-1 text-xs w-12">Unit</th>
                                   <th className="text-center p-1 text-xs w-20">Supplier</th>
                                   <th className="text-center p-1 text-xs w-20">Product Link</th>
                                   <th className="text-center p-1 text-xs w-16">Cost</th>
                                   <th className="text-center p-1 text-xs w-12">Request</th>
                                   <th className="text-center p-1 text-xs w-16">Date</th>
                                   <th className="text-center p-1 text-xs w-20">Actions</th>
                                 </tr>
                               </thead>
                              <tbody>
                                {categoryItems.map(item => {
                            const stockStatus = getStockStatus(item);
                            const StatusIcon = stockStatus.icon;
                            return <tr key={item.id} className="border-b hover:bg-muted/50">
                                     <td className="p-1 sticky left-0 bg-background z-10 min-w-[120px]">
                                       {editingItem === item.id ? <Input value={editingData.name || ''} onChange={e => setEditingData(prev => ({
                                  ...prev,
                                  name: e.target.value
                                }))} className="text-sm" /> : <div>
                                          <div className="font-medium text-sm text-white">
                                            {item.name}
                                          </div>
                                         {item.notes && <div className="text-xs text-muted-foreground line-clamp-1">{item.notes}</div>}
                                       </div>}
                                     </td>
                                     <td className="p-1 text-center w-16">
                                       <div className="flex justify-center">
                                         <Badge variant={stockStatus.color as any} className={cn("flex items-center gap-1 w-fit text-xs", stockStatus.status === 'low' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground", stockStatus.status === 'good' && "bg-success hover:bg-success/90 text-success-foreground")}>
                                           <StatusIcon className="h-3 w-3" />
                                           {stockStatus.status}
                                         </Badge>
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-16">
                                       <div className="flex justify-center">
                                         {updateMode ? <Input type="number" value={item.currentStock} onChange={e => {
                                    const newStock = Number(e.target.value);
                                    setInventoryItems(prev => prev.map(prevItem => prevItem.id === item.id ? {
                                      ...prevItem,
                                      currentStock: newStock,
                                      lastUpdated: new Date().toISOString(),
                                      restockRequested: newStock <= prevItem.restockLevel,
                                      requestDate: newStock <= prevItem.restockLevel ? new Date().toISOString().split('T')[0] : undefined
                                    } : prevItem));
                                  }} className="text-sm w-12 text-center" onFocus={e => e.target.select()} style={{
                                    MozAppearance: 'textfield'
                                  }} /> : <span className="text-sm">{item.currentStock}</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-20">
                                       <div className="flex justify-center">
                                         {editingItem === item.id ? <Input type="number" value={editingData.restockLevel || ''} onChange={e => setEditingData(prev => ({
                                    ...prev,
                                    restockLevel: Number(e.target.value)
                                  }))} className="text-sm w-16 text-center" /> : <span className="text-sm">{item.restockLevel}</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-12">
                                       <div className="flex justify-center">
                                         {editingItem === item.id ? <Input value={editingData.unit || ''} onChange={e => setEditingData(prev => ({
                                    ...prev,
                                    unit: e.target.value
                                  }))} className="text-sm w-10 text-center" /> : <span className="text-sm">{item.unit}</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-20">
                                       <div className="flex justify-center">
                                         {editingItem === item.id ? <Input value={editingData.supplier || ''} onChange={e => setEditingData(prev => ({
                                    ...prev,
                                    supplier: e.target.value
                                  }))} className="text-sm w-16 text-center" /> : <span className="text-sm">{item.supplier}</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-20">
                                       <div className="flex justify-center">
                                         {item.supplierUrl ? <a href={item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan hover:text-cyan/80 underline">Link</a> : <span className="text-xs text-muted-foreground">-</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-16">
                                       <div className="flex justify-center">
                                         {editingItem === item.id ? <Input type="number" step="0.01" value={editingData.cost || ''} onChange={e => setEditingData(prev => ({
                                    ...prev,
                                    cost: Number(e.target.value)
                                  }))} className="text-sm w-14 text-center" /> : <span className="text-sm">${item.cost.toFixed(2)}</span>}
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-12">
                                       <div className="flex justify-center">
                                         <Checkbox id={`request-${item.id}`} checked={item.restockRequested} onCheckedChange={checked => {
                                    setInventoryItems(prev => prev.map(prevItem => prevItem.id === item.id ? {
                                      ...prevItem,
                                      restockRequested: !!checked,
                                      requestDate: checked ? new Date().toISOString().split('T')[0] : undefined
                                    } : prevItem));
                                  }} />
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-16">
                                       <div className="flex justify-center">
                                         <span className="text-xs">{formatDateShort(item.lastUpdated)}</span>
                                       </div>
                                     </td>
                                     <td className="p-1 text-center w-20">
                                       <div className="flex gap-1 justify-center">
                                         {editingItem === item.id ? <>
                                           <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
                                             <Save className="h-3 w-3" />
                                           </Button>
                                           <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
                                             <X className="h-3 w-3" />
                                           </Button>
                                         </> : <>
                                           <Button size="sm" variant="ghost" onClick={() => startEditing(item)} className="h-6 w-6 p-0">
                                             <Edit className="h-3 w-3" />
                                           </Button>
                                           {/* Only show delete button for owners */}
                                           {profile?.role === 'owner' && <AlertDialog>
                                               <AlertDialogTrigger asChild>
                                                 <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                                   <Trash2 className="h-3 w-3" />
                                                 </Button>
                                               </AlertDialogTrigger>
                                               <AlertDialogContent>
                                                 <AlertDialogHeader>
                                                   <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                                                   <AlertDialogDescription>
                                                     Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                                   </AlertDialogDescription>
                                                 </AlertDialogHeader>
                                                 <AlertDialogFooter>
                                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                   <AlertDialogAction onClick={() => deleteItem(item.id)}>Delete</AlertDialogAction>
                                                 </AlertDialogFooter>
                                               </AlertDialogContent>
                                             </AlertDialog>}
                                         </>}
                                       </div>
                                     </td>
                                  </tr>;
                          })}
                              </tbody>
                            </table>
                          </div>}
                      </div>;
                })}
                </div>
              </CardContent>
            </Card>}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Restock Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {restockRequests.length > 0 ? <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-center p-2">Quantity</th>
                        <th className="text-left p-2">Request Date</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restockRequests.map(request => <tr key={request.id} className={cn("border-b hover:bg-muted/50", request.status === 'pending' && "bg-destructive/5", request.status === 'approved' && "bg-success/5")}>
                          <td className="p-2 text-center">
                            <div className="flex justify-center">
                              {request.itemName}
                              {request.supplierUrl && <a href={request.supplierUrl.startsWith('http') ? request.supplierUrl : `https://${request.supplierUrl}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs">
                                  Order Here
                                </a>}
                            </div>
                          </td>
                          <td className="p-2 text-center">{request.requestedQuantity}</td>
                          <td className="p-2">{formatDateShort(request.requestDate)}</td>
                          <td className="p-2 text-sm">{request.reason}</td>
                          <td className="p-2">
                            {['approved', 'ordered', 'received'].includes(request.status) ? <Select value={request.status} onValueChange={(value: RestockRequest['status']) => updateRequestStatus(request.id, value)}>
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="ordered">Ordered</SelectItem>
                                  <SelectItem value="received">Received</SelectItem>
                                </SelectContent>
                              </Select> : <Badge variant={getStatusBadgeColor(request.status) as any} className={cn(request.status === 'pending' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}>
                                {request.status}
                              </Badge>}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              {request.status === 'pending' && <Button size="sm" variant="outline" onClick={() => updateRequestStatus(request.id, 'approved')} className="text-xs bg-success hover:bg-success/90 text-success-foreground border-success">
                                  Approve
                                </Button>}
                              <Button size="sm" variant="ghost" onClick={() => deleteRequest(request.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div> : <p className="text-muted-foreground text-center py-8">No restock requests yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <EmailNotificationSettings onEmailSettingsChange={handleEmailSettingsChange} />
        </TabsContent>
      </Tabs>
    </div>;
};