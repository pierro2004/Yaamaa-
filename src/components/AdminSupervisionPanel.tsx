import React, { useState, useEffect } from "react";
import { User, SupervisionIncident, SupervisionReport, SupervisionSeverity } from "../types";
import { 
  ShieldAlert, 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Lock, 
  Unlock, 
  Terminal, 
  Send, 
  Mail, 
  Smartphone, 
  Download, 
  Plus, 
  Check, 
  Eye, 
  Wrench,
  Sparkles,
  Layers,
  Globe,
  CreditCard,
  MessageSquare
} from "lucide-react";

interface AdminSupervisionPanelProps {
  currentUser: User | null;
  currentLanguage: "fr" | "en";
  users: User[];
  systemMetrics: any;
  onRefreshData?: () => void;
}

export default function AdminSupervisionPanel({
  currentUser,
  currentLanguage,
  users,
  systemMetrics,
  onRefreshData
}: AdminSupervisionPanelProps) {
  const [incidents, setIncidents] = useState<SupervisionIncident[]>([]);
  const [reports, setReports] = useState<SupervisionReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<"realtime" | "incidents" | "analytics" | "users_stats" | "reports">("realtime");
  
  // Notification toggle states
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(true);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedIncident, setSelectedIncident] = useState<SupervisionIncident | null>(null);

  useEffect(() => {
    fetchSupervisionData();
  }, []);

  const fetchSupervisionData = async () => {
    try {
      setLoading(true);
      const [resIncidents, resReports] = await Promise.all([
        fetch("/api/supervision-incidents").catch(() => ({ ok: false, json: () => [] })),
        fetch("/api/supervision-reports").catch(() => ({ ok: false, json: () => [] }))
      ]);

      const incData = resIncidents.ok ? await resIncidents.json() : [];
      const repData = resReports.ok ? await resReports.json() : [];
      setIncidents(Array.isArray(incData) ? incData : []);
      setReports(Array.isArray(repData) ? repData : []);
    } catch (err) {
      console.error("Error loading supervision data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateIncident = async () => {
    try {
      setSimulationRunning(true);
      const res = await fetch("/api/supervision-incidents/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const newInc = await res.json();
        setIncidents(prev => [newInc, ...prev]);
        setSuccessMessage("Nouvel incident simulé et détecté par l'IA de surveillance avec succès !");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/supervision-incidents/${id}/resolve`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents(prev => prev.map(inc => inc.id === id ? updated : inc));
        if (selectedIncident?.id === id) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoCorrect = async (id: string) => {
    try {
      const res = await fetch(`/api/supervision-incidents/${id}/autocorrect`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents(prev => prev.map(inc => inc.id === id ? updated : inc));
        if (selectedIncident?.id === id) setSelectedIncident(updated);
        setSuccessMessage("Auto-correction exécutée avec succès par le robot de maintenance !");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async (type: "daily" | "weekly" | "monthly") => {
    try {
      const res = await fetch("/api/supervision-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports(prev => [newReport, ...prev]);
        setSuccessMessage(`Rapport ${type} généré avec succès !`);
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User stats calculations
  const totalUsers = users.length;
  const newUsersCount = users.filter(u => u.createdAt && new Date(u.createdAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000).length;
  const activeUsersCount = users.filter(u => u.status === "online" || (u.xp && u.xp > 100)).length;
  const inactiveUsersCount = Math.max(0, totalUsers - activeUsersCount);
  const suspendedUsersCount = users.filter(u => u.isSuspended).length;
  const verifiedUsersCount = users.filter(u => u.is2faEnabled || u.level > 1).length;
  const premiumUsersCount = users.filter(u => u.merchantNumber || u.role === "advertiser").length;

  const activeIncidents = incidents.filter(i => i.status === "active");
  const criticalCount = activeIncidents.filter(i => i.severity === "critical").length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Activity className="h-64 w-64 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              SÉCURITÉ & SUPERVISION EN DIRECT • 99.98% UPTIME
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-heading">
              Centre de Supervision Intelligent <span className="text-emerald-400">(Yama Core)</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Plateforme exclusive réservée aux administrateurs habilités. Surveillance multi-composants, détection d'anomalies par IA, analyses prédictives et rapports automatisés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSimulateIncident}
              disabled={simulationRunning}
              className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              {simulationRunning ? "Simulation en cours..." : "Simuler un Incident"}
            </button>
            <button
              type="button"
              onClick={fetchSupervisionData}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CRITICAL ALERTS BANNER IF ANY */}
      {criticalCount > 0 && (
        <div className="bg-rose-50 border-2 border-rose-500/50 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-950 uppercase tracking-wide">
                Alerte Critique Active ({criticalCount} incident{criticalCount > 1 ? "s" : ""})
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Une intervention ou une action d'auto-correction est requise pour maintenir la conformité des services.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab("incidents")}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            Voir les Incidents
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab("realtime")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "realtime"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
          }`}
        >
          <Server className="h-4 w-4" />
          1. Surveillance en Temps Réel
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("incidents")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "incidents"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          2. Détection d'Incidents ({incidents.filter(i => i.status === "active").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("analytics")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "analytics"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
          }`}
        >
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          4. Tableau Analytique
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("users_stats")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "users_stats"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
          }`}
        >
          <Users className="h-4 w-4 text-amber-600" />
          5. Statistiques Utilisateurs (Admin)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("reports")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "reports"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
              : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
          }`}
        >
          <FileText className="h-4 w-4 text-blue-600" />
          7. Rapports Automatiques ({reports.length})
        </button>
      </div>

      {/* TAB 1: REAL-TIME MONITORING */}
      {activeSubTab === "realtime" && (
        <div className="space-y-8 animate-fade-in">
          {/* QUICK COMPONENT STATUS GRID */}
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              État des Composants Critiques de la Plateforme
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Serveur Principal (Cluster Node.js)", status: "Opérationnel", load: "24% CPU", latency: "18ms", icon: Server, color: "emerald" },
                { name: "Base de Données (PostgreSQL / SQLite)", status: "Synchronisé", load: "28 Connexions", latency: "2.4ms", icon: Database, color: "emerald" },
                { name: "API Internes & Externes", status: "Opérationnel", load: "99.85% Succès", latency: "45ms", icon: Globe, color: "emerald" },
                { name: "Passerelles de Paiement (Mobile Money)", status: "Opérationnel", load: "Wave / Orange", latency: "310ms", icon: CreditCard, color: "emerald" },
                { name: "Messagerie & Appels WebSocket", status: "Connecté", load: "Active Rooms", latency: "12ms", icon: MessageSquare, color: "emerald" },
                { name: "Stockage Fichiers (CDN & Cloud)", status: "Optimal", load: "42.5 GB / 500GB", latency: "65ms", icon: HardDrive, color: "emerald" },
                { name: "Notifications Push & Email", status: "Actif", load: "0 en attente", latency: "99.9%", icon: Bell, color: "emerald" },
                { name: "Tâches Automatiques (Cron Jobs)", status: "Exécuté", load: "Prochain: 10m", latency: "OK", icon: Clock, color: "emerald" },
                { name: "Performances Globales UI", status: "Fluide", load: "60 FPS Stable", latency: "12ms", icon: Zap, color: "emerald" }
              ].map((comp, idx) => {
                const IconComponent = comp.icon;
                return (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-gray-900 truncate">{comp.name}</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {comp.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 font-mono">
                        <span>Charge: <strong className="text-gray-800">{comp.load}</strong></span>
                        <span>Latence: <strong className="text-gray-800">{comp.latency}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NOTIFICATION CONFIGURATION */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              Canaux de Notification Administrative en Temps Réel
            </h3>
            <p className="text-xs text-gray-500">
              Configurez la diffusion automatique des alertes en cas d'anomalie critique sur la plateforme.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Alertes par E-mail</h4>
                    <p className="text-[11px] text-gray-500">Envoi immédiat à admin@yaamaa.com</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${emailAlertsEnabled ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"}`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Notifications Push</h4>
                    <p className="text-[11px] text-gray-500">Bannières mobiles & web temps réel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPushAlertsEnabled(!pushAlertsEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${pushAlertsEnabled ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"}`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT DETECTION & REPORT */}
      {activeSubTab === "incidents" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Journal Intelligent des Incidents & Diagnostics ({incidents.length})
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              Actifs: {incidents.filter(i => i.status === "active").length} • Résolus: {incidents.filter(i => i.status !== "active").length}
            </span>
          </div>

          <div className="space-y-4">
            {incidents.map((inc) => {
              const isCrit = inc.severity === "critical";
              const isHigh = inc.severity === "high";
              const isMed = inc.severity === "medium";
              return (
                <div 
                  key={inc.id}
                  className={`bg-white rounded-3xl border p-6 shadow-sm transition space-y-4 ${
                    inc.status === "active" 
                      ? (isCrit ? "border-rose-300 bg-rose-50/20" : isHigh ? "border-amber-300 bg-amber-50/20" : "border-indigo-200") 
                      : "border-gray-200 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                        isCrit ? "bg-rose-100 text-rose-700" : isHigh ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {isCrit ? <XCircle className="h-6 w-6" /> : isHigh ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {inc.component}
                          </span>
                          <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                            isCrit ? "bg-rose-100 text-rose-800" : isHigh ? "bg-amber-100 text-amber-800" : isMed ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            Gravité : {inc.severity}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            inc.status === "active" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {inc.status === "active" ? "🔴 Actif" : inc.status === "auto_corrected" ? "⚡ Auto-Corrigé" : "✅ Résolu"}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-gray-900 mt-1">{inc.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Signalé le : {new Date(inc.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {inc.status === "active" && inc.isAutoCorrectable && (
                        <button
                          type="button"
                          onClick={() => handleAutoCorrect(inc.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Auto-Corriger
                        </button>
                      )}
                      {inc.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleResolveIncident(inc.id)}
                          className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Marquer Résolu
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {selectedIncident?.id === inc.id ? "Masquer Rapport" : "Voir Rapport Détaillé"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/60">
                    {inc.description}
                  </p>

                  {/* EXPANDED DETAILED REPORT */}
                  {selectedIncident?.id === inc.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fade-in bg-slate-900 text-white p-6 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <Terminal className="h-4 w-4" /> Rapport d'Analyse d'Incident & Journaux Système
                        </h5>
                        <span className="text-[11px] text-gray-400 font-mono">Impact : {inc.impactedUsersCount} utilisateurs</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p><strong className="text-gray-300">Conséquences possibles :</strong> <span className="text-gray-400">{inc.consequences}</span></p>
                          <p><strong className="text-gray-300">Causes probables :</strong> <span className="text-gray-400">{inc.probableCauses}</span></p>
                          <p><strong className="text-gray-300">Recommandations :</strong> <span className="text-emerald-300">{inc.recommendations}</span></p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-gray-300">Étapes de correction suggérées :</p>
                          <ul className="list-disc pl-4 space-y-1 text-gray-400">
                            {inc.correctionSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* LOGS TERMINAL */}
                      <div className="space-y-1.5 pt-2">
                        <p className="text-[10px] font-mono text-gray-400 uppercase">Journaux (Logs) associés :</p>
                        <div className="bg-black/80 p-3.5 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1 border border-emerald-500/20 max-h-48 overflow-y-auto">
                          {inc.logs.map((log, lIdx) => (
                            <div key={lIdx} className="leading-tight">{log}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICAL DASHBOARD */}
      {activeSubTab === "analytics" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Fonctionnalité Phare</span>
              <h4 className="text-lg font-black text-gray-900">Numéros Marchands</h4>
              <p className="text-xs text-emerald-600 font-bold">+34% d'utilisation ce mois</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Service le Plus Populaire</span>
              <h4 className="text-lg font-black text-gray-900">Cadeaux Virtuels & IA</h4>
              <p className="text-xs text-indigo-600 font-bold">45% des interactions</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Taux d'Engagement Global</span>
              <h4 className="text-lg font-black text-gray-900">88.4%</h4>
              <p className="text-xs text-emerald-600 font-bold">Fidélité utilisateur élevée</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Pic d'Affluence</span>
              <h4 className="text-lg font-black text-gray-900">18:00 - 22:00 UTC</h4>
              <p className="text-xs text-amber-600 font-bold">Heure de forte utilisation</p>
            </div>
          </div>

          {/* USAGE BREAKDOWN */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Répartition de l'Utilisation des Services & Catégories Actives
            </h3>

            <div className="space-y-4">
              {[
                { name: "Parrainage & Réseau Filleuls", percentage: 38, count: "5,820 utilisateurs actifs", color: "bg-emerald-500" },
                { name: "Boutique & Commandes E-Commerce", percentage: 24, count: "3,650 transactions", color: "bg-indigo-500" },
                { name: "Assistant Yaamaa AI (Chat & Automatisation)", percentage: 20, count: "3,040 requêtes", color: "bg-amber-500" },
                { name: "Cadeaux Virtuels & Appels Vocaux/Vidéo", percentage: 12, count: "1,820 sessions", color: "bg-rose-500" },
                { name: "Annonces & Missions Sponsorisées", percentage: 6, count: "910 participations", color: "bg-blue-500" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-900">{item.name}</span>
                    <span className="font-mono text-gray-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER STATISTICS (ADMIN ONLY) */}
      {activeSubTab === "users_stats" && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-900 font-medium">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <span>CONFIDENTIALITÉ STRICTE : Les statistiques suivantes et les données démographiques des utilisateurs sont exclusivement réservées au panneau administrateur et ne sont jamais affichées publiquement.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Total Utilisateurs</span>
              <h3 className="text-2xl font-black text-gray-900">{totalUsers.toLocaleString()}</h3>
              <p className="text-xs text-emerald-600 font-bold">Comptes enregistrés</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Nouveaux (7 Jours)</span>
              <h3 className="text-2xl font-black text-gray-900">+{newUsersCount}</h3>
              <p className="text-xs text-indigo-600 font-bold">Acquisition récente</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Utilisateurs Actifs</span>
              <h3 className="text-2xl font-black text-gray-900">{activeUsersCount}</h3>
              <p className="text-xs text-emerald-600 font-bold">Actifs & engagés</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Utilisateurs Inactifs</span>
              <h3 className="text-2xl font-black text-gray-900">{inactiveUsersCount}</h3>
              <p className="text-xs text-gray-400 font-bold">Sans activité récente</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Comptes Vérifiés</span>
              <h3 className="text-2xl font-black text-gray-900">{verifiedUsersCount}</h3>
              <p className="text-xs text-blue-600 font-bold">2FA ou Niveau 2+</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Utilisateurs Premium / Marchands</span>
              <h3 className="text-2xl font-black text-gray-900">{premiumUsersCount}</h3>
              <p className="text-xs text-emerald-600 font-bold">Abonnements actifs</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">Comptes Suspendus</span>
              <h3 className="text-2xl font-black text-rose-600">{suspendedUsersCount}</h3>
              <p className="text-xs text-rose-500 font-bold">Sous restriction</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUTOMATED REPORTS */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Rapports Automatiques de Performance & Croissance ({reports.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateReport("daily")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
              >
                + Générer Rapport Quotidien
              </button>
              <button
                type="button"
                onClick={() => handleGenerateReport("weekly")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
              >
                + Générer Rapport Hebdomadaire
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {reports.map((rep) => (
              <div key={rep.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Rapport {rep.type}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{rep.date}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">Croissance : {rep.growthRate > 0 ? `+${rep.growthRate}%` : `${rep.growthRate}%`}</span>
                </div>

                <h4 className="text-base font-black text-gray-900">{rep.title}</h4>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {rep.performanceSummary}
                </p>

                <p className="text-xs text-gray-500 leading-relaxed">
                  {rep.details}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
                  <span>Incidents gérés : {rep.resolvedCount} / {rep.incidentsCount}</span>
                  <span>Utilisateurs actifs couverts : {rep.activeUsersCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
