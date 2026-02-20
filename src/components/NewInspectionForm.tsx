import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, Settings, X, Building2, Camera, CheckCircle, XCircle, AlertTriangle, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInspectionTemplates } from '@/hooks/useInspectionTemplates';
import { useCreateInspectionRecord } from '@/hooks/useInspectionRecords';
import { useMyAssignments } from '@/hooks/useInspectionAssignments';
import { useAuth } from '@/hooks/useAuth';
import { InspectionSummary } from './InspectionSummary';
import CameraCapture from './CameraCapture';

type ItemStatus = 'pass' | 'fail' | 'needs_attention' | 'not_checked';

interface InspectionItem {
  id: string;
  description: string;
  completed: boolean;
  status: ItemStatus;
  notes: string;
  photo_urls: string[];
}

interface NewInspectionFormProps {
  onNavigateToTemplateManager?: () => void;
}

export const NewInspectionForm = ({ onNavigateToTemplateManager }: NewInspectionFormProps) => {
  const { toast } = useToast();
  const { selectedProperty, userProperties, setSelectedProperty } = usePropertyContext();
  const { isOwner, isManager, isInspector, profile } = useAuth();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentInspection, setCurrentInspection] = useState<InspectionItem[]>([]);
  const [nextDueDate, setNextDueDate] = useState<Date>();
  const [showSummary, setShowSummary] = useState(false);
  const [savedItems, setSavedItems] = useState<InspectionItem[]>([]);
  const [cameraItemId, setCameraItemId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useInspectionTemplates(selectedProperty?.id);
  const { data: myAssignments = [] } = useMyAssignments();
  const createRecord = useCreateInspectionRecord();

  // Filter templates based on role and assignments
  const availableTemplates = (() => {
    if (isOwner() || isManager()) return templates;
    // Inspectors only see assigned templates
    const assignedTemplateIds = myAssignments.map(a => a.template_id);
    if (assignedTemplateIds.length === 0) return templates; // Fallback: show all if no assignments exist
    return templates.filter(t => assignedTemplateIds.includes(t.id));
  })();

  useEffect(() => {
    setSelectedTemplateId('');
    setCurrentInspection([]);
  }, [selectedProperty]);

  const calculateNextOccurrence = (inspectionDate: Date, frequencyType?: string, frequencyDays?: number): Date | undefined => {
    if (!frequencyType || frequencyType === 'none' || frequencyType === 'per_visit') return undefined;
    const nextDate = new Date(inspectionDate);
    switch (frequencyType) {
      case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'semi-annual': nextDate.setMonth(nextDate.getMonth() + 6); break;
      case 'annually': case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      case 'custom': if (frequencyDays) nextDate.setDate(nextDate.getDate() + frequencyDays); break;
    }
    return nextDate;
  };

  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedDate && selectedTemplate?.frequency_type) {
      const calculatedNext = calculateNextOccurrence(selectedDate, selectedTemplate.frequency_type, selectedTemplate.frequency_days ?? undefined);
      if (calculatedNext) setNextDueDate(calculatedNext);
    }
  }, [selectedDate, selectedTemplateId, templates]);

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
        status: 'not_checked' as ItemStatus,
        notes: '',
        photo_urls: [],
      }));
      setCurrentInspection(inspectionItems);
      setSelectedDate(undefined);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && date > new Date()) {
      toast({ title: "Invalid date", description: "Future dates cannot be selected.", variant: "destructive" });
      return;
    }
    setSelectedDate(date);
  };

  const updateInspectionItem = (id: string, updates: Partial<InspectionItem>) => {
    setCurrentInspection(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const setItemStatus = (id: string, status: ItemStatus) => {
    updateInspectionItem(id, { status, completed: status === 'pass' });
  };

  const handlePhotoCapture = async (imageSrc: string) => {
    if (!cameraItemId) return;
    setUploadingPhoto(cameraItemId);
    
    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const fileName = `${Date.now()}-${cameraItemId}.jpg`;
      const filePath = `inspections/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('inspection-evidence')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('inspection-evidence')
        .getPublicUrl(filePath);

      const item = currentInspection.find(i => i.id === cameraItemId);
      if (item) {
        updateInspectionItem(cameraItemId, {
          photo_urls: [...(item.photo_urls || []), publicUrl],
        });
      }
      toast({ title: 'Photo added', description: 'Evidence photo uploaded successfully.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
      setCameraItemId(null);
    }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploadingPhoto(itemId);
    try {
      const fileName = `${Date.now()}-${itemId}-${file.name}`;
      const filePath = `inspections/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('inspection-evidence')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('inspection-evidence')
        .getPublicUrl(filePath);

      const item = currentInspection.find(i => i.id === itemId);
      if (item) {
        updateInspectionItem(itemId, {
          photo_urls: [...(item.photo_urls || []), publicUrl],
        });
      }
      toast({ title: 'Photo added', description: 'Evidence photo uploaded.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const saveInspection = async () => {
    if (!selectedDate || !selectedTemplateId || !selectedProperty?.id || currentInspection.length === 0) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    let nextDueDateString: string | undefined;
    if (nextDueDate) {
      nextDueDateString = `${nextDueDate.getFullYear()}-${String(nextDueDate.getMonth() + 1).padStart(2, '0')}-${String(nextDueDate.getDate()).padStart(2, '0')}`;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userProfile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!userProfile) return;

    createRecord.mutate({
      template_id: selectedTemplateId,
      property_id: selectedProperty.id,
      inspection_date: dateString,
      next_due_date: nextDueDateString,
      items: currentInspection,
      performed_by: userProfile.id,
      entered_by: userProfile.id,
    }, {
      onSuccess: () => {
        // Show summary
        setSavedItems([...currentInspection]);
        setShowSummary(true);
      },
    });
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setSavedItems([]);
    setCurrentInspection([]);
    setSelectedTemplateId('');
    setSelectedDate(undefined);
    setNextDueDate(undefined);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const canSave = selectedTemplateId && selectedDate && currentInspection.length > 0;

  // Show summary after saving
  if (showSummary && savedItems.length > 0) {
    return (
      <InspectionSummary
        items={savedItems}
        templateName={selectedTemplate?.name || 'Inspection'}
        propertyName={selectedProperty?.name || 'Property'}
        inspectionDate={selectedDate ? format(selectedDate, 'PPP') : ''}
        onClose={handleCloseSummary}
      />
    );
  }

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'needs_attention': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      {userProperties.length > 1 && (
        <Card className="p-4 bg-primary/10 border-primary/30 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Property</label>
              <Select value={selectedProperty?.id || ''} onValueChange={value => {
                const property = userProperties.find(p => p.id === value);
                if (property) setSelectedProperty(property);
              }}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {userProperties.map(property => (
                    <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
      {userProperties.length === 1 && selectedProperty && (
        <Card className="p-4 bg-primary/10 border-primary/30 shadow-sm">
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
          {/* Template Selection, Date, Next Due */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Inspection Template</label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={!selectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Inspection Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !selectedDate && "text-muted-foreground")} disabled={!selectedTemplateId}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Next Occurrence Date</label>
                {selectedTemplate?.frequency_type && selectedTemplate.frequency_type !== 'none' && selectedTemplate.frequency_type !== 'per_visit' && (
                  <Badge variant="secondary" className="text-xs">{selectedTemplate.frequency_type}</Badge>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !nextDueDate && "text-muted-foreground")} disabled={!selectedTemplateId}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDueDate ? format(nextDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar mode="single" selected={nextDueDate} onSelect={setNextDueDate} disabled={date => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {selectedTemplate?.frequency_type && selectedTemplate.frequency_type !== 'none' && selectedTemplate.frequency_type !== 'per_visit' 
                  ? 'Auto-calculated based on frequency. Override if needed.' 
                  : 'Optional: Set when the next inspection should occur'}
              </p>
            </div>
          </div>

          {/* Inspection Items with Pass/Fail/Photo */}
          {currentInspection.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                {selectedTemplate?.name} Inspection
              </h3>
              
              {/* Status Legend */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Pass</span>
                <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Fail</span>
                <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" /> Needs Attention</span>
              </div>
              
              <div className="space-y-2">
                {currentInspection.map(item => (
                  <div key={item.id} className={cn(
                    "p-3 rounded-lg border transition-colors",
                    item.status === 'pass' && "bg-green-500/5 border-green-500/20",
                    item.status === 'fail' && "bg-destructive/5 border-destructive/20",
                    item.status === 'needs_attention' && "bg-yellow-500/5 border-yellow-500/20",
                    item.status === 'not_checked' && "bg-muted/20"
                  )}>
                    <div className="flex items-start gap-3">
                      {/* Status indicator */}
                      <div className="mt-1">{getStatusIcon(item.status)}</div>
                      
                      <div className="flex-1 space-y-2">
                        <label className={cn("text-sm font-medium", item.status === 'pass' && "line-through text-muted-foreground")}>
                          {item.description}
                        </label>
                        
                        {/* Status buttons */}
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm" variant={item.status === 'pass' ? 'default' : 'outline'}
                            className="h-7 text-xs inline-btn gap-1"
                            onClick={() => setItemStatus(item.id, 'pass')}
                          >
                            <CheckCircle className="h-3 w-3" /> Pass
                          </Button>
                          <Button
                            size="sm" variant={item.status === 'fail' ? 'destructive' : 'outline'}
                            className="h-7 text-xs inline-btn gap-1"
                            onClick={() => setItemStatus(item.id, 'fail')}
                          >
                            <XCircle className="h-3 w-3" /> Fail
                          </Button>
                          <Button
                            size="sm" variant={item.status === 'needs_attention' ? 'default' : 'outline'}
                            className="h-7 text-xs inline-btn gap-1"
                            onClick={() => setItemStatus(item.id, 'needs_attention')}
                          >
                            <AlertTriangle className="h-3 w-3" /> Attention
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs inline-btn gap-1"
                            onClick={() => setCameraItemId(item.id)}
                            disabled={uploadingPhoto === item.id}
                          >
                            <Camera className="h-3 w-3" />
                            {uploadingPhoto === item.id ? 'Uploading...' : 'Photo'}
                          </Button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(item.id, file);
                              }}
                            />
                            <Button size="sm" variant="outline" className="h-7 text-xs inline-btn gap-1" asChild>
                              <span><ImageIcon className="h-3 w-3" /> Upload</span>
                            </Button>
                          </label>
                        </div>
                        
                        {/* Notes */}
                        <Input
                          placeholder="Add notes..."
                          value={item.notes}
                          onChange={e => updateInspectionItem(item.id, { notes: e.target.value })}
                          className="text-sm h-8"
                        />
                        
                        {/* Photo thumbnails */}
                        {item.photo_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.photo_urls.map((url, idx) => (
                              <div key={idx} className="relative">
                                <img src={url} alt={`Evidence ${idx + 1}`} className="w-16 h-16 rounded object-cover border" />
                                <Button
                                  size="sm" variant="destructive"
                                  className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full inline-btn"
                                  onClick={() => updateInspectionItem(item.id, {
                                    photo_urls: item.photo_urls.filter((_, i) => i !== idx),
                                  })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">
                  {currentInspection.filter(i => i.status === 'pass').length} Passed
                </Badge>
                <Badge variant="destructive">
                  {currentInspection.filter(i => i.status === 'fail').length} Failed
                </Badge>
                <Badge variant="outline">
                  {currentInspection.filter(i => i.status === 'needs_attention').length} Attention
                </Badge>
                <Badge variant="outline">
                  {currentInspection.filter(i => i.status === 'not_checked').length} Unchecked
                </Badge>
              </div>

              {/* Save Button */}
              <Button onClick={saveInspection} className="w-full" size="lg" disabled={!canSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Inspection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Capture Dialog */}
      <CameraCapture
        isOpen={!!cameraItemId}
        onCapture={handlePhotoCapture}
        onClose={() => setCameraItemId(null)}
      />
    </div>
  );
};
