// ============================================================
// Supabase Edge Function: feedback-auto-reply
//
// Called from FeedbackButton.jsx after a successful insert.
// Handles two cases:
//   1. type === 'feedback'  → sends a personalised auto-reply to the user
//   2. type === 'praise'    → sends a warm thank-you + marks testimonial_queued
//
// For bug and feature types: no email is sent (handled by weekly report).
//
// FIX: userEmail is now passed directly in the request body from FeedbackButton.jsx
// to avoid RLS-blocked user_profiles lookups and service role key issues.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutoReplyRequest {
  feedback_id?: string;
  user_id: string;
  userEmail?: string;       // ← passed directly from FeedbackButton.jsx (primary source)
  type: "bug" | "feature_request" | "feedback" | "general" | "praise";
  title: string;
  description: string;
  category: string;
}

// ── Derive first name from email address ─────────────────────
function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  // Handle common patterns: john.doe, john_doe, johndoe123
  const cleaned = local.replace(/[0-9_.\-]+/g, " ").trim();
  const first = cleaned.split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// ── Resolve user email: payload first, then auth.admin fallback ──
async function resolveUserInfo(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payloadEmail?: string
): Promise<{ email: string; firstName: string } | null> {
  // PRIMARY: use email passed directly in the request body
  if (payloadEmail && payloadEmail.includes("@")) {
    // Try to get first name from user_profiles (best effort, non-blocking)
    let firstName = firstNameFromEmail(payloadEmail);
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (profile?.full_name) {
        firstName = profile.full_name.split(" ")[0] ?? firstName;
      }
    } catch {
      // Ignore RLS errors — we already have the email, first name fallback is fine
    }
    return { email: payloadEmail, firstName };
  }

  // FALLBACK: try auth.admin.getUserById (requires service role key)
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      const email = authUser.user.email;
      const firstName =
        authUser.user.user_metadata?.first_name ??
        authUser.user.user_metadata?.full_name?.split(" ")[0] ??
        firstNameFromEmail(email);
      return { email, firstName };
    }
  } catch (err) {
    console.warn("auth.admin.getUserById failed:", err);
  }

  return null;
}

// ── GPT-4 personalised reply for general feedback ────────────
async function generateReply(
  firstName: string,
  title: string,
  description: string,
  category: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly customer support agent for YFIT AI, an AI-powered fitness and nutrition app.
Write a short, warm, personalised reply to a user who submitted general feedback.
Rules:
- Use plain language (7th grade level)
- Be genuine and specific — reference what they actually said
- Keep it to 3-4 short paragraphs
- End with encouragement to keep using the app
- Do NOT promise specific features or timelines
- Sign off as "The YFIT Team"
- Do NOT include a subject line or email headers — just the body text`,
        },
        {
          role: "user",
          content: `User's name: ${firstName}
Category: ${category}
Title: ${title}
Their feedback: ${description}

Write the reply email body.`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    // Fallback to a generic reply if GPT fails
    return `Hi ${firstName},\n\nThank you for taking the time to share your feedback with us. We really appreciate hearing from our users — it helps us make YFIT better for everyone.\n\nWe've received your message and our team will review it carefully.\n\nKeep up the great work on your fitness journey!\n\nThe YFIT Team`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Send email via Resend ────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  bodyText: string,
  firstName: string
): Promise<void> {
  // Convert plain text to simple HTML
  const htmlBody = bodyText
    .split("\n")
    .map((line) => (line.trim() === "" ? "<br>" : `<p style="margin:0 0 12px;font-size:15px;color:#374151;">${line}</p>`))
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:30px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:28px 30px;">
      <h2 style="color:white;margin:0;font-size:20px;">YFIT AI</h2>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Your Intelligent Health Companion</p>
    </div>
    <div style="padding:30px;">
      ${htmlBody}
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
        YFIT AI · <a href="https://yfitai.com" style="color:#3b82f6;">yfitai.com</a> · <a href="mailto:support@yfitai.com" style="color:#3b82f6;">support@yfitai.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "YFIT Team <support@yfitai.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error: ${await res.text()}`);
  }
}

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: AutoReplyRequest = await req.json();
    const { feedback_id, user_id, userEmail, type, title, description, category } = body;

    console.log(`feedback-auto-reply: type=${type}, user_id=${user_id}, hasEmail=${!!userEmail}`);

    // Only handle 'feedback'/'general' and 'praise' types
    // Note: DB stores 'general', FeedbackButton maps it to 'feedback' before calling this function
    // Accept both for robustness
    if (type !== "feedback" && type !== "general" && type !== "praise") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a feedback or praise type" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Anonymous submissions — no email to send
    if (!user_id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Anonymous submission" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userInfo = await resolveUserInfo(supabase, user_id, userEmail);

    if (!userInfo) {
      console.error(`feedback-auto-reply: Could not resolve email for user_id=${user_id}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "Could not resolve user email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, firstName } = userInfo;
    console.log(`feedback-auto-reply: Sending ${type} email to ${email} (${firstName})`);

    if (type === "feedback" || type === "general") {
      // Generate personalised GPT-4 reply
      const replyText = await generateReply(firstName, title, description, category);
      await sendEmail(
        email,
        `Re: Your feedback — ${title}`,
        replyText,
        firstName
      );
    } else if (type === "praise") {
      // Send a warm thank-you and mark as testimonial candidate
      const thankYouText = `Hi ${firstName},\n\nThank you so much for the kind words — messages like yours genuinely make our day! 🙏\n\nWe work hard to make YFIT the best AI fitness companion out there, and knowing it's making a real difference for you means everything to us.\n\nWe'd love to feature your experience on our website to inspire others. If you're happy for us to use your feedback as a testimonial, no action is needed — we may reach out separately to confirm.\n\nKeep crushing your goals!\n\nThe YFIT Team`;

      await sendEmail(
        email,
        "Thank you for the love! 💪",
        thankYouText,
        firstName
      );

      // Mark as testimonial queued (best effort — feedback_id may be undefined)
      if (feedback_id) {
        await supabase
          .from("user_feedback")
          .update({ testimonial_queued: true })
          .eq("id", feedback_id);
      } else {
        // Mark the most recent praise from this user as testimonial_queued
        const { data: recent } = await supabase
          .from("user_feedback")
          .select("id")
          .eq("user_id", user_id)
          .eq("type", "praise")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (recent?.id) {
          await supabase
            .from("user_feedback")
            .update({ testimonial_queued: true })
            .eq("id", recent.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, type, emailSentTo: email }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("feedback-auto-reply error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
