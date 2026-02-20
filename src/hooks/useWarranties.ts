import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Warranty {
  id: string;
  property_id: string | null;
  parent_warranty_id: string | null;
  product_name: string;
  description: string | null;
  vendor: string | null;
  manufacturer: string | null;
  manufacturer_contact: string | null;
  vendor_contact: string | null;
  purchased_from: string | null;
  cost: number | null;
  purchase_date: string;
  warranty_duration_type: string;
  warranty_duration_custom_days: number | null;
  warranty_expiration_date: string;
  attachment_urls: string[] | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  property_name?: string;
  sub_warranties?: Warranty[];
}

export type WarrantyInsert = Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'property_name' | 'sub_warranties'>;

const DURATION_DAYS: Record<string, number> = {
  '90_days': 90,
  '1_year': 365,
  '2_years': 730,
  '3_years': 1095,
  '5_years': 1825,
  '10_years': 3650,
};

export function calcExpirationDate(purchaseDate: string, durationType: string, customDays?: number | null): string {
  if (!purchaseDate) return '';
  const days = durationType === 'custom' ? (customDays || 0) : (DURATION_DAYS[durationType] || 365);
  const d = new Date(purchaseDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function useWarranties() {
  const { profile } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warranties')
      .select('*, properties(name)')
      .order('warranty_expiration_date', { ascending: true });

    if (error) {
      console.error('Error fetching warranties:', error);
      toast({ title: 'Error loading warranties', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Map property name and organize parent/sub warranties
    const all = (data || []).map((w: any) => ({
      ...w,
      property_name: w.properties?.name || null,
      properties: undefined,
    })) as Warranty[];

    // Group sub-warranties under parents
    const parentMap = new Map<string, Warranty>();
    const subWarranties: Warranty[] = [];

    all.forEach(w => {
      if (!w.parent_warranty_id) {
        parentMap.set(w.id, { ...w, sub_warranties: [] });
      } else {
        subWarranties.push(w);
      }
    });

    subWarranties.forEach(sw => {
      const parent = parentMap.get(sw.parent_warranty_id!);
      if (parent) {
        parent.sub_warranties!.push(sw);
      }
    });

    setWarranties(Array.from(parentMap.values()));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const addWarranty = async (warranty: WarrantyInsert) => {
    const { error } = await supabase.from('warranties').insert(warranty as any);
    if (error) {
      console.error('Error adding warranty:', error);
      toast({ title: 'Error adding warranty', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Warranty added successfully' });
    await fetchWarranties();
    return true;
  };

  const updateWarranty = async (id: string, updates: Partial<WarrantyInsert>) => {
    const { error } = await supabase.from('warranties').update(updates as any).eq('id', id);
    if (error) {
      console.error('Error updating warranty:', error);
      toast({ title: 'Error updating warranty', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Warranty updated successfully' });
    await fetchWarranties();
    return true;
  };

  const deleteWarranty = async (id: string) => {
    const { error } = await supabase.from('warranties').delete().eq('id', id);
    if (error) {
      console.error('Error deleting warranty:', error);
      toast({ title: 'Error deleting warranty', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Warranty deleted' });
    await fetchWarranties();
    return true;
  };

  const uploadAttachment = async (file: File, warrantyId: string): Promise<string | null> => {
    const path = `${warrantyId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('warranty-attachments').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error uploading file', variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('warranty-attachments').getPublicUrl(path);
    return urlData.publicUrl;
  };

  return { warranties, loading, addWarranty, updateWarranty, deleteWarranty, uploadAttachment, refetch: fetchWarranties };
}
