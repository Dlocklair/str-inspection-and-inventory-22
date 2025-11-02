import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Save, Settings, X, Bell } from 'lucide-react';
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
  frequencyType?: string;
  frequencyDays?: number;
  nextDueDate?: string;
  notificationsEnabled?: boolean;
  notificationMethod?: string;
  notificationDaysAhead?: number;
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
  
  // Frequency and notification settings
  const [frequencyType, setFrequencyType] = useState<string>('');
  const [customFrequencyDays, setCustomFrequencyDays] = useState<number>(30);
  const [nextDueDate, setNextDueDate] = useState<Date>();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [notificationMethod, setNotificationMethod] = useState<string>('email');
  const [notificationDaysAhead, setNotificationDaysAhead] = useState<number>(7);

  // Load templates on mount and add default templates if none exist
  useEffect(() => {
    const savedTemplates = localStorage.getItem('inspection-templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      // Add default templates
      const defaultTemplates = [
        {
          id: 'default-1',
          name: 'Standard Property Inspection',
          isPredefined: true,
          items: [
            { id: '1', description: 'Check all light fixtures and bulbs', notes: '' },
            { id: '2', description: 'Inspect HVAC filters', notes: '' },
            { id: '3', description: 'Test smoke detectors', notes: '' },
            { id: '4', description: 'Check plumbing for leaks', notes: '' },
            { id: '5', description: 'Inspect doors and windows', notes: '' }
          ]
        },
        {
          id: 'default-2',
          name: 'Quick Maintenance Check',
          isPredefined: true,
          items: [
            { id: '1', description: 'Check thermostat settings', notes: '' },
            { id: '2', description: 'Test all electrical outlets', notes: '' },
            { id: '3', description: 'Inspect exterior lighting', notes: '' }
          ]
        }
      ];
      setTemplates(defaultTemplates);
      localStorage.setItem('inspection-templates', JSON.stringify(defaultTemplates));
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

    // Validate frequency settings if provided
    if (frequencyType && frequencyType !== 'none' && !nextDueDate) {
      toast({
        title: "Next due date required",
        description: "Please select the next due date for this recurring inspection.",
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
      // Include frequency and notification settings if provided
      ...(frequencyType && frequencyType !== 'none' && {
        frequencyType,
        ...(frequencyType === 'custom' && { frequencyDays: customFrequencyDays }),
        nextDueDate: nextDueDateString,
        notificationsEnabled,
        notificationMethod,
        notificationDaysAhead
      })
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
    setFrequencyType('');
    setCustomFrequencyDays(30);
    setNextDueDate(undefined);
    setNotificationsEnabled(true);
    setNotificationMethod('email');
    setNotificationDaysAhead(7);

    toast({
      title: "Inspection saved successfully!",
      description: `${template?.name} inspection for ${format(selectedDate, 'PPP')} has been saved.${nextDueDate ? ` Next inspection due: ${format(nextDueDate, 'PPP')}` : ''}`,
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

          {/* Frequency and Next Due Date Settings */}
          {selectedTemplateId && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Frequency & Notification Settings (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequency Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={frequencyType} onValueChange={setFrequencyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency (optional)" />
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
                  {frequencyType === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Days Between Inspections</label>
                      <Input
                        type="number"
                        min="1"
                        value={customFrequencyDays}
                        onChange={(e) => setCustomFrequencyDays(parseInt(e.target.value) || 30)}
                        placeholder="Enter number of days"
                      />
                    </div>
                  )}

                  {/* Next Due Date */}
                  {frequencyType && frequencyType !== 'none' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Next Due Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !nextDueDate && "text-muted-foreground"
                            )}
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
                    </div>
                  )}
                </div>

                {/* Notification Settings */}
                {frequencyType && frequencyType !== 'none' && nextDueDate && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications-enabled" className="text-sm font-medium">
                          Enable Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive reminders before the inspection is due
                        </p>
                      </div>
                      <Switch
                        id="notifications-enabled"
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>

                    {notificationsEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Notification Method */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Notification Method</label>
                          <Select value={notificationMethod} onValueChange={setNotificationMethod}>
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
                            value={notificationDaysAhead}
                            onChange={(e) => setNotificationDaysAhead(parseInt(e.target.value) || 7)}
                            placeholder="Number of days"
                          />
                          <p className="text-xs text-muted-foreground">
                            You'll be notified {notificationDaysAhead} day{notificationDaysAhead !== 1 ? 's' : ''} before the due date
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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