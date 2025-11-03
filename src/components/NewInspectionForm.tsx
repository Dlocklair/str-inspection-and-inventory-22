import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, Settings, X, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { PropertySelector } from './PropertySelector';

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
  propertyId?: string;
  propertyName?: string;
}

interface InspectionItem {
  id: string;
  description: string;
  completed: boolean;
  notes: string;
}

interface InspectionRecord {
  id: string;
  templateId: string;
  templateName: string;
  date: string;
  items: InspectionItem[];
  createdAt: string;
  nextDueDate?: string;
}

interface NewInspectionFormProps {
  onNavigateToTemplateManager?: () => void;
}

export const NewInspectionForm = ({ onNavigateToTemplateManager }: NewInspectionFormProps) => {
  const { toast } = useToast();
  const { selectedProperty } = usePropertyContext();
  
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentInspection, setCurrentInspection] = useState<InspectionItem[]>([]);
  const [nextDueDate, setNextDueDate] = useState<Date>();

  // Load templates when property context changes
  useEffect(() => {
    if (selectedProperty) {
      loadTemplatesForProperty(selectedProperty.id);
    } else {
      setTemplates([]);
      setSelectedTemplateId('');
    }
  }, [selectedProperty]);

  const loadTemplatesForProperty = (propertyId: string) => {
    const savedTemplates = localStorage.getItem('inspection-templates');
    if (savedTemplates) {
      const allTemplates = JSON.parse(savedTemplates);
      const propertyTemplates = allTemplates.filter((t: InspectionTemplate) => 
        t.propertyId === propertyId
      );
      setTemplates(propertyTemplates);
    }
  };

  // Load template items when template is selected
  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'create-custom') {
      onNavigateToTemplateManager?.();
      return;
    }
    
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      const inspectionItems: InspectionItem[] = template.items.map(item => ({
        id: `${Date.now()}-${item.id}`,
        description: item.description,
        completed: false,
        notes: ''
      }));
      setCurrentInspection(inspectionItems);
      setSelectedDate(undefined);
    }
  };

  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    if (date && date > new Date()) {
      toast({
        title: "Invalid date",
        description: "Future dates cannot be selected for inspections.",
        variant: "destructive"
      });
      return;
    }
    setSelectedDate(date);
  };

  // Update inspection item
  const updateInspectionItem = (id: string, updates: Partial<InspectionItem>) => {
    setCurrentInspection(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Save inspection
  const saveInspection = () => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select an inspection date.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Template required", 
        description: "Please select an inspection template.",
        variant: "destructive"
      });
      return;
    }

    if (currentInspection.length === 0) {
      toast({
        title: "No items",
        description: "No inspection items to save.",
        variant: "destructive"
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    
    // Format date as ISO string then extract date part to avoid timezone issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Format next due date if provided
    let nextDueDateString: string | undefined;
    if (nextDueDate) {
      const dueYear = nextDueDate.getFullYear();
      const dueMonth = String(nextDueDate.getMonth() + 1).padStart(2, '0');
      const dueDay = String(nextDueDate.getDate()).padStart(2, '0');
      nextDueDateString = `${dueYear}-${dueMonth}-${dueDay}`;
    }
    
    const newRecord: InspectionRecord = {
      id: Date.now().toString(),
      templateId: selectedTemplateId,
      templateName: template?.name || '',
      date: dateString,
      items: currentInspection,
      createdAt: new Date().toISOString(),
      ...(nextDueDateString && { nextDueDate: nextDueDateString })
    };

    // Save to localStorage
    const savedRecords = localStorage.getItem('inspection-records');
    const records = savedRecords ? JSON.parse(savedRecords) : [];
    records.push(newRecord);
    localStorage.setItem('inspection-records', JSON.stringify(records));

    // Reset form
    setCurrentInspection([]);
    setSelectedTemplateId('');
    setSelectedDate(undefined);
    setNextDueDate(undefined);

    toast({
      title: "Inspection saved successfully!",
      description: `${template?.name} inspection for ${format(selectedDate, 'PPP')} has been saved.${nextDueDate ? ` Next inspection due: ${format(nextDueDate, 'PPP')}` : ''}`,
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const canSave = selectedTemplateId && selectedDate && currentInspection.length > 0;

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      <PropertySelector />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            New Inspection
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              {canSave && (
                <Button onClick={saveInspection} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Inspection
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Info Display */}
          {selectedProperty && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{selectedProperty.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedProperty.address}</div>
                </div>
              </div>
            </div>
          )}

          {/* Template Selection, Date, and Next Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Inspection Template</label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={handleTemplateChange}
                disabled={!selectedProperty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an inspection template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="create-custom">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Define Custom Template
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Inspection Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={!selectedTemplateId}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Next Due Date (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Next Occurrence Date
                <span className="text-xs text-muted-foreground ml-2">(For recurring inspections)</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !nextDueDate && "text-muted-foreground"
                    )}
                    disabled={!selectedTemplateId}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDueDate ? format(nextDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextDueDate}
                    onSelect={setNextDueDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Set when the next inspection of this type should occur to establish a recurring schedule
              </p>
            </div>
          </div>

          {/* Inspection Items */}
          {currentInspection.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{selectedTemplate?.name} Inspection</h3>
              
              <div className="space-y-1">
                {currentInspection.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={(checked) => 
                        updateInspectionItem(item.id, { completed: checked as boolean })
                      }
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <label 
                        htmlFor={item.id}
                        className={cn(
                          "text-sm font-medium cursor-pointer flex items-center",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </label>
                      <Input
                        placeholder="Add notes..."
                        value={item.notes}
                        onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Save Button */}
              <Button 
                onClick={saveInspection}
                className="w-full"
                size="lg"
                disabled={!canSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Inspection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};