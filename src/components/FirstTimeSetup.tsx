import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export const FirstTimeSetup = () => {
  const { user, hasAnyRole, claimOwnerRole } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const checkIfFirstUser = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      // If user already has a role, don't show setup
      if (hasAnyRole()) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if any owners exist
        const { data, error } = await supabase.rpc('has_any_owner');

        if (error) {
          console.error('Error checking for owners:', error);
          setIsChecking(false);
          return;
        }

        // Show setup if no owners exist and user has no role
        setShowSetup(!data);
      } catch (error) {
        console.error('Error in checkIfFirstUser:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkIfFirstUser();
  }, [user, hasAnyRole]);

  const handleClaimOwner = async () => {
    setIsClaiming(true);
    const { error } = await claimOwnerRole();
    setIsClaiming(false);

    if (!error) {
      setShowSetup(false);
    }
  };

  if (isChecking || !showSetup) {
    return null;
  }

  return (
    <Dialog open={showSetup} onOpenChange={setShowSetup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Welcome to STR Management</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>You're the first user to sign in!</p>
            <p className="text-sm">
              As the owner, you'll have full access to all features and can assign roles to other users.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Owner privileges include:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Full access to all modules</li>
              <li>User and role management</li>
              <li>System settings configuration</li>
              <li>Ability to assign owner rights to others</li>
            </ul>
          </div>

          <Button 
            onClick={handleClaimOwner} 
            disabled={isClaiming}
            className="w-full"
            size="lg"
          >
            {isClaiming ? 'Claiming...' : 'Claim Owner Access'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
