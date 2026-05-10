import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, MessageSquare, Zap } from "lucide-react";
import { useState, FormEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t, i18n } = useTranslation("support");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "app",
          language: i18n.language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("failedToSend"));
      } else {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSubmitted(false), 8000);
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { q: t("q_resetPassword"), a: t("a_resetPassword") },
    { q: t("q_cancelSubscription"), a: t("a_cancelSubscription") },
    { q: t("q_dataSecurity"), a: t("a_dataSecurity") },
    { q: t("q_refund"), a: t("a_refund") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="w-full z-50 border-b border-primary/10 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png"
              alt="YFIT Logo"
              className="h-10 w-auto"
            />
          </div>
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToHome")}
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">{t("getInTouch")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("pageSubtitle")}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="glass-card border-primary/20 text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{t("emailCardTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t("emailCardDesc")}</p>
                <p className="text-primary font-medium">support@yfitai.com</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>{t("supportCardTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t("supportCardDesc")}</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>{t("chatCardTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{t("chatCardDesc")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="glass-card border-primary/20 mb-12">
            <CardHeader>
              <CardTitle>{t("contactSupport")}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <p className="font-medium">✅ {t("messageSentSuccessfully")}</p>
                  <p className="text-sm mt-1">{t("aiResponseAtEmail", { email: formData.email || "your inbox" })}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <p className="font-medium">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">{t("yourName")}</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t("namePlaceholder")}
                      value={formData.name}
                      onChange={handleChange}
                      className="border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={formData.email}
                      onChange={handleChange}
                      className="border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">{t("subject")}</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder={t("subjectPlaceholder")}
                    value={formData.subject}
                    onChange={handleChange}
                    className="border-primary/20 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">{t("message")}</Label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder={t("messagePlaceholder")}
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none bg-background text-foreground"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("sending") : t("sendMessage")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div id="faq">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{t("faqSectionTitle")}</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
