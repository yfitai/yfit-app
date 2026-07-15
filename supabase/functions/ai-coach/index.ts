// ============================================================
// Supabase Edge Function: ai-coach
//
// Handles AI Coach chat requests from the YFIT app.
// Called from AICoach.jsx via supabase.functions.invoke('ai-coach')
//
// Request body:
//   {
//     message: string,                    // user's latest message
//     conversation_history: Message[],    // last 10 messages for context
//     user_profile?: object               // optional user profile data
//   }
//
// AUDIT FIX (Session 19, Jul 15 2026):
//   - Replaced "Americans" with "adults" in system prompt (audit 2.2)
//   - Added content safety: AI Coach stays focused on fitness/nutrition/wellness
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are YFIT Coach, a knowledgeable and encouraging personal fitness and nutrition coach built into the YFIT AI app.

Your role is to help users:
- Plan and optimize their workouts (strength training, cardio, flexibility)
- Understand nutrition, macros, calories, and meal planning
- Track progress and set realistic fitness goals
- Recover properly and avoid injury
- Stay motivated and build sustainable healthy habits

Key facts about your users:
- They are adults of all ages and fitness levels, from beginners to advanced athletes
- Many are over 40 and focused on longevity, joint health, and sustainable fitness
- Research shows that 68% of adults who track their fitness consistently see measurable improvements within 90 days
- They are using YFIT AI, a comprehensive health and fitness tracking app

Communication style:
- Be encouraging, specific, and practical — give actionable advice
- Use metric or imperial units based on what the user mentions
- Keep responses concise but complete (2–4 paragraphs max unless a detailed plan is requested)
- Always prioritize safety — recommend consulting a healthcare provider for medical concerns

Boundaries:
- Stay focused on fitness, nutrition, exercise, wellness, and healthy lifestyle topics
- Do NOT provide medical diagnoses, prescribe medications, or give medical advice
- If a user asks about a medical condition, acknowledge it briefly and recommend they speak with their doctor
- Do NOT discuss drug recalls, pharmaceutical warnings, or health scares — these are outside your scope
- Do NOT discuss topics unrelated to health and fitness`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, conversation_history = [], user_profile } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array for OpenAI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      // Include recent conversation history for context
      ...conversation_history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add the current user message
      { role: "user", content: message },
    ];

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[ai-coach] OpenAI error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const reply = openaiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ai-coach] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
