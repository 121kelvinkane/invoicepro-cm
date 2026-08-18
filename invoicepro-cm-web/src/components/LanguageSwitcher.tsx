import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "fr" : "en")}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
      title={language === "en" ? "Passer au Français" : "Switch to English"}
    >
      <Globe size={16} />
      <span className="text-lg">{language === "en" ? "🇬🇧" : "🇫🇷"}</span>
      <span className="hidden sm:inline">{language === "en" ? "EN" : "FR"}</span>
    </button>
  );
}
