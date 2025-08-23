import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, AlertTriangle, Settings, User, Shield, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AgentPermissions {
  inspections: boolean;
  inventory: boolean;
  damage: boolean;
  can_create_inspections: boolean;
  can_add_inspection_items: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [permissions, setPermissions] = useState<AgentPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!profile) {
        setPermissionsLoading(false);
        return;
      }

      try {
        if (profile.role === 'owner') {
          // Owners have full permissions
          setPermissions({
            inspections: true,
            inventory: true,
            damage: true,
            can_create_inspections: true,
            can_add_inspection_items: true
          });
        } else {
          // Fetch agent permissions
          const { data, error } = await supabase
            .from('agent_permissions')
            .select('*')
            .eq('agent_id', profile.id)
            .single();

          if (error) {
            console.error('Error fetching permissions:', error);
            setPermissions({
              inspections: false,
              inventory: false,
              damage: false,
              can_create_inspections: false,
              can_add_inspection_items: false
            });
          } else {
            setPermissions(data);
          }
        }
      } catch (error) {
        console.error('Error in fetchPermissions:', error);
        setPermissions({
          inspections: false,
          inventory: false,
          damage: false,
          can_create_inspections: false,
          can_add_inspection_items: false
        });
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchPermissions();
  }, [profile]);

  const hasAccess = (module: keyof Pick<AgentPermissions, 'inspections' | 'inventory' | 'damage'>) => {
    if (!permissions) return false;
    return permissions[module];
  };

  const hasAnyAccess = permissions ? 
    (permissions.inspections || permissions.inventory || permissions.damage) : false;

  const getAccessBadge = (module: keyof Pick<AgentPermissions, 'inspections' | 'inventory' | 'damage'>) => {
    const access = hasAccess(module);
    return (
      <Badge variant={access ? 'default' : 'secondary'} className="ml-2">
        {access ? 'Allowed' : 'No Access'}
      </Badge>
    );
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the STR Management System
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              <User className="h-4 w-4 mr-2" />
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              STR Management Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage inspections, inventory, and damage reports for your properties
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-medium">{profile.full_name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant={profile.role === 'owner' ? 'default' : 'secondary'}>
                    {profile.role}
                  </Badge>
                  {profile.role === 'owner' && <Shield className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Access Warning */}
        {!hasAnyAccess && profile.role === 'agent' && (
          <Card className="mb-8 border-destructive">
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

        {/* Main Content - Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inspection Reports */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg ${!hasAccess('inspections') ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Inspections
                {getAccessBadge('inspections')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage property inspection checklists with Per Visit, Monthly, Quarterly, and Yearly templates. Track inspection history and get automated notifications.
              </p>
              <Button 
                onClick={() => hasAccess('inspections') && navigate('/inspections')}
                className="w-full"
                disabled={!hasAccess('inspections')}
              >
                {hasAccess('inspections') ? 'Open Inspections' : 'Access Denied'}
              </Button>
            </CardContent>
          </Card>

          {/* Inventory Reports */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg ${!hasAccess('inventory') ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Inventory
                {getAccessBadge('inventory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track stock levels with predefined categories (Toiletries, Linen, Consumables), manage restock thresholds, and get Amazon reorder links.
              </p>
              <Button 
                onClick={() => hasAccess('inventory') && navigate('/inventory')}
                className="w-full"
                disabled={!hasAccess('inventory')}
              >
                {hasAccess('inventory') ? 'Open Inventory' : 'Access Denied'}
              </Button>
            </CardContent>
          </Card>

          {/* Damage Reports */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg ${!hasAccess('damage') ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-primary" />
                Damage Reports
                {getAccessBadge('damage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Document property damage with photos, track repair status, estimate costs, and generate reports for Airbnb/VRBO claims.
              </p>
              <Button 
                onClick={() => hasAccess('damage') && navigate('/damage')}
                className="w-full"
                disabled={!hasAccess('damage')}
              >
                {hasAccess('damage') ? 'Open Damage Reports' : 'Access Denied'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats (only for users with access) */}
        {hasAnyAccess && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {hasAccess('inspections') && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <ClipboardList className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Recent Inspections</p>
                    <p className="text-2xl font-bold">12</p>
                  </CardContent>
                </Card>
              )}
              {hasAccess('inventory') && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold">3</p>
                  </CardContent>
                </Card>
              )}
              {hasAccess('damage') && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">Open Damage Reports</p>
                    <p className="text-2xl font-bold">2</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-sm font-medium text-green-600">All Good</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Owner Features */}
        {profile.role === 'owner' && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Owner Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Agent Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Invite agents, set permissions, and manage access to different modules.
                  </p>
                  <Button onClick={() => navigate('/settings')} variant="outline" className="w-full">
                    Manage Agents
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Configure notification settings, inspection frequencies, and system preferences.
                  </p>
                  <Button onClick={() => navigate('/settings')} variant="outline" className="w-full">
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;