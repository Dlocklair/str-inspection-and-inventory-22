import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone_numbers: string[];
  email_addresses: string[];
  preferred_contact_method: 'email' | 'sms' | 'both';
  is_active: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

type AppRole = 'owner' | 'manager' | 'inspector';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  claimOwnerRole: () => Promise<{ error?: any }>;
  isOwner: () => boolean;
  isManager: () => boolean;
  isInspector: () => boolean;
  hasAnyRole: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const fetchRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      console.log('Fetching roles for user:', userId);
      const { data, error } = await supabase
        .rpc('get_user_roles', { _user_id: userId });

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      console.log('Roles fetched:', data);
      return (data || []).map((r: any) => r.role as AppRole);
    } catch (error) {
      console.error('Error in fetchRoles:', error);
      return [];
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const refreshRoles = async () => {
    if (user) {
      const rolesData = await fetchRoles(user.id);
      setRoles(rolesData);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Failsafe: ensure loading becomes false after 5 seconds max
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false');
        setLoading(false);
        setRolesLoaded(true); // Mark as loaded even on timeout
      }
    }, 5000);

    // Set up auth state listener - only handles state changes after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);

        setSession(session);
        setUser(session?.user ?? null);
        
        // Only fetch profile and roles on state change if we have a user
        if (session?.user) {
          setRolesLoaded(false);
          try {
            const [profileData, rolesData] = await Promise.all([
              fetchProfile(session.user.id),
              fetchRoles(session.user.id)
            ]);
            
            if (mounted) {
              setProfile(profileData);
              setRoles(rolesData);
              setRolesLoaded(true);
            }
          } catch (error) {
            console.error('Error loading user data in auth state change:', error);
            if (mounted) {
              setProfile(null);
              setRoles([]);
              setRolesLoaded(true); // Mark as loaded even on error
            }
          }
        } else {
          setProfile(null);
          setRoles([]);
          setRolesLoaded(true);
        }
      }
    );

    // Initial session check - this is the primary data load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      clearTimeout(timeoutId);
      setSession(session);
      setUser(session?.user ?? null);

      // Set loading to false immediately - we have the auth state
      setLoading(false);

      // Fetch profile and roles if user exists
      if (session?.user) {
        try {
          const [profileData, rolesData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchRoles(session.user.id)
          ]);
          
          if (mounted) {
            setProfile(profileData);
            setRoles(rolesData);
            setRolesLoaded(true);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          if (mounted) {
            setProfile(null);
            setRoles([]);
            setRolesLoaded(true); // Mark as loaded even on error
          }
        }
      } else {
        setRolesLoaded(true); // No user, so roles are "loaded" (empty)
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        clearTimeout(timeoutId);
        setLoading(false);
        setRolesLoaded(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase without setting loading state to prevent loops
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force immediate redirect to auth page
      window.location.replace('/auth');
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Clear state even on error and redirect
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.replace('/auth');
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Email sent",
        description: "Please check your email for the verification link.",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        toast({
          title: "Failed to send reset email",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Reset email sent",
        description: "Please check your email for the password reset link.",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const claimOwnerRole = async () => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'owner'
        });

      if (error) {
        toast({
          title: "Failed to claim owner role",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Refresh roles
      await refreshRoles();

      toast({
        title: "Owner role claimed",
        description: "You now have full access to the system.",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Failed to claim owner role",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const isOwner = () => roles.includes('owner');
  const isManager = () => roles.includes('manager');
  const isInspector = () => roles.includes('inspector');
  const hasAnyRole = () => roles.length > 0;

  const value = {
    user,
    session,
    profile,
    roles,
    loading: loading || !rolesLoaded, // Show loading until both auth and roles are ready
    signUp,
    signIn,
    signOut,
    refreshProfile,
    refreshRoles,
    resendVerificationEmail,
    resetPassword,
    claimOwnerRole,
    isOwner,
    isManager,
    isInspector,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};