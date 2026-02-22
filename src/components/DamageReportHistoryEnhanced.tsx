import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Calendar, AlertTriangle, DollarSign, ChevronDown, ChevronRight, Search, Building2, CalendarIcon, X, Filter, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startOfYear, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { exportDamageReportsToPDF, exportDamageReportsToExcel } from '@/lib/exportUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePropertyContext } from '@/contexts/PropertyContext';

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

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface DamageReportHistoryEnhancedProps {
  reports: DamageItem[];
  onViewReport: (report: DamageItem) => void;
  propertyMode: 'property' | 'all' | 'unassigned';
  properties: Property[];
}

const DamageReportHistoryEnhanced: React.FC<DamageReportHistoryEnhancedProps> = ({ 
  reports, 
  onViewReport, 
  propertyMode: initialPropertyMode,
  properties 
}) => {
  const { selectedProperty, setSelectedProperty } = usePropertyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = useState<'all' | 'this-year' | 'past-12' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(selectedProperty?.id || 'all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed' | 'both'>('both');

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

  // Apply date filtering
  const getDateFilteredReports = () => {
    let filtered = reports;

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = endOfDay(now);

      if (dateFilter === 'this-year') {
        startDate = startOfYear(now);
      } else if (dateFilter === 'past-12') {
        startDate = subMonths(now, 12);
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
      } else {
        startDate = new Date(0);
      }

      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        return isAfter(reportDate, startDate) && isBefore(reportDate, endDate);
      });
    }

    return filtered;
  };

  // Filter reports by search, property, and status
  const filteredReports = getDateFilteredReports().filter(report => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        report.title.toLowerCase().includes(search) ||
        report.description.toLowerCase().includes(search) ||
        report.location.toLowerCase().includes(search) ||
        report.propertyName?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }
    
    // Property filter
    if (selectedPropertyId !== 'all') {
      if (report.propertyId !== selectedPropertyId) return false;
    }

    // Status filter
    if (statusFilter === 'active' && report.status === 'completed') return false;
    if (statusFilter === 'closed' && report.status !== 'completed') return false;
    
    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Group by status when status filter is "both"
  const activeReports = sortedReports.filter(r => r.status !== 'completed');
  const closedReports = sortedReports.filter(r => r.status === 'completed');

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
                Est: ${report.estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            
            {report.actualCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Actual: ${report.actualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const renderGroupedByStatus = () => (
    <div className="space-y-6">
      {/* Active group */}
      {(statusFilter === 'both' || statusFilter === 'active') && (
        <Collapsible
          open={!collapsedGroups['status-active']}
          onOpenChange={() => toggleGroup('status-active')}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors">
              {collapsedGroups['status-active'] ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-bold">Active</h3>
              <Badge variant="secondary">{activeReports.length} report(s)</Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {activeReports.length > 0 ? activeReports.map(renderReport) : (
              <p className="text-muted-foreground text-center py-4">No active reports.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Closed group */}
      {(statusFilter === 'both' || statusFilter === 'closed') && (
        <Collapsible
          open={!collapsedGroups['status-closed']}
          onOpenChange={() => toggleGroup('status-closed')}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors">
              {collapsedGroups['status-closed'] ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-bold">Closed</h3>
              <Badge variant="outline">{closedReports.length} report(s)</Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {closedReports.length > 0 ? closedReports.map(renderReport) : (
              <p className="text-muted-foreground text-center py-4">No closed reports.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Damage Report History
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Property Dropdown */}
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <ToggleGroup type="single" value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as 'active' | 'closed' | 'both')}>
              <ToggleGroupItem value="both" aria-label="Both">Both</ToggleGroupItem>
              <ToggleGroupItem value="active" aria-label="Active">Active</ToggleGroupItem>
              <ToggleGroupItem value="closed" aria-label="Closed">Closed</ToggleGroupItem>
            </ToggleGroup>

            {/* Date Range Filter */}
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="past-12">Past 12 Months</SelectItem>
                <SelectItem value="custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range Picker */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {(customStartDate || customEndDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportDamageReportsToPDF(filteredReports)}>
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDamageReportsToExcel(filteredReports)}>
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredReports.length > 0 ? (
          renderGroupedByStatus()
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
