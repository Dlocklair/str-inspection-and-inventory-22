import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Calendar, AlertTriangle, DollarSign, ChevronDown, ChevronRight, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  location: string;
  assignedTo: string;
  estimatedCost?: number;
  actualCost?: number;
  images: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  propertyId?: string;
  propertyName?: string;
}

interface DamageReportHistoryEnhancedProps {
  reports: DamageItem[];
  onViewReport: (report: DamageItem) => void;
  propertyMode: 'property' | 'all' | 'unassigned';
  properties: Array<{ id: string; name: string }>;
}

const DamageReportHistoryEnhanced: React.FC<DamageReportHistoryEnhancedProps> = ({ 
  reports, 
  onViewReport, 
  propertyMode,
  properties 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-success hover:bg-success/90 text-success-foreground';
      case 'medium': return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      case 'high': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      default: return 'bg-muted hover:bg-muted/90';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-muted hover:bg-muted/90';
      case 'assessed': return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      case 'approved': return 'bg-success hover:bg-success/90 text-success-foreground';
      case 'in-repair': return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      case 'completed': return 'bg-success hover:bg-success/90 text-success-foreground';
      default: return 'bg-muted hover:bg-muted/90';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Filter reports by search
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(search) ||
      report.description.toLowerCase().includes(search) ||
      report.location.toLowerCase().includes(search) ||
      report.propertyName?.toLowerCase().includes(search)
    );
  });

  // Group by property and year if "all" mode
  const groupedByProperty: Record<string, Record<string, DamageItem[]>> = {};
  
  if (propertyMode === 'all') {
    filteredReports.forEach(report => {
      const propertyKey = report.propertyId || 'unassigned';
      const year = new Date(report.createdAt).getFullYear().toString();
      
      if (!groupedByProperty[propertyKey]) {
        groupedByProperty[propertyKey] = {};
      }
      if (!groupedByProperty[propertyKey][year]) {
        groupedByProperty[propertyKey][year] = [];
      }
      groupedByProperty[propertyKey][year].push(report);
    });
  }

  const sortedReports = [...filteredReports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const renderReport = (report: DamageItem) => (
    <div 
      key={report.id} 
      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-semibold text-foreground">{report.title}</h4>
            <Badge className={cn("text-xs", getSeverityColor(report.severity))}>
              {report.severity}
            </Badge>
            <Badge className={cn("text-xs", getStatusColor(report.status))}>
              {report.status}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {report.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(report.createdAt)}
            </div>
            
            <div>Location: {report.location}</div>
            
            <div>Assigned: {report.assignedTo}</div>
            
            {report.estimatedCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Est: ${report.estimatedCost.toFixed(2)}
              </div>
            )}
            
            {report.actualCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Actual: ${report.actualCost.toFixed(2)}
              </div>
            )}
          </div>
          
          {report.images.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {report.images.length} image{report.images.length !== 1 ? 's' : ''} attached
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewReport(report)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Damage Report History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {propertyMode === 'all' ? (
              // Grouped view by property and year
              Object.entries(groupedByProperty).map(([propertyId, yearGroups]) => {
                const property = properties.find(p => p.id === propertyId);
                const propertyName = property?.name || 'Unassigned';
                const propertyKey = `property-${propertyId}`;
                
                return (
                  <Collapsible
                    key={propertyKey}
                    open={!collapsedGroups[propertyKey]}
                    onOpenChange={() => toggleGroup(propertyKey)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            {collapsedGroups[propertyKey] ? (
                              <ChevronRight className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                            <Building2 className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-bold">{propertyName}</h3>
                            <Badge variant="secondary">
                              {Object.values(yearGroups).reduce((sum, reports) => sum + reports.length, 0)} report(s)
                            </Badge>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          {Object.entries(yearGroups)
                            .sort(([a], [b]) => parseInt(b) - parseInt(a))
                            .map(([year, yearReports]) => {
                              const yearKey = `${propertyKey}-year-${year}`;
                              
                              return (
                                <Collapsible
                                  key={yearKey}
                                  open={!collapsedGroups[yearKey]}
                                  onOpenChange={() => toggleGroup(yearKey)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors">
                                      {collapsedGroups[yearKey] ? (
                                        <ChevronRight className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">{year}</span>
                                      <Badge variant="outline" className="ml-auto">
                                        {yearReports.length} report(s)
                                      </Badge>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent className="pt-2 space-y-2">
                                    {yearReports
                                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                      .map(renderReport)}
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            ) : (
              // Simple list view for single property
              sortedReports.map(renderReport)
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? 'No reports match your search.' : 'No damage reports found.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DamageReportHistoryEnhanced;
