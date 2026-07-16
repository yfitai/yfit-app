import { Button } from "@/components/ui/button";
import CookieConsent from "@/components/CookieConsent";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FormAnalysisShowcase from "@/components/FormAnalysisShowcase";
import AppTourSection from "@/components/AppTourSection";
import QuickSetupCalculator from "@/components/QuickSetupCalculator";
import MedicationShowcase from "@/components/MedicationShowcase";
import FAQSection from "@/components/FAQSection";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye, Target, Dumbbell, TrendingUp, Apple, Calendar, Brain, Loader2, X, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToSignIn = () => navigate('/login');
  const goToSignUp = () => navigate('/signup');
  const { startCheckout, isLoading: checkoutLoading } = useStripeCheckout();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    try {
      const nameParts = waitlistName.trim().split(' ');
      const firstName = nameParts[0] || waitlistName.trim();
      const lastName = nameParts.slice(1).join(' ');
      await fetch('/api/index?path=/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, firstName, lastName }),
      });
    } catch (err) {
      // Graceful degradation — show success even if API fails
      console.warn('[Waitlist] Signup error:', err);
    }
    setWaitlistLoading(false);
    setWaitlistSubmitted(true);
  };

  // Auto-scroll to hash anchor on arrival (e.g. /go#quick-setup from social media links)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  const goToContact = () => navigate('/contact');
  const goToFAQ = () => navigate('/faq');
  const goToPrivacy = () => navigate('/legal');
  const goToTerms = () => navigate('/legal');

  // 8 Feature Cards - exact colors from the YFIT app
  const features = [
    {
      icon: Target,
      title: t("landing.features.goals.title"),
      description: t("landing.features.goals.description"),
      cardBg: "bg-blue-600",
      features: [
        t("landing.features.goals.f1"),
        t("landing.features.goals.f2"),
        t("landing.features.goals.f3"),
        t("landing.features.goals.f4"),
      ]
    },
    {
      icon: Apple,
      title: t("landing.features.nutrition.title"),
      description: t("landing.features.nutrition.description"),
      cardBg: "bg-green-600",
      features: [
        t("landing.features.nutrition.f1"),
        t("landing.features.nutrition.f2"),
        t("landing.features.nutrition.f3"),
        t("landing.features.nutrition.f4"),
      ]
    },
    {
      icon: Dumbbell,
      title: t("landing.features.fitness.title"),
      description: t("landing.features.fitness.description"),
      cardBg: "bg-purple-600",
      features: [
        t("landing.features.fitness.f1"),
        t("landing.features.fitness.f2"),
        t("landing.features.fitness.f3"),
        t("landing.features.fitness.f4"),
      ]
    },
    {
      icon: Calendar,
      title: t("landing.features.dailyTracker.title"),
      description: t("landing.features.dailyTracker.description"),
      cardBg: "bg-orange-600",
      features: [
        t("landing.features.dailyTracker.f1"),
        t("landing.features.dailyTracker.f2"),
        t("landing.features.dailyTracker.f3"),
        t("landing.features.dailyTracker.f4"),
      ]
    },
    {
      icon: Pill,
      title: t("landing.features.medications.title"),
      description: t("landing.features.medications.description"),
      cardBg: "bg-pink-600",
      features: [
        t("landing.features.medications.f1"),
        t("landing.features.medications.f2"),
        t("landing.features.medications.f3"),
        t("landing.features.medications.f4"),
      ]
    },
    {
      icon: BarChart3,
      title: t("landing.features.progress.title"),
      description: t("landing.features.progress.description"),
      cardBg: "bg-teal-600",
      features: [
        t("landing.features.progress.f1"),
        t("landing.features.progress.f2"),
        t("landing.features.progress.f3"),
        t("landing.features.progress.f4"),
      ]
    },
    {
      icon: TrendingUp,
      title: t("landing.features.predictions.title"),
      description: t("landing.features.predictions.description"),
      cardBg: "bg-indigo-600",
      features: [
        t("landing.features.predictions.f1"),
        t("landing.features.predictions.f2"),
        t("landing.features.predictions.f3"),
        t("landing.features.predictions.f4"),
      ]
    },
    {
      icon: Brain,
      title: t("landing.features.aiCoach.title"),
      description: t("landing.features.aiCoach.description"),
      cardBg: "bg-violet-600",
      features: [
        t("landing.features.aiCoach.f1"),
        t("landing.features.aiCoach.f2"),
        t("landing.features.aiCoach.f3"),
        t("landing.features.aiCoach.f4"),
      ]
    },
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: t("landing.plan1Name"),
      price: "$0",
      period: "",
      description: t("landing.plan1Desc"),
      badge: null,
      badgeColor: null,
      features: [
        t("landing.plan1F1"),
        t("landing.plan1F2"),
        t("landing.plan1F3"),
        t("landing.plan1F4"),
        t("landing.plan1F5"),
        t("landing.plan1F6"),
        t("landing.plan1F7"),
      ],
      buttonText: t("landing.plan1Btn"),
      buttonStyle: "outline" as const,
      highlighted: false,
      stripeKey: "signup" as any,
    },
    {
      name: t("landing.plan2Name"),
      price: "$12.99 USD",
      period: t("landing.periodMonth"),
      description: t("landing.plan2Desc"),
      badge: null,
      badgeColor: null,
      features: [
        t("landing.plan2F1"),
        t("landing.plan2F2"),
        t("landing.plan2F3"),
        t("landing.plan2F4"),
        t("landing.plan2F5"),
        t("landing.plan2F6"),
        t("landing.plan2F7"),
      ],
      buttonText: t("landing.plan2Btn"),
      buttonStyle: "default" as const,
      highlighted: false,
      stripeKey: "proMonthly" as const,
    },
    {
      name: t("landing.plan3Name"),
      price: "$99.99 USD",
      period: t("landing.periodYear"),
      description: t("landing.plan3Desc"),
      badge: t("landing.plan3Badge"),
      badgeColor: "bg-green-600",
      features: [
        t("landing.plan3F1"),
        t("landing.plan3F2"),
        t("landing.plan3F3"),
        t("landing.plan3F4"),
        t("landing.plan3F5"),
      ],
      buttonText: t("landing.plan3Btn"),
      buttonStyle: "default" as const,
      highlighted: true,
      stripeKey: "proYearly" as const,
    },
    {
      name: t("landing.plan4Name"),
      price: "$249.99 USD",
      period: t("landing.periodOneTime"),
      description: t("landing.plan4Desc"),
      badge: t("landing.plan4Badge"),
      badgeColor: "bg-violet-600",
      features: [
        t("landing.plan4F1"),
        t("landing.plan4F2"),
        t("landing.plan4F3"),
        t("landing.plan4F4"),
        t("landing.plan4F5"),
        t("landing.plan4F6"),
      ],
      buttonText: t("landing.plan4Btn"),
      buttonStyle: "default" as const,
      highlighted: false,
      stripeKey: "proLifetime" as const,
    },
    {
      name: t("landing.plan5Name"),
      price: "1 Month FREE",
      period: "",
      description: t("landing.plan5Desc"),
      badge: t("landing.plan5Badge"),
      badgeColor: "bg-orange-500",
      features: [
        t("landing.plan5F1"),
        t("landing.plan5F2"),
        t("landing.plan5F3"),
        t("landing.plan5F4"),
        t("landing.plan5F5"),
      ],
      buttonText: t("landing.plan5Btn"),
      buttonStyle: "default" as const,
      highlighted: false,
      isOffer: true,
      stripeKey: "signup" as any,
    },
  ];

  return (
    <div className="landing-page min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 border-b border-primary/20 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("landing.nav.features")}</button>
            <button onClick={scrollToPricing} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("landing.nav.pricing")}</button>
            <button onClick={goToContact} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("landing.nav.contact")}</button>
            <LanguageSwitcher compact={false} />
            <Button onClick={goToSignIn} variant="outline" size="sm">{t("landing.nav.signIn")}</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white">
              {t("landing.nav.getStarted")}
            </Button>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden flex gap-2 items-center">
            <LanguageSwitcher compact={true} />
            <Button onClick={goToSignIn} variant="outline" size="sm">{t("landing.nav.signIn")}</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">{t("landing.nav.start")}</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/10 border border-green-600/20 text-green-700 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>{t("landing.hero.badge")}</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                {t("landing.hero.headline1")}{" "}
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{t("landing.hero.headline2")}</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                {t("landing.hero.subtext")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90 text-white shadow-lg">
                  Try Free — See Your Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={() => document.getElementById('app-tour')?.scrollIntoView({ behavior: 'smooth' })} size="lg" variant="outline" className="text-lg px-8 border-green-600/30 hover:bg-green-50">
                  See the App →
                </Button>
                <p className="text-xs text-muted-foreground">No credit card · Free plan available · Cancel anytime</p>
              </div>
              {/* Honest feature badges — no fake social proof */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { icon: "💪", label: "No gym needed" },
                  { icon: "💊", label: "Medication-aware" },
                  { icon: "🧠", label: "AI form coach" },
                  { icon: "✅", label: "Free to start" },
                ].map((badge, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm">
                    <span>{badge.icon}</span>
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Feature Preview */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/10 to-violet-600/10 opacity-50 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t("landing.hero.appPreviewTitle")}</p>
                {[
                  { label: t("landing.hero.previewGoals"), sub: t("landing.hero.previewGoalsSub"), color: "bg-blue-600", textColor: "text-blue-700", bgLight: "bg-blue-50" },
                  { label: t("landing.hero.previewNutrition"), sub: t("landing.hero.previewNutritionSub"), color: "bg-green-600", textColor: "text-green-700", bgLight: "bg-green-50" },
                  { label: t("landing.hero.previewForm"), sub: t("landing.hero.previewFormSub"), color: "bg-purple-600", textColor: "text-purple-700", bgLight: "bg-purple-50" },
                  { label: t("landing.hero.previewMeds"), sub: t("landing.hero.previewMedsSub"), color: "bg-pink-600", textColor: "text-pink-700", bgLight: "bg-pink-50" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${item.bgLight} border border-gray-100`}>
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${item.textColor}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* App Tour Section — interactive phone mockups */}
      <AppTourSection />

      {/* Quick Setup / TDEE Calculator */}
      <section id="quick-setup" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: copy */}
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                <span>⚡</span> Free — No Account Needed
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                See your exact numbers<br />
                <span className="text-green-600">in 60 seconds</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Enter your stats and get a personalized calorie target and macro split — calculated using the same Katch-McArdle formula used by professional coaches.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                  Katch-McArdle formula (more accurate than Mifflin-St Jeor)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                  Goal-adjusted calorie target (not just TDEE)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                  Protein, carb &amp; fat breakdown included
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                  Save your results to the free app in one click
                </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">
                  💡 <strong>Why these numbers matter:</strong> Most people eat 300–500 calories more than they think. Knowing your exact target is the single biggest predictor of whether a diet works.
                </p>
              </div>
            </div>
            {/* Right: calculator */}
            <div>
              <QuickSetupCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Showcase: Form Analysis */}
      <FormAnalysisShowcase />

      {/* Differentiator Showcase: Medication Tracking */}
      <MedicationShowcase />

      {/* 8 Feature Cards */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t("landing.features.sectionTitle")}</h2>
            <p className="text-lg text-muted-foreground">
              {t("landing.features.sectionSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={`${feature.cardBg} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/80 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-1.5">
                    {feature.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/90">
                        <Check className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-300 text-orange-700 text-sm font-bold mb-4">
              <Zap className="w-4 h-4" />
              {t("landing.pricing.offerBadge")}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">{t("landing.pricing.sectionTitle")}</h2>
            <p className="text-lg text-muted-foreground">
              {t("landing.pricing.sectionSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="relative flex flex-col">
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                    <span className={`${plan.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <Card className={`flex flex-col h-full ${plan.highlighted ? 'border-green-500 shadow-xl ring-2 ring-green-500/30' : (plan as any).isOffer ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} ${plan.badge ? 'pt-2' : ''}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-lg ${(plan as any).isOffer ? 'text-orange-600' : plan.highlighted ? 'text-green-700' : ''}`}>{plan.name}</CardTitle>
                    <div className={`text-2xl font-bold mt-1 ${(plan as any).isOffer ? 'text-orange-600' : ''}`}>
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${(plan as any).isOffer ? 'text-orange-500' : plan.highlighted ? 'text-green-600' : 'text-primary'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => {
                        if (plan.stripeKey === "signup") {
                          navigate('/signup');
                        } else if (plan.stripeKey === "waitlist") {
                          setShowWaitlist(true);
                          setWaitlistSubmitted(false);
                          setWaitlistEmail("");
                          setWaitlistName("");
                        } else if (!plan.stripeKey) {
                          goToSignUp();
                        } else {
                          startCheckout({ plan: plan.stripeKey });
                        }
                      }}
                      disabled={checkoutLoading === plan.stripeKey}
                      className={`w-full text-sm ${(plan as any).isOffer ? 'bg-orange-500 hover:bg-orange-600 text-white' : plan.highlighted ? 'bg-green-600 hover:bg-green-700 text-white' : plan.buttonStyle === 'outline' ? '' : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white'}`}
                      variant={plan.buttonStyle === 'outline' ? 'outline' : 'default'}
                    >
                      {checkoutLoading === plan.stripeKey ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("landing.pricing.processing")}</>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Android Web Subscribe Banner */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-green-900/90 to-teal-900/90 border border-green-500/30 rounded-2xl px-6 py-5 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.63 12l2.893-3.341A1 1 0 0 0 16.77 7H7.23a1 1 0 0 0-.753 1.659L9.37 12l-2.893 3.341A1 1 0 0 0 7.23 17h9.54a1 1 0 0 0 .753-1.659z"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t("landing.unique.androidTitle")}</p>
                <p className="text-green-300 text-xs mt-0.5">{t("landing.unique.androidSubtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-green-500/25 whitespace-nowrap"
            >
              {t("landing.unique.androidCta")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">{t("landing.pricing.comparePlansTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("landing.pricing.comparePlansSubtitle")}</p>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-5 py-4 font-semibold w-52">{t("landing.tableFeatureHeader")}</th>
                  <th className="text-center px-4 py-4 font-semibold">{t("landing.pricing.colFree")}</th>
                  <th className="text-center px-4 py-4 font-semibold">{t("landing.pricing.colMonthly")}</th>
                  <th className="text-center px-4 py-4 font-semibold bg-green-700">{t("landing.pricing.colYearly")}</th>
                  <th className="text-center px-4 py-4 font-semibold bg-violet-700">{t("landing.pricing.colLifetime")}</th>
                </tr>
                <tr className="bg-gray-800 text-gray-300 text-xs">
                  <td className="px-5 py-2 text-gray-400">{t("landing.pricing.rowPrice")}</td>
                  <td className="text-center px-4 py-2 font-medium text-white">$0</td>
                  <td className="text-center px-4 py-2 font-medium text-white">$12.99 USD/mo</td>
                  <td className="text-center px-4 py-2 font-medium text-white bg-green-900">$99.99 USD/yr</td>
                  <td className="text-center px-4 py-2 font-medium text-white bg-violet-900">$249.99 USD once</td>
                </tr>
                <tr className="bg-orange-50 text-xs border-b border-orange-100">
                  <td className="px-5 py-2 text-gray-500 italic">{t("landing.pricing.rowPromo")}</td>
                  <td className="text-center px-4 py-2 text-gray-400">—</td>
                  <td className="text-center px-4 py-2 text-orange-600 font-semibold">{t("landing.pricing.promoMonthly")}</td>
                  <td className="text-center px-4 py-2 text-orange-600 font-semibold">{t("landing.pricing.promoYearly")}</td>
                  <td className="text-center px-4 py-2 text-gray-400">—</td>
                </tr>
              </thead>
              <tbody>
                {/* Section header helper */}
                {([
                  {
                    section: t("landing.pricing.sectionTracking"),
                    rows: [
                      { label: t("landing.tableRow1"),  free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow2"),  free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow3"),  free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow4"),  free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow5"),  free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow6"),  free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow7"),  free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow8"),  free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: t("landing.pricing.sectionAI"),
                    rows: [
                      { label: t("landing.tableRow9"),  free: "3/month", monthly: t("landing.tableUnlimited"), yearly: t("landing.tableUnlimited"), lifetime: t("landing.tableUnlimited") },
                      { label: t("landing.tableRow10"), free: t("landing.tableLimited"), monthly: t("landing.tableUnlimited"), yearly: t("landing.tableUnlimited"), lifetime: t("landing.tableUnlimited") },
                      { label: t("landing.tableRow11"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow12"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow13"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: t("landing.pricing.sectionPlanning"),
                    rows: [
                      { label: t("landing.tableRow14"), free: "2", monthly: t("landing.tableUnlimited"), yearly: t("landing.tableUnlimited"), lifetime: t("landing.tableUnlimited") },
                      { label: t("landing.tableRow15"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow16"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow17"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: t("landing.pricing.sectionAnalytics"),
                    rows: [
                      { label: t("landing.tableRow18"), free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow19"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow20"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: t("landing.pricing.sectionSupport"),
                    rows: [
                      { label: t("landing.tableRow21"), free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow22"), free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow23"), free: "❌", monthly: "❌", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow24"), free: "❌", monthly: "❌", yearly: "✅", lifetime: "✅" },
                      { label: t("landing.tableRow25"), free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: t("landing.tableRow26"), free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: t("landing.tableRow27"), free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: t("landing.tableRow28"), free: "✅", monthly: "❌", yearly: "❌", lifetime: "✅" },
                    ]
                  },
                ] as { section: string; rows: { label: string; free: string; monthly: string; yearly: string; lifetime: string }[] }[]).map((group, gi) => (
                  <>
                    <tr key={`section-${gi}`} className="bg-gray-100">
                      <td colSpan={5} className="px-5 py-2 text-xs font-bold tracking-widest text-gray-500 uppercase">{group.section}</td>
                    </tr>
                    {group.rows.map((row, ri) => (
                      <tr key={`row-${gi}-${ri}`} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-5 py-3 text-gray-700 font-medium">{row.label}</td>
                        <td className="text-center px-4 py-3 text-gray-600">{row.free}</td>
                        <td className="text-center px-4 py-3 text-gray-700">{row.monthly}</td>
                        <td className="text-center px-4 py-3 text-gray-700 bg-green-50">{row.yearly}</td>
                        <td className="text-center px-4 py-3 text-gray-700 bg-violet-50">{row.lifetime}</td>
                      </tr>
                    ))}
                  </>
                ))}
                {/* CTA row */}
                <tr className="bg-gray-900">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{t("landing.tableReadyToStart")}</td>
                  <td className="text-center px-4 py-4">
                    <button onClick={() => window.location.href='/signup'} className="text-xs bg-white text-gray-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t("landing.tableBtnFree")}</button>
                  </td>
                  <td className="text-center px-4 py-4">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">{t("landing.tableBtnMonthly")}</button>
                  </td>
                  <td className="text-center px-4 py-4 bg-green-900">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-green-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-green-400 transition-colors">{t("landing.tableBtnYearly")}</button>
                  </td>
                  <td className="text-center px-4 py-4 bg-violet-900">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-400 transition-colors">{t("landing.tableBtnLifetime")}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">{t("landing.tablePriceNote")}</p>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">How YFIT Compares</h2>
            <p className="text-muted-foreground text-lg">The only app that combines medication tracking, AI form analysis, and full fitness coaching in one place.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-5 py-4 font-semibold w-56">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold bg-green-700">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">YOU ARE HERE</span>
                      <span>YFIT AI</span>
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-300">MyFitnessPal</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-300">Noom</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Calorie & macro tracking", yfit: "✅", mfp: "✅", noom: "✅" },
                  { feature: "Workout logging", yfit: "✅", mfp: "✅", noom: "❌" },
                  { feature: "AI coaching chat", yfit: "✅", mfp: "❌", noom: "✅" },
                  { feature: "Barcode food scanner", yfit: "✅", mfp: "✅", noom: "❌" },
                  { feature: "Progress photo tracking", yfit: "✅", mfp: "❌", noom: "❌" },
                  { feature: "Medication tracking", yfit: "✅ Exclusive", mfp: "❌", noom: "❌" },
                  { feature: "Medication–exercise interaction alerts", yfit: "✅ Exclusive", mfp: "❌", noom: "❌" },
                  { feature: "AI real-time form analysis", yfit: "✅ Exclusive", mfp: "❌", noom: "❌" },
                  { feature: "Provider-ready medication reports", yfit: "✅ Exclusive", mfp: "❌", noom: "❌" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-5 py-3 text-gray-700 font-medium">{row.feature}</td>
                    <td className={`text-center px-4 py-3 font-semibold bg-green-50 ${
                      row.yfit.includes('Exclusive') ? 'text-green-700' : 'text-gray-700'
                    }`}>{row.yfit}</td>
                    <td className="text-center px-4 py-3 text-gray-500">{row.mfp}</td>
                    <td className="text-center px-4 py-3 text-gray-500">{row.noom}</td>
                  </tr>
                ))}
                <tr className="bg-gray-900">
                  <td className="px-5 py-4 text-white font-semibold text-sm">Ready to switch?</td>
                  <td className="text-center px-4 py-4 bg-green-900">
                    <button onClick={goToSignUp} className="text-xs bg-green-500 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-green-400 transition-colors">Start Free</button>
                  </td>
                  <td className="text-center px-4 py-4 text-gray-500 text-xs">—</td>
                  <td className="text-center px-4 py-4 text-gray-500 text-xs">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">✅ Exclusive = feature only available in YFIT AI. Comparison based on publicly available feature lists as of 2025.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection onSignUp={goToSignUp} />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            {t("landing.cta.badge")}
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">{t("landing.cta.headline")}</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {t("landing.cta.subtext")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-white text-green-700 hover:bg-gray-100 shadow-lg font-semibold">
              Try Free — See Your Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={scrollToPricing} size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
              View Pricing Plans
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-4">No credit card required · Free plan available forever · Cancel paid plans anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">{t("landing.footer.tagline")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={scrollToFeatures} className="hover:text-primary transition-colors">{t("landing.nav.features")}</button></li>
                <li><button onClick={scrollToPricing} className="hover:text-primary transition-colors">{t("landing.nav.pricing")}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToPrivacy} className="hover:text-primary transition-colors">{t("landing.footer.privacy")}</button></li>
                <li><button onClick={goToTerms} className="hover:text-primary transition-colors">{t("landing.footer.terms")}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("landing.footer.support")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToContact} className="hover:text-primary transition-colors">{t("landing.footer.contactUs")}</button></li>
                <li><button onClick={goToFAQ} className="hover:text-primary transition-colors">{t("landing.footer.supportCenter")}</button></li>
                <li><a href="mailto:support@yfitai.com" className="text-xs hover:text-primary transition-colors">support@yfitai.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{t("landing.footer.copyright")}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button onClick={goToPrivacy} className="hover:text-primary transition-colors">{t("landing.footer.privacyShort")}</button>
              <button onClick={goToTerms} className="hover:text-primary transition-colors">{t("landing.footer.termsShort")}</button>
              <button onClick={goToContact} className="hover:text-primary transition-colors">{t("landing.footer.contactShort")}</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">Free plan available</p>
            <p className="text-xs text-muted-foreground truncate">No credit card required</p>
          </div>
          <Button onClick={goToSignUp} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 flex-shrink-0 whitespace-nowrap">
            Start Free →
          </Button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowWaitlist(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {!waitlistSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t("landing.waitlist.title")}</h2>
                </div>
                <p className="text-gray-500 mb-6 text-sm">
                  {t("landing.waitlist.subtitle")}
                </p>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("landing.waitlist.nameLabel")}</label>
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={e => setWaitlistName(e.target.value)}
                      placeholder={t("landing.waitlist.namePlaceholder")}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("landing.waitlist.emailLabel")}</label>
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder={t("landing.waitlist.emailPlaceholder")}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={waitlistLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white font-semibold py-2.5"
                  >
                    {waitlistLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("landing.waitlist.joining")}</>
                    ) : (
                      t("landing.waitlist.submit")
                    )}
                  </Button>
                </form>
                <p className="text-xs text-gray-400 mt-4 text-center">{t("landing.waitlist.noSpam")}</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("landing.waitlist.successTitle")}</h2>
                <p className="text-gray-500 text-sm mb-3">
                  Welcome, <strong>{waitlistName.trim().split(' ')[0]}</strong>! {t("landing.waitlist.successText")} <strong>{waitlistEmail}</strong>.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{t("landing.waitlist.readyTitle")}</p>
                  <p className="text-xs text-gray-500">{t("landing.waitlist.readySubtext")}</p>
                </div>
                <Button
                  onClick={() => { navigate('/signup'); setShowWaitlist(false); }}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white font-semibold py-3 text-base mb-3"
                >
                  {t("landing.waitlist.createAccount")}
                </Button>
                <button
                  onClick={() => setShowWaitlist(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  {t("landing.waitlist.signUpLater")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <CookieConsent />
    </div>
  );
}

