/**
 * AppTourSection.tsx
 * Interactive "See the App" section for the YFIT landing page.
 * Tab navigation + animated phone mockup for all 11 screens.
 */

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { APP_TOUR_SCREENS } from "./AppTourMockups";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AppTourSection() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const tabsRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const screen = APP_TOUR_SCREENS[activeIndex];
  const ActiveMockup = screen.component;

  const goTo = (index: number, dir?: "left" | "right") => {
    if (animating || index === activeIndex) return;
    setDirection(dir ?? (index > activeIndex ? "right" : "left"));
    setAnimating(true);
    setTimeout(() => {
      setActiveIndex(index);
      setAnimating(false);
    }, 220);
    // Scroll tab into view
    const tabEl = tabsRef.current?.children[index] as HTMLElement | undefined;
    tabEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const prev = () => goTo((activeIndex - 1 + APP_TOUR_SCREENS.length) % APP_TOUR_SCREENS.length, "left");
  const next = () => goTo((activeIndex + 1) % APP_TOUR_SCREENS.length, "right");

  // Auto-advance every 5s
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setDirection("right");
      setAnimating(true);
      setTimeout(() => {
        setActiveIndex(i => (i + 1) % APP_TOUR_SCREENS.length);
        setAnimating(false);
      }, 220);
    }, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const resetAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setDirection("right");
      setAnimating(true);
      setTimeout(() => {
        setActiveIndex(i => (i + 1) % APP_TOUR_SCREENS.length);
        setAnimating(false);
      }, 220);
    }, 5000);
  };

  const handleTabClick = (i: number) => {
    goTo(i);
    resetAuto();
  };

  const handlePrev = () => { prev(); resetAuto(); };
  const handleNext = () => { next(); resetAuto(); };

  const IconComp = screen.icon;

  return (
    <section id="app-tour" className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300 text-green-700 text-sm font-bold mb-4">
            <span>📱</span> See the App in Action
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-gray-900">
            Every screen, built for <span className="text-green-600">your goals</span>
          </h2>
          <p className="text-lg text-gray-500">
            Explore all 11 features of YFIT AI — tap any tab to see exactly what you'll get.
          </p>
        </div>

        {/* Tab bar */}
        <div className="relative mb-8">
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {APP_TOUR_SCREENS.map((s, i) => {
              const TabIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleTabClick(i)}
                  className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    i === activeIndex
                      ? `${s.color} text-white border-transparent shadow-md scale-105`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content: phone + description */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Phone mockup */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-[280px]">
              {/* Glow effect */}
              <div
                className={`absolute inset-0 ${screen.color} opacity-20 blur-3xl rounded-full scale-75 transition-all duration-500`}
              />
              {/* Animated phone */}
              <div
                className="relative transition-all duration-220"
                style={{
                  opacity: animating ? 0 : 1,
                  transform: animating
                    ? `translateX(${direction === "right" ? "-30px" : "30px"})`
                    : "translateX(0px)",
                }}
              >
                <ActiveMockup />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="order-1 lg:order-2">
            <div
              className="transition-all duration-220"
              style={{
                opacity: animating ? 0 : 1,
                transform: animating
                  ? `translateY(${direction === "right" ? "10px" : "-10px"})`
                  : "translateY(0px)",
              }}
            >
              {/* Screen badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${screen.color} text-white text-sm font-semibold mb-4`}>
                <IconComp className="w-4 h-4" />
                {screen.label}
              </div>

              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {screen.title}
              </h3>

              <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-6">
                {screen.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-6">
                {APP_TOUR_SCREENS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleTabClick(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === activeIndex
                        ? `w-6 h-2 ${screen.color}`
                        : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Nav arrows + CTA */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5"
                >
                  Try Free — No Credit Card
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Free forever plan available · Cancel paid plans anytime</p>
            </div>
          </div>
        </div>

        {/* Screen counter */}
        <div className="text-center mt-8 text-sm text-gray-400">
          {activeIndex + 1} / {APP_TOUR_SCREENS.length} features
        </div>
      </div>
    </section>
  );
}
