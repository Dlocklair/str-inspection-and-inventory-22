import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useDamageReports, type DamageReport as DamageReportType } from '@/hooks/useDamageReports';
import DamageReportHistoryEnhanced from './DamageReportHistoryEnhanced';
import { DamageReportForm } from './DamageReportForm';
import { DamageReportDetail } from './DamageReportDetail';
import { DamageReportList } from './DamageReportList';

export const DamageReport = () => {
  const [searchParams] = useSearchParams();
  const { selectedProperty, propertyMode, userProperties, setSelectedProperty } = usePropertyContext();

  // Pass propertyId to scope queries
  const propertyId = propertyMode === 'property' ? selectedProperty?.id : undefined;
  const { reports: damageReports, updateReport, deleteReport: deleteReportApi } = useDamageReports(propertyId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DamageReportType>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<DamageReportType | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [locations, setLocations] = useState<string[]>([
    'Living Room', 'Kitchen', 'Main Bathroom', 'Guest Bathroom',
    'Master Bedroom', 'Guest Bedroom', 'Exterior', 'Hallway', 'Dining Room'
  ].sort());

  // URL view parameter
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'new') {
      setShowHistory(false);
      setSelectedHistoryReport(null);
      setShowAddForm(true);
      setActiveTab('active');
    } else if (view === 'pending') {
      setShowHistory(false);
      setSelectedHistoryReport(null);
      setShowAddForm(false);
      setActiveTab('pending');
    } else if (view === 'history') {
      setShowAddForm(false);
      setSelectedHistoryReport(null);
      setShowHistory(true);
    }
  }, [searchParams]);

  // Auto-select property if user only has one
  useEffect(() => {
    if (userProperties.length === 1 && !selectedProperty) {
      setSelectedProperty(userProperties[0]);
    }
  }, [userProperties.length, selectedProperty, setSelectedProperty]);

  // Load/save locations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('damage-locations');
    if (saved) setLocations(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('damage-locations', JSON.stringify(locations));
  }, [locations]);

  const startEditing = (report: DamageReportType) => {
    setEditingReport(report.id);
    setEditingData({ ...report });
  };

  const saveEdit = async () => {
    if (editingReport && editingData) {
      await updateReport(editingReport, {
        title: editingData.title,
        description: editingData.description,
        status: editingData.status,
        estimated_value: editingData.estimated_value,
        notes: editingData.notes,
        severity: editingData.severity,
        responsible_party: editingData.responsible_party,
      });
      setEditingReport(null);
      setEditingData({});
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await updateReport(id, { status });
  };

  const getHistoryData = () => {
    return damageReports.map(report => ({
      id: report.id,
      title: report.title || report.description,
      description: report.description,
      severity: (report.severity === 'minor' ? 'low' : report.severity === 'moderate' ? 'medium' : 'high') as 'low' | 'medium' | 'high',
      status: report.status as 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed',
      location: report.location,
      assignedTo: report.responsible_party,
      estimatedCost: report.estimated_value || undefined,
      images: report.photo_urls || [],
      notes: report.notes || '',
      createdAt: report.damage_date,
      updatedAt: report.updated_at,
      propertyId: report.property_id || undefined,
      propertyName: report.property_name || undefined,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Damage Reports</h1>
            <p className="text-muted-foreground">Track and manage property damage reports and repairs</p>
          </div>

          {/* History View */}
          {showHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowHistory(false)} className="text-sm text-primary hover:underline">← Back to Reports</button>
              </div>
              <DamageReportHistoryEnhanced
                reports={getHistoryData()}
                onViewReport={(report) => {
                  const original = damageReports.find(r => r.id === report.id);
                  if (original) {
                    setSelectedHistoryReport(original);
                    setShowHistory(false);
                  }
                }}
                propertyMode={propertyMode}
                properties={userProperties}
              />
            </div>
          )}

          {/* Detail View */}
          {selectedHistoryReport && !showHistory && (
            <DamageReportDetail
              report={selectedHistoryReport}
              onBack={() => { setSelectedHistoryReport(null); setShowHistory(true); }}
              onReportChange={setSelectedHistoryReport}
            />
          )}

          {/* Main View */}
          {!showHistory && !selectedHistoryReport && (
            <>
              {showAddForm ? (
                <DamageReportForm
                  onClose={() => setShowAddForm(false)}
                  locations={locations}
                  onUpdateLocations={setLocations}
                />
              ) : (
                <DamageReportList
                  reports={damageReports}
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  onShowAddForm={() => setShowAddForm(true)}
                  onShowHistory={() => setShowHistory(true)}
                  onStartEditing={startEditing}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingReport(null)}
                  onDelete={(id) => deleteReportApi(id)}
                  onMarkComplete={(id) => updateStatus(id, 'completed')}
                  onUpdateStatus={updateStatus}
                  editingReport={editingReport}
                  editingData={editingData}
                  onEditingDataChange={setEditingData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
