import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Search, ChevronDown, ChevronRight, Calendar as CalendarIcon, FileText, Edit, Save, Trash2, X } from 'lucide-react';
import { format, startOfYear, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInspectionRecords, useUpdateInspectionRecord, useDeleteInspectionRecord, InspectionRecord, InspectionItem } from '@/hooks/useInspectionRecords';
import { useInspectionTemplates } from '@/hooks/useInspectionTemplates';

export const EditableInspectionHistoryView = () => {
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const { selectedProperty, userProperties, setSelectedProperty } = usePropertyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [expandedRecords, setExpandedRecords] = useState<{[key: string]: boolean}>({});
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editedRecord, setEditedRecord] = useState<InspectionRecord | null>(null);
  
  // Date filtering
  const [dateFilter, setDateFilter] = useState<'all' | 'this-year' | 'past-12-months' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const { data: inspectionRecords = [], isLoading } = useInspectionRecords(selectedProperty?.id);
  const { data: templates = [] } = useInspectionTemplates();
  const updateRecord = useUpdateInspectionRecord();
  const deleteRecord = useDeleteInspectionRecord();

  // Apply date filtering
  const dateFilteredRecords = inspectionRecords.filter(record => {
    if (dateFilter === 'all') return true;
    
    const recordDate = parseISO(record.inspection_date);
    const now = new Date();
    
    if (dateFilter === 'this-year') {
      return isWithinInterval(recordDate, {
        start: startOfYear(now),
        end: now
      });
    }
    
    if (dateFilter === 'past-12-months') {
      return isWithinInterval(recordDate, {
        start: subMonths(now, 12),
        end: now
      });
    }
    
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      return isWithinInterval(recordDate, {
        start: customStartDate,
        end: customEndDate
      });
    }
    
    return true;
  });

  const filteredRecords = dateFilteredRecords.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return record.items.some(item => 
      item.description?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower)
    );
  });

  // Group records: Property -> Year -> Template (when "All Properties")
  // or Year -> Template (when single property selected)
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const year = new Date(record.inspection_date).getFullYear().toString();
    const propertyId = record.property_id || 'unassigned-property';
    const propertyName = userProperties.find(p => p.id === record.property_id)?.name || 'Unassigned Property';
    const templateKey = record.template_id || 'legacy';
    const templateName = templates.find(t => t.id === record.template_id)?.name || 'Legacy Inspections';
    
    if (!selectedProperty) {
      // All Properties mode: Property -> Year -> Template
      if (!groups[propertyId]) {
        groups[propertyId] = { 
          propertyName, 
          years: {} 
        };
      }
      if (!groups[propertyId].years[year]) {
        groups[propertyId].years[year] = {};
      }
      if (!groups[propertyId].years[year][templateKey]) {
        groups[propertyId].years[year][templateKey] = {
          templateId: record.template_id,
          templateName,
          records: []
        };
      }
      groups[propertyId].years[year][templateKey].records.push(record);
    } else {
      // Single Property mode: Year -> Template
      if (!groups[year]) {
        groups[year] = {};
      }
      if (!groups[year][templateKey]) {
        groups[year][templateKey] = {
          templateId: record.template_id,
          templateName,
          records: []
        };
      }
      groups[year][templateKey].records.push(record);
    }
    
    return groups;
  }, {} as any);

  // Sort records within each group
  Object.values(groupedRecords).forEach((outerGroup: any) => {
    if (outerGroup.years) {
      // All Properties mode
      Object.values(outerGroup.years).forEach((yearGroup: any) => {
        Object.values(yearGroup).forEach((templateGroup: any) => {
          templateGroup.records.sort((a: InspectionRecord, b: InspectionRecord) => 
            new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
          );
        });
      });
    } else {
      // Single Property mode
      Object.values(outerGroup).forEach((templateGroup: any) => {
        templateGroup.records.sort((a: InspectionRecord, b: InspectionRecord) => 
          new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
        );
      });
    }
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRecord = (recordId: string) => {
    setExpandedRecords(prev => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const getCompletedCount = (record: InspectionRecord) => {
    return record.items.filter(item => item.completed).length;
  };

  const getCompletionPercentage = (record: InspectionRecord) => {
    if (record.items.length === 0) return 0;
    return Math.round((getCompletedCount(record) / record.items.length) * 100);
  };

  const startEditingRecord = (record: InspectionRecord) => {
    setEditingRecordId(record.id);
    setEditedRecord({ ...record });
  };

  const updateInspectionItem = (itemId: string, updates: Partial<InspectionItem>) => {
    if (!editedRecord) return;
    const updatedItems = editedRecord.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setEditedRecord({ ...editedRecord, items: updatedItems });
  };

  const saveEditedRecord = () => {
    if (!editedRecord) return;
    updateRecord.mutate({
      id: editedRecord.id,
      items: editedRecord.items
    }, {
      onSuccess: () => {
        setEditingRecordId(null);
        setEditedRecord(null);
      }
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Filter by Property</Label>
          <Select 
            value={selectedProperty?.id || 'all'} 
            onValueChange={(value) => {
              if (value === 'all') {
                setSelectedProperty(null);
              } else {
                const property = userProperties.find(p => p.id === value);
                if (property) {
                  setSelectedProperty(property);
                }
              }
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Properties</SelectItem>
              {userProperties.map(property => (
                <SelectItem key={property.id} value={property.id} className="cursor-pointer">
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Date Range</Label>
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="past-12-months">Past 12 Months</SelectItem>
              <SelectItem value="custom">Custom Period</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Search</Label>
          <Input
            type="text"
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {dateFilter === 'custom' && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No inspection records found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {!selectedProperty ? (
            // All Properties mode: Property -> Year -> Template
            (Object.entries(groupedRecords) as [string, any][]).map(([propertyId, propertyGroup]): JSX.Element => (
              <Card key={propertyId}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors bg-muted"
                  onClick={() => toggleGroup(`property-${propertyId}`)}
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups[`property-${propertyId}`] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <CardTitle>{propertyGroup.propertyName}</CardTitle>
                  </div>
                </CardHeader>
                
                {expandedGroups[`property-${propertyId}`] && (
                  <CardContent className="space-y-4 pt-6">
                    {Object.entries(propertyGroup.years).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, templateGroups]: [string, any]) => (
                      <Card key={`${propertyId}-${year}`} className="border-2">
                        <CardHeader 
                          className="cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => toggleGroup(`${propertyId}-${year}`)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedGroups[`${propertyId}-${year}`] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            <CardTitle className="text-lg">{year}</CardTitle>
                            <Badge variant="secondary">
                              {Object.values(templateGroups).reduce((sum: number, g: any) => sum + g.records.length, 0)} records
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        {expandedGroups[`${propertyId}-${year}`] && (
                          <CardContent className="space-y-3">
                            {Object.entries(templateGroups).map(([templateKey, group]: [string, any]) => (
                              <Card key={`${propertyId}-${year}-${templateKey}`} className="border">
                                <CardHeader 
                                  className="cursor-pointer hover:bg-accent/20 transition-colors py-3"
                                  onClick={() => toggleGroup(`${propertyId}-${year}-${templateKey}`)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedGroups[`${propertyId}-${year}-${templateKey}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <CardTitle className="text-base">{group.templateName}</CardTitle>
                                    <Badge variant="outline" className="text-xs">{group.records.length}</Badge>
                                  </div>
                                </CardHeader>
                                
                                {expandedGroups[`${propertyId}-${year}-${templateKey}`] && (
                                  <CardContent className="space-y-2 pb-3">
                                    {group.records.map((record: InspectionRecord) => (
                                      <div key={record.id} className="border rounded-lg">
                                        <div 
                                          className="p-3 cursor-pointer hover:bg-accent/20 transition-colors"
                                          onClick={() => toggleRecord(record.id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                              {expandedRecords[record.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                              <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                  <span className="font-medium">
                                                    {format(new Date(record.inspection_date + 'T12:00:00'), 'MMM d, yyyy')}
                                                  </span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {getCompletedCount(record)}/{record.items.length}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {getCompletionPercentage(record)}%
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {editingRecordId !== record.id && (
                                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => startEditingRecord(record)}
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => deleteInspectionRecord(record.id)}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {expandedRecords[record.id] && (
                                          <div className="border-t p-3 space-y-2 bg-muted/20">
                                            {editingRecordId === record.id ? (
                                              <>
                                                {editedRecord?.items.map((item) => (
                                                  <div key={item.id} className="flex items-start gap-3 p-2 bg-background rounded border">
                                                    <Checkbox
                                                      checked={item.completed}
                                                      onCheckedChange={(checked) => 
                                                        updateInspectionItem(item.id, { completed: checked as boolean })
                                                      }
                                                      className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                      <div className="text-sm font-medium">{item.description}</div>
                                                      <Textarea
                                                        value={item.notes || ''}
                                                        onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                                                        placeholder="Notes..."
                                                        className="text-sm min-h-[50px] max-h-[100px] overflow-y-auto"
                                                      />
                                                    </div>
                                                  </div>
                                                ))}
                                                <div className="flex gap-2 pt-2">
                                                  <Button size="sm" onClick={saveEditedRecord}>
                                                    <Save className="h-4 w-4 mr-1" />
                                                    Save
                                                  </Button>
                                                  <Button size="sm" variant="outline" onClick={() => setEditingRecordId(null)}>
                                                    <X className="h-4 w-4 mr-1" />
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                {record.items.map((item) => (
                                                  <div key={item.id} className="flex items-start gap-2 p-2 bg-background rounded text-sm">
                                                    <Checkbox checked={item.completed} disabled className="mt-0.5" />
                                                    <div className="flex-1 min-w-0 flex items-start gap-2">
                                                      <span className="font-medium">{item.description}</span>
                                                      {item.notes && (
                                                        <span className="text-muted-foreground">- <span className="inline-block max-h-[60px] overflow-y-auto align-top">{item.notes}</span></span>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                                <div className="text-xs text-muted-foreground pt-1">
                                                  Created: {format(new Date(record.created_at || ''), 'MMM d, yyyy h:mm a')}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                )}
                              </Card>
                            ))}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            // Single Property mode: Year -> Template
            (Object.entries(groupedRecords) as [string, any][]).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, templateGroups]): JSX.Element => (
              <Card key={year}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors bg-muted"
                  onClick={() => toggleGroup(year)}
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups[year] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <CardTitle>{year}</CardTitle>
                    <Badge variant="secondary">
                      {Object.values(templateGroups).reduce((sum: number, g: any) => sum + g.records.length, 0)} records
                    </Badge>
                  </div>
                </CardHeader>
                
                {expandedGroups[year] && (
                  <CardContent className="space-y-4 pt-6">
                    {Object.entries(templateGroups).map(([templateKey, group]: [string, any]) => (
                      <Card key={templateKey} className="border-2">
                        <CardHeader 
                          className="cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => toggleGroup(`${year}-${templateKey}`)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedGroups[`${year}-${templateKey}`] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            <CardTitle className="text-lg">{group.templateName}</CardTitle>
                            <Badge variant="outline">{group.records.length}</Badge>
                          </div>
                        </CardHeader>
                        
                        {expandedGroups[`${year}-${templateKey}`] && (
                          <CardContent className="space-y-3">
                            {group.records.map((record: InspectionRecord) => (
                              <div key={record.id} className="border rounded-lg">
                                <div 
                                  className="p-3 cursor-pointer hover:bg-accent/20 transition-colors"
                                  onClick={() => toggleRecord(record.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      {expandedRecords[record.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            {format(new Date(record.inspection_date + 'T12:00:00'), 'MMM d, yyyy')}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {getCompletedCount(record)}/{record.items.length}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {getCompletionPercentage(record)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {editingRecordId !== record.id && (
                                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEditingRecord(record)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteInspectionRecord(record.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {expandedRecords[record.id] && (
                                  <div className="border-t p-3 space-y-2 bg-muted/20">
                                    {editingRecordId === record.id ? (
                                      <>
                                        {editedRecord?.items.map((item) => (
                                          <div key={item.id} className="flex items-start gap-3 p-2 bg-background rounded border">
                                            <Checkbox
                                              checked={item.completed}
                                              onCheckedChange={(checked) => 
                                                updateInspectionItem(item.id, { completed: checked as boolean })
                                              }
                                              className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0 space-y-1">
                                              <div className="text-sm font-medium">{item.description}</div>
                                              <Textarea
                                                value={item.notes || ''}
                                                onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                                                placeholder="Notes..."
                                                className="text-sm min-h-[50px] max-h-[100px] overflow-y-auto"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                        <div className="flex gap-2 pt-2">
                                          <Button size="sm" onClick={saveEditedRecord}>
                                            <Save className="h-4 w-4 mr-1" />
                                            Save
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingRecordId(null)}>
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        {record.items.map((item) => (
                                          <div key={item.id} className="flex items-start gap-2 p-2 bg-background rounded text-sm">
                                            <Checkbox checked={item.completed} disabled className="mt-0.5" />
                                            <div className="flex-1 min-w-0 flex items-start gap-2">
                                              <span className="font-medium">{item.description}</span>
                                              {item.notes && (
                                                <span className="text-muted-foreground">- <span className="inline-block max-h-[60px] overflow-y-auto align-top">{item.notes}</span></span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                        <div className="text-xs text-muted-foreground pt-1">
                                          Created: {format(new Date(record.created_at || ''), 'MMM d, yyyy h:mm a')}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};