import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Download className="text-emerald-600" size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {language === "en" ? "Install InvoicePro CM" : "Installer InvoicePro CM"}
            </p>
            <p className="text-xs text-gray-500">
              {language === "en" ? "Add to home screen for quick access" : "Ajoutez à l'écran d'accueil"}
            </p>
          </div>
        </div>
        <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full mt-3 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
      >
        {language === "en" ? "Install App" : "Installer l'App"}
      </button>
    </div>
  );
}
