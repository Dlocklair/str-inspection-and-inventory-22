import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calcExpirationDate, type WarrantyInsert } from '@/hooks/useWarranties';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DURATION_OPTIONS = [
  { value: '90_days', label: '90 Days' },
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: '3_years', label: '3 Years' },
  { value: '5_years', label: '5 Years' },
  { value: '10_years', label: '10 Years' },
  { value: 'custom', label: 'Custom' },
];

function PropertySelectInline({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { userProperties, isLoading } = usePropertyContext();
  if (isLoading) return <Input disabled placeholder="Loading properties..." />;
  return (
    <Select value={value || '__none__'} onValueChange={v => onChange(v === '__none__' ? null : v)}>
      <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">No property</SelectItem>
        {userProperties.map(p => (
          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface WarrantyFormProps {
  onSubmit: (warranty: WarrantyInsert) => Promise<boolean>;
  parentWarrantyId?: string | null;
  parentProductName?: string;
  onCancel?: () => void;
  initialPropertyId?: string | null;
}

export function WarrantyForm({ onSubmit, parentWarrantyId, parentProductName, onCancel, initialPropertyId }: WarrantyFormProps) {
  const { profile } = useAuth();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [manufacturerContact, setManufacturerContact] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationType, setDurationType] = useState('1_year');
  const [customDays, setCustomDays] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(initialPropertyId || null);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const expirationDate = calcExpirationDate(purchaseDate, durationType, customDays ? parseInt(customDays) : null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `temp/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('warranty-attachments').upload(path, file);
      if (error) {
        toast({ title: `Error uploading ${file.name}`, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from('warranty-attachments').getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    setAttachments(prev => [...prev, ...newUrls]);
    setUploading(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !productName.trim() || !purchaseDate) return;

    setSubmitting(true);
    const warranty: WarrantyInsert = {
      product_name: productName.trim(),
      description: description.trim() || null,
      vendor: vendor.trim() || null,
      manufacturer: manufacturer.trim() || null,
      manufacturer_contact: manufacturerContact.trim() || null,
      vendor_contact: vendorContact.trim() || null,
      purchased_from: purchasedFrom.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      purchase_date: purchaseDate,
      warranty_duration_type: durationType,
      warranty_duration_custom_days: durationType === 'custom' ? parseInt(customDays) || null : null,
      warranty_expiration_date: expirationDate,
      attachment_urls: attachments.length > 0 ? attachments : null,
      notes: notes.trim() || null,
      property_id: propertyId,
      parent_warranty_id: parentWarrantyId || null,
      created_by: profile.id,
    };

    const success = await onSubmit(warranty);
    if (success) {
      setProductName('');
      setDescription('');
      setVendor('');
      setManufacturer('');
      setManufacturerContact('');
      setVendorContact('');
      setPurchasedFrom('');
      setCost('');
      setDurationType('1_year');
      setCustomDays('');
      setNotes('');
      setAttachments([]);
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {parentWarrantyId ? `Add Sub-Warranty for ${parentProductName}` : 'Add New Warranty'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input id="productName" value={productName} onChange={e => setProductName(e.target.value)} required maxLength={200} placeholder="e.g. HVAC Unit" />
            </div>
            {!parentWarrantyId && (
              <div className="space-y-2">
                <Label>Property</Label>
                <PropertySelectInline value={propertyId} onChange={setPropertyId} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="purchasedFrom">Purchased From</Label>
              <Input id="purchasedFrom" value={purchasedFrom} onChange={e => setPurchasedFrom(e.target.value)} maxLength={200} placeholder="Store or retailer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input id="vendor" value={vendor} onChange={e => setVendor(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorContact">Vendor Contact</Label>
              <Input id="vendorContact" value={vendorContact} onChange={e => setVendorContact(e.target.value)} maxLength={100} placeholder="Phone or email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" value={manufacturer} onChange={e => setManufacturer(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturerContact">Manufacturer Contact</Label>
              <Input id="manufacturerContact" value={manufacturerContact} onChange={e => setManufacturerContact(e.target.value)} maxLength={100} placeholder="Phone or email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input id="cost" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Warranty Duration *</Label>
              <Select value={durationType} onValueChange={setDurationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {durationType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customDays">Custom Duration (days)</Label>
                <Input id="customDays" type="number" min="1" value={customDays} onChange={e => setCustomDays(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Warranty Expiration</Label>
              <Input value={expirationDate} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Attachments (receipts, registrations)</Label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span><Upload className="h-4 w-4 mr-1" />{uploading ? 'Uploading...' : 'Upload Files'}</span>
                </Button>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[150px]">
                      Attachment {i + 1}
                    </a>
                    <button type="button" onClick={() => removeAttachment(i)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !productName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {submitting ? 'Saving...' : parentWarrantyId ? 'Add Sub-Warranty' : 'Add Warranty'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
