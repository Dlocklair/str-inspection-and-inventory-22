import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, History, Settings as TemplateIcon, Clock, UserPlus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NewInspectionForm } from './NewInspectionForm';
import { EditableInspectionHistoryView } from './EditableInspectionHistoryView';
import { ImprovedInspectionTemplateManager } from './ImprovedInspectionTemplateManager';
import { UpcomingInspections } from './UpcomingInspections';
import { InspectionAssignmentManager } from './InspectionAssignmentManager';

export const InspectionReport = () => {
  const { isOwner, isManager } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewFromUrl = searchParams.get('view') || 'new-inspection';
  const [selectedView, setSelectedView] = useState<string>(viewFromUrl);

  useEffect(() => {
    const view = searchParams.get('view') || 'new-inspection';
    setSelectedView(view);
  }, [searchParams]);

  const handleViewChange = (newView: string) => {
    setSelectedView(newView);
    setSearchParams({ view: newView });
  };

  const canManageAssignments = isOwner() || isManager();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Inspection Reports</h1>
            <p className="text-muted-foreground">Manage property inspection checklists and records</p>
          </div>

          <div className="flex justify-center">
            <Select value={selectedView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select inspection view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-inspection">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> New Inspection</div>
                </SelectItem>
                <SelectItem value="inspection-history">
                  <div className="flex items-center gap-2"><History className="h-4 w-4" /> Inspection History</div>
                </SelectItem>
                <SelectItem value="upcoming">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Upcoming Inspections</div>
                </SelectItem>
                <SelectItem value="manage-templates">
                  <div className="flex items-center gap-2"><TemplateIcon className="h-4 w-4" /> Manage Templates</div>
                </SelectItem>
                {canManageAssignments && (
                  <SelectItem value="assignments">
                    <div className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Assign Inspections</div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedView === 'new-inspection' && (
            <NewInspectionForm onNavigateToTemplateManager={() => handleViewChange('manage-templates')} />
          )}
          {selectedView === 'inspection-history' && <EditableInspectionHistoryView />}
          {selectedView === 'upcoming' && <UpcomingInspections />}
          {selectedView === 'manage-templates' && <ImprovedInspectionTemplateManager />}
          {selectedView === 'assignments' && canManageAssignments && <InspectionAssignmentManager />}
        </div>
      </div>
    </div>
  );
};
