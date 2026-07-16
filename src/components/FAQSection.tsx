import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface FAQSectionProps {
  onSignUp: () => void;
}

export default function FAQSection({ onSignUp }: FAQSectionProps) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: t("landing.landingFaq.q1"), a: t("landing.landingFaq.a1") },
    { q: t("landing.landingFaq.q2"), a: t("landing.landingFaq.a2") },
    { q: t("landing.landingFaq.q3"), a: t("landing.landingFaq.a3") },
    { q: t("landing.landingFaq.q4"), a: t("landing.landingFaq.a4") },
    { q: t("landing.landingFaq.q5"), a: t("landing.landingFaq.a5") },
    { q: t("landing.landingFaq.q6"), a: t("landing.landingFaq.a6") },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
            {t("landing.landingFaq.sectionTitle")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("landing.landingFaq.sectionSubtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-4">{t("landing.landingFaq.stillHaveQuestions")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@yfitai.com"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t("landing.landingFaq.emailSupport")}
            </a>
            <Button
              onClick={onSignUp}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:opacity-90"
            >
              {t("landing.landingFaq.tryFree")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
