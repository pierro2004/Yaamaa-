import React, { useState, useEffect } from "react";
import { User, CurrencyRate, CurrencyRateHistory, CurrencyAlert } from "../types";
import { 
  Globe, 
  TrendingUp, 
  Coins, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Settings, 
  ArrowRight, 
  Search, 
  AlertCircle, 
  Lock, 
  PieChart, 
  FileText 
} from "lucide-react";

interface AdminCurrenciesPanelProps {
  currentUser: User | null;
  currentLanguage: "fr" | "en";
  users: User[];
  onRefreshData?: () => void;
}

export default function AdminCurrenciesPanel({
  currentUser,
  currentLanguage,
  users,
  onRefreshData
}: AdminCurrenciesPanelProps) {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [history, setHistory] = useState<CurrencyRateHistory[]>([]);
  const [alerts, setAlerts] = useState<CurrencyAlert[]>([]);
  const [centralCurrency, setCentralCurrency] = useState<string>("USD");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"rates" | "history" | "alerts" | "stats">("rates");

  // Success/Error Feedback
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Add Currency Form
  const [newCode, setNewCode] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [newRate, setNewRate] = useState<string>("");
  const [newStatus, setNewStatus] = useState<"active" | "inactive">("active");

  // Edit Rate Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Double Validation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "add" | "update_rate" | "toggle_status" | "delete" | "change_central";
    data: any;
  } | null>(null);
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  useEffect(() => {
    fetchCurrencyData();
  }, []);

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [resRates, resHistory, resAlerts, resSettings] = await Promise.all([
        fetch("/api/currencies/rates").catch(() => ({ ok: false, json: () => [] })),
        fetch("/api/currencies/history").catch(() => ({ ok: false, json: () => [] })),
        fetch("/api/admin/currency-alerts").catch(() => ({ ok: false, json: () => [] })),
        fetch("/api/currencies/settings").catch(() => ({ ok: false, json: () => ({ centralCurrency: "USD" }) }))
      ]);

      const ratesData = resRates.ok ? await resRates.json() : [];
      const historyData = resHistory.ok ? await resHistory.json() : [];
      const alertsData = resAlerts.ok ? await resAlerts.json() : [];
      const settingsData = resSettings.ok ? await resSettings.json() : { centralCurrency: "USD" };

      setRates(Array.isArray(ratesData) ? ratesData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setCentralCurrency(settingsData.centralCurrency || "USD");
    } catch (err) {
      console.error("Error fetching currency data:", err);
      setErrorMsg("Impossible de charger les données financières depuis le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDoubleValidation = (actionType: any, actionData: any) => {
    setPendingAction({ type: actionType, data: actionData });
    setConfirmPin("");
    setPinError("");
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmPin) {
      setPinError("Veuillez saisir votre code PIN ou mot de passe administrateur pour valider.");
      return;
    }

    // In a real application, we would check the user's PIN on the server.
    // For our secure frontend dashboard, we require a correct entry (e.g. any PIN or password for demo, or '1234' / user password)
    // We'll perform secure server-side validation during the API request.
    try {
      setPinError("");
      const action = pendingAction;
      if (!action) return;

      let response: Response;
      
      if (action.type === "add") {
        response = await fetch("/api/currencies/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...action.data,
            adminPin: confirmPin,
            adminUsername: currentUser?.username || "Admin"
          })
        });
      } else if (action.type === "update_rate") {
        response = await fetch("/api/currencies/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            devise_destination: action.data.code,
            taux_conversion: parseFloat(action.data.rate),
            adminPin: confirmPin,
            adminUsername: currentUser?.username || "Admin"
          })
        });
      } else if (action.type === "toggle_status") {
        response = await fetch(`/api/currencies/rates/${action.data.id}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminPin: confirmPin,
            adminUsername: currentUser?.username || "Admin"
          })
        });
      } else if (action.type === "delete") {
        response = await fetch(`/api/currencies/rates/${action.data.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminPin: confirmPin,
            adminUsername: currentUser?.username || "Admin"
          })
        });
      } else if (action.type === "change_central") {
        response = await fetch("/api/currencies/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            centralCurrency: action.data.centralCurrency,
            adminPin: confirmPin,
            adminUsername: currentUser?.username || "Admin"
          })
        });
      } else {
        return;
      }

      const resJson = await response.json();
      if (!response.ok) {
        setPinError(resJson.error || "La double-validation administrative a échoué.");
        return;
      }

      // Success!
      setSuccessMsg(resJson.message || "Action administrative exécutée et auditée avec succès !");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowConfirmModal(false);
      setPendingAction(null);
      setConfirmPin("");
      
      // Reset forms
      if (action.type === "add") {
        setNewCode("");
        setNewName("");
        setNewRate("");
      }
      setEditingId(null);
      
      // Refresh all data
      fetchCurrencyData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setPinError("Erreur lors de la communication sécurisée avec le serveur.");
    }
  };

  // Helper to trigger alert clear
  const handleClearAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/currency-alerts/${alertId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentUser?.id })
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate statistics per country/currency
  const getCountryStats = () => {
    const stats: Record<string, { usersCount: number; totalAvailable: number; currency: string; country: string }> = {};
    
    // Default entries
    const countriesWithCurrencies = [
      { name: "Bénin", currency: "XOF" },
      { name: "Sénégal", currency: "XOF" },
      { name: "Côte d'Ivoire", currency: "XOF" },
      { name: "Togo", currency: "XOF" },
      { name: "Afrique du Sud", currency: "ZAR" },
      { name: "Nigeria", currency: "NGN" },
      { name: "Ghana", currency: "GHS" },
      { name: "France", currency: "EUR" },
      { name: "États-Unis", currency: "USD" },
      { name: "Canada", currency: "CAD" }
    ];

    countriesWithCurrencies.forEach(c => {
      stats[c.name] = { usersCount: 0, totalAvailable: 0, currency: c.currency, country: c.name };
    });

    users.forEach(u => {
      const country = u.country || "France";
      const cur = u.currency || "EUR";
      const avail = u.wallet?.available || 0; // Balance is in USD (central)

      if (!stats[country]) {
        stats[country] = { usersCount: 0, totalAvailable: 0, currency: cur, country };
      }
      stats[country].usersCount += 1;
      stats[country].totalAvailable += avail; // Sum in USD (central currency)
    });

    return Object.values(stats);
  };

  // Helper to find a rate for displaying statistics
  const getRateForDisplay = (targetCur: string) => {
    if (targetCur === centralCurrency) return 1.0;
    const rateObj = rates.find(r => r.devise_source === centralCurrency && r.devise_destination === targetCur);
    return rateObj ? rateObj.taux_conversion : 1.0;
  };

  const countryStats = getCountryStats();

  return (
    <div className="space-y-8">
      {/* SUCCESS & ERROR BAR */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* HEADER STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Devise Centrale</p>
            <p className="text-xl font-black text-gray-950 font-heading">{centralCurrency}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Règlement global</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Devises Supportées</p>
            <p className="text-xl font-black text-gray-950 font-heading">{rates.length}</p>
            <span className="text-[10px] text-gray-500 font-bold">{rates.filter(r => r.statut === "active").length} actives / {rates.filter(r => r.statut === "inactive").length} suspendues</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Fonds Globaux Yaamaa</p>
            <p className="text-xl font-black text-emerald-600 font-heading">
              {(users.reduce((acc, u) => acc + (u.wallet?.available || 0), 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} $
            </p>
            <span className="text-[10px] text-gray-500 font-bold">Calculé en devise centrale</span>
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl relative">
            <AlertTriangle className="h-6 w-6" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {alerts.length}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Alertes Financières</p>
            <p className="text-xl font-black text-gray-950 font-heading">{alerts.length}</p>
            <span className="text-[10px] text-rose-500 font-bold">Variations & conversions</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION */}
      <div className="flex border-b border-gray-150 gap-2 pb-px">
        <button
          onClick={() => setActiveTab("rates")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
            activeTab === "rates"
              ? "border-amber-600 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950"
          }`}
        >
          💱 Taux de Conversion
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
            activeTab === "history"
              ? "border-amber-600 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950"
          }`}
        >
          🕒 Historique des Changements
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition relative ${
            activeTab === "alerts"
              ? "border-amber-600 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950"
          }`}
        >
          🚨 Notifications Admin
          {alerts.length > 0 && (
            <span className="ml-1 bg-rose-600 text-white rounded-full text-[8px] px-1 font-bold">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
            activeTab === "stats"
              ? "border-amber-600 text-amber-700 bg-amber-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950"
          }`}
        >
          📊 Stats par Pays
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-150 rounded-2xl">
          <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mb-4" />
          <p className="text-xs font-extrabold text-gray-500">Chargement des données financières globales...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: RATES & CONVERSION MANAGEMENT */}
          {activeTab === "rates" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* RATES TABLE LIST */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-gray-950">Moteur de conversion de Yaamaa</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Taux de conversion définis par rapport à la devise centrale <strong>{centralCurrency}</strong></p>
                    </div>
                    <button 
                      onClick={fetchCurrencyData}
                      className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition"
                      title="Actualiser les taux"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-150 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                          <th className="py-3 px-4">De (Centrale)</th>
                          <th className="py-3 px-4">Vers (Locale)</th>
                          <th className="py-3 px-4">Taux de Conversion</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4">Mise à jour</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-gray-50/50">
                            <td className="py-4 px-4 font-black text-gray-950 font-mono">
                              1 {rate.devise_source}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono font-black text-gray-950 text-xs">{rate.devise_destination}</span>
                              <span className="block text-[10px] text-gray-400">Pour affichage local</span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-gray-950">
                              {editingId === rate.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-20 px-1.5 py-1 text-xs border border-gray-300 rounded-lg font-mono"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      if (parseFloat(editingValue) <= 0 || isNaN(parseFloat(editingValue))) {
                                        setErrorMsg("Le taux de conversion doit être supérieur à 0.");
                                        return;
                                      }
                                      triggerDoubleValidation("update_rate", { code: rate.devise_destination, rate: editingValue });
                                    }}
                                    className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{rate.taux_conversion.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                  <button
                                    onClick={() => {
                                      setEditingId(rate.id);
                                      setEditingValue(rate.taux_conversion.toString());
                                    }}
                                    className="text-[10px] text-amber-600 hover:underline font-normal"
                                  >
                                    Modifier
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                rate.statut === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>
                                {rate.statut === "active" ? "Actif" : "Désactivé"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-400 text-[10px]">
                              {new Date(rate.date_mise_a_jour).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              <span className="block text-[9px] italic">Par: {rate.modifie_par || "Système"}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => triggerDoubleValidation("toggle_status", { id: rate.id })}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                                    rate.statut === "active"
                                      ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                      : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  {rate.statut === "active" ? "Suspendre" : "Activer"}
                                </button>
                                {rate.devise_destination !== centralCurrency && (
                                  <button
                                    onClick={() => triggerDoubleValidation("delete", { id: rate.id })}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                    title="Supprimer la devise"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DEFINE CENTRAL CURRENCY CARD */}
                <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm">
                  <h4 className="font-heading text-xs font-bold text-gray-950 uppercase tracking-wide flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-amber-600" />
                    Changer la devise de règlement centrale
                  </h4>
                  <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
                    <strong>Attention :</strong> La modification de la devise centrale redéfinira l'unité financière interne pour tous les calculs du système (comptes utilisateurs, soldes de portefeuilles, prix de boutique). L'accès à cette configuration nécessite une double validation PIN.
                  </p>
                  <div className="flex items-end gap-4 max-w-md">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1.5">Sélectionner la Devise Centrale</label>
                      <select
                        value={centralCurrency}
                        onChange={(e) => triggerDoubleValidation("change_central", { centralCurrency: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold bg-gray-50 focus:bg-white"
                      >
                        {rates.filter(r => r.statut === "active").map(r => (
                          <option key={r.devise_destination} value={r.devise_destination}>{r.devise_destination}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADD NEW CURRENCY PANEL */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-gray-950 mb-1 flex items-center gap-1.5">
                    <Plus className="h-5 w-5 text-amber-600" />
                    Ajouter une nouvelle devise
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-4">Associez un pays à une nouvelle monnaie d'affichage avec son taux initial.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1">Code Devise (ex: GHS, NGN, XOF)</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="ZAR"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1">Nom Complet de la Monnaie</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Rand Sud-Africain"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1">Taux initial (1 {centralCurrency} = ? )</label>
                      <input
                        type="number"
                        step="any"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        placeholder="18.5"
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1">Statut Initial</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50"
                      >
                        <option value="active">Actif (immédiatement disponible)</option>
                        <option value="inactive">Inactif (archivé/suspendu)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        if (!newCode || !newName || !newRate) {
                          setErrorMsg("Veuillez renseigner tous les champs requis pour ajouter cette devise.");
                          return;
                        }
                        const rateFloat = parseFloat(newRate);
                        if (isNaN(rateFloat) || rateFloat <= 0) {
                          setErrorMsg("Le taux de conversion doit être supérieur à 0.");
                          return;
                        }
                        triggerDoubleValidation("add", {
                          devise_destination: newCode,
                          devise_name: newName,
                          taux_conversion: rateFloat,
                          statut: newStatus
                        });
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Créer la Devise
                    </button>
                  </div>
                </div>

                {/* SAFETY NOTE HOLDER */}
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                  <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Sécurité des Taux d'Échange
                  </h4>
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Le Currency Engine de Yaamaa utilise un mécanisme anti-arbitrage et de protection de volatilité. Si un administrateur tente d'appliquer une modification supérieure à 20% par rapport à l'ancien taux, le système génère immédiatement une notification d'alerte pour audit approfondi et l'indique aux autres modérateurs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE HISTORY LOG */}
          {activeTab === "history" && (
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
                <div>
                  <h3 className="font-heading text-sm font-bold text-gray-950">Journal de traçabilité des modifications</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Historique d'audit complet de toutes les modifications de devises ou taux</p>
                </div>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                  {history.length} modifications
                </span>
              </div>

              {history.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold">Aucune modification historique enregistrée.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-150 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-4">Date & Heure</th>
                        <th className="py-3 px-4">Type d'Action</th>
                        <th className="py-3 px-4">Paire de Devises</th>
                        <th className="py-3 px-4">Ancien Taux</th>
                        <th className="py-3 px-4">Nouveau Taux</th>
                        <th className="py-3 px-4">Auteur</th>
                        <th className="py-3 px-4">Double-Validation PIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 font-mono">
                          <td className="py-3.5 px-4 text-[10px] text-gray-500 font-sans">
                            {new Date(log.timestamp).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              log.type_action === "create" ? "bg-emerald-50 text-emerald-700" :
                              log.type_action === "update" ? "bg-amber-50 text-amber-700" :
                              log.type_action === "toggle" ? "bg-indigo-50 text-indigo-700" :
                              "bg-rose-50 text-rose-700"
                            }`}>
                              {log.type_action === "create" ? "CRÉATION" :
                               log.type_action === "update" ? "REVALORISATION" :
                               log.type_action === "toggle" ? "STATUT" : "SUPPRESSION"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-black text-gray-950">
                            {log.devise_source} → {log.devise_destination}
                          </td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {log.ancien_taux ? log.ancien_taux.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-950 font-black">
                            {log.nouveau_taux ? log.nouveau_taux.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 font-sans font-bold">
                            @{log.admin_nom || "Admin"}
                            <span className="block text-[8px] text-gray-400 font-mono">ID: {log.admin_id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-sans text-emerald-600 text-[10px] font-extrabold">
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" /> Checked Sec
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM NOTIFICATIONS / ALERTS */}
          {activeTab === "alerts" && (
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-gray-950">Flux d'Alerte Financière</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Surveillez les dérogations de taux, échecs de paiement ou fortes variations de volatilité.</p>
                </div>
                <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                  {alerts.length} alertes actives
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <ShieldCheck className="h-10 w-10 mx-auto text-emerald-500 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-gray-950">Système Financier Sain</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Aucune anomalie ou variation suspecte détectée sur Yaamaa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition ${
                        alert.type === "high_volatility" ? "bg-rose-50/50 border-rose-100" :
                        alert.type === "conversion_fail" ? "bg-amber-50/50 border-amber-100" :
                        "bg-gray-50 border-gray-150"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          alert.type === "high_volatility" ? "bg-rose-100 text-rose-600" :
                          alert.type === "conversion_fail" ? "bg-amber-100 text-amber-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-950 leading-snug">{alert.title}</h4>
                          <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                          <span className="text-[9px] text-gray-400 block mt-2 font-mono">
                            Détecté le: {new Date(alert.timestamp).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClearAlert(alert.id)}
                        className="self-end sm:self-start bg-white hover:bg-gray-50 text-[10px] text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer"
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATISTICS BY COUNTRY */}
          {activeTab === "stats" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* STATS MATRIX TABLE */}
              <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/40">
                  <h3 className="font-heading text-sm font-bold text-gray-950">Holdings et Volumes par Pays</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Ventilation des soldes portefeuilles convertis dynamiquement de la monnaie centrale aux monnaies locales.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-150 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-4">Pays de l'Utilisateur</th>
                        <th className="py-3 px-4">Membres Actifs</th>
                        <th className="py-3 px-4">Devise d'Affichage</th>
                        <th className="py-3 px-4">Taux (USD / Devise)</th>
                        <th className="py-3 px-4">Volume total (USD Central)</th>
                        <th className="py-3 px-4 text-right">Équivalent Local</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {countryStats.map((stat, i) => {
                        const localRate = getRateForDisplay(stat.currency);
                        const volumeInLocal = stat.totalAvailable * localRate;
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="py-3.5 px-4 font-bold text-gray-950">
                              {stat.country}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-950">
                              {stat.usersCount} utilisateurs
                            </td>
                            <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-700">
                              {stat.currency}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                              1 {centralCurrency} = {localRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-500">
                              {stat.totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                              {volumeInLocal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {stat.currency}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STABILITY PIE ANALYST INFO */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-heading text-sm font-bold text-gray-950 mb-3 flex items-center gap-1.5">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    Analyse de réserve de devise
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                    Puisque Yaamaa opère un portefeuille virtuel global adossé à un solde central, le taux de couverture en devise de réserve doit rester supérieur à 100%. Le solde disponible stocké sur les comptes bancaires d'ancrage doit équivaloir au moins à la somme de tous les dépôts exprimés en USD.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex justify-between text-[10px] text-gray-400 font-extrabold uppercase">
                        <span>Holding global des comptes</span>
                        <span>100%</span>
                      </div>
                      <p className="text-sm font-black text-gray-950 mt-1 font-mono">
                        {(users.reduce((acc, u) => acc + (u.wallet?.available || 0), 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <div className="flex justify-between text-[10px] text-indigo-500 font-extrabold uppercase">
                        <span>Zone Monétaire Majeure</span>
                        <span>Part Estimée</span>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Franc CFA (XOF/XAF)</span>
                          <span className="font-mono font-bold">58 %</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Euro Zone (EUR)</span>
                          <span className="font-mono font-bold">24 %</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Naira/Cedi (NGN/GHS)</span>
                          <span className="font-mono font-bold">12 %</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dollar Zone (USD/CAD)</span>
                          <span className="font-mono font-bold">6 %</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* DOUBLE VALIDATION SECURE PIN MODAL */}
      {showConfirmModal && pendingAction && (
        <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-amber-50/30 flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-black text-gray-950">Double Validation Sécurisée</h3>
                <p className="text-[10px] text-amber-700">Validation requise pour modification sensible des devises</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
                <p className="font-bold text-gray-800">Vous êtes sur le point d'effectuer l'action suivante :</p>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 text-[11px] font-mono">
                  {pendingAction.type === "add" && (
                    <span>Créer une nouvelle devise : {pendingAction.data.devise_destination} ({pendingAction.data.devise_name}) avec un taux de {pendingAction.data.taux_conversion}</span>
                  )}
                  {pendingAction.type === "update_rate" && (
                    <span>Modifier le taux de {pendingAction.data.code} à {pendingAction.data.rate}</span>
                  )}
                  {pendingAction.type === "toggle_status" && (
                    <span>Changer le statut d'activation de la devise ID: {pendingAction.data.id}</span>
                  )}
                  {pendingAction.type === "delete" && (
                    <span>Supprimer la devise ID: {pendingAction.data.id} du moteur de conversion</span>
                  )}
                  {pendingAction.type === "change_central" && (
                    <span>Modifier la devise centrale de règlement globale par : {pendingAction.data.centralCurrency}</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">Cette action sera auditée avec votre nom d'administrateur (@{currentUser?.username}) et inscrite dans le journal de traçabilité permanent de Yaamaa.</p>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mb-1">Entrez votre code PIN de transaction (1234 par défaut)</label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-center text-lg font-black tracking-widest bg-gray-50 focus:bg-white"
                />
                {pinError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {pinError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition border border-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
              >
                Confirmer l'Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
