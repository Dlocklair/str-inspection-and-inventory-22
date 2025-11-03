import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Package, AlertTriangle, Settings, FileText, History, Settings as TemplateIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NewInspectionForm } from './NewInspectionForm';
import { EditableInspectionHistoryView } from './EditableInspectionHistoryView';
import { ImprovedInspectionTemplateManager } from './ImprovedInspectionTemplateManager';
import { PropertySelector } from './PropertySelector';

export const InspectionReport = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedView, setSelectedView] = useState<string>('new-inspection');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Property Selector - Prominent at top */}
        <div className="mb-6">
          <PropertySelector />
        </div>
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Inventory
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/damage')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Damage Reports
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{profile.full_name}</span>
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

          {/* Main Navigation */}
          <div className="flex justify-center">
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select inspection view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-inspection">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    New Inspection
                  </div>
                </SelectItem>
                <SelectItem value="inspection-history">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Inspection History
                  </div>
                </SelectItem>
                <SelectItem value="manage-templates">
                  <div className="flex items-center gap-2">
                    <TemplateIcon className="h-4 w-4" />
                    Manage Inspection Templates
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content based on selected view */}
          {selectedView === 'new-inspection' && (
            <NewInspectionForm 
              onNavigateToTemplateManager={() => setSelectedView('manage-templates')}
            />
          )}
          {selectedView === 'inspection-history' && <EditableInspectionHistoryView />}
          {selectedView === 'manage-templates' && <ImprovedInspectionTemplateManager />}
        </div>
      </div>
    </div>
  );
};