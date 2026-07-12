import React, { useState, useEffect } from "react";
import { Shield, Lock, Sliders, History, Unlock, AlertTriangle, CheckCircle2, Search, RefreshCw } from "lucide-react";
import { User, SystemSettings } from "../types";

interface AdminPinSecurityPanelProps {
  currentUser: User;
  systemMetrics: SystemSettings;
  syncPlatformData: () => void;
  users: User[];
}

export default function AdminPinSecurityPanel({
  currentUser,
  systemMetrics,
  syncPlatformData,
  users
}: AdminPinSecurityPanelProps) {
  const [pinSettings, setPinSettings] = useState({
    pinMinLength: 4,
    pinMaxLength: 8,
    maxPinAttempts: 3,
    pinBlockDurationMinutes: 30,
    pinRequiredOperations: {
      balance: false,
      productPayment: true,
      merchantPurchase: true,
      subscription: true,
      virtualGift: true,
      sendMoney: true,
      withdrawal: true,
      pointConversion: true,
      assetConversion: true,
      pointTransfer: true,
      orderValidation: true
    },
    pinRecoveryCodeValidityMinutes: 15,
    pinAllowedRecoveryMethods: ["merchant_number", "email"]
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPinSettings();
    fetchAuditLogs();
  }, []);

  const fetchPinSettings = async () => {
    try {
      const res = await fetch("/api/admin/pin-settings");
      const data = await res.json();
      if (res.ok) {
        setPinSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pin-audit-logs");
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/pin-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pinSettings, operatorId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de la sauvegarde.");
        setSaving(false);
        return;
      }
      setSuccessMsg("Paramètres de sécurité PIN enregistrés avec succès.");
      syncPlatformData();
      setSaving(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur réseau.");
      setSaving(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!window.confirm("Voulez-vous vraiment débloquer ce portefeuille ?")) return;
    try {
      const res = await fetch("/api/admin/wallets/unblock-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, operatorId: currentUser.id })
      });
      if (res.ok) {
        syncPlatformData();
        fetchAuditLogs();
        alert("Portefeuille débloqué avec succès.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lockedUsers = users.filter(u => u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date());
  const filteredLogs = auditLogs.filter(l => 
    l.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.operation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-400">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight">Système de Sécurité Portefeuille & Code PIN</h2>
            <p className="text-xs text-indigo-200 mt-0.5">Configuration de niveau bancaire, règles d'essais et journal d'audit global Yaamaa</p>
          </div>
        </div>
        <button
          onClick={() => { fetchPinSettings(); fetchAuditLogs(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-medium">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Locked Wallets Alert Section */}
      {lockedUsers.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-rose-900 font-heading flex items-center gap-2 mb-3">
            <Lock className="h-5 w-5 text-rose-600 animate-pulse" />
            Portefeuilles actuellement verrouillés ({lockedUsers.length})
          </h3>
          <div className="space-y-2">
            {lockedUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{u.name} (@{u.username})</span>
                  <p className="text-rose-600 font-mono text-[11px] mt-0.5">Verrouillé jusqu'au {new Date(u.pinLockedUntil!).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleUnblockUser(u.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            Paramètres de Sécurité PIN
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Longueur minimale du PIN</label>
              <input
                type="number"
                min={4}
                max={6}
                value={pinSettings.pinMinLength}
                onChange={(e) => setPinSettings({ ...pinSettings, pinMinLength: parseInt(e.target.value) || 4 })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Longueur maximale du PIN</label>
              <input
                type="number"
                min={6}
                max={8}
                value={pinSettings.pinMaxLength}
                onChange={(e) => setPinSettings({ ...pinSettings, pinMaxLength: parseInt(e.target.value) || 8 })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre maximal d'essais erronés</label>
              <input
                type="number"
                min={1}
                max={10}
                value={pinSettings.maxPinAttempts}
                onChange={(e) => setPinSettings({ ...pinSettings, maxPinAttempts: parseInt(e.target.value) || 3 })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Durée du blocage temporaire (minutes)</label>
              <input
                type="number"
                min={5}
                max={1440}
                value={pinSettings.pinBlockDurationMinutes}
                onChange={(e) => setPinSettings({ ...pinSettings, pinBlockDurationMinutes: parseInt(e.target.value) || 30 })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Validité code de récupération (minutes)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={pinSettings.pinRecoveryCodeValidityMinutes}
                onChange={(e) => setPinSettings({ ...pinSettings, pinRecoveryCodeValidityMinutes: parseInt(e.target.value) || 15 })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            id="btn_save_pin_settings"
          >
            {saving ? "Enregistrement..." : "Enregistrer les Paramètres"}
          </button>
        </form>

        {/* Audit Logs Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Journal Global d'Audit Sécurité PIN
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par utilisateur..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400 text-xs">Chargement du journal d'audit...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Aucun journal d'audit de sécurité trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Opération</th>
                    <th className="p-3">Résultat</th>
                    <th className="p-3">Détails</th>
                    <th className="p-3">Date & Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-bold text-slate-900 font-sans">
                        {log.name || log.username || "Utilisateur"} <span className="text-gray-400 font-mono font-normal">(@{log.username})</span>
                      </td>
                      <td className="p-3 font-semibold text-indigo-900 font-sans">{log.operation}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${log.result === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {log.result === "success" ? "Succès" : "Échec"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate" title={log.details}>{log.details || "-"}</td>
                      <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
