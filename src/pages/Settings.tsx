import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, LogOut, Shield, UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RoleManagement } from '@/components/RoleManagement';

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, signOut, loading, isOwner, roles, rolesLoaded, refreshProfile } = useAuth();
  
  const [agents, setAgents] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    fullName: '',
    phone: '',
    permissions: {
      inspections: false,
      inventory: false,
      damage: false
    }
  });

  // Fetch agents and permissions on mount
  useEffect(() => {
    if (user && isOwner()) {
      fetchAgentsAndPermissions();
    }
  }, [user, isOwner]);

  const fetchAgentsAndPermissions = async () => {
    try {
      // Fetch agent permissions for this owner
      const { data: agentPerms, error: permsError } = await supabase
        .from('agent_permissions')
        .select(`
          *,
          agent:profiles!agent_permissions_agent_id_fkey(*)
        `)
        .eq('owner_id', profile?.id);

      if (permsError) throw permsError;

      setAgents(agentPerms || []);
      setPermissions(agentPerms || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents and permissions.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const sendInvitation = async () => {
    if (!newInvitation.email.trim() || !newInvitation.fullName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and email.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('invitations')
        .insert({
          owner_id: profile?.id,
          email: newInvitation.email.trim(),
          full_name: newInvitation.fullName.trim(),
          phone: newInvitation.phone.trim() || null,
          permissions: newInvitation.permissions
        });

      if (error) throw error;

      setNewInvitation({
        email: '',
        fullName: '',
        phone: '',
        permissions: {
          inspections: false,
          inventory: false,
          damage: false
        }
      });

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${newInvitation.fullName}.`,
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive"
      });
    }
  };

  const updateAgentPermissions = async (agentId: string, newPermissions: any) => {
    try {
      const { error } = await supabase
        .from('agent_permissions')
        .update({
          inspections: newPermissions.inspections,
          inventory: newPermissions.inventory,
          damage: newPermissions.damage
        })
        .eq('agent_id', agentId)
        .eq('owner_id', profile?.id);

      if (error) throw error;

      await fetchAgentsAndPermissions();

      toast({
        title: "Permissions updated",
        description: "Agent permissions have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions.",
        variant: "destructive"
      });
    }
  };

  const handleEditProfile = () => {
    setEditedFullName(profile?.full_name || '');
    setEditedEmail(user?.email || '');
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedFullName('');
    setEditedEmail('');
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
      // Update profile name
      if (editedFullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: editedFullName.trim() })
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

  if (loading || !rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading user...' : 'Loading permissions...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your profile and system permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={handleSignOut} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="permissions">Agent Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Profile
                  </CardTitle>
                  {!isEditingProfile && (
                    <Button onClick={handleEditProfile} variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile && (
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
                      <>
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
                            <Label className="text-sm text-muted-foreground">Role</Label>
                            <div className="flex gap-2 mt-1">
                              {roles.length > 0 ? (
                                roles.map(role => (
                                  <Badge key={role} variant={role === 'owner' ? 'default' : 'secondary'} className="text-sm">
                                    {role.toUpperCase()}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">No role assigned</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <Separator />
                    {isOwner() && (
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1">Owner Privileges</h4>
                            <p className="text-sm text-muted-foreground">
                              You have full access to all modules and can manage user roles and permissions.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {isOwner() && <RoleManagement />}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {isOwner() ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Permissions (Legacy)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Legacy agent permissions system. Use the "Role Management" tab to manage user roles.
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Only owners can manage permissions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;