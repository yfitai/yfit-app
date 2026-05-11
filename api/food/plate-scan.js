// ============================================================
// Vercel Serverless Function: api/food/plate-scan.js
//
// HYBRID PLATE SCAN — How it works:
//   1. Receive a base64 image from the frontend
//   2. Send to GPT-4o Vision → get a JSON list of foods visible on the plate
//   3. For each identified food, search USDA FoodData Central for nutrition data
//   4. Return the list of foods with nutrition data to the frontend
//   5. The user then selects serving sizes for each food (the human does portion estimation)
//   6. Frontend logs the confirmed items as a meal or saves as a template
//
// This hybrid approach is more accurate than pure AI estimation because:
//   - AI is good at identifying WHAT foods are on a plate (~80-90% accuracy)
//   - AI is poor at estimating HOW MUCH (30-55% accuracy) — so we let the user do that
// ============================================================

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const openaiKey = process.env.OPENAI_API_KEY;
  const usdaKey = process.env.USDA_API_KEY || "K0bD3QgyBqLrG7hXy4RgKkFFvNAmHnCXdWBet22m";

  if (!openaiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const { imageBase64, mimeType = "image/jpeg" } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }

  try {
    // ── Step 1: Identify foods via GPT-4o Vision ─────────────────────────────
    console.log("[PlateScan] Sending image to GPT-4o Vision...");

    const visionResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plate_foods",
            strict: true,
            schema: {
              type: "object",
              properties: {
                foods: {
                  type: "array",
                  description: "List of distinct foods identified on the plate",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Common English name of the food, suitable for USDA database search (e.g. 'grilled chicken breast', 'brown rice', 'broccoli')"
                      },
                      confidence: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                        description: "Confidence level of identification"
                      }
                    },
                    required: ["name", "confidence"],
                    additionalProperties: false
                  }
                },
                note: {
                  type: "string",
                  description: "Optional note if the image is unclear, not food, or if identification is uncertain"
                }
              },
              required: ["foods", "note"],
              additionalProperties: false
            }
          }
        },
        messages: [
          {
            role: "system",
            content: `You are a food identification assistant for a nutrition tracking app. 
Analyze the image and identify all distinct food items visible on the plate or in the meal.
Return each food as a separate item with a common English name suitable for searching a nutrition database.
Be specific but use common names (e.g. "grilled chicken breast" not "poultry", "white rice" not "grain").
Do NOT estimate portion sizes — the user will do that themselves.
If the image does not contain food, return an empty foods array with a note explaining why.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "low"
                }
              },
              {
                type: "text",
                text: "Please identify all the foods visible in this meal photo."
              }
            ]
          }
        ]
      })
    });

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error("[PlateScan] Vision API error:", errText);
      return res.status(502).json({ error: "Failed to analyze image", detail: errText });
    }

    const visionData = await visionResponse.json();
    const visionContent = visionData.choices?.[0]?.message?.content;

    let identifiedFoods = [];
    let note = "";

    try {
      const parsed = JSON.parse(visionContent);
      identifiedFoods = parsed.foods || [];
      note = parsed.note || "";
    } catch (e) {
      console.error("[PlateScan] Failed to parse vision response:", visionContent);
      return res.status(502).json({ error: "Failed to parse food identification response" });
    }

    console.log(`[PlateScan] Identified ${identifiedFoods.length} foods:`, identifiedFoods.map(f => f.name));

    if (identifiedFoods.length === 0) {
      return res.status(200).json({
        success: true,
        foods: [],
        note: note || "No foods could be identified in this image. Please try a clearer photo."
      });
    }

    // ── Step 2: Look up each food in USDA ────────────────────────────────────
    const foodsWithNutrition = await Promise.all(
      identifiedFoods.map(async (identified) => {
        try {
          const searchUrl = `${USDA_SEARCH_URL}?api_key=${usdaKey}&query=${encodeURIComponent(identified.name)}&pageSize=5&dataType=Foundation,SR%20Legacy`;
          const usdaRes = await fetch(searchUrl);

          if (!usdaRes.ok) {
            console.warn(`[PlateScan] USDA lookup failed for: ${identified.name}`);
            return { ...identified, nutrition: null, usdaMatches: [] };
          }

          const usdaData = await usdaRes.json();
          const foods = usdaData.foods || [];

          // Pick the best match (first result that has calorie data)
          const bestMatch = foods.find(f => {
            const cals = f.foodNutrients?.find(n => n.nutrientId === 1008 || n.nutrientName?.toLowerCase().includes("energy"));
            return cals && cals.value > 0;
          }) || foods[0];

          if (!bestMatch) {
            return { ...identified, nutrition: null, usdaMatches: [] };
          }

          // Extract nutrition per 100g
          const getNutrient = (food, ids, names) => {
            const n = food.foodNutrients?.find(n =>
              ids.includes(n.nutrientId) ||
              names.some(name => n.nutrientName?.toLowerCase().includes(name))
            );
            return Math.round((n?.value || 0) * 10) / 10;
          };

          const nutrition = {
            id: bestMatch.fdcId,
            name: bestMatch.description,
            searchName: identified.name,
            confidence: identified.confidence,
            calories: getNutrient(bestMatch, [1008], ["energy"]),
            protein: getNutrient(bestMatch, [1003], ["protein"]),
            carbs: getNutrient(bestMatch, [1005], ["carbohydrate"]),
            fat: getNutrient(bestMatch, [1004], ["total lipid", "fat"]),
            fiber: getNutrient(bestMatch, [1079], ["fiber"]),
            sugar: getNutrient(bestMatch, [2000, 1063], ["sugar"]),
            sodium: getNutrient(bestMatch, [1093], ["sodium"]),
            servingGrams: 100, // All values are per 100g
            dataType: bestMatch.dataType,
          };

          return nutrition;
        } catch (err) {
          console.error(`[PlateScan] Error looking up ${identified.name}:`, err);
          return { name: identified.name, searchName: identified.name, confidence: identified.confidence, nutrition: null };
        }
      })
    );

    // Filter out foods where USDA lookup completely failed
    const validFoods = foodsWithNutrition.filter(f => f && f.calories !== undefined);
    const failedFoods = foodsWithNutrition.filter(f => !f || f.calories === undefined);

    console.log(`[PlateScan] Returning ${validFoods.length} foods with nutrition data`);

    return res.status(200).json({
      success: true,
      foods: validFoods,
      failedLookups: failedFoods.map(f => f?.searchName || f?.name),
      note: note || null,
      identifiedCount: identifiedFoods.length,
      resolvedCount: validFoods.length
    });

  } catch (err) {
    console.error("[PlateScan] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
