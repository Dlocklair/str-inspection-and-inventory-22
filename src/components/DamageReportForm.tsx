import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, X, Camera, FileText, CalendarIcon, DollarSign, MapPin, Upload, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationManagerModal } from './LocationManagerModal';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useDamageReports, type DamageReport as DamageReportType } from '@/hooks/useDamageReports';
import { ClaimDeadlineTracker } from './ClaimDeadlineTracker';

interface WorksheetData {
  discoveredBy: string;
  damageItems: { item: string; description: string; preExisting: string; repairOrReplace: string }[];
  costItems: { item: string; cost: number; source: string }[];
  evidenceChecklist: Record<string, boolean>;
  guestContactDate: string;
  guestContactMethod: string;
  guestResponse: string;
  guestResponseDate: string;
  bookingsCanceled: string;
  canceledDates: string;
  lostIncomeAmount: number;
}

const defaultWorksheet: WorksheetData = {
  discoveredBy: '',
  damageItems: [{ item: '', description: '', preExisting: 'N', repairOrReplace: 'Repair' }],
  costItems: [{ item: '', cost: 0, source: '' }],
  evidenceChecklist: {
    beforePhotos: false,
    afterPhotos: false,
    videoWalkthrough: false,
    cleaningStatement: false,
    repairEstimates: false,
    receipts: false,
    replacementLinks: false,
    policeReport: false,
    guestMessages: false,
  },
  guestContactDate: '',
  guestContactMethod: '',
  guestResponse: '',
  guestResponseDate: '',
  bookingsCanceled: 'N',
  canceledDates: '',
  lostIncomeAmount: 0,
};

function parseWorksheetFromNotes(notes: string | null): WorksheetData | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed._worksheetVersion) return parsed as WorksheetData;
  } catch { /* not JSON */ }
  return null;
}

function serializeWorksheet(ws: WorksheetData): string {
  return JSON.stringify({ ...ws, _worksheetVersion: 1 });
}

interface DamageReportFormProps {
  onClose: () => void;
  locations: string[];
  onUpdateLocations: (locations: string[]) => void;
  existingReport?: DamageReportType;
  onSaveExisting?: (id: string, updates: any) => Promise<boolean>;
}

