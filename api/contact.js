/**
 * Vercel Serverless Function: /api/contact
 *
 * Centralized multilingual email auto-responder for YFIT AI.
 * Handles contact submissions from all sources:
 *   - Marketing website (yfitai.com) — source: "marketing"
 *   - App chatbox (app.yfitai.com) — source: "app"
 *   - Social media DM handler — source: "social"
 *
 * Flow:
 *   1. Validate input
 *   2. Call Manus LLM to detect language and generate a personalized reply
 *   3. Send the reply to the user via Resend
 *   4. Notify support@yfitai.com with full context + detected language
 *
 * Accepted fields:
 *   name        {string}  required
 *   email       {string}  required
 *   message     {string}  required
 *   subject     {string}  optional
 *   source      {string}  optional — "marketing" | "app" | "social" (default: "marketing")
 *   language    {string}  optional — ISO 639-1 hint (e.g. "fr") — LLM still auto-detects
 */

const MANUS_LLM_URL = "https://forge.manus.ai/v1/chat/completions";
const RESEND_URL = "https://api.resend.com/emails";
const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png";
const FAQ_URL = "https://app.yfitai.com/faq";
const SUPPORT_EMAIL = "support@yfitai.com";
const FROM_ADDRESS = "YFIT AI Support <noreply@yfitai.com>";

const SOURCE_LABELS = {
  marketing: "Marketing Website (yfitai.com)",
  app: "App Chatbox (app.yfitai.com)",
  social: "Social Media",
};

const LANGUAGE_NAMES = {
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  zh: "Mandarin Chinese",
  hi: "Hindi",
  de: "German",
  ja: "Japanese",
  ar: "Arabic",
  ko: "Korean",
  it: "Italian",
  ru: "Russian",
  nl: "Dutch",
  tr: "Turkish",
  pl: "Polish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  th: "Thai",
};

/**
 * Static multilingual reply templates — used when language is known from the frontend.
 * These are always available regardless of LLM API key availability.
 * The LLM is only used for unknown languages or when the message needs a personalised reply.
 */
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

/**
 * Call Manus LLM to detect language and generate a personalized reply.
 * Returns { detectedLanguage, languageName, replyText, isSpam }
 */
async function generateMultilingualReply(name, message, subject, apiKey, languageHint) {
  const langInstruction = languageHint && languageHint !== 'en'
    ? `The user's app is set to language code "${languageHint}". Write the reply in that language (${LANGUAGE_NAMES[languageHint] || languageHint}). Also set detectedLanguage to "${languageHint}" in your JSON response.`
    : 'Detect the language of the user\'s message and write the reply in THAT SAME LANGUAGE.';

  const systemPrompt = `You are the friendly, warm, and helpful support assistant for YFIT AI — an AI-powered health and fitness app.
Your job is to:
1. ${langInstruction}
2. Generate a short, warm, personalized auto-reply in the correct language.
3. Flag if the message looks like spam or automated junk.

Reply guidelines:
- Write at a 7th-grade reading level — clear, simple, friendly.
- Keep the reply to 3-5 sentences maximum.
- Acknowledge what they asked about specifically (if possible).
- Let them know a human will follow up within 4-6 hours during business hours.
- Mention the FAQ page at ${FAQ_URL} as a quick resource.
- Do NOT include a greeting line like "Dear X" — start directly with the message body.
- Do NOT include a sign-off like "Sincerely" — end naturally.
- Do NOT include any HTML — plain text only.

Respond ONLY with valid JSON in this exact format:
{
  "detectedLanguage": "<ISO 639-1 code, e.g. en, fr, es, zh>",
  "languageName": "<human-readable name, e.g. English, French, Spanish>",
  "replyText": "<the reply in the detected language>",
  "isSpam": <true or false>
}`;

  const userPrompt = `User name: ${name}\nSubject: ${subject || "(none)"}\nMessage: ${message}\nApp language: ${languageHint || "en"}`;

  const response = await fetch(MANUS_LLM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "unknown");
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn("[Contact] LLM response not valid JSON:", raw.substring(0, 200));
    return {
      detectedLanguage: "en",
      languageName: "English",
      replyText: `Thanks for reaching out, ${name}! We received your message and our support team will get back to you within 4-6 hours during business hours. You can also find quick answers at ${FAQ_URL}.`,
      isSpam: false,
    };
  }

  return {
    detectedLanguage: parsed.detectedLanguage || "en",
    languageName:
      parsed.languageName ||
      LANGUAGE_NAMES[parsed.detectedLanguage] ||
      "Unknown",
    replyText: parsed.replyText || "",
    isSpam: parsed.isSpam === true,
  };
}

