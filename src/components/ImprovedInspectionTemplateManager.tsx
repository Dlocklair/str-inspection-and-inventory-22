import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Plus, Edit, Save, X, Trash2, GripVertical, Copy, Bell, CalendarIcon, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { PropertySelector } from './PropertySelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useAllInspectionTemplates,
  useCreateInspectionTemplate,
  useUpdateInspectionTemplate,
  useDeleteInspectionTemplate,
  InspectionTemplate as DBInspectionTemplate
} from '@/hooks/useInspectionTemplates';
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

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  notes: string;
}

// Use the database type from hooks
type InspectionTemplate = DBInspectionTemplate;

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
      className="flex items-center gap-2 pl-4 py-2 pr-2 bg-muted/20 rounded border"
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
  const { profile } = useAuth();
  const { selectedProperty, propertyMode, userProperties, setSelectedProperty } = usePropertyContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Database hooks
  const { data: templates = [], isLoading: templatesLoading } = useAllInspectionTemplates();
  const createTemplate = useCreateInspectionTemplate();
  const updateTemplate = useUpdateInspectionTemplate();
  const deleteTemplate = useDeleteInspectionTemplate();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [userHasSelected, setUserHasSelected] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePropertyIds, setNewTemplatePropertyIds] = useState<string[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignPropertyDialogOpen, setIsAssignPropertyDialogOpen] = useState(false);
  const [templateToAssign, setTemplateToAssign] = useState<InspectionTemplate | null>(null);
  const [selectedPropertyIdsForAssignment, setSelectedPropertyIdsForAssignment] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<{[key: string]: boolean}>({});
  
  // Frequency and notification settings
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [tempFrequencyType, setTempFrequencyType] = useState<string>('none');
  const [tempFrequencyDays, setTempFrequencyDays] = useState<number>(30);
  const [tempNotificationsEnabled, setTempNotificationsEnabled] = useState<boolean>(true);
  const [tempNotificationMethod, setTempNotificationMethod] = useState<string>('both');
  const [tempNotificationDaysAhead, setTempNotificationDaysAhead] = useState<number>(7);
  const [tempNextOccurrence, setTempNextOccurrence] = useState<Date | undefined>(undefined);
  const [tempDateMode, setTempDateMode] = useState<'next' | 'last'>('next');
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setProperties(data);
      }
    };
    fetchProperties();
  }, []);

  // Reset user selection when property changes
  useEffect(() => {
    setUserHasSelected(false);
  }, [selectedProperty?.id]);

  // Handle URL params from Upcoming Inspections (propertyId & templateId)
  useEffect(() => {
    const urlPropertyId = searchParams.get('propertyId');
    const urlTemplateId = searchParams.get('templateId');
    if (urlPropertyId && templates.length > 0 && properties.length > 0) {
      // Select the property
      const prop = userProperties.find(p => p.id === urlPropertyId) || properties.find(p => p.id === urlPropertyId);
      if (prop) {
        setSelectedProperty(prop as any);
      }
      // Select the template
      if (urlTemplateId) {
        const template = templates.find(t => t.id === urlTemplateId);
        if (template) {
          setSelectedTemplateId(urlTemplateId);
          setUserHasSelected(true);
        }
      }
      // Clean up URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('propertyId');
      newParams.delete('templateId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, templates, properties, userProperties]);

  // Set initial selected template when templates load or when property changes
  useEffect(() => {
    if (userHasSelected) return; // Don't override user selection
    
    if (selectedProperty) {
      // When a property is selected, auto-select the first template for that property
      const propertyTemplates = templates.filter(t => t.property_id === selectedProperty.id);
      if (propertyTemplates.length > 0) {
        setSelectedTemplateId(propertyTemplates[0].id);
      } else if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
    } else if (templates.length > 0 && !selectedTemplateId) {
      // Default behavior when no property is selected
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId, selectedProperty, userHasSelected]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Filter templates based on property mode and selection
  const filteredTemplates = (() => {
    if (propertyMode === 'all') {
      return templates;
    } else if (propertyMode === 'unassigned') {
      return templates.filter(t => !t.property_id);
    } else if (selectedProperty) {
      // When a specific property is selected, only show templates assigned to that property
      return templates.filter(t => t.property_id === selectedProperty.id);
    }
    return templates;
  })();

  // Group templates by property
  const groupedTemplates = filteredTemplates.reduce((groups, template) => {
    if (!template.property_id) {
      // Unassigned template
      const key = 'unassigned';
      if (!groups[key]) {
        groups[key] = { propertyName: 'Unassigned Templates', templates: [] };
      }
      groups[key].templates.push(template);
    } else {
      // Assigned to a property
      const property = properties.find(p => p.id === template.property_id);
      if (property) {
        const key = template.property_id;
        if (!groups[key]) {
          groups[key] = { propertyName: property.name, templates: [] };
        }
        groups[key].templates.push(template);
      }
    }
    return groups;
  }, {} as Record<string, { propertyName: string; templates: InspectionTemplate[] }>);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const addNewItem = () => {
    const text = newItemText?.trim();
    if (!text || !selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      description: text,
      notes: ''
    };

    updateTemplate.mutate({
      id: selectedTemplateId,
      items: [...template.items, newItem]
    });

    setNewItemText('');
  };

  const deleteItem = (templateId: string, itemId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    updateTemplate.mutate({
      id: templateId,
      items: template.items.filter(item => item.id !== itemId)
    });
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItem(item.id);
    setEditingText(item.description);
  };

  const saveEdit = (templateId: string, itemId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    updateTemplate.mutate({
      id: templateId,
      items: template.items.map(item =>
        item.id === itemId
          ? { ...item, description: editingText }
          : item
      )
    });
    
    setEditingItem(null);
    setEditingText('');
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
      
      updateTemplate.mutate({
        id: selectedTemplateId,
        items: arrayMove(items, oldIndex, newIndex)
      });
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

    if (newTemplatePropertyIds.length === 0) {
      toast({
        title: "Property required",
        description: "Please select at least one property or 'Unassigned'.",
        variant: "destructive"
      });
      return;
    }

    const defaultItem = [{
      id: Date.now().toString(),
      description: newTemplateName,
      notes: ''
    }];

    // Create a template for each selected property
    const promises = newTemplatePropertyIds.map((propId) =>
      createTemplate.mutateAsync({
        name: newTemplateName,
        property_id: propId === 'unassigned' ? undefined : propId,
        is_predefined: false,
        items: defaultItem.map(i => ({ ...i, id: (Date.now() + Math.random()).toString() }))
      })
    );

    Promise.all(promises).then((results) => {
      if (results.length > 0) {
        setSelectedTemplateId(results[0].id);
      }
      setNewTemplateName('');
      setNewTemplatePropertyIds([]);
      setIsCreateDialogOpen(false);
    });
  };

  const openAssignPropertyDialog = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setTemplateToAssign(template);
    setSelectedPropertyIdsForAssignment([]);
    setIsAssignPropertyDialogOpen(true);
  };

  const closeAssignPropertyDialog = () => {
    setIsAssignPropertyDialogOpen(false);
    setTemplateToAssign(null);
    setSelectedPropertyIdsForAssignment([]);
  };

  const handleAssignToProperties = () => {
    if (!templateToAssign || selectedPropertyIdsForAssignment.length === 0) return;

    // Create independent copies of the template for each selected property
    const copyPromises = selectedPropertyIdsForAssignment.map((propertyId) => {
      // Check if this property already has this template name
      const existingWithSameName = templates.find(
        t => t.property_id === propertyId && t.name === templateToAssign.name
      );
      if (existingWithSameName) return null;

      // Create a copy in the database
      return createTemplate.mutateAsync({
        name: templateToAssign.name,
        property_id: propertyId,
        is_predefined: false,
        items: templateToAssign.items,
        frequency_type: templateToAssign.frequency_type,
        frequency_days: templateToAssign.frequency_days,
        notifications_enabled: templateToAssign.notifications_enabled,
        notification_method: templateToAssign.notification_method,
        notification_days_ahead: templateToAssign.notification_days_ahead,
        next_occurrence: templateToAssign.next_occurrence
      });
    });

    Promise.all(copyPromises)
      .then((results) => {
        const successCount = results.filter(Boolean).length;
        if (successCount > 0) {
          toast({
            title: "Templates copied",
            description: `Created ${successCount} template copy/copies for selected properties.`,
          });
        } else {
          toast({
            title: "Already exists",
            description: "Templates with this name already exist for selected properties.",
            variant: "destructive"
          });
        }
      })
      .catch((error) => {
        console.error('Error copying templates:', error);
      })
      .finally(() => {
        closeAssignPropertyDialog();
      });
  };


  const updateTemplateName = () => {
    if (!editingTemplateName.trim() || !selectedTemplate) return;

    if (selectedTemplate.is_predefined) {
      toast({
        title: "Cannot rename",
        description: "Predefined templates cannot be renamed.",
        variant: "destructive"
      });
      return;
    }

    updateTemplate.mutate({
      id: selectedTemplateId,
      name: editingTemplateName
    }, {
      onSuccess: () => {
        setEditingTemplateName('');
      }
    });
  };

  const startEditingFrequency = () => {
    if (!selectedTemplate) return;
    setTempFrequencyType(selectedTemplate.frequency_type || 'none');
    setTempFrequencyDays(selectedTemplate.frequency_days || 30);
    setTempNotificationsEnabled(selectedTemplate.notifications_enabled ?? true);
    setTempNotificationMethod(selectedTemplate.notification_method || 'email');
    setTempNotificationDaysAhead(selectedTemplate.notification_days_ahead || 7);
    setTempNextOccurrence(selectedTemplate.next_occurrence ? new Date(selectedTemplate.next_occurrence) : undefined);
    setEditingFrequency(true);
  };

  const saveFrequencySettings = () => {
    if (!selectedTemplate) return;

    // Calculate next occurrence date
    let nextOccurrenceString: string | undefined;
    if (tempNextOccurrence) {
      let effectiveDate = tempNextOccurrence;
      
      // If "last occurrence" mode, calculate next from last + frequency
      if (tempDateMode === 'last') {
        const frequencyDaysMap: Record<string, number> = {
          'monthly': 30,
          'quarterly': 90,
          'semi-annual': 180,
          'annually': 365,
          'custom': tempFrequencyDays,
        };
        const days = frequencyDaysMap[tempFrequencyType] || 30;
        effectiveDate = new Date(tempNextOccurrence);
        effectiveDate.setDate(effectiveDate.getDate() + days);
      }
      
      const year = effectiveDate.getFullYear();
      const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
      const day = String(effectiveDate.getDate()).padStart(2, '0');
      nextOccurrenceString = `${year}-${month}-${day}`;
    }

    // If frequency is per_visit, disable notifications
    const shouldDisableNotifications = tempFrequencyType === 'per_visit';

    updateTemplate.mutate({
      id: selectedTemplateId,
      frequency_type: tempFrequencyType !== 'none' ? tempFrequencyType : undefined,
      frequency_days: tempFrequencyType === 'custom' ? tempFrequencyDays : undefined,
      notifications_enabled: tempFrequencyType !== 'none' && !shouldDisableNotifications ? tempNotificationsEnabled : false,
      notification_method: tempFrequencyType !== 'none' && !shouldDisableNotifications && tempNotificationsEnabled ? tempNotificationMethod : undefined,
      notification_days_ahead: tempFrequencyType !== 'none' && !shouldDisableNotifications && tempNotificationsEnabled ? tempNotificationDaysAhead : undefined,
      next_occurrence: tempFrequencyType !== 'none' && !shouldDisableNotifications ? nextOccurrenceString : undefined,
    }, {
      onSuccess: () => {
        setEditingFrequency(false);
      }
    });
  };

  const cancelEditingFrequency = () => {
    setEditingFrequency(false);
    setTempFrequencyType('none');
    setTempFrequencyDays(30);
    setTempNotificationsEnabled(true);
    setTempNotificationMethod('both');
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
    
    // Only block deletion of unassigned predefined templates (the "masters")
    const isUnassignedMaster = template?.is_predefined && !template?.property_id;
    
    if (isUnassignedMaster) {
      toast({
        title: "Cannot delete",
        description: "Unassigned predefined templates cannot be deleted.",
        variant: "destructive"
      });
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      return;
    }

    deleteTemplate.mutate(templateToDelete, {
      onSuccess: () => {
        // Select first template if current one was deleted
        if (selectedTemplateId === templateToDelete) {
          const remainingTemplates = templates.filter(t => t.id !== templateToDelete);
          if (remainingTemplates.length > 0) {
            setSelectedTemplateId(remainingTemplates[0].id);
          }
        }
        setDeleteConfirmOpen(false);
        setTemplateToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      <PropertySelector />
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Inspection Templates</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Inspection Template
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
                <Label>Properties *</Label>
                <div className="space-y-2 max-h-[250px] overflow-y-auto border rounded-md p-2">
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={newTemplatePropertyIds.includes('unassigned')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewTemplatePropertyIds(prev => [...prev, 'unassigned']);
                        } else {
                          setNewTemplatePropertyIds(prev => prev.filter(id => id !== 'unassigned'));
                        }
                      }}
                    />
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Unassigned (available to all properties)</span>
                  </div>
                  {properties.map(property => (
                    <div 
                      key={property.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={newTemplatePropertyIds.includes(property.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewTemplatePropertyIds(prev => [...prev, property.id]);
                          } else {
                            setNewTemplatePropertyIds(prev => prev.filter(id => id !== property.id));
                          }
                        }}
                      />
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{property.name} - {property.address}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select one or more properties</p>
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
                <Button onClick={createCustomTemplate} disabled={newTemplatePropertyIds.length === 0 || !newTemplateName}>Create</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selection */}
        <Card className="lg:col-span-1 h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-4">
              {Object.entries(groupedTemplates).map(([key, group]) => (
                <Collapsible
                  key={key}
                  open={!collapsedGroups[key]}
                  onOpenChange={() => toggleGroupCollapse(key)}
                  className="mb-4"
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1 mb-1 hover:bg-muted/50 rounded">
                    {collapsedGroups[key] ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {key !== 'unassigned' && <Building2 className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {group.propertyName}
                    </span>
                    <Badge variant="secondary" className="ml-auto text-xs">{group.templates.length}</Badge>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {group.templates.map((template) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplateId === template.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start pl-6 mb-1"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setUserHasSelected(true);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{template.name}</div>
                          <div className="text-xs opacity-70">
                            {template.items.length} step{template.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {template.is_predefined && (
                          <Badge variant="outline" className="text-xs">Built-in</Badge>
                        )}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
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
                        {!selectedTemplate.is_predefined && (
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
                      onClick={() => openAssignPropertyDialog(selectedTemplate.id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Assign to Other Properties
                    </Button>
                    {(!selectedTemplate.is_predefined || selectedTemplate.property_id) && (
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
                    placeholder="Add new inspection step"
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
                          {selectedTemplate.frequency_type 
                            ? selectedTemplate.frequency_type === 'per_visit' 
                              ? 'Per Visit'
                              : selectedTemplate.frequency_type === 'custom'
                              ? `Every ${selectedTemplate.frequency_days} days`
                              : selectedTemplate.frequency_type.charAt(0).toUpperCase() + selectedTemplate.frequency_type.slice(1)
                            : 'Not set'}
                        </span>
                      </div>
                      {selectedTemplate.frequency_type && selectedTemplate.frequency_type !== 'none' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Next Occurrence:</span>
                            <span className="text-muted-foreground">
                              {selectedTemplate.next_occurrence 
                                ? format(new Date(selectedTemplate.next_occurrence), 'PPP')
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Notifications:</span>
                            <span className="text-muted-foreground">
                              {selectedTemplate.notifications_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {selectedTemplate.notifications_enabled && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Method:</span>
                                <span className="text-muted-foreground">
                                  {selectedTemplate.notification_method === 'both' 
                                    ? 'Both (Email & Phone)'
                                    : selectedTemplate.notification_method === 'phone'
                                    ? 'Phone/SMS'
                                    : 'Email'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Notify Days Ahead:</span>
                                <span className="text-muted-foreground">
                                  {selectedTemplate.notification_days_ahead || 7} days
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
                              <SelectItem value="quarterly">Quarterly (Every 3 Months)</SelectItem>
                              <SelectItem value="semi-annual">Every 6 Months</SelectItem>
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
                              <Label>Date Type</Label>
                              <Select value={tempDateMode} onValueChange={(v) => {
                                setTempDateMode(v as 'next' | 'last');
                                setTempNextOccurrence(undefined);
                              }}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="next">Next Occurrence</SelectItem>
                                  <SelectItem value="last">Last Occurrence</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{tempDateMode === 'next' ? 'Next Occurrence Date' : 'Last Occurrence Date'}</Label>
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
                              <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                                  <Calendar
                                    mode="single"
                                    selected={tempNextOccurrence}
                                    onSelect={setTempNextOccurrence}
                                    disabled={tempDateMode === 'next' ? (date) => date < new Date() : undefined}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="text-xs text-muted-foreground">
                                {tempDateMode === 'next' 
                                  ? 'Set when the next inspection should occur'
                                  : 'Set when the last inspection occurred — the next occurrence will be calculated from the frequency'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="notifications-enabled"
                                  checked={tempNotificationsEnabled}
                                  onCheckedChange={setTempNotificationsEnabled}
                                  disabled={tempFrequencyType === 'per_visit'}
                                />
                                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                              </div>
                            </div>

                            {tempNotificationsEnabled && tempFrequencyType !== 'per_visit' && (
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
                                  {(tempNotificationMethod === 'email' || tempNotificationMethod === 'both') && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                      Note: Email address must be configured in Settings for email notifications.
                                    </p>
                                  )}
                                  {(tempNotificationMethod === 'phone' || tempNotificationMethod === 'both') && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                      Note: Phone number must be configured in Settings for SMS notifications.
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>Notify Days Ahead</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tempNotificationDaysAhead}
                                    onChange={(e) => setTempNotificationDaysAhead(parseInt(e.target.value) || 7)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                              </>
                            )}
                            {tempFrequencyType === 'per_visit' && (
                              <p className="text-xs text-muted-foreground">
                                Notifications are not applicable for "Per Visit" frequency.
                              </p>
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

      {/* Assign to Property Dialog */}
      <Dialog open={isAssignPropertyDialogOpen} onOpenChange={setIsAssignPropertyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy Template to Properties</DialogTitle>
            <DialogDescription>
              Select one or more properties to copy this template to. Each property will get an independent copy that can be modified separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {properties.map(property => {
                const isAlreadyAssigned = templateToAssign?.property_id === property.id;
                const isSelected = selectedPropertyIdsForAssignment.includes(property.id);
                
                return (
                  <div 
                    key={property.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg",
                      isAlreadyAssigned && "bg-muted/50 opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isAlreadyAssigned}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPropertyIdsForAssignment(prev => [...prev, property.id]);
                        } else {
                          setSelectedPropertyIdsForAssignment(prev => 
                            prev.filter(id => id !== property.id)
                          );
                        }
                      }}
                    />
                    <Building2 className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{property.name}</div>
                      <div className="text-sm text-muted-foreground">{property.address}</div>
                    </div>
                    {isAlreadyAssigned && (
                      <Badge variant="secondary">Already Assigned</Badge>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAssignToProperties}
                disabled={selectedPropertyIdsForAssignment.length === 0}
              >
                Assign to {selectedPropertyIdsForAssignment.length} {selectedPropertyIdsForAssignment.length === 1 ? 'Property' : 'Properties'}
              </Button>
              <Button variant="outline" onClick={closeAssignPropertyDialog}>
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