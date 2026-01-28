import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const InventoryItemSchema = z.object({
  id: z.string().uuid("Invalid item ID"),
  name: z.string().min(1).max(200),
  category: z.string().max(100),
  currentStock: z.number().int().min(0),
  restockLevel: z.number().int().min(0),
  unit: z.string().max(50),
  supplier: z.string().max(200),
  supplierUrl: z.string().url().max(2000).optional().or(z.literal('')),
  cost: z.number().min(0),
  notes: z.string().max(1000).optional().default('')
});

const EmailRequestSchema = z.object({
  items: z.array(InventoryItemSchema).min(1, "At least one item required").max(100, "Too many items"),
  recipients: z.array(z.string().email("Invalid email format")).min(1, "At least one recipient required").max(20, "Too many recipients")
});

type InventoryItem = z.infer<typeof InventoryItemSchema>;
type EmailRequest = z.infer<typeof EmailRequestSchema>;

// Simple in-memory rate limiting (per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // 5 emails per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Escape HTML to prevent XSS
const escapeHtml = (str: string) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const generateEmailHtml = (items: InventoryItem[]) => {
  const itemsHtml = items.map(item => {
    const safeName = escapeHtml(item.name);
    const safeCategory = escapeHtml(item.category);
    const safeUnit = escapeHtml(item.unit);
    const safeSupplier = escapeHtml(item.supplier);
    
    // Validate and sanitize supplier URL
    let supplierLink = 'N/A';
    if (item.supplierUrl && item.supplierUrl.trim()) {
      try {
        const url = item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`;
        const parsedUrl = new URL(url);
        // Only allow http and https protocols
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
          supplierLink = `<a href="${escapeHtml(url)}" style="color: #06b6d4; text-decoration: none;">Product Link</a>`;
        }
      } catch {
        // Invalid URL, skip
      }
    }
    
    return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left; font-weight: 600;">${safeName}</td>
      <td style="padding: 12px; text-align: center; color: #6b7280;">${safeCategory}</td>
      <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600;">${item.currentStock} ${safeUnit}</td>
      <td style="padding: 12px; text-align: center;">${item.restockLevel} ${safeUnit}</td>
      <td style="padding: 12px; text-align: center;">${safeSupplier}</td>
      <td style="padding: 12px; text-align: center;">$${item.cost.toFixed(2)}</td>
      <td style="padding: 12px; text-align: center;">${supplierLink}</td>
    </tr>
  `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventory Restock Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 32px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🏨 Inventory Restock Request</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Urgent restocking needed for ${items.length} item${items.length > 1 ? 's' : ''}</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Dear Supplier Team,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
              We have identified ${items.length} inventory item${items.length > 1 ? 's' : ''} that ${items.length > 1 ? 'have' : 'has'} fallen below restock levels and require immediate attention. Please process the following restock orders at your earliest convenience.
            </p>

            <!-- Items Table -->
            <div style="overflow-x: auto; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 16px 12px; text-align: left; font-weight: 700; color: #374151; font-size: 14px;">Item Name</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Category</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Current Stock</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Restock Level</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Supplier</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Cost/Unit</th>
                    <th style="padding: 16px 12px; text-align: center; font-weight: 700; color: #374151; font-size: 14px;">Product Link</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
                <h3 style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">Restock Summary</h3>
              </div>
              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                <strong>Total Items Requiring Restock:</strong> ${items.length}<br>
                <strong>Estimated Total Value:</strong> $${items.reduce((total, item) => total + (item.cost * Math.max(item.restockLevel - item.currentStock, item.restockLevel)), 0).toFixed(2)}<br>
                <strong>Request Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 32px 0;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Please confirm receipt of this request and provide estimated delivery timelines.
              </p>
            </div>

            <!-- Contact Info -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>Best regards,</strong><br>
                Inventory Management Team<br>
                <em>This is an automated message from our inventory management system.</em>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Rate limiting by IP (or fallback identifier)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 restock emails per hour.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = EmailRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { items, recipients }: EmailRequest = validationResult.data;

    console.log(`Processing restock email for ${items.length} items to ${recipients.length} recipients`);

    // Generate email content
    const emailSubject = `🏨 Inventory Restock Request - ${items.length} Item${items.length > 1 ? 's' : ''} Need Restocking`;
    const htmlContent = generateEmailHtml(items);
    
    // Plain text fallback with escaped content
    const textContent = `Inventory Restock Request

Dear Supplier Team,

We need to restock the following ${items.length} inventory item${items.length > 1 ? 's' : ''}:

${items.map(item => {
  let urlText = '';
  if (item.supplierUrl && item.supplierUrl.trim()) {
    try {
      const url = item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`;
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        urlText = `\n  Product URL: ${url}`;
      }
    } catch {
      // Invalid URL, skip
    }
  }
  return `
• ${item.name} (${item.category})
  Current Stock: ${item.currentStock} ${item.unit}
  Restock Level: ${item.restockLevel} ${item.unit}
  Supplier: ${item.supplier}
  Cost per Unit: $${item.cost.toFixed(2)}${urlText}
`;
}).join('\n')}

Total Items: ${items.length}
Estimated Total Value: $${items.reduce((total, item) => total + (item.cost * Math.max(item.restockLevel - item.currentStock, item.restockLevel)), 0).toFixed(2)}
Request Date: ${new Date().toLocaleDateString()}

Please process these restock orders at your earliest convenience and confirm receipt of this request.

Best regards,
Inventory Management Team`;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Inventory Management <onboarding@resend.dev>',
      to: recipients,
      subject: emailSubject,
      html: htmlContent,
      text: textContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Restock request email sent successfully to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
        emailId: emailResponse.data?.id,
        itemCount: items.length,
        recipients: recipients.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    console.error('Error in send-inventory-emails function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send restock request email',
        details: errorMessage,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
