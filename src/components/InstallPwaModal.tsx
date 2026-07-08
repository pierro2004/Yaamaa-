import React, { useState, useEffect } from "react";
import { 
  X, Download, Share, PlusSquare, Menu, Smartphone, Check, HelpCircle, Laptop
} from "lucide-react";

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallPwaModal({ isOpen, onClose }: InstallPwaModalProps) {
  const [canPrompt, setCanPrompt] = useState<boolean>(!!(window as any).deferredPrompt);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // Detect device/browser type on mount
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIos = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/.test(userAgent);
    
    if (isIos) {
      setDeviceType("ios");
    } else if (isAndroid) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }

    // Check if prompt is available on mount
    setCanPrompt(!!(window as any).deferredPrompt);

    // Listen to our custom event dispatched by index.html when beforeinstallprompt fires
    const handleInstallAvailable = () => {
      setCanPrompt(true);
    };

    window.addEventListener("pwa-install-available", handleInstallAvailable);
    return () => {
      window.removeEventListener("pwa-install-available", handleInstallAvailable);
    };
  }, []);

  if (!isOpen) return null;

  // Trigger direct native installation prompt
  const handleNativeInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;

    // Show the install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === "accepted") {
      setInstallSuccess(true);
      (window as any).deferredPrompt = null;
      setCanPrompt(false);
      
      // Auto-close after success screen
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Absolute Decorative Circles */}
        <div className="absolute -top-12 -right-12 h-32 w-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Download className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-heading">
                Installer Yaamaa
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                PWA (Progressive Web App)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 relative z-10">
          
          {/* Logo & Intro */}
          <div className="flex flex-col items-center text-center space-y-2">
            <img 
              src="/logo.jpg" 
              alt="Yaamaa Logo" 
              className="h-16 w-16 rounded-2xl shadow-md border border-slate-200" 
            />
            <h4 className="text-xs font-black text-slate-800">
              Yaamaa Social & Tasks
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs font-mono">
              Accédez instantanément à Yaamaa depuis votre écran d'accueil sans passer par l'App Store ou Google Play Store.
            </p>
          </div>

          {/* Success State */}
          {installSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2 animate-scale-up">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-6 w-6" />
              </div>
              <h5 className="text-xs font-black text-emerald-900">Installation réussie !</h5>
              <p className="text-[10px] text-emerald-700 font-mono">
                L'application a été ajoutée à votre écran d'accueil. Vous pouvez maintenant la lancer d'un clic !
              </p>
            </div>
          ) : (
            <>
              {/* Option 1: Direct native installation if supported and prompt event is active */}
              {canPrompt ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <span className="block text-[10.5px] font-black text-indigo-950">
                      ⚡ Installation instantanée disponible !
                    </span>
                    <p className="text-[10px] text-indigo-700 font-mono mt-0.5 leading-relaxed">
                      Votre navigateur supporte l'installation directe. Cliquez ci-dessous pour l'installer en 2 secondes.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleNativeInstall}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl transition shadow-md shadow-emerald-100 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Installer l'application maintenant
                  </button>
                </div>
              ) : (
                /* Option 2: Step-by-step instructions based on device/browser type */
                <div className="space-y-4 pt-1">
                  
                  {/* Selector tabs for instructions */}
                  <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => setDeviceType("android")}
                      className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        deviceType === "android" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Android
                    </button>
                    <button
                      onClick={() => setDeviceType("ios")}
                      className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        deviceType === "ios" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      iPhone / iPad
                    </button>
                    <button
                      onClick={() => setDeviceType("desktop")}
                      className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        deviceType === "desktop" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Ordinateur
                    </button>
                  </div>

                  {/* Android Guide */}
                  {deviceType === "android" && (
                    <div className="space-y-3 animate-fade-in font-mono text-[10.5px] text-slate-600 leading-relaxed">
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">1</span>
                        <p>
                          Ouvrez l'application dans <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong>.
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">2</span>
                        <p className="flex items-center flex-wrap gap-1">
                          Appuyez sur le bouton de menu <Menu className="h-3.5 w-3.5 inline inline-block" /> (les trois points verticaux en haut à droite).
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">3</span>
                        <p>
                          Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* iOS/Safari Guide */}
                  {deviceType === "ios" && (
                    <div className="space-y-3 animate-fade-in font-mono text-[10.5px] text-slate-600 leading-relaxed">
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">1</span>
                        <p>
                          Assurez-vous d'être dans le navigateur <strong>Safari</strong> d'Apple.
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">2</span>
                        <p className="flex items-center flex-wrap gap-1">
                          Appuyez sur le bouton <strong>Partager</strong> <Share className="h-3.5 w-3.5 inline text-blue-500 mx-1" /> au bas de l'écran.
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">3</span>
                        <p className="flex items-center flex-wrap gap-1">
                          Faites défiler vers le bas et sélectionnez <strong>"Sur l'écran d'accueil"</strong> <PlusSquare className="h-3.5 w-3.5 inline text-slate-700 mx-1" />.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Desktop Guide */}
                  {deviceType === "desktop" && (
                    <div className="space-y-3 animate-fade-in font-mono text-[10.5px] text-slate-600 leading-relaxed">
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">1</span>
                        <p>
                          Sur Chrome ou Edge, regardez la <strong>barre d'adresse URL</strong> en haut à droite.
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">2</span>
                        <p>
                          Cliquez sur l'icône d'<strong>installation</strong> (ordinateur avec une flèche ou petit écran "+") située à droite de l'adresse URL.
                        </p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-sans text-[10px]">3</span>
                        <p>
                          Ou ouvrez le menu Chrome/Edge (trois points), puis allez dans <strong>"Enregistrer et partager"</strong> → <strong>"Installer la page en tant qu'application"</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex gap-2 items-center text-[10px] text-slate-400 font-mono">
                    <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>L'application PWA est ultra légère, rapide et économise votre forfait internet.</span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
