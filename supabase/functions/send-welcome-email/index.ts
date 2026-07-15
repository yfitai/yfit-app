// ============================================================
// Supabase Edge Function: send-welcome-email
// Sends welcome email to new users via Resend
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY" );

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
}

async function sendWelcomeEmail(to: string, firstName: string): Promise<string | null> {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Welcome to YFIT AI! 🎉</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName}! 👋</h2>
              
              <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
                We're thrilled to have you join the YFIT family! You're now part of a community that's transforming fitness with AI-powered coaching.
              </p>
              
              <div style="background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #1f2937;">🚀 Get Started in 3 Easy Steps:</h3>
                <ol style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 10px 0;"><strong>Set Your Goals:</strong> Tell us what you want to achieve</li>
                  <li style="margin: 10px 0;"><strong>Log Your First Workout:</strong> Use our AI form analysis feature</li>
                  <li style="margin: 10px 0;"><strong>Track Your Nutrition:</strong> Scan meals with your camera</li>
                </ol>
              </div>
              
              <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 20px; border-radius: 12px; margin: 30px 0;">
                <h3 style="color: white; margin-top: 0;">🎁 Your Free Month Includes:</h3>
                <ul style="color: white; margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">✅ AI-powered form analysis</li>
                  <li style="margin: 8px 0;">✅ Nutrition scanning & tracking</li>
                  <li style="margin: 8px 0;">✅ Personalized workout plans</li>
                  <li style="margin: 8px 0;">✅ Progress analytics & insights</li>
                  <li style="margin: 8px 0;">✅ 24/7 AI coaching support</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://yfit-app.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100% ); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                  Launch YFIT App →
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 10px 0;">
                <strong>Need help?</strong> Our AI support team is here 24/7. Just tap the "Contact Support" button in the app!
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin: 10px 0;">
                Stay strong,  

                <strong>The YFIT AI Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                YFIT AI - Your Personal Fitness Coach
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                <a href="https://yfitai.com" style="color: #3b82f6; text-decoration: none;">yfitai.com</a> | 
                <a href="mailto:support@yfitai.com" style="color: #3b82f6; text-decoration: none;">support@yfitai.com</a>
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;

    const text = `Hi ${firstName}!

Welcome to YFIT AI! 🎉

We're thrilled to have you join the YFIT family! You're now part of a community that's transforming fitness with AI-powered coaching.

Get Started in 3 Easy Steps:
1. Set Your Goals: Tell us what you want to achieve
2. Log Your First Workout: Use our AI form analysis feature
3. Track Your Nutrition: Scan meals with your camera

Your Free Month Includes:
✅ AI-powered form analysis
✅ Nutrition scanning & tracking
✅ Personalized workout plans
✅ Progress analytics & insights
✅ 24/7 AI coaching support

Launch YFIT App: https://yfit-app.vercel.app

Need help? Our AI support team is here 24/7. Just tap the "Contact Support" button in the app!

Stay strong,
The YFIT AI Team

---
YFIT AI - Your Personal Fitness Coach
yfitai.com | support@yfitai.com`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YFIT AI <support@yfitai.com>",
        to: [to],
        subject: "Welcome to YFIT AI - Let's Get Started! 🎉",
        html: html,
        text: text,
      } ),
    });

    const data = await response.json();
    return response.ok ? data.id : null;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailData: WelcomeEmailData = await req.json();

    console.log(`📧 Sending welcome email to ${emailData.email}`);

    const messageId = await sendWelcomeEmail(
      emailData.email,
      emailData.firstName
    );

    if (messageId) {
      console.log(`✅ Welcome email sent (Message ID: ${messageId})`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Welcome email sent",
          messageId: messageId,
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    } else {
      throw new Error("Failed to send welcome email");
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
            ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
