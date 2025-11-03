import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';

export const OwnerProfile = () => {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedSmsPhone, setEditedSmsPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile && user) {
      setEditedFullName(profile.full_name || '');
      setEditedEmail(user.email || '');
      setEditedSmsPhone((profile as any)?.sms_phone || '');
    }
  }, [profile, user]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setEditedSmsPhone(formatted);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (profile && user) {
      setEditedFullName(profile.full_name || '');
      setEditedEmail(user.email || '');
      setEditedSmsPhone((profile as any)?.sms_phone || '');
    }
  };

  const handleSaveProfile = async () => {
    if (!editedFullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get raw phone number (digits only)
      const rawPhone = editedSmsPhone.replace(/\D/g, '');

      // Update profile name and SMS phone
      if (editedFullName !== profile?.full_name || rawPhone !== (profile as any)?.sms_phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: editedFullName.trim(),
            sms_phone: rawPhone || null
          })
          .eq('user_id', user?.id);

        if (profileError) throw profileError;
      }

      // Update email if changed
      if (editedEmail !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail.trim()
        });

        if (emailError) throw emailError;

        toast({
          title: "Verification email sent",
          description: "Please check your new email address to confirm the change.",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }

      await refreshProfile();
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Owner Profile
          </CardTitle>
          {!isEditingProfile && (
            <Button onClick={handleEditProfile} variant="outline" size="sm">
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && user && (
          <div className="space-y-4">
            {isEditingProfile ? (
              <>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={editedFullName}
                      onChange={(e) => setEditedFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Changing your email will require verification
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="smsPhone">Phone Number (for SMS)</Label>
                    <Input
                      id="smsPhone"
                      type="tel"
                      value={editedSmsPhone}
                      onChange={handlePhoneChange}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This number will be used for text message notifications
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    onClick={handleCancelEdit} 
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  <p className="font-medium text-lg">{profile.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Phone Number (for SMS)</Label>
                  <p className="font-medium">
                    {(profile as any).sms_phone ? formatPhoneNumber((profile as any).sms_phone) : 'Not set'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This number will be used for text message notifications
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};