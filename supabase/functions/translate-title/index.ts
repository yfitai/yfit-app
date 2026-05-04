// ============================================================
// YFIT Edge Function: translate-title
// Translates a fitness article title to the requested language
// using GPT-4o-mini. Called by DailyInsight.jsx when the user's
// language is not English.
//
// Request body: { title: string, targetLang: string }
//   targetLang: ISO 639-1 code, e.g. "fr", "es", "pt", "de", "it", "ja", "zh", "hi"
//
// Response: { translatedTitle: string }
// ============================================================

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  hi: "Hindi",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { title, targetLang } = await req.json();

    if (!title || !targetLang) {
      return new Response(JSON.stringify({ error: "Missing title or targetLang" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If target language is English or unknown, return as-is
    if (targetLang === "en" || !LANG_NAMES[targetLang]) {
      return new Response(JSON.stringify({ translatedTitle: title }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const langName = LANG_NAMES[targetLang];

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
            content: `You are a fitness content translator. Translate the given fitness article title to ${langName}. Return ONLY the translated title — no quotes, no explanation, no extra text.`,
          },
          {
            role: "user",
            content: title,
          },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedTitle = data.choices?.[0]?.message?.content?.trim() || title;

    return new Response(JSON.stringify({ translatedTitle }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("translate-title error:", err);
    // On any error, return the original title so the UI never breaks
    return new Response(JSON.stringify({ translatedTitle: null, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
