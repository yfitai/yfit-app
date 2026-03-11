import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye, Target, Dumbbell, TrendingUp, Apple, Calendar, Brain } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToSignIn = () => navigate('/signin');
  const goToSignUp = () => navigate('/signup');
  const goToContact = () => navigate('/contact');
  const goToPrivacy = () => navigate('/privacy');
  const goToTerms = () => navigate('/terms');

  // 8 Feature Cards - exact colors from the YFIT app
  const features = [
    {
      icon: Target,
      title: "Goals",
      description: "Set and track personalized fitness goals tailored to your unique journey",
      cardBg: "bg-blue-600",
      features: ["Set personalized fitness targets", "Track body measurements", "Calculate BMI and body fat", "Adjust goals based on progress"]
    },
    {
      icon: Apple,
      title: "Nutrition",
      description: "Scan barcodes, log meals, and track macros with AI-powered nutrition insights",
      cardBg: "bg-green-600",
      features: ["Barcode scanning for quick logging", "Track macros and calories", "AI-powered meal suggestions", "Nutritional insights and reports"]
    },
    {
      icon: Dumbbell,
      title: "Fitness",
      description: "Access personalized workout plans with real-time form analysis and coaching",
      cardBg: "bg-purple-600",
      features: ["Personalized workout plans", "Real-time form analysis", "Exercise demonstrations", "Progressive overload tracking"]
    },
    {
      icon: Calendar,
      title: "Daily Tracker",
      description: "Log your daily activities, meals, workouts, and medications in one place",
      cardBg: "bg-orange-600",
      features: ["Log daily activities", "Track meals and workouts", "Monitor medications", "Daily progress overview"]
    },
    {
      icon: Pill,
      title: "Medications",
      description: "Track prescriptions, supplements, and generate provider reports for doctor visits",
      cardBg: "bg-pink-600",
      features: ["Track prescriptions and supplements", "Generate provider reports", "Monitor medication schedules", "Health integration"]
    },
    {
      icon: BarChart3,
      title: "Progress",
      description: "Visualize your transformation with detailed analytics and progress photos",
      cardBg: "bg-teal-600",
      features: ["Visual progress charts", "Body measurement tracking", "Progress photo comparisons", "Milestone celebrations"]
    },
    {
      icon: TrendingUp,
      title: "Predictions",
      description: "AI-powered forecasts for your weight, strength, and fitness milestones",
      cardBg: "bg-indigo-600",
      features: ["AI weight forecasting", "Strength progression predictions", "Goal timeline estimates", "Personalized insights"]
    },
    {
      icon: Brain,
      title: "AI Coach",
      description: "Your 24/7 intelligent fitness companion providing personalized guidance",
      cardBg: "bg-violet-600",
      features: ["24/7 AI coaching", "Personalized workout advice", "Nutrition recommendations", "Motivation and support"]
    },
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: "Free Basic",
      price: "$0",
      period: "",
      description: "Perfect for getting started",
      badge: null,
      badgeColor: null,
      features: [
        "Basic goal tracking",
        "Manual nutrition logging",
        "Workout library access",
        "Basic progress tracking",
        "Community support"
      ],
      buttonText: "Get Started Free",
      buttonStyle: "outline" as const,
      highlighted: false,
    },
    {
      name: "Pro Monthly",
      price: "$12.99",
      period: "/month",
      description: "Most flexible option",
      badge: null,
      badgeColor: null,
      features: [
        "Everything in Free",
        "Barcode nutrition scanning",
        "AI form analysis",
        "Medication tracking",
        "Provider reports",
        "Advanced analytics",
        "Priority support"
      ],
      buttonText: "Start Pro Monthly",
      buttonStyle: "default" as const,
      highlighted: false,
    },
    {
      name: "Pro Yearly",
      price: "$99.99",
      period: "/year",
      description: "Save 35% vs monthly",
      badge: "BEST VALUE",
      badgeColor: "bg-green-600",
      features: [
        "Everything in Pro Monthly",
        "AI Coach access",
        "Unlimited predictions",
        "Custom meal plans",
        "Form analysis videos",
        "Advanced health insights",
        "VIP support"
      ],
      buttonText: "Start Pro Yearly",
      buttonStyle: "default" as const,
      highlighted: true,
    },
    {
      name: "Pro Lifetime",
      price: "$249.99",
      period: " one-time",
      description: "Pay once, own forever",
      badge: "MOST POPULAR",
      badgeColor: "bg-violet-600",
      features: [
        "Everything in Pro Yearly",
        "Lifetime access",
        "All future features",
        "Premium support",
        "No recurring charges",
        "Exclusive community",
        "Priority updates"
      ],
      buttonText: "Get Lifetime Access",
      buttonStyle: "default" as const,
      highlighted: false,
    },
    {
      name: "Limited Time Offer",
      price: "1 Month FREE",
      period: "",
      description: "Full featured Pro plan",
      badge: "LIMITED TIME",
      badgeColor: "bg-orange-500",
      features: [
        "Full Pro features included",
        "No credit card required",
        "Cancel anytime",
        "Instant access",
        "All 8 app features",
      ],
      buttonText: "Claim Free Month",
      buttonStyle: "default" as const,
      highlighted: false,
      isOffer: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Limited Time Offer Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 text-center font-semibold text-sm md:text-base">
        🎉 LIMITED TIME OFFER: Get 1 Month FREE on All Pro Plans! 🎉
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 border-b border-primary/20 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</button>
            <button onClick={scrollToPricing} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</button>
            <button onClick={goToContact} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</button>
            <Button onClick={goToSignIn} variant="outline" size="sm">Sign In</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white">
              Get Started
            </Button>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden flex gap-2">
            <Button onClick={goToSignIn} variant="outline" size="sm">Sign In</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">Start</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-700 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Personalized Fitness</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-foreground">
                Your Body,<br />
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Reimagined.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Experience truly personalized fitness with YFIT AI. Advanced AI coaching, barcode nutrition scanning, medication tracking with provider reports, and real-time form analysis — all tailored to your unique goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white shadow-lg">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={scrollToFeatures} size="lg" variant="outline" className="text-lg px-8 border-blue-600/30 hover:bg-blue-50">
                  Explore Features
                </Button>
              </div>
            </div>

            {/* Hero Feature Preview */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/10 to-violet-600/10 opacity-50 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">App Features Preview</p>
                {[
                  { label: "Set Goals", sub: "Personalized targets", color: "bg-blue-600", textColor: "text-blue-700", bgLight: "bg-blue-50" },
                  { label: "Track Nutrition", sub: "Scan barcodes", color: "bg-green-600", textColor: "text-green-700", bgLight: "bg-green-50" },
                  { label: "AI Form Analysis", sub: "Real-time coaching", color: "bg-purple-600", textColor: "text-purple-700", bgLight: "bg-purple-50" },
                  { label: "Track Medications", sub: "Provider reports", color: "bg-pink-600", textColor: "text-pink-700", bgLight: "bg-pink-50" },
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

      {/* 8 Feature Cards */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              YFIT AI provides 8 powerful tools to help you achieve your fitness goals with personalized AI guidance.
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

      {/* What Makes YFIT Different */}
      <section id="unique" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-sm font-bold">
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">What Makes YFIT Different</h2>
            <p className="text-lg text-muted-foreground">
              While other apps focus on basic tracking, YFIT offers features you won't find anywhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Medication Tracking */}
            <div className="bg-blue-700 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <Pill className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Medication Tracking</h3>
              <p className="text-white/80 text-sm mb-6">Integrated health management with provider reports</p>
              <p className="text-white/90 mb-6 leading-relaxed">
                YFIT is the <strong>only fitness app</strong> that seamlessly integrates medication tracking with your fitness routine. Track prescriptions, supplements, and vitamins alongside your workouts and nutrition.
              </p>
              <ul className="space-y-2">
                {["Smart reminders for medication schedules", "Track interactions between supplements and workouts", "Generate provider reports for doctor visits", "Holistic view of your health journey"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form Analysis */}
            <div className="bg-teal-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Real-Time Form Analysis</h3>
              <p className="text-white/80 text-sm mb-6">AI-powered injury prevention</p>
              <p className="text-white/90 mb-6 leading-relaxed">
                Our advanced AI analyzes your workout form in real-time using your device camera. Get instant feedback to <strong>prevent injuries</strong> and maximize results — a feature most apps don't offer.
              </p>
              <ul className="space-y-2">
                {["Live posture correction during exercises", "Audio cues for immediate adjustments", "Detailed form reports after each workout", "Injury prevention recommendations"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your goals. Upgrade or cancel anytime.
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
                <Card className={`flex flex-col h-full ${plan.highlighted ? 'border-green-500 shadow-xl ring-2 ring-green-500/30' : plan.isOffer ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} ${plan.badge ? 'pt-2' : ''}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-lg ${plan.isOffer ? 'text-orange-600' : plan.highlighted ? 'text-green-700' : ''}`}>{plan.name}</CardTitle>
                    <div className={`text-2xl font-bold mt-1 ${plan.isOffer ? 'text-orange-600' : ''}`}>
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.isOffer ? 'text-orange-500' : plan.highlighted ? 'text-green-600' : 'text-primary'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={goToSignUp}
                      className={`w-full text-sm ${plan.isOffer ? 'bg-orange-500 hover:bg-orange-600 text-white' : plan.highlighted ? 'bg-green-600 hover:bg-green-700 text-white' : plan.buttonStyle === 'outline' ? '' : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white'}`}
                      variant={plan.buttonStyle === 'outline' ? 'outline' : 'default'}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Complete Fitness Ecosystem</h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge AI to deliver the most personalized fitness experience ever created.
            </p>
          </div>

          {/* YFIT Overview Card */}
          <div className="mb-10">
            <div className="bg-gray-900 rounded-2xl p-8 md:p-10 text-white shadow-xl border border-gray-700">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                {/* Left side: logo + decorative block */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 md:w-48">
                  <div className="bg-white rounded-2xl p-4 w-full flex items-center justify-center shadow-md">
                    <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI" className="w-36 object-contain" />
                  </div>
                  <div className="hidden md:flex flex-col items-center gap-2 w-full">
                    <div className="w-full h-1 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 opacity-60" />
                    <div className="grid grid-cols-3 gap-1.5 w-full mt-1">
                      {["bg-green-500","bg-purple-500","bg-blue-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500","bg-violet-500","bg-cyan-500"].map((c,i) => (
                        <div key={i} className={`h-2 rounded-full ${c} opacity-70`} />
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs text-center mt-2 leading-relaxed">8 integrated<br/>tracking modules</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-base leading-relaxed mb-6">
                    YFIT is a comprehensive health and fitness app that tracks everything you need in one place:
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { color: "bg-green-500", label: "Nutrition", detail: "Daily calories, macros (protein, carbs, fat), meal logs, and water intake" },
                      { color: "bg-purple-500", label: "Fitness", detail: "Workout sessions, exercises, sets, reps, weights, and form analysis scores" },
                      { color: "bg-blue-500", label: "Body Metrics", detail: "Weight, body fat %, BMI, and 9 body measurements (waist, hips, biceps, etc.)" },
                      { color: "bg-orange-500", label: "Daily Activity", detail: "Step count, calories burned, and activity streaks" },
                      { color: "bg-pink-500", label: "Medications", detail: "Medication schedules, dosages, reminders and provider reports" },
                      { color: "bg-teal-500", label: "Progress", detail: "Charts and trends for all tracked metrics over time" },
                      { color: "bg-indigo-500", label: "AI Coaching", detail: "Personalised advice, workout recommendations, and Q&A" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0 mt-1.5`} />
                        <div>
                          <span className="font-semibold text-white text-sm">{item.label}:</span>
                          <span className="text-gray-400 text-xs ml-1 leading-relaxed">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-4">
                    <span className="text-white font-semibold">Everything is connected</span> — so your AI Coach can give you personalised advice based on your actual data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, color: "bg-blue-600", title: "Barcode Scanner", desc: "Scan any food barcode for instant nutrition tracking. Our database logs nutritional information and calculates your daily macros automatically.", bg: "bg-blue-50" },
              { icon: Activity, color: "bg-violet-600", title: "Smart AI Coaching", desc: "Your personal AI coach adapts to your progress, providing tailored workout plans, nutrition advice, and motivation when you need it most.", bg: "bg-violet-50" },
              { icon: BarChart3, color: "bg-teal-600", title: "Deep Analytics", desc: "Visualize your progress with professional-grade analytics. Track muscle recovery, strength trends, and more with detailed insights.", bg: "bg-teal-50" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.bg} rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">Ready to Transform Your Fitness?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join YFIT AI today and experience the most personalized fitness app ever built.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={scrollToPricing} size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
              View Pricing
            </Button>
          </div>
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
              <p className="text-sm text-muted-foreground">The most personalized AI fitness app ever built.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={scrollToFeatures} className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={scrollToPricing} className="hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToPrivacy} className="hover:text-primary transition-colors">Privacy Policy</button></li>
                <li><button onClick={goToTerms} className="hover:text-primary transition-colors">Terms of Service</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToContact} className="hover:text-primary transition-colors">Contact Us</button></li>
                <li><button onClick={goToContact} className="hover:text-primary transition-colors">Support Center</button></li>
                <li><p className="text-xs">support@yfitai.com</p></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 YFIT AI. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button onClick={goToPrivacy} className="hover:text-primary transition-colors">Privacy</button>
              <button onClick={goToTerms} className="hover:text-primary transition-colors">Terms</button>
              <button onClick={goToContact} className="hover:text-primary transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
