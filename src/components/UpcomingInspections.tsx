import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PropertySelector } from './PropertySelector';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAllInspectionTemplates } from '@/hooks/useInspectionTemplates';
import { useInspectionRecords } from '@/hooks/useInspectionRecords';
import { useAllAssignments } from '@/hooks/useInspectionAssignments';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle, CalendarDays, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UpcomingInspection {
  id: string;
  propertyId: string;
  propertyName: string;
  templateName: string;
  dueDate: string;
  daysUntilDue: number;
  source: 'template' | 'record';
}

export const UpcomingInspections = () => {
  const { selectedProperty, propertyMode } = usePropertyContext();
  const [collapsedProperties, setCollapsedProperties] = useState<Set<string>>(new Set());
  const { profile } = useAuth();
  const { data: templates = [] } = useAllInspectionTemplates();
  const { data: records = [] } = useInspectionRecords();
  const { data: assignments = [] } = useAllAssignments();

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const upcomingInspections = useMemo(() => {
    const today = new Date();
    const inspections: UpcomingInspection[] = [];

    // Get upcoming from templates with next_occurrence
    templates.forEach(template => {
      if (template.next_occurrence && template.property_id) {
        const property = properties.find(p => p.id === template.property_id);
        if (property) {
          const dueDate = parseISO(template.next_occurrence);
          const daysUntilDue = differenceInDays(dueDate, today);
          
          inspections.push({
            id: `template-${template.id}`,
            propertyId: template.property_id,
            propertyName: property.name,
            templateName: template.name,
            dueDate: template.next_occurrence,
            daysUntilDue,
            source: 'template',
          });
        }
      }
    });

    // Get upcoming from records with next_due_date
    records.forEach(record => {
      if (record.next_due_date && record.property_id) {
        const property = properties.find(p => p.id === record.property_id);
        const template = templates.find(t => t.id === record.template_id);
        if (property) {
          const dueDate = parseISO(record.next_due_date);
          const daysUntilDue = differenceInDays(dueDate, today);
          
          inspections.push({
            id: `record-${record.id}`,
            propertyId: record.property_id,
            propertyName: property.name,
            templateName: template?.name || 'Inspection',
            dueDate: record.next_due_date,
            daysUntilDue,
            source: 'record',
          });
        }
      }
    });

    // Filter based on property selection
    let filtered = inspections;
    if (propertyMode === 'property' && selectedProperty) {
      filtered = inspections.filter(i => i.propertyId === selectedProperty.id);
    }

    // Filter by current user's assignments if they have any
    if (profile && assignments.length > 0) {
      const myAssignedTemplateIds = assignments
        .filter(a => a.assigned_to === profile.id)
        .map(a => a.template_id);
      
      // If user has assignments, only show those. Otherwise show all (for owners).
      if (myAssignedTemplateIds.length > 0) {
        filtered = filtered.filter(i => {
          const templateId = i.id.replace('template-', '').replace('record-', '');
          // Check by source
          if (i.source === 'template') {
            return myAssignedTemplateIds.includes(i.id.replace('template-', ''));
          }
          // For records, check if the record's template is assigned
          const record = records.find(r => `record-${r.id}` === i.id);
          return record?.template_id ? myAssignedTemplateIds.includes(record.template_id) : true;
        });
      }
    }

    // Sort by due date ascending (overdue first, then upcoming)
    filtered.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return filtered;
  }, [templates, records, properties, selectedProperty, propertyMode, profile, assignments]);

  const getStatusBadge = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue by {Math.abs(daysUntilDue)} days
        </Badge>
      );
    } else if (daysUntilDue <= 7) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Due in {daysUntilDue} days
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Due in {daysUntilDue} days
        </Badge>
      );
    }
  };

  const overdueCount = upcomingInspections.filter(i => i.daysUntilDue < 0).length;
  const dueSoonCount = upcomingInspections.filter(i => i.daysUntilDue >= 0 && i.daysUntilDue <= 7).length;

  // Group by property for "all properties" mode
  const groupedByProperty = useMemo(() => {
    const groups: Record<string, { propertyName: string; inspections: UpcomingInspection[] }> = {};
    upcomingInspections.forEach(inspection => {
      const key = inspection.propertyId;
      if (!groups[key]) {
        groups[key] = { propertyName: inspection.propertyName, inspections: [] };
      }
      groups[key].inspections.push(inspection);
    });
    return groups;
  }, [upcomingInspections]);

  const togglePropertyCollapse = (propertyId: string) => {
    setCollapsedProperties(prev => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PropertySelector />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Upcoming & Overdue Inspections
        </h2>
        <div className="flex gap-2">
          {overdueCount > 0 && (
            <Badge variant="destructive">{overdueCount} Overdue</Badge>
          )}
          {dueSoonCount > 0 && (
            <Badge variant="warning">{dueSoonCount} Due Soon</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingInspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming inspections scheduled.</p>
              <p className="text-sm mt-2">
                Set up inspection frequencies in Manage Inspection Templates to see upcoming inspections here.
              </p>
            </div>
          ) : propertyMode !== 'property' || !selectedProperty ? (
            // All properties mode — group by property with collapsible sections
            <div className="space-y-2">
              {Object.entries(groupedByProperty).map(([propertyId, group]) => {
                const isCollapsed = collapsedProperties.has(propertyId);
                return (
                  <div key={propertyId} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 bg-muted hover:bg-accent/50 transition-colors text-left"
                      onClick={() => togglePropertyCollapse(propertyId)}
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{group.propertyName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{group.inspections.length}</Badge>
                    </button>
                    {!isCollapsed && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Inspection Type</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.inspections.map(inspection => (
                            <TableRow key={inspection.id}>
                              <TableCell className="font-medium text-sm">{inspection.templateName}</TableCell>
                              <TableCell className="text-sm">{format(parseISO(inspection.dueDate), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{getStatusBadge(inspection.daysUntilDue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Single property mode — flat table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspection Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingInspections.map(inspection => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium text-sm">{inspection.templateName}</TableCell>
                    <TableCell className="text-sm">{format(parseISO(inspection.dueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(inspection.daysUntilDue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
