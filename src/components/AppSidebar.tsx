import { useState } from 'react';
import { Home, Package, ClipboardList, AlertTriangle, Settings, Settings2, Building2, UserCog, UserPlus, Clock, User, FileEdit, History, FilePlus, AlertCircle, ClipboardCheck, ShieldCheck, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  title: string;
  url?: string;
  icon: any;
  subItems?: { title: string; url: string; icon?: any }[];
}

const mainMenuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Properties', url: '/properties', icon: Building2 },
  {
    title: 'Inspections',
    icon: ClipboardList,
    subItems: [
      { title: 'New Inspection', url: '/inspections?view=new-inspection', icon: FilePlus },
      { title: 'Upcoming Inspections', url: '/inspections?view=upcoming', icon: Clock },
      { title: 'Manage Templates', url: '/inspections?view=manage-templates', icon: FileEdit },
      { title: 'Inspection History', url: '/inspections?view=inspection-history', icon: History },
    ]
  },
  {
    title: 'Inventory',
    icon: Package,
    subItems: [
      { title: 'Current Inventory', url: '/inventory?tab=inventory' },
      { title: 'Restock Requests', url: '/inventory?tab=requests' },
      { title: 'Email Notifications', url: '/inventory?tab=notifications' },
      { title: 'Setup & Updates', url: '/inventory-setup', icon: Settings2 },
    ]
  },
  {
    title: 'Damage Reports',
    icon: AlertTriangle,
    subItems: [
      { title: 'New Damage Report', url: '/damage?view=new', icon: AlertCircle },
      { title: 'Pending Reports', url: '/damage?view=pending', icon: Clock },
      { title: 'Report History', url: '/damage?view=history', icon: ClipboardCheck },
    ]
  },
  { title: 'Warranties', url: '/warranties', icon: ShieldCheck },
];

const settingsMenuItems = [
  { title: 'Manage Current Users', url: '/settings?view=users', icon: UserCog },
  { title: 'Invite New User', url: '/settings?view=invite', icon: UserPlus },
  { title: 'Pending Invitations', url: '/settings?view=invitations', icon: Clock },
  { title: 'Owner Profile', url: '/settings?view=owner', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isMobile = useIsMobile();
  const { isOwner, isManager, isInspector, actualRoles, simulatedRole, setSimulatedRole } = useAuth();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

  const showMainNav = !isMobile;
  const isActualOwner = actualRoles.includes('owner');
  const showSettings = isOwner() || isManager();

  const filteredMainMenuItems = mainMenuItems.filter(item => {
    if (isInspector() && !isOwner() && !isManager()) {
      return ['Dashboard', 'Inspections', 'Inventory'].includes(item.title);
    }
    return true;
  });

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {showMainNav && (
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainMenuItems.map((item) => (
                  item.subItems ? (
                    <SidebarMenuItem key={item.title}>
                      <Collapsible open={openMenus[item.title] ?? false} onOpenChange={() => toggleMenu(item.title)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </span>
                            {!collapsed && (
                              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openMenus[item.title] ? 'rotate-180' : ''}`} />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 border-l pl-2 space-y-0.5 mt-1">
                            {item.subItems.map((subItem) => (
                              <NavLink
                                key={subItem.url}
                                to={subItem.url}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                    isActive
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'hover:bg-muted/50 text-muted-foreground'
                                  }`
                                }
                              >
                                {subItem.icon && <subItem.icon className="h-3.5 w-3.5" />}
                                <span>{subItem.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url!} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showSettings && (
          <SidebarGroup>
            <Separator className="mb-2" />
            <SidebarGroupLabel>
              <Settings className="h-3 w-3 mr-1 inline" />
              {!collapsed && 'Settings & Admin'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Role Simulation - only for actual owners */}
        {isActualOwner && !collapsed && (
          <SidebarGroup>
            <Separator className="mb-2" />
            <SidebarGroupLabel>Role Simulation</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 pb-2">
                <Select
                  value={simulatedRole || 'owner'}
                  onValueChange={(value) => setSimulatedRole(value === 'owner' ? null : value as any)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner (default)</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                  </SelectContent>
                </Select>
                {simulatedRole && (
                  <p className="text-[10px] text-destructive mt-1">Simulating {simulatedRole} role</p>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
