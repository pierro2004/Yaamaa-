import React, { useState, useEffect } from "react";
import { User, Product, PromoCampaign, Campaign } from "../types";
import { Language, getTranslation } from "../i18n";
import MerchantBadge from "./MerchantBadge";
import {
  X,
  MessageSquare,
  Store,
  Megaphone,
  Award,
  MapPin,
  Calendar,
  Volume2,
  BookOpen,
  Newspaper,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Star,
  Lock,
  Crown
} from "lucide-react";

interface UserProfileModalProps {
  userId: string;
  currentUserId: string | null;
  onClose: () => void;
  onStartChat: (otherUserId: string) => void;
  usersList: User[];
  productsList: Product[];
  promoCampaignsList: PromoCampaign[];
  currentLanguage: Language;
}

export default function UserProfileModal({
  userId,
  currentUserId,
  onClose,
  onStartChat,
  usersList,
  productsList,
  promoCampaignsList,
  currentLanguage
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "publications" | "shop" | "campaigns" | "privacy">("about");
  const [publications, setPublications] = useState<any[]>([]);
  const [isLoadingPubs, setIsLoadingPubs] = useState(false);

  const t = getTranslation(currentLanguage);

  const user = usersList.find((u) => u.id === userId);

  // VIP Timer effect
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isVipExpired, setIsVipExpired] = useState(false);

  useEffect(() => {
    if (!user?.vipStatus) return;
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(user.vipStatus!.expiresAt).getTime();
      const diff = expiry - now;
      if (diff <= 0) {
        setIsVipExpired(true);
        setTimeLeft(null);
      } else {
        setIsVipExpired(!user.vipStatus!.isActive);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.vipStatus]);

  const [isProfilePrivate, setIsProfilePrivate] = useState(user?.privacySettings?.isProfilePrivate ?? false);
  const [hideMerchantNumber, setHideMerchantNumber] = useState(user?.privacySettings?.hideMerchantNumber ?? false);
  const [hideJoinDate, setHideJoinDate] = useState(user?.privacySettings?.hideJoinDate ?? false);
  const [hidePublications, setHidePublications] = useState(user?.privacySettings?.hidePublications ?? false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacySuccessMsg, setPrivacySuccessMsg] = useState<string | null>(null);

  const handleSavePrivacy = async () => {
    if (!user) return;
    setIsSavingPrivacy(true);
    setPrivacySuccessMsg(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacySettings: {
            isProfilePrivate,
            hideMerchantNumber,
            hideJoinDate,
            hidePublications,
          }
        })
      });
      if (res.ok) {
        setPrivacySuccessMsg(currentLanguage === "fr" ? "Paramètres de confidentialité mis à jour avec succès !" : "Privacy settings updated successfully!");
        setTimeout(() => setPrivacySuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Error saving privacy", err);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const currentUserObj = usersList.find(u => u.id === currentUserId);
  const isAdminOrFounder = currentUserObj?.role === "admin" || currentUserObj?.role === "founder";
  const isSelf = currentUserId === user?.id;
  const isPrivate = user?.privacySettings?.isProfilePrivate && !isAdminOrFounder && !isSelf;
  const hideMerchant = (user?.privacySettings?.hideMerchantNumber || isPrivate) && !isAdminOrFounder && !isSelf;
  const hideJoin = (user?.privacySettings?.hideJoinDate || isPrivate) && !isAdminOrFounder && !isSelf;
  const hidePubs = (user?.privacySettings?.hidePublications || isPrivate) && !isAdminOrFounder && !isSelf;

  // Fetch publications (group messages) for this user from backend
  useEffect(() => {
    if (!userId) return;
    setIsLoadingPubs(true);
    fetch(`/api/social/publications/${userId}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setPublications(data);
        setIsLoadingPubs(false);
      })
      .catch((err) => {
        console.error("Error loading publications", err);
        setIsLoadingPubs(false);
      });
  }, [userId]);

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center">
          <p className="text-gray-500 font-medium">Utilisateur introuvable.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Filter products and promo campaigns
  const userProducts = productsList.filter((p) => p.ownerId === user.id && p.isApproved && !p.isBanned);
  const userPromos = promoCampaignsList.filter((c) => c.ownerId === user.id);

  // Default bio/story if not provided
  const userBio = user.bio || (currentLanguage === "fr" 
    ? "Membre actif de la communauté Yaamaa. Ensemble, construisons l'économie de demain." 
    : "Active member of the Yaamaa community. Together, let's build the economy of tomorrow.");

  const userStory = user.story || (currentLanguage === "fr"
    ? `J'ai rejoint la plateforme pour découvrir les talents locaux et développer mon activité. Yaamaa m'aide au quotidien à rentabiliser mes projets tout en échangeant avec des pionniers de toute l'Afrique.`
    : `I joined the platform to discover local talents and develop my business. Yaamaa helps me monetize my projects daily while interacting with pioneers from all over Africa.`);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "founder": return currentLanguage === "fr" ? "Fondateur Yaamaa" : "Yaamaa Founder";
      case "admin": return currentLanguage === "fr" ? "Administrateur" : "Administrator";
      case "advertiser": return currentLanguage === "fr" ? "Annonceur Pro" : "Pro Advertiser";
      default: return currentLanguage === "fr" ? "Participant Actif" : "Active Participant";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "founder": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "admin": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "advertiser": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
  };

  return (
    <div id="user_profile_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-md p-0 sm:p-4 animate-fade-in overflow-y-auto">
      <div id="user_profile_modal_card" className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl rounded-none sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-0 sm:my-4">
        
        {/* BANNER COVER */}
        <div 
          className="h-36 bg-cover bg-center relative shrink-0" 
          style={{ backgroundImage: `url('/src/assets/images/yamaa_cover_1783033730508.jpg')` }}
        >
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"></div>
          <button
            id="close_profile_modal_btn"
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/25 hover:bg-white/40 border border-white/20 text-white flex items-center justify-center transition backdrop-blur-xs shadow-md cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PROFILE MAIN OVERLAPPING HEADER */}
        <div className="px-6 pb-4 relative shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-4">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-gray-50 relative z-10 shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 truncate tracking-tight">{user.name}</h2>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border tracking-widest leading-none ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
                {user.merchantNumber && !hideMerchant && (
                  <MerchantBadge tier={user.merchantPackType} size="sm" showLabel={true} />
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">@{user.username}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-2 font-sans">
                <span className="flex items-center gap-1 font-semibold text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  {user.country}
                </span>
                {!hideJoin && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : (currentLanguage === "fr" ? "Inscrit en 2026" : "Joined in 2026")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-[10px]">
                  <Award className="h-3.5 w-3.5" />
                  Niveau {user.level}
                </span>
              </div>
            </div>

            {/* SEND DIRECT MESSAGE ACTION */}
            {currentUserId !== user.id && (
              <button
                id="profile_direct_msg_btn"
                onClick={() => onStartChat(user.id)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer border border-emerald-500/20 shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                {currentLanguage === "fr" ? "Discuter / Voice Note" : "Chat / Voice Note"}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-600 leading-relaxed italic bg-gray-50 p-3 rounded-2xl border border-gray-100">
            "{userBio}"
          </p>

          {/* VIP Status & Countdown Banner */}
          {user.vipStatus && (
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md">
                  <Crown className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-700 tracking-wider">Statut VIP Temporaire</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      user.vipStatus.isActive && !isVipExpired ? 'bg-emerald-500/20 text-emerald-700' : 'bg-rose-500/20 text-rose-700'
                    }`}>
                      {user.vipStatus.isActive && !isVipExpired ? 'ACTIF' : 'EXPIRÉ'}
                    </span>
                  </div>
                  {user.vipStatus.isActive && !isVipExpired && timeLeft ? (
                    <p className="text-xs font-mono font-bold text-gray-900 mt-1">
                      Temps restant : {timeLeft.days} jours – {String(timeLeft.hours).padStart(2, '0')} heures – {String(timeLeft.minutes).padStart(2, '0')} minutes – {String(timeLeft.seconds).padStart(2, '0')} secondes
                    </p>
                  ) : (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      Votre période VIP est terminée. Pour continuer à recevoir des commissions sur les inscriptions et achats réalisés par vos filleuls, veuillez souscrire à un abonnement Premium.
                    </p>
                  )}
                </div>
              </div>

              {(!user.vipStatus.isActive || isVipExpired) && (
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = "#subscriptions";
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition shrink-0 cursor-pointer"
                >
                  Passer au Premium
                </button>
              )}
            </div>
          )}
        </div>

        {/* TABS HEADER BAR */}
        <div className="border-b border-gray-150 px-6 bg-gray-50 shrink-0 flex items-center gap-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("about")}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "about" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {currentLanguage === "fr" ? "Histoire & Infos" : "Story & Info"}
          </button>
          
          <button
            onClick={() => setActiveTab("publications")}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "publications" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Newspaper className="h-4 w-4" />
            {currentLanguage === "fr" ? `Publications (${publications.length})` : `Publications (${publications.length})`}
          </button>

          <button
            onClick={() => setActiveTab("shop")}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "shop" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Store className="h-4 w-4" />
            {currentLanguage === "fr" ? `Boutique (${userProducts.length})` : `Shop (${userProducts.length})`}
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "campaigns" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Megaphone className="h-4 w-4" />
            {currentLanguage === "fr" ? `Campagnes (${userPromos.length})` : `Campaigns (${userPromos.length})`}
          </button>

          {currentUserId === user.id && (
            <button
              onClick={() => setActiveTab("privacy")}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "privacy" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Lock className="h-4 w-4" />
              {currentLanguage === "fr" ? "Confidentialité 🔒" : "Privacy 🔒"}
            </button>
          )}
        </div>

        {/* TAB BODY SCROLLABLE AREA */}
        <div className="p-6 overflow-y-auto max-h-[350px] bg-slate-50/50 flex-grow">
          
          {/* PRIVATE PROFILE BANNER */}
          {isPrivate && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 flex items-start gap-3 shadow-xs">
              <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-xs">Profil Privé</p>
                <p className="text-[11px] text-amber-800">
                  Cet utilisateur a choisi de configurer son profil en mode privé. Ses informations personnelles, son numéro marchand et ses publications sont masqués.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY TAB (Self Only) */}
          {activeTab === "privacy" && currentUserId === user.id && (
            <div className="space-y-4 animate-fade-in bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">Gestion de la Confidentialité du Profil</h4>
                  <p className="text-[11px] text-gray-500">Décidez quelles informations sont publiques ou masquées pour les autres membres.</p>
                </div>
              </div>

              {privacySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                  {privacySuccessMsg}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-slate-100 transition">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-gray-900">Rendre tout mon profil Privé</p>
                    <p className="text-[10px] text-gray-500">Les autres membres ne pourront voir ni vos infos, ni vos publications, ni votre numéro marchand.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isProfilePrivate}
                    onChange={(e) => setIsProfilePrivate(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-slate-100 transition">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-gray-900">Masquer mon Numéro Marchand</p>
                    <p className="text-[10px] text-gray-500">Empêcher les autres utilisateurs de voir votre numéro marchand sur votre profil.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hideMerchantNumber}
                    onChange={(e) => setHideMerchantNumber(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-slate-100 transition">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-gray-900">Masquer ma Date d'inscription</p>
                    <p className="text-[10px] text-gray-500">Cacher la date ou l'année d'inscription sur votre profil public.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hideJoinDate}
                    onChange={(e) => setHideJoinDate(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-slate-100 transition">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-gray-900">Masquer mes Publications & Historique</p>
                    <p className="text-[10px] text-gray-500">Empêcher la consultation de vos publications de groupe et de votre historique depuis votre profil.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hidePublications}
                    onChange={(e) => setHidePublications(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingPrivacy}
                  onClick={handleSavePrivacy}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPrivacy ? "Enregistrement..." : "Enregistrer les préférences"}
                </button>
              </div>
            </div>
          )}
          
          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  {currentLanguage === "fr" ? "Mon histoire sur Yaamaa" : "My Yaamaa Story"}
                </h3>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs text-xs text-gray-600 leading-relaxed font-sans space-y-2">
                  <p className="whitespace-pre-line">{userStory}</p>
                </div>
              </div>

              {/* STATS BENTO ROW */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 p-3.5 rounded-2xl text-center shadow-xs">
                  <span className="font-mono text-lg font-black text-emerald-600 block">
                    {user.wallet.totalEarned.toLocaleString()} {user.currency}
                  </span>
                  <span className="text-[9px] text-gray-450 uppercase font-bold tracking-wider mt-1 block">
                    {currentLanguage === "fr" ? "Gains Totaux" : "Total Earned"}
                  </span>
                </div>
                
                <div className="bg-white border border-gray-100 p-3.5 rounded-2xl text-center shadow-xs">
                  <span className="font-mono text-lg font-black text-teal-600 block">
                    {user.wallet.referralEarned.toLocaleString()} {user.currency}
                  </span>
                  <span className="text-[9px] text-gray-450 uppercase font-bold tracking-wider mt-1 block">
                    {currentLanguage === "fr" ? "Commissions" : "Referral Income"}
                  </span>
                </div>

                <div className="bg-white border border-gray-100 p-3.5 rounded-2xl text-center shadow-xs">
                  <span className="font-mono text-lg font-black text-indigo-600 block">
                    {user.level * 12 + 4}
                  </span>
                  <span className="text-[9px] text-gray-450 uppercase font-bold tracking-wider mt-1 block">
                    {currentLanguage === "fr" ? "Actions Validées" : "Approved Actions"}
                  </span>
                </div>
              </div>

              {/* ZONE MARCHAND (If user has merchantNumber and not hidden) */}
              {user.merchantNumber && !hideMerchant && (
                <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-150 p-5 rounded-3xl space-y-4 shadow-xs" id="user_profile_merchant_credentials_block">
                  <div className="flex items-center gap-2 border-b border-indigo-100/60 pb-2.5">
                    <Award className="h-5 w-5 text-indigo-600 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Zone Marchand</h4>
                      <p className="text-[10px] text-indigo-500 font-semibold">
                        {user.merchantPackType === "diamond" ? "Membre Diamant VIP (Avantages illimités)" : 
                         user.merchantPackType === "gold" ? "Membre Motivation (Sponsorship étendu)" : 
                         "Membre de Base (Badge & Numéro Marchand)"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 font-sans">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Numéro Marchand</span>
                      <p className="font-mono font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                        <span>{user.merchantNumber}</span>
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-sans uppercase font-black">Actif</span>
                      </p>
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Code de parrainage</span>
                      <p className="font-mono font-bold text-gray-950 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                        {user.referralCode}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Nom & Prénom</span>
                      <p className="font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl truncate">
                        {user.name}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Adresse E-mail</span>
                      <p className="font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Pays & Devise</span>
                      <p className="font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                        {user.country} ({user.currency})
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Numéro de Téléphone</span>
                      <p className="font-mono font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                        {user.phone || "Non renseigné"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Date d'inscription</span>
                      <p className="font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                        {user.merchantNumberPurchasedAt ? new Date(user.merchantNumberPurchasedAt).toLocaleDateString("fr-FR", {day: 'numeric', month: 'long', year: 'numeric'}) : "Inconnue"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Type de Pack</span>
                      <p className="font-black text-indigo-950 uppercase text-[10px] bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                        {user.merchantPackType === "diamond" && "💎 Diamant (VIP)"}
                        {user.merchantPackType === "gold" && "🌟 Niveau Motivation (Gold)"}
                        {user.merchantPackType === "premium" && "✨ Niveau de Base (Basic)"}
                      </p>
                    </div>

                    {/* Personnes parrainées et limites */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">Filleuls Parrainés</span>
                      <p className="font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                        {usersList.filter(u => u.referredBy === user.id || u.referredBy === user.referralCode).length} / {user.merchantPackType === "diamond" ? 2000 : (user.merchantPackType === "gold" ? 500 : 20)} parrainages
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PUBLICATIONS TAB */}
          {activeTab === "publications" && (
            <div className="space-y-4 animate-fade-in">
              {hidePubs ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
                  <Lock className="h-8 w-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-gray-800">Publications masquées</p>
                  <p className="text-[11px] text-gray-500">Cet utilisateur a configuré ses publications en mode privé.</p>
                </div>
              ) : isLoadingPubs ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-2">Chargement des publications...</p>
                </div>
              ) : publications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
                  <Newspaper className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Aucune publication publique disponible pour cet utilisateur.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publications.map((pub: any) => (
                    <div key={pub.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/55 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          📢 {pub.communityName || "Groupe"}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">
                          {new Date(pub.timestamp).toLocaleString(currentLanguage === "fr" ? "fr-FR" : "en-US", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-700 leading-relaxed font-sans">{pub.text}</p>
                      
                      {pub.voiceDuration && (
                        <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/30 px-3 py-1.5 rounded-xl w-fit mt-1">
                          <Volume2 className="h-3.5 w-3.5 text-emerald-650" />
                          <span className="text-[10px] font-mono font-bold text-emerald-800">Note Vocale ({pub.voiceDuration}s)</span>
                        </div>
                      )}

                      {pub.imageAttachment && (
                        <img 
                          src={pub.imageAttachment} 
                          alt="Pièce jointe" 
                          className="rounded-xl border max-h-48 object-cover mt-2 w-full"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHOP TAB */}
          {activeTab === "shop" && (
            <div className="space-y-4 animate-fade-in">
              {userProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
                  <Store className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Aucun produit ou service publié dans sa boutique pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProducts.map((prod) => (
                    <div key={prod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition">
                      <div className="relative aspect-video bg-gray-100 shrink-0">
                        <img
                          src={prod.images[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300"}
                          alt={prod.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white font-mono text-xs font-black px-2 py-1 rounded-lg">
                          {prod.price.toLocaleString()} {prod.currency}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-900 font-sans line-clamp-1">{prod.name}</h4>
                          <p className="text-[10.5px] text-gray-450 line-clamp-2">{prod.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <span className="text-[9.5px] font-mono text-gray-400 font-bold uppercase">
                            🛒 {prod.category}
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                            <Star className="h-3 w-3 fill-amber-500" />
                            {prod.rating || "5.0"}
                          </span>
                        </div>
                        {user && user.id !== currentUserId && (
                          <div className="pt-2.5 border-t border-gray-100 flex">
                            <button
                              type="button"
                              onClick={() => {
                                onStartChat(user.id);
                                onClose();
                              }}
                              className="w-full bg-slate-950 hover:bg-emerald-600 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              Commander / Offre
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CAMPAIGNS TAB */}
          {activeTab === "campaigns" && (
            <div className="space-y-4 animate-fade-in">
              {userPromos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
                  <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Aucune campagne publicitaire lancée pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* PROMOTIONAL CAMPAIGNS */}
                  {userPromos.map((camp) => (
                    <div key={camp.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono border border-blue-100">
                          📣 Publicité Sponsorisée
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          camp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-gray-900 font-sans">{camp.title}</h4>
                      <p className="text-[10.5px] text-gray-500 leading-relaxed">{camp.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-mono uppercase">Budget Total</span>
                          <span className="text-xs font-bold text-gray-800 font-mono">{camp.budgetPrice.toLocaleString()} {camp.currency}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 block font-mono uppercase">Service visé</span>
                          <span className="text-xs font-bold text-gray-800 truncate block">{camp.productServiceName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 flex items-center justify-end gap-2.5 rounded-b-3xl">
          <button
            id="close_profile_modal_bottom_btn"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-650 hover:bg-gray-50 rounded-xl transition cursor-pointer"
          >
            {currentLanguage === "fr" ? "Fermer" : "Close"}
          </button>
        </div>

      </div>
    </div>
  );
}
