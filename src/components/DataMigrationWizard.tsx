import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const DataMigrationWizard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    // Check if there's local data to migrate
    const templates = localStorage.getItem('inspection-templates');
    const records = localStorage.getItem('inspection-records');
    const migrated = localStorage.getItem('data-migrated-to-cloud');
    
    if ((templates || records) && !migrated) {
      setHasLocalData(true);
      setOpen(true);
    }
  }, []);

  const migrateData = async () => {
    if (!profile?.id) return;
    
    setMigrating(true);
    setProgress(10);

    try {
      // Migrate templates
      const templatesStr = localStorage.getItem('inspection-templates');
      if (templatesStr) {
        const templates = JSON.parse(templatesStr);
        setProgress(20);
        
        for (const template of templates) {
          const { error } = await supabase.from('inspection_templates').insert({
            name: template.name,
            items: template.items,
            is_predefined: template.isPredefined || false,
            frequency_type: template.frequencyType,
            frequency_days: template.frequencyDays,
            notifications_enabled: template.notificationsEnabled,
            notification_method: template.notificationMethod,
            notification_days_ahead: template.notificationDaysAhead,
            next_occurrence: template.nextOccurrence,
            property_id: template.propertyIds?.[0] || template.propertyId,
            created_by: profile.id,
          });
          
          if (error) console.error('Template migration error:', error);
        }
        setProgress(50);
      }

      // Migrate records
      const recordsStr = localStorage.getItem('inspection-records');
      if (recordsStr) {
        const records = JSON.parse(recordsStr);
        setProgress(60);
        
        for (const record of records) {
          const { error } = await supabase.from('inspection_records').insert({
            inspection_date: record.date,
            next_due_date: record.nextDueDate,
            items: record.items,
            property_id: record.propertyId,
            entered_by: profile.id,
          });
          
          if (error) console.error('Record migration error:', error);
        }
        setProgress(90);
      }

      // Mark as migrated
      localStorage.setItem('data-migrated-to-cloud', 'true');
      setProgress(100);
      setComplete(true);

      toast({
        title: 'Migration complete!',
        description: 'Your data has been successfully moved to cloud storage.',
      });
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: 'Migration error',
        description: 'Some data may not have been migrated. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  const skipMigration = () => {
    localStorage.setItem('data-migrated-to-cloud', 'skipped');
    setOpen(false);
  };

  if (!hasLocalData) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upgrade to Cloud Storage
          </DialogTitle>
          <DialogDescription>
            We're moving your inspection data to secure cloud storage for multi-device access and offline sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!complete ? (
            <>
              {migrating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Migrating your data... {progress}%
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={migrateData} 
                  disabled={migrating}
                  className="flex-1"
                >
                  {migrating ? 'Migrating...' : 'Start Migration'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={skipMigration}
                  disabled={migrating}
                >
                  Skip
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-semibold">Migration Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is now stored securely in the cloud.
                </p>
              </div>
              <Button onClick={() => setOpen(false)} className="w-full">
                Continue
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
