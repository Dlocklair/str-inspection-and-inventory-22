import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const escapeHtml = (str: string) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

interface ExpiringWarranty {
  product_name: string;
  warranty_expiration_date: string;
  vendor: string | null;
  manufacturer: string | null;
  cost: number | null;
  property_name: string | null;
  days_until_expiry: number;
}

function generateEmailHtml(warranties: ExpiringWarranty[]) {
  const urgent = warranties.filter(w => w.days_until_expiry <= 1);
  const soon = warranties.filter(w => w.days_until_expiry > 1 && w.days_until_expiry <= 7);
  const upcoming = warranties.filter(w => w.days_until_expiry > 7);

  const renderRows = (items: ExpiringWarranty[]) => items.map(w => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 600;">${escapeHtml(w.product_name)}</td>
      <td style="padding: 12px; text-align: center;">${w.property_name ? escapeHtml(w.property_name) : '—'}</td>
      <td style="padding: 12px; text-align: center;">${w.warranty_expiration_date}</td>
      <td style="padding: 12px; text-align: center; font-weight: 600; color: ${w.days_until_expiry <= 1 ? '#dc2626' : w.days_until_expiry <= 7 ? '#d97706' : '#059669'};">${w.days_until_expiry} day${w.days_until_expiry !== 1 ? 's' : ''}</td>
      <td style="padding: 12px; text-align: center;">${w.vendor ? escapeHtml(w.vendor) : '—'}</td>
      <td style="padding: 12px; text-align: center;">${w.cost ? `$${w.cost.toFixed(2)}` : '—'}</td>
    </tr>
  `).join('');

  const renderSection = (title: string, emoji: string, color: string, items: ExpiringWarranty[]) => {
    if (items.length === 0) return '';
    return `
      <div style="margin: 24px 0;">
        <h3 style="color: ${color}; margin-bottom: 12px;">${emoji} ${title} (${items.length})</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; font-size: 14px;">Product</th>
              <th style="padding: 12px; text-align: center; font-size: 14px;">Property</th>
              <th style="padding: 12px; text-align: center; font-size: 14px;">Expires</th>
              <th style="padding: 12px; text-align: center; font-size: 14px;">Days Left</th>
              <th style="padding: 12px; text-align: center; font-size: 14px;">Vendor</th>
              <th style="padding: 12px; text-align: center; font-size: 14px;">Cost</th>
            </tr>
          </thead>
          <tbody>${renderRows(items)}</tbody>
        </table>
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 32px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🛡️ Warranty Expiration Alert</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${warranties.length} warrant${warranties.length !== 1 ? 'ies' : 'y'} expiring soon</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">The following warranties are approaching their expiration dates. Review and take action to renew or replace coverage as needed.</p>
          ${renderSection('Expiring Today / Tomorrow', '🔴', '#dc2626', urgent)}
          ${renderSection('Expiring Within 7 Days', '🟡', '#d97706', soon)}
          ${renderSection('Expiring Within 30 Days', '🟢', '#059669', upcoming)}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <p style="color: #6b7280; font-size: 14px;"><em>This is an automated message from STR Manager.</em></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;

    // Verify owner/manager role
    const { data: roles } = await supabaseClient.rpc('get_user_roles', { _user_id: userId });
    const userRoles = roles?.map((r: { role: string }) => r.role) || [];
    if (!userRoles.includes('owner') && !userRoles.includes('manager')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get recipients from request body or notification_settings
    const body = await req.json().catch(() => ({}));
    let recipients: string[] = body.recipients || [];

    if (recipients.length === 0) {
      // Fall back to notification_settings
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const { data: settings } = await supabaseClient
          .from('notification_settings')
          .select('notification_emails')
          .eq('user_id', profile.id)
          .single();

        recipients = settings?.notification_emails || [];
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No notification recipients configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch warranties expiring within 30 days
    const today = new Date();
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    const { data: warranties, error: wError } = await supabaseClient
      .from('warranties')
      .select('product_name, warranty_expiration_date, vendor, manufacturer, cost, properties(name)')
      .gte('warranty_expiration_date', today.toISOString().split('T')[0])
      .lte('warranty_expiration_date', thirtyDaysOut.toISOString().split('T')[0])
      .order('warranty_expiration_date', { ascending: true });

    if (wError) {
      console.error('Error fetching warranties:', wError);
      return new Response(JSON.stringify({ error: 'Failed to fetch warranties' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!warranties || warranties.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No warranties expiring within 30 days', count: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const expiringWarranties: ExpiringWarranty[] = warranties.map((w: any) => {
      const expDate = new Date(w.warranty_expiration_date + 'T12:00:00');
      const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        product_name: w.product_name,
        warranty_expiration_date: w.warranty_expiration_date,
        vendor: w.vendor,
        manufacturer: w.manufacturer,
        cost: w.cost,
        property_name: w.properties?.name || null,
        days_until_expiry: daysLeft,
      };
    });

    const htmlContent = generateEmailHtml(expiringWarranties);
    const urgentCount = expiringWarranties.filter(w => w.days_until_expiry <= 7).length;
    const subject = urgentCount > 0
      ? `🚨 ${urgentCount} Warrant${urgentCount !== 1 ? 'ies' : 'y'} Expiring Soon — Action Required`
      : `🛡️ ${expiringWarranties.length} Warrant${expiringWarranties.length !== 1 ? 'ies' : 'y'} Expiring Within 30 Days`;

    const emailResponse = await resend.emails.send({
      from: 'STR Manager <onboarding@resend.dev>',
      to: recipients,
      subject,
      html: htmlContent,
    });

    console.log('Warranty expiration email sent:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: `Warranty expiration alert sent to ${recipients.length} recipient(s)`,
      count: expiringWarranties.length,
      urgent: urgentCount,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Error in send-warranty-expiration-emails:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};

serve(handler);
