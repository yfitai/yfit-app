import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "Is YFIT AI free to use?",
    a: "Yes — YFIT AI has a free plan that never expires. You get access to core features including nutrition tracking, workout logging, and goal setting. Paid plans unlock AI coaching, form analysis, medication tracking, and advanced analytics.",
  },
  {
    q: "How does the medication tracking work?",
    a: "You log your medications in the app and YFIT AI cross-references them against your workout schedule and nutrition plan. It flags potential interactions (e.g., certain medications that affect heart rate during cardio) and generates a printable report you can share with your doctor or pharmacist.",
  },
  {
    q: "What is AI form analysis and how accurate is it?",
    a: "You record a short video of yourself performing an exercise. YFIT's AI analyses your posture, joint angles, and movement patterns in real time, then provides specific feedback — for example, 'your knees are caving inward during squats.' It works on most major compound movements including squats, deadlifts, push-ups, and lunges.",
  },
  {
    q: "Do I need a gym membership or equipment?",
    a: "No. YFIT AI is designed for home workouts, gym sessions, and everything in between. The app generates workout plans based on what equipment you have available — including bodyweight-only plans.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. Monthly and yearly plans can be cancelled at any time with no penalty. You keep access until the end of your billing period. The Lifetime plan is a one-time purchase with no recurring charges.",
  },
  {
    q: "Is my health data private and secure?",
    a: "Your data is encrypted in transit and at rest. YFIT AI does not sell your personal health data to third parties. Medication data is stored securely and only used to generate your in-app reports. You can export or delete your data at any time from your account settings.",
  },
];

interface FAQSectionProps {
  onSignUp: () => void;
}

export default function FAQSection({ onSignUp }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg">Everything you need to know before you start.</p>
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
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => window.location.href = "mailto:support@yfitai.com"}
            >
              Email support@yfitai.com
            </Button>
            <Button
              onClick={onSignUp}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:opacity-90"
            >
              Try YFIT Free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
