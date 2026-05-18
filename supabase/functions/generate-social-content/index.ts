// generate-social-content — v2.1.0
// Changes from v2.0:
//   - Personal story angle: GPT-4 now writes from a first-person "I used to struggle..." perspective
//   - 6 platform-specific captions: each platform gets a distinct tone, length, and CTA style
//   - Link-in-bio CTAs: TikTok and Instagram explicitly say "link in bio"
//   - Facebook: short caption (link goes in first comment via n8n)
//   - LinkedIn: professional tone, full URL
//   - YouTube: SEO-optimised description with full URL
//   - Pinterest: discovery-focused, full URL
// Deploy: paste this file into Supabase Dashboard → Edge Functions → generate-social-content → Edit

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL")!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
  platform: string;
  caption: string;
  script: string;
  hashtags: string[];
  title?: string;
}

interface GenerateRequest {
  run_date?: string;
  dry_run?: boolean;
  force_article_url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchLatestArticle(): Promise<{
  title: string;
  url: string;
  summary: string;
} | null> {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/scraped_articles?order=scraped_at.desc&limit=1&select=title,url,summary,content`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );
  const rows = await resp.json();
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

async function generateContent(
  article: { title: string; url: string; summary: string },
  runDate: string
): Promise<ContentItem[]> {
  const systemPrompt = `You are a social media content writer for YFIT AI — an AI-powered fitness app for people over 40.

Your writing style is:
- FIRST-PERSON PERSONAL STORY: Always start from "I" — a real person sharing their own struggle and discovery.
  Example opener: "I used to think crunches were the answer. Then I found out they were making things worse..."
  NOT: "Did you know crunches aren't the best..." (that's the old style — avoid it)
- Relatable and warm, not clinical or salesy
- The person telling the story is a real YFIT user (over 40, health-conscious, busy life)
- The story arc is always: struggle → discovery → transformation → YFIT as the tool that helped
- End with a soft CTA that feels natural, not pushy

YFIT AI features to weave in naturally:
- Real-time AI form correction (watches your movement via phone camera)
- Personalised workout plans that adapt to your health conditions and medications
- AI nutrition scanner (point camera at food for instant macro breakdown)
- Progress tracking with deep analytics

Platform-specific instructions are in the user prompt.`;

  const userPrompt = `Article title: "${article.title}"
Article summary: "${article.summary}"
Run date: ${runDate}

Write 6 platform-specific pieces of content based on this article. Each must use the PERSONAL STORY angle — write as if a real YFIT user is sharing their experience.

Return a JSON object with a "content_items" array. Each item must have:
- platform (string): one of tiktok, instagram, youtube, linkedin, pinterest, facebook
- title (string): short post title / video title
- caption (string): the post caption WITHOUT any CTA or link (the CTA is added separately by the pipeline)
- script (string): the voiceover script for the video (60-90 seconds when spoken)
- hashtags (array of strings): 5-8 relevant hashtags

Platform-specific caption requirements:

TIKTOK caption (max 150 chars):
- Hook in first 5 words — must stop the scroll
- First-person, punchy, conversational
- End mid-thought to create curiosity (no CTA — pipeline adds it)
- Example: "I did crunches every day for 3 months and my muffin top got WORSE. Here's what actually worked 👇"

INSTAGRAM caption (max 300 chars):
- Personal story hook, then 2-3 lines of value
- Use line breaks for readability
- 1-2 relevant emojis
- No CTA (pipeline adds "link in bio")
- Example: "Three months of crunches. Zero results.\n\nTurns out I was targeting the wrong muscles the whole time.\n\nHere are the 5 moves that finally worked for me 👇"

YOUTUBE description (150-300 chars):
- SEO-friendly title hook
- Brief personal story setup
- Mention YFIT AI naturally
- No URL (pipeline adds it)

LINKEDIN caption (200-400 chars):
- Professional but personal tone
- Frame as a lesson learned or insight
- Suitable for a health-conscious professional audience
- Slightly longer, more reflective
- No URL (pipeline adds it)

PINTEREST caption (100-200 chars):
- Discovery-focused, inspirational
- Feels like a pin someone would save
- Action-oriented but not pushy
- No URL (pipeline adds it)

FACEBOOK caption (max 200 chars):
- Conversational, community-feel
- Short — the link goes in the first comment, not the caption
- Warm and inviting, like a post from a friend
- No URL (pipeline adds it in a comment)

VOICEOVER SCRIPT (same for all platforms — use the Instagram story as base):
- 60-90 seconds when spoken at normal pace (~150-200 words)
- First-person story arc: struggle → discovery → YFIT solution
- Natural, conversational speech (not formal)
- Mention YFIT AI once, naturally
- End with a soft spoken CTA: "Try YFIT AI free — link in bio or find us at why-fit-a-i dot com"

Return ONLY valid JSON, no markdown fences.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  const parsed = JSON.parse(raw);
  return parsed.content_items as ContentItem[];
}

async function saveToDatabase(
  runDate: string,
  articleTitle: string,
  articleUrl: string,
  contentItems: ContentItem[]
): Promise<void> {
  for (const item of contentItems) {
    await fetch(`${SUPABASE_URL}/rest/v1/generated_content`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        run_date: runDate,
        platform: item.platform,
        article_title: articleTitle,
        article_url: articleUrl,
        caption: item.caption,
        script: item.script,
        hashtags: item.hashtags,
        title: item.title,
        created_at: new Date().toISOString(),
      }),
    });
  }
}

async function triggerN8nWebhook(payload: object): Promise<void> {
  const resp = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`n8n webhook error: ${resp.status} — ${text}`);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    const body: GenerateRequest = req.method === "POST" ? await req.json() : {};
    const runDate =
      body.run_date ?? new Date().toISOString().split("T")[0];
    const dryRun = body.dry_run === true;

    console.log(`[generate-social-content] run_date=${runDate} dry_run=${dryRun}`);

    // 1. Fetch the latest scraped article
    const article = await fetchLatestArticle();
    if (!article) {
      return new Response(
        JSON.stringify({ error: "No scraped articles found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log(`[generate-social-content] article="${article.title}"`);

    // 2. Generate 6 platform-specific content items via GPT-4o
    const contentItems = await generateContent(article, runDate);
    console.log(`[generate-social-content] generated ${contentItems.length} items`);

    // 3. Save to database
    if (!dryRun) {
      await saveToDatabase(runDate, article.title, article.url, contentItems);
      console.log(`[generate-social-content] saved to generated_content`);
    }

    // 4. Determine content angle from the article title
    const contentAngle = article.title
      .replace(/[^a-z0-9\s]/gi, "")
      .substring(0, 60)
      .trim();

    // 5. Trigger n8n webhook to start the video pipeline
    const webhookPayload = {
      run_date: runDate,
      content_angle: contentAngle,
      article_title: article.title,
      article_url: article.url,
      pexels_query: "fitness workout exercise over 40",
      content_items: contentItems,
      dry_run: dryRun,
    };

    if (!dryRun) {
      await triggerN8nWebhook(webhookPayload);
      console.log(`[generate-social-content] n8n webhook triggered`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_date: runDate,
        article_title: article.title,
        content_items_count: contentItems.length,
        dry_run: dryRun,
        content_items: dryRun ? contentItems : undefined,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[generate-social-content] ERROR:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
