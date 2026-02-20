import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, AlertTriangle, CalendarIcon, DollarSign, MapPin, Search, History, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { DamagePropertySelector } from './DamagePropertySelector';
import { DamageReportCard } from './DamageReportCard';
import { type DamageReport as DamageReportType } from '@/hooks/useDamageReports';

interface DamageReportListProps {
  reports: DamageReportType[];
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onShowAddForm: () => void;
  onShowHistory: () => void;
  onStartEditing: (report: DamageReportType) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  editingReport: string | null;
  editingData: Partial<DamageReportType>;
  onEditingDataChange: (data: Partial<DamageReportType>) => void;
}

export const DamageReportList = ({
  reports,
  activeTab,
  onActiveTabChange,
  onShowAddForm,
  onShowHistory,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onMarkComplete,
  onUpdateStatus,
  editingReport,
  editingData,
  onEditingDataChange,
}: DamageReportListProps) => {
  const { isOwner, roles } = useAuth();
  const { selectedProperty, propertyMode, userProperties } = usePropertyContext();
  const [searchTerm, setSearchTerm] = useState('');

  const severityColors: Record<string, string> = {
    minor: 'default',
    moderate: 'warning',
    severe: 'destructive'
  };

  const statusColors: Record<string, string> = {
    reported: 'destructive',
    assessed: 'warning',
    approved: 'secondary',
    'in-repair': 'default',
    completed: 'success'
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm ||
      (report.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-primary">Active Reports</h2>
            <Button variant="outline" onClick={onShowHistory} className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Damage Report History
            </Button>
          </div>
          <Button onClick={onShowAddForm} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Damage Report
          </Button>
        </div>

        <DamagePropertySelector />

        {/* Active/Pending Reports Accordion for selected property */}
        {selectedProperty && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Active and Pending Reports</CardTitle>
              <p className="text-sm text-muted-foreground">Existing reports for {selectedProperty.name}</p>
            </CardHeader>
            <CardContent>
              {filteredReports.filter(r => r.status !== 'completed').length > 0 ? (
                <Accordion type="multiple" className="space-y-2">
                  {filteredReports.filter(r => r.status !== 'completed').map(report => (
                    <AccordionItem key={report.id} value={report.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span className="font-medium">{report.title || report.description}</span>
                          <Badge variant={statusColors[report.status] as any}>{report.status}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>Location:</strong> {report.location}</div>
                          <div><strong>Severity:</strong> {report.severity}</div>
                          <div><strong>Report Date:</strong> {format(new Date(report.damage_date + 'T12:00:00'), 'PPP')}</div>
                          <div><strong>Est. Cost:</strong> ${(report.estimated_value || 0).toLocaleString()}</div>
                          <div><strong>Responsible Party:</strong> {report.responsible_party}</div>
                          <div><strong>Status:</strong> {report.status}</div>
                        </div>
                        {report.description && <div className="mt-3"><strong>Description:</strong> {report.description}</div>}
                        {report.notes && <div className="mt-2"><strong>Notes:</strong> {report.notes}</div>}
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onStartEditing(report)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-center py-4">No active or pending reports for this property.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search damage reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6 mt-6">
          <div className="space-y-4">
            {(() => {
              const activeReports = filteredReports.filter(report => report.status !== 'completed');
              if (propertyMode === 'all') {
                const grouped: Record<string, Record<string, DamageReportType[]>> = {};
                activeReports.forEach(report => {
                  const propertyKey = report.property_id || 'unassigned';
                  const year = new Date(report.damage_date).getFullYear().toString();
                  if (!grouped[propertyKey]) grouped[propertyKey] = {};
                  if (!grouped[propertyKey][year]) grouped[propertyKey][year] = [];
                  grouped[propertyKey][year].push(report);
                });

                return Object.entries(grouped).map(([propertyKey, yearGroups]) => {
                  const propertyName = userProperties.find(p => p.id === propertyKey)?.name || 'Unassigned Property';
                  return (
                    <Card key={propertyKey}>
                      <CardHeader className="bg-muted">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {propertyName}
                          <Badge variant="secondary">{Object.values(yearGroups).flat().length} reports</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {Object.entries(yearGroups).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, yearReports]) => (
                          <div key={year} className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-semibold">{year}</h4>
                              <Badge variant="outline">{yearReports.length}</Badge>
                            </div>
                            {yearReports.map(report => (
                              <DamageReportCard
                                key={report.id}
                                report={report}
                                isEditing={editingReport === report.id}
                                editingData={editingData}
                                isOwner={isOwner()}
                                onStartEdit={onStartEditing}
                                onSaveEdit={onSaveEdit}
                                onCancelEdit={onCancelEdit}
                                onDelete={onDelete}
                                onMarkComplete={onMarkComplete}
                                onEditingDataChange={onEditingDataChange}
                                severityColors={severityColors}
                                statusColors={statusColors}
                              />
                            ))}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                });
              } else {
                return activeReports.map(report => (
                  <DamageReportCard
                    key={report.id}
                    report={report}
                    isEditing={editingReport === report.id}
                    editingData={editingData}
                    isOwner={isOwner()}
                    onStartEdit={onStartEditing}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onMarkComplete={onMarkComplete}
                    onEditingDataChange={onEditingDataChange}
                    severityColors={severityColors}
                    statusColors={statusColors}
                  />
                ));
              }
            })()}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Damage Reports</CardTitle>
              <p className="text-sm text-muted-foreground">Reports that have not been closed or resolved</p>
            </CardHeader>
            <CardContent>
              {filteredReports.filter(report => report.status !== 'completed' && report.status !== 'approved').length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.filter(report => report.status !== 'completed' && report.status !== 'approved').map(report => (
                    <Card key={report.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{report.title || report.description}</h4>
                                <Badge variant={report.severity === 'minor' ? 'default' : report.severity === 'moderate' ? 'secondary' : 'destructive'}>{report.severity}</Badge>
                                <Badge variant="outline">{report.status}</Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{report.description}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{report.location}</span></div>
                                <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(report.damage_date + 'T12:00:00'), 'MMM d, yyyy')}</span></div>
                                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>${(report.estimated_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                <div className="text-muted-foreground">Responsible: {report.responsible_party === 'no-fault' ? 'No Fault' : report.responsible_party.charAt(0).toUpperCase() + report.responsible_party.slice(1)}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => onStartEditing(report)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Delete Report</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this damage report? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(report.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" onClick={() => onUpdateStatus(report.id, 'assessed')} disabled={report.status === 'assessed'}>Mark as Assessed</Button>
                            <Button variant="outline" size="sm" onClick={() => onUpdateStatus(report.id, 'approved')} disabled={report.status === 'approved'}>Approve</Button>
                            <Button variant="outline" size="sm" onClick={() => onUpdateStatus(report.id, 'in-repair')} disabled={report.status === 'in-repair'}>In Repair</Button>
                            <Button variant="default" size="sm" onClick={() => onMarkComplete(report.id)}>Mark Complete</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No pending damage reports for this property.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
