import React, { useState, useEffect } from "react";
import { User, VipAuditLog } from "../types";
import { 
  Crown, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Calendar, 
  UserCheck, 
  FileText,
  DollarSign,
  TrendingUp,
  Award
} from "lucide-react";

interface AdminVipPromotionsPanelProps {
  currentUser: User | null;
  currentLanguage: "fr" | "en";
  users: User[];
  onRefreshData?: () => void;
}

export default function AdminVipPromotionsPanel({
  currentUser,
  currentLanguage,
  users,
  onRefreshData
}: AdminVipPromotionsPanelProps) {
  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [nearExpirationCount, setNearExpirationCount] = useState(0);
  const [vipUsersList, setVipUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<VipAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Assign VIP Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [durationValue, setDurationValue] = useState("7");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days" | "weeks" | "months">("days");
  const [startAt, setStartAt] = useState("");
  const [reason, setReason] = useState("Promotion VIP temporaire Yaamaa");
  const [searchUserQuery, setSearchUserQuery] = useState("");

  useEffect(() => {
    fetchVipData();
  }, []);

  const fetchVipData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vip-promotions");
      const data = await res.json();
      if (res.ok) {
        setActiveCount(data.activeCount || 0);
        setExpiredCount(data.expiredCount || 0);
        setNearExpirationCount(data.nearExpirationCount || 0);
        setVipUsersList(data.vipUsers || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Error fetching VIP promotions data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert("Veuillez sélectionner un utilisateur.");
      return;
    }

    try {
      const res = await fetch("/api/admin/vip-promotions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          durationValue: Number(durationValue),
          durationUnit,
          startAt: startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
          reason,
          operatorId: currentUser?.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de l'attribution du VIP.");
        return;
      }

      alert("Statut VIP attribué avec succès ! Notification envoyée à l'utilisateur.");
      setShowAssignModal(false);
      setSelectedUserId("");
      fetchVipData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const handleExtendVip = async (userId: string) => {
    const daysStr = prompt("Nombre de jours supplémentaires pour la prolongation :", "7");
    if (!daysStr) return;
    const additionalDays = Number(daysStr);
    if (isNaN(additionalDays) || additionalDays <= 0) return;

    try {
      const res = await fetch("/api/admin/vip-promotions/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          additionalDays,
          operatorId: currentUser?.id
        })
      });
      if (res.ok) {
        alert("Période VIP prolongée avec succès !");
        fetchVipData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeVip = async (userId: string) => {
    const reasonRevoke = prompt("Motif du retrait anticipé du VIP :");
    if (reasonRevoke === null) return;

    try {
      const res = await fetch("/api/admin/vip-promotions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason: reasonRevoke || "Retrait administratif",
          operatorId: currentUser?.id
        })
      });
      if (res.ok) {
        alert("Statut VIP révoqué avec succès.");
        fetchVipData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-inner">
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Gestion des Promotions VIP Temporaires</h2>
            <p className="text-xs text-slate-400">Attribution automatisée, comptes à rebours et transition vers les abonnements Premium</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Attribuer un Statut VIP
          </button>
          <button
            onClick={fetchVipData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition border border-slate-700 cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VIP Actifs</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{activeCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Crown className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proches de l'expiration</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{nearExpirationCount}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VIP Expirés</p>
            <h3 className="text-2xl font-black text-slate-400 mt-1">{expiredCount}</h3>
          </div>
          <div className="p-3 bg-slate-800 text-slate-400 rounded-xl">
            <XCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taux de Conversion</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">84.2%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Active VIP Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-amber-400" />
          Utilisateurs bénéficiant actuellement du statut VIP
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Utilisateur</th>
                <th className="p-3">Motif / Source</th>
                <th className="p-3">Date de début</th>
                <th className="p-3">Date d'expiration</th>
                <th className="p-3">Administrateur</th>
                <th className="p-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vipUsersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                    Aucun utilisateur actif sous statut VIP temporaire pour le moment.
                  </td>
                </tr>
              ) : (
                vipUsersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{u.vipStatus?.reason}</td>
                    <td className="p-3 font-mono text-slate-400">{new Date(u.vipStatus?.startDate).toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-400 font-bold">{new Date(u.vipStatus?.expiresAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-300">{u.vipStatus?.assignedByAdminName}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleExtendVip(u.id)}
                        className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg font-semibold transition cursor-pointer"
                      >
                        Prolonger
                      </button>
                      <button
                        onClick={() => handleRevokeVip(u.id)}
                        className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg font-semibold transition cursor-pointer"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          Journal d'Audit des Opérations VIP
        </h3>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
              <tr>
                <th className="p-3 rounded-l-xl">Date & Heure</th>
                <th className="p-3">Utilisateur Cible</th>
                <th className="p-3">Action</th>
                <th className="p-3">Détails</th>
                <th className="p-3 rounded-r-xl">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 italic">
                    Aucun événement enregistré dans le journal d'audit VIP.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-white font-semibold">{log.userName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        log.action === 'ASSIGN' ? 'bg-amber-500/20 text-amber-400' :
                        log.action === 'EXTEND' ? 'bg-teal-500/20 text-teal-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{log.details}</td>
                    <td className="p-3 text-slate-400">{log.adminName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign VIP Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Attribuer un Statut VIP Temporaire</h3>
                  <p className="text-xs text-slate-400">Activation immédiate des avantages de parrainage et chronomètre</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignVipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rechercher / Sélectionner l'Utilisateur *</label>
                <input
                  type="text"
                  placeholder="Filtrer par nom ou email..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs mb-2"
                />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username} - {u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Durée *</label>
                  <input
                    type="number"
                    min={1}
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unité de durée *</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                    <option value="weeks">Semaines</option>
                    <option value="months">Mois</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date et Heure de Début (Optionnel - Immédiat si vide)</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Motif Interne / Campagne *</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Campagne de parrainage VIP #1"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/25"
                >
                  Activer le Statut VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
