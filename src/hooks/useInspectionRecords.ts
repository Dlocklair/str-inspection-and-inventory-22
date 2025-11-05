import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InspectionItem {
  id: string;
  description: string;
  completed: boolean;
  notes: string;
}

export interface InspectionRecord {
  id: string;
  template_id?: string;
  property_id?: string;
  inspection_date: string;
  next_due_date?: string;
  items: InspectionItem[];
  performed_by?: string;
  entered_by: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch records for a property
export const useInspectionRecords = (propertyId?: string) => {
  return useQuery({
    queryKey: ['inspection-records', propertyId],
    queryFn: async () => {
      let query = supabase.from('inspection_records').select('*');
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query.order('inspection_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        items: (r.items as any) || []
      })) as InspectionRecord[];
    },
  });
};

// Create record
export const useCreateInspectionRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (record: Partial<InspectionRecord>) => {
      const { items, ...rest } = record;
      const { data, error } = await supabase
        .from('inspection_records')
        .insert({
          ...rest,
          items: items as any
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast({
        title: 'Inspection saved',
        description: 'Inspection record created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save inspection',
        variant: 'destructive',
      });
    },
  });
};

// Update record
export const useUpdateInspectionRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InspectionRecord> & { id: string }) => {
      const { items, ...rest } = updates;
      const { data, error } = await supabase
        .from('inspection_records')
        .update({
          ...rest,
          items: items as any
        } as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast({
        title: 'Inspection updated',
        description: 'Inspection record updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update inspection',
        variant: 'destructive',
      });
    },
  });
};

// Delete record
export const useDeleteInspectionRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspection_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast({
        title: 'Inspection deleted',
        description: 'Inspection record deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete inspection',
        variant: 'destructive',
      });
    },
  });
};
