import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Save, X, Trash2, GripVertical } from 'lucide-react';
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
      className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={editingText}
            onChange={(e) => onTextChange(e.target.value)}
            className="flex-1"
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
          <span className="flex-1">{item.description}</span>
          <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(templateId, item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export const InspectionTemplateManager = () => {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [newItemTexts, setNewItemTexts] = useState<{[templateId: string]: string}>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  
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
      setTemplates(JSON.parse(savedTemplates));
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
      localStorage.setItem('inspection-templates', JSON.stringify(defaultTemplates));
    }
  }, []);

  // Save templates when they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('inspection-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const addNewItem = (templateId: string) => {
    const text = newItemTexts[templateId]?.trim();
    if (!text) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      description: text,
      notes: ''
    };

    setTemplates(prev => prev.map(template => 
      template.id === templateId
        ? { ...template, items: [...template.items, newItem] }
        : template
    ));

    setNewItemTexts(prev => ({ ...prev, [templateId]: '' }));
    
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

  const handleDragEnd = (event: any, templateId: string) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTemplates(prev => prev.map(template => {
        if (template.id !== templateId) return template;
        
        const items = template.items;
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return {
          ...template,
          items: arrayMove(items, oldIndex, newIndex)
        };
      }));
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
    setNewTemplateName('');
    
    toast({
      title: "Template created",
      description: `Custom template "${newTemplate.name}" has been created.`,
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
    
    toast({
      title: "Template deleted",
      description: "Custom template has been deleted.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Inspection Templates</h2>
        <div className="flex gap-2">
          <Input
            placeholder="New template name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="w-48"
          />
          <Button onClick={createCustomTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <Tabs value={templates[0]?.id || ''} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {templates.slice(0, 4).map(template => (
            <TabsTrigger key={template.id} value={template.id}>
              {template.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map(template => (
          <TabsContent key={template.id} value={template.id} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.name} Template</CardTitle>
                  {!template.isPredefined && (
                    <Button variant="outline" size="sm" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, template.id)}
                >
                  <SortableContext
                    items={template.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {template.items.map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          templateId={template.id}
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

                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Add new inspection item"
                    value={newItemTexts[template.id] || ''}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [template.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewItem(template.id);
                      }
                    }}
                  />
                  <Button onClick={() => addNewItem(template.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Custom templates tabs */}
        {templates.slice(4).map(template => (
          <TabsContent key={template.id} value={template.id} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.name} Template</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, template.id)}
                >
                  <SortableContext
                    items={template.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {template.items.map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          templateId={template.id}
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

                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Add new inspection item"
                    value={newItemTexts[template.id] || ''}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [template.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewItem(template.id);
                      }
                    }}
                  />
                  <Button onClick={() => addNewItem(template.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Display custom templates tabs if more than 4 total */}
      {templates.length > 4 && (
        <Tabs className="w-full mt-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${templates.length - 4}, 1fr)` }}>
            {templates.slice(4).map(template => (
              <TabsTrigger key={template.id} value={template.id}>
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
};