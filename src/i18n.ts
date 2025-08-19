import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";

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
});

export default i18n;
