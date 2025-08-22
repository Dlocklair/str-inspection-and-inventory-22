import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, AlertTriangle, Settings, User, Shield } from 'lucide-react';
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
}

const Index = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCurrentUser(settings.currentUser);
    }
  }, []);

  const hasAccess = (module: keyof User['permissions']) => {
    if (!currentUser) return false;
    return currentUser.permissions[module];
  };

  const hasAnyAccess = currentUser ? 
    Object.values(currentUser.permissions).some(permission => permission) : false;

  const getAccessBadge = (module: keyof User['permissions']) => {
    const access = hasAccess(module);
    return (
      <Badge variant={access ? 'default' : 'secondary'} className="ml-2">
        {access ? 'Allowed' : 'No Access'}
      </Badge>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome</h2>
            <p className="text-muted-foreground mb-6">
              Please complete your registration to access the STR Management System
            </p>
            <Button onClick={() => navigate('/settings')} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Go to Registration
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
                <p className="font-medium">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant={currentUser.role === 'owner' ? 'default' : 'secondary'}>
                    {currentUser.role}
                  </Badge>
                  {currentUser.role === 'owner' && <Shield className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Access Warning */}
        {!hasAnyAccess && currentUser.role === 'agent' && (
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
                Manage property inspection checklists, monthly/quarterly/yearly templates, and track inspection history.
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
                Track stock levels, manage restock requests, and coordinate with suppliers for cleaning supplies.
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
                Document property damage, track repair status, estimate costs, and manage maintenance workflows.
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
              <Card>
                <CardContent className="p-4 text-center">
                  <ClipboardList className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Recent Inspections</p>
                  <p className="text-2xl font-bold">12</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold">3</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground">Open Damage Reports</p>
                  <p className="text-2xl font-bold">2</p>
                </CardContent>
              </Card>
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
      </div>
    </div>
  );
};
export default Index;