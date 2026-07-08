import React, { useState, useEffect } from "react";
import { User, YaamaaAiSettings, YaamaaAiStats, YaamaaAiHandledConversation, YaamaaAiNotification } from "../types";
import { 
  Bot, Sparkles, CheckCircle2, AlertCircle, Coins, ShieldCheck, 
  Settings, History, BarChart3, Star, MessageSquare, Clock, ArrowRight,
  Store, ShieldAlert, Heart, Zap, Play, Pause, ChevronRight, UserCheck
} from "lucide-react";

interface YaamaaAiViewProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onUpdateUser: (updated: User) => void;
  shops: any[];
  products: any[];
}

export default function YaamaaAiView({ 
  currentUser, 
  onNavigate, 
  onUpdateUser,
  shops = [],
  products = []
}: YaamaaAiViewProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "stats">("dashboard");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI states
  const [isActive, setIsActive] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [settings, setSettings] = useState<YaamaaAiSettings>({
    personality: "professionnelle",
    customKnowledge: "",
    authorizedTopics: "",
    forbiddenTopics: "",
    activationSchedule: "always",
    activationStartHour: 20,
    activationEndHour: 8,
    autoReplyOn: true,
    authorizesHistory: true,
    authorizesStock: true
  });
  const [stats, setStats] = useState<YaamaaAiStats>({
    conversationsCount: 0,
    satisfactionRate: 100,
    responseTime: 1.2
  });
  const [history, setHistory] = useState<YaamaaAiHandledConversation[]>([]);
  const [notifications, setNotifications] = useState<YaamaaAiNotification[]>([]);
  const [status, setStatus] = useState<"online" | "offline" | "unavailable">("online");

  // Evaluation form state
  const [evalRating, setEvalRating] = useState<Record<string, number>>({});
  const [evalFeedback, setEvalFeedback] = useState<Record<string, string>>({});

  // Connected Shop Info
  const userShops = shops.filter(s => s.ownerId === currentUser?.id);
  const linkedShop = userShops[0] || null;
  const shopProductsCount = linkedShop ? products.filter(p => p.shopId === linkedShop.id).length : 0;

  // Load configuration from API on mount/user change
  useEffect(() => {
    if (currentUser) {
      fetchAiData();
    }
  }, [currentUser?.id]);

  const fetchAiData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/yaamaa-ai/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsActive(data.yaamaaAiActive);
        setExpiresAt(data.yaamaaAiExpiresAt);
        if (data.yaamaaAiSettings) setSettings(data.yaamaaAiSettings);
        if (data.yaamaaAiStats) setStats(data.yaamaaAiStats);
        if (data.yaamaaAiHandledConversations) setHistory(data.yaamaaAiHandledConversations);
        if (data.yaamaaAiNotifications) setNotifications(data.yaamaaAiNotifications);
        if (data.status) setStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to load Yaamaa AI data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (type: "real" | "free_test") => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/yaamaa-ai/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, type })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur s'est produite lors de l'activation.");
      }

      setIsActive(data.yaamaaAiActive);
      setExpiresAt(data.yaamaaAiExpiresAt);
      if (data.yaamaaAiSettings) setSettings(data.yaamaaAiSettings);
      if (data.yaamaaAiStats) setStats(data.yaamaaAiStats);
      
      // Update wallet in global app state
      if (data.wallet) {
        onUpdateUser({
          ...currentUser,
          wallet: data.wallet,
          yaamaaAiActive: true,
          yaamaaAiExpiresAt: data.yaamaaAiExpiresAt
        });
      }

      setSuccessMsg(
        type === "real" 
          ? "🎉 Félicitations ! Votre Agent Yaamaa AI a été loué avec succès pour 30 jours." 
          : "🚀 Mode Test activé ! Votre Agent Yaamaa AI est maintenant prêt à simuler vos réponses."
      );
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/yaamaa-ai/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, status })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer les paramètres.");
      }

      setSuccessMsg("💾 Configuration de votre Agent Yaamaa AI enregistrée avec succès !");
      onUpdateUser({
        ...currentUser,
        status: status
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (conversationId: string) => {
    if (!currentUser) return;
    const rating = evalRating[conversationId] || 5;
    const feedback = evalFeedback[conversationId] || "";

    try {
      setErrorMsg(null);
      const res = await fetch(`/api/yaamaa-ai/${currentUser.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, rating, feedback })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.yaamaaAiHandledConversations) setHistory(data.yaamaaAiHandledConversations);
      if (data.yaamaaAiStats) setStats(data.yaamaaAiStats);

      // clear specific conversation review state
      setEvalRating(prev => {
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });
      setEvalFeedback(prev => {
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });

      setSuccessMsg("⭐ Évaluation enregistrée ! Merci d'aider votre agent à s'améliorer.");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const clearNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      await fetch(`/api/yaamaa-ai/${currentUser.id}/clear-notifications`, { method: "POST" });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Automatically clear notifications when they click on the page tab
  useEffect(() => {
    if (activeTab === "history" && notifications.length > 0) {
      clearNotifications();
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER BRAND */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 px-4 py-1 rounded-bl-2xl text-[10px] font-mono tracking-widest uppercase font-bold border-l border-b border-indigo-100">
            Smart Agent System v2.1
          </div>
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Bot className="h-9 w-9 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Yaamaa AI
                {isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    ACTIF ✅
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Votre assistant virtuel intelligent personnel disponible 24h/24 et 7j/7 pour répondre à vos clients, vendre vos articles et dynamiser votre activité en votre absence.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate("discussions")}
              className="px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all rounded-xl cursor-pointer"
            >
              Messagerie
            </button>
            {linkedShop && (
              <button
                onClick={() => onNavigate("boutique")}
                className="px-4 py-2 text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Store className="h-4 w-4" /> Boutique
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 font-bold text-sm">×</button>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-600 hover:text-rose-800 font-bold text-sm">×</button>
          </div>
        )}

        {/* NOTIFICATION HERO FOR MISSED RESPONSES */}
        {isActive && notifications.length > 0 && (
          <div className="mb-8 p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <div className="truncate">
                <h3 className="text-xs font-black text-amber-950 font-heading">
                  Votre Agent Yaamaa AI a travaillé pendant votre absence !
                </h3>
                <p className="text-[11px] text-amber-800/90 font-mono mt-0.5 truncate">
                  Il a répondu automatiquement à {notifications.length} message(s). Cliquez sur l'onglet Historique pour consulter les échanges.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab("history")}
                className="ml-auto bg-amber-600 hover:bg-amber-700 text-white font-black text-[10.5px] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
              >
                Consulter
              </button>
            </div>
          </div>
        )}

        {/* =============== CASE 1: UNREGISTERED / NOT LEASED AGENT =============== */}
        {!isActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* INFORMATIVE MARKETING BLOCK */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                Pourquoi recruter votre Agent Yaamaa AI ?
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Disponibilité 24h/7</h3>
                  <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                    Votre agent prend le relais dès que vous passez Hors ligne ou Absent. Ne perdez plus aucun prospect.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <Store className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Expertise Commerciale</h3>
                  <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                    Accès sécurisé à votre boutique : présentation des articles, tarifs exacts, promotions et stocks.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Personnalisation Totale</h3>
                  <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                    Choisissez le ton (professionnel, amical, vendeur) et apprenez-lui des consignes personnalisées.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <History className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">Contrôle & Supervision</h3>
                  <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                    Visualisez toutes les discussions générées, évaluez les réponses et reprenez la main à tout moment.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-5 space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Détails de conformité et sécurité</h4>
                <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed">
                  L'agent indique systématiquement qu'il s'agit d'une réponse automatisée grâce au label <strong className="text-slate-800">[Réponse automatique de Yaamaa AI]</strong> afin de garantir une communication transparente avec vos correspondants. Vos données de paiement et clés de sécurité sont strictement chiffrées.
                </p>
              </div>
            </div>

            {/* LEASING OPTIONS PANEL */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* REAL WALLET PLAN CARD */}
              <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-950 flex flex-col justify-between h-fit relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-indigo-500/25 border border-indigo-400/30 rounded-full text-[9px] font-black uppercase tracking-wider font-mono text-indigo-200">
                      Formule Premium
                    </span>
                    <Bot className="h-7 w-7 text-indigo-400 animate-bounce" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black font-heading">Abonnement Yaamaa AI</h3>
                    <p className="text-[11px] text-indigo-300 font-mono mt-1">
                      Activation complète pour une durée de 30 jours, extensible.
                    </p>
                  </div>

                  <div className="py-4 border-t border-b border-indigo-800 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-heading tracking-tight">5 000</span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">{currentUser?.currency || "XOF"} / Mois</span>
                  </div>

                  <ul className="space-y-2.5 text-[11px] text-indigo-200 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> Moteur neuronal Gemini Real-time
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> Liaison e-commerce illimitée
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> Statistiques complètes en direct
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    disabled={loading}
                    onClick={() => handlePurchase("real")}
                    className="w-full bg-white hover:bg-slate-100 text-indigo-900 font-black text-xs py-3 rounded-2xl transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Traitement en cours..." : "Louer avec mon solde (5 000 XOF)"}
                  </button>
                  <p className="text-[9.5px] text-center text-indigo-300 font-mono">
                    Votre solde actuel : <strong className="text-white">{currentUser?.wallet.available} {currentUser?.currency || "XOF"}</strong>
                  </p>
                </div>
              </div>

              {/* FREE DEMO/TEST ACTIVATION CARD */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 font-heading">Activer en Mode Test</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Gratuit & sans engagement</p>
                  </div>
                </div>
                
                <p className="text-[10.5px] text-slate-500 font-mono leading-relaxed">
                  Vous souhaitez tester la pertinence et les réponses automatiques de l'agent avant d'acheter ? Activez le <strong>Mode Test Gratuit</strong> pour explorer le tableau de bord et simuler les réponses.
                </p>

                <button
                  disabled={loading}
                  onClick={() => handlePurchase("free_test")}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs py-3 rounded-2xl transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Initialisation..." : "Activer le Mode Test Gratuit"}
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* =============== CASE 2: AGENT LEASED AND ACTIVE =============== */
          <div className="space-y-8">
            
            {/* TABS SELECTOR */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "dashboard" 
                    ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm font-bold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Settings className="h-4 w-4" />
                Configuration de l'Agent
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 relative ${
                  activeTab === "history" 
                    ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm font-bold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <History className="h-4 w-4" />
                Historique & Avis
                {notifications.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "stats" 
                    ? "bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm font-bold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Statistiques
              </button>
            </div>

            {/* =============== TAB CONTENT 1: CONFIGURATION ============== */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                
                {/* SETTINGS PANELS */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  
                  {/* Status Toggle Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Statut Propriétaire actuel</span>
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        {status === "online" ? (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> En Ligne (Agent en veille)
                          </>
                        ) : (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block animate-ping" /> Absent / Indisponible (Agent Actif !)
                          </>
                        )}
                      </h3>
                    </div>
                    <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm max-w-fit">
                      <button
                        onClick={() => setStatus("online")}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                          status === "online" 
                            ? "bg-emerald-500 text-white shadow-sm" 
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        En Ligne
                      </button>
                      <button
                        onClick={() => setStatus("offline")}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                          status === "offline" || status === "unavailable"
                            ? "bg-rose-500 text-white shadow-sm" 
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Absent (Occupé)
                      </button>
                    </div>
                  </div>

                  {/* General settings: auto reply toggle */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-indigo-500" /> Options de Réponse Automatique
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Activer les réponses automatiques</h4>
                        <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">Si désactivé, l'agent ne répondra pas même en cas d'absence.</p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, autoReplyOn: !prev.autoReplyOn }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.autoReplyOn ? "bg-indigo-600" : "bg-gray-250"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.autoReplyOn ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Customize Tone / Style */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading">Personnalité & Ton de l'Agent</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">Sélectionnez le style de communication à adopter avec vos clients.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: "professionnelle", label: "Professionnel", desc: "Sérieux, poli, axé affaires", icon: ShieldCheck, color: "hover:bg-blue-50 hover:border-blue-300", activeBg: "bg-blue-50 border-blue-400 text-blue-900" },
                        { id: "amical", label: "Amical & Proche", desc: "Chaleureux, simple, emojis", icon: Heart, color: "hover:bg-pink-50 hover:border-pink-300", activeBg: "bg-pink-50 border-pink-400 text-pink-900" },
                        { id: "enthousiaste", label: "Vendeur Dynamique", desc: "Motivant, met en valeur", icon: Sparkles, color: "hover:bg-amber-50 hover:border-amber-300", activeBg: "bg-amber-50 border-amber-400 text-amber-900" },
                        { id: "direct", label: "Direct & Concis", desc: "Bref, factuel, rapide", icon: Clock, color: "hover:bg-teal-50 hover:border-teal-300", activeBg: "bg-teal-50 border-teal-400 text-teal-900" }
                      ].map(item => {
                        const Icon = item.icon;
                        const isSel = settings.personality === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSettings(prev => ({ ...prev, personality: item.id }))}
                            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                              isSel ? item.activeBg : `bg-white border-slate-200 text-slate-800 ${item.color}`
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isSel ? "text-current" : "text-slate-400"}`} />
                            <div>
                              <span className="block text-[11px] font-black">{item.label}</span>
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5 leading-snug">{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Knowledge */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading">Connaissances spécifiques de l'Agent</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">Saisissez des faits, services ou détails sur vous que l'agent doit connaître.</p>
                    </div>
                    <textarea
                      value={settings.customKnowledge || ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, customKnowledge: e.target.value }))}
                      rows={4}
                      placeholder="Exemple : Ma boutique s'appelle 'Koffi Mod'. J'habite à Lomé. Je propose la vente en gros de t-shirts imprimés à partir de 2500 XOF. Nous livrons à domicile pour 1000 XOF supplémentaires et le paiement se fait par Wave ou Mobile Money à la réception. Mon adresse email de contact est contact@koffimod.com."
                      className="w-full rounded-2xl border border-slate-200 p-4 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-300 font-mono"
                    />
                  </div>

                  {/* Allowed / Forbidden Topics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-800">Sujets de réponse autorisés</label>
                      <input
                        type="text"
                        value={settings.authorizedTopics || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, authorizedTopics: e.target.value }))}
                        placeholder="Ex: tarifs, stocks, livraison, horaires"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-300 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-800">Sujets de réponse interdits</label>
                      <input
                        type="text"
                        value={settings.forbiddenTopics || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, forbiddenTopics: e.target.value }))}
                        placeholder="Ex: politique, religion, remises excessives"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Activation schedule options */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading">Horaires de fonctionnement d'Absence</h3>
                      <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">Configurez quand l'agent a l'autorisation de répondre automatiquement.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, activationSchedule: "always" }))}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition flex items-center gap-3 ${
                          settings.activationSchedule === "always"
                            ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${settings.activationSchedule === "always" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                          <Clock className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="block text-xs font-black">Actif en permanence</span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Dès que vous passez absent</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setSettings(prev => ({ ...prev, activationSchedule: "custom" }))}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition flex items-center gap-3 ${
                          settings.activationSchedule === "custom"
                            ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${settings.activationSchedule === "custom" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                          <History className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="block text-xs font-black">Plage horaire ciblée</span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Par exemple, de nuit uniquement</span>
                        </div>
                      </button>
                    </div>

                    {settings.activationSchedule === "custom" && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center gap-4 max-w-fit animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">De</span>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={settings.activationStartHour ?? 20}
                            onChange={(e) => setSettings(prev => ({ ...prev, activationStartHour: parseInt(e.target.value) }))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-center font-bold focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-600">H</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">à</span>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={settings.activationEndHour ?? 8}
                            onChange={(e) => setSettings(prev => ({ ...prev, activationEndHour: parseInt(e.target.value) }))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-center font-bold focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-600">H</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authorizations */}
                  <div className="space-y-4 pt-4 border-t border-slate-150">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Autorisations de données de confiance</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Autoriser l'historique des conversations</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">L'agent analyse l'historique récent (10 messages) pour des réponses fluides.</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, authorizesHistory: !prev.authorizesHistory }))}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.authorizesHistory ? "bg-indigo-600" : "bg-gray-250"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.authorizesHistory ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Autoriser la lecture précise des stocks</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">L'agent indique aux acheteurs si un produit est disponible ou épuisé.</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, authorizesStock: !prev.authorizesStock }))}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.authorizesStock ? "bg-indigo-600" : "bg-gray-250"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings.authorizesStock ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-150">
                    <button
                      disabled={loading}
                      onClick={handleSaveSettings}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {loading ? "Enregistrement en cours..." : "Enregistrer la Configuration"}
                    </button>
                  </div>

                </div>

                {/* SIDEBAR LIAISON & INFOS */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Shop Sync Details */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                      <Store className="h-4.5 w-4.5 text-indigo-500" /> Liaison E-commerce
                    </h3>

                    {linkedShop ? (
                      <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Connecté
                            </span>
                            <h4 className="text-xs font-black text-slate-800 mt-1.5">{linkedShop.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{linkedShop.description}</p>
                          </div>
                          <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <Store className="h-4.5 w-4.5" />
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex justify-between text-[10.5px] font-mono text-slate-500">
                          <span>Produits synchronisés :</span>
                          <strong className="text-slate-800">{shopProductsCount} articles</strong>
                        </div>

                        <p className="text-[9px] text-slate-400 font-mono leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 mt-2">
                          L'agent a accès au catalogue complet et aux tarifs en temps réel pour conseiller vos clients.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-3">
                        <div className="flex gap-2.5">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                          <p className="text-[10.5px] font-mono leading-relaxed">
                            Vous n'avez pas encore configuré de boutique en ligne. Votre agent ne peut pas promouvoir vos articles.
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate("boutique")}
                          className="w-full py-1.5 text-center bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] rounded-xl transition cursor-pointer"
                        >
                          Créer ma boutique d'abord
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lease status details */}
                  <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/10 rounded-full blur-xl" />
                    <h3 className="text-xs font-black uppercase text-indigo-300 font-mono tracking-wider">Votre Contrat Yaamaa AI</h3>
                    
                    <div className="space-y-3 font-mono text-[11px] text-indigo-200">
                      <div className="flex justify-between border-b border-indigo-850 pb-2">
                        <span>Type de plan :</span>
                        <strong className="text-white">Assistant IA Personnel</strong>
                      </div>
                      <div className="flex justify-between border-b border-indigo-850 pb-2">
                        <span>Statut :</span>
                        <strong className="text-emerald-400">Actif ✅</strong>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>Date d'expiration :</span>
                        <strong className="text-white">
                          {expiresAt ? new Date(expiresAt).toLocaleDateString() : "Simulation illimitée"}
                        </strong>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =============== TAB CONTENT 2: CONVERSATION HISTORY LOG ============== */}
            {activeTab === "history" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight font-heading">
                      Discussions gérées par l'Agent Yaamaa AI
                    </h2>
                    <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                      Visualisez l'historique complet des réponses intelligentes envoyées automatiquement à vos clients et évaluez leur qualité.
                    </p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                    <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-slate-800">Aucun historique enregistré</h3>
                      <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                        Votre agent n'a pas encore répondu à des messages. Pour faire un test : changez votre statut sur <strong>Absent</strong>, puis écrivez-vous un message privé depuis l'onglet discussions ou un autre utilisateur !
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setStatus("offline");
                        setActiveTab("dashboard");
                        setSuccessMsg("💡 Statut réglé sur 'Absent'. Votre agent est maintenant prêt à intercepter les messages entrants !");
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 font-black text-[10.5px] rounded-xl transition cursor-pointer"
                    >
                      Me mettre en Absent pour tester !
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {history.map((conv) => (
                      <div 
                        key={conv.id} 
                        className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-indigo-300 transition-all shadow-sm"
                      >
                        {/* Conversation Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={conv.senderAvatar || "/src/assets/images/yaamaa_logo_updated_1783116905472.jpg"} 
                              alt={conv.senderUsername} 
                              className="h-8 w-8 rounded-full border border-slate-200 shadow-sm" 
                            />
                            <div>
                              <span className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                                @{conv.senderUsername}
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
                                <span className="text-[9.5px] text-slate-400 font-normal">Correspondant</span>
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono">
                                {new Date(conv.timestamp).toLocaleString("fr-FR")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                onNavigate("discussions");
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 font-black text-[10px] rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              Reprendre la discussion <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Speech bubbles */}
                        <div className="space-y-3 pt-1">
                          {/* Message Entrant */}
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-black uppercase tracking-wider font-mono text-slate-400">Message reçu :</span>
                            <div className="p-3 bg-white rounded-xl border border-slate-150 text-slate-800 text-xs font-mono max-w-2xl leading-relaxed">
                              {conv.messageText}
                            </div>
                          </div>

                          {/* Réponse IA */}
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-black uppercase tracking-wider font-mono text-indigo-400 flex items-center gap-1">
                              <Bot className="h-3 w-3 animate-bounce" /> Réponse automatisée générée :
                            </span>
                            <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-indigo-900 text-xs font-mono max-w-2xl leading-relaxed relative">
                              {conv.aiResponseText}
                            </div>
                          </div>
                        </div>

                        {/* Feedback / Evaluation form */}
                        <div className="border-t border-slate-200/60 pt-3.5 mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/40 p-3 rounded-xl border border-slate-150">
                          {conv.rating !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] text-slate-500 font-mono">Votre évaluation :</span>
                              <div className="flex items-center text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < (conv.rating || 0) ? "fill-current" : "text-slate-200"}`} 
                                  />
                                ))}
                              </div>
                              {conv.feedback && (
                                <span className="text-[10px] italic text-slate-400 font-mono">"{conv.feedback}"</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full space-y-3.5">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-800">Évaluer la qualité de cette réponse :</span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                      const selVal = evalRating[conv.id] || 5;
                                      return (
                                        <button
                                          key={star}
                                          onClick={() => setEvalRating(prev => ({ ...prev, [conv.id]: star }))}
                                          className="text-slate-200 hover:text-amber-400 transition"
                                        >
                                          <Star 
                                            className={`h-5 w-5 cursor-pointer ${
                                              star <= selVal ? "text-amber-400 fill-current" : "text-slate-200"
                                            }`} 
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleEvaluate(conv.id)}
                                  className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl transition cursor-pointer"
                                >
                                  Soumettre l'avis
                                </button>
                              </div>

                              <input
                                type="text"
                                value={evalFeedback[conv.id] || ""}
                                onChange={(e) => setEvalFeedback(prev => ({ ...prev, [conv.id]: e.target.value }))}
                                placeholder="Ajoutez un commentaire pour aider votre agent à s'améliorer (ex: 'Plus de politesse', 'Parfait !')"
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] focus:outline-none placeholder-gray-300 font-mono bg-white"
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =============== TAB CONTENT 3: STATS ============== */}
            {activeTab === "stats" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 3 Bento metrics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Échanges Gérés</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-heading">{stats.conversationsCount}</span>
                      <span className="text-xs text-slate-400 font-mono">discussions</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                      Nombre de conversations interpellées par l'agent pendant votre absence.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Taux de Satisfaction</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-heading">{stats.satisfactionRate}%</span>
                      <span className="text-xs text-slate-400 font-mono">satisfait</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${stats.satisfactionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">Temps de Réponse Moyen</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-heading">{stats.responseTime}s</span>
                      <span className="text-xs text-slate-400 font-mono">en moyenne</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                      Réponses neuronales instantanées, réduisant le taux de rebond des acheteurs.
                    </p>
                  </div>

                </div>

                {/* Performance Analytics Advice */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> Analyse de Performance de l'Agent
                  </h3>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                    <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      💡 Conseils personnalisés de Yaamaa AI
                    </h4>
                    <p className="text-[11px] text-slate-600 font-mono leading-relaxed">
                      {stats.conversationsCount === 0 
                        ? "Votre agent est prêt et n'attend plus que sa première discussion ! Configurez vos informations de boutique et mettez votre statut sur 'Absent' pour commencer à récolter des statistiques de satisfaction clients."
                        : stats.satisfactionRate >= 80 
                          ? "Félicitations ! Les évaluations de vos correspondants sont excellentes. Votre style actuel ('" + settings.personality + "') et les consignes fournies sont clairs, utiles et hautement engageants. Continuez à tenir à jour vos stocks produits pour des réponses précises."
                          : "Le taux de satisfaction est perfectible. Nous vous suggérons d'enrichir le champ 'Connaissances spécifiques de l'Agent' pour lui donner plus de contexte commercial précis (moyens de paiement acceptés, délais exacts de livraison par pays, adresses physiques, etc.) et de lui demander un ton plus amical."
                      }
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
