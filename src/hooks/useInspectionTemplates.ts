import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItem {
  id: string;
  description: string;
  notes: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  items: ChecklistItem[];
  is_predefined: boolean;
  frequency_type?: string;
  frequency_days?: number;
  notifications_enabled?: boolean;
  notification_method?: string;
  notification_days_ahead?: number;
  next_occurrence?: string;
  property_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch templates for a specific property
export const useInspectionTemplates = (propertyId?: string) => {
  return useQuery({
    queryKey: ['inspection-templates', propertyId],
    queryFn: async () => {
      let query = supabase.from('inspection_templates').select('*');
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        items: (t.items as any) || []
      })) as InspectionTemplate[];
    },
    enabled: !!propertyId,
  });
};

// Fetch all templates grouped by property
export const useAllInspectionTemplates = () => {
  return useQuery({
    queryKey: ['inspection-templates', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        items: (t.items as any) || []
      })) as InspectionTemplate[];
    },
  });
};

// Create template
export const useCreateInspectionTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Partial<InspectionTemplate>) => {
      const { items, ...rest } = template;
      const { data, error } = await supabase
        .from('inspection_templates')
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
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast({
        title: 'Template created',
        description: 'Inspection template created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    },
  });
};

// Update template
export const useUpdateInspectionTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InspectionTemplate> & { id: string }) => {
      const { items, ...rest } = updates;
      const { data, error } = await supabase
        .from('inspection_templates')
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
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast({
        title: 'Template updated',
        description: 'Inspection template updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    },
  });
};

// Delete template
export const useDeleteInspectionTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspection_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast({
        title: 'Template deleted',
        description: 'Inspection template deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });
};
