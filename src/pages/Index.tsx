import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, AlertTriangle, Settings, User, Shield, Loader2, LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LowStockTrendsWidget } from '@/components/LowStockTrendsWidget';
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    roles,
    loading,
    signOut,
    isOwner,
    isManager,
    isInspector
  } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  if (loading) {
    console.log('Showing loading screen...');
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">
            If this persists, please refresh the page
          </p>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome Back, {profile?.full_name || 'User'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              STR Management Dashboard
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {roles.length > 0 ? (
                roles.map(role => (
                  <Badge key={role} variant={role === 'owner' ? 'default' : 'secondary'}>
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No role assigned</Badge>
              )}
              {isOwner() && <Shield className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Properties */}
          <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/20 min-h-[200px] flex flex-col">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Properties
                <Badge variant="default" className="ml-2">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-900 text-white flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground">
                Manage all your property locations and details in one place.
              </p>
              <Button onClick={() => navigate('/properties')} className="w-full mt-4">
                Manage Properties
              </Button>
            </CardContent>
          </Card>

          {/* Inspection Reports */}
          <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/20 min-h-[200px] flex flex-col">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Inspections
                <Badge variant="default" className="ml-2">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-900 text-white flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground">
                Manage property inspections with customizable templates and automated notifications.
              </p>
              <Button onClick={() => navigate('/inspections')} className="w-full mt-4">
                Open Inspections
              </Button>
            </CardContent>
          </Card>

          {/* Inventory Reports */}
          <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/20 min-h-[200px] flex flex-col">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Inventory
                <Badge variant="default" className="ml-2">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-900 text-white flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground">
                Track stock levels, manage categories, and get automated reorder notifications.
              </p>
              <Button onClick={() => navigate('/inventory')} className="w-full mt-4">
                Open Inventory
              </Button>
            </CardContent>
          </Card>

          {/* Damage Reports */}
          <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/20 min-h-[200px] flex flex-col">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-primary" />
                Damage Reports
                <Badge variant="default" className="ml-2">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-900 text-white flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground">
                Document damage with photos, track repairs, and generate insurance claims.
              </p>
              <Button onClick={() => navigate('/damage')} className="w-full mt-4">
                Open Damage Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Owner Features */}
        {isOwner() && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Owner Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-primary/20 min-h-[200px] flex flex-col">
                <CardHeader className="bg-slate-900">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Agent Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-slate-900 flex-1 flex flex-col justify-between">
                  <p className="text-muted-foreground">
                    Invite agents, manage permissions, and control access to different modules.
                  </p>
                  <Button onClick={() => navigate('/settings')} variant="outline" className="w-full mt-4">
                    Manage Agents
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 min-h-[200px] flex flex-col">
                <CardHeader className="bg-slate-900">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-slate-900 flex-1 flex flex-col justify-between">
                  <p className="text-muted-foreground">
                    Configure notifications, inspection schedules, and system preferences.
                  </p>
                  <Button onClick={() => navigate('/settings')} variant="outline" className="w-full mt-4">
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-4 text-center">
                <ClipboardList className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-blue-600">Recent Inspections</p>
                <p className="text-2xl font-bold text-blue-700">Ready</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-green-600">Inventory System</p>
                <p className="text-2xl font-bold text-green-700">Online</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <p className="text-sm text-orange-600">Damage Reports</p>
                <p className="text-2xl font-bold text-orange-700">Ready</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-purple-600">System Status</p>
                <p className="text-2xl font-bold text-purple-700">Secure</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Low Stock Trends Widget */}
          <LowStockTrendsWidget />
        </div>
      </div>
    </div>;
};
export default Index;