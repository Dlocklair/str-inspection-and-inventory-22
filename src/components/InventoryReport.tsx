import { useState, useEffect } from 'react';
import { InventorySection } from './InventorySection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, ClipboardList, AlertTriangle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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

export const InventoryReport = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const hasAccess = (module: keyof User['permissions']) => {
    // For now, return true since we're using profile-based access
    return true;
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
              {hasAccess('inspections') && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/inspections')}
                  className="flex items-center gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Inspections
                </Button>
              )}
              {hasAccess('damage') && (
                <Button 
                  variant="outline" 
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
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{profile.full_name}</span>
                <Badge variant={profile.role === 'owner' ? 'default' : 'secondary'}>
                  {profile.role}
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
              Inventory Reports
            </h1>
            <p className="text-muted-foreground">
              Manage inventory levels, restock requests, and supplier communications
            </p>
          </div>
          <InventorySection />
        </div>
      </div>
    </div>
  );
};