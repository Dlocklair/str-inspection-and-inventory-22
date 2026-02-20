
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Settings, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmailNotificationSettingsProps {
  onEmailSettingsChange: (emails: string[]) => void;
}

export const EmailNotificationSettings = ({ onEmailSettingsChange }: EmailNotificationSettingsProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>(['']);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved email settings from Supabase on mount
  useEffect(() => {
    if (!profile?.id) return;
    
    const loadEmails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('notification_emails')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!error && data?.notification_emails) {
        const dbEmails = (data.notification_emails as string[]);
        if (dbEmails.length > 0) {
          setEmails(dbEmails);
          setSavedEmails(dbEmails);
          onEmailSettingsChange(dbEmails);
        }
      }
      setLoading(false);
    };

    loadEmails();
  }, [profile?.id]);

  // Save email settings to Supabase
  const saveEmailSettings = async () => {
    if (!profile?.id) return;

    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()));
    
    if (validEmails.length === 0) {
      toast({
        title: "No valid emails",
        description: "Please enter at least one valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Upsert notification_settings with the email list
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: profile.id,
        notification_emails: validEmails as any,
      }, { onConflict: 'user_id' });

    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setSavedEmails(validEmails);
    onEmailSettingsChange(validEmails);
    setHasChanges(false);
    setIsOpen(false);
    
    toast({
      title: "Email settings saved",
      description: `${validEmails.length} email address(es) configured for inventory notifications.`,
    });
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    setHasChanges(true);
  };

  const addEmailField = () => {
    if (emails.length < 3) {
      setEmails([...emails, '']);
      setHasChanges(true);
    }
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
      setHasChanges(true);
    }
  };

  const resetForm = () => {
    setEmails(savedEmails.length > 0 ? [...savedEmails] : ['']);
    setHasChanges(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && hasChanges) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Email Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure up to 3 email addresses to receive inventory restock notifications when items reach their restock levels.
          </p>
          
          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder={`Email address ${index + 1}`}
                    className={`text-sm ${email.trim() && !isValidEmail(email.trim()) ? 'border-destructive' : ''}`}
                  />
                  {email.trim() && !isValidEmail(email.trim()) && (
                    <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
                  )}
                </div>
                {emails.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmailField(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {emails.length < 3 && (
            <Button
              size="sm"
              variant="outline"
              onClick={addEmailField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Email Address
            </Button>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={saveEmailSettings} disabled={!hasChanges}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
