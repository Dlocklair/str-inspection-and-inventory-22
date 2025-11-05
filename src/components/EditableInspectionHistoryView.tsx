import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, ChevronDown, ChevronRight, Calendar as CalendarIcon, FileText, Edit, Save, Trash2, Building2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInspectionRecords, useUpdateInspectionRecord, useDeleteInspectionRecord } from '@/hooks/useInspectionRecords';

interface InspectionItem {
  id: string;
  description: string;
  completed: boolean;
  notes: string;
}

export const EditableInspectionHistoryView = () => {
  const { toast } = useToast();
  const { profile, isOwner } = useAuth();
  const { selectedProperty, userProperties, setSelectedProperty } = usePropertyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<Date | undefined>();

  // Fetch inspection records from database for selected property
  const { data: inspectionRecords = [], isLoading } = useInspectionRecords(selectedProperty?.id);
  const updateRecord = useUpdateInspectionRecord();
  const deleteRecord = useDeleteInspectionRecord();

  // Filter records based on search term
  const filteredRecords = (inspectionRecords || []).filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const items = (record.items as any[]) || [];
    return items.some(item => 
      item.description?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Group records by template_id
  const groupedByTemplate = filteredRecords.reduce((groups, record) => {
    const templateId = record.template_id || 'unknown';
    if (!groups[templateId]) {
      groups[templateId] = [];
    }
    groups[templateId].push(record);
    return groups;
  }, {} as {[templateId: string]: typeof inspectionRecords});

  // Sort records by date (newest first)
  Object.values(groupedByTemplate).forEach(records => {
    records.sort((a, b) => 
      new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
    );
  });

  const toggleGroup = (templateId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const getCompletedCount = (items: any[]) => {
    return items.filter(item => item.completed).length;
  };

  const startEditingRecord = (recordId: string) => {
    const record = inspectionRecords.find(r => r.id === recordId);
    if (record) {
      setEditingRecord(recordId);
      setEditingDate(new Date(record.inspection_date + 'T00:00:00'));
    }
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditingDate(undefined);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && date > new Date()) {
      toast({
        title: "Invalid date",
        description: "Future dates cannot be selected for inspections.",
        variant: "destructive"
      });
      return;
    }
    setEditingDate(date);
  };

  const saveEditedRecord = (recordId: string) => {
    if (!editingDate) return;
    
    const year = editingDate.getFullYear();
    const month = String(editingDate.getMonth() + 1).padStart(2, '0');
    const day = String(editingDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    updateRecord.mutate({
      id: recordId,
      inspection_date: dateString
    }, {
      onSuccess: () => {
        setEditingRecord(null);
        setEditingDate(undefined);
      }
    });
  };

  const updateInspectionItem = (recordId: string, itemId: string, updates: Partial<InspectionItem>) => {
    const record = inspectionRecords.find(r => r.id === recordId);
    if (!record) return;

    const items = (record.items as any[]) || [];
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    updateRecord.mutate({
      id: recordId,
      items: updatedItems
    });
  };

  const deleteInspectionRecord = (recordId: string) => {
    if (!isOwner()) {
      toast({
        title: "Access denied",
        description: "Only owners can delete inspection records.",
        variant: "destructive"
      });
      return;
    }

    deleteRecord.mutate(recordId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Inspection History</h2>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a property">
                    {selectedProperty && (
                      <span className="font-medium">
                        {selectedProperty.name} - {selectedProperty.address}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{property.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {property.address}, {property.city}, {property.state} {property.zip}
                        </span>
                      </div>
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

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading inspections...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedByTemplate).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inspections found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No inspections match your search.' : selectedProperty ? `No inspection records for ${selectedProperty.name}.` : 'Please select a property.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByTemplate).map(([templateId, records]) => (
            <Card key={templateId} className="border-l-4 border-l-primary">
              <Collapsible
                open={expandedGroups[templateId]}
                onOpenChange={() => toggleGroup(templateId)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedGroups[templateId] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-lg">Inspection Records</CardTitle>
                        <Badge variant="secondary">{records.length} record{records.length !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
            
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {records.map(record => {
                      const isEditing = editingRecord === record.id;
                      const items = (record.items as any[]) || [];
                  
                      return (
                        <Card key={record.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                {isEditing ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "justify-start text-left font-normal",
                                          !editingDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editingDate ? format(editingDate, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={editingDate}
                                        onSelect={handleDateChange}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="font-medium">{format(new Date(record.inspection_date + 'T00:00:00'), 'PPP')}</span>
                                )}
                                <Badge 
                                  variant={getCompletedCount(items) === items.length ? 'default' : 'secondary'}
                                >
                                  {getCompletedCount(items)}/{items.length} completed
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isEditing ? (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => startEditingRecord(record.id)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {isOwner() && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="outline">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this inspection record from {format(new Date(record.inspection_date + 'T00:00:00'), 'PPP')}? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteInspectionRecord(record.id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={() => saveEditedRecord(record.id)}>
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {items.map((item: any) => (
                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={(checked) => 
                                      updateInspectionItem(record.id, item.id, { completed: !!checked })
                                    }
                                    className="mt-1"
                                  />
                                  <div className="flex-1 space-y-1">
                                    <p className={cn(
                                      "text-sm font-medium",
                                      item.completed && "line-through text-muted-foreground"
                                    )}>
                                      {item.description}
                                    </p>
                                    <Input
                                      placeholder="Add notes..."
                                      value={item.notes || ''}
                                      onChange={(e) => 
                                        updateInspectionItem(record.id, item.id, { notes: e.target.value })
                                      }
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
