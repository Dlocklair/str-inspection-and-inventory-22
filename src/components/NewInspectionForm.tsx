import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, Settings, X, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInspectionTemplates } from '@/hooks/useInspectionTemplates';
import { useCreateInspectionRecord } from '@/hooks/useInspectionRecords';

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
  propertyIds?: string[];
  propertyId?: string;     // Keep for backward compatibility
  propertyName?: string;
  frequencyType?: string;
  frequencyDays?: number;
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
  propertyId?: string;
  propertyName?: string;
  date: string;
  items: InspectionItem[];
  createdAt: string;
  nextDueDate?: string;
  performedBy?: string;
}

interface NewInspectionFormProps {
  onNavigateToTemplateManager?: () => void;
}

export const NewInspectionForm = ({ onNavigateToTemplateManager }: NewInspectionFormProps) => {
  const { toast } = useToast();
  const { selectedProperty, propertyMode, userProperties, setSelectedProperty } = usePropertyContext();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentInspection, setCurrentInspection] = useState<InspectionItem[]>([]);
  const [nextDueDate, setNextDueDate] = useState<Date>();

  // Fetch templates from database for the selected property
  const { data: templates = [], isLoading: templatesLoading } = useInspectionTemplates(
    selectedProperty?.id
  );
  const createRecord = useCreateInspectionRecord();

  // Reset form when property changes
  useEffect(() => {
    setSelectedTemplateId('');
    setCurrentInspection([]);
  }, [selectedProperty]);

  // Calculate next occurrence based on frequency
  const calculateNextOccurrence = (
    inspectionDate: Date,
    frequencyType?: string,
    frequencyDays?: number
  ): Date | undefined => {
    if (!frequencyType || frequencyType === 'none' || frequencyType === 'per_visit') return undefined;
    
    const nextDate = new Date(inspectionDate);
    
    switch (frequencyType) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi-annual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'custom':
        if (frequencyDays) {
          nextDate.setDate(nextDate.getDate() + frequencyDays);
        }
        break;
    }
    
    return nextDate;
  };

  // Auto-calculate next occurrence when date and template with frequency are selected
  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedDate && selectedTemplate?.frequency_type) {
      const calculatedNext = calculateNextOccurrence(
        selectedDate,
        selectedTemplate.frequency_type,
        selectedTemplate.frequency_days
      );
      if (calculatedNext) {
        setNextDueDate(calculatedNext);
      }
    }
  }, [selectedDate, selectedTemplateId, templates]);

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
  const saveInspection = async () => {
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

    if (!selectedProperty?.id) {
      toast({
        title: "Property required",
        description: "Please select a property.",
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
    
    // Get current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;
    
    // Save to database
    createRecord.mutate({
      template_id: selectedTemplateId,
      property_id: selectedProperty.id,
      inspection_date: dateString,
      next_due_date: nextDueDateString,
      items: currentInspection,
      performed_by: profile.id,
      entered_by: profile.id
    }, {
      onSuccess: () => {
        // Reset form
        setCurrentInspection([]);
        setSelectedTemplateId('');
        setSelectedDate(undefined);
        setNextDueDate(undefined);
      }
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const canSave = selectedTemplateId && selectedDate && currentInspection.length > 0;

  return (
    <div className="space-y-6">
      {/* Simple Property Selector - Only show actual properties */}
      {userProperties.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Property</label>
              <Select
                value={selectedProperty?.id || ''}
                onValueChange={(value) => {
                  const property = userProperties.find(p => p.id === value);
                  if (property) {
                    setSelectedProperty(property);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {userProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id} className="cursor-pointer">
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
      {userProperties.length === 1 && selectedProperty && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{selectedProperty.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
              </p>
            </div>
          </div>
        </Card>
      )}
      
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  Next Occurrence Date
                </label>
                {selectedTemplate?.frequency_type && selectedTemplate.frequency_type !== 'none' && selectedTemplate.frequency_type !== 'per_visit' && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedTemplate.frequency_type === 'monthly' ? 'Monthly' :
                     selectedTemplate.frequency_type === 'quarterly' ? 'Quarterly' :
                     selectedTemplate.frequency_type === 'semi-annual' ? 'Semi-Annual' :
                     selectedTemplate.frequency_type === 'annually' ? 'Annually' :
                     selectedTemplate.frequency_type === 'weekly' ? 'Weekly' :
                     selectedTemplate.frequency_type === 'custom' ? `Every ${selectedTemplate.frequency_days} days` :
                     selectedTemplate.frequency_type}
                  </Badge>
                )}
              </div>
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
              {selectedTemplate?.frequency_type && selectedTemplate.frequency_type !== 'none' && selectedTemplate.frequency_type !== 'per_visit' ? (
                <p className="text-xs text-muted-foreground">
                  Auto-calculated based on frequency. You can override if needed.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optional: Set when the next inspection should occur
                </p>
              )}
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