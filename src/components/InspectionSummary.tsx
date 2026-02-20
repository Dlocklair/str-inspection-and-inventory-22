import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, ClipboardCheck, ArrowLeft } from 'lucide-react';

interface InspectionItem {
  id: string;
  description: string;
  completed: boolean;
  status?: 'pass' | 'fail' | 'needs_attention' | 'not_checked';
  notes: string;
  photo_urls?: string[];
}

interface InspectionSummaryProps {
  items: InspectionItem[];
  templateName: string;
  propertyName: string;
  inspectionDate: string;
  onClose: () => void;
}

export const InspectionSummary = ({ items, templateName, propertyName, inspectionDate, onClose }: InspectionSummaryProps) => {
  const totalItems = items.length;
  const passedItems = items.filter(i => i.status === 'pass' || (i.completed && !i.status)).length;
  const failedItems = items.filter(i => i.status === 'fail').length;
  const needsAttention = items.filter(i => i.status === 'needs_attention').length;
  const notChecked = items.filter(i => i.status === 'not_checked' || (!i.completed && !i.status)).length;
  
  const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
  
  const getOverallStatus = () => {
    if (failedItems > 0) return { label: 'Issues Found', color: 'destructive' as const, icon: XCircle };
    if (needsAttention > 0) return { label: 'Needs Attention', color: 'default' as const, icon: AlertTriangle };
    if (notChecked > 0) return { label: 'Incomplete', color: 'secondary' as const, icon: ClipboardCheck };
    return { label: 'All Passed', color: 'default' as const, icon: CheckCircle };
  };

  const overall = getOverallStatus();

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <overall.icon className={`h-12 w-12 ${failedItems > 0 ? 'text-destructive' : needsAttention > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
        </div>
        <CardTitle className="text-xl">Inspection Summary</CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">{templateName}</p>
          <p>{propertyName} • {inspectionDate}</p>
        </div>
        <Badge variant={overall.color} className="mx-auto mt-2">
          {overall.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Pass Rate</span>
            <span className="font-bold">{passRate}%</span>
          </div>
          <Progress value={passRate} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{passedItems}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-2xl font-bold text-destructive">{failedItems}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{needsAttention}</div>
              <div className="text-xs text-muted-foreground">Attention</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{notChecked}</div>
              <div className="text-xs text-muted-foreground">Not Checked</div>
            </div>
          </div>
        </div>

        {/* Failed/Attention Items Detail */}
        {(failedItems > 0 || needsAttention > 0) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Items Requiring Follow-up</h4>
            {items
              .filter(i => i.status === 'fail' || i.status === 'needs_attention')
              .map(item => (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded bg-muted/50 text-sm">
                  {item.status === 'fail' ? (
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.notes && <p className="text-muted-foreground">{item.notes}</p>}
                    {item.photo_urls && item.photo_urls.length > 0 && (
                      <p className="text-xs text-primary">{item.photo_urls.length} photo(s) attached</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        <Button onClick={onClose} variant="outline" className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Start New Inspection
        </Button>
      </CardContent>
    </Card>
  );
};
