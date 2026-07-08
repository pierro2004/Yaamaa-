/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, UserRole } from "../types";
import { Language, getTranslation } from "../i18n";

const yaamaaLogo = "/src/assets/images/yaamaa_logo_updated_1783116905472.jpg";

import { 
  Coins, 
  Shield, 
  User as UserIcon, 
  Layers, 
  LogOut, 
  Bell, 
  Globe, 
  Zap,
  Bot,
  CheckCircle2,
  Store,
  Megaphone,
  MessageSquare,
  Users,
  Home,
  HelpCircle,
  Headphones,
  PlusCircle,
  ListTodo,
  Key,
  Briefcase,
  AlertTriangle,
  Info,
  ChevronRight,
  Send,
  Lock,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Menu,
  Gift,
  BarChart3,
  Vote,
  Calendar,
  Mail,
  Phone,
  Award,
  FileText,
  Search,
  Download,
  Truck
} from "lucide-react";
import InstallPwaModal from "./InstallPwaModal";

interface NavbarProps {
  currentUser: User | null;
  usersList: User[];
  onChangeUser: (userId: string) => void;
  onOpenAuth: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
  currentLanguage: Language;
  onChangeLanguage: (lang: Language) => void;
  onViewProfile?: (userId: string) => void;
  isMenuOpen?: boolean;
  onMenuToggle?: (open: boolean) => void;
  onOpenMerchantModal?: () => void;
  onOpenVirtualGifts?: () => void;
}

