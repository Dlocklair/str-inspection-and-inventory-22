import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAuth } from '@/hooks/useAuth';
import { useWarranties, calcExpirationDate, type WarrantyInsert } from '@/hooks/useWarranties';
import { type AssetInsert } from '@/hooks/useAssets';
import { Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CATEGORY_OPTIONS = [
  'Material', 'Finish', 'Equipment', 'Fixture', 'Appliance', 'Furniture', 'Flooring', 'Hardware', 'Plumbing', 'Electrical', 'Other'
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const DURATION_OPTIONS = [
  { value: '90_days', label: '90 Days' },
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: '3_years', label: '3 Years' },
  { value: '5_years', label: '5 Years' },
  { value: '10_years', label: '10 Years' },
  { value: 'custom', label: 'Custom' },
];

interface AssetLibraryFormProps {
  onSubmit: (asset: AssetInsert, warranty?: WarrantyInsert) => Promise<boolean>;
  onCancel?: () => void;
}

export function AssetLibraryForm({ onSubmit, onCancel }: AssetLibraryFormProps) {
  const { profile } = useAuth();
  const { userProperties, isLoading: propertiesLoading } = usePropertyContext();

  // Asset fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Equipment');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [colorFinish, setColorFinish] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [locationInProperty, setLocationInProperty] = useState('');
  const [condition, setCondition] = useState('new');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Warranty fields
  const [includeWarranty, setIncludeWarranty] = useState(false);
  const [warrantyVendor, setWarrantyVendor] = useState('');
  const [warrantyVendorContact, setWarrantyVendorContact] = useState('');
  const [warrantyManufacturer, setWarrantyManufacturer] = useState('');
  const [warrantyManufacturerContact, setWarrantyManufacturerContact] = useState('');
  const [warrantyPurchasedFrom, setWarrantyPurchasedFrom] = useState('');
  const [warrantyDurationType, setWarrantyDurationType] = useState('1_year');
  const [warrantyCustomDays, setWarrantyCustomDays] = useState('');
  const [warrantyNotes, setWarrantyNotes] = useState('');

  const warrantyExpirationDate = purchaseDate
    ? calcExpirationDate(purchaseDate, warrantyDurationType, warrantyCustomDays ? parseInt(warrantyCustomDays) : null)
    : '';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, 3 - photos.length)) {
      const path = `assets/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('warranty-attachments').upload(path, file);
      if (error) {
        toast({ title: `Error uploading ${file.name}`, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from('warranty-attachments').getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    setPhotos(prev => [...prev, ...newUrls].slice(0, 3));
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !name.trim()) return;

    setSubmitting(true);

    const asset: AssetInsert = {
      name: name.trim(),
      category,
      brand: brand.trim() || null,
      model_number: modelNumber.trim() || null,
      color_finish: colorFinish.trim() || null,
      dimensions: dimensions.trim() || null,
      material_type: materialType.trim() || null,
      supplier: supplier.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      purchase_date: purchaseDate || null,
      property_id: propertyId,
      location_in_property: locationInProperty.trim() || null,
      condition,
      serial_number: serialNumber.trim() || null,
      description: description.trim() || null,
      photo_urls: photos.length > 0 ? photos : null,
      warranty_id: null,
      created_by: profile.id,
    };

    let warranty: WarrantyInsert | undefined;
    if (includeWarranty && purchaseDate) {
      warranty = {
        product_name: name.trim(),
        description: description.trim() || null,
        vendor: warrantyVendor.trim() || null,
        manufacturer: warrantyManufacturer.trim() || null,
        manufacturer_contact: warrantyManufacturerContact.trim() || null,
        vendor_contact: warrantyVendorContact.trim() || null,
        purchased_from: warrantyPurchasedFrom.trim() || null,
        cost: cost ? parseFloat(cost) : null,
        purchase_date: purchaseDate,
        warranty_duration_type: warrantyDurationType,
        warranty_duration_custom_days: warrantyDurationType === 'custom' ? parseInt(warrantyCustomDays) || null : null,
        warranty_expiration_date: warrantyExpirationDate,
        attachment_urls: null,
        notes: warrantyNotes.trim() || null,
        property_id: propertyId,
        parent_warranty_id: null,
        created_by: profile.id,
      };
    }

    const success = await onSubmit(asset, warranty);
    if (success) {
      // Reset form
      setName(''); setCategory('Equipment'); setBrand(''); setModelNumber('');
      setColorFinish(''); setDimensions(''); setMaterialType(''); setSupplier('');
      setCost(''); setPurchaseDate(''); setPropertyId(null); setLocationInProperty('');
      setCondition('new'); setSerialNumber(''); setDescription(''); setPhotos([]);
      setIncludeWarranty(false); setWarrantyVendor(''); setWarrantyVendorContact('');
      setWarrantyManufacturer(''); setWarrantyManufacturerContact('');
      setWarrantyPurchasedFrom(''); setWarrantyDurationType('1_year');
      setWarrantyCustomDays(''); setWarrantyNotes('');
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add New Asset</CardTitle>
        <CardDescription>Material, Finish, & Equipment Register</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Product / Item Name *</Label>
              <Input id="assetName" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. LVP Flooring - Oak" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand / Manufacturer</Label>
              <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Samsung" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelNumber">Model Number</Label>
              <Input id="modelNumber" value={modelNumber} onChange={e => setModelNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorFinish">Color / Finish</Label>
              <Input id="colorFinish" value={colorFinish} onChange={e => setColorFinish(e.target.value)} placeholder="e.g. Matte Black" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions / Size</Label>
              <Input id="dimensions" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder='e.g. 48" x 7"' />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialType">Material Type</Label>
              <Input id="materialType" value={materialType} onChange={e => setMaterialType(e.target.value)} placeholder="e.g. Vinyl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetSupplier">Supplier / Vendor</Label>
              <Input id="assetSupplier" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Home Depot" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetCost">Cost ($)</Label>
              <Input id="assetCost" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetPurchaseDate">Purchase Date</Label>
              <Input id="assetPurchaseDate" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId || '__none__'} onValueChange={v => setPropertyId(v === '__none__' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No property</SelectItem>
                  {userProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationInProperty">Location in Property</Label>
              <Input id="locationInProperty" value={locationInProperty} onChange={e => setLocationInProperty(e.target.value)} placeholder="e.g. Master Bathroom" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetDescription">Description / Notes</Label>
            <Textarea id="assetDescription" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos ({photos.length}/3)</Label>
            <div className="flex items-center gap-2">
              {photos.length < 3 && (
                <label className="cursor-pointer">
                  <Input type="file" multiple className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span><Upload className="h-4 w-4 mr-1" />{uploading ? 'Uploading...' : 'Upload Photos'}</span>
                  </Button>
                </label>
              )}
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover rounded border" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warranty Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="includeWarranty" checked={includeWarranty} onCheckedChange={(checked) => setIncludeWarranty(checked === true)} />
            <Label htmlFor="includeWarranty" className="cursor-pointer font-medium">Include Warranty Information</Label>
          </div>

          {/* Warranty Section */}
          <Collapsible open={includeWarranty}>
            <CollapsibleContent>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Warranty Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Warranty Duration *</Label>
                      <Select value={warrantyDurationType} onValueChange={setWarrantyDurationType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {warrantyDurationType === 'custom' && (
                      <div className="space-y-2">
                        <Label>Custom Duration (days)</Label>
                        <Input type="number" min="1" value={warrantyCustomDays} onChange={e => setWarrantyCustomDays(e.target.value)} required />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Warranty Expiration</Label>
                      <Input value={warrantyExpirationDate} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input value={warrantyVendor} onChange={e => setWarrantyVendor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor Contact</Label>
                      <Input value={warrantyVendorContact} onChange={e => setWarrantyVendorContact(e.target.value)} placeholder="Phone or email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input value={warrantyManufacturer} onChange={e => setWarrantyManufacturer(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manufacturer Contact</Label>
                      <Input value={warrantyManufacturerContact} onChange={e => setWarrantyManufacturerContact(e.target.value)} placeholder="Phone or email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchased From</Label>
                      <Input value={warrantyPurchasedFrom} onChange={e => setWarrantyPurchasedFrom(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Warranty Notes</Label>
                    <Textarea value={warrantyNotes} onChange={e => setWarrantyNotes(e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !name.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {submitting ? 'Saving...' : 'Add Asset'}
            </Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
