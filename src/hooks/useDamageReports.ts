import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface DamageReport {
  id: string;
  title: string | null;
  description: string;
  location: string;
  severity: string;
  status: string;
  responsible_party: string;
  damage_date: string;
  estimated_value: number | null;
  repair_cost: number | null;
  repair_date: string | null;
  repair_completed: boolean | null;
  insurance_claim_filed: boolean | null;
  claim_number: string | null;
  work_order_issued: boolean | null;
  work_order_number: string | null;
  photo_urls: string[] | null;
  notes: string | null;
  property_id: string | null;
  property_name: string | null;
  reported_by: string;
  created_at: string;
  updated_at: string;
  // Claim fields
  guest_name: string | null;
  reservation_id: string | null;
  booking_platform: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  date_damage_discovered: string | null;
  before_photo_urls: string[] | null;
  receipt_urls: string[] | null;
  resolution_sought: string | null;
  claim_status: string | null;
  claim_reference_number: string | null;
  claim_deadline: string | null;
  claim_timeline_notes: string | null;
}

export type DamageReportInsert = {
  title?: string | null;
  description: string;
  location: string;
  severity?: string;
  status?: string;
  responsible_party?: string;
  damage_date?: string;
  estimated_value?: number | null;
  repair_cost?: number | null;
  repair_date?: string | null;
  repair_completed?: boolean | null;
  insurance_claim_filed?: boolean | null;
  claim_number?: string | null;
  work_order_issued?: boolean | null;
  work_order_number?: string | null;
  photo_urls?: string[] | null;
  notes?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  reported_by: string;
  // Claim fields
  guest_name?: string | null;
  reservation_id?: string | null;
  booking_platform?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  date_damage_discovered?: string | null;
  before_photo_urls?: string[] | null;
  receipt_urls?: string[] | null;
  resolution_sought?: string | null;
  claim_status?: string | null;
  claim_reference_number?: string | null;
  claim_deadline?: string | null;
  claim_timeline_notes?: string | null;
};

export function useDamageReports() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('damage_reports')
      .select('*')
      .order('damage_date', { ascending: false });

    if (error) {
      console.error('Error fetching damage reports:', error);
      toast({ title: 'Error loading damage reports', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setReports((data || []) as unknown as DamageReport[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = async (report: DamageReportInsert) => {
    const { error } = await supabase.from('damage_reports').insert(report as any);
    if (error) {
      console.error('Error adding damage report:', error);
      toast({ title: 'Error adding damage report', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Damage report created' });
    await fetchReports();
    return true;
  };

  const updateReport = async (id: string, updates: Partial<DamageReportInsert>) => {
    const { error } = await supabase.from('damage_reports').update(updates as any).eq('id', id);
    if (error) {
      console.error('Error updating damage report:', error);
      toast({ title: 'Error updating damage report', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Damage report updated' });
    await fetchReports();
    return true;
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('damage_reports').delete().eq('id', id);
    if (error) {
      console.error('Error deleting damage report:', error);
      toast({ title: 'Error deleting damage report', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Damage report deleted' });
    await fetchReports();
    return true;
  };

  const uploadPhoto = async (file: File | Blob, reportId: string): Promise<string | null> => {
    const ext = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const path = `${reportId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('damage-report-photos').upload(path, file);
    if (error) {
      console.error('Photo upload error:', error);
      toast({ title: 'Error uploading photo', variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('damage-report-photos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  return { reports, loading, addReport, updateReport, deleteReport, uploadPhoto, refetch: fetchReports };
}
