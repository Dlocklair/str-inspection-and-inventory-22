import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  owner_id: string;
  phone: string | null;
  permissions: any;
}

export const PendingInvitations = () => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invitations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation revoked successfully'
      });

      await fetchInvitations();
    } catch (error: any) {
      console.error('Error revoking invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke invitation',
        variant: 'destructive'
      });
    }
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return { icon: CheckCircle2, label: 'Accepted', color: 'text-green-500' };
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return { icon: XCircle, label: 'Expired', color: 'text-red-500' };
    }
    
    return { icon: Clock, label: 'Pending', color: 'text-yellow-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>View and manage user invitations</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No invitations found
          </p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              const StatusIcon = status.icon;

              return (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      <div>
                        <p className="font-medium">{invitation.full_name}</p>
                        <p className="text-sm text-muted-foreground">{invitation.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">{invitation.role.toUpperCase()}</Badge>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sent: {format(new Date(invitation.created_at), 'MMM d, yyyy')} | 
                      Expires: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {!invitation.accepted_at && (
                    <Button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};