export const DamageReportForm = ({ onClose, locations, onUpdateLocations, existingReport, onSaveExisting }: DamageReportFormProps) => {
  const { toast } = useToast();
  const { profile, isOwner, roles } = useAuth();
  const { selectedProperty, propertyMode, userProperties, setSelectedProperty } = usePropertyContext();
  const { addReport, uploadPhoto } = useDamageReports(
    propertyMode === 'property' ? selectedProperty?.id : undefined
  );

  const isEditing = !!existingReport;

  const [showLocationManager, setShowLocationManager] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const [worksheet, setWorksheet] = useState<WorksheetData>({ ...defaultWorksheet });

  // Pre-populate if editing
  useEffect(() => {
    if (existingReport) {
      setNewReport({
        title: existingReport.title || '',
        description: existingReport.description || '',
        location: existingReport.location || '',
        severity: (existingReport.severity as any) || 'minor',
        estimatedCost: existingReport.estimated_value || 0,
        notes: existingReport.notes || '',
        responsibleParty: (existingReport.responsible_party as any) || 'guest',
        reportDate: existingReport.damage_date || new Date().toISOString().split('T')[0],
        photos: [],
        guestName: existingReport.guest_name || '',
        reservationId: existingReport.reservation_id || '',
        bookingPlatform: existingReport.booking_platform || '',
        checkInDate: existingReport.check_in_date || '',
        checkOutDate: existingReport.check_out_date || '',
        dateDamageDiscovered: existingReport.date_damage_discovered || '',
        beforePhotos: [],
        receiptFiles: [],
        resolutionSought: existingReport.resolution_sought || '',
        claimStatus: existingReport.claim_status || 'not_filed',
        claimReferenceNumber: existingReport.claim_reference_number || '',
        claimTimelineNotes: existingReport.claim_timeline_notes || '',
      });

      // Try to parse worksheet data from claim_timeline_notes
      const ws = parseWorksheetFromNotes(existingReport.claim_timeline_notes);
      if (ws) setWorksheet(ws);

      // Set property if report has one
      if (existingReport.property_id) {
        const prop = userProperties.find(p => p.id === existingReport.property_id);
        if (prop) setSelectedProperty(prop);
      }
    }
  }, [existingReport]);

  const handleLocationSelect = (value: string) => {
    if (value === 'manage-locations') {
      setShowLocationManager(true);
    } else {
      setNewReport(prev => ({ ...prev, location: value }));
    }
  };

  const addNewReport = async () => {
    if (!newReport.title.trim() || !newReport.description.trim()) {
      toast({ title: "Required fields missing", description: "Please fill in title and description.", variant: "destructive" });
      return;
    }

    if (!selectedProperty && propertyMode === 'property') {
      toast({ title: "Property required", description: "Please select a property for this damage report.", variant: "destructive" });
      return;
    }

    if (!profile?.id) return;

    setSubmitting(true);

    // Serialize worksheet into claim_timeline_notes
    const serializedWorksheet = serializeWorksheet(worksheet);

    let claimDeadline: string | null = null;
    if (newReport.checkOutDate && newReport.bookingPlatform) {
      const deadlineDays = newReport.bookingPlatform === 'airbnb' ? 14 : newReport.bookingPlatform === 'vrbo' ? 60 : 30;
      claimDeadline = format(addDays(new Date(newReport.checkOutDate + 'T12:00:00'), deadlineDays), 'yyyy-MM-dd');
    }

    if (isEditing && existingReport && onSaveExisting) {
      const success = await onSaveExisting(existingReport.id, {
        title: newReport.title.trim(),
        description: newReport.description.trim(),
        location: newReport.location,
        severity: newReport.severity,
        estimated_value: newReport.estimatedCost || null,
        notes: newReport.notes.trim() || null,
        responsible_party: newReport.responsibleParty,
        damage_date: newReport.reportDate,
        property_id: selectedProperty?.id || null,
        property_name: selectedProperty?.name || null,
        guest_name: newReport.guestName.trim() || null,
        reservation_id: newReport.reservationId.trim() || null,
        booking_platform: newReport.bookingPlatform || null,
        check_in_date: newReport.checkInDate || null,
        check_out_date: newReport.checkOutDate || null,
        date_damage_discovered: newReport.dateDamageDiscovered || null,
        resolution_sought: newReport.resolutionSought || null,
        claim_status: newReport.claimStatus || 'not_filed',
        claim_reference_number: newReport.claimReferenceNumber.trim() || null,
        claim_deadline: claimDeadline,
        claim_timeline_notes: serializedWorksheet,
      });
      if (success) onClose();
      setSubmitting(false);
      return;
    }

    // New report flow
    const tempId = crypto.randomUUID();
    const photoUrls: string[] = [];
    for (const file of newReport.photos) {
      const url = await uploadPhoto(file, tempId);
      if (url) photoUrls.push(url);
    }

    const beforePhotoUrls: string[] = [];
    for (const file of newReport.beforePhotos) {
      const url = await uploadPhoto(file, tempId);
      if (url) beforePhotoUrls.push(url);
    }

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
      claim_timeline_notes: serializedWorksheet,
    });

    if (success) onClose();
    setSubmitting(false);
  };

  const propertyAddress = selectedProperty
    ? `${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zip}`
    : '';

  // Worksheet helpers
  const addDamageItem = () => setWorksheet(w => ({ ...w, damageItems: [...w.damageItems, { item: '', description: '', preExisting: 'N', repairOrReplace: 'Repair' }] }));
  const removeDamageItem = (i: number) => setWorksheet(w => ({ ...w, damageItems: w.damageItems.filter((_, idx) => idx !== i) }));
  const updateDamageItem = (i: number, field: string, value: string) => setWorksheet(w => ({ ...w, damageItems: w.damageItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const addCostItem = () => setWorksheet(w => ({ ...w, costItems: [...w.costItems, { item: '', cost: 0, source: '' }] }));
  const removeCostItem = (i: number) => setWorksheet(w => ({ ...w, costItems: w.costItems.filter((_, idx) => idx !== i) }));
  const updateCostItem = (i: number, field: string, value: any) => setWorksheet(w => ({ ...w, costItems: w.costItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const totalCost = worksheet.costItems.reduce((sum, item) => sum + (item.cost || 0), 0);

  const evidenceLabels: Record<string, string> = {
    beforePhotos: 'Before-stay photos (timestamped)',
    afterPhotos: 'After-stay photos (timestamped, multiple angles)',
    videoWalkthrough: 'Video walkthrough (if available)',
    cleaningStatement: 'Cleaning staff statement (if applicable)',
    repairEstimates: 'Repair estimates or contractor quotes',
    receipts: 'Receipts for replaced items',
    replacementLinks: 'Links to replacement items with pricing',
    policeReport: 'Police report (recommended for claims over ~$300–$500, or theft)',
    guestMessages: 'Screenshots of any relevant guest messages',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? 'Edit Damage Report' : 'Create Damage Report'}</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addNewReport} size="sm" disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : isEditing ? 'Update Report' : 'Save Report'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Basic Information</h4>

            {/* Property Selector */}
            {userProperties.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Property</label>
                <Select
                  value={selectedProperty?.id || ''}
                  onValueChange={(value) => {
                    const prop = userProperties.find(p => p.id === value);
                    if (prop) setSelectedProperty(prop);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {userProperties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {userProperties.length === 1 && selectedProperty && (
              <div className="text-sm text-muted-foreground">
                Property: <span className="font-medium text-foreground">{selectedProperty.name}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Damage Title</label>
                <Input placeholder="Damage title" value={newReport.title} onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Location</label>
                <Select value={newReport.location} onValueChange={handleLocationSelect}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {[...locations].sort().map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                    <SelectItem value="manage-locations">
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />Manage locations</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Report Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !newReport.reportDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newReport.reportDate ? format(new Date(newReport.reportDate + 'T12:00:00'), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newReport.reportDate ? new Date(newReport.reportDate + 'T12:00:00') : undefined} onSelect={(date) => { if (date) { const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); setNewReport(prev => ({ ...prev, reportDate: format(localDate, 'yyyy-MM-dd') })); } }} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Severity</label>
                <Select value={newReport.severity} onValueChange={(value: any) => setNewReport(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Responsible Party</label>
                <Select value={newReport.responsibleParty} onValueChange={(value: any) => setNewReport(prev => ({ ...prev, responsibleParty: value }))}>
                  <SelectTrigger><SelectValue placeholder="Responsible party" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="wear">Wear & Tear</SelectItem>
                    <SelectItem value="no-fault">No Fault</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Estimated Cost</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="0.00" value={newReport.estimatedCost || ''} onChange={(e) => setNewReport(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Description</label>
              <Textarea placeholder="Describe the damage in detail" value={newReport.description} onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Notes</label>
              <Textarea placeholder="Additional notes" value={newReport.notes} onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Damage Photos ({newReport.photos.length}/3)</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {newReport.photos.map((file, index) => (
                  <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                    <img src={URL.createObjectURL(file)} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <Button variant="destructive" size="sm" onClick={() => setNewReport(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))} className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {newReport.photos.length < 3 && (
                  <label className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file && newReport.photos.length < 3) setNewReport(prev => ({ ...prev, photos: [...prev.photos, file] })); }} />
                  </label>
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* Pre-Filing Damage Claim Worksheet */}
            {/* ============================================================ */}
            {(isOwner() || roles.includes('manager')) && (
              <Card className="border-2 border-primary/20 mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Pre-Filing Damage Claim Worksheet
                  </CardTitle>
                  <CardDescription>
                    Use this to gather everything before you log on. Both platforms will ask for this information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* SECTION 1 — Booking Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 1</span>
                      <span className="font-semibold text-sm">— Booking Information</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Platform (Airbnb / VRBO)</Label>
                        <Select value={newReport.bookingPlatform} onValueChange={(value) => setNewReport(prev => ({ ...prev, bookingPlatform: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airbnb">Airbnb</SelectItem>
                            <SelectItem value="vrbo">VRBO</SelectItem>
                            <SelectItem value="booking_com">Booking.com</SelectItem>
                            <SelectItem value="direct">Direct Booking</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Guest Full Name</Label>
                        <Input placeholder="Guest full name" value={newReport.guestName} onChange={(e) => setNewReport(prev => ({ ...prev, guestName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Reservation / Booking ID #</Label>
                        <Input placeholder="Booking ID" value={newReport.reservationId} onChange={(e) => setNewReport(prev => ({ ...prev, reservationId: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Check-In Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.checkInDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newReport.checkInDate ? format(new Date(newReport.checkInDate + 'T12:00:00'), 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={newReport.checkInDate ? new Date(newReport.checkInDate + 'T12:00:00') : undefined} onSelect={(date) => date && setNewReport(prev => ({ ...prev, checkInDate: format(date, 'yyyy-MM-dd') }))} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Check-Out Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.checkOutDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newReport.checkOutDate ? format(new Date(newReport.checkOutDate + 'T12:00:00'), 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={newReport.checkOutDate ? new Date(newReport.checkOutDate + 'T12:00:00') : undefined} onSelect={(date) => date && setNewReport(prev => ({ ...prev, checkOutDate: format(date, 'yyyy-MM-dd') }))} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Property Address</Label>
                        <Input value={propertyAddress} readOnly className="bg-muted" placeholder="Auto-filled from selected property" />
                      </div>
                      <div className="space-y-2">
                        <Label>Date Damage Discovered</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newReport.dateDamageDiscovered && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newReport.dateDamageDiscovered ? format(new Date(newReport.dateDamageDiscovered + 'T12:00:00'), 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={newReport.dateDamageDiscovered ? new Date(newReport.dateDamageDiscovered + 'T12:00:00') : undefined} onSelect={(date) => date && setNewReport(prev => ({ ...prev, dateDamageDiscovered: format(date, 'yyyy-MM-dd') }))} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Who Discovered It</Label>
                        <Input placeholder="e.g. you, cleaner, etc." value={worksheet.discoveredBy} onChange={(e) => setWorksheet(w => ({ ...w, discoveredBy: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 — Damage Description */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 2</span>
                      <span className="font-semibold text-sm">— Damage Description</span>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Complete one row per damaged item/area</p>
                    <div className="space-y-2">
                      {worksheet.damageItems.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end">
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Item / Area</Label>}
                            <Input placeholder="Item/Area" value={item.item} onChange={(e) => updateDamageItem(i, 'item', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Description</Label>}
                            <Input placeholder="Description of damage" value={item.description} onChange={(e) => updateDamageItem(i, 'description', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Pre-Existing?</Label>}
                            <Select value={item.preExisting} onValueChange={(v) => updateDamageItem(i, 'preExisting', v)}>
                              <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Y">Y</SelectItem>
                                <SelectItem value="N">N</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Action</Label>}
                            <Select value={item.repairOrReplace} onValueChange={(v) => updateDamageItem(i, 'repairOrReplace', v)}>
                              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Repair">Repair</SelectItem>
                                <SelectItem value="Replace">Replace</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeDamageItem(i)} disabled={worksheet.damageItems.length <= 1} className="h-10 w-10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addDamageItem}>
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                  </div>

                  {/* SECTION 3 — Cost Documentation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 3</span>
                      <span className="font-semibold text-sm">— Cost Documentation</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {worksheet.costItems.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Item</Label>}
                            <Input placeholder="Item" value={item.item} onChange={(e) => updateCostItem(i, 'item', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Cost</Label>}
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input type="number" placeholder="0" value={item.cost || ''} onChange={(e) => updateCostItem(i, 'cost', parseFloat(e.target.value) || 0)} className="pl-7 w-[120px]" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            {i === 0 && <Label className="text-xs">Source</Label>}
                            <Input placeholder="Invoice, quote, receipt, etc." value={item.source} onChange={(e) => updateCostItem(i, 'source', e.target.value)} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeCostItem(i)} disabled={worksheet.costItems.length <= 1} className="h-10 w-10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={addCostItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Row
                      </Button>
                      <div className="text-sm font-semibold">
                        TOTAL CLAIM AMOUNT: <span className="text-primary">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4 — Evidence Checklist */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 4</span>
                      <span className="font-semibold text-sm">— Evidence Checklist</span>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      {Object.entries(evidenceLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-3">
                          <Checkbox
                            id={`evidence-${key}`}
                            checked={worksheet.evidenceChecklist[key] || false}
                            onCheckedChange={(checked) => setWorksheet(w => ({ ...w, evidenceChecklist: { ...w.evidenceChecklist, [key]: !!checked } }))}
                          />
                          <Label htmlFor={`evidence-${key}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 5 — Guest Communication Log */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 5</span>
                      <span className="font-semibold text-sm">— Guest Communication Log</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date you contacted the guest</Label>
                        <Input type="date" value={worksheet.guestContactDate} onChange={(e) => setWorksheet(w => ({ ...w, guestContactDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Method (platform messaging)</Label>
                        <Input placeholder="e.g. Airbnb messaging" value={worksheet.guestContactMethod} onChange={(e) => setWorksheet(w => ({ ...w, guestContactMethod: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Guest response</Label>
                        <Select value={worksheet.guestResponse} onValueChange={(v) => setWorksheet(w => ({ ...w, guestResponse: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select response" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agreed">Agreed</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="no_response">No Response</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of response</Label>
                        <Input type="date" value={worksheet.guestResponseDate} onChange={(e) => setWorksheet(w => ({ ...w, guestResponseDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 6 — Income Loss */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">SECTION 6</span>
                      <span className="font-semibold text-sm">— Income Loss (if applicable)</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Were future bookings canceled due to damage?</Label>
                        <Select value={worksheet.bookingsCanceled} onValueChange={(v) => setWorksheet(w => ({ ...w, bookingsCanceled: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Y">Yes</SelectItem>
                            <SelectItem value="N">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Canceled reservation dates</Label>
                        <Input placeholder="e.g. Jan 15-20, Feb 1-5" value={worksheet.canceledDates} onChange={(e) => setWorksheet(w => ({ ...w, canceledDates: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Lost income amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" placeholder="0" value={worksheet.lostIncomeAmount || ''} onChange={(e) => setWorksheet(w => ({ ...w, lostIncomeAmount: parseFloat(e.target.value) || 0 }))} className="pl-9" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Claim Status & Deadline Tracker */}
                  <div className="space-y-4">
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resolution Sought</Label>
                        <Select value={newReport.resolutionSought} onValueChange={(value) => setNewReport(prev => ({ ...prev, resolutionSought: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select resolution type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_replacement">Full Replacement</SelectItem>
                            <SelectItem value="partial_reimbursement">Partial Reimbursement</SelectItem>
                            <SelectItem value="repair_only">Repair Only</SelectItem>
                            <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Claim Status</Label>
                        <Select value={newReport.claimStatus} onValueChange={(value) => setNewReport(prev => ({ ...prev, claimStatus: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label>Claim Reference Number</Label>
                      <Input placeholder="Platform tracking/case number" value={newReport.claimReferenceNumber} onChange={(e) => setNewReport(prev => ({ ...prev, claimReferenceNumber: e.target.value }))} />
                    </div>

                    {/* Before Photos */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Before Photos ({newReport.beforePhotos.length}/3)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {newReport.beforePhotos.map((file, index) => (
                          <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                            <img src={URL.createObjectURL(file)} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                            <Button variant="destructive" size="sm" onClick={() => setNewReport(prev => ({ ...prev, beforePhotos: prev.beforePhotos.filter((_, i) => i !== index) }))} className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {newReport.beforePhotos.length < 3 && (
                          <label className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Add Before Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file && newReport.beforePhotos.length < 3) setNewReport(prev => ({ ...prev, beforePhotos: [...prev.beforePhotos, file] })); }} />
                          </label>
                        )}
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
                            <Button variant="ghost" size="sm" onClick={() => setNewReport(prev => ({ ...prev, receiptFiles: prev.receiptFiles.filter((_, i) => i !== index) }))}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload receipt or quote</span>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setNewReport(prev => ({ ...prev, receiptFiles: [...prev.receiptFiles, file] })); }} />
                        </label>
                      </div>
                    </div>

                    {newReport.checkOutDate && (
                      <ClaimDeadlineTracker checkOutDate={newReport.checkOutDate} bookingPlatform={newReport.bookingPlatform} claimStatus={newReport.claimStatus} claimDeadline={null} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <LocationManagerModal isOpen={showLocationManager} onClose={() => setShowLocationManager(false)} locations={locations} onUpdateLocations={onUpdateLocations} />
    </>
  );
};
