import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCog, Eye, Trash2 } from 'lucide-react';

type AppRole = 'owner' | 'manager' | 'inspector';

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string;
  email_addresses: string[];
  roles: AppRole[];
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
  const { user, refreshRoles } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppRole>('inspector');
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const roles = (userRoles || [])
          .filter(ur => ur.user_id === profile.user_id)
          .map(ur => ur.role as AppRole);

        return {
          ...profile,
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

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
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
                    {u.full_name} ({u.email_addresses[0] || 'No email'})
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
            {users.map(userItem => (
              <div key={userItem.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{userItem.full_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {userItem.email_addresses[0] || 'No email'}
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
              </div>
            ))}
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
