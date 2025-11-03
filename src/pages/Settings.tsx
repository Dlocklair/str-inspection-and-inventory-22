import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Users, UserPlus, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ManageUsers } from '@/components/ManageUsers';
import { InviteUser } from '@/components/InviteUser';
import { PendingInvitations } from '@/components/PendingInvitations';
import { OwnerProfile } from '@/components/OwnerProfile';

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut, loading, isOwner, rolesLoaded } = useAuth();
  const [activeView, setActiveView] = useState<'users' | 'invite' | 'invitations' | 'owner'>('users');

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || !rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading user...' : 'Loading permissions...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={handleSignOut} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {isOwner() ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Button
                onClick={() => setActiveView('users')}
                variant={activeView === 'users' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col items-start"
              >
                <Users className="h-5 w-5 mb-2" />
                <span className="font-semibold">Manage Current Users</span>
                <span className="text-xs opacity-70">Edit roles & properties</span>
              </Button>

              <Button
                onClick={() => setActiveView('invite')}
                variant={activeView === 'invite' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col items-start"
              >
                <UserPlus className="h-5 w-5 mb-2" />
                <span className="font-semibold">Invite New User</span>
                <span className="text-xs opacity-70">Send invitation</span>
              </Button>

              <Button
                onClick={() => setActiveView('invitations')}
                variant={activeView === 'invitations' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col items-start"
              >
                <Clock className="h-5 w-5 mb-2" />
                <span className="font-semibold">Pending Invitations</span>
                <span className="text-xs opacity-70">View status</span>
              </Button>

              <Button
                onClick={() => setActiveView('owner')}
                variant={activeView === 'owner' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col items-start"
              >
                <Shield className="h-5 w-5 mb-2" />
                <span className="font-semibold">Owner Profile</span>
                <span className="text-xs opacity-70">Edit your profile</span>
              </Button>
            </div>

            <div>
              {activeView === 'users' && <ManageUsers />}
              {activeView === 'invite' && <InviteUser />}
              {activeView === 'invitations' && <PendingInvitations />}
              {activeView === 'owner' && <OwnerProfile />}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only owners can access settings. Please contact your administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;