// ============================================================
// Supabase Edge Function: feedback-auto-reply
//
// Called from FeedbackButton.jsx after a successful insert.
// Handles two cases:
//   1. type === 'general'  → searches FAQ database first, then sends a
//                            personalised GPT-4 reply grounded in YFIT docs
//   2. type === 'praise'   → sends a warm thank-you + marks testimonial_queued
//
// For bug and feature_request types: no email is sent (handled by weekly report).
//
// FAQ-GROUNDED REPLY FLOW (general):
//   1. Extract keywords from the user's title + description
//   2. Search faq_articles using Postgres full-text search (ilike on question/keywords)
//   3. If matches found → pass top 3 FAQ answers to GPT as context
//   4. GPT writes a reply grounded in the actual YFIT documentation
//   5. If no FAQ matches → GPT replies from general knowledge (fallback)
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
  userEmail?: string;
  type: "bug" | "feature_request" | "feedback" | "general" | "praise";
  title: string;
  description: string;
  category: string;
}

interface FaqArticle {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

// ── Derive first name from email address ─────────────────────
function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  const cleaned = local.replace(/[0-9_.\-]+/g, " ").trim();
  const first = cleaned.split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// ── Resolve user email ────────────────────────────────────────
async function resolveUserInfo(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payloadEmail?: string
): Promise<{ email: string; firstName: string } | null> {
  if (payloadEmail && payloadEmail.includes("@")) {
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
    } catch { /* ignore RLS errors */ }
    return { email: payloadEmail, firstName };
  }

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

// ── Search FAQ articles for relevant matches ─────────────────
// Uses ilike pattern matching on question text and keywords array.
// Returns up to 3 most relevant articles.
async function searchFaq(
  supabase: ReturnType<typeof createClient>,
  title: string,
  description: string
): Promise<FaqArticle[]> {
  try {
    // Extract meaningful search terms (words > 3 chars, skip common words)
    const stopWords = new Set([
      "the", "and", "for", "are", "but", "not", "you", "all", "can",
      "her", "was", "one", "our", "out", "day", "get", "has", "him",
      "his", "how", "its", "may", "new", "now", "old", "see", "two",
      "way", "who", "did", "its", "let", "put", "say", "she", "too",
      "use", "that", "this", "with", "have", "from", "they", "will",
      "been", "when", "what", "your", "does", "into", "more", "also",
      "than", "then", "them", "some", "just", "like", "very", "even",
      "back", "good", "know", "take", "want", "make", "give", "most",
    ]);

    const combined = `${title} ${description}`.toLowerCase();
    const terms = combined
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w))
      .slice(0, 8); // use up to 8 key terms

    if (terms.length === 0) return [];

    // Build OR conditions: search question text for each term
    // Also check if any term appears in the keywords array
    const orConditions = terms
      .map((t) => `question.ilike.%${t}%,answer.ilike.%${t}%`)
      .join(",");

    const { data, error } = await supabase
      .from("faq_articles")
      .select("id, question, answer, keywords")
      .eq("is_published", true)
      .or(orConditions)
      .limit(6);

    if (error) {
      console.warn("FAQ search error:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Score results by how many search terms appear in the question/answer
    const scored = (data as FaqArticle[]).map((article) => {
      const text = `${article.question} ${article.answer} ${(article.keywords ?? []).join(" ")}`.toLowerCase();
      const score = terms.filter((t) => text.includes(t)).length;
      return { article, score };
    });

    // Return top 3 by relevance score
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.article);
  } catch (err) {
    console.warn("FAQ search failed:", err);
    return [];
  }
}

