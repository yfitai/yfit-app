/**
 * Vercel Serverless Function: /api/contact
 * Forwards contact form submissions to support@yfitai.com via Resend.
 * Falls back to a simple acknowledgment if RESEND_API_KEY is not configured.
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body || {};

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // No Resend key — log and acknowledge (avoids breaking the form UX)
    console.warn("[Contact] RESEND_API_KEY not set. Form submission received but not forwarded:", {
      name,
      email,
      subject,
      message: message.substring(0, 100),
    });
    return res.status(200).json({
      success: true,
      message: "Message received. We will get back to you shortly.",
    });
  }

  try {
    // Send notification to support team
    const supportResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YFIT Support Form <noreply@yfitai.com>",
        to: ["support@yfitai.com"],
        reply_to: email,
        subject: `[YFIT Support] ${subject || "New Contact Form Submission"} — from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #10b981); padding: 24px; border-radius: 12px 12px 0 0;">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" 
                   alt="YFIT AI" style="height: 40px; width: auto;" />
              <h1 style="color: white; margin: 12px 0 0; font-size: 20px;">New Support Request</h1>
            </div>
            <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 100px; font-size: 14px;">Name:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #0ea5e9;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subject:</td>
                  <td style="padding: 8px 0; font-size: 14px;">${subject || "(no subject)"}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                Reply directly to this email to respond to ${name} at ${email}.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!supportResponse.ok) {
      const errData = await supportResponse.json().catch(() => ({}));
      console.error("[Contact] Resend error (support email):", errData);
      throw new Error(errData.message || "Failed to send support notification");
    }

    // Send confirmation to the user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YFIT Support <support@yfitai.com>",
        to: [email],
        subject: "We received your message — YFIT AI Support",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #10b981); padding: 24px; border-radius: 12px 12px 0 0;">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" 
                   alt="YFIT AI" style="height: 40px; width: auto;" />
            </div>
            <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Hi ${name}, we got your message!</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                Thanks for reaching out. Our support team typically responds within <strong>4–6 hours</strong> during business hours.
              </p>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                While you wait, you might find a quick answer in our 
                <a href="https://yfit-deploy.vercel.app/faq" style="color: #0ea5e9; font-weight: 600;">FAQ page</a>.
              </p>
              <div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 16px; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your message</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                — The YFIT AI Team<br/>
                <a href="mailto:support@yfitai.com" style="color: #0ea5e9;">support@yfitai.com</a>
              </p>
            </div>
          </div>
        `,
      }),
    }).catch((err) => {
      // Non-fatal — don't fail the request if confirmation email fails
      console.warn("[Contact] Failed to send user confirmation email:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully. Check your inbox for a confirmation.",
    });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return res.status(500).json({
      error: "Failed to send message. Please try again or email us directly at support@yfitai.com.",
    });
  }
}
