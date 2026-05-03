import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, setLanguage } from "../lib/i18n";

/**
 * Language switcher dropdown component.
 * Saves preference to localStorage and optionally to the user's Supabase profile.
 *
 * Props:
 *   updateProfile - optional async function (data) => void to persist to DB
 *   compact       - if true, shows only the flag (for tight nav spaces)
 *   className     - additional CSS classes
 */
export default function LanguageSwitcher({ updateProfile = null, compact = false, className = "" }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  const handleSelect = async (code) => {
    await setLanguage(code, updateProfile);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ display: "inline-block" }}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        aria-expanded={isOpen}
        className="flex flex-col items-center justify-center px-1 py-1 sm:px-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
        title="Change language"
      >
        <span style={{ fontSize: "16px", lineHeight: 1 }}>{currentLang.flag}</span>
        <span className="text-[10px] mt-0.5">Lang</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            width: "180px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 9999,
            overflow: "hidden",
            padding: "4px 0",
          }}
          role="listbox"
          aria-label="Select language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === i18n.language}
              onClick={() => handleSelect(lang.code)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 14px",
                background:
                  lang.code === i18n.language
                    ? "rgba(59,130,246,0.1)"
                    : "transparent",
                color: lang.code === i18n.language ? "#2563eb" : "#374151",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: lang.code === i18n.language ? 600 : 400,
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (lang.code !== i18n.language)
                  e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (lang.code !== i18n.language)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "16px" }}>{lang.flag}</span>
              <span>{lang.nativeName}</span>
              {lang.code === i18n.language && (
                <span style={{ marginLeft: "auto", fontSize: "12px" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
