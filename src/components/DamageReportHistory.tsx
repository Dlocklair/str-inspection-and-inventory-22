import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  location: string;
  assignedTo: string;
  estimatedCost?: number;
  actualCost?: number;
  images: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface DamageReportHistoryProps {
  reports: DamageItem[];
  onViewReport: (report: DamageItem) => void;
}

const DamageReportHistory: React.FC<DamageReportHistoryProps> = ({ reports, onViewReport }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-success hover:bg-success/90 text-success-foreground';
      case 'medium': return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      case 'high': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      default: return 'bg-muted hover:bg-muted/90';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-muted hover:bg-muted/90';
      case 'assessed': return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      case 'approved': return 'bg-success hover:bg-success/90 text-success-foreground';
      case 'in-repair': return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      case 'completed': return 'bg-success hover:bg-success/90 text-success-foreground';
      default: return 'bg-muted hover:bg-muted/90';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Damage Report History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedReports.length > 0 ? (
          <div className="space-y-4">
            {sortedReports.map(report => (
              <div 
                key={report.id} 
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-foreground">{report.title}</h4>
                      <Badge className={cn("text-xs", getSeverityColor(report.severity))}>
                        {report.severity}
                      </Badge>
                      <Badge className={cn("text-xs", getStatusColor(report.status))}>
                        {report.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </div>
                      
                      <div>Location: {report.location}</div>
                      
                      <div>Assigned: {report.assignedTo}</div>
                      
                      {report.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Est: ${report.estimatedCost.toFixed(2)}
                        </div>
                      )}
                      
                      {report.actualCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Actual: ${report.actualCost.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {report.images.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {report.images.length} image{report.images.length !== 1 ? 's' : ''} attached
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {/* Only show edit button for owners - will be handled by parent component */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No damage reports found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DamageReportHistory;