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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Save, X, Trash2, AlertTriangle, Camera, FileText, CalendarIcon, DollarSign, Home, ClipboardList, Package, Settings, History, Upload, MapPin, Search, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationManagerModal } from './LocationManagerModal';
import DamageReportHistoryEnhanced from './DamageReportHistoryEnhanced';
import CameraCapture from './CameraCapture';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { DamagePropertySelector } from './DamagePropertySelector';
import { DamageReportCard } from './DamageReportCard';
import { Building2 } from 'lucide-react';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  reportedDate: string;
  reportDate: string;
  estimatedCost: number;
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  photos: (File | string)[]; // Allow both File objects and base64 strings
  photoUrls?: string[]; // For persisted photo URLs
  notes: string;
  responsibleParty: 'guest' | 'owner' | 'other' | 'no-fault';
  repairDate?: string;
  propertyId?: string;
  propertyName?: string;
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
  const { profile, roles, isOwner } = useAuth();
  const { selectedProperty, propertyMode, userProperties } = usePropertyContext();
  
  const [damageReports, setDamageReports] = useState<DamageItem[]>([
    {
      id: '1',
      title: 'Cracked bathroom tile',
      description: 'Large crack in bathroom floor tile near shower',
      location: 'Main bathroom',
      severity: 'moderate',
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
  ].sort());

  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'minor' as const,
    estimatedCost: 0,
    notes: '',
    responsibleParty: 'guest' as const,
    reportDate: new Date().toISOString().split('T')[0],
    photos: [] as (File | string)[],
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DamageItem>>({});
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<DamageItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [captureMode, setCaptureMode] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

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

    if (!selectedProperty && propertyMode === 'property') {
      toast({
        title: "Property required",
        description: "Please select a property for this damage report.",
        variant: "destructive"
      });
      return;
    }

    const report: DamageItem = {
      id: Date.now().toString(),
      ...newReport,
      reportedDate: new Date().toISOString(),
      status: 'reported',
      propertyId: selectedProperty?.id,
      propertyName: selectedProperty?.name,
    };

    setDamageReports(prev => [...prev, report]);
    setNewReport({
      title: '',
      description: '',
      location: '',
      severity: 'minor',
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

  const handlePhotoUpload = (index: number, file: File | string) => {
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

  const markAsComplete = (id: string) => {
    updateStatus(id, 'completed');
  };

  const getUniqueCategories = () => {
    // Category field has been removed
    return [];
  };

  // Filter reports based on property selection and search
  const filteredReports = damageReports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (propertyMode === 'all') {
      return matchesSearch;
    } else if (selectedProperty) {
      return matchesSearch && report.propertyId === selectedProperty.id;
    }
    return matchesSearch;
  });

  // Group reports by property and year for "all" mode
  const groupedReports = () => {
    const grouped: Record<string, Record<string, DamageItem[]>> = {};
    
    filteredReports.forEach(report => {
      const propertyKey = report.propertyId || 'unassigned';
      const year = new Date(report.reportDate).getFullYear().toString();
      
      if (!grouped[propertyKey]) {
        grouped[propertyKey] = {};
      }
      if (!grouped[propertyKey][year]) {
        grouped[propertyKey][year] = [];
      }
      grouped[propertyKey][year].push(report);
    });
    
    return grouped;
  };

  const getHistoryData = () => {
    return filteredReports.map(report => ({
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
                  variant="outline" 
                  onClick={() => navigate('/inspections')}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Inspections
                </Button>
              )}
              {hasAccess('inventory') && (
                <Button 
                  variant="outline" 
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
                {roles.map(role => (
                  <Badge key={role} variant={role === 'owner' ? 'default' : 'secondary'}>
                    {role}
                  </Badge>
                ))}
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
               <DamageReportHistoryEnhanced
                 reports={getHistoryData()}
                 onViewReport={(report) => {
                   const originalReport = damageReports.find(r => r.id === report.id);
                   if (originalReport) {
                     // Set selected history report to view
                     setSelectedHistoryReport(originalReport);
                     setShowHistory(false);
                   }
                 }}
                 propertyMode={propertyMode}
                 properties={userProperties}
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
                                     <div><strong>Responsible Party:</strong> {selectedHistoryReport.responsibleParty === 'no-fault' ? 'No Fault' :
                                       selectedHistoryReport.responsibleParty.charAt(0).toUpperCase() + selectedHistoryReport.responsibleParty.slice(1)}
                                     </div>
                    <div><strong>Report Date:</strong> {format(new Date(selectedHistoryReport.reportDate + 'T12:00:00'), 'PPP')}</div>
                    <div><strong>Est. Cost:</strong> ${selectedHistoryReport.estimatedCost}</div>
                  </div>
                  {selectedHistoryReport.notes && (
                    <div><strong>Notes:</strong> {selectedHistoryReport.notes}</div>
                  )}
                                   <div className="space-y-2">
                                     <div className="flex items-center justify-between">
                                       <strong>Photos ({selectedHistoryReport.photos.length}):</strong>
                                       <div className="flex gap-2">
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={() => {
                                             setCaptureMode(true);
                                             setEditingReport(selectedHistoryReport.id);
                                           }}
                                         >
                                           <Camera className="h-4 w-4 mr-1" />
                                           Take Photo
                                         </Button>
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={() => {
                                             const input = document.createElement('input');
                                             input.type = 'file';
                                             input.accept = 'image/*';
                                             input.onchange = (e: any) => {
                                               const file = e.target?.files?.[0];
                                               if (file && editingReport) {
                                                 const updatedPhotos = [...selectedHistoryReport.photos, file];
                                                 setDamageReports(prev => prev.map(r => 
                                                   r.id === selectedHistoryReport.id ? { ...r, photos: updatedPhotos } : r
                                                 ));
                                                 setSelectedHistoryReport({ ...selectedHistoryReport, photos: updatedPhotos });
                                               }
                                             };
                                             input.click();
                                           }}
                                         >
                                           <ImageIcon className="h-4 w-4 mr-1" />
                                           Upload Photo
                                         </Button>
                                       </div>
                                     </div>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                       {selectedHistoryReport.photos.map((photo, index) => (
                                         <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                                           <img 
                                             src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)} 
                                             alt={`Damage photo ${index + 1}`}
                                             className="w-full h-full object-cover" 
                                           />
                                           <Button
                                             variant="destructive"
                                             size="sm"
                                             onClick={() => {
                                               const updatedPhotos = selectedHistoryReport.photos.filter((_, i) => i !== index);
                                               setDamageReports(prev => prev.map(r => 
                                                 r.id === selectedHistoryReport.id ? { ...r, photos: updatedPhotos } : r
                                               ));
                                               setSelectedHistoryReport({ ...selectedHistoryReport, photos: updatedPhotos });
                                             }}
                                             className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                           >
                                             <X className="h-3 w-3" />
                                           </Button>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Report View */}
          {!showHistory && !selectedHistoryReport && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-sky-600">Active Reports</h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2"
                      >
                        <History className="h-4 w-4" />
                        Damage Report History
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
                
                {/* Property Selector - Only shows properties, required for damage reports */}
                <DamagePropertySelector />
                
                {/* Search Box */}
                {!showAddForm && (
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search damage reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}
              </div>
              
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="active">Active Reports</TabsTrigger>
                  <TabsTrigger value="pending">Pending Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-6 mt-6">

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
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Damage Title</label>
                              <Input
                                placeholder="Damage title"
                                value={newReport.title}
                                onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Location</label>
                              <Select value={newReport.location} onValueChange={handleLocationSelect}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[...locations].sort().map(location => (
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
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Report Date</label>
                              <Popover>
                                 <PopoverTrigger asChild>
                                   <Button
                                     variant="outline"
                                     className={cn(
                                       "justify-start text-left font-normal",
                                       !newReport.reportDate && "text-muted-foreground"
                                     )}
                                   >
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {newReport.reportDate ? format(new Date(newReport.reportDate + 'T12:00:00'), 'PPP') : <span>Pick a date</span>}
                                   </Button>
                                 </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={newReport.reportDate ? new Date(newReport.reportDate + 'T12:00:00') : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        // Use local date to avoid timezone issues
                                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        setNewReport(prev => ({ ...prev, reportDate: format(localDate, 'yyyy-MM-dd') }));
                                      }
                                    }}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Severity</label>
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
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Estimated Cost</label>
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
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-cyan-600">Responsible Party</label>
                              <Select 
                                value={newReport.responsibleParty} 
                                onValueChange={(value: any) => setNewReport(prev => ({ ...prev, responsibleParty: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select responsible party" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="guest">Guest</SelectItem>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="no-fault">No Fault</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg text-cyan-600">Detailed Description</h4>
                          <Textarea
                            placeholder="Detailed description of the damage..."
                            value={newReport.description}
                            onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        {/* Photo Upload Section */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg text-cyan-600">Photos</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map((index) => (
                              <div 
                                key={index} 
                                className="aspect-[4/3] border-2 border-dashed border-border rounded-lg p-2 flex flex-col items-center justify-center hover:border-primary/50 transition-colors relative"
                              >
                                 {newReport.photos[index] ? (
                                  <>
                                    <img 
                                      src={typeof newReport.photos[index] === 'string' 
                                        ? newReport.photos[index] as string
                                        : URL.createObjectURL(newReport.photos[index] as File)
                                      } 
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
                          <h4 className="font-medium text-lg text-cyan-600">Additional Notes</h4>
                          <Textarea
                            placeholder="Additional notes (optional)"
                            value={newReport.notes}
                            onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={addNewReport}>Create Report</Button>
                          <Button variant="outline" onClick={() => setShowAddForm(false)}>Active Reports</Button>
                          <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reports List - Only show when not adding new report */}
                  {!showAddForm && (
                    <div className="space-y-4">
                      {(() => {
                        const activeReports = filteredReports.filter(report => report.status !== 'completed');
                        if (propertyMode === 'all') {
                          // Group by property and year
                          const grouped: Record<string, Record<string, DamageItem[]>> = {};
                          activeReports.forEach(report => {
                            const propertyKey = report.propertyId || 'unassigned';
                            const year = new Date(report.reportDate).getFullYear().toString();
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
                                    <Badge variant="secondary">
                                      {Object.values(yearGroups).flat().length} reports
                                    </Badge>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                  {Object.entries(yearGroups).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([year, reports]) => (
                                    <div key={year} className="space-y-3">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <h4 className="font-semibold">{year}</h4>
                                        <Badge variant="outline">{reports.length}</Badge>
                                      </div>
                                      {reports.map(report => (
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
                                        </div>
                                     </div>
                                      {/* Action buttons */}
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => markAsComplete(report.id)}>
                                          Mark Complete
                                        </Button>
                                        {isOwner() && (
                                          <>
                                            <Button variant="outline" size="sm" onClick={() => startEditing(report)}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                             <AlertDialog>
                                               <AlertDialogTrigger asChild>
                                                 <Button variant="outline" size="sm">
                                                   <Trash2 className="h-4 w-4" />
                                                 </Button>
                                               </AlertDialogTrigger>
                                               <AlertDialogContent>
                                                 <AlertDialogHeader>
                                                   <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                   <AlertDialogDescription>
                                                     This action cannot be undone. This will permanently delete the damage report "{report.title}".
                                                   </AlertDialogDescription>
                                                 </AlertDialogHeader>
                                                 <AlertDialogFooter>
                                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                   <AlertDialogAction onClick={() => deleteReport(report.id)}>
                                                     Delete
                                                   </AlertDialogAction>
                                                 </AlertDialogFooter>
                                               </AlertDialogContent>
                                             </AlertDialog>
                                          </>
                                        )}
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
                                      <span className="font-medium">Responsible Party:</span> {report.responsibleParty === 'no-fault' ? 'No Fault' : 
                                        report.responsibleParty.charAt(0).toUpperCase() + report.responsibleParty.slice(1)}
                                    </div>
                                   <div>
                                     <span className="font-medium">Report Date:</span> {format(new Date(report.reportDate + 'T12:00:00'), 'PPP')}
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
                
                {/* Pending Reports Tab */}
                <TabsContent value="pending" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Damage Reports</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reports that have not been closed or resolved
                      </p>
                    </CardHeader>
                    <CardContent>
                      {filteredReports.filter(report => 
                        report.status !== 'completed' && report.status !== 'approved'
                      ).length > 0 ? (
                        <div className="space-y-4">
                          {filteredReports
                            .filter(report => report.status !== 'completed' && report.status !== 'approved')
                            .map(report => (
                              <Card key={report.id} className="border-l-4 border-l-warning">
                                <CardContent className="p-6">
                                  <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <h4 className="font-semibold text-lg">{report.title}</h4>
                                          <Badge 
                                            variant={
                                              report.severity === 'minor' ? 'default' :
                                              report.severity === 'moderate' ? 'secondary' : 
                                              'destructive'
                                            }
                                          >
                                            {report.severity}
                                          </Badge>
                                          <Badge variant="outline">
                                            {report.status}
                                          </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-3">{report.description}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{report.location}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>{format(new Date(report.reportDate + 'T12:00:00'), 'MMM d, yyyy')}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span>${report.estimatedCost.toFixed(2)}</span>
                                          </div>
                                          <div className="text-muted-foreground">
                                            Responsible: {report.responsibleParty === 'no-fault' ? 'No Fault' :
                                              report.responsibleParty.charAt(0).toUpperCase() + report.responsibleParty.slice(1)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => startEditing(report)}
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete this damage report? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteReport(report.id)}>
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                    
                                    {/* Status Update Buttons */}
                                    <div className="flex gap-2 pt-2 border-t">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(report.id, 'assessed')}
                                        disabled={report.status === 'assessed'}
                                      >
                                        Mark as Assessed
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(report.id, 'approved')}
                                        disabled={report.status === 'approved'}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(report.id, 'in-repair')}
                                        disabled={report.status === 'in-repair'}
                                      >
                                        In Repair
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => markAsComplete(report.id)}
                                      >
                                        Mark Complete
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No pending damage reports for this property.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6 mt-0">
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

        {/* Camera Capture Modal */}
        <CameraCapture
          isOpen={captureMode}
          onCapture={(imageSrc) => {
            if (editingReport) {
              const report = damageReports.find(r => r.id === editingReport);
              if (report) {
                const updatedPhotos = [...report.photos, imageSrc];
                setDamageReports(prev => prev.map(r => 
                  r.id === editingReport ? { ...r, photos: updatedPhotos } : r
                ));
                if (selectedHistoryReport?.id === editingReport) {
                  setSelectedHistoryReport({ ...report, photos: updatedPhotos });
                }
              }
            }
            setCaptureMode(false);
            toast({
              title: "Photo captured",
              description: "Photo added to damage report.",
            });
          }}
          onClose={() => {
            setCaptureMode(false);
            setEditingPhotoIndex(null);
          }}
        />
      </div>
    </div>
  );
};