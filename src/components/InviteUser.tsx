import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Building2, ClipboardList } from 'lucide-react';

type AppRole = 'manager' | 'inspector';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface InspectionTemplate {
  id: string;
  name: string;
  property_id: string | null;
}

export const InviteUser = () => {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('manager');
  const [inviteSending, setInviteSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedTemplatesPerProperty, setSelectedTemplatesPerProperty] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchProperties();
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Reset selections when role changes
    setSelectedProperties([]);
    setSelectedTemplatesPerProperty({});
  }, [inviteRole]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address')
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('id, name, property_id')
        .not('property_id', 'is', null)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteFullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (selectedProperties.length === 0) {
      toast({
        title: 'Error',
        description: `Please select at least one property for ${inviteRole}s`,
        variant: 'destructive'
      });
      return;
    }

    if (inviteRole === 'inspector') {
      const allSelectedTemplates = Object.values(selectedTemplatesPerProperty).flat();
      if (allSelectedTemplates.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one inspection template for the inspector',
          variant: 'destructive'
        });
        return;
      }
    }

    setInviteSending(true);

    try {
      const allSelectedTemplates = Object.values(selectedTemplatesPerProperty).flat();
      
      const { data, error } = await supabase.functions.invoke('create-user-invitation', {
        body: {
          email: inviteEmail,
          fullName: inviteFullName,
          role: inviteRole,
          propertyIds: selectedProperties,
          inspectionTypeIds: inviteRole === 'inspector' ? allSelectedTemplates : undefined
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation sent successfully'
      });

      // Reset form
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('manager');
      setSelectedProperties([]);
      setSelectedTemplatesPerProperty({});
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive'
      });
    } finally {
      setInviteSending(false);
    }
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties(prev => {
      const isCurrentlySelected = prev.includes(propertyId);
      if (isCurrentlySelected) {
        // Remove property and clear its template selections
        setSelectedTemplatesPerProperty(current => {
          const updated = { ...current };
          delete updated[propertyId];
          return updated;
        });
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const toggleTemplateForProperty = (propertyId: string, templateId: string) => {
    setSelectedTemplatesPerProperty(prev => {
      const current = prev[propertyId] || [];
      const updated = current.includes(templateId)
        ? current.filter(id => id !== templateId)
        : [...current, templateId];
      return { ...prev, [propertyId]: updated };
    });
  };

  const getTemplatesForProperty = (propertyId: string) => {
    return templates.filter(t => t.property_id === propertyId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite New User</CardTitle>
        <CardDescription>Send an invitation to a new team member</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div>
            <Label htmlFor="inviteFullName">Full Name *</Label>
            <Input
              id="inviteFullName"
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="inviteEmail">Email *</Label>
            <Input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="inviteRole">Role *</Label>
            <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as AppRole)}>
              <SelectTrigger id="inviteRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager - All modules, properties must be assigned</SelectItem>
                <SelectItem value="inspector">Inspector - Limited access, properties & templates required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div>
              <Label className="mb-2 block">Select Properties *</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {properties.map(property => (
                  <div key={property.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`property-${property.id}`}
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={() => toggleProperty(property.id)}
                    />
                    <label htmlFor={`property-${property.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {property.name} - {property.address}
                    </label>
                  </div>
                ))}
                {properties.length === 0 && (
                  <p className="text-sm text-muted-foreground">No properties available</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select the properties this {inviteRole} will have access to
              </p>
            </div>
          </div>

          {inviteRole === 'inspector' && selectedProperties.length > 0 && (
            <div>
              <Label className="mb-2 block">Assign Inspection Templates per Property *</Label>
              <div className="space-y-4 max-h-80 overflow-y-auto border rounded-md p-3">
                {selectedProperties.map(propertyId => {
                  const property = properties.find(p => p.id === propertyId);
                  const propertyTemplates = getTemplatesForProperty(propertyId);
                  const selectedForProperty = selectedTemplatesPerProperty[propertyId] || [];
                  
                  return (
                    <div key={propertyId} className="border-b pb-3 last:border-b-0">
                      <div className="font-medium flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {property?.name}
                      </div>
                      <div className="pl-6 space-y-2">
                        {propertyTemplates.map(template => (
                          <div key={template.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`template-${propertyId}-${template.id}`}
                              checked={selectedForProperty.includes(template.id)}
                              onCheckedChange={() => toggleTemplateForProperty(propertyId, template.id)}
                            />
                            <label 
                              htmlFor={`template-${propertyId}-${template.id}`} 
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              <ClipboardList className="h-3 w-3 text-muted-foreground" />
                              {template.name}
                            </label>
                          </div>
                        ))}
                        {propertyTemplates.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            No templates available for this property
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select the inspection templates this inspector will be authorized to perform for each property
              </p>
            </div>
          )}

          <Button type="submit" disabled={inviteSending} className="w-full">
            {inviteSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
