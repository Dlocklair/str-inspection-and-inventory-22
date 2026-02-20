import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InspectionAssignment {
  id: string;
  template_id: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
}

export const useInspectionAssignments = (templateId?: string) => {
  return useQuery({
    queryKey: ['inspection-assignments', templateId],
    queryFn: async () => {
      let query = supabase.from('inspection_assignments' as any).select('*');
      if (templateId) {
        query = query.eq('template_id', templateId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InspectionAssignment[];
    },
    enabled: !!templateId,
  });
};

export const useMyAssignments = () => {
  return useQuery({
    queryKey: ['my-inspection-assignments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!profile) return [];

      const { data, error } = await supabase
        .from('inspection_assignments' as any)
        .select('*')
        .eq('assigned_to', profile.id);
      if (error) throw error;
      return (data || []) as unknown as InspectionAssignment[];
    },
  });
};

export const useAllAssignments = () => {
  return useQuery({
    queryKey: ['inspection-assignments', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_assignments' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as InspectionAssignment[];
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignment: { template_id: string; assigned_to: string; assigned_by: string }) => {
      const { data, error } = await supabase
        .from('inspection_assignments' as any)
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-inspection-assignments'] });
      toast({ title: 'Assignment created', description: 'Inspection assigned successfully.' });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast({ title: 'Already assigned', description: 'This template is already assigned to this user.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to create assignment', variant: 'destructive' });
      }
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspection_assignments' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-inspection-assignments'] });
      toast({ title: 'Assignment removed', description: 'Inspection assignment removed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to remove assignment', variant: 'destructive' });
    },
  });
};
