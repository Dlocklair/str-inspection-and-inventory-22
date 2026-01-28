import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const InvitationSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  fullName: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'.\-]+$/, "Name contains invalid characters"),
  role: z.enum(['manager', 'inspector'], { errorMap: () => ({ message: "Role must be 'manager' or 'inspector'" }) }),
  propertyIds: z.array(z.string().uuid("Invalid property ID format")).max(50, "Too many properties").optional(),
  inspectionTypeIds: z.array(z.string().uuid("Invalid inspection type ID format")).max(100, "Too many inspection types").optional()
});

type InvitationRequest = z.infer<typeof InvitationSchema>;

// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // 10 invitations per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
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
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 10 invitations per hour." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user is an owner
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError || !userRoles?.some(r => r.role === 'owner')) {
      return new Response(
        JSON.stringify({ error: "Only owners can send invitations" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the owner's profile
    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .single();

    if (profileError || !ownerProfile) {
      return new Response(
        JSON.stringify({ error: "Owner profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = InvitationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, fullName, role, propertyIds, inspectionTypeIds }: InvitationRequest = validationResult.data;

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
      return new Response(
        JSON.stringify({ error: "Failed to create invitation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If inspector role and inspection types provided, log them
    if (role === 'inspector' && inspectionTypeIds && inspectionTypeIds.length > 0) {
      console.log(`Inspection type IDs for inspector: ${inspectionTypeIds.join(", ")}`);
    }

    // Construct invitation URL safely
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/accept-invitation?token=${encodeURIComponent(invitation.invitation_token)}`;

    // Escape HTML in user-provided content for email
    const escapeHtml = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const safeFullName = escapeHtml(fullName);
    const safeOwnerName = escapeHtml(ownerProfile.full_name || 'Property Owner');

    const emailResponse = await resend.emails.send({
      from: "Property Management <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join as ${role}`,
      html: `
        <h1>You've Been Invited!</h1>
        <p>Hi ${safeFullName},</p>
        <p><strong>${safeOwnerName}</strong> has invited you to join their property management system as a <strong>${role}</strong>.</p>
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

    // Store property IDs and inspection type IDs in invitation metadata
    const permissions: Record<string, string[]> = {};
    
    if (propertyIds && propertyIds.length > 0) {
      permissions.property_ids = propertyIds;
    }
    
    if (role === 'inspector' && inspectionTypeIds && inspectionTypeIds.length > 0) {
      permissions.inspection_type_ids = inspectionTypeIds;
    }
    
    if (Object.keys(permissions).length > 0) {
      await supabase
        .from("invitations")
        .update({ permissions })
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
  } catch (error: unknown) {
    console.error("Error in create-user-invitation function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
