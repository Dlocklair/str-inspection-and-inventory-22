import { Home, Package, ClipboardList, AlertTriangle, Settings, Settings2, ChevronRight, Mail, RefreshCw, List } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { 
    title: 'Inspections', 
    icon: ClipboardList,
    subItems: [
      { title: 'All Inspections', url: '/inspections' },
      { title: 'Pre-Arrival', url: '/inspections?type=pre-arrival' },
      { title: 'Mid-Stay', url: '/inspections?type=mid-stay' },
      { title: 'Post-Departure', url: '/inspections?type=post-departure' },
      { title: 'Maintenance', url: '/inspections?type=maintenance' },
    ]
  },
  { 
    title: 'Inventory', 
    icon: Package,
    subItems: [
      { title: 'Current Inventory', url: '/inventory' },
      { title: 'Restock Requests', url: '/inventory?tab=restock' },
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
  const [openItems, setOpenItems] = useState<string[]>(['Inspections', 'Inventory']);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

  const toggleItem = (title: string) => {
    setOpenItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                item.subItems ? (
                  <Collapsible
                    key={item.title}
                    open={openItems.includes(item.title) && !collapsed}
                    onOpenChange={() => toggleItem(item.title)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <>
                              <span>{item.title}</span>
                              <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${openItems.includes(item.title) ? 'rotate-90' : ''}`} />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink to={subItem.url} className={getNavCls}>
                                    {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" />}
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
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
