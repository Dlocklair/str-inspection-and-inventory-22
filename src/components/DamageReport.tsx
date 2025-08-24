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
import { Plus, Edit, Save, X, Trash2, AlertTriangle, Camera, FileText, CalendarIcon, DollarSign, Home, ClipboardList, Package, Settings, History, Upload, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationManagerModal } from './LocationManagerModal';
import DamageReportHistory from './DamageReportHistory';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  category: string;
  reportedDate: string;
  reportDate: string;
  estimatedCost: number;
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  photos: File[];
  notes: string;
  responsibleParty: 'guest' | 'owner' | 'other';
  repairDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'agent';
  permissions: {
    inspections: boolean;
    inventory: boolean;
    damage: boolean;
  };
}

export const DamageReport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [damageReports, setDamageReports] = useState<DamageItem[]>([
    {
      id: '1',
      title: 'Cracked bathroom tile',
      description: 'Large crack in bathroom floor tile near shower',
      location: 'Main bathroom',
      severity: 'moderate',
      category: 'Flooring',
      reportedDate: new Date().toISOString(),
      reportDate: new Date().toISOString().split('T')[0],
      estimatedCost: 150,
      status: 'reported',
      photos: [],
      notes: 'Guest reported slipping hazard',
      responsibleParty: 'guest',
    }
  ]);

  const [locations, setLocations] = useState<string[]>([
    'Living Room', 'Kitchen', 'Main Bathroom', 'Guest Bathroom', 
    'Master Bedroom', 'Guest Bedroom', 'Exterior', 'Hallway', 'Dining Room'
  ]);

  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'minor' as const,
    category: '',
    estimatedCost: 0,
    notes: '',
    responsibleParty: 'guest' as const,
    reportDate: new Date().toISOString().split('T')[0],
    photos: [] as File[],
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DamageItem>>({});
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<DamageItem | null>(null);

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

  useEffect(() => {
    // Remove the localStorage user loading since we're using useAuth now
  }, []);

  // Load saved data from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('damage-reports');
    if (savedReports) {
      setDamageReports(JSON.parse(savedReports));
    }
    const savedLocations = localStorage.getItem('damage-locations');
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }
  }, []);

  // Save reports and locations to localStorage
  useEffect(() => {
    localStorage.setItem('damage-reports', JSON.stringify(damageReports));
  }, [damageReports]);

  useEffect(() => {
    localStorage.setItem('damage-locations', JSON.stringify(locations));
  }, [locations]);

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
      responsibleParty: 'guest',
      reportDate: new Date().toISOString().split('T')[0],
      photos: [],
    });
    setShowAddForm(false);

    toast({
      title: "Damage report created",
      description: `Report "${report.title}" has been added.`,
    });
  };

  const handlePhotoUpload = (index: number, file: File) => {
    const newPhotos = [...newReport.photos];
    newPhotos[index] = file;
    setNewReport(prev => ({ ...prev, photos: newPhotos }));
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...newReport.photos];
    newPhotos.splice(index, 1);
    setNewReport(prev => ({ ...prev, photos: newPhotos }));
  };

  const handleLocationSelect = (value: string) => {
    if (value === 'manage-locations') {
      setShowLocationManager(true);
    } else {
      setNewReport(prev => ({ ...prev, location: value }));
    }
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

  const getHistoryData = () => {
    return damageReports.map(report => ({
      ...report,
      createdAt: report.reportDate,
      updatedAt: report.reportedDate,
      severity: report.severity as 'low' | 'medium' | 'high',
      assignedTo: report.responsibleParty,
      images: report.photos.map((_, index) => `photo-${index}`),
    }));
  };

  const hasAccess = (module: keyof User['permissions']) => {
    // For now, return true since we're using profile-based access
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex gap-2">
              {hasAccess('inspections') && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/inspections')}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Inspections
                </Button>
              )}
              {hasAccess('inventory') && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/inventory')}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Inventory
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{profile.full_name}</span>
                <Badge variant={profile.role === 'owner' ? 'default' : 'secondary'}>
                  {profile.role}
                </Badge>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Damage Reports
            </h1>
            <p className="text-muted-foreground">
              Track and manage property damage reports and repairs
            </p>
          </div>

          {/* Show History View */}
          {showHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Back to Reports
                </Button>
              </div>
              <DamageReportHistory
                reports={getHistoryData()}
                onViewReport={(report) => {
                  const originalReport = damageReports.find(r => r.id === report.id);
                  if (originalReport) {
                    setSelectedHistoryReport(originalReport);
                    setShowHistory(false);
                  }
                }}
              />
            </div>
          )}

          {/* Show Selected History Report */}
          {selectedHistoryReport && !showHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedHistoryReport(null);
                    setShowHistory(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Back to History
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedHistoryReport.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{selectedHistoryReport.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong>Location:</strong> {selectedHistoryReport.location}</div>
                    <div><strong>Severity:</strong> {selectedHistoryReport.severity}</div>
                    <div><strong>Status:</strong> {selectedHistoryReport.status}</div>
                    <div><strong>Responsible Party:</strong> {selectedHistoryReport.responsibleParty}</div>
                    <div><strong>Report Date:</strong> {format(new Date(selectedHistoryReport.reportDate), 'PPP')}</div>
                    <div><strong>Est. Cost:</strong> ${selectedHistoryReport.estimatedCost}</div>
                  </div>
                  {selectedHistoryReport.notes && (
                    <div><strong>Notes:</strong> {selectedHistoryReport.notes}</div>
                  )}
                  {selectedHistoryReport.photos.length > 0 && (
                    <div>
                      <strong>Photos:</strong> {selectedHistoryReport.photos.length} photo(s) attached
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Report View */}
          {!showHistory && !selectedHistoryReport && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-sky-600">Current Reports</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-2"
                    >
                      <History className="h-4 w-4" />
                      Damage Report History
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {/* Analytics logic */}}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      $ Cost Analytics
                    </Button>
                  </div>
                </div>
                {!showAddForm && (
                  <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Damage Report
                  </Button>
                )}
              </div>
              
              <Tabs defaultValue="reports" className="w-full">
                <TabsContent value="reports" className="space-y-6 mt-0">{/* No additional tabs content header */}

                {/* Add New Report Form */}
                {showAddForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Damage Report</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Damage Information Section */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg">Basic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              placeholder="Damage title"
                              value={newReport.title}
                              onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                            />
                            
                            <Select value={newReport.location} onValueChange={handleLocationSelect}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map(location => (
                                  <SelectItem key={location} value={location}>{location}</SelectItem>
                                ))}
                                <SelectItem value="manage-locations">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Manage locations
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="date"
                              value={newReport.reportDate}
                              onChange={(e) => setNewReport(prev => ({ ...prev, reportDate: e.target.value }))}
                            />
                            
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
                            
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Estimated repair cost"
                                value={newReport.estimatedCost || ''}
                                onChange={(e) => setNewReport(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                                className="pl-8"
                              />
                            </div>
                            
                            <Select 
                              value={newReport.responsibleParty} 
                              onValueChange={(value: any) => setNewReport(prev => ({ ...prev, responsibleParty: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Responsible party" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="guest">Guest</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">Detailed Description</h4>
                          <Textarea
                            placeholder="Detailed description of the damage..."
                            value={newReport.description}
                            onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        {/* Photo Upload Section */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">Photos</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map((index) => (
                              <div 
                                key={index} 
                                className="aspect-[4/3] border-2 border-dashed border-border rounded-lg p-2 flex flex-col items-center justify-center hover:border-primary/50 transition-colors relative"
                              >
                                {newReport.photos[index] ? (
                                  <>
                                    <img 
                                      src={URL.createObjectURL(newReport.photos[index])} 
                                      alt={`Damage photo ${index + 1}`}
                                      className="w-full h-full object-cover rounded"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removePhoto(index)}
                                      className="absolute top-1 right-1 h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                                    <label 
                                      htmlFor={`photo-${index}`}
                                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center"
                                    >
                                      Add Photo {index + 1}
                                    </label>
                                    <input
                                      id={`photo-${index}`}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handlePhotoUpload(index, file);
                                      }}
                                    />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">Additional Notes</h4>
                          <Textarea
                            placeholder="Additional notes (optional)"
                            value={newReport.notes}
                            onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={addNewReport}>Create Report</Button>
                          <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reports List - Only show when not adding new report */}
                  {!showAddForm && (
                    <div className="space-y-4">
                      {damageReports.filter(report => report.status !== 'completed').map(report => (
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
                                     {/* Only show edit/delete buttons for owners */}
                                     {profile?.role === 'owner' && (
                                       <div className="flex gap-2">
                                         <Button variant="outline" size="sm" onClick={() => startEditing(report)}>
                                           <Edit className="h-4 w-4" />
                                         </Button>
                                         <Button variant="outline" size="sm" onClick={() => deleteReport(report.id)}>
                                           <Trash2 className="h-4 w-4" />
                                         </Button>
                                       </div>
                                     )}
                                   </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Reported:</span> {format(new Date(report.reportedDate), 'PPP')}
                                  </div>
                                  <div>
                                    <span className="font-medium">Est. Cost:</span> ${report.estimatedCost.toFixed(2)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Responsible Party:</span> {report.responsibleParty}
                                  </div>
                                  <div>
                                    <span className="font-medium">Report Date:</span> {format(new Date(report.reportDate), 'PPP')}
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
                  )}
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
          )}
        </div>

        {/* Location Manager Modal */}
        <LocationManagerModal
          isOpen={showLocationManager}
          onClose={() => setShowLocationManager(false)}
          locations={locations}
          onUpdateLocations={setLocations}
        />
      </div>
    </div>
  );
};