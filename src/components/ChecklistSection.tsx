import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Edit, Save, X, FileText, History, CalendarIcon, GripVertical, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  completed: boolean;
  notes: string;
}

interface ChecklistTemplate {
  monthly: ChecklistItem[];
  quarterly: ChecklistItem[];
  yearly: ChecklistItem[];
}

interface InspectionRecord {
  id: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  date: string;
  items: ChecklistItem[];
  createdAt: string;
}

export const ChecklistSection = () => {
  const { toast } = useToast();
  
  // Template checklists (for creating new inspections)
  const [templates, setTemplates] = useState<ChecklistTemplate>({
    monthly: [
      { id: '1', description: 'Deep clean all surfaces', completed: false, notes: '' },
      { id: '2', description: 'Check and replace air fresheners', completed: false, notes: '' },
      { id: '3', description: 'Inspect and clean appliances', completed: false, notes: '' },
    ],
    quarterly: [
      { id: '4', description: 'Deep clean carpets and upholstery', completed: false, notes: '' },
      { id: '5', description: 'Clean windows inside and out', completed: false, notes: '' },
    ],
    yearly: [
      { id: '6', description: 'Professional HVAC system cleaning', completed: false, notes: '' },
      { id: '7', description: 'Deep clean and organize storage areas', completed: false, notes: '' },
    ],
  });

  // Current inspection being worked on
  const [currentInspection, setCurrentInspection] = useState<ChecklistTemplate>({
    monthly: [],
    quarterly: [],
    yearly: []
  });

  // Saved inspection records
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);

  const [newItemTexts, setNewItemTexts] = useState({
    monthly: '',
    quarterly: '',
    yearly: ''
  });

  const [entryDates, setEntryDates] = useState({
    monthly: '',
    quarterly: '',
    yearly: ''
  });

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // State for collapsible inspection history
  const [expandedCategories, setExpandedCategories] = useState({
    monthly: false,
    quarterly: false,
    yearly: false
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('checklist-templates');
    const savedRecords = localStorage.getItem('inspection-records');
    
    if (savedTemplates) {
      const loadedTemplates = JSON.parse(savedTemplates);
      setTemplates(loadedTemplates);
      
      // Pre-populate current inspections with template items
      const initialInspections = {
        monthly: loadedTemplates.monthly.map((item: ChecklistItem) => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        })),
        quarterly: loadedTemplates.quarterly.map((item: ChecklistItem) => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        })),
        yearly: loadedTemplates.yearly.map((item: ChecklistItem) => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        }))
      };
      setCurrentInspection(initialInspections);
    } else {
      // Pre-populate with default templates on first load
      const initialInspections = {
        monthly: templates.monthly.map(item => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        })),
        quarterly: templates.quarterly.map(item => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        })),
        yearly: templates.yearly.map(item => ({
          ...item,
          id: `${Date.now()}-${Math.random()}`,
          completed: false,
          notes: ''
        }))
      };
      setCurrentInspection(initialInspections);
    }
    
    if (savedRecords) {
      setInspectionRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('checklist-templates', JSON.stringify(templates));
  }, [templates]);

  // Save inspection records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('inspection-records', JSON.stringify(inspectionRecords));
  }, [inspectionRecords]);

  // Synchronize current inspections with template updates
  const syncCurrentInspectionsWithTemplates = (type: keyof ChecklistTemplate, updatedTemplates: ChecklistItem[]) => {
    setCurrentInspection(prev => {
      const currentItems = prev[type];
      
      // Create a map of existing items by description for matching
      const existingItemsMap = new Map(
        currentItems.map(item => [item.description, item])
      );
      
      // Update current inspection to match template
      const syncedItems = updatedTemplates.map(templateItem => {
        const existingItem = existingItemsMap.get(templateItem.description);
        if (existingItem) {
          // Keep existing completion status and notes, but update description if changed
          return {
            ...existingItem,
            description: templateItem.description
          };
        } else {
          // New item from template
          return {
            ...templateItem,
            id: `${Date.now()}-${Math.random()}`,
            completed: false,
            notes: ''
          };
        }
      });
      
      return {
        ...prev,
        [type]: syncedItems
      };
    });
  };

  // Initialize new inspection from template
  const startNewInspection = (type: keyof ChecklistTemplate) => {
    const templateItems = templates[type].map(item => ({
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      completed: false,
      notes: ''
    }));
    
    setCurrentInspection(prev => ({
      ...prev,
      [type]: templateItems
    }));
    
    toast({
      title: "New inspection started",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} inspection initialized from template.`,
    });
  };

  // Save inspection record
  const saveInspection = (type: keyof ChecklistTemplate) => {
    if (!entryDates[type]) {
      toast({
        title: "Date required",
        description: "Please select an entry date before saving the inspection.",
        variant: "destructive"
      });
      return;
    }

    if (currentInspection[type].length === 0) {
      toast({
        title: "No items to save",
        description: "Please start a new inspection first.",
        variant: "destructive"
      });
      return;
    }

    const newRecord: InspectionRecord = {
      id: `${Date.now()}-${type}`,
      type,
      date: entryDates[type],
      items: currentInspection[type],
      createdAt: new Date().toISOString()
    };

    setInspectionRecords(prev => [...prev, newRecord]);
    
    // Clear current inspection and reset with template
    const templateItems = templates[type].map(item => ({
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      completed: false,
      notes: ''
    }));
    
    setCurrentInspection(prev => ({
      ...prev,
      [type]: templateItems
    }));
    
    setEntryDates(prev => ({
      ...prev,
      [type]: ''
    }));

    toast({
      title: "Inspection saved",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} inspection for ${entryDates[type]} has been saved.`,
    });
  };

  const addNewTemplateItem = (type: keyof ChecklistTemplate) => {
    if (!newItemTexts[type].trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      description: newItemTexts[type].trim(),
      completed: false,
      notes: '',
    };

    const updatedTemplates = [...templates[type], newItem];
    
    setTemplates(prev => ({
      ...prev,
      [type]: updatedTemplates,
    }));

    // Sync current inspections with updated templates
    syncCurrentInspectionsWithTemplates(type, updatedTemplates);

    setNewItemTexts(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const deleteTemplateItem = (type: keyof ChecklistTemplate, id: string) => {
    const updatedTemplates = templates[type].filter(item => item.id !== id);
    
    setTemplates(prev => ({
      ...prev,
      [type]: updatedTemplates,
    }));

    // Sync current inspections with updated templates
    syncCurrentInspectionsWithTemplates(type, updatedTemplates);
  };

  const deleteCurrentInspectionItem = (type: keyof ChecklistTemplate, id: string) => {
    setCurrentInspection(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id),
    }));
  };

  const updateCurrentInspectionItem = (type: keyof ChecklistTemplate, id: string, updates: Partial<ChecklistItem>) => {
    setCurrentInspection(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === id 
          ? { ...item, ...updates }
          : item
      ),
    }));
  };

  const updateTemplateItem = (type: keyof ChecklistTemplate, id: string, updates: Partial<ChecklistItem>) => {
    const updatedTemplates = templates[type].map(item =>
      item.id === id 
        ? { ...item, ...updates }
        : item
    );
    
    setTemplates(prev => ({
      ...prev,
      [type]: updatedTemplates,
    }));

    // Sync current inspections with updated templates
    syncCurrentInspectionsWithTemplates(type, updatedTemplates);
  };

  const updateNotes = (type: keyof ChecklistTemplate, id: string, notes: string, isTemplate: boolean = false) => {
    if (isTemplate) {
      updateTemplateItem(type, id, { notes });
    } else {
      updateCurrentInspectionItem(type, id, { notes });
    }
  };

  const toggleCompleted = (type: keyof ChecklistTemplate, id: string, completed: boolean) => {
    updateCurrentInspectionItem(type, id, { completed });
  };

  const startEditing = (item: ChecklistItem) => {
    setEditingItem(item.id);
    setEditingText(item.description);
  };

  const saveEdit = (type: keyof ChecklistTemplate, id: string, isTemplate: boolean = false) => {
    if (isTemplate) {
      updateTemplateItem(type, id, { description: editingText });
    } else {
      updateCurrentInspectionItem(type, id, { description: editingText });
    }
    setEditingItem(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingText('');
  };

  // Handle drag end for template reordering
  const handleDragEnd = (event: any, type: keyof ChecklistTemplate) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const items = templates[type];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      setTemplates(prev => ({
        ...prev,
        [type]: newItems,
      }));

      // Sync current inspections with reordered templates
      syncCurrentInspectionsWithTemplates(type, newItems);
    }
  };

  // Toggle expanded state for inspection history categories
  const toggleCategoryExpansion = (type: keyof ChecklistTemplate) => {
    setExpandedCategories(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderInspectionTable = (type: keyof ChecklistTemplate, title: string) => {
    const items = currentInspection[type];
    const hasActiveInspection = items.length > 0;

    return (
      <div className="w-full">
        <div className="bg-muted/30 rounded-lg p-3 h-[500px] flex flex-col">
          {/* Header with title, date entry, and save button */}
          <div className="flex flex-col gap-2 mb-3">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal text-xs h-9",
                      !entryDates[type] && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDates[type] ? format(new Date(entryDates[type]), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entryDates[type] ? new Date(entryDates[type]) : undefined}
                    onSelect={(date) => setEntryDates(prev => ({ ...prev, [type]: date ? format(date, 'yyyy-MM-dd') : '' }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => saveInspection(type)}
                size="sm"
                className="bg-cyan hover:bg-cyan/90 text-white"
                disabled={!hasActiveInspection || !entryDates[type]}
              >
                <Save className="h-4 w-4 mr-1 text-white" />
                Save
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => startNewInspection(type)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                New Inspection
              </Button>
            </div>
          </div>
          
          {/* Table with scroll */}
          <div className="bg-card rounded-lg border border-border overflow-hidden flex-1">
            {hasActiveInspection ? (
              <div className="overflow-y-auto h-full">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-xs font-medium text-foreground w-12">Done</th>
                      <th className="text-left p-2 text-xs font-medium text-foreground w-32">Description</th>
                      <th className="text-left p-2 text-xs font-medium text-foreground">Notes</th>
                      <th className="text-left p-2 text-xs font-medium text-foreground w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-1 text-center">
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={(checked) => toggleCompleted(type, item.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-1">
                          {editingItem === item.id ? (
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="text-xs h-8"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') saveEdit(type, item.id);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                          ) : (
                            <label
                              htmlFor={item.id}
                              className={`text-xs cursor-pointer block ${
                                item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {item.description}
                            </label>
                          )}
                        </td>
                        <td className="p-1">
                          <Textarea
                            value={item.notes}
                            onChange={(e) => updateNotes(type, item.id, e.target.value)}
                            placeholder="Add inspection notes..."
                            className="min-h-[32px] text-xs resize-none border-0 bg-transparent p-1"
                            rows={2}
                          />
                        </td>
                        <td className="p-1 text-center">
                          <div className="flex gap-1">
                            {editingItem === item.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveEdit(type, item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(item)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteCurrentInspectionItem(type, item.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click "New Inspection" to start</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sortable Item Component
  const SortableItem = ({ id, item, type }: { id: string; item: ChecklistItem; type: keyof ChecklistTemplate }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr 
        ref={setNodeRef}
        style={style}
        className="border-b border-border/50 hover:bg-muted/30"
      >
        <td className="p-1 w-8">
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center justify-center cursor-grab hover:bg-muted/50 rounded p-1"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </td>
        <td className="p-1">
          {editingItem === item.id ? (
            <Input
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="text-xs h-8"
              onKeyPress={(e) => {
                if (e.key === 'Enter') saveEdit(type, item.id, true);
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
          ) : (
            <label className="text-xs block text-foreground">
              {item.description}
            </label>
          )}
        </td>
        <td className="p-1 text-center">
          <div className="flex gap-1">
            {editingItem === item.id ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveEdit(type, item.id, true)}
                  className="h-6 w-6 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(item)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTemplateItem(type, item.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTemplateTable = (type: keyof ChecklistTemplate, title: string) => {
    return (
      <div className="w-full">
        <div className="bg-muted/30 rounded-lg p-3 h-[500px] flex flex-col">
          <div className="flex flex-col gap-2 mb-3">
            <h3 className="text-lg font-semibold text-foreground">{title} Template</h3>
          </div>

          {/* Add new item section */}
          <div className="flex gap-2 mb-3">
            <Input
              value={newItemTexts[type]}
              onChange={(e) => setNewItemTexts(prev => ({ ...prev, [type]: e.target.value }))}
              placeholder="Add new template item..."
              className="flex-1 text-xs"
              onKeyPress={(e) => e.key === 'Enter' && addNewTemplateItem(type)}
            />
            <Button onClick={() => addNewTemplateItem(type)} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Table with scroll */}
          <div className="bg-card rounded-lg border border-border overflow-hidden flex-1">
            <div className="overflow-y-auto h-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, type)}
              >
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-xs font-medium text-foreground w-8">Drag</th>
                      <th className="text-left p-2 text-xs font-medium text-foreground">Description</th>
                      <th className="text-left p-2 text-xs font-medium text-foreground w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext 
                      items={templates[type].map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {templates[type].map(item => (
                        <SortableItem 
                          key={item.id} 
                          id={item.id} 
                          item={item} 
                          type={type} 
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInspectionHistory = () => {
    const groupedRecords = inspectionRecords.reduce((acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = [];
      }
      acc[record.type].push(record);
      return acc;
    }, {} as Record<string, InspectionRecord[]>);

    const types = ['monthly', 'quarterly', 'yearly'] as const;
    const expandedType = types.find(type => expandedCategories[type]);

    return (
      <div className="w-full">
        {/* Horizontal layout when no category is expanded */}
        {!expandedType && (
          <div className="grid grid-cols-3 gap-4">
            {types.map(type => (
              <Card key={type} className="h-fit">
                <CardHeader>
                  <Collapsible 
                    open={expandedCategories[type]} 
                    onOpenChange={() => toggleCategoryExpansion(type)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between w-full cursor-pointer">
                        <CardTitle className="capitalize text-base">{type} Inspections</CardTitle>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              expandedCategories[type] && "rotate-180"
                            )}
                          />
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4 p-4">
                        {groupedRecords[type]?.length > 0 ? (
                          <div className="space-y-3">
                            {groupedRecords[type]
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 2) // Show only first 2 records in collapsed view
                              .map(record => (
                                <div key={record.id} className="border rounded p-2 bg-muted/30 text-xs">
                                  <div className="font-medium">{record.date}</div>
                                  <div className="text-muted-foreground">
                                    {record.items.filter(item => item.completed).length}/{record.items.length} completed
                                  </div>
                                </div>
                              ))}
                            {groupedRecords[type]?.length > 2 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{groupedRecords[type].length - 2} more...
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4 text-xs">No inspections yet.</p>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Expanded view when one category is selected */}
        {expandedType && (
          <div className="space-y-4">
            {/* Header with all three types for easy switching */}
            <div className="flex gap-4 mb-4">
              {types.map(type => (
                <Button
                  key={type}
                  variant={expandedCategories[type] ? "default" : "outline"}
                  onClick={() => {
                    setExpandedCategories({
                      monthly: false,
                      quarterly: false,
                      yearly: false,
                      [type]: !expandedCategories[type]
                    });
                  }}
                  className="capitalize"
                >
                  {type} Inspections
                </Button>
              ))}
            </div>

            {/* Expanded content */}
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{expandedType} Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                {groupedRecords[expandedType]?.length > 0 ? (
                  <div className="space-y-4">
                    {groupedRecords[expandedType]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(record => (
                        <div key={record.id} className="border rounded-lg p-4 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Inspection: {record.date}</h4>
                            <span className="text-sm text-muted-foreground">
                              Completed: {record.items.filter(item => item.completed).length}/{record.items.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {record.items.map(item => (
                              <div key={item.id} className="text-sm flex items-start gap-2">
                                <Checkbox checked={item.completed} disabled />
                                <div className="flex-1">
                                  <div className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                    {item.description}
                                  </div>
                                  {item.notes && (
                                    <div className="text-muted-foreground text-xs mt-1">
                                      Notes: {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No inspections recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="inspections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inspections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Current Inspections
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Inspection History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Manage Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inspections" className="mt-4">
          <div className="grid grid-cols-3 gap-4 items-start">
            {renderInspectionTable('monthly', 'Monthly')}
            {renderInspectionTable('quarterly', 'Quarterly')}
            {renderInspectionTable('yearly', 'Yearly')}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          {renderInspectionHistory()}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-3 gap-4 items-start">
            {renderTemplateTable('monthly', 'Monthly')}
            {renderTemplateTable('quarterly', 'Quarterly')}
            {renderTemplateTable('yearly', 'Yearly')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
