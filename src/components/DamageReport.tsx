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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Save, X, Trash2, AlertTriangle, Camera, FileText, CalendarIcon, DollarSign, Home, ClipboardList, Package, Settings, History, Upload, MapPin, Search, Image as ImageIcon, Building2, FileDown, Columns2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationManagerModal } from './LocationManagerModal';
import DamageReportHistoryEnhanced from './DamageReportHistoryEnhanced';
import CameraCapture from './CameraCapture';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { DamagePropertySelector } from './DamagePropertySelector';
import { DamageReportCard } from './DamageReportCard';
import { useDamageReports, type DamageReport as DamageReportType } from '@/hooks/useDamageReports';
import { ClaimDeadlineTracker } from './ClaimDeadlineTracker';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { generateClaimPDF } from '@/lib/claimPdfGenerator';

export const DamageReport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, roles, isOwner } = useAuth();
  const { selectedProperty, propertyMode, userProperties, setSelectedProperty, setPropertyMode } = usePropertyContext();
  const { reports: damageReports, loading, addReport, updateReport, deleteReport: deleteReportApi, uploadPhoto } = useDamageReports();

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
    photos: [] as File[],
    // Claim fields
    guestName: '',
    reservationId: '',
    bookingPlatform: '',
    checkInDate: '',
    checkOutDate: '',
    dateDamageDiscovered: '',
    beforePhotos: [] as File[],
    receiptFiles: [] as File[],
    resolutionSought: '',
    claimStatus: 'not_filed',
    claimReferenceNumber: '',
    claimTimelineNotes: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DamageReportType>>({});
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<DamageReportType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [captureMode, setCaptureMode] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [submitting, setSubmitting] = useState(false);

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

  // Handle URL view parameter
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'new') {
      setShowHistory(false);
      setSelectedHistoryReport(null);
      setShowAddForm(true);
      setActiveTab('active');
    } else if (view === 'pending') {
      setShowHistory(false);
      setSelectedHistoryReport(null);
      setShowAddForm(false);
      setActiveTab('pending');
    } else if (view === 'history') {
      setShowAddForm(false);
      setSelectedHistoryReport(null);
      setShowHistory(true);
    }
  }, [searchParams]);

  // Auto-select property if user only has one
  useEffect(() => {
    if (userProperties.length === 1 && !selectedProperty) {
      setSelectedProperty(userProperties[0]);
    }
  }, [userProperties.length, selectedProperty, setSelectedProperty]);

  // Load saved locations from localStorage
  useEffect(() => {
    const savedLocations = localStorage.getItem('damage-locations');
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('damage-locations', JSON.stringify(locations));
  }, [locations]);

  const addNewReport = async () => {
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

    if (!profile?.id) return;

    setSubmitting(true);

    // Upload photos first
    const tempId = crypto.randomUUID();
    const photoUrls: string[] = [];
    for (const file of newReport.photos) {
      const url = await uploadPhoto(file, tempId);
      if (url) photoUrls.push(url);
    }

    // Calculate claim deadline if checkout date and platform are provided
    let claimDeadline: string | null = null;
    if (newReport.checkOutDate && newReport.bookingPlatform) {
      const deadlineDays = newReport.bookingPlatform === 'airbnb' ? 14 : newReport.bookingPlatform === 'vrbo' ? 60 : 30;
      claimDeadline = format(addDays(new Date(newReport.checkOutDate + 'T12:00:00'), deadlineDays), 'yyyy-MM-dd');
    }

    // Upload before photos
    const beforePhotoUrls: string[] = [];
    for (const file of newReport.beforePhotos) {
      const url = await uploadPhoto(file, tempId);
      if (url) beforePhotoUrls.push(url);
    }

    // Upload receipt files
    const receiptUrls: string[] = [];
    for (const file of newReport.receiptFiles) {
      const url = await uploadPhoto(file, tempId);
      if (url) receiptUrls.push(url);
    }

    const success = await addReport({
      title: newReport.title.trim(),
      description: newReport.description.trim(),
      location: newReport.location,
      severity: newReport.severity,
      status: 'reported',
      responsible_party: newReport.responsibleParty,
      damage_date: newReport.reportDate,
      estimated_value: newReport.estimatedCost || null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      notes: newReport.notes.trim() || null,
      property_id: selectedProperty?.id || null,
      property_name: selectedProperty?.name || null,
      reported_by: profile.id,
      // Claim fields
      guest_name: newReport.guestName.trim() || null,
      reservation_id: newReport.reservationId.trim() || null,
      booking_platform: newReport.bookingPlatform || null,
      check_in_date: newReport.checkInDate || null,
      check_out_date: newReport.checkOutDate || null,
      date_damage_discovered: newReport.dateDamageDiscovered || null,
      before_photo_urls: beforePhotoUrls.length > 0 ? beforePhotoUrls : null,
      receipt_urls: receiptUrls.length > 0 ? receiptUrls : null,
      resolution_sought: newReport.resolutionSought || null,
      claim_status: newReport.claimStatus || 'not_filed',
      claim_reference_number: newReport.claimReferenceNumber.trim() || null,
      claim_deadline: claimDeadline,
      claim_timeline_notes: newReport.claimTimelineNotes.trim() || null,
    });

    if (success) {
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
        guestName: '',
        reservationId: '',
        bookingPlatform: '',
        checkInDate: '',
        checkOutDate: '',
        dateDamageDiscovered: '',
        beforePhotos: [],
        receiptFiles: [],
        resolutionSought: '',
        claimStatus: 'not_filed',
        claimReferenceNumber: '',
        claimTimelineNotes: '',
      });
      setShowAddForm(false);
    }
    setSubmitting(false);
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

  const startEditing = (report: DamageReportType) => {
    setEditingReport(report.id);
    setEditingData({ ...report });
  };

  const saveEdit = async () => {
    if (editingReport && editingData) {
      await updateReport(editingReport, {
        title: editingData.title,
        description: editingData.description,
        status: editingData.status,
        estimated_value: editingData.estimated_value,
        notes: editingData.notes,
        severity: editingData.severity,
        responsible_party: editingData.responsible_party,
      });
      setEditingReport(null);
      setEditingData({});
    }
  };

  const handleDeleteReport = async (id: string) => {
    await deleteReportApi(id);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateReport(id, { status });
  };

  const markAsComplete = (id: string) => {
    updateStatus(id, 'completed');
  };

  // Filter reports based on property selection and search
  const filteredReports = damageReports.filter(report => {
    const matchesSearch = !searchTerm || 
      (report.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (propertyMode === 'all') {
      return matchesSearch;
    } else if (selectedProperty) {
      return matchesSearch && report.property_id === selectedProperty.id;
    }
    return matchesSearch;
  });

  const getHistoryData = () => {
    return filteredReports.map(report => ({
      id: report.id,
      title: report.title || report.description,
      description: report.description,
      severity: (report.severity === 'minor' ? 'low' : report.severity === 'moderate' ? 'medium' : 'high') as 'low' | 'medium' | 'high',
      status: report.status as 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed',
      location: report.location,
      assignedTo: report.responsible_party,
      estimatedCost: report.estimated_value || undefined,
      images: report.photo_urls || [],
      notes: report.notes || '',
      createdAt: report.damage_date,
      updatedAt: report.updated_at,
      propertyId: report.property_id || undefined,
      propertyName: report.property_name || undefined,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Damage Reports</h1>
            <p className="text-muted-foreground">Track and manage property damage reports and repairs</p>
          </div>

          {/* Show History View */}
          {showHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setShowHistory(false)} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Back to Reports
                </Button>
              </div>
              <DamageReportHistoryEnhanced
                reports={getHistoryData()}
                onViewReport={(report) => {
                  const originalReport = damageReports.find(r => r.id === report.id);
                  if (originalReport) {
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
                <Button variant="outline" onClick={() => { setSelectedHistoryReport(null); setShowHistory(true); }} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Back to History
                </Button>
                {(isOwner() || roles.includes('manager')) && (
                  <Button onClick={() => generateClaimPDF(selectedHistoryReport, selectedProperty ? { name: selectedProperty.name, address: selectedProperty.address, city: selectedProperty.city, state: selectedProperty.state, zip: selectedProperty.zip } : null)} className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Generate Claim Report
                  </Button>
                )}
              </div>

              {/* Claim Deadline Tracker */}
              {(isOwner() || roles.includes('manager')) && selectedHistoryReport.check_out_date && (
                <ClaimDeadlineTracker
                  checkOutDate={selectedHistoryReport.check_out_date}
                  bookingPlatform={selectedHistoryReport.booking_platform}
                  claimStatus={selectedHistoryReport.claim_status}
                  claimDeadline={selectedHistoryReport.claim_deadline}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{selectedHistoryReport.title || selectedHistoryReport.description}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{selectedHistoryReport.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong>Location:</strong> {selectedHistoryReport.location}</div>
                    <div><strong>Severity:</strong> {selectedHistoryReport.severity}</div>
                    <div><strong>Status:</strong> {selectedHistoryReport.status}</div>
                    <div><strong>Responsible Party:</strong> {selectedHistoryReport.responsible_party === 'no-fault' ? 'No Fault' :
                      selectedHistoryReport.responsible_party.charAt(0).toUpperCase() + selectedHistoryReport.responsible_party.slice(1)}
                    </div>
                    <div><strong>Report Date:</strong> {format(new Date(selectedHistoryReport.damage_date + 'T12:00:00'), 'PPP')}</div>
                    <div><strong>Est. Cost:</strong> ${(selectedHistoryReport.estimated_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>

                  {/* Claim Details - Owner/Manager Only */}
                  {(isOwner() || roles.includes('manager')) && selectedHistoryReport.guest_name && (
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Booking & Claim Details
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {selectedHistoryReport.guest_name && <div><strong>Guest:</strong> {selectedHistoryReport.guest_name}</div>}
                        {selectedHistoryReport.reservation_id && <div><strong>Booking ID:</strong> {selectedHistoryReport.reservation_id}</div>}
                        {selectedHistoryReport.booking_platform && <div><strong>Platform:</strong> {selectedHistoryReport.booking_platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>}
                        {selectedHistoryReport.check_in_date && <div><strong>Check-in:</strong> {format(new Date(selectedHistoryReport.check_in_date + 'T12:00:00'), 'PPP')}</div>}
                        {selectedHistoryReport.check_out_date && <div><strong>Check-out:</strong> {format(new Date(selectedHistoryReport.check_out_date + 'T12:00:00'), 'PPP')}</div>}
                        {selectedHistoryReport.date_damage_discovered && <div><strong>Discovered:</strong> {format(new Date(selectedHistoryReport.date_damage_discovered + 'T12:00:00'), 'PPP')}</div>}
                        {selectedHistoryReport.resolution_sought && <div><strong>Resolution:</strong> {selectedHistoryReport.resolution_sought.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>}
                        {selectedHistoryReport.claim_status && <div><strong>Claim Status:</strong> <Badge variant="outline">{selectedHistoryReport.claim_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge></div>}
                        {selectedHistoryReport.claim_reference_number && <div><strong>Ref #:</strong> {selectedHistoryReport.claim_reference_number}</div>}
                      </div>
                      {selectedHistoryReport.claim_timeline_notes && (
                        <div><strong>Timeline Notes:</strong> {selectedHistoryReport.claim_timeline_notes}</div>
                      )}
                    </div>
                  )}

                  {selectedHistoryReport.notes && (
                    <div><strong>Notes:</strong> {selectedHistoryReport.notes}</div>
                  )}

                  {/* Before/After Photo Comparison */}
                  {(isOwner() || roles.includes('manager')) && (
                    (selectedHistoryReport.before_photo_urls?.length || 0) > 0 || (selectedHistoryReport.photo_urls?.length || 0) > 0
                  ) && (
                    <BeforeAfterComparison
                      beforePhotos={selectedHistoryReport.before_photo_urls || []}
                      afterPhotos={selectedHistoryReport.photo_urls || []}
                      location={selectedHistoryReport.location}
                    />
                  )}

                  {/* Receipts */}
                  {(isOwner() || roles.includes('manager')) && (selectedHistoryReport.receipt_urls?.length || 0) > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <strong>Receipts & Quotes ({selectedHistoryReport.receipt_urls!.length}):</strong>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {selectedHistoryReport.receipt_urls!.map((url, index) => (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">Document {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>Damage Photos ({(selectedHistoryReport.photo_urls || []).length}):</strong>
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
                            input.onchange = async (e: any) => {
                              const file = e.target?.files?.[0];
                              if (file) {
                                const url = await uploadPhoto(file, selectedHistoryReport.id);
                                if (url) {
                                  const updatedUrls = [...(selectedHistoryReport.photo_urls || []), url];
                                  await updateReport(selectedHistoryReport.id, { photo_urls: updatedUrls });
                                  setSelectedHistoryReport({ ...selectedHistoryReport, photo_urls: updatedUrls });
                                }
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
                      {(selectedHistoryReport.photo_urls || []).map((url, index) => (
                        <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                          <img src={url} alt={`Damage photo ${index + 1}`} className="w-full h-full object-cover" />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              const updatedUrls = (selectedHistoryReport.photo_urls || []).filter((_, i) => i !== index);
                              await updateReport(selectedHistoryReport.id, { photo_urls: updatedUrls.length > 0 ? updatedUrls : null });
                              setSelectedHistoryReport({ ...selectedHistoryReport, photo_urls: updatedUrls });
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
                      <Button variant="outline" onClick={() => setShowHistory(true)} className="flex items-center gap-2">
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
                
                {/* Property Selector */}
                <DamagePropertySelector />
                
                {/* Display Active/Pending Reports for Selected Property in Accordion */}
                {selectedProperty && !showAddForm && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Active and Pending Reports</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Existing reports for {selectedProperty.name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {filteredReports.filter(r => r.status !== 'completed').length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                          {filteredReports
                            .filter(r => r.status !== 'completed')
                            .map(report => (
                              <AccordionItem key={report.id} value={report.id} className="border rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">{report.title || report.description}</span>
                                    <Badge variant={statusColors[report.status] as any}>
                                      {report.status}
                                    </Badge>
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
                                  {report.description && (
                                    <div className="mt-3"><strong>Description:</strong> {report.description}</div>
                                  )}
                                  {report.notes && (
                                    <div className="mt-2"><strong>Notes:</strong> {report.notes}</div>
                                  )}
                                  <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => startEditing(report)}>
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                        </Accordion>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No active or pending reports for this property.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                
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
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="active">Active Reports</TabsTrigger>
                  <TabsTrigger value="pending">Pending Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-6 mt-6">
                  {/* Add New Report Form */}
                  {showAddForm && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Create Damage Report</CardTitle>
                          <div className="flex gap-2">
                            <Button onClick={addNewReport} size="sm" disabled={submitting}>
                              <Save className="h-4 w-4 mr-2" />
                              {submitting ? 'Saving...' : 'Save Report'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                                  type="text"
                                  placeholder="Estimated repair cost"
                                  value={newReport.estimatedCost ? newReport.estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '');
                                    const numValue = value === '' ? 0 : Number(value);
                                    if (!isNaN(numValue)) {
                                      setNewReport(prev => ({ ...prev, estimatedCost: Math.round(numValue) }));
                                    }
                                  }}
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

                        {/* Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-cyan-600">Description</label>
                          <Textarea
                            placeholder="Describe the damage in detail"
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
                          <h4 className="font-medium text-lg text-cyan-600">Additional Notes</h4>
                          <Textarea
                            placeholder="Additional notes (optional)"
                            value={newReport.notes}
                            onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                          />
                        </div>

                        {/* Claim Information Section - Owner/Manager Only */}
                        {(isOwner() || roles.includes('manager')) && (
                          <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-lg text-primary flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Booking & Claim Information
                            </h4>
                            <p className="text-sm text-muted-foreground">For Airbnb/VRBO damage claims. These fields help generate a complete claim report.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Guest Name</label>
                                <Input
                                  placeholder="Guest's full name"
                                  value={newReport.guestName}
                                  onChange={(e) => setNewReport(prev => ({ ...prev, guestName: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Reservation/Booking ID</label>
                                <Input
                                  placeholder="Confirmation number"
                                  value={newReport.reservationId}
                                  onChange={(e) => setNewReport(prev => ({ ...prev, reservationId: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Booking Platform</label>
                                <Select value={newReport.bookingPlatform} onValueChange={(value) => setNewReport(prev => ({ ...prev, bookingPlatform: value }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="airbnb">Airbnb</SelectItem>
                                    <SelectItem value="vrbo">VRBO</SelectItem>
                                    <SelectItem value="direct_booking">Direct Booking</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Date Damage Discovered</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.dateDamageDiscovered && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {newReport.dateDamageDiscovered ? format(new Date(newReport.dateDamageDiscovered + 'T12:00:00'), 'PPP') : 'Pick a date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newReport.dateDamageDiscovered ? new Date(newReport.dateDamageDiscovered + 'T12:00:00') : undefined}
                                      onSelect={(date) => date && setNewReport(prev => ({ ...prev, dateDamageDiscovered: format(date, 'yyyy-MM-dd') }))}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Check-in Date</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.checkInDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {newReport.checkInDate ? format(new Date(newReport.checkInDate + 'T12:00:00'), 'PPP') : 'Pick a date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newReport.checkInDate ? new Date(newReport.checkInDate + 'T12:00:00') : undefined}
                                      onSelect={(date) => date && setNewReport(prev => ({ ...prev, checkInDate: format(date, 'yyyy-MM-dd') }))}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Check-out Date</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.checkOutDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {newReport.checkOutDate ? format(new Date(newReport.checkOutDate + 'T12:00:00'), 'PPP') : 'Pick a date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newReport.checkOutDate ? new Date(newReport.checkOutDate + 'T12:00:00') : undefined}
                                      onSelect={(date) => date && setNewReport(prev => ({ ...prev, checkOutDate: format(date, 'yyyy-MM-dd') }))}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Resolution Sought</label>
                                <Select value={newReport.resolutionSought} onValueChange={(value) => setNewReport(prev => ({ ...prev, resolutionSought: value }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select resolution type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full_replacement">Full Replacement</SelectItem>
                                    <SelectItem value="partial_reimbursement">Partial Reimbursement</SelectItem>
                                    <SelectItem value="repair_only">Repair Only</SelectItem>
                                    <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Claim Status</label>
                                <Select value={newReport.claimStatus} onValueChange={(value) => setNewReport(prev => ({ ...prev, claimStatus: value }))}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_filed">Not Filed</SelectItem>
                                    <SelectItem value="filed_with_platform">Filed with Platform</SelectItem>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="denied">Denied</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Claim Reference Number</label>
                              <Input
                                placeholder="Platform tracking/case number"
                                value={newReport.claimReferenceNumber}
                                onChange={(e) => setNewReport(prev => ({ ...prev, claimReferenceNumber: e.target.value }))}
                              />
                            </div>

                            {/* Before Photos */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">Before Photos (from last inspection/turnover)</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {newReport.beforePhotos.map((file, index) => (
                                  <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                                    <img src={URL.createObjectURL(file)} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setNewReport(prev => ({ ...prev, beforePhotos: prev.beforePhotos.filter((_, i) => i !== index) }))}
                                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <label className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">Add Before Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setNewReport(prev => ({ ...prev, beforePhotos: [...prev.beforePhotos, file] }));
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Receipt/Quote Uploads */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">Receipts & Quotes</h5>
                              <div className="space-y-2">
                                {newReport.receiptFiles.map((file, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm flex-1 truncate">{file.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setNewReport(prev => ({ ...prev, receiptFiles: prev.receiptFiles.filter((_, i) => i !== index) }))}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Upload receipt or quote</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setNewReport(prev => ({ ...prev, receiptFiles: [...prev.receiptFiles, file] }));
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Timeline Notes</label>
                              <Textarea
                                placeholder="Key dates and actions taken (Airbnb requires filing within 14 days of checkout)"
                                value={newReport.claimTimelineNotes}
                                onChange={(e) => setNewReport(prev => ({ ...prev, claimTimelineNotes: e.target.value }))}
                                rows={2}
                              />
                            </div>

                            {/* Deadline Tracker Preview */}
                            {newReport.checkOutDate && (
                              <ClaimDeadlineTracker
                                checkOutDate={newReport.checkOutDate}
                                bookingPlatform={newReport.bookingPlatform}
                                claimStatus={newReport.claimStatus}
                                claimDeadline={null}
                              />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Reports List */}
                  {!showAddForm && (
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
                                        <DamageReportCard
                                          key={report.id}
                                          report={report}
                                          isEditing={editingReport === report.id}
                                          editingData={editingData}
                                          isOwner={isOwner()}
                                          onStartEdit={startEditing}
                                          onSaveEdit={saveEdit}
                                          onCancelEdit={() => setEditingReport(null)}
                                          onDelete={handleDeleteReport}
                                          onMarkComplete={markAsComplete}
                                          onEditingDataChange={setEditingData}
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
                              onStartEdit={startEditing}
                              onSaveEdit={saveEdit}
                              onCancelEdit={() => setEditingReport(null)}
                              onDelete={handleDeleteReport}
                              onMarkComplete={markAsComplete}
                              onEditingDataChange={setEditingData}
                              severityColors={severityColors}
                              statusColors={statusColors}
                            />
                          ));
                        }
                      })()}
                    </div>
                  )}
                </TabsContent>

                {/* Pending Reports Tab */}
                <TabsContent value="pending" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Damage Reports</CardTitle>
                      <p className="text-sm text-muted-foreground">Reports that have not been closed or resolved</p>
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
                                          <h4 className="font-semibold text-lg">{report.title || report.description}</h4>
                                          <Badge 
                                            variant={
                                              report.severity === 'minor' ? 'default' :
                                              report.severity === 'moderate' ? 'secondary' : 
                                              'destructive'
                                            }
                                          >
                                            {report.severity}
                                          </Badge>
                                          <Badge variant="outline">{report.status}</Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-3">{report.description}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{report.location}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>{format(new Date(report.damage_date + 'T12:00:00'), 'MMM d, yyyy')}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span>${(report.estimated_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          </div>
                                          <div className="text-muted-foreground">
                                            Responsible: {report.responsible_party === 'no-fault' ? 'No Fault' :
                                              report.responsible_party.charAt(0).toUpperCase() + report.responsible_party.slice(1)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => startEditing(report)}>
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
                                              <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                    
                                    {/* Status Update Buttons */}
                                    <div className="flex gap-2 pt-2 border-t">
                                      <Button variant="outline" size="sm" onClick={() => updateStatus(report.id, 'assessed')} disabled={report.status === 'assessed'}>
                                        Mark as Assessed
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => updateStatus(report.id, 'approved')} disabled={report.status === 'approved'}>
                                        Approve
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => updateStatus(report.id, 'in-repair')} disabled={report.status === 'in-repair'}>
                                        In Repair
                                      </Button>
                                      <Button variant="default" size="sm" onClick={() => markAsComplete(report.id)}>
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
          onCapture={async (imageSrc) => {
            if (editingReport) {
              // Convert base64 to blob and upload
              const response = await fetch(imageSrc);
              const blob = await response.blob();
              const url = await uploadPhoto(blob, editingReport);
              if (url) {
                const report = damageReports.find(r => r.id === editingReport);
                if (report) {
                  const updatedUrls = [...(report.photo_urls || []), url];
                  await updateReport(editingReport, { photo_urls: updatedUrls });
                  if (selectedHistoryReport?.id === editingReport) {
                    setSelectedHistoryReport({ ...report, photo_urls: updatedUrls });
                  }
                }
              }
            }
            setCaptureMode(false);
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
