import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera, FileText, FileDown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useDamageReports, type DamageReport as DamageReportType } from '@/hooks/useDamageReports';
import { ClaimDeadlineTracker } from './ClaimDeadlineTracker';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { generateClaimPDF } from '@/lib/claimPdfGenerator';
import CameraCapture from './CameraCapture';

interface DamageReportDetailProps {
  report: DamageReportType;
  onBack: () => void;
  onReportChange: (report: DamageReportType) => void;
}

export const DamageReportDetail = ({ report, onBack, onReportChange }: DamageReportDetailProps) => {
  const { isOwner, roles } = useAuth();
  const { selectedProperty, propertyMode } = usePropertyContext();
  const { updateReport, uploadPhoto } = useDamageReports(
    propertyMode === 'property' ? selectedProperty?.id : undefined
  );
  const [captureMode, setCaptureMode] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Back to History
        </Button>
        {(isOwner() || roles.includes('manager')) && (
          <Button onClick={() => generateClaimPDF(report, selectedProperty ? { name: selectedProperty.name, address: selectedProperty.address, city: selectedProperty.city, state: selectedProperty.state, zip: selectedProperty.zip } : null)} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Generate Claim Report
          </Button>
        )}
      </div>

      {(isOwner() || roles.includes('manager')) && report.check_out_date && (
        <ClaimDeadlineTracker checkOutDate={report.check_out_date} bookingPlatform={report.booking_platform} claimStatus={report.claim_status} claimDeadline={report.claim_deadline} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{report.title || report.description}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{report.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>Location:</strong> {report.location}</div>
            <div><strong>Severity:</strong> {report.severity}</div>
            <div><strong>Status:</strong> {report.status}</div>
            <div><strong>Responsible Party:</strong> {report.responsible_party === 'no-fault' ? 'No Fault' : report.responsible_party.charAt(0).toUpperCase() + report.responsible_party.slice(1)}</div>
            <div><strong>Report Date:</strong> {format(new Date(report.damage_date + 'T12:00:00'), 'PPP')}</div>
            <div><strong>Est. Cost:</strong> ${(report.estimated_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          {(isOwner() || roles.includes('manager')) && report.guest_name && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Booking & Claim Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {report.guest_name && <div><strong>Guest:</strong> {report.guest_name}</div>}
                {report.reservation_id && <div><strong>Booking ID:</strong> {report.reservation_id}</div>}
                {report.booking_platform && <div><strong>Platform:</strong> {report.booking_platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>}
                {report.check_in_date && <div><strong>Check-in:</strong> {format(new Date(report.check_in_date + 'T12:00:00'), 'PPP')}</div>}
                {report.check_out_date && <div><strong>Check-out:</strong> {format(new Date(report.check_out_date + 'T12:00:00'), 'PPP')}</div>}
                {report.date_damage_discovered && <div><strong>Discovered:</strong> {format(new Date(report.date_damage_discovered + 'T12:00:00'), 'PPP')}</div>}
                {report.resolution_sought && <div><strong>Resolution:</strong> {report.resolution_sought.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>}
                {report.claim_status && <div><strong>Claim Status:</strong> <Badge variant="outline">{report.claim_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge></div>}
                {report.claim_reference_number && <div><strong>Ref #:</strong> {report.claim_reference_number}</div>}
              </div>
              {report.claim_timeline_notes && (
                <div><strong>Timeline Notes:</strong> {report.claim_timeline_notes}</div>
              )}
            </div>
          )}

          {report.notes && <div><strong>Notes:</strong> {report.notes}</div>}

          {(isOwner() || roles.includes('manager')) && ((report.before_photo_urls?.length || 0) > 0 || (report.photo_urls?.length || 0) > 0) && (
            <BeforeAfterComparison beforePhotos={report.before_photo_urls || []} afterPhotos={report.photo_urls || []} location={report.location} />
          )}

          {(isOwner() || roles.includes('manager')) && (report.receipt_urls?.length || 0) > 0 && (
            <div className="space-y-2 border-t pt-4">
              <strong>Receipts & Quotes ({report.receipt_urls!.length}):</strong>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {report.receipt_urls!.map((url, index) => (
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
              <strong>Damage Photos ({(report.photo_urls || []).length}):</strong>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCaptureMode(true)}>
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e: any) => {
                    const file = e.target?.files?.[0];
                    if (file) {
                      const url = await uploadPhoto(file, report.id);
                      if (url) {
                        const updatedUrls = [...(report.photo_urls || []), url];
                        await updateReport(report.id, { photo_urls: updatedUrls });
                        onReportChange({ ...report, photo_urls: updatedUrls });
                      }
                    }
                  };
                  input.click();
                }}>
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Upload Photo
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(report.photo_urls || []).map((url, index) => (
                <div key={index} className="aspect-[4/3] border rounded-lg overflow-hidden relative group">
                  <img src={url} alt={`Damage photo ${index + 1}`} className="w-full h-full object-cover" />
                  <Button variant="destructive" size="sm" onClick={async () => {
                    const updatedUrls = (report.photo_urls || []).filter((_, i) => i !== index);
                    await updateReport(report.id, { photo_urls: updatedUrls.length > 0 ? updatedUrls : null });
                    onReportChange({ ...report, photo_urls: updatedUrls });
                  }} className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <CameraCapture
        isOpen={captureMode}
        onCapture={async (imageSrc) => {
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          const url = await uploadPhoto(blob, report.id);
          if (url) {
            const updatedUrls = [...(report.photo_urls || []), url];
            await updateReport(report.id, { photo_urls: updatedUrls });
            onReportChange({ ...report, photo_urls: updatedUrls });
          }
          setCaptureMode(false);
        }}
        onClose={() => setCaptureMode(false)}
      />
    </div>
  );
};
