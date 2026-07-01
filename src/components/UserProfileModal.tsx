import React, { useState, useEffect } from "react";
import { User, Product, PromoCampaign, Campaign } from "../types";
import { Language, getTranslation } from "../i18n";
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
  Star
} from "lucide-react";

interface UserProfileModalProps {
  userId: string;
  currentUserId: string | null;
  onClose: () => void;
  onStartChat: (otherUserId: string) => void;
  usersList: User[];
  productsList: Product[];
  promoCampaignsList: PromoCampaign[];
  campaignsList: Campaign[];
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
  campaignsList,
  currentLanguage
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "publications" | "shop" | "campaigns">("about");
  const [publications, setPublications] = useState<any[]>([]);
  const [isLoadingPubs, setIsLoadingPubs] = useState(false);

  const t = getTranslation(currentLanguage);

  const user = usersList.find((u) => u.id === userId);

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

  // Filter products, promo campaigns, and micro-tasks
  const userProducts = productsList.filter((p) => p.ownerId === user.id && p.isApproved && !p.isBanned);
  const userPromos = promoCampaignsList.filter((c) => c.ownerId === user.id);
  const userTasks = campaignsList.filter((c) => c.advertiserId === user.id);

  // Default bio/story if not provided
  const userBio = user.bio || (currentLanguage === "fr" 
    ? "Membre actif de la communauté Taskora. Ensemble, construisons l'économie de demain." 
    : "Active member of the Taskora community. Together, let's build the economy of tomorrow.");

  const userStory = user.story || (currentLanguage === "fr"
    ? `J'ai rejoint la plateforme pour participer à des micro-tâches rémunérées et découvrir les talents locaux. Taskora m'aide au quotidien à rentabiliser mes réseaux sociaux tout en échangeant avec des pionniers de toute l'Afrique.`
    : `I joined the platform to participate in rewarded micro-tasks and discover local talents. Taskora helps me monetize my social media daily while interacting with pioneers from all over Africa.`);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "founder": return currentLanguage === "fr" ? "Fondateur Taskora" : "Taskora Founder";
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
    <div id="user_profile_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div id="user_profile_modal_card" className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8">
        
        {/* BANNER COVER */}
        <div className="h-36 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 relative shrink-0">
          <div className="absolute inset-0 bg-black/10"></div>
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
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">@{user.username}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-2 font-sans">
                <span className="flex items-center gap-1 font-semibold text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  {user.country}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {currentLanguage === "fr" ? "Inscrit en 2026" : "Joined in 2026"}
                </span>
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
            {currentLanguage === "fr" ? `Campagnes (${userPromos.length + userTasks.length})` : `Campaigns (${userPromos.length + userTasks.length})`}
          </button>
        </div>

        {/* TAB BODY SCROLLABLE AREA */}
        <div className="p-6 overflow-y-auto max-h-[350px] bg-slate-50/50 flex-grow">
          
          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  {currentLanguage === "fr" ? "Mon histoire sur Taskora" : "My Taskora Story"}
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
            </div>
          )}

          {/* PUBLICATIONS TAB */}
          {activeTab === "publications" && (
            <div className="space-y-4 animate-fade-in">
              {isLoadingPubs ? (
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
              {userPromos.length === 0 && userTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
                  <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Aucune campagne publicitaire ou micro-tâche lancée pour le moment.</p>
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

                  {/* MICRO-TASK MISSIONS */}
                  {userTasks.map((camp) => (
                    <div key={camp.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono border border-emerald-100">
                          🛠️ Micro-Mission Rémunérée
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
                          <span className="text-[9px] text-gray-400 block font-mono uppercase">Récompense / Exécutant</span>
                          <span className="text-xs font-black text-emerald-600 font-mono">+{camp.rewardPerUser.toLocaleString()} {user.currency}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 block font-mono uppercase">Participants</span>
                          <span className="text-xs font-bold text-gray-800 font-mono">{camp.participantsCount} validés</span>
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
