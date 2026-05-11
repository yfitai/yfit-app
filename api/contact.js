// ============================================================
// Vercel Serverless Function: api/contact.js
//
// Centralized multilingual contact handler for ALL sources:
//   - Marketing website contact form (source: "marketing")
//   - In-app support modal (source: "app")
//   - Social media DM handler (source: "social")
//
// SMART REPLY FLOW:
//   1. Search faq_articles in Supabase for relevant answers
//   2. If FAQ matches found → GPT-4o-mini writes a grounded answer using FAQ context
//   3. If no FAQ matches → GPT-4o-mini writes a helpful general reply
//   4. Reply is generated in the user's language (from frontend i18n.language)
//   5. Static template fallback if GPT-4 is unavailable
//   6. Sends reply to user + notification to support@yfitai.com
// ============================================================

import { createClient } from "@supabase/supabase-js";

// ── Constants ────────────────────────────────────────────────────────────────
const RESEND_URL = "https://api.resend.com/emails";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const SUPPORT_EMAIL = "support@yfitai.com";
const FROM_ADDRESS = "YFIT Support Team <support@yfitai.com>";
const FAQ_URL = "https://app.yfitai.com/faq";
const SUPABASE_URL = "https://mxggxpoxgqubojvumjlt.supabase.co";
const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png";

const SOURCE_LABELS = {
  marketing: "Marketing Website (yfitai.com)",
  app: "App Chatbox (app.yfitai.com)",
  social: "Social Media",
};

const LANGUAGE_NAMES = {
  en: "English", fr: "French", es: "Spanish", pt: "Portuguese",
  zh: "Mandarin Chinese", hi: "Hindi", de: "German", ja: "Japanese",
  ar: "Arabic", ko: "Korean", it: "Italian", ru: "Russian",
  nl: "Dutch", tr: "Turkish", pl: "Polish", uk: "Ukrainian",
  vi: "Vietnamese", th: "Thai",
};

// Stop words for FAQ keyword extraction (matches reference feedback-auto-reply implementation)
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can",
  "her", "was", "one", "our", "out", "day", "get", "has", "him",
  "his", "how", "its", "may", "new", "now", "old", "see", "two",
  "way", "who", "did", "let", "put", "say", "she", "too", "use",
  "that", "this", "with", "have", "from", "they", "will", "been",
  "when", "what", "your", "does", "into", "more", "also", "than",
  "then", "them", "some", "just", "like", "very", "even", "back",
  "good", "know", "take", "want", "make", "give", "most", "help",
  "need", "would", "could", "should", "about", "please", "hello",
  "bonjour", "hola", "merci", "gracias", "thank", "thanks",
]);

// ── FAQ Search ───────────────────────────────────────────────────────────────
/**
 * Search the faq_articles table for relevant answers to the user's message.
 * Exact same algorithm as the original feedback-auto-reply Supabase Edge Function.
 * Returns up to 3 most relevant FAQ articles.
 */
