import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface DamageItem {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe';
  reportedDate: string;
  reportDate: string;
  estimatedCost: number;
  status: 'reported' | 'assessed' | 'approved' | 'in-repair' | 'completed';
  photos: (File | string)[];
  notes: string;
  responsibleParty: 'guest' | 'owner' | 'other' | 'no-fault';
  repairDate?: string;
  propertyId?: string;
  propertyName?: string;
}

interface DamageReportCardProps {
  report: DamageItem;
  isEditing: boolean;
  editingData: Partial<DamageItem>;
  isOwner: boolean;
  onStartEdit: (report: DamageItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onEditingDataChange: (data: Partial<DamageItem>) => void;
  severityColors: Record<string, string>;
  statusColors: Record<string, string>;
}

export function DamageReportCard({
  report,
  isEditing,
  editingData,
  isOwner,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onMarkComplete,
  onEditingDataChange,
  severityColors,
  statusColors,
}: DamageReportCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editingData.title || ''}
              onChange={(e) => onEditingDataChange({ ...editingData, title: e.target.value })}
            />
            <Textarea
              value={editingData.description || ''}
              onChange={(e) => onEditingDataChange({ ...editingData, description: e.target.value })}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select 
                value={editingData.status} 
                onValueChange={(value: any) => onEditingDataChange({ ...editingData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="assessed">Assessed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in-repair">In Repair</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Estimated cost"
                value={editingData.estimatedCost || ''}
                onChange={(e) => onEditingDataChange({ ...editingData, estimatedCost: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSaveEdit} size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" onClick={onCancelEdit} size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{report.title}</h3>
                <p className="text-muted-foreground">{report.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{report.location}</Badge>
                  <Badge variant={severityColors[report.severity] as any}>
                    {report.severity}
                  </Badge>
                  <Badge variant={statusColors[report.status] as any}>
                    {report.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onMarkComplete(report.id)}>
                  Mark Complete
                </Button>
                {isOwner && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onStartEdit(report)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the damage report "{report.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(report.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Reported:</span> {format(new Date(report.reportedDate), 'PPP')}
              </div>
              <div>
                <span className="font-medium">Est. Cost:</span> ${report.estimatedCost.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Responsible Party:</span> {report.responsibleParty === 'no-fault' ? 'No Fault' : 
                  report.responsibleParty.charAt(0).toUpperCase() + report.responsibleParty.slice(1)}
              </div>
              <div>
                <span className="font-medium">Report Date:</span> {format(new Date(report.reportDate + 'T12:00:00'), 'PPP')}
              </div>
            </div>
            {report.notes && (
              <div className="pt-2 border-t">
                <span className="font-medium">Notes:</span> {report.notes}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
