import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
}

interface NewInspectionFormProps {
  onNavigateToTemplateManager?: () => void;
}

export const NewInspectionForm = ({ onNavigateToTemplateManager }: NewInspectionFormProps) => {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentInspection, setCurrentInspection] = useState<InspectionItem[]>([]);

  // Load templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('inspection-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

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
    const newRecord: InspectionRecord = {
      id: Date.now().toString(),
      templateId: selectedTemplateId,
      templateName: template?.name || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      items: currentInspection,
      createdAt: new Date().toISOString()
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

    toast({
      title: "Inspection saved successfully!",
      description: `${template?.name} inspection for ${format(selectedDate, 'PPP')} has been saved.`,
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const canSave = selectedTemplateId && selectedDate && currentInspection.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            New Inspection
            {canSave && (
              <Button onClick={saveInspection} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Inspection
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection and Date on Same Line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Inspection Template</label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
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
          </div>

          {/* Inspection Items */}
          {currentInspection.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{selectedTemplate?.name} Inspection</h3>
              
              <div className="space-y-2">
                {currentInspection.map(item => (
                  <div key={item.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={(checked) => 
                        updateInspectionItem(item.id, { completed: checked as boolean })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label 
                        htmlFor={item.id}
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </label>
                      <Input
                        placeholder="Add notes..."
                        value={item.notes}
                        onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                        className="text-sm"
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