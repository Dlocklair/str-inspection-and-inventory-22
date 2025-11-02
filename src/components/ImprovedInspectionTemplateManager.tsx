import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Save, X, Trash2, GripVertical, Copy, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChecklistItem {
  id: string;
  description: string;
  notes: string;
}

interface InspectionTemplate {
  id: string;
  name: string;
  items: ChecklistItem[];
  isPredefined: boolean;
  frequencyType?: string;
  frequencyDays?: number;
  notificationsEnabled?: boolean;
  notificationMethod?: string;
  notificationDaysAhead?: number;
}

interface SortableItemProps {
  item: ChecklistItem;
  templateId: string;
  isEditing: boolean;
  editingText: string;
  onEdit: (item: ChecklistItem) => void;
  onSave: (templateId: string, itemId: string) => void;
  onCancel: () => void;
  onDelete: (templateId: string, itemId: string) => void;
  onTextChange: (text: string) => void;
}

const SortableItem = ({ item, templateId, isEditing, editingText, onEdit, onSave, onCancel, onDelete, onTextChange }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/20 rounded border"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={editingText}
            onChange={(e) => onTextChange(e.target.value)}
            className="flex-1 h-8"
          />
          <Button size="sm" onClick={() => onSave(templateId, item.id)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">{item.description}</span>
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(templateId, item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export const ImprovedInspectionTemplateManager = () => {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Frequency and notification settings
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [tempFrequencyType, setTempFrequencyType] = useState<string>('none');
  const [tempFrequencyDays, setTempFrequencyDays] = useState<number>(30);
  const [tempNotificationsEnabled, setTempNotificationsEnabled] = useState<boolean>(true);
  const [tempNotificationMethod, setTempNotificationMethod] = useState<string>('email');
  const [tempNotificationDaysAhead, setTempNotificationDaysAhead] = useState<number>(7);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('inspection-templates');
    if (savedTemplates) {
      const loadedTemplates = JSON.parse(savedTemplates);
      setTemplates(loadedTemplates);
      if (loadedTemplates.length > 0) {
        setSelectedTemplateId(loadedTemplates[0].id);
      }
    } else {
      // Initialize with predefined templates
      const defaultTemplates: InspectionTemplate[] = [
        {
          id: 'per-visit',
          name: 'Per Visit',
          isPredefined: true,
          items: [
            { id: '1', description: 'Check cleanliness of all rooms', notes: '' },
            { id: '2', description: 'Verify all appliances working', notes: '' },
            { id: '3', description: 'Check for any visible damage', notes: '' }
          ]
        },
        {
          id: 'monthly',
          name: 'Monthly',
          isPredefined: true,
          items: [
            { id: '4', description: 'Deep clean all surfaces', notes: '' },
            { id: '5', description: 'Check and replace air fresheners', notes: '' },
            { id: '6', description: 'Inspect and clean appliances', notes: '' }
          ]
        },
        {
          id: 'quarterly',
          name: 'Quarterly',
          isPredefined: true,
          items: [
            { id: '7', description: 'Deep clean carpets and upholstery', notes: '' },
            { id: '8', description: 'Clean windows inside and out', notes: '' },
            { id: '9', description: 'Check HVAC filters', notes: '' }
          ]
        },
        {
          id: 'yearly',
          name: 'Yearly',
          isPredefined: true,
          items: [
            { id: '10', description: 'Professional HVAC system cleaning', notes: '' },
            { id: '11', description: 'Deep clean and organize storage areas', notes: '' },
            { id: '12', description: 'Inspect roof and gutters', notes: '' }
          ]
        }
      ];
      setTemplates(defaultTemplates);
      setSelectedTemplateId(defaultTemplates[0].id);
      localStorage.setItem('inspection-templates', JSON.stringify(defaultTemplates));
    }
  }, []);

  // Save templates when they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('inspection-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const addNewItem = () => {
    const text = newItemText?.trim();
    if (!text || !selectedTemplateId) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      description: text,
      notes: ''
    };

    setTemplates(prev => prev.map(template => 
      template.id === selectedTemplateId
        ? { ...template, items: [...template.items, newItem] }
        : template
    ));

    setNewItemText('');
    
    toast({
      title: "Item added",
      description: "New inspection item has been added to the template.",
    });
  };

  const deleteItem = (templateId: string, itemId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId
        ? { ...template, items: template.items.filter(item => item.id !== itemId) }
        : template
    ));
    
    toast({
      title: "Item deleted",
      description: "Inspection item has been removed from the template.",
    });
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItem(item.id);
    setEditingText(item.description);
  };

  const saveEdit = (templateId: string, itemId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId
        ? {
            ...template,
            items: template.items.map(item =>
              item.id === itemId
                ? { ...item, description: editingText }
                : item
            )
          }
        : template
    ));
    
    setEditingItem(null);
    setEditingText('');
    
    toast({
      title: "Item updated",
      description: "Inspection item has been updated.",
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingText('');
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && selectedTemplate) {
      const items = selectedTemplate.items;
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      setTemplates(prev => prev.map(template => 
        template.id === selectedTemplateId
          ? { ...template, items: arrayMove(items, oldIndex, newIndex) }
          : template
      ));
    }
  };

  const createCustomTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a template name.",
        variant: "destructive"
      });
      return;
    }

    const newTemplate: InspectionTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      isPredefined: false,
      items: []
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setNewTemplateName('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Template created",
      description: `Custom template "${newTemplate.name}" has been created.`,
    });
  };

  const duplicateTemplate = (templateId: string) => {
    const templateToDupe = templates.find(t => t.id === templateId);
    if (!templateToDupe) return;

    const newTemplate: InspectionTemplate = {
      id: Date.now().toString(),
      name: `${templateToDupe.name} (Copy)`,
      isPredefined: false,
      items: templateToDupe.items.map(item => ({
        ...item,
        id: `${Date.now()}-${item.id}`
      }))
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    
    toast({
      title: "Template duplicated",
      description: `Template "${newTemplate.name}" has been created.`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isPredefined) {
      toast({
        title: "Cannot delete",
        description: "Predefined templates cannot be deleted.",
        variant: "destructive"
      });
      return;
    }

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    
    // Select first template if current one was deleted
    if (selectedTemplateId === templateId) {
      const remainingTemplates = templates.filter(t => t.id !== templateId);
      if (remainingTemplates.length > 0) {
        setSelectedTemplateId(remainingTemplates[0].id);
      }
    }
    
    toast({
      title: "Template deleted",
      description: "Custom template has been deleted.",
    });
  };

  const updateTemplateName = () => {
    if (!editingTemplateName.trim() || !selectedTemplate) return;

    if (selectedTemplate.isPredefined) {
      toast({
        title: "Cannot rename",
        description: "Predefined templates cannot be renamed.",
        variant: "destructive"
      });
      return;
    }

    setTemplates(prev => prev.map(template =>
      template.id === selectedTemplateId
        ? { ...template, name: editingTemplateName }
        : template
    ));

    setEditingTemplateName('');
    
    toast({
      title: "Template renamed",
      description: "Template name has been updated.",
    });
  };

  const startEditingFrequency = () => {
    if (!selectedTemplate) return;
    setTempFrequencyType(selectedTemplate.frequencyType || 'none');
    setTempFrequencyDays(selectedTemplate.frequencyDays || 30);
    setTempNotificationsEnabled(selectedTemplate.notificationsEnabled ?? true);
    setTempNotificationMethod(selectedTemplate.notificationMethod || 'email');
    setTempNotificationDaysAhead(selectedTemplate.notificationDaysAhead || 7);
    setEditingFrequency(true);
  };

  const saveFrequencySettings = () => {
    if (!selectedTemplate) return;

    const hasFrequency = tempFrequencyType && tempFrequencyType !== 'none';

    setTemplates(prev => prev.map(template =>
      template.id === selectedTemplateId
        ? {
            ...template,
            frequencyType: hasFrequency ? tempFrequencyType : undefined,
            frequencyDays: tempFrequencyType === 'custom' ? tempFrequencyDays : undefined,
            notificationsEnabled: hasFrequency ? tempNotificationsEnabled : undefined,
            notificationMethod: hasFrequency ? tempNotificationMethod : undefined,
            notificationDaysAhead: hasFrequency ? tempNotificationDaysAhead : undefined,
          }
        : template
    ));

    setEditingFrequency(false);
    
    toast({
      title: "Frequency settings saved",
      description: "Inspection frequency and notification settings have been updated.",
    });
  };

  const cancelEditingFrequency = () => {
    setEditingFrequency(false);
    setTempFrequencyType('none');
    setTempFrequencyDays(30);
    setTempNotificationsEnabled(true);
    setTempNotificationMethod('email');
    setTempNotificationDaysAhead(7);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Inspection Templates</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createCustomTemplate()}
              />
              <div className="flex gap-2">
                <Button onClick={createCustomTemplate}>Create</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map(template => (
              <div
                key={template.id}
                className={`p-2 rounded cursor-pointer border ${
                  selectedTemplateId === template.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{template.name}</span>
                  {template.isPredefined && (
                    <Badge variant="secondary" className="text-xs">Built-in</Badge>
                  )}
                </div>
                <div className="text-xs opacity-70">
                  {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-3">
          {selectedTemplate ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingTemplateName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTemplateName}
                          onChange={(e) => setEditingTemplateName(e.target.value)}
                          className="text-lg font-semibold"
                          onKeyPress={(e) => e.key === 'Enter' && updateTemplateName()}
                        />
                        <Button size="sm" onClick={updateTemplateName}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingTemplateName('')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                        {!selectedTemplate.isPredefined && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingTemplateName(selectedTemplate.name)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => duplicateTemplate(selectedTemplate.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!selectedTemplate.isPredefined && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteTemplate(selectedTemplate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedTemplate.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedTemplate.items.map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          templateId={selectedTemplate.id}
                          isEditing={editingItem === item.id}
                          editingText={editingText}
                          onEdit={startEditing}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                          onDelete={deleteItem}
                          onTextChange={setEditingText}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Add new inspection item"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNewItem()}
                    className="flex-1"
                  />
                  <Button onClick={addNewItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Frequency and Notification Settings */}
                <Card className="bg-muted/20 mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Frequency & Notification Settings
                      </CardTitle>
                      {!editingFrequency && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={startEditingFrequency}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Settings
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingFrequency ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Frequency Type */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Frequency</label>
                            <Select value={tempFrequencyType || "none"} onValueChange={setTempFrequencyType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                                <SelectItem value="custom">Custom (specify days)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom Frequency Days */}
                          {tempFrequencyType === 'custom' && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Days Between Inspections</label>
                              <Input
                                type="number"
                                min="1"
                                value={tempFrequencyDays}
                                onChange={(e) => setTempFrequencyDays(parseInt(e.target.value) || 30)}
                                placeholder="Enter number of days"
                              />
                            </div>
                          )}
                        </div>

                        {/* Notification Settings */}
                        {tempFrequencyType && tempFrequencyType !== 'none' && (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor="template-notifications-enabled" className="text-sm font-medium">
                                  Enable Notifications
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Send reminders before inspections are due
                                </p>
                              </div>
                              <Switch
                                id="template-notifications-enabled"
                                checked={tempNotificationsEnabled}
                                onCheckedChange={setTempNotificationsEnabled}
                              />
                            </div>

                            {tempNotificationsEnabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Notification Method */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Notification Method</label>
                                  <Select value={tempNotificationMethod} onValueChange={setTempNotificationMethod}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="phone">Phone/SMS</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Days Ahead to Notify */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Days Ahead to Notify</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="90"
                                    value={tempNotificationDaysAhead}
                                    onChange={(e) => setTempNotificationDaysAhead(parseInt(e.target.value) || 7)}
                                    placeholder="Number of days"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={saveFrequencySettings}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                          </Button>
                          <Button variant="outline" onClick={cancelEditingFrequency}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedTemplate.frequencyType ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Frequency:</span>
                              <Badge variant="secondary">
                                {selectedTemplate.frequencyType === 'custom' 
                                  ? `Every ${selectedTemplate.frequencyDays} days`
                                  : selectedTemplate.frequencyType.charAt(0).toUpperCase() + selectedTemplate.frequencyType.slice(1)
                                }
                              </Badge>
                            </div>
                            {selectedTemplate.notificationsEnabled && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Notifications:</span>
                                  <Badge variant="secondary">
                                    {selectedTemplate.notificationMethod === 'email' ? 'Email' : 'Phone/SMS'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Reminder sent {selectedTemplate.notificationDaysAhead} day{selectedTemplate.notificationDaysAhead !== 1 ? 's' : ''} before due date
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No frequency or notification settings configured. Click "Edit Settings" to configure.
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Select a template to edit</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};