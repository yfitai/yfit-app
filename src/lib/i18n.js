import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳", nativeName: "中文" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language detection: localStorage (user preference) → browser → fallback
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "yfit_language",
      caches: ["localStorage"],
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    resources: {},
    load: "languageOnly",
    ns: ["translation"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Dynamically load translation files from /public/locales/
SUPPORTED_LANGUAGES.forEach(({ code }) => {
  fetch(`/locales/${code}/translation.json`)
    .then((res) => res.json())
    .then((data) => {
      i18n.addResourceBundle(code, "translation", data, true, true);
    })
    .catch(() => {
      // Silently fall back to English if a language file fails to load
    });
});

/**
 * Save language preference to localStorage and optionally to Supabase user profile.
 * @param {string} langCode - ISO 639-1 language code
 * @param {function|null} updateProfileFn - Optional async function to persist to DB
 */
export async function setLanguage(langCode, updateProfileFn = null) {
  localStorage.setItem("yfit_language", langCode);
  await i18n.changeLanguage(langCode);
  if (updateProfileFn) {
    try {
      await updateProfileFn({ preferred_language: langCode });
    } catch (err) {
      console.warn("[i18n] Failed to save language preference to profile:", err);
    }
  }
}

export default i18n;
