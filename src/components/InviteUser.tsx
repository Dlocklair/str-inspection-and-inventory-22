import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

type AppRole = 'owner' | 'manager' | 'inspector';

interface InspectionType {
  id: string;
  name: string;
}

export const InviteUser = () => {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('inspector');
  const [inviteSending, setInviteSending] = useState(false);
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([]);
  const [selectedInspectionTypes, setSelectedInspectionTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchInspectionTypes();
  }, []);

  const fetchInspectionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('inspection_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setInspectionTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching inspection types:', error);
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

    if (inviteRole === 'inspector' && selectedInspectionTypes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one inspection type for the inspector',
        variant: 'destructive'
      });
      return;
    }

    setInviteSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user-invitation', {
        body: {
          email: inviteEmail,
          fullName: inviteFullName,
          role: inviteRole,
          inspectionTypeIds: inviteRole === 'inspector' ? selectedInspectionTypes : undefined
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
      setInviteRole('inspector');
      setSelectedInspectionTypes([]);
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

  const toggleInspectionType = (typeId: string) => {
    setSelectedInspectionTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
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
                <SelectItem value="owner">Owner - Full access to all modules</SelectItem>
                <SelectItem value="manager">Manager - All modules, properties must be assigned</SelectItem>
                <SelectItem value="inspector">Inspector - Limited access, properties & templates required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteRole === 'inspector' && (
            <div>
              <Label className="mb-2 block">Inspection Types *</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {inspectionTypes.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`invite-${type.id}`}
                      checked={selectedInspectionTypes.includes(type.id)}
                      onCheckedChange={() => toggleInspectionType(type.id)}
                    />
                    <label htmlFor={`invite-${type.id}`} className="text-sm cursor-pointer">
                      {type.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select the inspection types this inspector will be authorized to perform
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