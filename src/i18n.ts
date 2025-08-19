import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";
import { detectLanguageByIPWithFallback } from "./utils/geoLocation";

const detectLang = () => {
  try {
    const stored = localStorage.getItem("lang");
    if (stored) return stored;
  } catch {}
  const nav = (navigator.language || "pt").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("zh")) return "zh";
  return "en";
};

// Inicializar com detecção por IP quando possível
const initializeLanguage = async () => {
  try {
    const detectedLang = await detectLanguageByIPWithFallback();
    if (detectedLang !== i18n.language) {
      await i18n.changeLanguage(detectedLang);
      try {
        localStorage.setItem("lang", detectedLang);
      } catch {}
    }
  } catch (error) {
    console.warn('Failed to initialize language by IP:', error);
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
    zh: { translation: zh },
  },
  lng: detectLang(),
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
}).then(() => {
  // Inicializar detecção por IP após a inicialização do i18n
  initializeLanguage();
});

export default i18n;
