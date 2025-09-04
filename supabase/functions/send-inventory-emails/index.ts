import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  restockLevel: number;
  unit: string;
  supplier: string;
  supplierUrl?: string;
  cost: number;
  notes: string;
}

interface EmailRequest {
  items: InventoryItem[];
  recipients: string[];
}

const generateEmailHtml = (items: InventoryItem[]) => {
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left; font-weight: 600;">${item.name}</td>
      <td style="padding: 12px; text-align: center; color: #6b7280;">${item.category}</td>
      <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600;">${item.currentStock} ${item.unit}</td>
      <td style="padding: 12px; text-align: center;">${item.restockLevel} ${item.unit}</td>
      <td style="padding: 12px; text-align: center;">${item.supplier}</td>
      <td style="padding: 12px; text-align: center;">$${item.cost.toFixed(2)}</td>
      <td style="padding: 12px; text-align: center;">
        ${item.supplierUrl ? `<a href="${item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`}" style="color: #06b6d4; text-decoration: none;">Product Link</a>` : 'N/A'}
      </td>
    </tr>
  `).join('');

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
    const { items, recipients }: EmailRequest = await req.json();

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items provided for restocking' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No email recipients provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing restock email for ${items.length} items to ${recipients.length} recipients`);

    // Generate email content
    const emailSubject = `🏨 Inventory Restock Request - ${items.length} Item${items.length > 1 ? 's' : ''} Need Restocking`;
    const htmlContent = generateEmailHtml(items);
    
    // Plain text fallback
    const textContent = `Inventory Restock Request

Dear Supplier Team,

We need to restock the following ${items.length} inventory item${items.length > 1 ? 's' : ''}:

${items.map(item => `
• ${item.name} (${item.category})
  Current Stock: ${item.currentStock} ${item.unit}
  Restock Level: ${item.restockLevel} ${item.unit}
  Supplier: ${item.supplier}
  Cost per Unit: $${item.cost.toFixed(2)}${item.supplierUrl ? `
  Product URL: ${item.supplierUrl.startsWith('http') ? item.supplierUrl : `https://${item.supplierUrl}`}` : ''}
`).join('\n')}

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

  } catch (error: any) {
    console.error('Error in send-inventory-emails function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send restock request email',
        details: error.message,
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