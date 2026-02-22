import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, AlertTriangle, Settings, User, Shield, Loader2, Building2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LowStockTrendsWidget } from '@/components/LowStockTrendsWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    user,
    profile,
    roles,
    loading,
    isOwner,
    isManager,
    isInspector
  } = useAuth();
  const { data: stats } = useDashboardStats();
  
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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

  const openDamage = stats?.openDamageReports ?? 0;
  const upcomingInsp = stats?.upcomingInspections ?? 0;
  const lowStock = stats?.lowStockItems ?? 0;
  const expiringWarr = stats?.expiringWarranties ?? 0;

  // Role-based access: owners see everything, managers see most, inspectors see limited
  const allQuickLinks = [
    { title: 'Properties', url: '/properties', icon: Building2, color: 'text-primary', roles: ['owner', 'manager'] as string[] },
    { title: 'Inspections', url: '/inspections', icon: ClipboardList, color: 'text-primary', roles: ['owner', 'manager', 'inspector'] as string[] },
    { title: 'Inventory', url: '/inventory', icon: Package, color: 'text-primary', roles: ['owner', 'manager', 'inspector'] as string[] },
    { title: 'Damage Reports', url: '/damage', icon: AlertTriangle, color: 'text-primary', roles: ['owner', 'manager'] as string[] },
    { title: 'Warranties', url: '/warranties', icon: ShieldCheck, color: 'text-primary', roles: ['owner', 'manager'] as string[] },
  ];

  const quickLinks = allQuickLinks.filter(link =>
    link.roles.some(role => roles.includes(role as any))
  );

  // Mobile: native-app-style list
  if (isMobile) {
    return (
      <div className="bg-background">
        <div className="px-4 py-4">
          {/* Compact header */}
          <h1 className="text-xl font-bold text-foreground">
            Hi, {profile?.full_name || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground">STR Dashboard</p>

          {/* Large tap-target list */}
          <div className="mt-4 space-y-2">
            {quickLinks.map((link) => (
              <button
                key={link.url}
                onClick={() => navigate(link.url)}
                className="flex items-center gap-3 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 active:bg-accent transition-colors text-left"
              >
                <link.icon className={`h-5 w-5 ${link.color} shrink-0`} />
                <span className="text-sm font-medium text-foreground">{link.title}</span>
              </button>
            ))}
          </div>

          {/* Owner shortcuts */}
          {isOwner() && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 active:bg-accent transition-colors text-left"
              >
                <User className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">Agent Management</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3 w-full p-3 rounded-lg border bg-card hover:bg-accent/50 active:bg-accent transition-colors text-left"
              >
                <Settings className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">System Configuration</span>
              </button>
            </div>
          )}

          {/* Collapsible live stats */}
          <Collapsible open={statusOpen} onOpenChange={setStatusOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Live Stats</span>
                {statusOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <StatusCard icon={AlertTriangle} label="Open Damage" value={openDamage} warn={openDamage > 0} onClick={() => navigate('/damage?view=open')} />
                <StatusCard icon={ClipboardList} label="Upcoming (7d)" value={upcomingInsp} warn={upcomingInsp > 0} onClick={() => navigate('/inspections?view=upcoming')} />
                <StatusCard icon={Package} label="Low Stock" value={lowStock} warn={lowStock > 0} onClick={() => navigate('/inventory')} />
                <StatusCard icon={ShieldCheck} label="Expiring (30d)" value={expiringWarr} warn={expiringWarr > 0} onClick={() => navigate('/warranties')} />
              </div>
              <div className="mt-3">
                <LowStockTrendsWidget />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome Back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground text-lg">
            STR Management Dashboard
          </p>
          {roles.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {roles.map(role => (
                <Badge key={role} variant={role === 'owner' ? 'default' : 'secondary'}>
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={AlertTriangle}
            label="Open Damage Reports"
            value={openDamage}
            warn={openDamage > 0}
            onClick={() => navigate('/damage?view=open')}
            gradient="from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
            accent="text-orange-600 dark:text-orange-400"
          />
          <StatsCard
            icon={ClipboardList}
            label="Upcoming Inspections"
            subtitle="Next 7 days"
            value={upcomingInsp}
            warn={upcomingInsp > 0}
            onClick={() => navigate('/inspections?view=upcoming')}
            gradient="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
            accent="text-blue-600 dark:text-blue-400"
          />
          <StatsCard
            icon={Package}
            label="Low Stock Items"
            value={lowStock}
            warn={lowStock > 0}
            onClick={() => navigate('/inventory')}
            gradient="from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
            accent="text-red-600 dark:text-red-400"
          />
          <StatsCard
            icon={ShieldCheck}
            label="Expiring Warranties"
            subtitle="Next 30 days"
            value={expiringWarr}
            warn={expiringWarr > 0}
            onClick={() => navigate('/warranties')}
            gradient="from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
            accent="text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Main Content - Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {(isOwner() || isManager()) && <DashboardCard icon={Building2} title="Properties" description="Manage all your property locations and details in one place." onClick={() => navigate('/properties')} buttonLabel="Manage Properties" />}
          <DashboardCard icon={ClipboardList} title="Inspections" description="Manage property inspections with customizable templates and automated notifications." onClick={() => navigate('/inspections')} buttonLabel="Open Inspections" />
          <DashboardCard icon={Package} title="Inventory" description="Track stock levels, manage categories, and get automated reorder notifications." onClick={() => navigate('/inventory')} buttonLabel="Open Inventory" />
          {(isOwner() || isManager()) && <DashboardCard icon={AlertTriangle} title="Damage Reports" description="Document damage with photos, track repairs, and generate insurance claims." onClick={() => navigate('/damage')} buttonLabel="Open Damage Reports" />}
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

        {/* Low Stock Trends */}
        <div className="mb-12">
          <LowStockTrendsWidget />
        </div>
      </div>
    </div>
  );
};

// Helper components
function StatusCard({ icon: Icon, label, value, warn, onClick }: { icon: any; label: string; value: number; warn: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left">
      <Icon className={`h-4 w-4 shrink-0 ${warn ? 'text-destructive' : 'text-primary'}`} />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold ${warn ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      </div>
    </button>
  );
}

function StatsCard({ icon: Icon, label, subtitle, value, warn, onClick, gradient, accent }: { icon: any; label: string; subtitle?: string; value: number; warn: boolean; onClick: () => void; gradient: string; accent: string }) {
  return (
    <Card
      className={`bg-gradient-to-br ${gradient} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <Icon className={`h-8 w-8 mx-auto mb-2 ${accent}`} />
        <p className={`text-sm ${accent}`}>{label}</p>
        {subtitle && <p className={`text-xs ${accent} opacity-70`}>{subtitle}</p>}
        <p className={`text-3xl font-bold mt-1 ${warn ? 'text-destructive' : 'text-white/90'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardCard({ icon: Icon, title, description, onClick, buttonLabel }: { icon: any; title: string; description: string; onClick: () => void; buttonLabel: string }) {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/20 min-h-[200px] flex flex-col">
      <CardHeader className="bg-slate-900 text-white">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          {title}
          <Badge variant="default" className="ml-2">Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-900 text-white flex-1 flex flex-col justify-between">
        <p className="text-muted-foreground">{description}</p>
        <Button onClick={onClick} className="w-full mt-4">{buttonLabel}</Button>
      </CardContent>
    </Card>
  );
}

export default Index;
