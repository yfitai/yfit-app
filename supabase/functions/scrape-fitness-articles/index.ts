// ============================================================
// YFIT Edge Function: scrape-fitness-articles (FIXED v2)
// Runs at 2:00 AM daily via pg_cron (or on-demand)
// Scrapes 10 verified RSS sources, scores relevance with GPT-4o-mini,
// stores top articles in scraped_articles table
//
// FIXES vs v1:
//  - Insert uses correct column name 'url' (not 'source_url' for article link)
//  - automation_logs update uses 'articles_processed' (not 'articles_scraped')
//  - Improved RSS parser handles Atom <entry> tags in addition to <item>
//  - Added fallback User-Agent to avoid 403s on some feeds
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// YFIT-relevant keywords for quick pre-filter before GPT scoring
const YFIT_KEYWORDS = [
  "nutrition", "fitness", "workout", "exercise", "weight loss", "muscle",
  "protein", "calories", "diet", "health", "wellness", "cardio", "strength",
  "medication", "supplement", "recovery", "sleep", "stress", "metabolism",
  "body composition", "meal prep", "macros", "intermittent fasting", "HIIT",
  "form", "posture", "injury prevention", "flexibility", "mobility",
  "running", "cycling", "swimming", "yoga", "pilates", "lifting",
  "fat", "lean", "endurance", "performance", "hydration", "vitamin",
];

interface RssSource {
  id: string;
  name: string;
  rss_url: string;
  category: string;
}

interface ParsedArticle {
  source_id: string;
  source_name: string;
  source_url: string;  // the source website (e.g. menshealth.com)
  url: string;         // the article URL
  title: string;
  summary: string;
  published_at: string | null;
  category: string;
}

// Parse RSS/Atom XML and extract articles
function parseRssFeed(xml: string, source: RssSource): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  // Support both RSS <item> and Atom <entry> tags
  const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title = extractTag(item, "title");
    const description =
      extractTag(item, "description") ||
      extractTag(item, "summary") ||
      extractTag(item, "content") ||
      "";
    // For Atom feeds, link may be in <link href="..."/> or <link>...</link>
    const link =
      extractAtomLink(item) ||
      extractTag(item, "link") ||
      extractTag(item, "guid") ||
      "";
    const pubDate =
      extractTag(item, "pubDate") ||
      extractTag(item, "published") ||
      extractTag(item, "updated") ||
      extractTag(item, "dc:date") ||
      null;

    if (!title || title.length < 10) continue;

    // Quick relevance pre-filter — must contain at least one YFIT keyword
    const combined = (title + " " + description).toLowerCase();
    const hasKeyword = YFIT_KEYWORDS.some((kw) => combined.includes(kw));
    if (!hasKeyword) continue;

    // Strip HTML from description
    const cleanSummary = description
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 500);

    // Derive source website from the RSS URL
    let sourceWebsite = "";
    try {
      sourceWebsite = new URL(source.rss_url).origin;
    } catch {
      sourceWebsite = source.rss_url;
    }

    articles.push({
      source_id: source.id,
      source_name: source.name,
      source_url: sourceWebsite,
      url: link,
      title: title.replace(/<[^>]+>/g, "").trim(),
      summary: cleanSummary,
      published_at: pubDate ? new Date(pubDate).toISOString() : null,
      category: source.category,
    });
  }

  return articles.slice(0, 5); // Max 5 per source
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i"
  );
  const match = regex.exec(xml);
  return match ? match[1].trim() : "";
}

// Extract href from Atom <link href="..."/> self-closing tags
function extractAtomLink(xml: string): string {
  const regex = /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i;
  const match = regex.exec(xml);
  return match ? match[1].trim() : "";
}

