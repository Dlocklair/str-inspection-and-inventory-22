import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface DashboardStats {
  openDamageReports: number;
  upcomingInspections: number;
  lowStockItems: number;
  expiringWarranties: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const in7Days = addDays(now, 7).toISOString().split('T')[0];
      const in30Days = addDays(now, 30).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [damageRes, inspectionTemplatesRes, inspectionRecordsRes, inventoryRes, warrantiesRes] = await Promise.all([
        // Open damage reports (status != 'completed' and status != 'resolved')
        supabase
          .from('damage_reports')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("completed","resolved")'),

        // Inspection templates with next_occurrence in next 7 days
        supabase
          .from('inspection_templates')
          .select('id', { count: 'exact', head: true })
          .lte('next_occurrence', in7Days)
          .gte('next_occurrence', today),

        // Inspection records with next_due_date in next 7 days
        supabase
          .from('inspection_records')
          .select('id', { count: 'exact', head: true })
          .lte('next_due_date', in7Days)
          .gte('next_due_date', today),

        // Low stock items (current_quantity <= restock_threshold)
        supabase
          .from('inventory_items')
          .select('id, current_quantity, restock_threshold'),

        // Warranties expiring in next 30 days
        supabase
          .from('warranties')
          .select('id', { count: 'exact', head: true })
          .lte('warranty_expiration_date', in30Days)
          .gte('warranty_expiration_date', today),
      ]);

      // Count low stock items client-side since we need column comparison
      const lowStockCount = (inventoryRes.data || []).filter(
        item => (item.current_quantity ?? 0) <= (item.restock_threshold ?? 0)
      ).length;

      const upcomingInspections = (inspectionTemplatesRes.count ?? 0) + (inspectionRecordsRes.count ?? 0);

      return {
        openDamageReports: damageRes.count ?? 0,
        upcomingInspections,
        lowStockItems: lowStockCount,
        expiringWarranties: warrantiesRes.count ?? 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
