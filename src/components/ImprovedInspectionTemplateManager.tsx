import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Save, X, Trash2, GripVertical, Copy, Bell, CalendarIcon, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  nextOccurrence?: string;
  propertyId?: string;
  propertyName?: string;
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
  
  const [properties, setProperties] = useState<any[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePropertyId, setNewTemplatePropertyId] = useState('');
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateTargetPropertyId, setDuplicateTargetPropertyId] = useState('');
  const [templateToDuplicate, setTemplateToDuplicate] = useState<InspectionTemplate | null>(null);
  
  // Frequency and notification settings
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [tempFrequencyType, setTempFrequencyType] = useState<string>('none');
  const [tempFrequencyDays, setTempFrequencyDays] = useState<number>(30);
  const [tempNotificationsEnabled, setTempNotificationsEnabled] = useState<boolean>(true);
  const [tempNotificationMethod, setTempNotificationMethod] = useState<string>('email');
  const [tempNotificationDaysAhead, setTempNotificationDaysAhead] = useState<number>(7);
  const [tempNextOccurrence, setTempNextOccurrence] = useState<Date | undefined>(undefined);
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
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

    if (!newTemplatePropertyId) {
      toast({
        title: "Property required",
        description: "Please select a property for this template.",
        variant: "destructive"
      });
      return;
    }

    const property = properties.find(p => p.id === newTemplatePropertyId);

    const newTemplate: InspectionTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      isPredefined: false,
      propertyId: newTemplatePropertyId,
      propertyName: property?.name,
      items: []
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setNewTemplateName('');
    setNewTemplatePropertyId('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Template created",
      description: `Custom template "${newTemplate.name}" has been created for ${property?.name}.`,
    });
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setTemplateToDuplicate(template);
    setIsDuplicateDialogOpen(true);
  };

  const handleDuplicateToProperty = () => {
    if (!templateToDuplicate || !duplicateTargetPropertyId) return;

    const targetProperty = properties.find(p => p.id === duplicateTargetPropertyId);

    const newTemplate: InspectionTemplate = {
      id: Date.now().toString(),
      name: `${templateToDuplicate.name} (Copy)`,
      isPredefined: false,
      propertyId: duplicateTargetPropertyId,
      propertyName: targetProperty?.name,
      frequencyType: templateToDuplicate.frequencyType,
      frequencyDays: templateToDuplicate.frequencyDays,
      notificationsEnabled: templateToDuplicate.notificationsEnabled,
      notificationMethod: templateToDuplicate.notificationMethod,
      notificationDaysAhead: templateToDuplicate.notificationDaysAhead,
      nextOccurrence: templateToDuplicate.nextOccurrence,
      items: templateToDuplicate.items.map(item => ({
        ...item,
        id: `${Date.now()}-${item.id}`
      }))
    };

    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setDuplicateTargetPropertyId('');
    setTemplateToDuplicate(null);
    setIsDuplicateDialogOpen(false);
    
    toast({
      title: "Template duplicated",
      description: `Template "${newTemplate.name}" has been created for ${targetProperty?.name}.`,
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
    setTempNextOccurrence(selectedTemplate.nextOccurrence ? new Date(selectedTemplate.nextOccurrence) : undefined);
    setEditingFrequency(true);
  };

  const saveFrequencySettings = () => {
    if (!selectedTemplate) return;

    // Format next occurrence date if provided
    let nextOccurrenceString: string | undefined;
    if (tempNextOccurrence) {
      const year = tempNextOccurrence.getFullYear();
      const month = String(tempNextOccurrence.getMonth() + 1).padStart(2, '0');
      const day = String(tempNextOccurrence.getDate()).padStart(2, '0');
      nextOccurrenceString = `${year}-${month}-${day}`;
    }

    setTemplates(prev => prev.map(template =>
      template.id === selectedTemplateId
        ? {
            ...template,
            frequencyType: tempFrequencyType !== 'none' ? tempFrequencyType : undefined,
            frequencyDays: tempFrequencyType === 'custom' ? tempFrequencyDays : undefined,
            notificationsEnabled: tempFrequencyType !== 'none' ? tempNotificationsEnabled : undefined,
            notificationMethod: tempFrequencyType !== 'none' && tempNotificationsEnabled ? tempNotificationMethod : undefined,
            notificationDaysAhead: tempFrequencyType !== 'none' && tempNotificationsEnabled ? tempNotificationDaysAhead : undefined,
            nextOccurrence: tempFrequencyType !== 'none' ? nextOccurrenceString : undefined,
          }
        : template
    ));

    setEditingFrequency(false);
    
    toast({
      title: "Settings saved",
      description: "Frequency and notification settings have been updated.",
    });
  };

  const cancelEditingFrequency = () => {
    setEditingFrequency(false);
    setTempFrequencyType('none');
    setTempFrequencyDays(30);
    setTempNotificationsEnabled(true);
    setTempNotificationMethod('email');
    setTempNotificationDaysAhead(7);
    setTempNextOccurrence(undefined);
  };

  const confirmDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTemplate = () => {
    if (!templateToDelete) return;
    
    const template = templates.find(t => t.id === templateToDelete);
    if (template?.isPredefined) {
      toast({
        title: "Cannot delete",
        description: "Predefined templates cannot be deleted.",
        variant: "destructive"
      });
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      return;
    }

    setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
    
    // Select first template if current one was deleted
    if (selectedTemplateId === templateToDelete) {
      const remainingTemplates = templates.filter(t => t.id !== templateToDelete);
      if (remainingTemplates.length > 0) {
        setSelectedTemplateId(remainingTemplates[0].id);
      }
    }
    
    toast({
      title: "Template deleted",
      description: "Custom template has been deleted.",
    });
    
    setDeleteConfirmOpen(false);
    setTemplateToDelete(null);
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
              <DialogDescription>
                First select the property this template will be assigned to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={newTemplatePropertyId} onValueChange={setNewTemplatePropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property first" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {property.name} - {property.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select the property this template will be used for</p>
              </div>
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="Template name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createCustomTemplate()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createCustomTemplate} disabled={!newTemplatePropertyId || !newTemplateName}>Create</Button>
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
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate Inspection for another property
                    </Button>
                    {!selectedTemplate.isPredefined && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => confirmDeleteTemplate(selectedTemplate.id)}
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
              </CardContent>

              {/* Frequency and Notification Settings */}
              <CardContent className="border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Frequency & Notifications</h3>
                    </div>
                    {!editingFrequency ? (
                      <Button size="sm" variant="outline" onClick={startEditingFrequency}>
                        <Edit className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveFrequencySettings}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingFrequency}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {!editingFrequency ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Frequency:</span>
                        <span className="text-muted-foreground">
                          {selectedTemplate.frequencyType 
                            ? selectedTemplate.frequencyType === 'per_visit' 
                              ? 'Per Visit'
                              : selectedTemplate.frequencyType === 'custom'
                              ? `Every ${selectedTemplate.frequencyDays} days`
                              : selectedTemplate.frequencyType.charAt(0).toUpperCase() + selectedTemplate.frequencyType.slice(1)
                            : 'Not set'}
                        </span>
                      </div>
                      {selectedTemplate.frequencyType && selectedTemplate.frequencyType !== 'none' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Next Occurrence:</span>
                            <span className="text-muted-foreground">
                              {selectedTemplate.nextOccurrence 
                                ? format(new Date(selectedTemplate.nextOccurrence), 'PPP')
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Notifications:</span>
                            <span className="text-muted-foreground">
                              {selectedTemplate.notificationsEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {selectedTemplate.notificationsEnabled && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Method:</span>
                                <span className="text-muted-foreground">
                                  {selectedTemplate.notificationMethod === 'both' 
                                    ? 'Both (Email & Phone)'
                                    : selectedTemplate.notificationMethod === 'phone'
                                    ? 'Phone/SMS'
                                    : 'Email'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Notify Days Ahead:</span>
                                <span className="text-muted-foreground">
                                  {selectedTemplate.notificationDaysAhead || 7} days
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select value={tempFrequencyType || 'none'} onValueChange={setTempFrequencyType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="per_visit">Per Visit</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                              <SelectItem value="custom">Custom (Days)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {tempFrequencyType === 'custom' && (
                          <div className="space-y-2">
                            <Label>Custom Frequency (Days)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={tempFrequencyDays}
                              onChange={(e) => setTempFrequencyDays(parseInt(e.target.value) || 30)}
                            />
                          </div>
                        )}

                        {tempFrequencyType && tempFrequencyType !== 'none' && (
                          <>
                            <div className="space-y-2">
                              <Label>Next Occurrence Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "justify-start text-left font-normal w-full",
                                      !tempNextOccurrence && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {tempNextOccurrence ? format(tempNextOccurrence, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={tempNextOccurrence}
                                    onSelect={setTempNextOccurrence}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="text-xs text-muted-foreground">
                                Set when the next inspection of this type should occur
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="notifications-enabled"
                                  checked={tempNotificationsEnabled}
                                  onCheckedChange={setTempNotificationsEnabled}
                                />
                                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                              </div>
                            </div>

                            {tempNotificationsEnabled && (
                              <>
                                <div className="space-y-2">
                                  <Label>Notification Method</Label>
                                  <Select value={tempNotificationMethod} onValueChange={setTempNotificationMethod}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="phone">Phone/SMS</SelectItem>
                                      <SelectItem value="both">Both (Email & Phone)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Notify Days Ahead</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tempNotificationDaysAhead}
                                    onChange={(e) => setTempNotificationDaysAhead(parseInt(e.target.value) || 7)}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Select a template to edit</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Duplicate to Property Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Inspection for another property</DialogTitle>
            <DialogDescription>
              Select a property to copy this inspection template to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Property</Label>
              <Select value={duplicateTargetPropertyId} onValueChange={setDuplicateTargetPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {property.name} - {property.address}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This will create a copy of the template for the selected property</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDuplicateToProperty} disabled={!duplicateTargetPropertyId}>
                Duplicate Template
              </Button>
              <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};