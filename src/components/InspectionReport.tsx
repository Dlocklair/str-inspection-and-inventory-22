import { useState, useEffect } from 'react';
import { ChecklistSection } from './ChecklistSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Package, AlertTriangle, Settings } from 'lucide-react';
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

export const InspectionReport = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex gap-2">
              {hasAccess('inventory') && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/inventory')}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Inventory
                </Button>
              )}
              {hasAccess('damage') && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/damage')}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Damage Reports
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{currentUser.name}</span>
                <Badge variant={currentUser.role === 'owner' ? 'default' : 'secondary'}>
                  {currentUser.role}
                </Badge>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Inspection Reports
            </h1>
            <p className="text-muted-foreground">
              Manage property inspection checklists and records
            </p>
          </div>
          <ChecklistSection />
        </div>
      </div>
    </div>
  );
};