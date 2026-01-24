import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  fullName: string;
  role: 'manager' | 'inspector';
  inspectionTypeIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is an owner
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError || !userRoles?.some(r => r.role === 'owner')) {
      throw new Error("Only owners can send invitations");
    }

    // Get the owner's profile
    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (profileError || !ownerProfile) {
      throw new Error("Owner profile not found");
    }

    const { email, fullName, role, inspectionTypeIds }: InvitationRequest = await req.json();

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .insert({
        owner_id: ownerProfile.id,
        email,
        full_name: fullName,
        role,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      throw new Error("Failed to create invitation");
    }

    // If inspector role and inspection types provided, create permissions
    if (role === 'inspector' && inspectionTypeIds && inspectionTypeIds.length > 0) {
      // We'll create these after the user accepts the invitation
      // For now, just log them
      console.log(`Inspection type IDs for inspector: ${inspectionTypeIds.join(", ")}`);
    }

    // Send invitation email
    const invitationUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'http://localhost:5173'}/accept-invitation?token=${invitation.invitation_token}`;

    const emailResponse = await resend.emails.send({
      from: "Property Management <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join as ${role}`,
      html: `
        <h1>You've Been Invited!</h1>
        <p>Hi ${fullName},</p>
        <p><strong>${ownerProfile.full_name}</strong> has invited you to join their property management system as a <strong>${role}</strong>.</p>
        ${role === 'inspector' && inspectionTypeIds && inspectionTypeIds.length > 0 
          ? `<p>You'll have access to specific inspection types once you accept this invitation.</p>` 
          : ''}
        <p><a href="${invitationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Accept Invitation</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${invitationUrl}</p>
        <p>This invitation will expire in 7 days.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Store inspection type IDs in invitation metadata if inspector
    if (role === 'inspector' && inspectionTypeIds && inspectionTypeIds.length > 0) {
      await supabase
        .from("invitations")
        .update({ 
          permissions: { inspection_type_ids: inspectionTypeIds } 
        })
        .eq("id", invitation.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        message: "Invitation sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