async function searchFaq(supabase, message, subject) {
  try {
    const combined = `${subject || ""} ${message}`.toLowerCase();
    const terms = combined
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
      .slice(0, 8);

    if (terms.length === 0) return [];

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
      console.warn("[Contact] FAQ search error:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    // Score by how many search terms appear in the article
    const scored = data.map((article) => {
      const text = `${article.question} ${article.answer} ${(article.keywords ?? []).join(" ")}`.toLowerCase();
      const score = terms.filter((t) => text.includes(t)).length;
      return { article, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.article);
  } catch (err) {
    console.warn("[Contact] FAQ search failed (non-fatal):", err.message);
    return [];
  }
}

// ── GPT-4 Reply Generation ───────────────────────────────────────────────────
/**
 * Generate a smart reply using GPT-4o-mini, grounded in FAQ context when available.
 * Always replies in the user's language. Same model/approach as feedback-auto-reply.
 */
async function generateSmartReply(name, message, subject, language, faqMatches, openaiKey) {
  const langName = LANGUAGE_NAMES[language] || "English";
  const hasFaq = faqMatches.length > 0;

  const faqContext = hasFaq
    ? faqMatches.map((f, i) => `FAQ ${i + 1}:\nQ: ${f.question}\nA: ${f.answer}`).join("\n\n")
    : "";

  const systemPrompt = hasFaq
    ? `You are a friendly, warm customer support agent for YFIT AI — an AI-powered health and fitness app.
A user has sent a message. You have been given relevant FAQ articles from the YFIT knowledge base to help answer them accurately.

CRITICAL: You MUST write your entire reply in ${langName} (language code: ${language}). Do not use English unless the language is English.

Rules:
- Use the FAQ content provided to give a specific, accurate answer about YFIT
- Use plain language (7th grade level) — keep it simple and friendly
- Be warm and personal — use the user's first name: ${name}
- Keep it to 3-4 short paragraphs
- If the FAQ directly answers their question, explain the steps clearly
- If the FAQ only partially answers it, answer what you can and invite them to reply for more help
- End with encouragement to keep using the app
- Do NOT promise specific features or timelines
- Sign off as "The YFIT Team"
- Do NOT include a subject line or email headers — just the body text
- Do NOT include any HTML — plain text only

YFIT FAQ Knowledge Base (use this to answer accurately):
${faqContext}`
    : `You are a friendly, warm customer support agent for YFIT AI — an AI-powered health and fitness app.
A user has sent a message and there are no specific FAQ articles that match their question.

CRITICAL: You MUST write your entire reply in ${langName} (language code: ${language}). Do not use English unless the language is English.

Rules:
- Use your general knowledge about fitness apps to give a helpful response
- Use plain language (7th grade level) — keep it simple and friendly
- Be warm and personal — use the user's first name: ${name}
- Keep it to 3-4 short paragraphs
- Acknowledge their specific question and provide the best answer you can
- Let them know a human support agent will follow up within 4-6 hours if needed
- Mention the FAQ page at ${FAQ_URL} as a quick resource
- Sign off as "The YFIT Team"
- Do NOT include a subject line or email headers — just the body text
- Do NOT include any HTML — plain text only`;

  const userPrompt = `User's message:
Subject: ${subject || "(no subject)"}
Message: ${message}

Write a helpful reply in ${langName}.`;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
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
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// ── Spam Detection ───────────────────────────────────────────────────────────
function isSpamMessage(name, email, message) {
  const spamPatterns = [
    /\b(viagra|casino|lottery|winner|prize|click here|buy now|free money)\b/i,
    /(.)\1{10,}/,
  ];
  const combined = `${name} ${email} ${message}`;
  return spamPatterns.some((p) => p.test(combined));
}

// ── Static Fallback Templates ────────────────────────────────────────────────
function getStaticReply(name, lang, faqUrl) {
  const templates = {
    en: `Thanks for reaching out, ${name}! We received your message and our support team will get back to you within 4-6 hours during business hours. You can also find quick answers at ${faqUrl}.`,
    fr: `Merci de nous avoir contactés, ${name} ! Nous avons bien reçu votre message et notre équipe de support vous répondra dans les 4 à 6 heures pendant les heures ouvrables. Vous pouvez également trouver des réponses rapides sur notre page FAQ : ${faqUrl}.`,
    es: `¡Gracias por contactarnos, ${name}! Hemos recibido tu mensaje y nuestro equipo de soporte te responderá en un plazo de 4 a 6 horas durante el horario laboral. También puedes encontrar respuestas rápidas en nuestra página de preguntas frecuentes: ${faqUrl}.`,
    pt: `Obrigado por entrar em contato, ${name}! Recebemos sua mensagem e nossa equipe de suporte responderá em até 4 a 6 horas durante o horário comercial. Você também pode encontrar respostas rápidas em nossa página de perguntas frequentes: ${faqUrl}.`,
    zh: `感谢您联系我们，${name}！我们已收到您的消息，我们的支持团队将在工作时间内的4到6小时内回复您。您也可以在我们的常见问题页面找到快速解答：${faqUrl}。`,
    hi: `${name}, हमसे संपर्क करने के लिए धन्यवाद! हमें आपका संदेश मिल गया है और हमारी सहायता टीम कार्य घंटों के दौरान 4 से 6 घंटों के भीतर आपसे संपर्क करेगी। आप हमारे FAQ पृष्ठ पर भी त्वरित उत्तर पा सकते हैं: ${faqUrl}।`,
    de: `Vielen Dank für Ihre Nachricht, ${name}! Wir haben Ihre Anfrage erhalten und unser Support-Team wird sich innerhalb von 4 bis 6 Stunden während der Geschäftszeiten bei Ihnen melden. Schnelle Antworten finden Sie auch auf unserer FAQ-Seite: ${faqUrl}.`,
    ja: `${name}様、お問い合わせいただきありがとうございます！メッセージを受け取りました。サポートチームが営業時間内に4〜6時間以内にご返答いたします。よくある質問のページでも素早く回答が見つかります：${faqUrl}。`,
    ar: `شكراً لتواصلك معنا، ${name}! لقد استلمنا رسالتك وسيرد عليك فريق الدعم خلال 4 إلى 6 ساعات خلال ساعات العمل. يمكنك أيضاً العثور على إجابات سريعة في صفحة الأسئلة الشائعة: ${faqUrl}.`,
    ko: `${name}님, 문의해 주셔서 감사합니다! 메시지를 받았으며 지원팀이 영업시간 내 4~6시간 이내에 답변드리겠습니다. FAQ 페이지에서도 빠른 답변을 찾을 수 있습니다: ${faqUrl}.`,
    it: `Grazie per averci contattato, ${name}! Abbiamo ricevuto il tuo messaggio e il nostro team di supporto ti risponderà entro 4-6 ore durante l'orario lavorativo. Puoi trovare risposte rapide anche nella nostra pagina FAQ: ${faqUrl}.`,
    ru: `Спасибо за обращение, ${name}! Мы получили ваше сообщение, и наша служба поддержки ответит вам в течение 4–6 часов в рабочее время. Быстрые ответы вы также найдёте на нашей странице FAQ: ${faqUrl}.`,
    nl: `Bedankt voor uw bericht, ${name}! We hebben uw bericht ontvangen en ons supportteam zal binnen 4 tot 6 uur tijdens kantooruren reageren. Snelle antwoorden vindt u ook op onze FAQ-pagina: ${faqUrl}.`,
    tr: `Bize ulaştığınız için teşekkürler, ${name}! Mesajınızı aldık ve destek ekibimiz iş saatleri içinde 4-6 saat içinde size geri dönecektir. Hızlı cevaplar için SSS sayfamızı da ziyaret edebilirsiniz: ${faqUrl}.`,
    pl: `Dziękujemy za kontakt, ${name}! Otrzymaliśmy Twoją wiadomość i nasz zespół wsparcia odpowie w ciągu 4–6 godzin w godzinach pracy. Szybkie odpowiedzi znajdziesz też na naszej stronie FAQ: ${faqUrl}.`,
    uk: `Дякуємо за звернення, ${name}! Ми отримали ваше повідомлення, і наша служба підтримки відповість протягом 4–6 годин у робочий час. Швидкі відповіді також можна знайти на нашій сторінці FAQ: ${faqUrl}.`,
    vi: `Cảm ơn bạn đã liên hệ, ${name}! Chúng tôi đã nhận được tin nhắn của bạn và đội hỗ trợ sẽ phản hồi trong vòng 4-6 giờ trong giờ làm việc. Bạn cũng có thể tìm câu trả lời nhanh tại trang FAQ: ${faqUrl}.`,
    th: `ขอบคุณที่ติดต่อเรา, ${name}! เราได้รับข้อความของคุณแล้ว และทีมสนับสนุนจะตอบกลับภายใน 4-6 ชั่วโมงในเวลาทำการ คุณยังสามารถหาคำตอบได้ที่หน้า FAQ: ${faqUrl}.`,
  };
  return templates[lang] || templates.en;
}

// ── Email HTML Builders ──────────────────────────────────────────────────────
function buildUserReplyHtml(name, replyText, originalMessage, lang) {
  const isRTL = ["ar", "he", "fa", "ur"].includes(lang);
  const dir = isRTL ? 'dir="rtl"' : "";
  const year = new Date().getFullYear();

  // Convert plain text reply to HTML paragraphs
  const replyHtml = replyText
    .split("\n\n")
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">${p.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");

  const browseLabel =
    {
      fr: "Parcourir la FAQ →",
      es: "Ver preguntas frecuentes →",
      pt: "Ver FAQ →",
      zh: "浏览常见问题 →",
      hi: "FAQ देखें →",
      de: "FAQ durchsuchen →",
      ja: "FAQを見る →",
      ar: "تصفح الأسئلة الشائعة →",
      ko: "FAQ 보기 →",
      it: "Sfoglia le FAQ →",
      ru: "Просмотреть FAQ →",
      nl: "FAQ bekijken →",
      tr: "SSS'ye göz at →",
      pl: "Przeglądaj FAQ →",
      uk: "Переглянути FAQ →",
      vi: "Xem FAQ →",
      th: "ดู FAQ →",
    }[lang] || "Browse FAQ →";

  const yourMessageLabel =
    {
      fr: "VOTRE MESSAGE",
      es: "TU MENSAJE",
      pt: "SUA MENSAGEM",
      zh: "您的消息",
      hi: "आपका संदेश",
      de: "IHRE NACHRICHT",
      ja: "お問い合わせ内容",
      ar: "رسالتك",
      ko: "귀하의 메시지",
      it: "IL TUO MESSAGGIO",
      ru: "ВАШЕ СООБЩЕНИЕ",
      nl: "UW BERICHT",
      tr: "MESAJINIZ",
      pl: "TWOJA WIADOMOŚĆ",
      uk: "ВАШЕ ПОВІДОМЛЕННЯ",
      vi: "TIN NHẮN CỦA BẠN",
      th: "ข้อความของคุณ",
    }[lang] || "YOUR MESSAGE";

  return `<!DOCTYPE html><html ${dir}><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0ea5e9,#10b981);padding:28px 32px;border-radius:12px 12px 0 0;">
<img src="${LOGO_URL}" alt="YFIT AI" style="height:44px;width:auto;display:block;"/>
<p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Support Team</p>
</td></tr>
<tr><td style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
${replyHtml}
<div style="background:#f9fafb;border-left:4px solid #0ea5e9;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="font-size:11px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">${yourMessageLabel}</p>
<p style="font-size:14px;color:#4b5563;margin:0;line-height:1.6;">${originalMessage
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</p>
</div>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
<td style="background:#0ea5e9;border-radius:8px;padding:12px 28px;">
<a href="${FAQ_URL}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${browseLabel}</a>
</td></tr></table>
<p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.6;">
&mdash; The YFIT Support Team<br/>
<a href="mailto:${SUPPORT_EMAIL}" style="color:#0ea5e9;">${SUPPORT_EMAIL}</a>
</p>
</td></tr>
<tr><td style="padding:16px 0;text-align:center;">
<p style="font-size:11px;color:#9ca3af;margin:0;">&copy; ${year} YFIT AI &mdash; <a href="https://yfitai.com" style="color:#0ea5e9;">yfitai.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function buildSupportNotificationHtml(
  name,
  email,
  subject,
  message,
  source,
  lang,
  langName,
  replyText,
  faqCount,
  replyMode
) {
  const sourceLabel = SOURCE_LABELS[source] || source || "Unknown";
  const langDisplay = `${langName} (${lang})`;

  const modeBadgeStyle =
    faqCount > 0
      ? "background:#10b981;color:#fff;"
      : replyMode === "gpt-general"
      ? "background:#f59e0b;color:#fff;"
      : "background:#6b7280;color:#fff;";

  const modeBadgeText =
    faqCount > 0
      ? `✓ FAQ-grounded (${faqCount} match${faqCount > 1 ? "es" : ""})`
      : replyMode === "gpt-general"
      ? "GPT general (no FAQ match)"
      : "Static template";

  const replyHtml = replyText
    .split("\n\n")
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 10px;font-size:14px;color:#065f46;line-height:1.6;">${p.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center"><table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#1e293b,#334155);padding:24px 32px;border-radius:12px 12px 0 0;">
<img src="${LOGO_URL}" alt="YFIT AI" style="height:36px;width:auto;display:block;"/>
<p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">New Support Request &mdash; Auto-reply sent &#10003;</p>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
<tr style="background:#f8fafc;">
<td style="padding:10px 12px;font-size:12px;color:#64748b;width:130px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">From</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${name} &lt;<a href="mailto:${email}" style="color:#0ea5e9;">${email}</a>&gt;</td>
</tr>
<tr>
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Subject</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${subject || "(no subject)"}</td>
</tr>
<tr style="background:#f8fafc;">
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Source</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${sourceLabel}</td>
</tr>
<tr>
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Language</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${langDisplay}</td>
</tr>
<tr style="background:#f8fafc;">
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Reply Mode</td>
<td style="padding:10px 12px;border:1px solid #e2e8f0;"><span style="${modeBadgeStyle}padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${modeBadgeText}</span></td>
</tr>
<tr>
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Timestamp</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${new Date().toUTCString()}</td>
</tr>
</table>
<div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:16px 20px;margin-bottom:20px;">
<p style="font-size:11px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">User's Message</p>
<p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">${message
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</p>
</div>
<div style="background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;padding:16px 20px;">
<p style="font-size:11px;color:#059669;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">&#10003; Auto-Reply Sent to User (in ${langName}) &nbsp;<span style="${modeBadgeStyle}padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${modeBadgeText}</span></p>
${replyHtml}
</div>
<p style="font-size:12px;color:#9ca3af;margin:20px 0 0;">Reply directly to this email to respond to ${name} at <a href="mailto:${email}" style="color:#0ea5e9;">${email}</a>.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — allow all origins so marketing site, app, and social integrations can POST
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    name,
    email,
    subject,
    message,
    source = "marketing",
    language,
  } = req.body || {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name || !email || !message)
    return res
      .status(400)
      .json({ error: "Name, email, and message are required." });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });

  if (message.length > 5000)
    return res.status(400).json({
      error: "Message is too long. Please keep it under 5000 characters.",
    });

  // ── Spam check ──────────────────────────────────────────────────────────────
  if (isSpamMessage(name, email, message)) {
    console.warn("[Contact] Spam detected — suppressing:", { name, email });
    return res.status(200).json({ success: true, message: "Message received." });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── No Resend key — acknowledge gracefully ──────────────────────────────────
  if (!resendApiKey) {
    console.warn("[Contact] RESEND_API_KEY not set. Submission logged:", {
      name,
      email,
      source,
      message: message.substring(0, 100),
    });
    return res.status(200).json({
      success: true,
      message: "Message received. We will get back to you shortly.",
    });
  }

  const detectedLanguage = language || "en";
  const languageName = LANGUAGE_NAMES[detectedLanguage] || "English";

  try {
    // ── Step 1: Search FAQ database ──────────────────────────────────────────
    let faqMatches = [];
    if (supabaseServiceKey) {
      try {
        const supabase = createClient(SUPABASE_URL, supabaseServiceKey);
        faqMatches = await searchFaq(supabase, message, subject);
        console.log(
          `[Contact] FAQ search: ${faqMatches.length} match(es) for "${message.substring(0, 60)}..."`
        );
      } catch (dbErr) {
        console.warn("[Contact] FAQ search failed (non-fatal):", dbErr.message);
      }
    }

    // ── Step 2: Generate smart reply ─────────────────────────────────────────
    let replyText = getStaticReply(name, detectedLanguage, FAQ_URL);
    let replyMode = "static";

    if (openaiKey) {
      try {
        const smartReply = await generateSmartReply(
          name,
          message,
          subject,
          detectedLanguage,
          faqMatches,
          openaiKey
        );
        if (smartReply) {
          replyText = smartReply;
          replyMode = faqMatches.length > 0 ? "faq-grounded" : "gpt-general";
          console.log(
            `[Contact] GPT-4o-mini reply generated (mode=${replyMode}, lang=${detectedLanguage}, faqMatches=${faqMatches.length})`
          );
        }
      } catch (gptErr) {
        console.warn(
          "[Contact] GPT-4o-mini failed, using static template:",
          gptErr.message
        );
        // replyText already set to static template above — no action needed
      }
    }

    // ── Step 3: Build and send emails ────────────────────────────────────────
    const userEmailHtml = buildUserReplyHtml(
      name,
      replyText,
      message,
      detectedLanguage
    );
    const supportEmailHtml = buildSupportNotificationHtml(
      name,
      email,
      subject,
      message,
      source,
      detectedLanguage,
      languageName,
      replyText,
      faqMatches.length,
      replyMode
    );

    await Promise.allSettled([
      // Auto-reply to the user in their language
      fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [email],
          reply_to: SUPPORT_EMAIL,
          subject: `We got your message, ${name} 👋`,
          html: userEmailHtml,
        }),
      }).catch((err) =>
        console.warn("[Contact] User email failed:", err.message)
      ),

      // Notification to support team with full context
      fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [SUPPORT_EMAIL],
          reply_to: email,
          subject: `[YFIT Support] ${subject || "New Contact"} — ${name} (${languageName}, ${replyMode}, via ${
            SOURCE_LABELS[source] || source
          })`,
          html: supportEmailHtml,
        }),
      }).catch((err) =>
        console.warn("[Contact] Support email failed:", err.message)
      ),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Message sent successfully. Check your inbox for a confirmation.",
      detectedLanguage,
      replyMode,
      faqMatchCount: faqMatches.length,
    });
  } catch (error) {
    console.error("[Contact] Unexpected error:", error);
    return res.status(500).json({
      error:
        "Failed to send message. Please try again or email us directly at support@yfitai.com.",
    });
  }
}