function buildUserReplyHtml(name, replyText, message, detectedLanguage) {
  const isRTL = ["ar", "he", "fa", "ur"].includes(detectedLanguage);
  const dir = isRTL ? 'dir="rtl"' : "";
  const year = new Date().getFullYear();
  return `<!DOCTYPE html><html ${dir}><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0ea5e9,#10b981);padding:28px 32px;border-radius:12px 12px 0 0;">
<img src="${LOGO_URL}" alt="YFIT AI" style="height:44px;width:auto;display:block;"/>
<p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Support Team</p>
</td></tr>
<tr><td style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
<p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 20px;white-space:pre-wrap;">${replyText}</p>
<div style="background:#f9fafb;border-left:4px solid #0ea5e9;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
<p style="font-size:11px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">Your message</p>
<p style="font-size:14px;color:#4b5563;margin:0;line-height:1.6;white-space:pre-wrap;">${message}</p>
</div>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
<td style="background:#0ea5e9;border-radius:8px;padding:12px 28px;">
<a href="${FAQ_URL}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Browse FAQ &rarr;</a>
</td></tr></table>
<p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.6;">
&mdash; The YFIT AI Support Team<br/>
<a href="mailto:${SUPPORT_EMAIL}" style="color:#0ea5e9;">${SUPPORT_EMAIL}</a>
</p>
</td></tr>
<tr><td style="padding:16px 0;text-align:center;">
<p style="font-size:11px;color:#9ca3af;margin:0;">&copy; ${year} YFIT AI &mdash; yfitai.com</p>
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
  detectedLanguage,
  languageName,
  replyText
) {
  const sourceLabel = SOURCE_LABELS[source] || source || "Unknown";
  const langDisplay = `${languageName} (${detectedLanguage})`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
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
<td style="padding:10px 12px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #e2e8f0;">Timestamp</td>
<td style="padding:10px 12px;font-size:14px;color:#1e293b;border:1px solid #e2e8f0;">${new Date().toUTCString()}</td>
</tr>
</table>
<div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:16px 20px;margin-bottom:20px;">
<p style="font-size:11px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">User's Message</p>
<p style="font-size:14px;color:#374151;margin:0;line-height:1.6;white-space:pre-wrap;">${message}</p>
</div>
<div style="background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;padding:16px 20px;">
<p style="font-size:11px;color:#059669;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">&#10003; Auto-Reply Sent to User (in ${languageName})</p>
<p style="font-size:14px;color:#065f46;margin:0;line-height:1.6;white-space:pre-wrap;">${replyText}</p>
</div>
<p style="font-size:12px;color:#9ca3af;margin:20px 0 0;">Reply directly to this email to respond to ${name} at ${email}.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

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

  const resendApiKey = process.env.RESEND_API_KEY;
  const manusApiKey = process.env.BUILT_IN_FORGE_API_KEY;

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

  try {
    // ── Step 1: Language detection + reply generation ────────────────────────
    // Priority order:
    //   1. If language hint from frontend is a known language → use static template (always works)
    //   2. If LLM API key is available → call LLM for personalised reply
    //   3. Fallback → English static template
    let detectedLanguage = language || "en";
    let languageName = LANGUAGE_NAMES[detectedLanguage] || "English";
    // Use static template as the default — always available, no API key needed
    let replyText = getStaticReply(name, detectedLanguage, FAQ_URL);
    let isSpam = false;

    if (manusApiKey) {
      try {
        const llmResult = await generateMultilingualReply(
          name,
          message,
          subject,
          manusApiKey,
          language
        );
        detectedLanguage = llmResult.detectedLanguage;
        languageName = llmResult.languageName;
        replyText = llmResult.replyText;
        isSpam = llmResult.isSpam;
      } catch (llmErr) {
        // Non-fatal — fall back to static template in the known language
        console.warn(
          "[Contact] LLM call failed, using static template fallback:",
          llmErr.message
        );
        // replyText already set to static template above — no action needed
      }
    }

    // ── Step 2: Suppress spam silently ──────────────────────────────────────
    if (isSpam) {
      console.warn("[Contact] Spam detected — suppressing emails:", {
        name,
        email,
        message: message.substring(0, 80),
      });
      return res.status(200).json({
        success: true,
        message: "Message received. We will get back to you shortly.",
      });
    }

    // ── Step 3: Build emails ─────────────────────────────────────────────────
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
      replyText
    );

    // ── Step 4: Send both emails in parallel ─────────────────────────────────
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

      // Support team notification with full context
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
          subject: `[YFIT Support] ${subject || "New Contact"} — ${name} (${languageName}, via ${SOURCE_LABELS[source] || source})`,
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
    });
  } catch (error) {
    console.error("[Contact] Unexpected error:", error);
    return res.status(500).json({
      error:
        "Failed to send message. Please try again or email us directly at support@yfitai.com.",
    });
  }
}
