import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, ChevronDown, ChevronRight, Calendar as CalendarIcon, FileText, CheckCircle, X, Edit, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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

export const EditableInspectionHistoryView = () => {
  const { toast } = useToast();
  const { profile, isOwner } = useAuth();
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<Date | undefined>();

  // Load inspection records on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('inspection-records');
    if (savedRecords) {
      setInspectionRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Save records to localStorage
  const saveRecords = (records: InspectionRecord[]) => {
    setInspectionRecords(records);
    localStorage.setItem('inspection-records', JSON.stringify(records));
  };

  // Filter records based on search term
  const filteredRecords = inspectionRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.templateName?.toLowerCase().includes(searchLower) ||
      record.date?.includes(searchLower) ||
      record.items?.some(item => 
        item.description?.toLowerCase().includes(searchLower) ||
        item.notes?.toLowerCase().includes(searchLower)
      )
    );
  });

  // Group records by template
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const templateName = record.templateName;
    if (!groups[templateName]) {
      groups[templateName] = [];
    }
    groups[templateName].push(record);
    return groups;
  }, {} as {[templateName: string]: InspectionRecord[]});

  // Sort records within each group by date (newest first)
  Object.keys(groupedRecords).forEach(templateName => {
    groupedRecords[templateName].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  const toggleGroup = (templateName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [templateName]: !prev[templateName]
    }));
  };

  const getCompletedCount = (items: InspectionItem[]) => {
    return items.filter(item => item.completed).length;
  };

  const getCompletionPercentage = (items: InspectionItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((getCompletedCount(items) / items.length) * 100);
  };

  const startEditingRecord = (recordId: string) => {
    const record = inspectionRecords.find(r => r.id === recordId);
    if (record) {
      setEditingRecord(recordId);
      setEditingDate(new Date(record.date + 'T00:00:00'));
    }
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditingDate(undefined);
  };

  const handleDateChange = (recordId: string, date: Date | undefined) => {
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
    const updatedRecords = inspectionRecords.map(record => 
      record.id === recordId 
        ? { 
            ...record, 
            date: editingDate ? format(editingDate, 'yyyy-MM-dd') : record.date 
          } 
        : record
    );
    saveRecords(updatedRecords);
    setEditingRecord(null);
    setEditingDate(undefined);
    toast({
      title: "Inspection updated",
      description: "The inspection record has been successfully updated."
    });
  };

  const updateInspectionItem = (recordId: string, itemId: string, updates: Partial<InspectionItem>) => {
    setInspectionRecords(prev => prev.map(record => 
      record.id === recordId
        ? {
            ...record,
            items: record.items.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : record
    ));
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

    const updatedRecords = inspectionRecords.filter(record => record.id !== recordId);
    saveRecords(updatedRecords);
    
    toast({
      title: "Inspection deleted",
      description: "The inspection record has been deleted successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inspection History</h2>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections, items, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {Object.keys(groupedRecords).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inspections found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No inspections match your search.' : 'No inspection records available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([templateName, records]) => (
            <Card key={templateName}>
              <Collapsible
                open={expandedGroups[templateName]}
                onOpenChange={() => toggleGroup(templateName)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedGroups[templateName] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-lg">{templateName} Inspections</CardTitle>
                        <Badge variant="secondary">{records.length} record{records.length !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {records.map(record => {
                      const isEditing = editingRecord === record.id;
                      
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
                                         onSelect={(date) => handleDateChange(record.id, date)}
                                         initialFocus
                                         className="p-3 pointer-events-auto"
                                       />
                                     </PopoverContent>
                                   </Popover>
                                 ) : (
                                   <span className="font-medium">{format(new Date(record.date + 'T00:00:00'), 'PPP')}</span>
                                 )}
                                <Badge 
                                  variant={getCompletionPercentage(record.items) === 100 ? 'default' : 'secondary'}
                                >
                                  {getCompletedCount(record.items)}/{record.items.length} completed
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Created: {format(new Date(record.createdAt), 'PPp')}
                                </span>
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
                                              Are you sure you want to delete this inspection record from {format(new Date(record.date + 'T00:00:00'), 'PPP')}? This action cannot be undone.
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
                            <div className="space-y-2">
                              {record.items.map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded">
                                  {isEditing ? (
                                    <>
                                      <Checkbox
                                        checked={item.completed}
                                        onCheckedChange={(checked) => 
                                          updateInspectionItem(record.id, item.id, { completed: checked as boolean })
                                        }
                                      />
                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <span className={cn(
                                          "text-sm font-medium flex items-center",
                                          item.completed && "line-through text-muted-foreground"
                                        )}>
                                          {item.description}
                                        </span>
                                        <Input
                                          placeholder="Add notes..."
                                          value={item.notes}
                                          onChange={(e) => updateInspectionItem(record.id, item.id, { notes: e.target.value })}
                                          className="text-sm h-8"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mt-1">
                                        {item.completed ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <X className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      
                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                          {item.description}
                                        </div>
                                        {item.notes && (
                                          <div className="text-sm text-muted-foreground">
                                            <strong>Notes:</strong> {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
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