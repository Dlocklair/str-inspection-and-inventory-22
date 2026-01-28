import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Building2, ClipboardList, ChevronRight, ChevronDown } from 'lucide-react';

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
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Reset selections when role changes
    setSelectedProperties([]);
    setSelectedTemplatesPerProperty({});
    setExpandedProperties([]);
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
        // Remove property, collapse it, and clear its template selections
        setExpandedProperties(current => current.filter(id => id !== propertyId));
        setSelectedTemplatesPerProperty(current => {
          const updated = { ...current };
          delete updated[propertyId];
          return updated;
        });
        return prev.filter(id => id !== propertyId);
      } else {
        // Add property and auto-expand for inspector role
        if (inviteRole === 'inspector') {
          setExpandedProperties(current => [...current, propertyId]);
        }
        return [...prev, propertyId];
      }
    });
  };

  const togglePropertyExpanded = (propertyId: string) => {
    setExpandedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
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
            <Label className="mb-2 block">
              {inviteRole === 'inspector' ? 'Select Properties & Inspection Templates *' : 'Select Properties *'}
            </Label>
            <div className="space-y-1 max-h-80 overflow-y-auto border rounded-md p-3">
              {properties.map(property => {
                const propertyTemplates = getTemplatesForProperty(property.id);
                const isSelected = selectedProperties.includes(property.id);
                const isExpanded = expandedProperties.includes(property.id);
                const selectedForProperty = selectedTemplatesPerProperty[property.id] || [];
                const showTemplates = inviteRole === 'inspector' && isSelected;
                
                return (
                  <Collapsible
                    key={property.id}
                    open={isExpanded}
                    onOpenChange={() => inviteRole === 'inspector' && togglePropertyExpanded(property.id)}
                  >
                    <div className="flex items-center gap-2 py-1.5">
                      {inviteRole === 'inspector' && (
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            disabled={!isSelected}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      )}
                      <Checkbox
                        id={`property-${property.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleProperty(property.id)}
                      />
                      <label 
                        htmlFor={`property-${property.id}`} 
                        className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {property.name} - {property.address}
                      </label>
                    </div>
                    
                    {showTemplates && (
                      <CollapsibleContent>
                        <div className="pl-10 pb-2 space-y-1.5 border-l-2 border-muted ml-3">
                          {propertyTemplates.length > 0 ? (
                            propertyTemplates.map(template => (
                              <div key={template.id} className="flex items-center space-x-2 pl-3">
                                <Checkbox
                                  id={`template-${property.id}-${template.id}`}
                                  checked={selectedForProperty.includes(template.id)}
                                  onCheckedChange={() => toggleTemplateForProperty(property.id, template.id)}
                                />
                                <label 
                                  htmlFor={`template-${property.id}-${template.id}`} 
                                  className="text-sm cursor-pointer flex items-center gap-2"
                                >
                                  <ClipboardList className="h-3 w-3 text-muted-foreground" />
                                  {template.name}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic pl-3">
                              No templates available for this property
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })}
              {properties.length === 0 && (
                <p className="text-sm text-muted-foreground">No properties available</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {inviteRole === 'inspector' 
                ? 'Select properties and the inspection templates this inspector will be authorized to perform'
                : `Select the properties this ${inviteRole} will have access to`
              }
            </p>
          </div>

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
