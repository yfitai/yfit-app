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
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.08)",
          color: "inherit",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <span style={{ fontSize: "16px" }}>{currentLang.flag}</span>
        {!compact && (
          <span style={{ display: "none", "@media (min-width: 640px)": { display: "inline" } }}>
            {currentLang.nativeName}
          </span>
        )}
        <span style={{ fontSize: "10px", opacity: 0.6 }}>▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            width: "180px",
            background: "var(--bg-card, #1e1e2e)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
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
                    ? "rgba(99,102,241,0.2)"
                    : "transparent",
                color: lang.code === i18n.language ? "#818cf8" : "inherit",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: lang.code === i18n.language ? 600 : 400,
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (lang.code !== i18n.language)
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
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
