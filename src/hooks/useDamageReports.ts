import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/imageCompression';

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

  const queryKey = ['damage-reports', propertyId ?? 'all'];

  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey,
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
      return data as unknown as DamageReport;
    },
    // Optimistic update: instantly show the new report in the list
    onMutate: async (newReport) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DamageReport[]>(queryKey);

      const optimistic: DamageReport = {
        id: `temp-${Date.now()}`,
        title: newReport.title || null,
        description: newReport.description,
        location: newReport.location,
        severity: newReport.severity || 'minor',
        status: newReport.status || 'reported',
        responsible_party: newReport.responsible_party || 'guest',
        damage_date: newReport.damage_date || new Date().toISOString().split('T')[0],
        estimated_value: newReport.estimated_value || null,
        repair_cost: newReport.repair_cost || null,
        repair_date: newReport.repair_date || null,
        repair_completed: newReport.repair_completed || null,
        insurance_claim_filed: newReport.insurance_claim_filed || null,
        claim_number: newReport.claim_number || null,
        work_order_issued: newReport.work_order_issued || null,
        work_order_number: newReport.work_order_number || null,
        photo_urls: newReport.photo_urls || null,
        notes: newReport.notes || null,
        property_id: newReport.property_id || null,
        property_name: newReport.property_name || null,
        reported_by: newReport.reported_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        guest_name: newReport.guest_name || null,
        reservation_id: newReport.reservation_id || null,
        booking_platform: newReport.booking_platform || null,
        check_in_date: newReport.check_in_date || null,
        check_out_date: newReport.check_out_date || null,
        date_damage_discovered: newReport.date_damage_discovered || null,
        before_photo_urls: newReport.before_photo_urls || null,
        receipt_urls: newReport.receipt_urls || null,
        resolution_sought: newReport.resolution_sought || null,
        claim_status: newReport.claim_status || null,
        claim_reference_number: newReport.claim_reference_number || null,
        claim_deadline: newReport.claim_deadline || null,
        claim_timeline_notes: newReport.claim_timeline_notes || null,
      };

      queryClient.setQueryData<DamageReport[]>(queryKey, (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _newReport, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: 'Error adding damage report', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Damage report created' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DamageReportInsert> }) => {
      const { data, error } = await supabase.from('damage_reports').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DamageReport[]>(queryKey);

      queryClient.setQueryData<DamageReport[]>(queryKey, (old = []) =>
        old.map(r => r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } as DamageReport : r)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: 'Error updating damage report', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Damage report updated' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('damage_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DamageReport[]>(queryKey);

      queryClient.setQueryData<DamageReport[]>(queryKey, (old = []) =>
        old.filter(r => r.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: 'Error deleting damage report', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Damage report deleted' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
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
    try {
      // Compress image before upload (1200px wide, 80% quality)
      const compressed = await compressImage(file, 1200, 0.8);
      const ext = 'jpg'; // Always JPEG after compression
      const path = `${reportId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('damage-report-photos').upload(path, compressed, {
        contentType: 'image/jpeg',
      });
      if (error) {
        console.error('Photo upload error:', error);
        toast({ title: 'Error uploading photo', variant: 'destructive' });
        return null;
      }
      const { data: urlData } = supabase.storage.from('damage-report-photos').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Photo compression/upload error:', err);
      toast({ title: 'Error uploading photo', variant: 'destructive' });
      return null;
    }
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