// ── GPT-4 reply grounded in FAQ context ──────────────────────
async function generateReply(
  firstName: string,
  title: string,
  description: string,
  category: string,
  faqMatches: FaqArticle[]
): Promise<string> {
  const hasFaqContext = faqMatches.length > 0;

  // Build FAQ context block if we have matches
  const faqContext = hasFaqContext
    ? faqMatches
        .map(
          (f, i) =>
            `FAQ ${i + 1}:\nQ: ${f.question}\nA: ${f.answer}`
        )
        .join("\n\n")
    : "";

  const systemPrompt = hasFaqContext
    ? `You are a friendly customer support agent for YFIT AI, an AI-powered fitness and nutrition app.
A user has submitted a question or feedback via the app. You have been given relevant FAQ articles from the YFIT knowledge base to help answer them accurately.

Rules:
- Use the FAQ content provided to give a specific, accurate answer about YFIT
- Use plain language (7th grade level) — keep it simple and friendly
- Be warm and personal — use the user's first name
- Keep it to 3-4 short paragraphs
- If the FAQ directly answers their question, explain the steps clearly
- If the FAQ only partially answers it, answer what you can and invite them to reply for more help
- End with encouragement to keep using the app
- Do NOT promise specific features or timelines
- Sign off as "The YFIT Team"
- Do NOT include a subject line or email headers — just the body text

YFIT FAQ Knowledge Base (use this to answer accurately):
${faqContext}`
    : `You are a friendly customer support agent for YFIT AI, an AI-powered fitness and nutrition app.
Write a short, warm, personalised reply to a user who submitted general feedback or a question.
Rules:
- Use plain language (7th grade level)
- Be genuine and specific — reference what they actually said
- Keep it to 3-4 short paragraphs
- End with encouragement to keep using the app and invite them to reply if they need more help
- Do NOT promise specific features or timelines
- Sign off as "The YFIT Team"
- Do NOT include a subject line or email headers — just the body text`;

  const userPrompt = `User's name: ${firstName}
Category: ${category}
Title: ${title}
Their message: ${description}

Write the reply email body.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error:", await response.text());
    return `Hi ${firstName},\n\nThank you for reaching out! We've received your message and our team will get back to you shortly.\n\nIn the meantime, you can find answers to many common questions in the FAQ section inside the YFIT app — just tap the AI Coach icon and select Help.\n\nKeep up the great work on your fitness journey!\n\nThe YFIT Team`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Send email via Resend ─────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  bodyText: string
): Promise<void> {
  const htmlBody = bodyText
    .split("\n")
    .map((line) =>
      line.trim() === ""
        ? "<br>"
        : `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${line}</p>`
    )
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
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
        <br><br>
        <span style="font-size:11px;">Need more help? Reply to this email or visit the FAQ in the YFIT app.</span>
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

    // Only handle 'general'/'feedback' and 'praise' types
    if (type !== "feedback" && type !== "general" && type !== "praise") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a general/praise type" }),
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

    if (type === "feedback" || type === "general") {
      // Step 1: Search FAQ database for relevant articles
      const faqMatches = await searchFaq(supabase, title, description);
      console.log(`feedback-auto-reply: Found ${faqMatches.length} FAQ matches for "${title}"`);

      // Step 2: Generate GPT reply grounded in FAQ context (or general knowledge if no matches)
      const replyText = await generateReply(firstName, title, description, category, faqMatches);

      // Step 3: Send the email
      const subject = faqMatches.length > 0
        ? `Re: ${title} — YFIT Support`
        : `Re: Your message — ${title}`;

      await sendEmail(email, subject, replyText);

      console.log(`feedback-auto-reply: Sent ${faqMatches.length > 0 ? "FAQ-grounded" : "general"} reply to ${email}`);

      return new Response(
        JSON.stringify({
          success: true,
          type,
          emailSentTo: email,
          faqMatchCount: faqMatches.length,
          faqGrounded: faqMatches.length > 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (type === "praise") {
      const thankYouText = `Hi ${firstName},\n\nThank you so much for the kind words — messages like yours genuinely make our day! 🙏\n\nWe work hard to make YFIT the best AI fitness companion out there, and knowing it's making a real difference for you means everything to us.\n\nWe'd love to feature your experience on our website to inspire others. If you're happy for us to use your feedback as a testimonial, no action is needed — we may reach out separately to confirm.\n\nKeep crushing your goals!\n\nThe YFIT Team`;

      await sendEmail(email, "Thank you for the love! 💪", thankYouText);

      // Mark as testimonial candidate
      if (feedback_id) {
        await supabase
          .from("user_feedback")
          .update({ testimonial_queued: true })
          .eq("id", feedback_id);
      } else {
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

      return new Response(
        JSON.stringify({ success: true, type, emailSentTo: email }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ skipped: true, reason: "Unhandled type" }),
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
