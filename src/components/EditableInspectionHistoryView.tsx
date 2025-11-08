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
import { Search, ChevronDown, ChevronRight, Calendar as CalendarIcon, FileText, Edit, Save, Trash2, X, ChevronsDown, ChevronsUp, Filter } from 'lucide-react';
import { format, startOfYear, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useInspectionRecords, useUpdateInspectionRecord, useDeleteInspectionRecord, InspectionRecord, InspectionItem } from '@/hooks/useInspectionRecords';
import { useAllInspectionTemplates } from '@/hooks/useInspectionTemplates';

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
  
  // Custom report filtering
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchScope, setSearchScope] = useState<'title' | 'all'>('all');

  const { data: inspectionRecords = [], isLoading } = useInspectionRecords(selectedProperty?.id);
  const { data: templates = [] } = useAllInspectionTemplates();
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
    
    if (searchScope === 'title') {
      const templateName = templates.find(t => t.id === record.template_id)?.name || '';
      return templateName.toLowerCase().includes(searchLower);
    }
    
    // Search all fields
    return record.items.some(item => 
      item.description?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter by selected items if custom report mode is active
  const customFilteredRecords = showCustomReport && selectedItems.size > 0
    ? filteredRecords.map(record => ({
        ...record,
        items: record.items.filter(item => selectedItems.has(item.description || ''))
      })).filter(record => record.items.length > 0)
    : filteredRecords;

  // Get all unique inspection item descriptions for custom report selection
  const allInspectionItems = Array.from(
    new Set(
      inspectionRecords.flatMap(record => 
        record.items.map(item => item.description || '')
      )
    )
  ).filter(Boolean).sort();
  
  // Group records: Property -> Template -> Sort by date (newest first)
  const groupedRecords = customFilteredRecords.reduce((groups, record) => {
    const propertyId = record.property_id || 'unassigned-property';
    const propertyName = userProperties.find(p => p.id === record.property_id)?.name || 'Unassigned Property';
    const templateKey = record.template_id || 'no-template';
    const templateName = templates.find(t => t.id === record.template_id)?.name || 'No Template';
    
    if (!selectedProperty) {
      // All Properties mode: Property -> Template
      if (!groups[propertyId]) {
        groups[propertyId] = { 
          propertyName, 
          templates: {} 
        };
      }
      if (!groups[propertyId].templates[templateKey]) {
        groups[propertyId].templates[templateKey] = {
          templateId: record.template_id,
          templateName,
          records: []
        };
      }
      groups[propertyId].templates[templateKey].records.push(record);
    } else {
      // Single Property mode: Template only
      if (!groups[templateKey]) {
        groups[templateKey] = {
          templateId: record.template_id,
          templateName,
          records: []
        };
      }
      groups[templateKey].records.push(record);
    }
    
    return groups;
  }, {} as any);

  // Sort records within each group by date (newest first)
  Object.values(groupedRecords).forEach((outerGroup: any) => {
    if (outerGroup.templates) {
      // All Properties mode: Property -> Template
      Object.values(outerGroup.templates).forEach((templateGroup: any) => {
        templateGroup.records.sort((a: InspectionRecord, b: InspectionRecord) => 
          new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
        );
      });
    } else {
      // Single Property mode: Template only
      outerGroup.records?.sort((a: InspectionRecord, b: InspectionRecord) => 
        new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
      );
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
  
  const expandAll = () => {
    const allKeys: { [key: string]: boolean } = {};
    
    if (!selectedProperty) {
      // All Properties mode
      Object.keys(groupedRecords).forEach(propertyId => {
        allKeys[`property-${propertyId}`] = true;
        const propertyGroup = groupedRecords[propertyId];
        Object.keys(propertyGroup.templates).forEach(templateKey => {
          allKeys[`${propertyId}-${templateKey}`] = true;
        });
      });
    } else {
      // Single Property mode
      Object.keys(groupedRecords).forEach(templateKey => {
        allKeys[templateKey] = true;
      });
    }
    
    setExpandedGroups(allKeys);
  };
  
  const collapseAll = () => {
    setExpandedGroups({});
    setExpandedRecords({});
  };
  
  const toggleItemSelection = (itemDescription: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemDescription)) {
      newSelected.delete(itemDescription);
    } else {
      newSelected.add(itemDescription);
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Inspection History</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronsDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronsUp className="h-4 w-4 mr-1" />
            Collapse All
          </Button>
          <Button 
            variant={showCustomReport ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowCustomReport(!showCustomReport)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Custom Report
          </Button>
        </div>
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
          <div className="flex gap-2">
            <Select value={searchScope} onValueChange={(value: any) => setSearchScope(value)}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Search All</SelectItem>
                <SelectItem value="title">Inspection Title</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      {showCustomReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Inspection Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {allInspectionItems.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${item}`}
                    checked={selectedItems.has(item)}
                    onCheckedChange={() => toggleItemSelection(item)}
                  />
                  <Label
                    htmlFor={`item-${item}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
            {selectedItems.size > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">{selectedItems.size} items selected</Badge>
                <Button size="sm" variant="ghost" onClick={() => setSelectedItems(new Set())}>
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {customFilteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No inspection records found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {!selectedProperty ? (
            <>
              {/* All Properties mode: Property -> Template -> Records */}
              {(Object.entries(groupedRecords) as [string, any][]).map(([propertyId, propertyGroup]) => (
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
                    {(Object.entries(propertyGroup.templates) as Array<[string, any]>).map(([templateKey, group]): JSX.Element => {
                      return (
                        <Card key={`${propertyId}-${templateKey}`} className="border-2">
                        <CardHeader 
                          className="cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => toggleGroup(`${propertyId}-${templateKey}`)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedGroups[`${propertyId}-${templateKey}`] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            <CardTitle className="text-lg">{group.templateName}</CardTitle>
                            <Badge variant="outline">{group.records.length}</Badge>
                          </div>
                        </CardHeader>
                        
                        {expandedGroups[`${propertyId}-${templateKey}`] && (
                          <CardContent className="space-y-3">
                            {group.records.map((record: InspectionRecord) => (
                       <div key={record.id} className="border rounded-lg">
                                <div 
                                  className="p-1.5 cursor-pointer hover:bg-accent/20 transition-colors"
                                  onClick={() => toggleRecord(record.id)}
                                >
                                   <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      {expandedRecords[record.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                          <span className="font-medium text-sm">
                                            {format(new Date(record.inspection_date + 'T12:00:00'), 'MMM d, yyyy')}
                                          </span>
                                          <Badge variant="outline" className="text-xs h-5">
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
                                  <div className="border-t p-1.5 space-y-1 bg-muted/20">
                                    {editingRecordId === record.id ? (
                                      <>
                                        {editedRecord?.items.map((item) => (
                                          <div key={item.id} className="flex items-start gap-2 p-1.5 bg-background rounded border">
                                            <Checkbox
                                              checked={item.completed}
                                              onCheckedChange={(checked) => 
                                                updateInspectionItem(item.id, { completed: checked as boolean })
                                              }
                                              className="mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0 space-y-1">
                                              <div className="text-xs font-medium">{item.description}</div>
                                              <Textarea
                                                value={item.notes || ''}
                                                onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                                                placeholder="Notes..."
                                                className="text-xs min-h-[40px] max-h-[80px] overflow-y-auto"
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
                                          <div key={item.id} className="flex items-start gap-1.5 p-1 bg-background rounded text-xs">
                                            <Checkbox checked={item.completed} disabled className="mt-0.5 h-3 w-3" />
                                            <div className="flex-1 min-w-0 flex items-start gap-1.5">
                                              <span className="font-medium">{item.description}</span>
                                              {item.notes && (
                                                <span className="text-muted-foreground">- <span className="inline-block max-h-[40px] overflow-y-auto align-top">{item.notes}</span></span>
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
                      );
                    })}
                  </CardContent>
                )}
              </Card>
              ))}
            </>
          ) : (
            <>
              {/* Single Property mode: Template -> Records */}
              {(Object.entries(groupedRecords) as [string, any][]).map(([templateKey, group]) => (
              <Card key={templateKey}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors bg-muted"
                  onClick={() => toggleGroup(templateKey)}
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups[templateKey] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <CardTitle>{group.templateName}</CardTitle>
                    <Badge variant="secondary">{group.records.length} records</Badge>
                  </div>
                </CardHeader>
                
                {expandedGroups[templateKey] && (
                  <CardContent className="space-y-3 pt-6">
                     {group.records.map((record: InspectionRecord) => (
                      <div key={record.id} className="border rounded-lg">
                        <div 
                          className="p-1.5 cursor-pointer hover:bg-accent/20 transition-colors"
                          onClick={() => toggleRecord(record.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {expandedRecords[record.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium text-sm">
                                    {format(new Date(record.inspection_date + 'T12:00:00'), 'MMM d, yyyy')}
                                  </span>
                                  <Badge variant="outline" className="text-xs h-5">
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
                          <div className="border-t p-1.5 space-y-1 bg-muted/20">
                            {editingRecordId === record.id ? (
                              <>
                                {editedRecord?.items.map((item) => (
                                  <div key={item.id} className="flex items-start gap-2 p-1.5 bg-background rounded border">
                                    <Checkbox
                                      checked={item.completed}
                                      onCheckedChange={(checked) => 
                                        updateInspectionItem(item.id, { completed: checked as boolean })
                                      }
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="text-xs font-medium">{item.description}</div>
                                      <Textarea
                                        value={item.notes || ''}
                                        onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
                                        placeholder="Notes..."
                                        className="text-xs min-h-[40px] max-h-[80px] overflow-y-auto"
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
                                  <div key={item.id} className="flex items-start gap-1.5 p-1 bg-background rounded text-xs">
                                    <Checkbox checked={item.completed} disabled className="mt-0.5 h-3 w-3" />
                                    <div className="flex-1 min-w-0 flex items-start gap-1.5">
                                      <span className="font-medium">{item.description}</span>
                                      {item.notes && (
                                        <span className="text-muted-foreground">- <span className="inline-block max-h-[40px] overflow-y-auto align-top">{item.notes}</span></span>
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
            </>
          )}
        </div>
      )}
    </div>
  );
};