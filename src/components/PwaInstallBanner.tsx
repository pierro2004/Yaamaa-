import React, { useState, useEffect } from "react";
import { Download, Sparkles, X, Smartphone, ArrowRight, Laptop } from "lucide-react";
import InstallPwaModal from "./InstallPwaModal";

export default function PwaInstallBanner() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [canPrompt, setCanPrompt] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // 2. Check if dismissed recently in this session
    const isDismissed = sessionStorage.getItem("pwa-banner-dismissed") === "true";
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // 3. Set initial state based on window.deferredPrompt
    const hasPrompt = !!(window as any).deferredPrompt;
    setCanPrompt(hasPrompt);

    // On mobile devices (iOS, Android) we always want to show the banner
    // even if native prompt is not active, to guide them on how to install.
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

    if (hasPrompt || isMobile) {
      // Delay slightly to ensure layout stability
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // 4. Listen for beforeinstallprompt event trigger
    const handleInstallAvailable = () => {
      setCanPrompt(true);
      setIsVisible(true);
    };

    window.addEventListener("pwa-install-available", handleInstallAvailable);
    return () => {
      window.removeEventListener("pwa-install-available", handleInstallAvailable);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "true");
    setIsVisible(false);
  };

  const handleAction = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          (window as any).deferredPrompt = null;
          setCanPrompt(false);
          setIsVisible(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    // Open install modal with install button & step-by-step instructions
    setShowModal(true);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white relative shadow-md z-40 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          
          {/* Logo & Text info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
              <Download className="h-5 w-5 text-white animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black flex items-center gap-1 tracking-tight">
                Installez l'application Yaamaa 📲
                <span className="inline-flex items-center px-1.5 py-0.2 bg-white/20 text-[8px] font-mono rounded-full tracking-wider font-bold uppercase">
                  PWA
                </span>
              </p>
              <p className="text-[10px] text-white/85 font-mono truncate max-w-md hidden sm:block">
                Plus rapide, économe en données internet et accessible directement depuis votre écran d'accueil.
              </p>
              <p className="text-[10px] text-white/85 font-mono truncate max-w-[280px] sm:hidden">
                Lancez Yaamaa directement en 1 clic !
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
            <button
              onClick={handleAction}
              className="bg-white hover:bg-emerald-50 text-emerald-700 font-black text-[10.5px] px-3.5 py-1.5 rounded-xl transition duration-150 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              Installer <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Fermer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Show step by step guidelines if clicked on mobile and prompt is unavailable */}
      {showModal && (
        <InstallPwaModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
