import React, { useState } from "react";
import { Shield, KeyRound, Fingerprint, Lock, CheckCircle2, History, AlertTriangle, X, ArrowRight } from "lucide-react";
import { User } from "../types";

interface WalletSecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  syncPlatformData?: () => void;
}

export default function WalletSecuritySettingsModal({
  isOpen,
  onClose,
  currentUser,
  syncPlatformData
}: WalletSecuritySettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"pin" | "biometric" | "logs">("pin");
  
  // Change PIN states
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmNewPin) {
      setMessage({ type: "error", text: "Le nouveau PIN et sa confirmation ne correspondent pas." });
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      setMessage({ type: "error", text: "Le code PIN doit contenir entre 4 et 8 chiffres." });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/wallet/pin/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, oldPin, newPin, confirmNewPin })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors du changement de PIN." });
        setLoading(false);
        return;
      }
      setMessage({ type: "success", text: "Code PIN modifié avec succès !" });
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      if (syncPlatformData) syncPlatformData();
      setLoading(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur réseau." });
      setLoading(false);
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/pin/biometric/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, enabled })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur." });
        setLoading(false);
        return;
      }
      if (syncPlatformData) syncPlatformData();
      setMessage({ type: "success", text: `Authentification biométrique ${enabled ? 'activée' : 'désactivée'}.` });
      setLoading(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur." });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-400">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading tracking-tight">Sécurité du Portefeuille Yaamaa</h3>
              <p className="text-xs text-indigo-200">Gérez votre Code PIN de transaction, biométrie et journaux</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
            id="btn_close_security_modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 shrink-0">
          <button
            onClick={() => { setActiveTab("pin"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${activeTab === "pin" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-900"}`}
            id="tab_sec_pin"
          >
            <KeyRound className="h-4 w-4" />
            Code PIN
          </button>
          <button
            onClick={() => { setActiveTab("biometric"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${activeTab === "biometric" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-900"}`}
            id="tab_sec_biometric"
          >
            <Fingerprint className="h-4 w-4" />
            Biométrie & Appareil
          </button>
          <button
            onClick={() => { setActiveTab("logs"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${activeTab === "logs" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-900"}`}
            id="tab_sec_logs"
          >
            <History className="h-4 w-4" />
            Journal d'Audit ({currentUser.pinAuditLogs?.length || 0})
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {message && (
            <div className={`mb-5 flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-medium border ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === "pin" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <p className="font-bold">Indépendance Totale</p>
                  <p className="mt-0.5 text-indigo-700">
                    Votre Code PIN de transaction protège les retraits, cadeaux, achats et transferts. Il est distinct de votre mot de passe de connexion.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePin} className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-extrabold text-slate-900 font-heading">Modifier le Code PIN de Transaction</h4>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ancien Code PIN</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nouveau Code PIN (4 à 8 chiffres)</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirmer le Nouveau Code PIN</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !oldPin || !newPin || !confirmNewPin}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    id="btn_submit_change_pin"
                  >
                    {loading ? "Modification..." : "Mettre à jour le Code PIN"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "biometric" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 font-heading">Authentification Biométrique</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Utilisez l'empreinte digitale ou Face ID pour vos transactions.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.biometricEnabled || false}
                    onChange={(e) => handleToggleBiometric(e.target.checked)}
                    className="sr-only peer"
                    id="toggle_biometric_auth"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-600" />
                  Sécurité de Secours Obligatoire
                </p>
                <p className="mt-1 text-amber-700">
                  Même lorsque la biométrie est activée, votre Code PIN reste toujours disponible en tant que solution de secours sécurisée.
                </p>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 font-heading mb-3">Historique des Opérations de Sécurité PIN</h4>
              {(!currentUser.pinAuditLogs || currentUser.pinAuditLogs.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">Aucun événement de sécurité enregistré pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUser.pinAuditLogs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${log.result === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          <span className="font-bold text-slate-900">{log.operation}</span>
                          <span className="text-gray-400 font-mono text-[10px]">({new Date(log.timestamp).toLocaleString()})</span>
                        </div>
                        {log.details && <p className="text-gray-500 mt-1 font-mono text-[11px]">{log.details}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${log.result === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {log.result === "success" ? "Succès" : "Échec"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
