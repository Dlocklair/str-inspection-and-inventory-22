import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAllInspectionTemplates } from '@/hooks/useInspectionTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCog, Eye, Loader2, Building2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type AppRole = 'owner' | 'manager' | 'inspector';

interface UserWithRoles {
  profile_id: string;
  user_id: string;
  full_name: string;
  email: string;
  roles: AppRole[];
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface InspectionTemplate {
  id: string;
  name: string;
  propertyIds?: string[];
  isPredefined?: boolean;
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

export const ManageUsers = () => {
  const { profile, refreshRoles } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [userProperties, setUserProperties] = useState<Record<string, string[]>>({});
  const [userTemplates, setUserTemplates] = useState<Record<string, string[]>>({});
  
  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('inspector');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: supabaseTemplates = [] } = useAllInspectionTemplates();

  useEffect(() => {
    fetchData();
  }, []);

  // Sync templates from Supabase hook
  useEffect(() => {
    setTemplates(supabaseTemplates.map(t => ({
      id: t.id,
      name: t.name,
      propertyIds: t.property_id ? [t.property_id] : [],
      isPredefined: t.is_predefined
    })));
  }, [supabaseTemplates]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsersAndRoles(),
      fetchProperties(),
      fetchUserProperties(),
      fetchUserTemplates()
    ]);
    setLoading(false);
  };

  const fetchUsersAndRoles = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_emails');

      if (usersError) throw usersError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (usersData || []).map((u: any) => ({
        profile_id: u.profile_id,
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        roles: (rolesData || [])
          .filter((r: any) => r.user_id === u.user_id)
          .map((r: any) => r.role)
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
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

  const fetchUserTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('inspector_inspection_permissions')
        .select('inspector_id, inspection_type_id');

      if (error) throw error;
      
      const grouped = (data || []).reduce((acc, item) => {
        if (!acc[item.inspector_id]) {
          acc[item.inspector_id] = [];
        }
        acc[item.inspector_id].push(item.inspection_type_id);
        return acc;
      }, {} as Record<string, string[]>);
      
      setUserTemplates(grouped);
    } catch (error: any) {
      console.error('Error fetching user templates:', error);
    }
  };

  const handleAssignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          assigned_by: profile?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role ${role} assigned successfully`
      });

      await fetchUsersAndRoles();
      await refreshRoles();
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
        description: `Role ${role} removed successfully`
      });

      await fetchUsersAndRoles();
      await refreshRoles();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive'
      });
    }
  };

  const handleStartEdit = (userId: string) => {
    setEditingUserId(userId);
    setSelectedProperty('');
    setSelectedTemplates([]);
  };

  const handleSavePropertyAndTemplates = async () => {
    if (!editingUserId) return;

    const user = users.find(u => u.profile_id === editingUserId);
    if (!user) return;

    const hasManagerRole = user.roles.includes('manager');
    const hasInspectorRole = user.roles.includes('inspector');

    if (!selectedProperty && (hasManagerRole || hasInspectorRole)) {
      toast({
        title: 'Error',
        description: 'Please select a property',
        variant: 'destructive'
      });
      return;
    }

    if (hasInspectorRole && selectedTemplates.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one inspection template for inspectors',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Assign property
      if (selectedProperty) {
        const existingProps = userProperties[editingUserId] || [];
        if (!existingProps.includes(selectedProperty)) {
          const { error: propError } = await supabase
            .from('user_properties')
            .insert({
              user_id: editingUserId,
              property_id: selectedProperty,
              assigned_by: profile?.id
            });

          if (propError) throw propError;
        }
      }

      // Assign templates (for inspectors only)
      if (hasInspectorRole && selectedTemplates.length > 0) {
        const { error: templateError } = await supabase
          .from('inspector_inspection_permissions')
          .insert(
            selectedTemplates.map(templateId => ({
              inspector_id: editingUserId,
              inspection_type_id: templateId,
              granted_by: profile?.id
            }))
          );

        if (templateError) throw templateError;
      }

      toast({
        title: 'Success',
        description: 'Assignments saved successfully'
      });

      await fetchUserProperties();
      await fetchUserTemplates();
      setSelectedProperty('');
      setSelectedTemplates([]);
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignments',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPropertyTemplates = (propertyId: string) => {
    return templates.filter(t => t.propertyIds?.includes(propertyId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Users</CardTitle>
          <CardDescription>Manage user roles, properties, and inspection templates</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-2">No users found</p>
              <p className="text-sm text-muted-foreground">Invite your first team member to get started!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {users.map((user) => {
              const RoleIcon = user.roles[0] ? roleIcons[user.roles[0]] : Shield;
              const isEditing = editingUserId === user.profile_id;
              const hasManagerRole = user.roles.includes('manager');
              const hasInspectorRole = user.roles.includes('inspector');
              const hasOwnerRole = user.roles.includes('owner');

              return (
                <div key={user.profile_id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <RoleIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                          {user.roles.map(role => {
                            const RIcon = roleIcons[role];
                            return (
                              <Badge key={role} className={roleColors[role]}>
                                <RIcon className="h-3 w-3 mr-1" />
                                {role.toUpperCase()}
                              </Badge>
                            );
                          })}
                        </div>
                        
                        {/* Show assigned properties */}
                        {(hasManagerRole || hasInspectorRole) && userProperties[user.profile_id] && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Assigned Properties:</p>
                            <div className="flex flex-wrap gap-1">
                              {userProperties[user.profile_id].map(propId => {
                                const prop = properties.find(p => p.id === propId);
                                return prop ? (
                                  <Badge key={propId} variant="outline" className="text-xs">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {prop.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => handleStartEdit(user.profile_id)} variant="outline" size="sm">
                        Edit Assignments
                      </Button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="ml-8 space-y-4 p-4 bg-muted/30 rounded-lg border">
                      <div>
                        <h4 className="font-medium mb-3">Assign Role</h4>
                        <div className="flex gap-2">
                          <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AppRole)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="inspector">Inspector</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={() => handleAssignRole(user.user_id, selectedRole)} size="sm">
                            Assign Role
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Owner: Full access. Manager: All modules, must assign properties. Inspector: Must assign properties & templates.
                        </p>
                      </div>

                      {(hasManagerRole || hasInspectorRole) && !hasOwnerRole && (
                        <>
                          <Separator />
                          <div>
                            <Label className="mb-2 block">Select Property</Label>
                            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a property" />
                              </SelectTrigger>
                              <SelectContent>
                                {properties.map(prop => (
                                  <SelectItem key={prop.id} value={prop.id}>
                                    {prop.name} - {prop.address}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {hasInspectorRole && selectedProperty && (
                            <>
                              <div>
                                <Label className="mb-2 block">Select Inspection Templates</Label>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                                  {getPropertyTemplates(selectedProperty).map(template => (
                                    <div key={template.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={template.id}
                                        checked={selectedTemplates.includes(template.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedTemplates([...selectedTemplates, template.id]);
                                          } else {
                                            setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                                          }
                                        }}
                                      />
                                      <label htmlFor={template.id} className="text-sm cursor-pointer">
                                        {template.name}
                                      </label>
                                    </div>
                                  ))}
                                  {getPropertyTemplates(selectedProperty).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No templates for this property</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="flex gap-2">
                            <Button onClick={handleSavePropertyAndTemplates} disabled={isSaving}>
                              {isSaving ? 'Saving...' : 'Save Assignments'}
                            </Button>
                            <Button onClick={() => setEditingUserId(null)} variant="outline">
                              Cancel
                            </Button>
                          </div>
                        </>
                      )}

                      {!hasManagerRole && !hasInspectorRole && !hasOwnerRole && (
                        <p className="text-sm text-muted-foreground">Assign a role first to configure properties and templates</p>
                      )}
                    </div>
                  )}

                  <Separator />
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};