import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Megaphone, ShieldCheck, Play, Pause, AlertTriangle, PlusCircle, 
  Globe, DollarSign, Eye, CheckCircle, BarChart3, Zap, ShoppingBag, 
  Sparkles, Layers, Settings, Sliders, Cpu, Trash2, Edit3, Plus, X 
} from "lucide-react";
import { ProductBoostCampaign, Product, User, AdPack, CampaignTypeConfig, AdPlatformSettings } from "../types";

interface AdminProductBoostsPanelProps {
  currentUser: User | null;
  productBoosts: ProductBoostCampaign[];
  products: Product[];
  onRefreshData: () => Promise<void>;
}

export default function AdminProductBoostsPanel({
  currentUser,
  productBoosts = [],
  products = [],
  onRefreshData
}: AdminProductBoostsPanelProps) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "packs" | "types" | "settings" | "ai">("campaigns");

  // Ad Packs State
  const [adPacks, setAdPacks] = useState<AdPack[]>([]);
  const [editingPack, setEditingPack] = useState<AdPack | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [packForm, setPackForm] = useState({
    name: "",
    description: "",
    price: 5000,
    currency: "FCFA",
    durationDays: 7,
    guaranteedImpressions: 10000,
    estimatedViews: 500,
    estimatedClicks: 50,
    estimatedReach: 15000,
    category: "Général",
    diffusionType: "standard" as "standard" | "priority" | "premium",
    priorityLevel: 1,
    isActive: true
  });

  // Campaign Types State
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypeConfig[]>([]);
  const [editingType, setEditingType] = useState<CampaignTypeConfig | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({
    name: "",
    objective: "views" as "views" | "shop_visits" | "sales" | "launch",
    description: "",
    defaultBudget: 5000,
    defaultDuration: 7,
    isAvailable: true
  });

  // Ad Settings State
  const [adSettings, setAdSettings] = useState<AdPlatformSettings>({
    maxSponsoredPerSession: 3,
    sponsoredOrganicRatio: 25,
    autoApproval: true,
    antiSpamEnabled: true
  });

  // Manual Booster State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [budget, setBudget] = useState("50");
  const [durationDays, setDurationDays] = useState("7");
  const [estimatedReach, setEstimatedReach] = useState("50000");
  const [targetCategory, setTargetCategory] = useState("physical");
  const [targetCountry, setTargetCountry] = useState("Tous");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [packsRes, typesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/ad-packs"),
        fetch("/api/admin/campaign-types"),
        fetch("/api/admin/ad-settings")
      ]);
      if (packsRes.ok) setAdPacks(await packsRes.json());
      if (typesRes.ok) setCampaignTypes(await typesRes.json());
      if (settingsRes.ok) setAdSettings(await settingsRes.json());
    } catch (err) {
      console.error("Failed to fetch ad configs", err);
    }
  };

  // Aggregate stats
  const totalImpressions = productBoosts.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const totalClicks = productBoosts.reduce((sum, b) => sum + (b.clicks || 0), 0);
  const totalSales = productBoosts.reduce((sum, b) => sum + (b.salesGenerated || 0), 0);
  const totalBudgetSpent = productBoosts.reduce((sum, b) => sum + (b.budget || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const handleManualBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Veuillez sélectionner un produit à booster.");
      return;
    }
    setIsSubmitting(true);
    setMsg("");
    setError("");

    try {
      const res = await fetch("/api/admin/boost-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser?.id,
          productId: selectedProductId,
          budget: parseFloat(budget) || 50,
          durationDays: parseInt(durationDays) || 7,
          estimatedReach: parseInt(estimatedReach) || 50000,
          targetCategory,
          targetCountry
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Boost publicitaire appliqué avec succès par l'administration !");
        setSelectedProductId("");
        await onRefreshData();
      } else {
        setError(data.error || "Erreur lors du boost.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (boostId: string, status: string) => {
    try {
      const res = await fetch(`/api/product-boosts/${boostId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminId: currentUser?.id })
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPack ? `/api/admin/ad-packs/${editingPack.id}` : "/api/admin/ad-packs";
      const method = editingPack ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packForm)
      });
      if (res.ok) {
        setMsg(editingPack ? "Pack publicitaire mis à jour avec succès !" : "Nouveau pack publicitaire créé !");
        setShowPackModal(false);
        setEditingPack(null);
        await fetchConfigs();
      } else {
        setError("Erreur lors de l'enregistrement du pack.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce pack publicitaire ?")) return;
    try {
      await fetch(`/api/admin/ad-packs/${id}`, { method: "DELETE" });
      await fetchConfigs();
      setMsg("Pack supprimé.");
    } catch (err) {
      setError("Erreur suppression.");
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingType ? `/api/admin/campaign-types/${editingType.id}` : "/api/admin/campaign-types";
      const method = editingType ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm)
      });
      if (res.ok) {
        setMsg(editingType ? "Type de campagne mis à jour !" : "Nouveau type de campagne créé !");
        setShowTypeModal(false);
        setEditingType(null);
        await fetchConfigs();
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Supprimer ce type de campagne ?")) return;
    try {
      await fetch(`/api/admin/campaign-types/${id}`, { method: "DELETE" });
      await fetchConfigs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/ad-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adSettings)
      });
      if (res.ok) {
        setMsg("Paramètres de diffusion et d'algorithme enregistrés !");
      }
    } catch (err) {
      setError("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
            Moteur Alibaba, TikTok & Meta Ads • Yaamaa Intelligent Ads Engine
          </span>
          <h2 className="text-2xl font-black">Plateforme Publicitaire Intelligente Yaamaa</h2>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Contrôle total des packs publicitaires, catalogue de campagnes, algorithme de recommandation, ciblage comportemental et performances en temps réel.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0">
          <span className="block text-2xl font-black">{productBoosts.length}</span>
          <span className="text-[10px] text-amber-100 uppercase tracking-wider font-bold">Campagnes Actives</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "campaigns", label: "🚀 Campagnes & Boosts Actifs", icon: Megaphone },
          { id: "packs", label: "📦 Gestion des Packs Ads", icon: Layers },
          { id: "types", label: "🎯 Catalogue des Campagnes", icon: Sliders },
          { id: "settings", label: "⚙️ Algorithme & Diffusion", icon: Settings },
          { id: "ai", label: "🧠 IA & Optimisation Prédictive", icon: Cpu }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" 
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            {msg}
          </div>
          <button onClick={() => setMsg("")} className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            {error}
          </div>
          <button onClick={() => setError("")} className="text-rose-700 font-bold hover:text-rose-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: CAMPAIGNS & MANUAL BOOSTS */}
      {activeTab === "campaigns" && (
        <div className="space-y-8 animate-fade-in">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" /> Budget Engagé
              </span>
              <span className="text-lg font-black text-gray-950 font-mono">{totalBudgetSpent.toLocaleString()} FCFA</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-600" /> Total Impressions
              </span>
              <span className="text-lg font-black text-gray-950 font-mono">{totalImpressions.toLocaleString()}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-600" /> Total Clics
              </span>
              <span className="text-lg font-black text-gray-950 font-mono">{totalClicks.toLocaleString()}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-indigo-600" /> Taux de Clic (CTR)
              </span>
              <span className="text-lg font-black text-emerald-600 font-mono">{avgCtr}%</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-purple-600" /> Ventes Attribuées
              </span>
              <span className="text-lg font-black text-purple-600 font-mono">{totalSales} ventes</span>
            </div>
          </div>

          {/* Manual Admin Booster Form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-600" />
              Booster Manuel Administrateur (Mise en avant prioritaire multi-plateforme)
            </h3>

            <form onSubmit={handleManualBoost} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-gray-700">Sélectionner un Produit de la Marketplace</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choisir un produit --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} {p.currency}) - Vendeur: {p.shopName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Budget Publicitaire (FCFA / USD)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Durée (Jours)</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Portée Cible Estimée (Utilisateurs)</label>
                <input
                  type="number"
                  value={estimatedReach}
                  onChange={(e) => setEstimatedReach(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 py-3 rounded-xl transition shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  {isSubmitting ? "Application du boost..." : "Lancer le Boost Sponsorisé"}
                </button>
              </div>
            </form>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Campagnes Actives et Historique de Diffusion
            </h3>

            {productBoosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs italic">
                Aucune campagne de boost produit en cours. Les vendeurs peuvent booster leurs produits depuis leur espace boutique.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Produit & Vendeur</th>
                      <th className="pb-3 px-3">Budget</th>
                      <th className="pb-3 px-3">Impressions / Clics</th>
                      <th className="pb-3 px-3">Ventes Générées</th>
                      <th className="pb-3 px-3">Statut</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {productBoosts.map(boost => (
                      <tr key={boost.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-3 flex items-center gap-3">
                          <img src={boost.productImage || "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=100&auto=format&fit=crop"} alt="" className="h-10 w-10 rounded-xl object-cover bg-gray-100 shrink-0" />
                          <div>
                            <span className="font-bold text-gray-950 block">{boost.productName}</span>
                            <span className="text-[10px] text-gray-500 font-mono">Par {boost.sellerUsername} {boost.adminBoosted && "👑 (Admin)"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-3 font-mono font-bold text-gray-950">
                          {boost.budget} {boost.currency}
                        </td>
                        <td className="py-4 px-3 font-mono">
                          <span className="text-emerald-600 font-bold">{boost.impressions} imp.</span> / <span className="text-blue-600 font-bold">{boost.clicks} clics</span>
                        </td>
                        <td className="py-4 px-3 font-mono font-bold text-purple-600">
                          {boost.salesGenerated || 0} ventes
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            boost.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {boost.status}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right space-x-2">
                          {boost.status === "active" ? (
                            <button
                              onClick={() => handleUpdateStatus(boost.id, "paused")}
                              className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Suspendre
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(boost.id, "active")}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Activer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AD PACKS MANAGEMENT */}
      {activeTab === "packs" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-gray-950">Gestion des Packs Publicitaires</h3>
              <p className="text-xs text-gray-500 mt-0.5">Créez, modifiez ou supprimez les formules de packs publicitaires proposés aux vendeurs.</p>
            </div>
            <button
              onClick={() => {
                setEditingPack(null);
                setPackForm({
                  name: "",
                  description: "",
                  price: 5000,
                  currency: "FCFA",
                  durationDays: 7,
                  guaranteedImpressions: 10000,
                  estimatedViews: 500,
                  estimatedClicks: 50,
                  estimatedReach: 15000,
                  category: "Général",
                  diffusionType: "standard",
                  priorityLevel: 1,
                  isActive: true
                });
                setShowPackModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Créer un Pack Ad
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adPacks.map(pack => (
              <div key={pack.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      pack.diffusionType === "premium" ? "bg-purple-100 text-purple-800" :
                      pack.diffusionType === "priority" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {pack.diffusionType} • Niveau {pack.priorityLevel}
                    </span>
                    <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      {pack.price} {pack.currency}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-gray-950">{pack.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{pack.description}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-gray-700">
                    <span>Durée :</span>
                    <strong className="text-gray-950">{pack.durationDays} jours</strong>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Impressions :</span>
                    <strong className="text-gray-950">{pack.guaranteedImpressions.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Vues / Clics :</span>
                    <strong className="text-gray-950">~{pack.estimatedViews} / {pack.estimatedClicks}</strong>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Portée cible :</span>
                    <strong className="text-gray-950">~{pack.estimatedReach.toLocaleString()} pers.</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setEditingPack(pack);
                      setPackForm({
                        name: pack.name,
                        description: pack.description,
                        price: pack.price,
                        currency: pack.currency,
                        durationDays: pack.durationDays,
                        guaranteedImpressions: pack.guaranteedImpressions,
                        estimatedViews: pack.estimatedViews,
                        estimatedClicks: pack.estimatedClicks,
                        estimatedReach: pack.estimatedReach,
                        category: pack.category,
                        diffusionType: pack.diffusionType,
                        priorityLevel: pack.priorityLevel,
                        isActive: pack.isActive
                      });
                      setShowPackModal(true);
                    }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => handleDeletePack(pack.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPAIGN TYPES */}
      {activeTab === "types" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-gray-950">Catalogue des Types de Campagnes</h3>
              <p className="text-xs text-gray-500 mt-0.5">Définissez les objectifs publicitaires disponibles (Visibilité, Trafic boutique, Ventes, Lancement).</p>
            </div>
            <button
              onClick={() => {
                setEditingType(null);
                setTypeForm({
                  name: "",
                  objective: "views",
                  description: "",
                  defaultBudget: 5000,
                  defaultDuration: 7,
                  isAvailable: true
                });
                setShowTypeModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Ajouter un Objectif
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaignTypes.map(ct => (
              <div key={ct.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Objectif : {ct.objective}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${ct.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                    {ct.isAvailable ? "Actif" : "Désactivé"}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-950">{ct.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{ct.description}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 text-xs flex justify-between font-mono">
                  <span>Budget suggéré : <strong>{ct.defaultBudget} FCFA</strong></span>
                  <span>Durée type : <strong>{ct.defaultDuration} jours</strong></span>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setEditingType(ct);
                      setTypeForm({
                        name: ct.name,
                        objective: ct.objective,
                        description: ct.description,
                        defaultBudget: ct.defaultBudget,
                        defaultDuration: ct.defaultDuration,
                        isAvailable: ct.isAvailable
                      });
                      setShowTypeModal(true);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteType(ct.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ALGORITHM & DELIVERY SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in max-w-3xl">
          <div>
            <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-600" />
              Règles de Diffusion & Algorithme Publicitaire
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Paramétrez la fréquence d'affichage, le ratio sponsorisé/organique et les filtres anti-spam.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nombre max de produits sponsorisés par session utilisateur</label>
                <input
                  type="number"
                  value={adSettings.maxSponsoredPerSession}
                  onChange={(e) => setAdSettings({...adSettings, maxSponsoredPerSession: parseInt(e.target.value) || 3})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Ratio Sponsorisé / Organique (%)</label>
                <input
                  type="number"
                  value={adSettings.sponsoredOrganicRatio}
                  onChange={(e) => setAdSettings({...adSettings, sponsoredOrganicRatio: parseInt(e.target.value) || 25})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adSettings.autoApproval}
                  onChange={(e) => setAdSettings({...adSettings, autoApproval: e.target.checked})}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-gray-800">Validation automatique des campagnes conformes aux règles de la plateforme</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adSettings.antiSpamEnabled}
                  onChange={(e) => setAdSettings({...adSettings, antiSpamEnabled: e.target.checked})}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-gray-800">Activer le filtre anti-spam et la détection d'abus sur les impressions répétitives</span>
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow cursor-pointer"
              >
                Enregistrer les paramètres
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AI & PREDICTIVE ANALYTICS */}
      {activeTab === "ai" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block">Yaamaa Neural Ads Optimizer</span>
                <h3 className="text-lg font-black">Recommandations & Suggestions Automatiques par IA</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
                <span className="font-bold text-amber-400 text-xs block">💡 Conseil d'optimisation Vendeur</span>
                <p className="text-xs text-slate-200">
                  "Les produits de la catégorie <strong className="text-white">High-Tech & Accessoires</strong> affichent un taux de conversion 34% supérieur lorsqu'ils sont boostés avec le format <strong>Pack Business</strong>."
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
                <span className="font-bold text-emerald-400 text-xs block">🚀 Analyse Prédictive de Portée</span>
                <p className="text-xs text-slate-200">
                  "L'augmentation du trafic mobile à Dakar et Abidjan ce week-end offre une opportunité de ciblage géographique avec un ROI estimé à x4.2."
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2">
                <span className="font-bold text-purple-400 text-xs block">🛡️ Détection d'Abus IA</span>
                <p className="text-xs text-slate-200">
                  "Aucune anomalie ni tentative de fraude détectée sur le réseau d'affichage publicitaire au cours des dernières 24 heures."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PACK MODAL */}
      {showPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-extrabold text-gray-950">
                {editingPack ? "Modifier le Pack Publicitaire" : "Créer un Nouveau Pack Publicitaire"}
              </h3>
              <button onClick={() => setShowPackModal(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePack} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nom du Pack</label>
                <input
                  type="text"
                  value={packForm.name}
                  onChange={(e) => setPackForm({...packForm, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  value={packForm.description}
                  onChange={(e) => setPackForm({...packForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Prix ({packForm.currency})</label>
                  <input
                    type="number"
                    value={packForm.price}
                    onChange={(e) => setPackForm({...packForm, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Durée (Jours)</label>
                  <input
                    type="number"
                    value={packForm.durationDays}
                    onChange={(e) => setPackForm({...packForm, durationDays: parseInt(e.target.value) || 7})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Impressions Garanties</label>
                  <input
                    type="number"
                    value={packForm.guaranteedImpressions}
                    onChange={(e) => setPackForm({...packForm, guaranteedImpressions: parseInt(e.target.value) || 10000})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Type de Diffusion</label>
                  <select
                    value={packForm.diffusionType}
                    onChange={(e) => setPackForm({...packForm, diffusionType: e.target.value as any})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="priority">Prioritaire</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  {editingPack ? "Mettre à jour" : "Créer le Pack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN TYPE MODAL */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-extrabold text-gray-950">
                {editingType ? "Modifier l'Objectif de Campagne" : "Créer un Objectif de Campagne"}
              </h3>
              <button onClick={() => setShowTypeModal(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nom de l'Objectif</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({...typeForm, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Type d'Objectif</label>
                <select
                  value={typeForm.objective}
                  onChange={(e) => setTypeForm({...typeForm, objective: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="views">Vues & Notoriété (Views)</option>
                  <option value="shop_visits">Trafic Boutique (Shop Visits)</option>
                  <option value="sales">Conversions & Ventes (Sales)</option>
                  <option value="launch">Lancement Produit (Launch)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({...typeForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Budget par défaut (FCFA)</label>
                  <input
                    type="number"
                    value={typeForm.defaultBudget}
                    onChange={(e) => setTypeForm({...typeForm, defaultBudget: parseFloat(e.target.value) || 5000})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Durée par défaut (Jours)</label>
                  <input
                    type="number"
                    value={typeForm.defaultDuration}
                    onChange={(e) => setTypeForm({...typeForm, defaultDuration: parseInt(e.target.value) || 7})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  {editingType ? "Mettre à jour" : "Créer l'Objectif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
