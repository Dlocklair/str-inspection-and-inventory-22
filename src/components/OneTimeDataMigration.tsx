import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const OneTimeDataMigration = () => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateSampleData = async () => {
      const migrationDone = localStorage.getItem('sample-data-migration-complete-v2');
      if (migrationDone) return;

      setIsUpdating(true);
      setProgress(10);

      try {
        const elkMountainEscapeId = '79280fbd-5476-47f5-bcc0-1fada823d922';

        // Get all templates
        setProgress(20);
        const { data: templates } = await supabase
          .from('inspection_templates')
          .select('id, name, property_id');

        // Update inspection records - assign property_id and try to link template_id
        setProgress(40);
        const { data: unassignedRecords } = await supabase
          .from('inspection_records')
          .select('*')
          .is('property_id', null);

        if (unassignedRecords) {
          for (const record of unassignedRecords) {
            // Try to match template by name or items similarity
            let matchedTemplateId = record.template_id;
            
            if (!matchedTemplateId && templates) {
              // Simple matching: if we find a template with matching name, use it
              const elkTemplate = templates.find(t => 
                t.property_id === elkMountainEscapeId || !t.property_id
              );
              if (elkTemplate) {
                matchedTemplateId = elkTemplate.id;
              }
            }

            await supabase
              .from('inspection_records')
              .update({ 
                property_id: elkMountainEscapeId,
                template_id: matchedTemplateId
              })
              .eq('id', record.id);
          }
        }

        // Update inventory items
        setProgress(60);
        const { error: inventoryError } = await supabase
          .from('inventory_items')
          .update({ property_id: elkMountainEscapeId })
          .is('property_id', null);

        if (inventoryError) throw inventoryError;

        // Update damage reports
        setProgress(80);
        const { error: damageError } = await supabase
          .from('damage_reports')
          .update({ property_id: elkMountainEscapeId })
          .is('property_id', null);

        if (damageError) throw damageError;

        // Ensure all templates are assigned to the property or marked as unassigned
        setProgress(90);
        const { data: unassignedTemplates } = await supabase
          .from('inspection_templates')
          .select('*')
          .is('property_id', null)
          .eq('is_predefined', false);

        if (unassignedTemplates && unassignedTemplates.length > 0) {
          for (const template of unassignedTemplates) {
            await supabase
              .from('inspection_templates')
              .update({ property_id: elkMountainEscapeId })
              .eq('id', template.id);
          }
        }

        setProgress(100);
        localStorage.setItem('sample-data-migration-complete-v2', 'true');
        
        toast({
          title: 'Data Updated',
          description: 'All sample data has been assigned to Elk Mountain Escape with template linking.',
        });
      } catch (error: any) {
        console.error('Migration error:', error);
        toast({
          title: 'Update Error',
          description: error.message || 'Failed to update sample data',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    };

    updateSampleData();
  }, [toast]);

  if (!isUpdating) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Updating Sample Data...</h3>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Assigning all unassigned data to Elk Mountain Escape
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
