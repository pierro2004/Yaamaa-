import React, { useState } from "react";
import { 
  Megaphone, 
  PlusCircle, 
  Coins, 
  TrendingUp, 
  Globe, 
  Users, 
  Eye, 
  MousePointerClick, 
  Percent, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Target, 
  FileText, 
  ExternalLink,
  Zap,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { User, PromoCampaign } from "../types";
import { ALL_COUNTRIES } from "../countries";
import { getRegionsForCountry, getCommunesForRegion } from "../locationData";

interface PromotionsProps {
  currentUser: User | null;
  promoCampaigns: PromoCampaign[];
  syncPlatformData: () => Promise<void>;
  onNavigate: (view: string) => void;
}

export default function PromotionsView({
  currentUser,
  promoCampaigns,
  syncPlatformData,
  onNavigate
}: PromotionsProps) {
  const [promoTab, setPromoTab] = useState<"active_promos" | "create_campaign">("active_promos");

  // Campaign Formulation State
  const [promoType, setPromoType] = useState("Site Web");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoLink, setPromoLink] = useState("");
  const [promoBanner, setPromoBanner] = useState("");
  const [promoVideo, setPromoVideo] = useState("");
  const [promoInstructions, setPromoInstructions] = useState("");
  const [targetCountries, setTargetCountries] = useState<string[]>(["Tous"]);
  const [targetRegions, setTargetRegions] = useState<string[]>(["Tous"]);
  const [targetCommunes, setTargetCommunes] = useState<string[]>(["Tous"]);
  const [selectedTargetCountry, setSelectedTargetCountry] = useState("Sénégal");
  const [selectedTargetRegion, setSelectedTargetRegion] = useState("");
  const [selectedTargetCommune, setSelectedTargetCommune] = useState("");

  // Budget Choice
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium" | "enterprise">("standard");

  const [campaignSuccess, setCampaignSuccess] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync / refresh button
  const [isReevaluating, setIsReevaluating] = useState(false);
  const triggerRefresh = async () => {
    setIsReevaluating(true);
    await syncPlatformData();
    setIsReevaluating(false);
  };

  // Filter campaigns owned by user
  const myCampaigns = promoCampaigns.filter(c => c.ownerId === currentUser?.id);

  const budgetTiers = {
    basic: {
      name: "Tiers Basic 🥉",
      costEuros: 50,
      costXof: 32500,
      viewsEst: 5000,
      clicksEst: 500,
      durationDays: 7,
      desc: "Idéal pour tester l'impact d'un produit physique ou d'un service local."
    },
    standard: {
      name: "Tiers Standard 🥈",
      costEuros: 150,
      costXof: 97500,
      viewsEst: 15000,
      clicksEst: 2000,
      durationDays: 15,
      desc: "Recommandé pour lancer une boutique en ligne d'e-commerce."
    },
    premium: {
      name: "Tiers Premium 🥇",
      costEuros: 500,
      costXof: 325000,
      viewsEst: 50050,
      clicksEst: 10000,
      durationDays: 30,
      desc: "Parfait pour générer des ventes massives de formations ou de fichiers."
    },
    enterprise: {
      name: "Tiers Enterprise 👑",
      costEuros: 1500,
      costXof: 975000,
      viewsEst: 150000,
      clicksEst: 40000,
      durationDays: 60,
      desc: "Dominez la plateforme avec une visibilité exclusive de longue durée."
    }
  };

  // Create Promo Campaign handler
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setCampaignError("Veuillez vous connecter pour créer une campagne publicitaire.");
      return;
    }

    if (!promoTitle || !promoLink || !promoDesc) {
      setCampaignError("Veuillez renseigner le titre, le lien et la description de votre campagne.");
      return;
    }

    const tierObj = budgetTiers[selectedTier];
    const isXof = currentUser.currency === "XOF";
    const actualCost = isXof ? tierObj.costXof : tierObj.costEuros;

    if (currentUser.wallet.available < actualCost) {
      setCampaignError(`Votre solde disponible (${currentUser.wallet.available.toLocaleString()} ${currentUser.currency}) est insuffisant pour financer cette campagne (${actualCost.toLocaleString()} ${currentUser.currency}).`);
      return;
    }

    setCampaignError("");
    setCampaignSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: currentUser.id,
          ownerUsername: currentUser.username,
          type: promoType,
          title: promoTitle,
          productServiceName: promoTitle,
          destLink: promoLink,
          description: promoDesc,
          instructions: promoInstructions || "Visitez le lien, visualisez l'offre et profitez-en !",
          images: promoBanner ? [promoBanner] : [],
          videos: promoVideo ? [promoVideo] : [],
          budgetTier: selectedTier,
          budgetPrice: actualCost,
          currency: currentUser.currency,
          targetCountries: targetCountries.length > 0 ? targetCountries : ["Tous les pays"],
          targetRegions: targetRegions.length > 0 ? targetRegions : ["Tous"],
          targetCommunes: targetCommunes.length > 0 ? targetCommunes : ["Tous"]
        })
      });

      if (res.ok) {
        setCampaignSuccess("Félicitations ! Votre campagne a été soumise avec succès aux administrateurs pour validation. Le montant de la campagne a été débité de votre solde.");
        setPromoTitle("");
        setPromoDesc("");
        setPromoLink("");
        setPromoBanner("");
        setPromoVideo("");
        setPromoInstructions("");
        setTargetCountries(["Tous"]);
        setTargetRegions(["Tous"]);
        setTargetCommunes(["Tous"]);
        await syncPlatformData();
        setTimeout(() => {
          setPromoTab("active_promos");
          setCampaignSuccess("");
        }, 2500);
      } else {
        const err = await res.json();
        setCampaignError(err.error || "Une erreur est survenue.");
      }
    } catch {
      setCampaignError("Erreur réseau. Impossible de lancer la campagne.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCountry = (c: string) => {
    if (c) {
      setTargetCountries(prev => {
        const list = prev.filter(item => item !== "Tous" && item !== "Tous les pays" && item !== "");
        if (list.includes(c)) return list;
        return [...list, c];
      });
    }
  };

  const handleAddRegion = (r: string) => {
    if (r) {
      setTargetRegions(prev => {
        const list = prev.filter(item => item !== "Tous" && item !== "");
        if (list.includes(r)) return list;
        return [...list, r];
      });
    }
  };

  const handleAddCommune = (com: string) => {
    if (com) {
      setTargetCommunes(prev => {
        const list = prev.filter(item => item !== "Tous" && item !== "");
        if (list.includes(com)) return list;
        return [...list, com];
      });
    }
  };

  const getStatusLabelAndColor = (status: string) => {
    switch (status) {
      case "active": return { label: "Campagne Active 📢", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "suspended": return { label: "Suspendue 🛑", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "refused": return { label: "Campagne Refusée ❌", color: "bg-rose-50 text-rose-800 border-rose-200" };
      default: return { label: "En Attente de Validation ⏳", color: "bg-zinc-100 text-zinc-800 border-zinc-200" };
    }
  };

  return (
    <div id="promotions_dashboard_screen" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* BRANDING HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-gray-950 flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-blue-500" />
            Régie de Promotions & Publicités
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Financez et lancez des campagnes publicitaires ciblées pour attirer des milliers de visiteurs de pays spécifiques (Sénégal, France, Canada) vers vos produits, applications ou articles.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button 
            onClick={triggerRefresh}
            className="p-2 bg-gray-55/6 flex items-center justify-center text-gray-500 hover:text-emerald-750 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            title="Mettre à jour les statistiques"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isReevaluating ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0">
            <button
              onClick={() => setPromoTab("active_promos")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                promoTab === "active_promos" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5 text-blue-500" />
              Mes Campagnes
            </button>
            <button
              onClick={() => setPromoTab("create_campaign")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                promoTab === "create_campaign" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
              Lancer une Campagne
            </button>
          </div>
        </div>
      </div>

      {/* WARNING / GUEST BOX */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Accès restreint au mode consultation.</p>
            <p className="text-gray-500 font-normal mt-1">Vous devez choisir un profil d'utilisateur factice pour financer des campagnes publicitaires réelles ou consulter le rapport d'audience de votre entreprise.</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: MY ACTIVE CAMPAIGNS LIST                          */}
      {/* ======================================================== */}
      {promoTab === "active_promos" && (
        <div className="space-y-6 animate-fade-in" id="promos_list_container">
          
          {/* STATS HIGHLIGHT TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">TOTAL CAMPAGNES</span>
                <span className="text-lg font-black text-gray-950">{myCampaigns.length}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block font-mono">VUES GÉNÉRÉES</span>
                <span className="text-lg font-black text-gray-950">
                  {myCampaigns.reduce((sum, c) => sum + c.views, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-650 rounded-xl flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">CLICS OBTENUS</span>
                <span className="text-lg font-black text-gray-950">
                  {myCampaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">CTR MOYEN</span>
                <span className="text-lg font-black text-gray-950">
                  {(() => {
                    const views = myCampaigns.reduce((sum, c) => sum + c.views, 0);
                    const clicks = myCampaigns.reduce((sum, c) => sum + c.clicks, 0);
                    return views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "0.0%";
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* LIST */}
          {myCampaigns.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center space-y-4">
              <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-950">Aucune campagne publicitaire lancée</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Boostez l'audience de vos boutiques en ligne, chaînes de streaming ou sites web en formulant votre premier budget publicitaire.</p>
              <button 
                onClick={() => setPromoTab("create_campaign")}
                className="text-xs font-bold bg-zinc-950 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition"
              >
                Créer une promotion maintenant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="promo_campaigns_grid_list">
              {myCampaigns.map((camp) => {
                const statusMeta = getStatusLabelAndColor(camp.status);
                const maxViewsUnit = budgetTiers[camp.budgetTier]?.viewsEst || 10000;
                const progressPercent = maxViewsUnit > 0 ? Math.min(100, (camp.views / maxViewsUnit) * 100) : 0;
                const bannerPic = camp.images && camp.images.length > 0 ? camp.images[0] : "";

                return (
                  <div 
                    key={camp.id} 
                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
                    id={`campaign_promo_card_${camp.id}`}
                  >
                    
                    {/* Upper title & badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                          Promo : {camp.type}
                        </span>
                        <h4 className="text-sm font-black text-gray-950 line-clamp-1">{camp.title}</h4>
                      </div>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Banner cover frame */}
                    {bannerPic && (
                      <div className="h-32 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100">
                        <img src={bannerPic} alt="" className="w-full h-full object-cover" />
                        
                        {/* Target countries overlay */}
                        <div className="absolute bottom-2 left-2 bg-gray-950/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                          <Globe className="h-2.5 w-2.5" />
                          Pays : {camp.targetCountries.join(", ")}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Stats metrics */}
                    <div className="bg-gray-50 p-3 rounded-xl grid grid-cols-3 gap-2 text-center text-xs font-sans border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-mono">VUES</span>
                        <span className="font-extrabold text-gray-900">{camp.views.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-mono font-sans">CLICS</span>
                        <span className="font-extrabold text-gray-900 font-sans">{camp.clicks.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">BUDGET</span>
                        <span className="font-mono text-xs font-bold text-emerald-600">{camp.budgetPrice.toLocaleString()} {camp.currency}</span>
                      </div>
                    </div>

                    {/* Completion bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                        <span>Objectif de diffusion :</span>
                        <span>{camp.views}/{maxViewsUnit} Vues</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>

                    {/* Link */}
                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-4">
                      <span className="text-[9px] text-gray-450 font-mono tracking-wide">ID : #{camp.id}</span>
                      <a 
                        href={camp.destLink} 
                        target="_blank" 
                        rel="noopener referrer"
                        className="text-xs font-bold text-blue-650 hover:text-blue-800 flex items-center gap-1"
                      >
                        Lien Promo <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATE PROMOTION CAMPAIGN (WIZARD FORM)            */}
      {/* ======================================================== */}
      {promoTab === "create_campaign" && (
        <div className="max-w-3xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-fade-in" id="promotion_creation_form_box">
          <div className="text-center space-y-2 pb-4 border-b border-gray-100">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-605 mx-auto">
              <PlusCircle className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-heading font-black text-gray-1050">Formuler une promotion ciblée</h3>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">Votre annonce sera diffusée sur l'accueil et le tableau de bord de la communauté pour amplifier vos ventes d'e-commerce, attirer des téléchargements ou du public.</p>
          </div>

          <form onSubmit={handleLaunchCampaign} className="space-y-6">
            
            {/* Promotion Type & Campaign Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Type de support à promouvoir</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                >
                  <option value="Site Web">Site Web</option>
                  <option value="Boutique En Ligne">Boutique En Ligne (E-com)</option>
                  <option value="Application Mobile">Application Mobile</option>
                  <option value="Chaîne YouTube">Chaîne YouTube</option>
                  <option value="Compte TikTok">Compte TikTok / Reels</option>
                  <option value="Produit Digital">Formation ou Produit Digital</option>
                  <option value="Service / Prestation">Service Professionnel</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Titre de la campagne publicitaire *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boostez votre CA avec notre méthode SEO !"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Link & Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block text-blue-700 font-sans">Lien internet de destination *</label>
                <input
                  type="url"
                  required
                  placeholder="https://votre-site.com/produit"
                  value={promoLink}
                  onChange={(e) => setPromoLink(e.target.value)}
                  className="w-full px-3.5 py-2 border border-blue-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">URL de l'image publicitaire / bannière</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo..."
                  value={promoBanner}
                  onChange={(e) => setPromoBanner(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                />
              </div>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-600" /> Ciblage Géographique Avancé (Suggestions locales)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Country target selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">1. Sélectionner un Pays</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTargetCountry}
                      onChange={(e) => {
                        const c = e.target.value;
                        setSelectedTargetCountry(c);
                        const r = getRegionsForCountry(c)[0] || "";
                        setSelectedTargetRegion(r);
                        if (r) {
                          setSelectedTargetCommune(getCommunesForRegion(c, r)[0] || "");
                        } else {
                          setSelectedTargetCommune("");
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                    >
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAddCountry(selectedTargetCountry)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition"
                    >
                      Cibler
                    </button>
                  </div>
                </div>

                {/* 2. Region target selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">2. Sélectionner une Région</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTargetRegion}
                      onChange={(e) => {
                        const r = e.target.value;
                        setSelectedTargetRegion(r);
                        setSelectedTargetCommune(getCommunesForRegion(selectedTargetCountry, r)[0] || "");
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">-- Toutes les régions --</option>
                      {getRegionsForCountry(selectedTargetCountry).filter(r => r !== "Saisir manuellement...").map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedTargetRegion}
                      onClick={() => handleAddRegion(selectedTargetRegion)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer transition"
                    >
                      Cibler
                    </button>
                  </div>
                </div>

                {/* 3. Commune target selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">3. Sélectionner une Commune</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTargetCommune}
                      onChange={(e) => setSelectedTargetCommune(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">-- Toutes les communes --</option>
                      {getCommunesForRegion(selectedTargetCountry, selectedTargetRegion).filter(c => c !== "Saisir manuellement...").map((com) => (
                        <option key={com} value={com}>
                          {com}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedTargetCommune}
                      onClick={() => handleAddCommune(selectedTargetCommune)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer transition"
                    >
                      Cibler
                    </button>
                  </div>
                </div>
              </div>

              {/* Badges of selected geographical options */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-500 block">Pays ciblés :</span>
                  {targetCountries.map((c) => (
                    <span
                      key={c}
                      onClick={() => setTargetCountries(prev => {
                        const filtered = prev.filter(item => item !== c);
                        return filtered.length === 0 ? ["Tous"] : filtered;
                      })}
                      className="bg-emerald-50 hover:bg-rose-50 hover:text-rose-700 hover:line-through transition text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {c} <span className="text-[9px] text-emerald-400 font-bold">×</span>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-500 block">Départements ciblés :</span>
                  {targetRegions.map((r) => (
                    <span
                      key={r}
                      onClick={() => setTargetRegions(prev => {
                        const filtered = prev.filter(item => item !== r);
                        return filtered.length === 0 ? ["Tous"] : filtered;
                      })}
                      className="bg-blue-50 hover:bg-rose-50 hover:text-rose-700 hover:line-through transition text-blue-800 border border-blue-100 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {r} <span className="text-[9px] text-blue-400 font-bold">×</span>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-500 block">Communes ciblées :</span>
                  {targetCommunes.map((com) => (
                    <span
                      key={com}
                      onClick={() => setTargetCommunes(prev => {
                        const filtered = prev.filter(item => item !== com);
                        return filtered.length === 0 ? ["Tous"] : filtered;
                      })}
                      className="bg-purple-50 hover:bg-rose-50 hover:text-rose-700 hover:line-through transition text-purple-800 border border-purple-100 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {com} <span className="text-[9px] text-purple-400 font-bold">×</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Instruction input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Instructions pour les visiteurs (Action requise)</label>
              <input
                type="text"
                placeholder="Ex: Remplissez le formulaire d'inscription, ou lisez l'article pendant 30 sec"
                value={promoInstructions}
                onChange={(e) => setPromoInstructions(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Description detailed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Texte publicitaire / Description descriptive *</label>
              <textarea
                required
                rows={3}
                placeholder="Rédigez un court paragraphe accrocheur pour inciter au clic ou susciter l'intérêt de la communauté."
                value={promoDesc}
                onChange={(e) => setPromoDesc(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
              />
            </div>

            {/* BUDGET TIERS SELECTION */}
            <div className="space-y-3 pb-3 border-b border-gray-50">
              <label className="text-xs font-bold text-gray-700 block flex items-center gap-1">
                <Coins className="h-4 w-4 text-amber-500" />
                Sélectionnez un pack de diffusion (Budget)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.keys(budgetTiers) as Array<keyof typeof budgetTiers>).map((tierKey) => {
                  const item = budgetTiers[tierKey];
                  const active = selectedTier === tierKey;
                  const isXof = currentUser?.currency === "XOF";
                  const costFormatted = isXof ? `${item.costXof.toLocaleString()} XOF` : `${item.costEuros.toLocaleString()} EUR`;

                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedTier(tierKey)}
                      className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between h-52 relative ${
                        active 
                          ? "border-blue-650 bg-blue-50/50 text-blue-950 shadow-md ring-2 ring-blue-100" 
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold block text-gray-900 group-hover:text-blue-700">{item.name}</span>
                        <p className="text-[10px] text-gray-500 leading-tight font-sans line-clamp-3">{item.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-25/5 w-full">
                        <span className="block text-[10px] text-gray-400 font-mono">OBJECTIF ESTIMÉ</span>
                        <span className="text-[11px] font-black block text-gray-950">📈 {item.viewsEst.toLocaleString()} Vues</span>
                        <span className="text-[11px] font-black block text-gray-950">🖱️ {item.clicksEst.toLocaleString()} Clics</span>
                        
                        <div className="mt-2 text-xs font-black text-blue-750 font-mono">
                          {costFormatted}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BALANCE CONFIRMATION BOX */}
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-gray-500 font-bold block">VOTRE BUDGET À PAYER :</span>
                {currentUser && (
                  <span className="block text-[11px] text-gray-400">
                    Solde actuel : <span className="text-emerald-700 font-bold">{currentUser.wallet.available.toLocaleString()} {currentUser.currency}</span>
                  </span>
                )}
              </div>
              
              <span className="text-xl font-black text-blue-800 font-mono">
                {currentUser?.currency === "XOF" 
                  ? `${budgetTiers[selectedTier].costXof.toLocaleString()} XOF` 
                  : `${budgetTiers[selectedTier].costEuros.toLocaleString()} EUR`}
              </span>
            </div>

            {campaignError && (
              <p className="text-xs text-rose-600 font-extrabold block">{campaignError}</p>
            )}
            {campaignSuccess && (
              <p className="text-xs text-emerald-600 font-extrabold block">{campaignSuccess}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl transition uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <Zap className="h-5 w-5 text-amber-300 animate-pulse" />
              {isSubmitting ? "Débit et traitement de la campagne..." : "Financer et Soumettre ma Campagne"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
