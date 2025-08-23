import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronRight, Calendar, FileText, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';

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

export const InspectionHistoryView = () => {
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

  // Load inspection records on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('inspection-records');
    if (savedRecords) {
      setInspectionRecords(JSON.parse(savedRecords));
    }
  }, []);

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
                        <CardTitle className="text-lg">{templateName}</CardTitle>
                        <Badge variant="secondary">{records.length} inspection{records.length !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {records.map(record => (
                      <Card key={record.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{format(new Date(record.date), 'PPP')}</span>
                              <Badge 
                                variant={getCompletionPercentage(record.items) === 100 ? 'default' : 'secondary'}
                              >
                                {getCompletedCount(record.items)}/{record.items.length} completed
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Created: {format(new Date(record.createdAt), 'PPp')}
                            </span>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            {record.items.map(item => (
                              <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <div className="mt-1">
                                  {item.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                  <div className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.description}
                                  </div>
                                  {item.notes && (
                                    <div className="text-sm text-muted-foreground">
                                      <strong>Notes:</strong> {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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