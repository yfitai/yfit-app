// ============================================================
// Supabase Edge Function: weekly-feedback-report
//
// Runs every Monday at 8:00 AM (triggered by Supabase cron).
// 1. Queries user_feedback for the past 7 days
// 2. Sends each category to GPT-4 for a plain-language summary
// 3. Builds an HTML email report
// 4. Emails it to support@yfitai.com via Resend
// 5. Marks praise submissions as queued for testimonials
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REPORT_RECIPIENT = "support@yfitai.com";

// ── Types ────────────────────────────────────────────────────
interface FeedbackRow {
  id: string;
  user_id: string | null;
  type: "bug" | "feature_request" | "general" | "praise";
  category: string;
  title: string;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  app_version: string | null;
  created_at: string;
}

// ── GPT-4 Summary ────────────────────────────────────────────
async function summariseCategory(
  categoryName: string,
  items: FeedbackRow[],
  systemPrompt: string
): Promise<string> {
  if (items.length === 0) return `No ${categoryName} submissions this week.`;

  const itemList = items
    .map((r, i) => `${i + 1}. [${r.category}] "${r.title}": ${r.description}`)
    .join("\n");

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
        {
          role: "user",
          content: `Here are this week's ${categoryName} submissions:\n\n${itemList}\n\nPlease provide your analysis.`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error:", await response.text());
    return `Summary unavailable (OpenAI error). ${items.length} submission(s) received.`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "Summary unavailable.";
}

// ── Build HTML Email ─────────────────────────────────────────
function buildEmailHtml(
  weekStart: string,
  weekEnd: string,
  total: number,
  bugSummary: string,
  featureSummary: string,
  feedbackSummary: string,
  praiseSummary: string,
  bugCount: number,
  featureCount: number,
  feedbackCount: number,
  praiseCount: number
): string {
  const sectionStyle =
    "background:#f9fafb;border-left:4px solid;border-radius:8px;padding:20px;margin:20px 0;";
  const labelStyle =
    "display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:12px;";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f3f4f6;padding:30px 20px;margin:0;">
  <div style="max-width:680px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6 0%,#10b981 100%);padding:36px 30px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:26px;font-weight:bold;">📊 YFIT Weekly Feedback Report</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${weekStart} – ${weekEnd}</p>
    </div>

    <!-- Summary bar -->
    <div style="background:#1e293b;padding:20px 30px;display:flex;gap:16px;flex-wrap:wrap;">
      <div style="text-align:center;flex:1;min-width:80px;">
        <div style="color:#f59e0b;font-size:28px;font-weight:bold;">${total}</div>
        <div style="color:#94a3b8;font-size:12px;">Total</div>
      </div>
      <div style="text-align:center;flex:1;min-width:80px;">
        <div style="color:#ef4444;font-size:28px;font-weight:bold;">${bugCount}</div>
        <div style="color:#94a3b8;font-size:12px;">Bugs</div>
      </div>
      <div style="text-align:center;flex:1;min-width:80px;">
        <div style="color:#8b5cf6;font-size:28px;font-weight:bold;">${featureCount}</div>
        <div style="color:#94a3b8;font-size:12px;">Features</div>
      </div>
      <div style="text-align:center;flex:1;min-width:80px;">
        <div style="color:#3b82f6;font-size:28px;font-weight:bold;">${feedbackCount}</div>
        <div style="color:#94a3b8;font-size:12px;">Feedback</div>
      </div>
      <div style="text-align:center;flex:1;min-width:80px;">
        <div style="color:#10b981;font-size:28px;font-weight:bold;">${praiseCount}</div>
        <div style="color:#94a3b8;font-size:12px;">Praise</div>
      </div>
    </div>

    <div style="padding:30px;">

      ${
        bugCount > 0
          ? `
      <!-- Bug Reports -->
      <div style="${sectionStyle}border-color:#ef4444;">
        <span style="${labelStyle}background:#fef2f2;color:#ef4444;">🐛 Bug Reports (${bugCount})</span>
        <div style="white-space:pre-wrap;font-size:14px;color:#374151;">${bugSummary}</div>
      </div>`
          : `<div style="${sectionStyle}border-color:#d1d5db;"><span style="${labelStyle}background:#f3f4f6;color:#9ca3af;">🐛 Bug Reports</span><p style="color:#9ca3af;font-size:14px;margin:0;">No bug reports this week. 🎉</p></div>`
      }

      ${
        featureCount > 0
          ? `
      <!-- Feature Requests -->
      <div style="${sectionStyle}border-color:#8b5cf6;">
        <span style="${labelStyle}background:#f5f3ff;color:#8b5cf6;">💡 Feature Requests (${featureCount})</span>
        <div style="white-space:pre-wrap;font-size:14px;color:#374151;">${featureSummary}</div>
      </div>`
          : `<div style="${sectionStyle}border-color:#d1d5db;"><span style="${labelStyle}background:#f3f4f6;color:#9ca3af;">💡 Feature Requests</span><p style="color:#9ca3af;font-size:14px;margin:0;">No feature requests this week.</p></div>`
      }

      ${
        feedbackCount > 0
          ? `
      <!-- General Feedback -->
      <div style="${sectionStyle}border-color:#3b82f6;">
        <span style="${labelStyle}background:#eff6ff;color:#3b82f6;">💬 General Feedback (${feedbackCount})</span>
        <div style="white-space:pre-wrap;font-size:14px;color:#374151;">${feedbackSummary}</div>
      </div>`
          : `<div style="${sectionStyle}border-color:#d1d5db;"><span style="${labelStyle}background:#f3f4f6;color:#9ca3af;">💬 General Feedback</span><p style="color:#9ca3af;font-size:14px;margin:0;">No general feedback this week.</p></div>`
      }

      ${
        praiseCount > 0
          ? `
      <!-- Praise -->
      <div style="${sectionStyle}border-color:#10b981;">
        <span style="${labelStyle}background:#ecfdf5;color:#10b981;">❤️ Praise / Love It (${praiseCount})</span>
        <div style="white-space:pre-wrap;font-size:14px;color:#374151;">${praiseSummary}</div>
        <p style="font-size:12px;color:#6b7280;margin-top:12px;">These have been queued in Supabase for review as potential testimonials.</p>
      </div>`
          : `<div style="${sectionStyle}border-color:#d1d5db;"><span style="${labelStyle}background:#f3f4f6;color:#9ca3af;">❤️ Praise / Love It</span><p style="color:#9ca3af;font-size:14px;margin:0;">No praise submissions this week.</p></div>`
      }

      <!-- Footer note -->
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:24px;font-size:12px;color:#6b7280;text-align:center;">
        This report was generated automatically every Monday at 8:00 AM.<br>
        View all submissions in your <a href="https://supabase.com/dashboard" style="color:#3b82f6;">Supabase dashboard</a> → Table Editor → user_feedback.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  // Allow both POST (cron trigger) and GET (manual test)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Date range: last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = weekAgo.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const weekEnd = now.toLocaleDateString("en-CA");

    // Fetch all feedback from the past 7 days
    const { data: rows, error: fetchError } = await supabase
      .from("user_feedback")
      .select("*")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    const feedback = (rows ?? []) as FeedbackRow[];
    const bugs = feedback.filter((r) => r.type === "bug");
    const features = feedback.filter((r) => r.type === "feature_request");
    const general = feedback.filter((r) => r.type === "general");
    const praise = feedback.filter((r) => r.type === "praise");

    // If nothing to report, skip email
    if (feedback.length === 0) {
      return new Response(
        JSON.stringify({ message: "No feedback this week. Email skipped." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate GPT-4 summaries in parallel
    const [bugSummary, featureSummary, feedbackSummary, praiseSummary] =
      await Promise.all([
        summariseCategory(
          "Bug Reports",
          bugs,
          `You are a product manager reviewing bug reports for YFIT, an AI fitness app. 
Summarise the bugs in plain language. Group similar issues together. 
Identify the most critical ones. Flag any that appear more than once. 
Keep it under 300 words. Be direct and actionable.`
        ),
        summariseCategory(
          "Feature Requests",
          features,
          `You are a product manager reviewing feature requests for YFIT, an AI fitness app.
Summarise the requests in plain language. Group similar ideas together.
Rank by how frequently the same theme appears. Note any quick wins.
Keep it under 300 words. Be direct and actionable.`
        ),
        summariseCategory(
          "General Feedback",
          general,
          `You are a product manager reviewing general feedback for YFIT, an AI fitness app.
Summarise the key themes in plain language. Note any recurring concerns or compliments.
Keep it under 300 words. Be direct and actionable.`
        ),
        summariseCategory(
          "Praise",
          praise,
          `You are reviewing praise and positive feedback for YFIT, an AI fitness app.
Summarise the highlights in plain language. Note which features users love most.
Identify the best candidate quotes for use as testimonials (copy them verbatim).
Keep it under 200 words.`
        ),
      ]);

    // Mark praise items as testimonial candidates in Supabase
    if (praise.length > 0) {
      const praiseIds = praise.map((r) => r.id);
      await supabase
        .from("user_feedback")
        .update({ testimonial_queued: true })
        .in("id", praiseIds);
    }

    // Build and send the email
    const html = buildEmailHtml(
      weekStart,
      weekEnd,
      feedback.length,
      bugSummary,
      featureSummary,
      feedbackSummary,
      praiseSummary,
      bugs.length,
      features.length,
      general.length,
      praise.length
    );

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "YFIT Reports <reports@yfitai.com>",
        to: [REPORT_RECIPIENT],
        subject: `📊 YFIT Weekly Feedback Report — ${weekStart} to ${weekEnd} (${feedback.length} submissions)`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error(`Resend error: ${errText}`);
    }

    const emailData = await emailRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
        period: `${weekStart} to ${weekEnd}`,
        counts: {
          total: feedback.length,
          bugs: bugs.length,
          features: features.length,
          feedback: general.length,
          praise: praise.length,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("weekly-feedback-report error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
