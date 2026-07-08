import React, { useState, useEffect } from "react";
import { User, SubscriptionPlan, UserSubscription, BadgeTier } from "../types";
import { 
  ShieldCheck, 
  Award, 
  Crown, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  UserCheck, 
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  Unlock
} from "lucide-react";
import MerchantBadge from "./MerchantBadge";

interface AdminSubscriptionsPanelProps {
  currentUser: User | null;
  currentLanguage: "fr" | "en";
  users: User[];
  onRefreshData?: () => void;
}

export default function AdminSubscriptionsPanel({
  currentUser,
  currentLanguage,
  users,
  onRefreshData
}: AdminSubscriptionsPanelProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setloading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions">("plans");

  // Plan Form State
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("");
  const [planTier, setPlanTier] = useState<BadgeTier>("blue");
  const [planBadgeLabel, setPlanBadgeLabel] = useState<string>("");
  const [planDesc, setPlanDesc] = useState<string>("");
  const [planInitialPrice, setPlanInitialPrice] = useState<string>("5000");
  const [planRenewalPrice, setPlanRenewalPrice] = useState<string>("3000");
  const [planDurationValue, setPlanDurationValue] = useState<string>("30");
  const [planDurationUnit, setPlanDurationUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const [planMaxReferrals, setPlanMaxReferrals] = useState<string>("20");
  const [planReferralCommission, setPlanReferralCommission] = useState<string>("2500");
  const [planBenefits, setPlanBenefits] = useState<string>("Badge vérifié, Numéro unique à vie, Support 24/7");

  // Assign Subscription Modal
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignUserId, setAssignUserId] = useState<string>("");
  const [assignPlanId, setAssignPlanId] = useState<string>("");
  const [assignDurationDays, setAssignDurationDays] = useState<string>("30");

  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setloading(true);
      const [resPlans, resSubs] = await Promise.all([
        fetch("/api/subscription-plans"),
        fetch("/api/user-subscriptions")
      ]);
      if (resPlans.ok && resSubs.ok) {
        setPlans(await resPlans.json());
        setSubscriptions(await resSubs.json());
      }
    } catch (err) {
      console.error("Error fetching subscriptions data:", err);
    } finally {
      setloading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const benefitsArray = planBenefits.split(",").map(b => b.trim()).filter(Boolean);
      const res = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlanId || undefined,
          name: planName,
          tier: planTier,
          badgeLabel: planBadgeLabel || planName,
          description: planDesc,
          initialPrice: parseFloat(planInitialPrice),
          renewalPrice: parseFloat(planRenewalPrice),
          durationValue: parseInt(planDurationValue),
          durationUnit: planDurationUnit,
          maxReferrals: parseInt(planMaxReferrals || "20"),
          referralCommission: parseFloat(planReferralCommission || "2500"),
          benefits: benefitsArray,
          operatorId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(currentLanguage === "fr" ? "Plan d'abonnement enregistré avec succès !" : "Subscription plan saved successfully!");
        setShowPlanModal(false);
        resetPlanForm();
        fetchData();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Erreur lors de l'enregistrement du plan.");
      }
    } catch (err) {
      setErrorMsg("Erreur réseau.");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm(currentLanguage === "fr" ? "Êtes-vous sûr de vouloir supprimer ce plan ?" : "Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/subscription-plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanTier(plan.tier);
    setPlanBadgeLabel(plan.badgeLabel);
    setPlanDesc(plan.description);
    setPlanInitialPrice(String(plan.initialPrice));
    setPlanRenewalPrice(String(plan.renewalPrice));
    setPlanDurationValue(String(plan.durationValue));
    setPlanDurationUnit(plan.durationUnit);
    setPlanMaxReferrals(String(plan.maxReferrals ?? 20));
    setPlanReferralCommission(String(plan.referralCommission ?? 2500));
    setPlanBenefits(plan.benefits.join(", "));
    setShowPlanModal(true);
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanName("");
    setPlanTier("blue");
    setPlanBadgeLabel("");
    setPlanDesc("");
    setPlanInitialPrice("5000");
    setPlanRenewalPrice("3000");
    setPlanDurationValue("30");
    setPlanDurationUnit("days");
    setPlanMaxReferrals("20");
    setPlanReferralCommission("2500");
    setPlanBenefits("Badge vérifié, Numéro unique à vie, Support 24/7");
  };

  const handleSubAction = async (userId: string, planId: string, action: string, subscriptionId?: string) => {
    try {
      const res = await fetch("/api/user-subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId,
          action,
          subscriptionId,
          durationOverrideDays: assignDurationDays ? parseInt(assignDurationDays) : undefined,
          operatorId: currentUser?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(currentLanguage === "fr" ? "Action exécutée avec succès !" : "Action executed successfully!");
        setShowAssignModal(false);
        fetchData();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Erreur lors de l'action.");
      }
    } catch (err) {
      setErrorMsg("Erreur réseau.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-2 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Gestion Professionnelle Yama</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Système de Badges & Numéros Marchands
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configurez les plans d'abonnement, attribuez des badges vérifiés et gérez les abonnements des utilisateurs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetPlanForm();
              setShowPlanModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Créer un Plan</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            <span>Attribuer un Abonnement</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TABS */}
      <div className="mt-8 flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "plans" ? "bg-slate-800 text-emerald-400 border border-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          Plans d'Abonnement ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "subscriptions" ? "bg-slate-800 text-emerald-400 border border-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          Abonnements Actifs & Historique ({subscriptions.length})
        </button>
      </div>

      {/* TAB CONTENT: PLANS */}
      {activeTab === "plans" && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <MerchantBadge tier={plan.tier} size="md" showLabel={true} />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    plan.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}>
                    {plan.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white font-heading">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Prix Initial:</span>
                    <span className="text-emerald-400 font-bold font-mono">{plan.initialPrice.toLocaleString()} XOF</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Renouvellement:</span>
                    <span className="text-indigo-400 font-bold font-mono">{plan.renewalPrice.toLocaleString()} XOF</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Durée:</span>
                    <span className="text-white font-mono">{plan.durationValue} {plan.durationUnit}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Filleuls Max:</span>
                    <span className="text-cyan-400 font-bold font-mono">{plan.maxReferrals} max</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Avantages:</span>
                  <ul className="space-y-1">
                    {plan.benefits.map((b, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEditPlan(plan)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-4">Utilisateur / Marchand</th>
                <th className="p-4">Numéro Marchand</th>
                <th className="p-4">Plan & Badge</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Expiration</th>
                <th className="p-4 text-right">Actions Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    Aucun abonnement enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const u = users.find(usr => usr.id === sub.userId);
                  const isExpired = new Date(sub.expirationDate) < new Date();
                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img 
                          src={u?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"} 
                          alt="avatar" 
                          className="h-9 w-9 rounded-full object-cover border border-slate-700" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-bold text-white block">{u?.name || u?.username || "Utilisateur"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u?.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-emerald-400 text-xs">
                          {sub.merchantNumber || u?.merchantNumber || "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MerchantBadge tier={sub.tier} size="sm" showLabel={true} />
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === "active" && !isExpired ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          sub.status === "suspended" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {isExpired ? "Expiré" : sub.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(sub.expirationDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {sub.status === "active" ? (
                          <button
                            onClick={() => handleSubAction(sub.userId, sub.planId, "suspend", sub.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubAction(sub.userId, sub.planId, "reactivate", sub.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white font-bold transition cursor-pointer"
                          >
                            Réactiver
                          </button>
                        )}
                        <button
                          onClick={() => handleSubAction(sub.userId, sub.planId, "renew", sub.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white font-bold transition cursor-pointer"
                        >
                          Renouveler
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PLAN MODAL (CREATE / EDIT) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative animate-fade-in">
            <button onClick={() => setShowPlanModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-black text-white font-heading">
              {editingPlanId ? "Modifier le Plan d'Abonnement" : "Créer un Plan d'Abonnement"}
            </h3>

            <form onSubmit={handleSavePlan} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nom du Plan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Plan Or Spécial"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Niveau de Badge *</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as BadgeTier)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  >
                    <option value="blue">🔵 Badge Bleu (Basic)</option>
                    <option value="bronze">🟤 Badge Bronze Doré (Argent)</option>
                    <option value="gold">🟡 Badge Or (Premium)</option>
                    <option value="diamond">💎 Badge Diamant (Élite)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Description courte des avantages..."
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Prix Initial (XOF) *</label>
                  <input
                    type="number"
                    required
                    value={planInitialPrice}
                    onChange={(e) => setPlanInitialPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Prix de Renouvellement (XOF) *</label>
                  <input
                    type="number"
                    required
                    value={planRenewalPrice}
                    onChange={(e) => setPlanRenewalPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Durée (Valeur) *</label>
                  <input
                    type="number"
                    required
                    value={planDurationValue}
                    onChange={(e) => setPlanDurationValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unité de Durée *</label>
                  <select
                    value={planDurationUnit}
                    onChange={(e) => setPlanDurationUnit(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  >
                    <option value="days">Jours</option>
                    <option value="weeks">Semaines</option>
                    <option value="months">Mois</option>
                    <option value="years">Années</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Max de Filleuls autorisés *</label>
                <input
                  type="number"
                  required
                  value={planMaxReferrals}
                  onChange={(e) => setPlanMaxReferrals(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Commission de Parrainage pour le Parrain (XOF) *</label>
                <input
                  type="number"
                  required
                  value={planReferralCommission}
                  onChange={(e) => setPlanReferralCommission(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  placeholder="Ex: 2500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Avantages (séparés par des virgules) *</label>
                <input
                  type="text"
                  required
                  value={planBenefits}
                  onChange={(e) => setPlanBenefits(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  {editingPlanId ? "Enregistrer les modifications" : "Enregistrer le plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SUBSCRIPTION MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative animate-fade-in">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-black text-white font-heading">
              Attribuer un Abonnement à un Utilisateur
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Attribuez gratuitement ou activez instantanément un plan et son numéro marchand permanent.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sélectionner l'Utilisateur *</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username} ({u.email}) {u.merchantNumber ? `[${u.merchantNumber}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sélectionner le Plan *</label>
                <select
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">-- Choisir un plan --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.badgeLabel}) - {p.initialPrice.toLocaleString()} XOF
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Durée personnalisée (Jours)</label>
                <input
                  type="number"
                  value={assignDurationDays}
                  onChange={(e) => setAssignDurationDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!assignUserId || !assignPlanId) {
                      setErrorMsg("Veuillez sélectionner un utilisateur et un plan.");
                      return;
                    }
                    handleSubAction(assignUserId, assignPlanId, "assign");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Activer & Assigner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
