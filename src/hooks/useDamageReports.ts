import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useDamageReports(propertyId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: ['damage-reports', propertyId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('damage_reports')
        .select('*')
        .order('damage_date', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as DamageReport[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (report: DamageReportInsert) => {
      const { data, error } = await supabase.from('damage_reports').insert(report as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      toast({ title: 'Damage report created' });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding damage report', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DamageReportInsert> }) => {
      const { data, error } = await supabase.from('damage_reports').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      toast({ title: 'Damage report updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating damage report', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('damage_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      toast({ title: 'Damage report deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting damage report', variant: 'destructive' });
    },
  });

  const addReport = async (report: DamageReportInsert): Promise<boolean> => {
    try {
      await addMutation.mutateAsync(report);
      return true;
    } catch {
      return false;
    }
  };

  const updateReport = async (id: string, updates: Partial<DamageReportInsert>): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
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

  return {
    reports,
    loading,
    addReport,
    updateReport,
    deleteReport,
    uploadPhoto,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['damage-reports'] }),
  };
}
