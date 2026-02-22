import { useDamageReports, type DamageReport } from '@/hooks/useDamageReports';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface OpenDamageReportsViewProps {
  onBack: () => void;
  onEditReport: (reportId: string) => void;
}

export const OpenDamageReportsView = ({ onBack, onEditReport }: OpenDamageReportsViewProps) => {
  // Fetch ALL reports (no property filter)
  const { reports } = useDamageReports();
  const { userProperties } = usePropertyContext();

  // Filter to unresolved only
  const openReports = reports.filter(
    r => r.status !== 'completed' && r.status !== 'resolved'
  );

  // Group by property_id
  const grouped = openReports.reduce<Record<string, DamageReport[]>>((acc, report) => {
    const key = report.property_id || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(report);
    return acc;
  }, {});

  const getPropertyName = (propertyId: string) => {
    if (propertyId === 'unassigned') return 'Unassigned Property';
    const prop = userProperties.find(p => p.id === propertyId);
    return prop?.name || 'Unknown Property';
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'destructive';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'reported': return 'Reported';
      case 'assessed': return 'Assessed';
      case 'approved': return 'Approved';
      case 'in-repair': return 'In Repair';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </button>
        <h2 className="text-xl font-semibold text-foreground">Open Damage Reports</h2>
      </div>

      {Object.keys(grouped).length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No open damage reports found.
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([propertyId, reports]) => (
        <Card key={propertyId}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              {getPropertyName(propertyId)}
              <Badge variant="outline" className="ml-2">{reports.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {report.title || report.description}
                    </span>
                    <Badge variant={severityColor(report.severity)} className="text-xs">
                      {report.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {statusLabel(report.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{report.location}</span>
                    <span>{format(new Date(report.damage_date + 'T12:00:00'), 'MMM d, yyyy')}</span>
                    {report.estimated_value != null && report.estimated_value > 0 && (
                      <span className="font-medium text-foreground">
                        ${report.estimated_value.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditReport(report.id)}
                  className="ml-3 shrink-0"
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
