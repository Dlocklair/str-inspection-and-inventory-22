import { Home, Package, ClipboardList, AlertTriangle, Settings, Settings2, Building2, UserCog, UserPlus, Clock, User, FileEdit, History, FilePlus, AlertCircle, ClipboardCheck } from 'lucide-react';
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Properties', url: '/properties', icon: Building2 },
  { 
    title: 'Inspections', 
    url: '/inspections', 
    icon: ClipboardList,
    subItems: [
      { title: 'New Inspection', url: '/inspections?view=new-inspection', icon: FilePlus },
      { title: 'Upcoming Inspections', url: '/inspections?view=upcoming', icon: Clock },
      { title: 'Manage Inspection Templates', url: '/inspections?view=manage-templates', icon: FileEdit },
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
      { title: 'Inventory Setup and Updates', url: '/inventory-setup', icon: Settings2 },
    ]
  },
  { 
    title: 'Damage Reports', 
    url: '/damage', 
    icon: AlertTriangle,
    subItems: [
      { title: 'New Damage Report', url: '/damage?view=new', icon: AlertCircle },
      { title: 'Pending Damage Reports', url: '/damage?view=pending', icon: Clock },
      { title: 'Damage Report History', url: '/damage?view=history', icon: ClipboardCheck },
    ]
  },
  { 
    title: 'Settings', 
    url: '/settings', 
    icon: Settings,
    subItems: [
      { title: 'Manage Current Users', url: '/settings?view=manage-users', icon: UserCog },
      { title: 'Invite New User', url: '/settings?view=invite-user', icon: UserPlus },
      { title: 'Pending Invitations', url: '/settings?view=pending-invitations', icon: Clock },
      { title: 'Owner Profile', url: '/settings?view=owner-profile', icon: User },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const isMobile = useIsMobile();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                item.subItems && !isMobile ? (
                  <SidebarMenuItem key={item.title}>
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="w-56 p-2 z-50 bg-background">
                        <div className="space-y-1">
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.url}
                              to={subItem.url}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted/50'
                                }`
                              }
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              <span>{subItem.title}</span>
                            </NavLink>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
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
      </SidebarContent>
    </Sidebar>
  );
}