function SafeText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(Yaamaa|YAAMAA)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "Yaamaa" || part === "YAAMAA") {
          return (
            <span key={i} translate="no" className="notranslate inline-block">
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

export default function Navbar({
  currentUser,
  usersList,
  onChangeUser,
  onOpenAuth,
  currentView,
  onNavigate,
  onLogout,
  currentLanguage,
  onChangeLanguage,
  onViewProfile,
  isMenuOpen,
  onMenuToggle,
  onOpenMerchantModal,
  onOpenVirtualGifts
}: NavbarProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOtherOptionsList, setShowOtherOptionsList] = useState(false);

  React.useEffect(() => {
    if (isMenuOpen !== undefined && isMenuOpen !== showOtherOptionsList) {
      setShowOtherOptionsList(isMenuOpen);
    }
  }, [isMenuOpen]);

  const handleToggleOptions = (val: boolean) => {
    setShowOtherOptionsList(val);
    if (val) {
      setShowUserDropdown(false);
      setShowNotification(false);
    }
    if (onMenuToggle) {
      onMenuToggle(val);
    }
  };

  const handleStickyNavigate = (view: string) => {
    onNavigate(view);
    handleToggleOptions(false);
  };

  const handleOptionSelect = (action?: () => void) => {
    handleToggleOptions(false);
    if (action) {
      action();
    }
  };

  const handleToggleUserDropdown = (val: boolean) => {
    setShowUserDropdown(val);
    if (val) {
      setShowNotification(false);
      setShowOtherOptionsList(false);
      if (onMenuToggle) onMenuToggle(false);
    }
  };

  const handleToggleNotification = (val: boolean) => {
    setShowNotification(val);
    if (val) {
      setShowUserDropdown(false);
      setShowOtherOptionsList(false);
      if (onMenuToggle) onMenuToggle(false);
    }
  };
  
  // Custom Modals
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showMerchantZoneModal, setShowMerchantZoneModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showInstallPwaModal, setShowInstallPwaModal] = useState(false);
  
  // Support Simulated Chat
  const [supportMessage, setSupportMessage] = useState("");
  const [supportChat, setSupportChat] = useState<{ sender: "user" | "support"; text: string; time: string }[]>([
    { 
      sender: "support", 
      text: currentLanguage === "fr" 
        ? "Bonjour ! Je suis Aura de l'équipe d'assistance Yaamaa. Comment puis-je vous aider aujourd'hui ? 🎧" 
        : "Hello! I am Aura from the Yaamaa Support Team. How can I help you today? 🎧", 
      time: "16:30" 
    }
  ]);
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [avatarSaveError, setAvatarSaveError] = useState<string | null>(null);
  const [avatarSaveSuccess, setAvatarSaveSuccess] = useState(false);

  const handleUpdateAvatar = async (newUrl: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentUser.name,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
          address: currentUser.address,
          country: currentUser.country,
          currency: currentUser.currency,
          avatar: newUrl
        })
      });
      if (response.ok) {
        setIsEditingAvatar(false);
        onChangeUser(currentUser.id);
        setAvatarSaveSuccess(true);
        setTimeout(() => setAvatarSaveSuccess(false), 2000);
      } else {
        const err = await response.json();
        setAvatarSaveError(err.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      setAvatarSaveError("Erreur réseau");
    }
  };

  const t = getTranslation(currentLanguage);

  const notifications = [
    { id: 1, title: "Mission Validée ! 🎉", desc: "Votre preuve pour 'Abonnement YouTube' a été approuvée.", time: "Il y a 2 min" },
    { id: 2, title: "Retrait traité ✅", desc: "Votre retrait de 15,000 XOF a été encuissé avec succès.", time: "Il y a 1 h" },
    { id: 3, title: "Alerte de Sécurité 2FA 🔒", desc: "Activez la double authentification pour sécuriser votre solde.", time: "Il y a 1 j" }
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "founder": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "admin": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "advertiser": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "founder": return "Super Admin (Fondateur)";
      case "admin": return "Administrateur";
      case "advertiser": return "Annonceur";
      default: return "Participant";
    }
  };

  // Budget Tiers for Packs
  const budgetTiers = [
    {
      id: "basic",
      badge: "🥉 BRONZE",
      costXof: 32500,
      costEuros: 50,
      viewsEst: "5 000",
      clicksEst: "500",
      duration: "7 Jours",
      color: "border-amber-350 bg-amber-50/20 text-amber-800",
      descFr: "Idéal pour tester l'impact d'un produit physique ou d'un service local.",
      descEn: "Ideal to test the impact of a physical product or local service."
    },
    {
      id: "standard",
      badge: "🥈 SILVER",
      costXof: 97500,
      costEuros: 150,
      viewsEst: "15 000",
      clicksEst: "2 000",
      duration: "15 Jours",
      color: "border-slate-300 bg-slate-50/30 text-slate-700",
      descFr: "Recommandé pour lancer une boutique en ligne d'e-commerce.",
      descEn: "Recommended for launching a new e-commerce store."
    },
    {
      id: "premium",
      badge: "🥇 GOLD",
      costXof: 325000,
      costEuros: 500,
      viewsEst: "50 050",
      clicksEst: "10 000",
      duration: "30 Jours",
      color: "border-emerald-250 bg-emerald-50/25 text-emerald-800",
      descFr: "Parfait pour générer des ventes massives de formations ou fichiers.",
      descEn: "Perfect to generate massive sales of courses or digital downloads."
    },
    {
      id: "enterprise",
      badge: "👑 DIAMOND",
      costXof: 975000,
      costEuros: 1500,
      viewsEst: "150 000",
      clicksEst: "40 000",
      duration: "30 Jours",
      color: "border-purple-300 bg-purple-50/20 text-purple-800",
      descFr: "Visibilité maximale sur l'ensemble de l'Afrique de l'Ouest.",
      descEn: "Maximum visibility across West Africa."
    }
  ];

  // Send Simulated message
  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const userMsg = supportMessage;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add User Message
    setSupportChat(prev => [...prev, { sender: "user", text: userMsg, time: now }]);
    setSupportMessage("");
    setIsSendingSupport(true);

    // Simulate smart support response
    setTimeout(() => {
      let reply = "";
      const lower = userMsg.toLowerCase();
      const isFr = currentLanguage === "fr";

      if (lower.includes("retrait") || lower.includes("argent") || lower.includes("gains") || lower.includes("withdraw")) {
        reply = isFr 
          ? "Pour retirer vos gains, rendez-vous dans l'onglet 'Portefeuille'. Les retraits via Yaamaa Pay (MTN, Moov, Celtiis), Wave, et Orange Money sont instantanés et traités en moins de 5 minutes ! 💰"
          : "To withdraw your earnings, go to the 'Wallet' tab. Withdrawals via Yaamaa Pay (Mobile Money), Wave, and Orange Money are instant and processed in less than 5 minutes! 💰";
      } else if (lower.includes("pack") || lower.includes("diffusion") || lower.includes("pub") || lower.includes("campaign")) {
        reply = isFr
          ? "Nos Packs de Diffusion (Bronze, Silver, Gold, Diamond) vous permettent d'acheter de la visibilité garantie pour vos liens ou boutiques. Cliquez sur l'onglet 'Promotions' pour configurer et lancer votre campagne ! 📦"
          : "Our Visibility Packs (Bronze, Silver, Gold, Diamond) allow you to buy guaranteed views and clicks for your links. Click on the 'Promotions' tab to configure and launch your campaign! 📦";
      } else if (lower.includes("mission") || lower.includes("tâche") || lower.includes("gagner") || lower.includes("earn")) {
        reply = isFr
          ? "Pour gagner de l'argent, visitez l'onglet 'Missions' ou cliquez sur 'Missions' dans les raccourcis. Choisissez une mission, suivez les étapes, envoyez une capture d'écran comme preuve, et recevez vos gains après validation ! 🚀"
          : "To earn money, visit the 'Missions' tab or click on 'Missions' in the shortcuts. Select a mission, follow the instructions, upload a screenshot proof, and collect your rewards! 🚀";
      } else {
        reply = isFr
          ? "Merci pour votre message ! Un administrateur de l'équipe Yaamaa étudie votre demande et vous répondra sous peu. N'hésitez pas à consulter également notre FAQ ci-dessous pour une réponse instantanée. 🤝"
          : "Thank you for your message! A Yaamaa administrator is reviewing your inquiry and will reply shortly. Feel free to browse our FAQ below for instant answers. 🤝";
      }

      setSupportChat(prev => [...prev, { sender: "support", text: reply, time: now }]);
      setIsSendingSupport(false);
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col" id="yaamaa_entire_navigation_suite">
      
      {/* 1. FIXED HEADER (BRAND + 4 FIXED MAIN BUTTONS) */}
      <header id="yaamaa_navbar_container" className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200/85 bg-white shadow-md">
        
        {/* UPPER ROW: BRAND LOGO & USER ACCOUNT CONSOLE */}
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-gray-100">
          
          {/* BRANDING LOGO & BACK BUTTON */}
          <div className="flex items-center gap-2">
            {currentView !== "home" && (
              <button
                type="button"
                onClick={() => {
                  window.history.back();
                }}
                className="p-1.5 sm:p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-200 transition-all flex items-center justify-center cursor-pointer active:scale-95 border border-gray-200"
                title={currentLanguage === "fr" ? "Retour" : "Back"}
                id="navbar_back_button"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            )}

            <div 
              id="yaamaa_logo" 
              onClick={() => onNavigate("home")} 
              className="flex cursor-pointer items-center gap-2 transition active:scale-95 group"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden border border-emerald-100 shadow-xs group-hover:shadow-md transition duration-350">
                <img src={yaamaaLogo} alt="Yaamaa Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span translate="no" className="notranslate font-heading text-lg font-black tracking-tight text-slate-900 leading-none">
                    Yaam<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">aa</span>
                  </span>
                  <span className="px-1 py-0.2 rounded bg-emerald-50 border border-emerald-100 text-[7px] font-mono font-black text-emerald-700 uppercase tracking-wider leading-none">
                    {t.edition}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RECHERCHE DIRECTE PAR NUMÉRO MARCHAND OU TÉLÉPHONE */}
          <div className="hidden md:flex flex-1 max-w-xs mx-4 relative" id="navbar_merchant_direct_search">
            <input
              type="text"
              placeholder={currentLanguage === "fr" ? "Recherche par ID Marchand ou Tél..." : "Search by Merchant ID or Phone..."}
              className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-white rounded-full py-1.5 pl-3.5 pr-9 text-[11px] font-semibold text-slate-900 focus:outline-none transition duration-150"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value.trim();
                  if (query) {
                    const cleanQuery = query.replace(/[\s+]/g, "").toLowerCase();
                    const found = usersList.find(u => {
                      const cleanMerch = (u.merchantNumber || "").toLowerCase();
                      const cleanPhone = (u.phone || "").replace(/[\s+]/g, "").toLowerCase();
                      return cleanMerch === cleanQuery || cleanPhone === cleanQuery || cleanPhone.includes(cleanQuery) || cleanMerch.includes(cleanQuery);
                    });
                    if (found) {
                      if (onViewProfile) onViewProfile(found.id);
                    } else {
                      alert(currentLanguage === "fr" 
                        ? "Aucun membre trouvé avec ce numéro marchand ou numéro de téléphone." 
                        : "No member found with this merchant number or phone number.");
                    }
                  }
                }
              }}
            />
            <div className="absolute right-3 top-2 text-gray-400">
              <Search className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* RIGHT SIDE UTILITIES */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0">
            
            {/* LANGUAGE SELECTOR */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-150 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition hover:bg-gray-100">
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <select
                id="language_select"
                value={currentLanguage}
                onChange={(e) => onChangeLanguage(e.target.value as Language)}
                className="bg-transparent border-none text-[10px] sm:text-[11px] font-bold text-gray-800 focus:ring-0 cursor-pointer p-0 pr-4"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </div>

            {/* NOTIFICATION BUTTON */}
            <div className="relative">
              <button
                id="navbar_notif_button"
                onClick={() => handleToggleNotification(!showNotification)}
                className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-950 rounded-lg transition relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              </button>

              {showNotification && (
                <div id="navbar_notif_dropdown" className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-xl animate-fade-in z-50">
                  <div className="flex items-center justify-between border-b border-gray-50 px-2 py-1.5">
                    <span className="text-xs font-bold text-gray-900">{t.notifications}</span>
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">3 {t.new_notifs}</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-2 hover:bg-gray-50 transition rounded-lg text-[11px]">
                        <p className="font-bold text-gray-900 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          {notif.title}
                        </p>
                        <p className="text-gray-500 text-[10px] mt-0.5 leading-snug">{notif.desc}</p>
                        <span className="text-[9px] text-gray-400 mt-1 block font-mono">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WALLET & ROUND PROFILE BUTTON CONSOLE */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Balance Badge */}
                <div className="hidden sm:flex bg-slate-900 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-800 font-mono font-bold text-[9px] sm:text-xs shrink-0">
                  <span className="text-emerald-400 font-mono">
                    {currentUser.wallet.available.toLocaleString()}{" "}
                    <span className="text-[8px] text-gray-300">{currentUser.currency}</span>
                  </span>
                </div>

                {/* Round profile picture button */}
                <button
                  id="navbar_round_profile_btn"
                  onClick={() => {
                    handleToggleUserDropdown(!showUserDropdown);
                    setIsEditingAvatar(false);
                    setAvatarSaveError(null);
                    setAvatarSaveSuccess(false);
                  }}
                  className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden shadow-sm hover:border-emerald-400 focus:outline-none transition-all duration-350 transform hover:scale-105 active:scale-95 shrink-0 relative flex items-center justify-center bg-gray-100 cursor-pointer"
                  title={currentLanguage === "fr" ? "Mon Compte & Changement de Compte" : "My Account & Switch"}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {/* Premium User Info & Switching Dropdown */}
                {showUserDropdown && (
                  <div id="pfp_dropdown_options" className="absolute right-2 sm:right-6 top-14 mt-2 w-64 rounded-2xl border border-gray-200 bg-white text-gray-900 p-3.5 shadow-2xl z-50 animate-fade-in text-left">
                    {/* User Identity */}
                    <div className="px-1 pb-2 border-b border-gray-100 flex items-center gap-2.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate text-gray-950 leading-tight">{currentUser.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate">@{currentUser.username}</p>
                        <span className={`inline-block mt-1 rounded-full border px-1.5 py-0.2 text-[7.5px] font-black uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                          {getRoleLabel(currentUser.role)}
                        </span>
                      </div>
                    </div>

                    {/* XP Progress */}
                    <div className="py-2 px-1 border-b border-gray-100">
                      <div className="flex justify-between text-gray-500 text-[9px] mb-1 font-bold">
                        <span>Niveau {currentUser.level}</span>
                        <span>{currentUser.xp % 100}/100 XP</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${currentUser.xp % 100}%` }}></div>
                      </div>
                    </div>

                    {/* SECTION: MODIFY PROFILE PICTURE */}
                    <div className="py-2.5 px-1 border-b border-gray-100">
                      {!isEditingAvatar ? (
                        <button
                          onClick={() => {
                            setIsEditingAvatar(true);
                            setCustomAvatarUrl(currentUser.avatar);
                            setAvatarSaveError(null);
                            setAvatarSaveSuccess(false);
                          }}
                          className="w-full text-center py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Modifier ma photo de profil 📸</span>
                        </button>
                      ) : (
                        <div className="space-y-2 animate-fade-in">
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Choisir un avatar ou coller un lien</span>
                          
                          {/* Recommended presets */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                            ].map((url, i) => (
                              <button
                                key={i}
                                onClick={() => handleUpdateAvatar(url)}
                                className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 hover:border-emerald-500 active:scale-95 transition-all cursor-pointer"
                              >
                                <img src={url} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>

                          {/* Custom URL Input */}
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={customAvatarUrl}
                              onChange={(e) => setCustomAvatarUrl(e.target.value)}
                              placeholder="Lien d'image custom..."
                              className="flex-1 text-[10px] px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-gray-800"
                            />
                            <button
                              onClick={() => handleUpdateAvatar(customAvatarUrl)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>

                          {/* Import from phone storage */}
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-bold text-teal-700 block cursor-pointer bg-teal-50 hover:bg-teal-100 py-1.5 px-2 rounded-lg text-center border border-teal-150">
                              📁 Importer depuis ma galerie
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === "string") {
                                        handleUpdateAvatar(reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {avatarSaveError && (
                            <p className="text-[9px] text-rose-500 font-bold">{avatarSaveError}</p>
                          )}

                          <button
                            onClick={() => setIsEditingAvatar(false)}
                            className="text-[9px] text-gray-500 font-bold hover:underline block text-center w-full cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION: SWITCH ACCOUNT (ADMINS & FOUNDERS ONLY) */}
                    {(currentUser.role === "admin" || currentUser.role === "founder") && (
                      <div className="py-2.5 px-1 border-b border-gray-100">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-850 flex items-center gap-1 mb-1.5">
                          <Users className="h-3 w-3 text-indigo-500" />
                          {currentLanguage === "fr" ? "Changer de compte 👥" : "Switch Account 👥"}
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {usersList
                            .filter((u) => u.id !== currentUser.id)
                            .map((usr) => (
                              <button
                                key={usr.id}
                                onClick={() => {
                                  onChangeUser(usr.id);
                                  setShowUserDropdown(false);
                                }}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100 text-left cursor-pointer"
                              >
                                <img
                                  src={usr.avatar}
                                  alt={usr.name}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10.5px] font-extrabold text-gray-900 truncate leading-none">@{usr.username}</p>
                                  <span className="text-[7.5px] font-bold text-gray-500 uppercase font-mono tracking-wider">
                                    {getRoleLabel(usr.role)}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* STANDARD MENU ACTIONS */}
                    <div className="pt-2 text-[11px] space-y-0.5">
                      <button
                        id="pfp_option_my_wallet"
                        onClick={() => {
                          onNavigate("wallet");
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 font-bold transition cursor-pointer"
                      >
                        <Coins className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {t.my_wallet}
                      </button>
                      <button
                        id="pfp_option_profile"
                        onClick={() => {
                          if (onViewProfile) {
                            onViewProfile(currentUser.id);
                          } else {
                            onNavigate("home");
                            onOpenAuth();
                          }
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700 font-bold transition cursor-pointer"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        {currentLanguage === "fr" ? "Mon Portfolio 💼" : "My Portfolio 💼"}
                      </button>
                      <button
                        id="pfp_option_logout"
                        onClick={() => {
                          if (onLogout) onLogout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-rose-50 rounded-lg flex items-center gap-2 text-rose-600 font-bold transition cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        {t.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar_auth_trigger"
                onClick={onOpenAuth}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition active:scale-95 cursor-pointer"
              >
                {t.create_account}
              </button>
            )}

            {/* THREE LINES MENU ICON BUTTON (ONLY THE THREE LINES, NO TITLE) */}
            <button
              id="header_three_lines_menu_button"
              onClick={() => handleToggleOptions(!showOtherOptionsList)}
              className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer shrink-0 ${
                showOtherOptionsList
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md scale-105"
                  : "bg-gray-50 text-slate-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/20"
              }`}
              title={currentLanguage === "fr" ? "Plus d'options" : "More options"}
            >
              <Menu className={`h-5 w-5 transition duration-300 ${showOtherOptionsList ? "rotate-90 text-white" : "text-emerald-600"}`} />
            </button>

          </div>
        </div>

        {/* LOWER ROW: THE 4 FIXED MAIN NAVIGATION BUTTONS (STICKY & RESPONSIVE) */}
        <div className="w-full bg-white border-t border-b border-gray-100 py-2 px-1.5 md:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-around gap-1 sm:gap-3" id="sticky_four_buttons_grid">
            
            {/* 1st Button: ACCUEIL */}
            <button
              id="sticky_btn_home"
              onClick={() => handleStickyNavigate("home")}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 cursor-pointer text-center sm:text-left ${
                currentView === "home"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-lg shadow-emerald-500/25 scale-[1.02]"
                  : "bg-slate-50/80 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/50 border border-gray-200/70"
              }`}
            >
              <Home className={`h-4.5 w-4.5 sm:h-5 sm:w-5 md:h-5.5 md:w-5.5 shrink-0 transition duration-300 ${currentView === "home" ? "text-white scale-110 rotate-3" : "text-emerald-500"}`} />
              <span className="text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-wider font-heading">
                {currentLanguage === "fr" ? "Accueil 🏠" : "Home 🏠"}
              </span>
            </button>
 
            {/* 2nd Button: DISCUSSION */}
            <button
              id="sticky_btn_discussion"
              onClick={() => handleStickyNavigate("discussions")}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 cursor-pointer text-center sm:text-left ${
                currentView === "discussions"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black shadow-lg shadow-violet-500/25 scale-[1.02]"
                  : "bg-slate-50/80 text-gray-700 hover:text-violet-600 hover:bg-violet-50/50 border border-gray-200/70"
              }`}
            >
              <MessageSquare className={`h-4.5 w-4.5 sm:h-5 sm:w-5 md:h-5.5 md:w-5.5 shrink-0 transition duration-300 ${currentView === "discussions" ? "text-white scale-110 -rotate-3" : "text-violet-500"}`} />
              <span className="text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-wider font-heading">
                {currentLanguage === "fr" ? "Discussion 💬" : "Discussion 💬"}
              </span>
            </button>
 
            {/* 3rd Button: SHOP (Boutique) */}
            <button
              id="sticky_btn_boutique"
              onClick={() => handleStickyNavigate("boutique")}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 cursor-pointer text-center sm:text-left ${
                currentView === "boutique"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg shadow-amber-500/25 scale-[1.02]"
                  : "bg-slate-50/80 text-gray-700 hover:text-amber-600 hover:bg-amber-50/50 border border-gray-200/70"
              }`}
            >
              <Store className={`h-4.5 w-4.5 sm:h-5 sm:w-5 md:h-5.5 md:w-5.5 shrink-0 transition duration-300 ${currentView === "boutique" ? "text-white scale-110 rotate-3" : "text-amber-500"}`} />
              <span className="text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-wider font-heading">
                {currentLanguage === "fr" ? "Boutique 🛒" : "Shop 🛒"}
              </span>
            </button>
 
            {/* 4th Button: PORTEFEUILLE */}
            <button
              id="sticky_btn_wallet"
              onClick={() => handleStickyNavigate("wallet")}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 cursor-pointer text-center sm:text-left ${
                currentView === "wallet"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black shadow-lg shadow-indigo-500/25 scale-[1.02]"
                  : "bg-slate-50/80 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 border border-gray-200/70"
              }`}
            >
              <Coins className={`h-4.5 w-4.5 sm:h-5 sm:w-5 md:h-5.5 md:w-5.5 shrink-0 transition duration-300 ${currentView === "wallet" ? "text-white scale-110 -rotate-3" : "text-indigo-500"}`} />
              <span className="text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-wider font-heading">
                {currentLanguage === "fr" ? "Portefeuille 💼" : "Portefeuille 💼"}
              </span>
            </button>

          </div>
        </div>

        {/* VIP MERCHANT SPECIAL TOP STRIP - "EN TÊTE DE LA PLATEFORME" */}
        {(() => {
          const hasMerchantNo = currentUser?.merchantNumber;
          const packType = currentUser?.merchantPackType;

          return (
            <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-t border-b border-white/5 py-2 px-3 sm:px-6 lg:px-8 flex items-center justify-between text-white relative overflow-hidden" id="navbar_merchant_vip_banner">
              {/* Pulsing glowing ambient light in the background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-600/10 opacity-40 blur-md pointer-events-none"></div>
              
              {/* Glossy shine overlay sweep effect */}
              <span className="absolute inset-y-0 h-full w-48 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shine pointer-events-none"></span>
              
              <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 text-[10px] sm:text-xs relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 rounded text-slate-950 shrink-0">
                    <Sparkles className="h-3 w-3 text-white animate-spin-slow" />
                  </div>
                  <span className="font-sans font-bold tracking-wide">
                    {hasMerchantNo ? (
                      currentLanguage === "fr" ? (
                        <span>Compte Marchand VIP Actif : <strong className="text-amber-400 font-mono text-[11px] sm:text-xs">{currentUser?.merchantNumber}</strong> ({packType === "diamond" ? "💎 Diamant" : packType === "gold" ? "🌟 Motivation" : "✨ Base"})</span>
                      ) : (
                        <span>VIP Merchant Account Active: <strong className="text-amber-400 font-mono text-[11px] sm:text-xs">{currentUser?.merchantNumber}</strong> ({packType === "diamond" ? "💎 Diamond" : packType === "gold" ? "🌟 Motivation" : "✨ Base"})</span>
                      )
                    ) : (
                      currentLanguage === "fr" ? (
                        <span>🚀 Activez votre <strong>Numéro Marchand</strong> unique pour toucher vos gains & publier sur la boutique !</span>
                      ) : (
                        <span>🚀 Activate your unique <strong>Merchant Number</strong> to earn commissions & publish on the store!</span>
                      )
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  id="header_activate_merchant_btn"
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuth();
                    } else {
                      if (onOpenMerchantModal) onOpenMerchantModal();
                    }
                  }}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1 hover:scale-105 shrink-0 ${
                    !hasMerchantNo
                      ? "bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md border border-white/10"
                      : "bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-400/20"
                  }`}
                >
                  <span>
                    {!currentUser ? (
                      currentLanguage === "fr" ? "S'inscrire 👑" : "Register 👑"
                    ) : !hasMerchantNo ? (
                      currentLanguage === "fr" ? "Activer 🚀" : "Activate 🚀"
                    ) : (
                      currentLanguage === "fr" ? "Gérer mon Espace ⚙️" : "Manage ⚙️"
                    )}
                  </span>
                  <ChevronRight className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* EXPANDABLE MENU LISTS (MOVED INSIDE THE STICKY HEADER SUITE) */}
        {showOtherOptionsList && (
          <div 
            id="three_lines_expanded_panel" 
            className="w-full bg-white border-t border-gray-200 p-5 sm:p-7 shadow-xl animate-fade-in max-h-[80vh] overflow-y-auto"
          >
            {/* THREE CATEGORIZED LINES OF BUTTONS / OPTION CARDS */}
            <div className="max-w-7xl mx-auto space-y-6 pt-1">
              
              {/* --- LINE 1: MICRO-SERVICES --- */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    Line 1: {currentLanguage === "fr" ? "Gains & Publicités" : "Earnings & Campaigns"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Missions */}
                    <button
                      id="menu_list_btn_missions"
                      onClick={() => handleOptionSelect(() => onNavigate("missions"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-gray-150/80 hover:border-emerald-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-150/20 text-emerald-600 group-hover:scale-105 transition">
                        <CheckCircle2 className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition font-heading">
                          {currentLanguage === "fr" ? "Missions Rémunérées" : "Rewarded Missions"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Gagnez des XOF facilement" : "Complete tasks to earn money"}
                        </span>
                      </div>
                    </button>

                    {/* Promotions */}
                    <button
                      id="menu_list_btn_promotions"
                      onClick={() => handleOptionSelect(() => onNavigate("promotions"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-gray-150/80 hover:border-blue-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-150/20 text-blue-600 group-hover:scale-105 transition">
                        <Megaphone className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-blue-600 transition font-heading">
                          {currentLanguage === "fr" ? "Créer Promotions" : "Launch Campaigns"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Sponsoriser des liens ou pages" : "Advertise your products"}
                        </span>
                      </div>
                    </button>

                    {/* Tâches / Validation */}
                    <button
                      id="menu_list_btn_tasks"
                      onClick={() => handleOptionSelect(() => onNavigate("missions"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-gray-150/80 hover:border-indigo-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-150/20 text-indigo-600 group-hover:scale-105 transition">
                        <ListTodo className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-indigo-600 transition font-heading">
                          {currentLanguage === "fr" ? "Suivi de Tâches" : "My Task Submissions"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Preuves & Validation d'argent" : "Audit tracking & checks"}
                        </span>
                      </div>
                    </button>

                    {/* Fournisseurs & Livreurs */}
                    <button
                      id="menu_list_btn_suppliers"
                      onClick={() => handleOptionSelect(() => onNavigate("suppliers_deliverers"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-gray-150/80 hover:border-amber-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-150/20 text-amber-600 group-hover:scale-105 transition relative">
                        <Truck className="h-5.5 w-5.5" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                          🤝
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-amber-600 transition font-heading">
                          {currentLanguage === "fr" ? "Fournisseurs & Livreurs" : "Suppliers & Drivers"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Annuaire, missions & inscriptions" : "Directory & missions"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* --- LINE 2: ECOSYSTEM OPTIONS --- */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    Line 2: {currentLanguage === "fr" ? "Espace Membres & Solde" : "Community & Wallet"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Packs */}
                    <button
                      id="menu_list_btn_packs"
                      onClick={() => handleOptionSelect(() => setShowPacksModal(true))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-gray-150/80 hover:border-amber-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-150/20 text-amber-600 group-hover:scale-105 transition relative">
                        <Layers className="h-5.5 w-5.5" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white animate-bounce">
                          🔥
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-amber-600 transition font-heading flex items-center gap-1">
                          {currentLanguage === "fr" ? "Packs d'Audience" : "Audience Packs"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Boost de visibilité garanti" : "Guaranteed traffic packages"}
                        </span>
                      </div>
                    </button>

                    {/* Wallet */}
                    <button
                      id="menu_list_btn_wallet"
                      onClick={() => handleOptionSelect(() => onNavigate("wallet"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-gray-150/80 hover:border-teal-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-150/20 text-teal-600 group-hover:scale-105 transition">
                        <Coins className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-teal-600 transition font-heading">
                          {currentLanguage === "fr" ? "Mon Portefeuille" : "My Wallet Balance"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Retrait Mobile Money MTN/Moov/Wave" : "Withdraw earnings instantly"}
                        </span>
                      </div>
                    </button>

                    {/* Membres / Users Directory */}
                    <button
                      id="menu_list_btn_users"
                      onClick={() => handleOptionSelect(() => onNavigate("discussions"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50/50 border border-gray-150/80 hover:border-violet-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-150/20 text-violet-600 group-hover:scale-105 transition">
                        <Users className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-violet-600 transition font-heading">
                          {currentLanguage === "fr" ? "Membres" : "Members"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Leaderboard & Communautés" : "Rankings & custom groups"}
                        </span>
                      </div>
                    </button>

                    {/* Zone Marchand */}
                    <button
                      id="menu_list_btn_merchant_zone"
                      onClick={() => handleOptionSelect(() => setShowMerchantZoneModal(true))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-105 transition relative">
                        <Sparkles className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white animate-pulse">
                          🌟
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-emerald-800 group-hover:text-emerald-950 transition font-heading">
                          {currentLanguage === "fr" ? "Zone Marchand 🌟" : "Merchant Zone 🌟"}
                        </span>
                        <span className="block text-[10.5px] text-emerald-700/80 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Infos Premium, Code & Gains" : "Premium account info & code"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* --- LINE 3: ADVANCED CAPABILITIES --- */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    Line 3: {currentLanguage === "fr" ? "Services Avancés & Aide" : "Advanced Services & Help"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Assistant AI */}
                    <button
                      id="menu_list_btn_assistant"
                      onClick={() => handleOptionSelect(() => onNavigate("assistant"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-gray-150/80 hover:border-purple-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-150/20 text-purple-650 group-hover:scale-105 transition">
                        <Zap className="h-5.5 w-5.5 animate-pulse text-purple-600" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-purple-650 transition font-heading flex items-center gap-1">
                          {currentLanguage === "fr" ? "Assistant Aura" : "AI Aura Assistant"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Conseils de gains automatisés" : "Smart optimization advice"}
                        </span>
                      </div>
                    </button>

                    {/* Yaamaa AI Agent */}
                    <button
                      id="menu_list_btn_yaamaa_ai"
                      onClick={() => handleOptionSelect(() => onNavigate("yaamaa-ai"))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-gray-150/80 hover:border-indigo-250 transition-all text-left cursor-pointer relative"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-150/20 text-indigo-600 group-hover:scale-105 transition">
                        <Bot className="h-5.5 w-5.5 text-indigo-600 animate-pulse" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-indigo-650 transition font-heading flex items-center gap-1">
                          {currentLanguage === "fr" ? "Yaamaa AI 🤖" : "Yaamaa AI 🤖"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Louez votre agent virtuel 24h/7" : "Rent your personal 24/7 virtual assistant"}
                        </span>
                      </div>
                      {currentUser?.yaamaaAiActive && (
                        <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </button>

                    {/* Sécurité */}
                    <button
                      id="menu_list_btn_security"
                      onClick={() => handleOptionSelect(() => {
                        if (currentUser?.role === "admin" || currentUser?.role === "founder") {
                          onNavigate("admin");
                        } else {
                          setShowSecurityDialog(true);
                        }
                      })}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-gray-150/80 hover:border-rose-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-150/20 text-rose-500 group-hover:scale-105 transition">
                        <Shield className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-rose-500 transition font-heading">
                          {currentUser?.role === "admin" || currentUser?.role === "founder" 
                            ? (currentLanguage === "fr" ? "Console Admin ⚙️" : "Admin Console ⚙️")
                            : (currentLanguage === "fr" ? "Centre de Sécurité" : "Security Hub")}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Double authentification & logs" : "Security logs & audit trails"}
                        </span>
                      </div>
                    </button>

                    {/* Support Technique */}
                    <button
                      id="menu_list_btn_support"
                      onClick={() => handleOptionSelect(() => setShowSupportModal(true))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-gray-150/80 hover:border-teal-250 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-150/20 text-teal-600 group-hover:scale-105 transition">
                        <Headphones className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-teal-600 transition font-heading">
                          {currentLanguage === "fr" ? "Assistance 24h/24" : "Support Chat & FAQ"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Aide immédiate par Aura" : "Get help with any trouble"}
                        </span>
                      </div>
                    </button>

                    {/* Installer l'application */}
                    <button
                      id="menu_list_btn_install_app"
                      onClick={() => handleOptionSelect(() => setShowInstallPwaModal(true))}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-gray-150/80 hover:border-emerald-250 transition-all text-left cursor-pointer relative"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-150/20 text-emerald-600 group-hover:scale-105 transition">
                        <Download className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition font-heading flex items-center gap-1">
                          {currentLanguage === "fr" ? "Installer l'App 📲" : "Install App 📲"}
                        </span>
                        <span className="block text-[10.5px] text-gray-400 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Lancer depuis l'écran d'accueil" : "Launch from your home screen"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* --- LINE 4: EXCITING NEW PLATFORM EXTENSIONS --- */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                    Line 4: {currentLanguage === "fr" ? "Fonctionnalités Festives" : "Extra Rewards & Games"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Bonus Journalier */}
                    <button
                      id="menu_list_btn_daily_bonus"
                      onClick={() => handleOptionSelect(() => { 
                        alert(currentLanguage === "fr" 
                          ? "🎁 Bonus Journalier Réclamé ! +25 XP & +50 XOF ajoutés à votre solde !" 
                          : "🎁 Daily Bonus Claimed! +25 XP & +50 XOF added to your balance!"
                        );
                      })}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-150 hover:border-amber-300 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:scale-105 transition">
                        <Gift className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-amber-900 group-hover:text-amber-950 transition font-heading">
                          {currentLanguage === "fr" ? "Bonus Journalier" : "Daily Bonus Drop"}
                        </span>
                        <span className="block text-[10.5px] text-amber-700/80 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Réclamer vos XOF & XP quotidiens" : "Claim daily free XOF rewards"}
                        </span>
                      </div>
                    </button>

                    {/* Loterie de la Chance */}
                    <button
                      id="menu_list_btn_lottery"
                      onClick={() => handleOptionSelect(() => {
                        alert(currentLanguage === "fr"
                          ? "🎟️ Vous avez rejoint le tirage au sort hebdomadaire ! Gagnez jusqu'à 100 000 XOF. Prochain tirage ce dimanche !"
                          : "🎟️ You have successfully entered the weekly Lucky Draw! Win up to 100,000 XOF. Next draw is on Sunday!"
                        );
                      })}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-150 hover:border-indigo-300 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 group-hover:scale-105 transition">
                        <Vote className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-indigo-900 group-hover:text-indigo-950 transition font-heading">
                          {currentLanguage === "fr" ? "Loterie de la Chance" : "Lucky Lottery Ticket"}
                        </span>
                        <span className="block text-[10.5px] text-indigo-700/80 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Tentez votre chance chaque semaine" : "Enter weekly draw to win jackpot"}
                        </span>
                      </div>
                    </button>

                    {/* Statistiques de la plateforme */}
                    <button
                      id="menu_list_btn_stats"
                      onClick={() => handleOptionSelect(() => {
                        alert(currentLanguage === "fr"
                          ? "📊 Statistiques en direct: 14,230 Membres | 1.8M XOF distribués ce mois-ci | 321 Campagnes Actives"
                          : "📊 Live Stats: 14,230 Members | 1.8M XOF paid out this month | 321 Active Campaigns"
                        );
                      })}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50 hover:from-slate-100 hover:to-emerald-100 border border-slate-200 hover:border-emerald-300 transition-all text-left cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:scale-105 transition">
                        <BarChart3 className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-slate-900 group-hover:text-slate-950 transition font-heading">
                          {currentLanguage === "fr" ? "Statistiques Live" : "Platform Live Stats"}
                        </span>
                        <span className="block text-[10.5px] text-slate-650 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Membres actifs & volume de paiements" : "Live audit of active members"}
                        </span>
                      </div>
                    </button>

                    {/* Cadeaux Virtuels */}
                    <button
                      id="menu_list_btn_virtual_gifts"
                      onClick={() => handleOptionSelect(() => {
                        if (onOpenVirtualGifts) onOpenVirtualGifts();
                      })}
                      className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 hover:border-amber-300 transition-all text-left cursor-pointer animate-pulse"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:scale-105 transition">
                        <Gift className="h-5.5 w-5.5 text-amber-600 animate-bounce" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-black text-amber-900 group-hover:text-amber-950 transition font-heading flex items-center gap-1">
                          {currentLanguage === "fr" ? "Cadeaux Virtuels 🎁" : "Virtual Gifts 🎁"}
                        </span>
                        <span className="block text-[10.5px] text-amber-700/80 font-mono mt-0.5 truncate">
                          {currentLanguage === "fr" ? "Boutique, envoi & retraits" : "Store, sending & withdrawal"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

      </header>


      {/* ========================================================= */}
      {/* ================= CUSTOM ACTION MODALS ================== */}
      {/* ========================================================= */}

      {/* 1. PACKS DE DIFFUSION MODAL */}
      {showPacksModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="packs_diffusion_modal">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowPacksModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
                <Layers className="h-6 w-6 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentLanguage === "fr" ? "Packs de Diffusion Publicitaire" : "Advertising Visibility Packs"}
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xl mx-auto">
                {currentLanguage === "fr" 
                  ? "Achetez un pack publicitaire pour propulser votre boutique, vos réseaux ou vos missions auprès des milliers de membres actifs en Afrique de l'Ouest." 
                  : "Buy an ad pack to instantly boost your shop products, websites, or social networks to thousands of active users in West Africa."}
              </p>
            </div>

            {/* Grid of Packs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {budgetTiers.map((pack) => (
                <div 
                  key={pack.id} 
                  className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${pack.color}`}
                >
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-white border">
                      {pack.badge}
                    </span>
                    <div className="mt-3">
                      <span className="block text-xl font-mono font-black text-slate-900">
                        {pack.costXof.toLocaleString()} XOF
                      </span>
                      <span className="block text-xs font-mono font-semibold text-gray-500">
                        ~ {pack.costEuros} EUR
                      </span>
                    </div>

                    <div className="my-3.5 space-y-1.5 text-xs text-slate-700 font-medium">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <strong>{pack.viewsEst}</strong> {currentLanguage === "fr" ? "Vues Estimées" : "Estimated Views"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <strong>{pack.clicksEst}</strong> {currentLanguage === "fr" ? "Clics Garantis" : "Guaranteed Clics"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {currentLanguage === "fr" ? "Diffusion :" : "Duration:"} <strong>{pack.duration}</strong>
                      </p>
                    </div>

                    <p className="text-[10px] text-gray-500 italic border-t border-gray-100 pt-2 leading-relaxed">
                      {currentLanguage === "fr" ? pack.descFr : pack.descEn}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPacksModal(false);
                      onNavigate("promotions");
                    }}
                    className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition active:scale-95"
                  >
                    {currentLanguage === "fr" ? "Lancer ce Pack" : "Launch this Pack"}
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
              <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  {currentLanguage === "fr" ? "Comment se déroule la diffusion ?" : "How does the campaign works?"}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {currentLanguage === "fr"
                    ? "Après sélection d'un pack et configuration de votre campagne publicitaire, notre algorithme pousse instantanément votre contenu au sommet des flux des membres. Les gains sont directement versés depuis votre solde publicitaire."
                    : "After selecting a pack, configure your ad link. Our matching algorithm automatically pushes your link to active users' micro-tasks list. High performance and real click metrics are monitored on your advertiser dashboard."}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. ASSISTANCE TECHNIQUE & SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="assistance_support_modal">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row gap-6">
            
            {/* Close button */}
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* LEFT SECTION: FAQ AND USEFUL LINKS */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Headphones className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {currentLanguage === "fr" ? "FAQ & Centre d'Aide" : "FAQ & Help Center"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {currentLanguage === "fr" ? "Réponses immédiates à vos questions." : "Instant answers to your questions."}
                  </p>
                </div>
              </div>

              {/* FAQ Collapsible items */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                
                {/* Q1 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    {currentLanguage === "fr" ? "Comment retirer mes gains de mon compte ?" : "How to withdraw my earnings?"}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed">
                    {currentLanguage === "fr" 
                      ? "Rendez-vous dans la section 'Portefeuille'. Cliquez sur 'Demander un Retrait', saisissez le montant en XOF ou EUR, puis choisissez Yaamaa Pay (Mobile Money MTN/Moov/Celtiis), Wave, ou Orange Money. Le traitement est instantané et validé sous 5 minutes."
                      : "Go to the 'Wallet' tab, click 'Request Withdrawal', enter the amount, and choose Yaamaa Pay (Mobile Money) or other automated cashouts. Our automated system handles transactions within 5 minutes."}
                  </p>
                </div>

                {/* Q2 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    {currentLanguage === "fr" ? "Qu'est-ce qu'un Pack de Diffusion ?" : "What is a Visibility Pack?"}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed">
                    {currentLanguage === "fr"
                      ? "C'est un produit publicitaire destiné aux annonceurs. En achetant un Pack (Bronze, Silver, Gold, Diamond), vous obtenez des milliers de vues et de clics ciblés de vrais utilisateurs d'Afrique de l'Est pour promouvoir votre lien."
                      : "An ad package for publishers to get targeted hits from active members in Africa, generating high quality backlinks and visitors."}
                  </p>
                </div>

                {/* Q3 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    {currentLanguage === "fr" ? "Comment mes tâches sont-elles validées ?" : "How are tasks validated?"}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed">
                    {currentLanguage === "fr"
                      ? "Une fois que vous avez accompli une mission (abonnement, partage, avis), soumettez une capture d'écran claire dans l'application. Nos administrateurs valident les preuves sous 24h, et les fonds sont crédités sur votre solde disponible."
                      : "Submit a clear screenshot proof after completing any micro-task. Administrators manually audit all validations within 24 hours."}
                  </p>
                </div>

              </div>

              {/* Official Social Links */}
              <div className="flex gap-2 text-xs pt-1">
                <a 
                  href="https://wa.me/22900000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 hover:bg-emerald-100 transition text-center"
                >
                  📲 {currentLanguage === "fr" ? "Support WhatsApp" : "WhatsApp Support"}
                </a>
                <a 
                  href="https://t.me/yaamaafounder" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-50 text-sky-700 font-bold border border-sky-100 hover:bg-sky-100 transition text-center"
                >
                  ✈️ {currentLanguage === "fr" ? "Canal Telegram" : "Telegram Channel"}
                </a>
              </div>
            </div>

            {/* RIGHT SECTION: INTERACTIVE MESSAGING CHATBOX */}
            <div className="flex-1 flex flex-col justify-between bg-slate-50 rounded-2xl border border-slate-100 p-4 max-h-[550px] min-h-[350px]">
              
              {/* Chat Title */}
              <div className="border-b border-gray-200/60 pb-2.5 mb-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                  {currentLanguage === "fr" ? "Chat d'Assistance Aura" : "Aura Support Chat"}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
                {supportChat.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-white text-slate-800 border border-slate-200/60 rounded-tl-none shadow-xs"
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1 font-mono px-1">{msg.time}</span>
                  </div>
                ))}

                {isSendingSupport && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pl-1">
                    <span className="animate-bounce font-mono">.</span>
                    <span className="animate-bounce font-mono" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce font-mono" style={{ animationDelay: '0.4s' }}>.</span>
                    <span>{currentLanguage === "fr" ? "Aura réfléchit..." : "Aura is typing..."}</span>
                  </div>
                )}
              </div>

              {/* Send message form */}
              <form onSubmit={handleSendSupportMessage} className="flex gap-2 pt-2 border-t border-gray-250">
                <input
                  type="text"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder={currentLanguage === "fr" ? "Écrivez votre message d'aide..." : "Type your help inquiry..."}
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={isSendingSupport || !supportMessage.trim()}
                  className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition disabled:opacity-40 flex items-center justify-center cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* 3. SECURITY STATUS REPORT DIALOG */}
      {showSecurityDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="security_status_dialog">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowSecurityDialog(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-3 border border-rose-100">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {currentLanguage === "fr" ? "Rapport de Sécurité Yaamaa" : "Yaamaa Security Console"}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Status: SECURE_NODE_OK</p>
            </div>

            {/* Status indicators */}
            <div className="space-y-3 mb-5 text-xs text-slate-700">
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">
                      {currentLanguage === "fr" ? "Liaison Mobile Money" : "Mobile Money Link"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {currentLanguage === "fr" ? "Compte de versement actif" : "Payout number connected"}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-black text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  {currentLanguage === "fr" ? "Lié" : "Linked"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">
                      {currentLanguage === "fr" ? "Cryptage AES-256" : "AES-256 Encryption"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {currentLanguage === "fr" ? "Données et soldes chiffrés" : "Balances & sessions locked"}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-black text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/40 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Info className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">
                      {currentLanguage === "fr" ? "Double Facteur OTP" : "OTP 2-Factor Auth"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {currentLanguage === "fr" ? "Exigé pour retraits > 5 000 XOF" : "Required for high withdrawals"}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-black text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  AUTO_ON
                </span>
              </div>

            </div>

            {/* Safety disclaimer */}
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-[10.5px] leading-relaxed flex gap-2.5 items-start">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <p>
                <strong>{currentLanguage === "fr" ? "Rappel crucial :" : "Crucial Reminder:"}</strong>{" "}
                {currentLanguage === "fr"
                  ? "Ne communiquez jamais vos codes de validation Yaamaa Pay, vos mots de passe ou vos codes OTP reçus par SMS à qui que ce soit. L'équipe d'administration de Yaamaa ne vous les demandera jamais."
                  : "Never share your Yaamaa Pay tokens, passwords, or SMS OTP verification codes with anyone. Yaamaa support agents will never ask for your private verification numbers."}
              </p>
            </div>

            <button
              onClick={() => setShowSecurityDialog(false)}
              className="w-full mt-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl text-xs font-extrabold transition uppercase tracking-wider active:scale-95 cursor-pointer"
            >
              {currentLanguage === "fr" ? "Fermer la console de sécurité" : "Close security console"}
            </button>

          </div>
        </div>
      )}

      {/* 4. MODAL ZONE MARCHAND */}
      {showMerchantZoneModal && currentUser && (() => {
        const referralsCount = usersList.filter(
          (u) => u.referredBy === currentUser.id || u.referredBy === currentUser.referralCode
        ).length;

        const regDateFormatted = currentUser.createdAt
          ? new Date(currentUser.createdAt).toLocaleDateString(currentLanguage === "fr" ? "fr-FR" : "en-US", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })
          : "N/A";

        const isPremium = !!currentUser.merchantNumber;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="merchant_zone_modal">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-150 text-left max-h-[90vh] overflow-y-auto">
              
              {/* Close Button */}
              <button 
                onClick={() => setShowMerchantZoneModal(false)}
                className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer font-bold"
              >
                ✕
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 border-b pb-4 mb-5">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0 border border-emerald-100">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Yaamaa Premium</span>
                  <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                    {currentLanguage === "fr" ? "Espace Zone Marchand" : "Merchant Zone Panel"}
                  </h3>
                </div>
              </div>

              {/* Profile Card & Premium Badge Info */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-5 relative overflow-hidden">
                {isPremium && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                )}
                
                {/* Avatar with absolute premium badge next to it */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-white shrink-0">
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {isPremium ? (
                    <span className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 border border-white animate-bounce">
                      👑 PREMIUM
                    </span>
                  ) : (
                    <span className="absolute -bottom-1.5 -right-1.5 bg-slate-300 text-slate-700 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border border-white">
                      STANDARD
                    </span>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">{currentUser.name}</h4>
                    {isPremium ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg">
                        Actif
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg">
                        En Attente d'Activation
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono">@{currentUser.username}</p>
                  <p className="text-[11px] text-indigo-750 font-semibold flex items-center gap-1 justify-center sm:justify-start mt-1">
                    <Award className="h-3.5 w-3.5 text-indigo-600" />
                    <span>
                      {currentUser.role === "founder" ? "Super Admin (Fondateur)" : currentUser.role === "admin" ? "Administrateur" : isPremium ? "Membre Yaamaa Premium" : "Membre Standard"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Informational Grid of User Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
                
                {/* Email Address */}
                <div className="p-3 bg-gray-50/50 border rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Adresse Email</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{currentUser.email || "N/A"}</span>
                  </p>
                </div>

                {/* Country of Residence */}
                <div className="p-3 bg-gray-50/50 border rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Pays de Résidence</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{currentUser.country || "N/A"}</span>
                  </p>
                </div>

                {/* Phone number */}
                <div className="p-3 bg-gray-50/50 border rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Numéro de Téléphone</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{currentUser.phone || "N/A"}</span>
                  </p>
                </div>

                {/* Date d'inscription */}
                <div className="p-3 bg-gray-50/50 border rounded-2xl space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Date d'Inscription</span>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{regDateFormatted}</span>
                  </p>
                </div>

                {/* Unique referral code */}
                <div className="p-3 bg-indigo-50/35 border border-indigo-100 rounded-2xl col-span-1 sm:col-span-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Votre Code de Parrainage</span>
                    <strong className="font-mono text-sm font-black text-gray-950 tracking-wider">
                      {currentUser.referralCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.referralCode || "");
                      alert("Code de parrainage copié avec succès !");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Copier
                  </button>
                </div>

                {/* Unique Merchant Number */}
                <div className="p-3 bg-emerald-50/35 border border-emerald-100 rounded-2xl col-span-1 sm:col-span-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">Votre Numéro Marchand</span>
                    <strong className="font-mono text-sm font-black text-gray-950 tracking-wider">
                      {currentUser.merchantNumber || "NON ACTIVER (Standard)"}
                    </strong>
                  </div>
                  {currentUser.merchantNumber ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser.merchantNumber || "");
                        alert("Numéro marchand copié avec succès !");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      Copier
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMerchantZoneModal(false);
                        onOpenMerchantModal?.();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm animate-pulse"
                    >
                      Activer 🚀
                    </button>
                  )}
                </div>

                {/* Motivational Banner when Merchant Number is not active */}
                {!currentUser.merchantNumber && (
                  <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                        <Sparkles className="h-4.5 w-4.5 animate-pulse text-amber-600" />
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-extrabold text-amber-950 uppercase tracking-wide">
                          🚀 Avantages du Compte Yaamaa Premium & Numéro Marchand
                        </h5>
                        <p className="text-[10.5px] text-amber-900/80 mt-0.5 leading-relaxed font-medium">
                          Déverrouillez le véritable potentiel d'affiliation de votre compte et commencez à bâtir un revenu passif puissant !
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10.5px] text-gray-750 pl-1">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-extrabold">✓</span>
                        <p>
                          <strong className="text-slate-900 font-semibold">Gagnez 50% de commission immédiate</strong> sur chaque nouveau filleul qui active son propre numéro marchand !
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-extrabold">✓</span>
                        <p>
                          <strong className="text-slate-900 font-semibold">Éligibilité de gains à vie</strong> : Ne perdez jamais vos droits de parrainage après le délai obligatoire de 30 jours !
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-extrabold">✓</span>
                        <p>
                          <strong className="text-slate-900 font-semibold">Badge Premium Royal 👑</strong> visible sur votre profil public pour maximiser la confiance de vos filleuls !
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-extrabold">✓</span>
                        <p>
                          <strong className="text-slate-900 font-semibold">Retraits prioritaires</strong> sans limite et support client VIP 24h/24.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMerchantZoneModal(false);
                          onOpenMerchantModal?.();
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition shadow-md hover:shadow-lg transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>🌟 Activer mon Numéro Marchand maintenant</span>
                        <span>🚀</span>
                      </button>
                      <p className="text-[9.5px] text-amber-800/80 mt-2 font-mono text-center">
                        ⚠️ Sans numéro actif sous 30 jours, vos parrainages actuels et futurs ne vous rapporteront aucune commission.
                      </p>
                    </div>
                  </div>
                )}

                {/* Count of Referred Users */}
                <div className="p-4 bg-slate-50 border rounded-2xl col-span-1 sm:col-span-2 text-center space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Nombre total de Filleuls Parrainés</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="font-mono text-base font-black text-gray-950">
                      {referralsCount} {referralsCount > 1 ? "Filleuls" : "Filleul"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Sub-buttons Footer Area */}
              <div className="border-t pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMerchantZoneModal(false);
                    setShowConditionsModal(true);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span>📜 Conditions d'Utilisation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMerchantZoneModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition text-center cursor-pointer"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 5. MODAL CONDITIONS D'UTILISATION */}
      {showConditionsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="conditions_modal">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-150 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowConditionsModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b pb-4 mb-5">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0 border border-indigo-100">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Règles de la Plateforme</span>
                <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                  {currentLanguage === "fr" ? "Conditions & Règles de Yaamaa" : "Yaamaa Platform Conditions"}
                </h3>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs text-gray-650 leading-relaxed mb-6">
              <p className="font-medium text-[11px] text-gray-400 uppercase tracking-wider">Règlement et Code de Conduite de l'Utilisateur</p>
              
              {/* Rule 1 */}
              <div className="p-3 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-base">🕒</span>
                  <span>1. Règle d'Éligibilité des 30 Jours</span>
                </h4>
                <p className="text-gray-600 text-[11px]">
                  Tout utilisateur de Yaamaa dispose d'un délai de <strong>30 jours</strong> après son inscription pour acheter et activer son Numéro Marchand unique. Si le numéro n'est pas activé dans ce délai, l'éligibilité aux commissions d'affiliation est perdue définitivement à vie.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-3 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-base">🤝</span>
                  <span>2. Unicité Exclusive du Numéro Marchand</span>
                </h4>
                <p className="text-gray-600 text-[11px]">
                  Chaque Numéro Marchand est strictement unique et lié à un seul et unique compte utilisateur. Il est formellement impossible de partager, louer ou attribuer un même numéro marchand à plusieurs comptes.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-3 rounded-2xl bg-rose-50/45 border border-rose-100 space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-base">🚫</span>
                  <span>3. Anti-Fraude & Multi-comptes</span>
                </h4>
                <p className="text-gray-600 text-[11px]">
                  La création de comptes factices, d'auto-parrainages frauduleux ou la simulation artificielle d'inscriptions est strictement proscrite. Les comptes fraudeurs seront immédiatement et définitivement bloqués avec confiscation définitive des gains.
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100 space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-base">💰</span>
                  <span>4. Versement des Commissions d'Affiliation</span>
                </h4>
                <p className="text-gray-600 text-[11px]">
                  Pour qu'un parrain touche sa commission de <strong>50%</strong>, le filleul parrainé doit obligatoirement acheter et activer son propre Numéro Marchand unique. Si le parrain ne possède pas de numéro marchand actif, aucune commission ne sera créditée.
                </p>
              </div>

              {/* Rule 5 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-150 space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                  <span className="text-base">📸</span>
                  <span>5. Authenticité des Preuves de Tâche</span>
                </h4>
                <p className="text-gray-600 text-[11px]">
                  Toutes les captures d'écran servant de preuves de validation des missions (abonnements, avis, likes) doivent provenir d'actions réelles de l'utilisateur. Toute soumission de fausse preuve mènera à la suspension temporaire ou permanente du compte.
                </p>
              </div>

            </div>

            {/* Back Button */}
            <div className="flex gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowConditionsModal(false);
                  setShowMerchantZoneModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setShowConditionsModal(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {showInstallPwaModal && (
        <InstallPwaModal
          isOpen={showInstallPwaModal}
          onClose={() => setShowInstallPwaModal(false)}
        />
      )}

    </div>
  );
}
