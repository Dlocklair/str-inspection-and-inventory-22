import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings as SettingsIcon, Shield, UserPlus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'agent';
  permissions: {
    inspections: boolean;
    inventory: boolean;
    damage: boolean;
  };
  createdAt: string;
  isActive: boolean;
}

interface UserSettings {
  currentUser: User | null;
  users: User[];
}

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    currentUser: null,
    users: []
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'agent' as const,
    permissions: {
      inspections: false,
      inventory: false,
      damage: false
    }
  });

  const [showRegistration, setShowRegistration] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<User>>({});

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setUserSettings(settings);
      
      // If no current user is set, show registration
      if (!settings.currentUser) {
        setShowRegistration(true);
      }
    } else {
      setShowRegistration(true);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('user-settings', JSON.stringify(userSettings));
  }, [userSettings]);

  const registerUser = (role: 'owner' | 'agent') => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and email.",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role,
      permissions: role === 'owner' ? {
        inspections: true,
        inventory: true, 
        damage: true
      } : newUser.permissions,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setUserSettings(prev => ({
      currentUser: user,
      users: [...prev.users, user]
    }));

    setNewUser({
      name: '',
      email: '',
      role: 'agent',
      permissions: {
        inspections: false,
        inventory: false,
        damage: false
      }
    });

    setShowRegistration(false);

    toast({
      title: "Registration successful",
      description: `Welcome ${user.name}! You're registered as ${role}.`,
    });
  };

  const addAgent = () => {
    if (userSettings.currentUser?.role !== 'owner') {
      toast({
        title: "Permission denied",
        description: "Only owners can add agents.",
        variant: "destructive"
      });
      return;
    }

    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and email.",
        variant: "destructive"
      });
      return;
    }

    const agent: User = {
      id: Date.now().toString(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: 'agent',
      permissions: newUser.permissions,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setUserSettings(prev => ({
      ...prev,
      users: [...prev.users, agent]
    }));

    setNewUser({
      name: '',
      email: '',
      role: 'agent',
      permissions: {
        inspections: false,
        inventory: false,
        damage: false
      }
    });

    toast({
      title: "Agent added",
      description: `${agent.name} has been added as an agent.`,
    });
  };

  const updateUserPermissions = (userId: string, permissions: User['permissions']) => {
    setUserSettings(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === userId ? { ...user, permissions } : user
      ),
      currentUser: prev.currentUser?.id === userId 
        ? { ...prev.currentUser, permissions }
        : prev.currentUser
    }));

    toast({
      title: "Permissions updated",
      description: "User permissions have been updated successfully.",
    });
  };

  const deleteUser = (userId: string) => {
    if (userSettings.currentUser?.id === userId) {
      toast({
        title: "Cannot delete current user",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }

    setUserSettings(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId)
    }));

    toast({
      title: "User deleted",
      description: "User has been removed successfully.",
    });
  };

  const switchUser = (userId: string) => {
    const user = userSettings.users.find(u => u.id === userId);
    if (user) {
      setUserSettings(prev => ({
        ...prev,
        currentUser: user
      }));
      
      toast({
        title: "User switched",
        description: `Now logged in as ${user.name}.`,
      });
    }
  };

  // Check if current user has access to any modules
  const hasAnyAccess = userSettings.currentUser ? 
    Object.values(userSettings.currentUser.permissions).some(permission => permission) : false;

  if (showRegistration && !userSettings.currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <p className="text-muted-foreground">
              Register to start using the STR Management System
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <Button 
                onClick={() => registerUser('owner')} 
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Register as Owner
              </Button>
              <Button 
                onClick={() => registerUser('agent')} 
                variant="outline" 
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Register as Agent
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Owners have full access. Agents need permissions from owners.
            </p>
          </CardContent>
        </Card>
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
              Manage users, roles, and system permissions
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Access Warning */}
        {!hasAnyAccess && userSettings.currentUser?.role === 'agent' && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                <p className="font-medium">No Access Granted</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You don't have access to any modules. Please contact your property owner to grant permissions.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userSettings.currentUser && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{userSettings.currentUser.name}</p>
                        <p className="text-sm text-muted-foreground">{userSettings.currentUser.email}</p>
                        <Badge variant={userSettings.currentUser.role === 'owner' ? 'default' : 'secondary'}>
                          {userSettings.currentUser.role}
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Module Access</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Inspections</span>
                          <Badge variant={userSettings.currentUser.permissions.inspections ? 'default' : 'secondary'}>
                            {userSettings.currentUser.permissions.inspections ? 'Granted' : 'Denied'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Inventory</span>
                          <Badge variant={userSettings.currentUser.permissions.inventory ? 'default' : 'secondary'}>
                            {userSettings.currentUser.permissions.inventory ? 'Granted' : 'Denied'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Damage Reports</span>
                          <Badge variant={userSettings.currentUser.permissions.damage ? 'default' : 'secondary'}>
                            {userSettings.currentUser.permissions.damage ? 'Granted' : 'Denied'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {userSettings.currentUser?.role === 'owner' && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Agent name"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Agent email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Module Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="inspections"
                          checked={newUser.permissions.inspections}
                          onCheckedChange={(checked) => 
                            setNewUser(prev => ({ 
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
                          checked={newUser.permissions.inventory}
                          onCheckedChange={(checked) => 
                            setNewUser(prev => ({ 
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
                          checked={newUser.permissions.damage}
                          onCheckedChange={(checked) => 
                            setNewUser(prev => ({ 
                              ...prev, 
                              permissions: { ...prev.permissions, damage: checked }
                            }))
                          }
                        />
                        <Label htmlFor="damage">Damage Reports</Label>
                      </div>
                    </div>
                  </div>
                  <Button onClick={addAgent} className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Agent
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSettings.users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          {userSettings.currentUser?.id === user.id && (
                            <Badge variant="outline">Current</Badge>
                          )}
                          <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        {userSettings.currentUser?.id !== user.id && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => switchUser(user.id)}
                            >
                              Switch
                            </Button>
                            {userSettings.currentUser?.role === 'owner' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {userSettings.currentUser?.role === 'owner' ? (
              <div className="space-y-4">
                {userSettings.users.filter(user => user.role === 'agent').map(agent => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${agent.id}-inspections`}
                            checked={agent.permissions.inspections}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(agent.id, { 
                                ...agent.permissions, 
                                inspections: checked 
                              })
                            }
                          />
                          <Label htmlFor={`${agent.id}-inspections`}>Inspections</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${agent.id}-inventory`}
                            checked={agent.permissions.inventory}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(agent.id, { 
                                ...agent.permissions, 
                                inventory: checked 
                              })
                            }
                          />
                          <Label htmlFor={`${agent.id}-inventory`}>Inventory</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${agent.id}-damage`}
                            checked={agent.permissions.damage}
                            onCheckedChange={(checked) => 
                              updateUserPermissions(agent.id, { 
                                ...agent.permissions, 
                                damage: checked 
                              })
                            }
                          />
                          <Label htmlFor={`${agent.id}-damage`}>Damage Reports</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {userSettings.users.filter(user => user.role === 'agent').length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No agents found. Add agents in the User Management tab.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Only owners can manage permissions.</p>
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