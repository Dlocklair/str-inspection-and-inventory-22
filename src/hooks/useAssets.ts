import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Asset {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model_number: string | null;
  color_finish: string | null;
  dimensions: string | null;
  material_type: string | null;
  supplier: string | null;
  cost: number | null;
  purchase_date: string | null;
  property_id: string | null;
  location_in_property: string | null;
  condition: string | null;
  serial_number: string | null;
  description: string | null;
  photo_urls: string[] | null;
  warranty_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  property_name?: string;
}

export type AssetInsert = Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'property_name'>;

export function useAssets() {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*, properties(name)')
      .order('name');

    if (error) {
      console.error('Error fetching assets:', error);
      toast({ title: 'Error loading assets', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((a: any) => ({
      ...a,
      property_name: a.properties?.name || null,
      properties: undefined,
    })) as Asset[];

    setAssets(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = async (asset: AssetInsert) => {
    const { error } = await supabase.from('assets').insert(asset as any);
    if (error) {
      console.error('Error adding asset:', error);
      toast({ title: 'Error adding asset', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Asset added successfully' });
    await fetchAssets();
    return true;
  };

  const updateAsset = async (id: string, updates: Partial<AssetInsert>) => {
    const { error } = await supabase.from('assets').update(updates as any).eq('id', id);
    if (error) {
      console.error('Error updating asset:', error);
      toast({ title: 'Error updating asset', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Asset updated successfully' });
    await fetchAssets();
    return true;
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
      console.error('Error deleting asset:', error);
      toast({ title: 'Error deleting asset', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Asset deleted' });
    await fetchAssets();
    return true;
  };

  return { assets, loading, addAsset, updateAsset, deleteAsset, refetch: fetchAssets };
}
