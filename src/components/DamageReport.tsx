import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Save, X, Trash2, AlertTriangle, Camera, FileText, CalendarIcon, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  category: string;
  reportedDate: string;
  estimatedCost: number;
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  photos: string[];
  notes: string;
  assignedTo: string;
  repairDate?: string;
}

export const DamageReport = () => {
  const { toast } = useToast();
  
  const [damageReports, setDamageReports] = useState<DamageItem[]>([
    {
      id: '1',
      title: 'Cracked bathroom tile',
      description: 'Large crack in bathroom floor tile near shower',
      location: 'Main bathroom',
      severity: 'moderate',
      category: 'Flooring',
      reportedDate: new Date().toISOString(),
      estimatedCost: 150,
      status: 'reported',
      photos: [],
      notes: 'Guest reported slipping hazard',
      assignedTo: '',
    }
  ]);

  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'minor' as const,
    category: '',
    estimatedCost: 0,
    notes: '',
    assignedTo: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DamageItem>>({});
  const [selectedDate, setSelectedDate] = useState<Date>();

  const severityColors = {
    minor: 'default',
    moderate: 'warning',
    severe: 'destructive'
  };

  const statusColors = {
    reported: 'destructive',
    assessed: 'warning', 
    approved: 'secondary',
    'in-repair': 'default',
    completed: 'success'
  };

  // Load saved data from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('damage-reports');
    if (savedReports) {
      setDamageReports(JSON.parse(savedReports));
    }
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('damage-reports', JSON.stringify(damageReports));
  }, [damageReports]);

  const addNewReport = () => {
    if (!newReport.title.trim() || !newReport.description.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in title and description.",
        variant: "destructive"
      });
      return;
    }

    const report: DamageItem = {
      id: Date.now().toString(),
      ...newReport,
      reportedDate: new Date().toISOString(),
      status: 'reported',
      photos: [],
    };

    setDamageReports(prev => [...prev, report]);
    setNewReport({
      title: '',
      description: '',
      location: '',
      severity: 'minor',
      category: '',
      estimatedCost: 0,
      notes: '',
      assignedTo: '',
    });
    setShowAddForm(false);

    toast({
      title: "Damage report created",
      description: `Report "${report.title}" has been added.`,
    });
  };

  const startEditing = (report: DamageItem) => {
    setEditingReport(report.id);
    setEditingData({ ...report });
  };

  const saveEdit = () => {
    if (editingReport && editingData) {
      setDamageReports(prev => prev.map(report => 
        report.id === editingReport 
          ? { ...report, ...editingData }
          : report
      ));
      setEditingReport(null);
      setEditingData({});
      
      toast({
        title: "Report updated",
        description: "Damage report has been updated successfully.",
      });
    }
  };

  const deleteReport = (id: string) => {
    setDamageReports(prev => prev.filter(report => report.id !== id));
    toast({
      title: "Report deleted",
      description: "Damage report has been deleted.",
    });
  };

  const updateStatus = (id: string, status: DamageItem['status']) => {
    setDamageReports(prev => prev.map(report =>
      report.id === id ? { ...report, status } : report
    ));
    toast({
      title: "Status updated",
      description: `Report status updated to ${status}.`,
    });
  };

  const getUniqueCategories = () => {
    const categories = damageReports.map(report => report.category).filter(Boolean);
    return Array.from(new Set(categories));
  };

  const getUniqueLocations = () => {
    const locations = damageReports.map(report => report.location).filter(Boolean);
    return Array.from(new Set(locations));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Damage Reports
        </h1>
        <p className="text-muted-foreground">
          Track and manage property damage reports and repairs
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Damage Reports
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Add New Report Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Current Reports</h2>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Report Damage
              </Button>
            )}
          </div>

          {/* Add New Report Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Report New Damage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Damage title"
                    value={newReport.title}
                    onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Select 
                    value={newReport.location} 
                    onValueChange={(value) => setNewReport(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueLocations().map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                      <SelectItem value="Living Room">Living Room</SelectItem>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Main Bathroom">Main Bathroom</SelectItem>
                      <SelectItem value="Guest Bathroom">Guest Bathroom</SelectItem>
                      <SelectItem value="Master Bedroom">Master Bedroom</SelectItem>
                      <SelectItem value="Guest Bedroom">Guest Bedroom</SelectItem>
                      <SelectItem value="Exterior">Exterior</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={newReport.severity} 
                    onValueChange={(value: any) => setNewReport(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Category (e.g., Plumbing, Electrical)"
                    value={newReport.category}
                    onChange={(e) => setNewReport(prev => ({ ...prev, category: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Estimated repair cost"
                    value={newReport.estimatedCost || ''}
                    onChange={(e) => setNewReport(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                  />
                  <Input
                    placeholder="Assigned to (optional)"
                    value={newReport.assignedTo}
                    onChange={(e) => setNewReport(prev => ({ ...prev, assignedTo: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Detailed description of the damage"
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
                <Textarea
                  placeholder="Additional notes"
                  value={newReport.notes}
                  onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={addNewReport}>Create Report</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          <div className="space-y-4">
            {damageReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  {editingReport === report.id ? (
                    <div className="space-y-4">
                      <Input
                        value={editingData.title || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea
                        value={editingData.description || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Select 
                          value={editingData.status} 
                          onValueChange={(value: any) => setEditingData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reported">Reported</SelectItem>
                            <SelectItem value="assessed">Assessed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="in-repair">In Repair</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Estimated cost"
                          value={editingData.estimatedCost || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm">
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingReport(null)} size="sm">
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{report.title}</h3>
                          <p className="text-muted-foreground">{report.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{report.location}</Badge>
                            <Badge variant={severityColors[report.severity] as any}>
                              {report.severity}
                            </Badge>
                            <Badge variant={statusColors[report.status] as any}>
                              {report.status}
                            </Badge>
                            {report.category && <Badge variant="secondary">{report.category}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(report)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteReport(report.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Reported:</span> {format(new Date(report.reportedDate), 'PPP')}
                        </div>
                        <div>
                          <span className="font-medium">Est. Cost:</span> ${report.estimatedCost.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Assigned to:</span> {report.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                      {report.notes && (
                        <div className="pt-2 border-t">
                          <span className="font-medium">Notes:</span> {report.notes}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{damageReports.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Estimated Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${damageReports.reduce((sum, report) => sum + report.estimatedCost, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Open Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {damageReports.filter(report => report.status !== 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};