import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trash2, UserPlus, Users, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAllInspectionTemplates } from '@/hooks/useInspectionTemplates';
import { useAllAssignments, useCreateAssignment, useDeleteAssignment } from '@/hooks/useInspectionAssignments';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const InspectionAssignmentManager = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { selectedProperty, userProperties } = usePropertyContext();
  const { data: templates = [] } = useAllInspectionTemplates();
  const { data: assignments = [] } = useAllAssignments();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');

  // Fetch users with roles
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_emails');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter templates by selected property dropdown
  const filteredTemplates = filterPropertyId === 'all'
    ? templates
    : templates.filter(t => t.property_id === filterPropertyId);

  const handleAssign = () => {
    if (!selectedTemplateId || !selectedUserId || !profile) {
      toast({ title: 'Required fields', description: 'Select both a template and user.', variant: 'destructive' });
      return;
    }
    createAssignment.mutate({
      template_id: selectedTemplateId,
      assigned_to: selectedUserId,
      assigned_by: profile.id,
    });
    setSelectedUserId('');
  };

  const getTemplateName = (templateId: string) => templates.find(t => t.id === templateId)?.name || 'Unknown';
  const getPropertyName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.property_id) return 'Unassigned';
    return properties.find(p => p.id === template.property_id)?.name || 'Unknown';
  };
  const getUserName = (userId: string) => users.find((u: any) => u.profile_id === userId)?.full_name || 'Unknown';

  // Group assignments by template
  const groupedAssignments = assignments.reduce((groups, a) => {
    if (!groups[a.template_id]) groups[a.template_id] = [];
    groups[a.template_id].push(a);
    return groups;
  }, {} as Record<string, typeof assignments>);

  return (
    <div className="space-y-6">
      {/* Assign new */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Assign Inspection Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Property</Label>
              <Select value={filterPropertyId} onValueChange={(v) => { setFilterPropertyId(v); setSelectedTemplateId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inspection Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.property_id ? `(${properties.find(p => p.id === t.property_id)?.name || ''})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.profile_id} value={u.profile_id}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAssign} disabled={!selectedTemplateId || !selectedUserId} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedAssignments).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No inspection assignments yet. Assign templates to users above.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAssignments).map(([templateId, templateAssignments]) => (
                <div key={templateId} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getPropertyName(templateId)}</span>
                    <span className="font-medium">{getTemplateName(templateId)}</span>
                    <Badge variant="secondary">{templateAssignments.length} assigned</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {templateAssignments.map(a => (
                      <Badge key={a.id} variant="outline" className="flex items-center gap-1 py-1 px-3">
                        {getUserName(a.assigned_to)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 inline-btn"
                          onClick={() => deleteAssignment.mutate(a.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
