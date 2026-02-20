import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ItemPhotoUploadProps {
  itemId: string;
  currentImageUrl: string | null;
  amazonImageUrl: string | null;
  onPhotoUploaded: (url: string) => void;
}

export const ItemPhotoUpload = ({ itemId, currentImageUrl, amazonImageUrl, onPhotoUploaded }: ItemPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayImage = currentImageUrl || amazonImageUrl;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${itemId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('inventory-photos')
        .getPublicUrl(filePath);

      onPhotoUploaded(publicUrl);
      toast({ title: 'Photo uploaded', description: 'Item photo has been updated.' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      {displayImage && (
        <img
          src={displayImage}
          alt="Item photo"
          className="w-20 h-20 rounded-lg object-cover border"
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCameraCapture}
          disabled={uploading}
          className="gap-1 inline-btn text-xs"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          Photo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleBrowse}
          disabled={uploading}
          className="gap-1 inline-btn text-xs"
        >
          <Upload className="h-3 w-3" />
          Upload
        </Button>
      </div>
    </div>
  );
};
