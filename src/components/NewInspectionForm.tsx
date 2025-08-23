import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export const NewInspectionForm = () => {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentInspection, setCurrentInspection] = useState<InspectionItem[]>([]);
  const [showDateNote, setShowDateNote] = useState(false);

  // Load templates on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('inspection-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Load template items when template is selected
  const handleTemplateChange = (templateId: string) => {
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
      setShowDateNote(false);
      setSelectedDate(undefined);
    }
  };

  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && currentInspection.length > 0) {
      setShowDateNote(true);
    }
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
    setShowDateNote(false);

    toast({
      title: "Inspection saved successfully!",
      description: `${template?.name} inspection for ${format(selectedDate, 'PPP')} has been saved.`,
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          {selectedTemplateId && (
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
          )}

          {/* Date Selection Note */}
          {showDateNote && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select items completed and enter notes as required.
              </AlertDescription>
            </Alert>
          )}

          {/* Inspection Items */}
          {currentInspection.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{selectedTemplate?.name} Inspection</h3>
              
              <div className="space-y-3">
                {currentInspection.map(item => (
                  <Card key={item.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              updateInspectionItem(item.id, { completed: checked as boolean })
                            }
                          />
                          <label 
                            htmlFor={item.id}
                            className={cn(
                              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.description}
                          </label>
                        </div>
                        
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={item.notes}
                          onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={saveInspection}
                className="w-full"
                size="lg"
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