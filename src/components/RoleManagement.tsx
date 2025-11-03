import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCog, Eye, Trash2, Send, Loader2, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';

type AppRole = 'owner' | 'manager' | 'inspector';

interface UserWithRoles {
  profile_id: string;
  user_id: string;
  full_name: string;
  email: string;
  roles: AppRole[];
}

interface InspectionType {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  owner_id: string;
  phone: string | null;
  permissions: any;
}

const roleIcons = {
  owner: Shield,
  manager: UserCog,
  inspector: Eye
};

const roleColors = {
  owner: 'bg-primary text-primary-foreground',
  manager: 'bg-blue-500 text-white',
  inspector: 'bg-green-500 text-white'
};

export const RoleManagement = () => {
  const { user, profile, refreshRoles } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppRole>('inspector');
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('inspector');
  const [inviteSending, setInviteSending] = useState(false);
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([]);
  const [selectedInspectionTypes, setSelectedInspectionTypes] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [userProperties, setUserProperties] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchUsersAndRoles();
    fetchInspectionTypes();
    fetchInvitations();
    fetchProperties();
    fetchUserProperties();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);

      // Fetch users with emails using the database function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_emails');

      if (usersError) throw usersError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine users with their roles
      const usersWithRoles: UserWithRoles[] = (usersData || []).map(user => {
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === user.user_id)
          .map(ur => ur.role as AppRole);

        return {
          profile_id: user.profile_id,
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email || 'No email',
          roles
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users and roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users and roles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole,
          assigned_by: user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role assigned successfully'
      });

      setSelectedUser('');
      await fetchUsersAndRoles();
      
      // Refresh current user's roles if they assigned a role to themselves
      if (selectedUser === user?.id) {
        await refreshRoles();
      }
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role removed successfully'
      });

      await fetchUsersAndRoles();
      
      // Refresh current user's roles if they removed their own role
      if (userId === user?.id) {
        await refreshRoles();
      }
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive'
      });
    }
  };

  const fetchInspectionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('inspection_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setInspectionTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching inspection types:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address')
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUserProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('user_properties')
        .select('user_id, property_id');

      if (error) throw error;
      
      // Group properties by user_id
      const grouped = (data || []).reduce((acc, item) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push(item.property_id);
        return acc;
      }, {} as Record<string, string[]>);
      
      setUserProperties(grouped);
    } catch (error: any) {
      console.error('Error fetching user properties:', error);
    }
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleAssignProperties = async (userId: string) => {
    if (selectedProperties.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one property',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Remove existing property assignments
      const { error: deleteError } = await supabase
        .from('user_properties')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add new property assignments
      const { error: insertError } = await supabase
        .from('user_properties')
        .insert(
          selectedProperties.map(propertyId => ({
            user_id: userId,
            property_id: propertyId,
            assigned_by: profile?.id
          }))
        );

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Properties assigned successfully'
      });

      await fetchUserProperties();
      setSelectedProperties([]);
    } catch (error: any) {
      console.error('Error assigning properties:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign properties',
        variant: 'destructive'
      });
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteFullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (inviteRole === 'inspector' && selectedInspectionTypes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one inspection type for the inspector',
        variant: 'destructive'
      });
      return;
    }

    setInviteSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user-invitation', {
        body: {
          email: inviteEmail,
          fullName: inviteFullName,
          role: inviteRole,
          inspectionTypeIds: inviteRole === 'inspector' ? selectedInspectionTypes : undefined
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation sent successfully'
      });

      // Reset form
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('inspector');
      setSelectedInspectionTypes([]);
      
      await fetchInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive'
      });
    } finally {
      setInviteSending(false);
    }
  };

  const toggleInspectionType = (typeId: string) => {
    setSelectedInspectionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation revoked successfully'
      });

      await fetchInvitations();
    } catch (error: any) {
      console.error('Error revoking invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke invitation',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite New User</CardTitle>
          <CardDescription>Send an invitation to a new user with a specific role</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteFullName">Full Name *</Label>
                <Input
                  id="inviteFullName"
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role *</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as AppRole)}>
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteRole === 'inspector' && (
              <div className="space-y-2">
                <Label>Inspection Types * (Select at least one)</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {inspectionTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={selectedInspectionTypes.includes(type.id)}
                        onCheckedChange={() => toggleInspectionType(type.id)}
                      />
                      <Label htmlFor={`type-${type.id}`} className="cursor-pointer">
                        {type.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={inviteSending}>
              {inviteSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage sent invitations</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No invitations sent yet</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const isExpired = new Date(invitation.expires_at) < new Date();
                const isAccepted = invitation.accepted_at !== null;

                return (
                  <div key={invitation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{invitation.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{invitation.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={roleColors[invitation.role as AppRole]}>
                            {invitation.role}
                          </Badge>
                          {isAccepted ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accepted
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        {invitation.role === 'inspector' && invitation.permissions?.inspection_type_ids && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Inspection access: {invitation.permissions.inspection_type_ids.length} type(s)
                          </p>
                        )}
                      </div>
                      {!isAccepted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Role</CardTitle>
          <CardDescription>Assign roles to users to control their access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.full_name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="inspector">Inspector</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAssignRole}>Assign Role</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Users & Roles</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(userItem => {
              const userPropertyIds = userProperties[userItem.profile_id] || [];
              const assignedProperties = properties.filter(p => userPropertyIds.includes(p.id));
              const hasNonOwnerRole = userItem.roles.some(r => r === 'manager' || r === 'inspector');

              return (
                <div key={userItem.profile_id} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{userItem.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {userItem.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userItem.roles.length === 0 ? (
                          <Badge variant="outline">No roles</Badge>
                        ) : (
                          userItem.roles.map(role => {
                            const Icon = roleIcons[role];
                            return (
                              <div key={role} className="flex items-center gap-1">
                                <Badge className={roleColors[role]}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {role}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveRole(userItem.user_id, role)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {hasNonOwnerRole && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Assigned Properties</Label>
                          {assignedProperties.length === 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              No properties assigned
                            </Badge>
                          )}
                        </div>
                        {assignedProperties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {assignedProperties.map(prop => (
                              <Badge key={prop.id} variant="secondary" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {prop.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs">Assign Properties:</Label>
                          <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                            {properties.map((property) => (
                              <div key={property.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${userItem.profile_id}-property-${property.id}`}
                                  checked={selectedProperties.includes(property.id)}
                                  onCheckedChange={() => toggleProperty(property.id)}
                                />
                                <Label 
                                  htmlFor={`${userItem.profile_id}-property-${property.id}`} 
                                  className="cursor-pointer text-sm"
                                >
                                  {property.name} - {property.address}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignProperties(userItem.profile_id)}
                            disabled={selectedProperties.length === 0}
                          >
                            Update Property Access
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Owner</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all modules, can manage users and assign roles, including promoting others to owner.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Manager</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Access to all modules (Inspections, Inventory, Damage Reports). Cannot manage users or roles.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Inspector</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Access only to the Inspections module. No access to Inventory or Damage Reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
