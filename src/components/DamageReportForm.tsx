import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, Camera, FileText, CalendarIcon, DollarSign, MapPin, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationManagerModal } from './LocationManagerModal';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useDamageReports } from '@/hooks/useDamageReports';
import { ClaimDeadlineTracker } from './ClaimDeadlineTracker';

interface DamageReportFormProps {
  onClose: () => void;
  locations: string[];
  onUpdateLocations: (locations: string[]) => void;
}

export const DamageReportForm = ({ onClose, locations, onUpdateLocations }: DamageReportFormProps) => {
  const { toast } = useToast();
  const { profile, isOwner, roles } = useAuth();
  const { selectedProperty, propertyMode } = usePropertyContext();
  const { addReport, uploadPhoto } = useDamageReports(
    propertyMode === 'property' ? selectedProperty?.id : undefined
  );

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

  const handleLocationSelect = (value: string) => {
    if (value === 'manage-locations') {
      setShowLocationManager(true);
    } else {
      setNewReport(prev => ({ ...prev, location: value }));
    }
  };

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

    const tempId = crypto.randomUUID();
    const photoUrls: string[] = [];
    for (const file of newReport.photos) {
      const url = await uploadPhoto(file, tempId);
      if (url) photoUrls.push(url);
    }

    let claimDeadline: string | null = null;
    if (newReport.checkOutDate && newReport.bookingPlatform) {
      const deadlineDays = newReport.bookingPlatform === 'airbnb' ? 14 : newReport.bookingPlatform === 'vrbo' ? 60 : 30;
      claimDeadline = format(addDays(new Date(newReport.checkOutDate + 'T12:00:00'), deadlineDays), 'yyyy-MM-dd');
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
      claim_timeline_notes: newReport.claimTimelineNotes.trim() || null,
    });

    if (success) {
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create Damage Report</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addNewReport} size="sm" disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Report'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Damage Title</label>
                <Input
                  placeholder="Damage title"
                  value={newReport.title}
                  onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Location</label>
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
                <label className="text-sm font-medium text-primary">Report Date</label>
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
                <label className="text-sm font-medium text-primary">Severity</label>
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
                <label className="text-sm font-medium text-primary">Responsible Party</label>
                <Select
                  value={newReport.responsibleParty}
                  onValueChange={(value: any) => setNewReport(prev => ({ ...prev, responsibleParty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Responsible party" />
                  </SelectTrigger>
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
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newReport.estimatedCost || ''}
                    onChange={(e) => setNewReport(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Description</label>
              <Textarea
                placeholder="Describe the damage in detail"
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Notes</label>
              <Textarea
                placeholder="Additional notes"
                value={newReport.notes}
                onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Damage Photos</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {newReport.photos.map((file, index) => (
                  <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                    <img src={URL.createObjectURL(file)} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setNewReport(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setNewReport(prev => ({ ...prev, photos: [...prev.photos, file] }));
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Claim Section */}
            {(isOwner() || roles.includes('manager')) && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Booking & Claim Details (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Guest Name</label>
                    <Input placeholder="Guest full name" value={newReport.guestName} onChange={(e) => setNewReport(prev => ({ ...prev, guestName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Booking/Reservation ID</label>
                    <Input placeholder="Booking ID" value={newReport.reservationId} onChange={(e) => setNewReport(prev => ({ ...prev, reservationId: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Booking Platform</label>
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
                    <label className="text-sm font-medium">Date Damage Discovered</label>
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
                    <label className="text-sm font-medium">Check-in Date</label>
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
                    <label className="text-sm font-medium">Check-out Date</label>
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
                    <label className="text-sm font-medium">Resolution Sought</label>
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
                    <label className="text-sm font-medium">Claim Status</label>
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
                  <label className="text-sm font-medium">Claim Reference Number</label>
                  <Input placeholder="Platform tracking/case number" value={newReport.claimReferenceNumber} onChange={(e) => setNewReport(prev => ({ ...prev, claimReferenceNumber: e.target.value }))} />
                </div>

                {/* Before Photos */}
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Before Photos (from last inspection/turnover)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {newReport.beforePhotos.map((file, index) => (
                      <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                        <img src={URL.createObjectURL(file)} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                        <Button variant="destructive" size="sm" onClick={() => setNewReport(prev => ({ ...prev, beforePhotos: prev.beforePhotos.filter((_, i) => i !== index) }))} className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="aspect-[4/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add Before Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setNewReport(prev => ({ ...prev, beforePhotos: [...prev.beforePhotos, file] })); }} />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeline Notes</label>
                  <Textarea placeholder="Key dates and actions taken (Airbnb requires filing within 14 days of checkout)" value={newReport.claimTimelineNotes} onChange={(e) => setNewReport(prev => ({ ...prev, claimTimelineNotes: e.target.value }))} rows={2} />
                </div>

                {newReport.checkOutDate && (
                  <ClaimDeadlineTracker checkOutDate={newReport.checkOutDate} bookingPlatform={newReport.bookingPlatform} claimStatus={newReport.claimStatus} claimDeadline={null} />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LocationManagerModal isOpen={showLocationManager} onClose={() => setShowLocationManager(false)} locations={locations} onUpdateLocations={onUpdateLocations} />
    </>
  );
};
