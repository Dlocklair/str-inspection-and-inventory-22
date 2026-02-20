import { Package, ClipboardList, AlertTriangle, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Inspections', url: '/inspections', icon: ClipboardList },
  { title: 'Damage', url: '/damage', icon: AlertTriangle },
  { title: 'Warranties', url: '/warranties', icon: ShieldCheck },
];

export function MobileBottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`
            }
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
