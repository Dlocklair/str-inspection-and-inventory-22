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
  const { user, profile, signOut, loading, isOwner, roles } = useAuth();
  
  const [agents, setAgents] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
            <TabsTrigger value="roles" disabled={!isOwner()}>Role Management</TabsTrigger>
            <TabsTrigger value="permissions" disabled={!isOwner()}>Agent Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2">
                          {roles.length > 0 ? (
                            roles.map(role => (
                              <Badge key={role} variant={role === 'owner' ? 'default' : 'secondary'}>
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No role assigned</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    {isOwner() && (
                      <div>
                        <h4 className="font-medium mb-2">Owner Access</h4>
                        <p className="text-sm text-muted-foreground">
                          As an owner, you have full access to all modules and can manage roles.
                        </p>
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