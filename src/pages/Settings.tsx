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

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  
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
    if (user && profile?.role === 'owner') {
      fetchAgentsAndPermissions();
    }
  }, [user, profile]);

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
            <TabsTrigger value="users" disabled={profile?.role !== 'owner'}>User Management</TabsTrigger>
            <TabsTrigger value="permissions" disabled={profile?.role !== 'owner'}>Permissions</TabsTrigger>
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
                        <Badge variant={profile.role === 'owner' ? 'default' : 'secondary'}>
                          {profile.role}
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    {profile.role === 'owner' && (
                      <div>
                        <h4 className="font-medium mb-2">Owner Access</h4>
                        <p className="text-sm text-muted-foreground">
                          As an owner, you have full access to all modules and can manage agents.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {profile?.role === 'owner' && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite New Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Agent full name"
                        value={newInvitation.fullName}
                        onChange={(e) => setNewInvitation(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Agent email"
                        value={newInvitation.email}
                        onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (Optional)</Label>
                    <Input
                      placeholder="Agent phone number"
                      value={newInvitation.phone}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Module Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="inspections"
                          checked={newInvitation.permissions.inspections}
                          onCheckedChange={(checked) => 
                            setNewInvitation(prev => ({ 
                              ...prev, 
                              permissions: { ...prev.permissions, inspections: checked }
                            }))
                          }
                        />
                        <Label htmlFor="inspections">Inspections</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="inventory"
                          checked={newInvitation.permissions.inventory}
                          onCheckedChange={(checked) => 
                            setNewInvitation(prev => ({ 
                              ...prev, 
                              permissions: { ...prev.permissions, inventory: checked }
                            }))
                          }
                        />
                        <Label htmlFor="inventory">Inventory</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="damage"
                          checked={newInvitation.permissions.damage}
                          onCheckedChange={(checked) => 
                            setNewInvitation(prev => ({ 
                              ...prev, 
                              permissions: { ...prev.permissions, damage: checked }
                            }))
                          }
                        />
                        <Label htmlFor="damage">Damage Reports</Label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={sendInvitation} className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{agent.agent?.full_name}</p>
                          <Badge variant="secondary">Agent</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.agent?.email_addresses?.[0] || 'No email'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {/* TODO: Remove agent */}}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No agents found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {profile?.role === 'owner' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Agent Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {permissions.map(permission => (
                      <div key={permission.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{permission.agent?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{permission.agent?.email_addresses?.[0] || 'No email'}</p>
                          </div>
                          <Badge variant="secondary">Agent</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">Inspections</span>
                            <Switch
                              checked={permission.inspections}
                              onCheckedChange={(checked) => 
                                updateAgentPermissions(permission.agent_id, { 
                                  ...permission, 
                                  inspections: checked 
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">Inventory</span>
                            <Switch
                              checked={permission.inventory}
                              onCheckedChange={(checked) => 
                                updateAgentPermissions(permission.agent_id, { 
                                  ...permission, 
                                  inventory: checked 
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">Damage Reports</span>
                            <Switch
                              checked={permission.damage}
                              onCheckedChange={(checked) => 
                                updateAgentPermissions(permission.agent_id, { 
                                  ...permission, 
                                  damage: checked 
                                })
                              }
                            />
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                    {permissions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No agents to manage. Invite agents in the User Management tab.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Access Denied</h3>
                    <p className="text-muted-foreground">
                      Only owners can manage permissions. Contact your property owner for access.
                    </p>
                  </div>
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