import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invitation link");
      navigate("/");
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*, profiles!invitations_owner_id_fkey(full_name)")
        .eq("invitation_token", token)
        .is("accepted_at", null)
        .single();

      if (error || !data) {
        toast.error("Invitation not found or already accepted");
        navigate("/");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error("This invitation has expired");
        navigate("/");
        return;
      }

      setInvitation(data);
      setEmail(data.email || "");
    } catch (error) {
      console.error("Error validating invitation:", error);
      toast.error("Failed to validate invitation");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setProcessing(true);

    try {
      let userId: string;

      if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password, invitation.full_name);
        
        if (signUpError) {
          toast.error(signUpError.message || "Failed to create account");
          setProcessing(false);
          return;
        }

        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (!newUser) {
          throw new Error("Failed to get user after signup");
        }
        userId = newUser.id;
      } else {
        const { error: signInError } = await signIn(email, password);
        
        if (signInError) {
          toast.error("Invalid email or password");
          setProcessing(false);
          return;
        }

        // Get the signed in user
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        if (!signedInUser) {
          throw new Error("Failed to get user after signin");
        }
        userId = signedInUser.id;
      }

      // Get the user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Mark invitation as accepted
      await supabase
        .from("invitations")
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by: userId,
        })
        .eq("id", invitation.id);

      // Assign role
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: invitation.role,
          assigned_by: invitation.owner_id,
        });

      // If inspector, create inspection permissions
      if (invitation.role === 'inspector' && invitation.permissions?.inspection_type_ids) {
        const permissionsToCreate = invitation.permissions.inspection_type_ids.map((typeId: string) => ({
          inspector_id: profile.id,
          inspection_type_id: typeId,
          granted_by: invitation.owner_id,
        }));

        await supabase
          .from("inspector_inspection_permissions")
          .insert(permissionsToCreate);
      }

      toast.success("Welcome! Your account has been set up successfully.");
      navigate("/");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
          <CardDescription>
            <strong>{invitation.profiles?.full_name || 'Someone'}</strong> has invited you to join as a <strong>{invitation.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                required
                minLength={6}
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              {mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-primary hover:underline"
                  >
                    Sign in instead
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
