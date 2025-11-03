import { Home, Package, ClipboardList, AlertTriangle, Settings, Settings2, Building2 } from 'lucide-react';
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

const menuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Properties', url: '/properties', icon: Building2 },
  { title: 'Inspections', url: '/inspections', icon: ClipboardList },
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
  { title: 'Damage Reports', url: '/damage', icon: AlertTriangle },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
                item.subItems ? (
                  <SidebarMenuItem key={item.title}>
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="w-48 p-2">
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