// Score article relevance to YFIT using GPT-4o-mini
async function scoreArticleRelevance(
  articles: ParsedArticle[]
): Promise<Array<ParsedArticle & { relevance_score: number }>> {
  if (articles.length === 0) return [];

  const articleList = articles
    .map(
      (a, i) =>
        `${i + 1}. Title: "${a.title}"\n   Summary: "${a.summary.substring(0, 200)}"`
    )
    .join("\n\n");

  const prompt = `You are scoring fitness and health articles for relevance to YFIT AI, a fitness app that uniquely combines:
- AI-powered workout coaching with real-time form analysis
- Medication-aware nutrition planning (tracks how medications affect fitness)
- Personalized meal planning and macro tracking
- Progress analytics

Score each article from 0.0 to 1.0 based on how useful it would be as content for YFIT's social media audience (health-conscious adults aged 25-50 who want to improve fitness, many of whom take medications).

Articles that score highest (0.8-1.0):
- Medication effects on exercise/nutrition
- AI in fitness/health
- Personalized nutrition science
- Form and injury prevention
- Weight loss with health conditions

Articles that score lowest (0.0-0.3):
- Celebrity gossip with fitness angle
- Extreme diets
- Supplement ads
- Unrelated health topics

Return ONLY a JSON array of numbers, one per article, in order. Example: [0.9, 0.4, 0.7, 0.2, 0.8]

Articles to score:
${articleList}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "[]";
    // Extract JSON array even if model adds extra text
    const jsonMatch = content.match(/\[[\d.,\s]+\]/);
    const scores: number[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return articles.map((article, i) => ({
      ...article,
      relevance_score: scores[i] ?? 0.5,
    }));
  } catch (error) {
    console.error("GPT scoring failed, using default scores:", error);
    return articles.map((article) => ({ ...article, relevance_score: 0.5 }));
  }
}

Deno.serve(async (_req) => {
  const startTime = Date.now();

  // Log run start
  const { data: logEntry } = await supabase
    .from("automation_logs")
    .insert({ run_type: "scrape", status: "started" })
    .select()
    .single();

  try {
    // Get active RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("is_active", true);

    if (sourcesError || !sources || sources.length === 0) {
      throw new Error("Failed to fetch RSS sources or no active sources found");
    }

    console.log(`Scraping ${sources.length} RSS sources...`);

    let allArticles: ParsedArticle[] = [];

    // Scrape each source in parallel
    const scrapePromises = sources.map(async (source: RssSource) => {
      try {
        const response = await fetch(source.rss_url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; YFIT-Bot/2.0; +https://yfit.app/bot)",
            Accept:
              "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!response.ok) {
          console.warn(
            `Failed to fetch ${source.name}: HTTP ${response.status}`
          );
          return [];
        }

        const xml = await response.text();

        // Verify it's actually XML/RSS content
        if (!xml.includes("<item>") && !xml.includes("<entry>")) {
          console.warn(
            `${source.name}: Response is not RSS/Atom XML (no <item> or <entry> tags)`
          );
          return [];
        }

        const articles = parseRssFeed(xml, source);
        console.log(`${source.name}: ${articles.length} relevant articles`);

        // Update last_scraped_at
        await supabase
          .from("rss_sources")
          .update({ last_scraped_at: new Date().toISOString() })
          .eq("id", source.id);

        return articles;
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(scrapePromises);
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allArticles = allArticles.concat(result.value);
      }
    });

    console.log(`Total articles before scoring: ${allArticles.length}`);

    if (allArticles.length === 0) {
      await supabase
        .from("automation_logs")
        .update({
          status: "completed",
          articles_processed: 0,
          duration_ms: Date.now() - startTime,
          error_message: "No articles passed keyword pre-filter from any source",
        })
        .eq("id", logEntry?.id);

      return new Response(
        JSON.stringify({
          success: true,
          articles_saved: 0,
          message: "No articles passed keyword pre-filter",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Score all articles with GPT-4o-mini (batch in groups of 10)
    const batchSize = 10;
    let scoredArticles: Array<ParsedArticle & { relevance_score: number }> = [];

    for (let i = 0; i < allArticles.length; i += batchSize) {
      const batch = allArticles.slice(i, i + batchSize);
      const scored = await scoreArticleRelevance(batch);
      scoredArticles = scoredArticles.concat(scored);
    }

    // Keep only articles with relevance score >= 0.5 (lowered from 0.6 for better coverage)
    const relevantArticles = scoredArticles
      .filter((a) => a.relevance_score >= 0.5)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10); // Top 10 per day

    console.log(`Relevant articles (score >= 0.5): ${relevantArticles.length}`);

    // Check for duplicates (same title scraped in last 7 days)
    const { data: recentTitles } = await supabase
      .from("scraped_articles")
      .select("title")
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const recentTitleSet = new Set(
      (recentTitles || []).map((r: { title: string }) => r.title.toLowerCase())
    );
    const newArticles = relevantArticles.filter(
      (a) => !recentTitleSet.has(a.title.toLowerCase())
    );

    console.log(`New articles (not seen in 7 days): ${newArticles.length}`);

    if (newArticles.length === 0) {
      await supabase
        .from("automation_logs")
        .update({
          status: "completed",
          articles_processed: 0,
          duration_ms: Date.now() - startTime,
        })
        .eq("id", logEntry?.id);

      return new Response(
        JSON.stringify({
          success: true,
          articles_saved: 0,
          message: "No new articles today (all already seen in last 7 days)",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert new articles into database using correct column names
    const { error: insertError } = await supabase
      .from("scraped_articles")
      .insert(
        newArticles.map((a) => ({
          source_name: a.source_name,
          source_url: a.source_url,   // source website origin
          url: a.url,                  // article URL (correct column name)
          title: a.title,
          summary: a.summary,
          published_at: a.published_at,
          relevance_score: a.relevance_score,
          category: a.category,
          is_processed: false,
        }))
      );

    if (insertError) {
      throw new Error(`Failed to insert articles: ${insertError.message}`);
    }

    // Update log with correct field name
    await supabase
      .from("automation_logs")
      .update({
        status: "completed",
        articles_processed: newArticles.length,  // correct column name
        duration_ms: Date.now() - startTime,
      })
      .eq("id", logEntry?.id);

    console.log(`Successfully saved ${newArticles.length} articles`);

    return new Response(
      JSON.stringify({ success: true, articles_saved: newArticles.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("Scrape function failed:", errorMessage);

    await supabase
      .from("automation_logs")
      .update({
        status: "failed",
        error_message: errorMessage,
        duration_ms: Date.now() - startTime,
      })
      .eq("id", logEntry?.id);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
