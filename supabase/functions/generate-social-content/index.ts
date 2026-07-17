// generate-social-content — v2.2.0
// Changes from v2.1.1:
// Changes from v2.1.2:
//   - PROBLEM-FIRST hooks: GPT now leads with a sharp, specific pain point in the first 3 words
//   - Rotating primary hooks: medication angle and form analysis angle alternate each run
//   - Stronger urgency: hooks name the specific consequence, not just the struggle
//   - Verbal CTA updated: ends with "Try YFIT AI free — it's at why-fit-a-i dot com"
// Changes from v2.1.1:
//   - BUGFIX: fetchLatestArticle() was selecting 'content' column which does not exist in scraped_articles.
// Changes from v2.1.0:
//   - BUGFIX: fetchLatestArticle() was ordering by scraped_at (column does not exist).
// Changes from v2.0:
//   - Personal story angle: GPT-4 now writes from a first-person "I used to struggle..." perspective
//   - 6 platform-specific captions: each platform gets a distinct tone, length, and CTA style
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
    `${SUPABASE_URL}/rest/v1/scraped_articles?order=created_at.desc&limit=1&select=title,url,summary`,
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
  // Rotate primary hook angle by day of week — medication on even days, form analysis on odd days
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const primaryHook = dayOfWeek % 2 === 0 ? 'medication' : 'form_analysis';

  const hookGuidance = primaryHook === 'medication'
    ? `PRIMARY HOOK ANGLE — MEDICATION:
  Lead with the specific, named consequence of medications on fitness. The hook must name the medication category or effect in the first 3–5 words.
  Strong hook examples:
  - "My blood pressure meds were making me gain weight. Here's what I wish I knew sooner."
  - "Metformin changed my metabolism. No one told me how to adjust my workouts."
  - "I was exercising every day on SSRIs and getting weaker. This is why."
  - "Beta blockers cap your heart rate. Every calorie calculator I used was wrong because of it."
  The pain is SPECIFIC — not "medication affected my fitness" but "Metformin slowed my metabolism and I didn't know for 8 months."`
    : `PRIMARY HOOK ANGLE — FORM ANALYSIS:
  Lead with the specific, named consequence of bad form — injury, wasted effort, or invisible damage.
  Strong hook examples:
  - "I tore my rotator cuff doing lateral raises wrong. 6 months of physio could have been avoided."
  - "My squats looked fine to me. The AI said my left knee was caving on every single rep."
  - "I was doing planks for 2 years and building nothing. My hips were sagging 3 inches."
  - "The gym mirror doesn't catch what a phone camera does. I had no idea my form was this bad."
  The pain is SPECIFIC — not "bad form is dangerous" but "I was compensating with my lower back on every deadlift and didn't feel it until the injury."`;

  const systemPrompt = `You are a social media content writer for YFIT AI — an AI-powered fitness app for people over 40.

Your writing style is PROBLEM-FIRST, not education-first:
- Open with the SPECIFIC PROBLEM and its SPECIFIC CONSEQUENCE in the first 3–5 words — not a general statement
- The hook must make someone stop scrolling because they recognise their own situation
- Do NOT open with "Did you know..." or "Here's why..." or "The truth about..." — those are education hooks
- DO open with the pain: "My medication was sabotaging my workouts." / "I tore my shoulder doing this wrong."
- First-person always — a real YFIT user over 40 sharing what happened to them
- Story arc: PROBLEM (specific, named) → FAILED ATTEMPTS → DISCOVERY → YFIT as the tool that fixed it
- End with a soft verbal CTA that feels earned, not pushy

${hookGuidance}

YFIT AI features to weave in naturally (match to the hook angle):
- Real-time AI form correction via phone camera — catches compensation patterns, caving knees, hip drop, shoulder imbalance
- Medication-aware workout and calorie plans — adjusts for beta blockers, SSRIs, Metformin, statins, and 200+ others
- AI nutrition scanner — point camera at food for instant macro breakdown adjusted to your medication profile
- Progress tracking with deep analytics — shows what is actually working vs. what is wasted effort

Platform-specific instructions are in the user prompt.`;

  const userPrompt = `Article title: "${article.title}"
Article summary: "${article.summary}"
Run date: ${runDate}

Write 6 platform-specific pieces of content based on this article. Each must use the PROBLEM-FIRST angle — open with the specific pain and its consequence, then move to the discovery and solution. Write as if a real YFIT user over 40 is sharing what actually happened to them.

Return a JSON object with a "content_items" array. Each item must have:
- platform (string): one of tiktok, instagram, youtube, linkedin, pinterest, facebook
- title (string): short post title / video title
- caption (string): the post caption WITHOUT any CTA or link (the CTA is added separately by the pipeline)
- script (string): the voiceover script for the video (60-90 seconds when spoken)
- hashtags (array of strings): 5-8 relevant hashtags

Platform-specific caption requirements:

TIKTOK caption (max 150 chars):
- PROBLEM in first 3 words — name the specific pain or consequence immediately
- First-person, punchy, no warm-up
- End mid-thought to create curiosity (no CTA — pipeline adds it)
- STRONG examples: "My meds were making me gain weight and I had no idea for 8 months 👇" / "I tore my shoulder doing this wrong. Here's what the AI caught that I missed 👇"
- WEAK examples to AVOID: "I used to think..." / "Here's what I learned..." / "Did you know..."

INSTAGRAM caption (max 300 chars):
- PROBLEM in first line — specific and named, not vague
- Second line: the failed attempt or the thing that made it worse
- Third line: the discovery or turning point
- Use line breaks for readability, 1-2 emojis
- No CTA (pipeline adds "link in bio")
- STRONG example: "My beta blocker was capping my heart rate at 120bpm.\n\nEvery calorie calculator I used was built for a healthy heart — not mine.\n\nThis is what I changed when I found out 👇"

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

VOICEOVER SCRIPT (same for all platforms):
- 45-60 seconds when spoken at normal pace (~120-150 words) — shorter holds attention better
- OPEN with the specific problem and consequence — first sentence must name the pain (medication effect OR form injury)
- Second beat: the failed attempt — what they tried that didn't work
- Third beat: the discovery — what YFIT showed them that they couldn't see before
- Fourth beat: the result — specific and measurable if possible
- Natural, conversational speech — write how a real person talks, not how they write
- Mention YFIT AI once by name, naturally woven in
- End with a clear verbal CTA: "If this sounds familiar, try YFIT AI free — it's at why-fit-a-i dot com, or just tap the link in my bio"
- Do NOT end with "I hope this helps" or "let me know in the comments" — end on the CTA

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
