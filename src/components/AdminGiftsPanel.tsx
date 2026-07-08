import React, { useState, useEffect } from "react";
import { 
  Gift, Plus, Trash2, Edit2, Check, X, ShieldAlert, Sparkles, 
  Coins, HelpCircle, Phone, User, Eye, ArrowRight, Star, 
  TrendingUp, Activity, Play, Image, Clock, Info
} from "lucide-react";
import { SystemSettings, VirtualGift, User as SystemUser, RechargePack, WithdrawalPack } from "../types";

interface AdminGiftsPanelProps {
  systemMetrics: { settings: SystemSettings } | null;
  currentUser: SystemUser | null;
  syncPlatformData: (userId: string) => Promise<any>;
}

export default function AdminGiftsPanel({ systemMetrics, currentUser, syncPlatformData }: AdminGiftsPanelProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Packs & Pricing Settings
  const [conversionRate, setConversionRate] = useState(0.01);
  const [rechargePacks, setRechargePacks] = useState<RechargePack[]>([
    { id: "pack_100", pieces: 100, price: 1.0, currency: "USD", title: "Pack 100 Pièces", isActive: true },
    { id: "pack_200", pieces: 200, price: 2.0, currency: "USD", title: "Pack 200 Pièces", isActive: true },
    { id: "pack_500", pieces: 500, price: 5.0, currency: "USD", title: "Pack 500 Pièces", isActive: true },
    { id: "pack_1000", pieces: 1000, price: 10.0, currency: "USD", title: "Pack 1000 Pièces", isActive: true },
    { id: "pack_5000", pieces: 5000, price: 50.0, currency: "USD", title: "Pack 5000 Pièces", isActive: true },
    { id: "pack_10000", pieces: 10000, price: 100.0, currency: "USD", title: "Pack 10,000 Pièces", isActive: true }
  ]);

  const [withdrawalPacks, setWithdrawalPacks] = useState<WithdrawalPack[]>([
    { id: "w_100", pieces: 100, value: 1.0, label: "Retrait / Conversion 100 Pièces", isActive: true },
    { id: "w_200", pieces: 200, value: 2.0, label: "Retrait / Conversion 200 Pièces", isActive: true },
    { id: "w_500", pieces: 500, value: 5.0, label: "Retrait / Conversion 500 Pièces", isActive: true },
    { id: "w_1000", pieces: 1000, value: 10.0, label: "Retrait / Conversion 1000 Pièces", isActive: true },
    { id: "w_5000", pieces: 5000, value: 50.0, label: "Retrait / Conversion 5000 Pièces", isActive: true },
    { id: "w_10000", pieces: 10000, value: 100.0, label: "Retrait / Conversion 10,000 Pièces", isActive: true }
  ]);

  // Statistics
  const [stats, setStats] = useState({
    totalSent: 0,
    totalPointsSpent: 0,
    popularityMap: {} as { [key: string]: number }
  });

  // Gift Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentGiftId, setCurrentGiftId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [formPointsPrice, setFormPointsPrice] = useState(10);
  const [formPointsValue, setFormPointsValue] = useState(10);
  const [formDescription, setFormDescription] = useState("");
  const [formRarity, setFormRarity] = useState<"Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique">("Commun");
  const [formCategory, setFormCategory] = useState<any>("Classique");
  const [formAnimation, setFormAnimation] = useState<any>("petals");
  const [formSoundEffect, setFormSoundEffect] = useState("love_chime");
  const [formDuration, setFormDuration] = useState(5);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsTemporary, setFormIsTemporary] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formPromotionDiscount, setFormPromotionDiscount] = useState(0);

  // Filter Categories
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const categories = [
    "Classique", "Premium", "Royale", "Légendaire", "Richesse", 
    "Amour", "Fête", "Gaming", "Sport", "Afrique", 
    "Événementiel", "Saisonnier", "Exclusif"
  ];

  const rarities = ["Commun", "Rare", "Épique", "Légendaire", "Mythique"];

  const animations = [
    { value: "petals", label: "🌸 Pluie de pétales" },
    { value: "diamonds", label: "💎 Pluie de diamants" },
    { value: "money", label: "💵 Pluie de billets de banque" },
    { value: "light", label: "✨ Explosion de lumière" },
    { value: "lightning", label: "⚡ Éclairs électriques" },
    { value: "galaxy", label: "🌌 Voyage galactique 60 FPS" },
    { value: "rocket", label: "🚀 Fusée traversante" },
    { value: "lion", label: "🦁 Rugissement du Lion majestueux" },
    { value: "dragon", label: "🐉 Vol du Dragon doré" },
    { value: "phoenix", label: "🐦 Phénix incandescent" },
    { value: "castle", label: "🏰 Apparition de château royal" },
    { value: "car", label: "🏎️ Passage de voiture de luxe" },
    { value: "confetti", label: "🎉 Pluie de confettis festifs" },
    { value: "fireworks", label: "🎆 Feux d'artifice scintillants" }
  ];

  const soundEffects = [
    { value: "love_chime", label: "🎵 Carillon d'amour" },
    { value: "heartbeat", label: "💓 Battement de cœur" },
    { value: "fire_crackle", label: "🔥 Crépitement de feu" },
    { value: "cheers", label: "🍻 Trinquage & acclamations" },
    { value: "sparkle_magic", label: "✨ Scintillement magique" },
    { value: "royal_fanfare", label: "🎺 Fanfare royale" },
    { value: "diamond_cling", label: "💎 Tintement de diamant" },
    { value: "rocket_blast", label: "🚀 Décollage de fusée" },
    { value: "epic_orchestra", label: "🎻 Orchestre épique" },
    { value: "lion_roar", label: "🦁 Rugissement féroce" },
    { value: "dragon_breath", label: "🐉 Souffle de dragon" },
    { value: "phoenix_cry", label: "🦅 Cri du phénix" },
    { value: "car_engine", label: "🏎️ Vrombissement de moteur" }
  ];

  // Load and initialize settings
  useEffect(() => {
    if (systemMetrics?.settings) {
      const s = systemMetrics.settings;
      setGifts(s.virtualGifts || []);
      setConversionRate(s.giftPointsConversionRate ?? 0.01);
      if (s.rechargePacks && s.rechargePacks.length > 0) {
        setRechargePacks(s.rechargePacks);
      }
      if (s.withdrawalPacks && s.withdrawalPacks.length > 0) {
        setWithdrawalPacks(s.withdrawalPacks);
      }
    }
    fetchStats();
  }, [systemMetrics]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/gifts/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching gift stats:", err);
    }
  };

  const handleSavePacksAndPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rechargePacks,
          withdrawalPacks,
          giftPointsConversionRate: parseFloat(String(conversionRate)),
          operatorId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue");
      } else {
        setSuccessMsg("Packs de recharge, retraits et tarification personnalisés enregistrés avec succès !");
        await syncPlatformData(currentUser.id);
      }
    } catch (err) {
      setErrorMsg("Erreur réseau lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!formName.trim() || !formEmoji.trim()) {
      setErrorMsg("Veuillez renseigner un nom et un emoji.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    let updatedGifts = [...gifts];

    const giftData: VirtualGift = {
      id: currentGiftId || "gift_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: formName.trim(),
      emoji: formEmoji.trim(),
      pointsPrice: parseInt(String(formPointsPrice)),
      pointsValue: parseInt(String(formPointsValue)),
      description: formDescription.trim(),
      rarity: formRarity,
      category: formCategory,
      animation: formAnimation,
      soundEffect: formSoundEffect,
      duration: parseInt(String(formDuration)),
      isActive: formIsActive,
      isTemporary: formIsTemporary,
      expiryDate: formIsTemporary ? formExpiryDate : undefined,
      promotionDiscount: parseInt(String(formPromotionDiscount))
    };

    if (isEditing && currentGiftId) {
      updatedGifts = updatedGifts.map(g => g.id === currentGiftId ? giftData : g);
    } else {
      updatedGifts.push(giftData);
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          virtualGifts: updatedGifts,
          operatorId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Impossible d'enregistrer le cadeau.");
      } else {
        setGifts(updatedGifts);
        setSuccessMsg(isEditing ? "Cadeau virtuel mis à jour !" : "Nouveau cadeau virtuel ajouté au catalogue !");
        resetGiftForm();
        await syncPlatformData(currentUser.id);
        fetchStats();
      }
    } catch (err) {
      setErrorMsg("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!currentUser || !window.confirm("Voulez-vous vraiment supprimer ce cadeau du catalogue ?")) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const updatedGifts = gifts.filter(g => g.id !== id);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          virtualGifts: updatedGifts,
          operatorId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Impossible de supprimer le cadeau.");
      } else {
        setGifts(updatedGifts);
        setSuccessMsg("Cadeau virtuel supprimé définitivement.");
        await syncPlatformData(currentUser.id);
        fetchStats();
      }
    } catch (err) {
      setErrorMsg("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGiftStatus = async (gift: VirtualGift) => {
    if (!currentUser) return;
    
    const updatedGifts = gifts.map(g => {
      if (g.id === gift.id) {
        return { ...g, isActive: !g.isActive };
      }
      return g;
    });

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          virtualGifts: updatedGifts,
          operatorId: currentUser.id
        })
      });

      if (res.ok) {
        setGifts(updatedGifts);
        await syncPlatformData(currentUser.id);
      }
    } catch (err) {
      console.error("Error toggling gift status:", err);
    }
  };

  const handleEditGift = (gift: VirtualGift) => {
    setIsEditing(true);
    setCurrentGiftId(gift.id);
    
    setFormName(gift.name);
    setFormEmoji(gift.emoji);
    setFormPointsPrice(gift.pointsPrice);
    setFormPointsValue(gift.pointsValue || gift.pointsPrice);
    setFormDescription(gift.description || "");
    setFormRarity(gift.rarity || "Commun");
    setFormCategory(gift.category || "Classique");
    setFormAnimation(gift.animation || "petals");
    setFormSoundEffect(gift.soundEffect || "love_chime");
    setFormDuration(gift.duration || 5);
    setFormIsActive(gift.isActive !== false);
    setFormIsTemporary(gift.isTemporary || false);
    setFormExpiryDate(gift.expiryDate || "");
    setFormPromotionDiscount(gift.promotionDiscount || 0);

    // Scroll slightly up to editor form
    document.getElementById("gift_editor_section")?.scrollIntoView({ behavior: "smooth" });
  };

  const resetGiftForm = () => {
    setIsEditing(false);
    setCurrentGiftId(null);
    setFormName("");
    setFormEmoji("");
    setFormPointsPrice(10);
    setFormPointsValue(10);
    setFormDescription("");
    setFormRarity("Commun");
    setFormCategory("Classique");
    setFormAnimation("petals");
    setFormSoundEffect("love_chime");
    setFormDuration(5);
    setFormIsActive(true);
    setFormIsTemporary(false);
    setFormExpiryDate("");
    setFormPromotionDiscount(0);
  };

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "Commun": return "bg-gray-100 text-gray-700 border-gray-200";
      case "Rare": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Épique": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Légendaire": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Mythique": return "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold shadow-sm";
      default: return "bg-gray-150 text-gray-700";
    }
  };

  const filteredGifts = selectedCategoryFilter === "all"
    ? gifts
    : gifts.filter(g => g.category === selectedCategoryFilter);

  return (
    <div className="space-y-8 animate-fade-in text-gray-900">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-8 opacity-10">
          <Gift className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/30 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20">
              Système de Cadeaux 4D & Automatisation
            </span>
          </div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Configuration Générale des Cadeaux & de l'Émetteur
          </h2>
          <p className="text-xs text-amber-50 max-w-2xl leading-relaxed">
            Configurez les animations immersives en 60 FPS, gérez le catalogue des cadeaux, déterminez les valeurs financières de conversion de jetons, et personnalisez le profil virtuel automatisé qui distribue les messages et alertes officiels.
          </p>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[10px] text-gray-400 underline">Fermer</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[10px] text-gray-400 underline">Fermer</button>
        </div>
      )}

      {/* METRICS & STATISTICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-4.5 shadow-2xs flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Cadeaux Envoyés</span>
            <span className="text-lg font-black text-gray-900">{stats.totalSent}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Depuis la création</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4.5 shadow-2xs flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Jetons Transigés</span>
            <span className="text-lg font-black text-gray-900">{stats.totalPointsSpent} pièces</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Valeur en circulation</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4.5 shadow-2xs flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Valeur Financière</span>
            <span className="text-lg font-black text-gray-900">
              {(stats.totalPointsSpent * conversionRate).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Taux : {conversionRate} € / point</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4.5 shadow-2xs flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Catalogue Actif</span>
            <span className="text-lg font-black text-gray-900">{gifts.filter(g => g.isActive !== false).length} / {gifts.length}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Modèles configurés</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: PACKS & PRICING PERSONALIZATION */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border rounded-3xl p-5 shadow-2xs space-y-5">
            <div className="border-b pb-3 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                Packs de Recharge & Retrait & Tarification
              </h3>
            </div>
            
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
              Définissez et personnalisez les prix de chaque pack de recharge de pièces, la valeur des retraits/conversions par packs (100, 200, 500, 1000, 5000, 10000 pièces) et le taux de conversion global.
            </p>

            <form onSubmit={handleSavePacksAndPricing} className="space-y-5">
              {/* GLOBAL CONVERSION RATE */}
              <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-2xl space-y-2">
                <label className="text-[10px] font-black text-amber-900 uppercase block flex items-center gap-1">
                  <span>💶</span> Taux de Conversion Global (1 point = X EUR)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-mono font-black focus:outline-none"
                  required
                />
                <span className="text-[9px] text-amber-700 block leading-tight font-medium">
                  Appliqué lors de la conversion des gains reçus par les créateurs. (Ex: 1000 pièces = {1000 * conversionRate} €)
                </span>
              </div>

              {/* RECHARGE PACKS PRICING */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1 border-b pb-1">
                  <span>⚡</span> Prix des Packs de Recharge (Achat Pièces)
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {rechargePacks.map((pack, idx) => (
                    <div key={pack.id} className="bg-slate-50 border p-2.5 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-black text-slate-800 block truncate">{pack.title}</span>
                        <span className="text-[9px] text-gray-500 block">⭐ {pack.pieces} pièces</span>
                      </div>
                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={pack.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...rechargePacks];
                            updated[idx].price = val;
                            setRechargePacks(updated);
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-black text-center focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-gray-500">{pack.currency || "USD"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WITHDRAWAL / CONVERSION PACKS VALUES */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1 border-b pb-1">
                  <span>💸</span> Valeur des Packs de Retrait / Conversion
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {withdrawalPacks.map((wpack, idx) => (
                    <div key={wpack.id} className="bg-slate-50 border p-2.5 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-black text-slate-800 block truncate">{wpack.label}</span>
                        <span className="text-[9px] text-emerald-600 block">💖 {wpack.pieces} pièces</span>
                      </div>
                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={wpack.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...withdrawalPacks];
                            updated[idx].value = val;
                            setWithdrawalPacks(updated);
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-black text-center focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-emerald-600">EUR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10.5px] tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-97 disabled:opacity-50 shadow-sm"
              >
                {loading ? "Enregistrement..." : "Enregistrer la Tarification & Packs 💾"}
              </button>
            </form>
          </div>

          {/* MOST POPULAR GIFTS */}
          <div className="bg-white border rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Cadeaux les Plus Populaires
                </h3>
              </div>
              <span className="text-[9px] font-bold text-gray-400">Classement</span>
            </div>

            <div className="space-y-2.5">
              {gifts.length === 0 ? (
                <p className="text-xs italic text-gray-400 text-center py-4">Aucun cadeau configuré.</p>
              ) : (
                [...gifts]
                  .map(g => ({
                    ...g,
                    count: stats.popularityMap[g.id] || 0
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((gift, idx) => (
                    <div key={gift.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-gray-150 transition">
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <span className="text-xs font-extrabold text-gray-400 w-4">{idx + 1}.</span>
                        <span className="text-lg shrink-0">{gift.emoji}</span>
                        <div className="truncate min-w-0">
                          <span className="text-xs font-bold text-gray-800 block truncate">{gift.name}</span>
                          <span className="text-[9.5px] text-gray-400 font-mono block">{gift.pointsPrice} pièces</span>
                        </div>
                      </div>
                      <div className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-lg shrink-0">
                        {gift.count} envoyés
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: GIFTS CRUD */}
        <div className="lg:col-span-8 space-y-8">
          {/* GIFT CREATION/EDITION FORM */}
          <div id="gift_editor_section" className="bg-white border rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {isEditing ? "Modifier le Cadeau" : "Créer un Nouveau Cadeau Virtuel Premium"}
                </h3>
              </div>
              {isEditing && (
                <button
                  onClick={resetGiftForm}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2.5 py-1 rounded-lg transition"
                >
                  Annuler la modification
                </button>
              )}
            </div>

            <form onSubmit={handleSaveGift} className="space-y-4 text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nom du Cadeau <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-bold transition focus:outline-none"
                    placeholder="Ex: Lion Majestueux"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Emoji / Représentation <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-extrabold text-center transition focus:outline-none"
                    placeholder="Ex: 🦁 ou URL d'icône"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rareté <span className="text-red-500">*</span></label>
                  <select
                    value={formRarity}
                    onChange={(e) => setFormRarity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-bold transition focus:outline-none text-gray-800"
                  >
                    {rarities.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Catégorie <span className="text-red-500">*</span></label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-bold transition focus:outline-none text-gray-800"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prix Public (Jetons) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={formPointsPrice}
                    onChange={(e) => setFormPointsPrice(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold transition focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Valeur Créateur (Créditée) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={formPointsValue}
                    onChange={(e) => setFormPointsValue(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold transition focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Description accrocheuse</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs transition focus:outline-none font-medium"
                  placeholder="Ex: Le rugissement légendaire qui fait trembler l'écran..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Effet 3D / Animation Écran <span className="text-red-500">*</span></label>
                  <select
                    value={formAnimation}
                    onChange={(e) => setFormAnimation(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-bold transition focus:outline-none text-gray-800"
                  >
                    {animations.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Effet Sonore Premium <span className="text-red-500">*</span></label>
                  <select
                    value={formSoundEffect}
                    onChange={(e) => setFormSoundEffect(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-bold transition focus:outline-none text-gray-800"
                  >
                    {soundEffects.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Durée Animation (sec) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold transition focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={() => setFormIsActive(!formIsActive)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Rendre actif immédiatement</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsTemporary}
                    onChange={() => setFormIsTemporary(!formIsTemporary)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Cadeau événementiel / temporaire</span>
                </label>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Taux de Promotion (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formPromotionDiscount}
                    onChange={(e) => setFormPromotionDiscount(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 focus:border-amber-300 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {formIsTemporary && (
                <div className="animate-fade-in flex flex-col gap-1 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                  <label className="text-[10px] font-black uppercase text-amber-800">Date d'expiration automatique</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="bg-white border border-amber-200 rounded-lg p-2 text-xs font-semibold focus:outline-none max-w-xs text-gray-800"
                    required={formIsTemporary}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetGiftForm}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase text-[10.5px] tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black uppercase text-[10.5px] tracking-wider rounded-xl transition cursor-pointer shadow-sm active:scale-97 disabled:opacity-50"
                >
                  {isEditing ? "Enregistrer les modifications 💾" : "Ajouter au catalogue 🚀"}
                </button>
              </div>
            </form>
          </div>

          {/* GIFT CATALOG LIST */}
          <div className="bg-white border rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-950 flex items-center gap-2">
                <span>📦</span> Catalogue Actif des Cadeaux ({gifts.length})
              </h3>

              {/* FILTER BAR */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`px-3 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer ${
                    selectedCategoryFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-slate-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Tous
                </button>
                {categories.map(cat => {
                  const count = gifts.filter(g => g.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        selectedCategoryFilter === cat
                          ? "bg-amber-600 text-white"
                          : "bg-slate-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="bg-black/10 text-[9px] px-1 rounded">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredGifts.length === 0 ? (
              <div className="py-20 text-center text-gray-400 italic text-xs">
                Aucun cadeau trouvé dans cette catégorie.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGifts.map((gift) => {
                  const hasDiscount = gift.promotionDiscount && gift.promotionDiscount > 0;
                  const finalPrice = hasDiscount 
                    ? Math.round(gift.pointsPrice * (1 - (gift.promotionDiscount || 0) / 100))
                    : gift.pointsPrice;

                  return (
                    <div 
                      key={gift.id} 
                      className={`border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition duration-200 hover:shadow-xs ${
                        gift.isActive === false 
                          ? "bg-slate-50/70 opacity-70 border-gray-200" 
                          : "bg-white border-gray-150 hover:border-amber-300"
                      }`}
                    >
                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-3xl shrink-0 p-1.5 bg-slate-50 rounded-xl border">{gift.emoji}</span>
                          <div className="truncate">
                            <h4 className="text-xs font-black text-gray-900 truncate flex items-center gap-1.5">
                              <span>{gift.name}</span>
                              {gift.isTemporary && (
                                <span className="bg-red-100 text-red-800 text-[8px] font-black px-1.5 rounded uppercase tracking-wider">TEMP</span>
                              )}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-bold block">{gift.category || "Classique"}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${getRarityBadgeStyle(gift.rarity || "Commun")}`}>
                            {gift.rarity || "Commun"}
                          </span>
                          {hasDiscount && (
                            <span className="bg-rose-100 text-rose-800 text-[8.5px] font-black px-1.5 rounded">
                              -{gift.promotionDiscount}% PROMO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      <p className="text-[11px] text-gray-500 leading-normal font-medium">
                        {gift.description || "Aucune description renseignée."}
                      </p>

                      {/* SPECS BLOCK */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-150 text-[10.5px] font-mono grid grid-cols-3 gap-2 text-center text-gray-700">
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-bold block">Prix</span>
                          <span className="font-extrabold text-gray-900">
                            {hasDiscount ? (
                              <>
                                <span className="line-through text-gray-400 mr-1 text-[9px]">{gift.pointsPrice}</span>
                                <span className="text-emerald-600">{finalPrice}</span>
                              </>
                            ) : (
                              <span>{gift.pointsPrice}</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-bold block">Crédit</span>
                          <span className="font-extrabold text-blue-600">{gift.pointsValue || gift.pointsPrice}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 uppercase font-bold block">Anim. / Son</span>
                          <span className="font-extrabold text-purple-600 truncate block max-w-[80px]">
                            {gift.animation || "petals"}
                          </span>
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <button
                          onClick={() => handleToggleGiftStatus(gift)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition border flex items-center gap-1 cursor-pointer ${
                            gift.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {gift.isActive !== false ? "✓ Actif" : "✗ Inactif"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditGift(gift)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border text-gray-500 hover:text-amber-600 rounded-lg transition cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGift(gift.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
