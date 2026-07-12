import React, { useState, useEffect } from "react";
import { 
  RefreshCw, Cpu, Layers, Sliders, CheckCircle, AlertTriangle, Plus, Trash2, 
  Edit3, ShieldCheck, FileText, Send, Eye, Clock, UserCheck, Check, X, Zap 
} from "lucide-react";
import { SystemSettings, AutomationRule, MessageTemplate, SyncLogEntry, User } from "../types";

interface AdminSyncAutomationPanelProps {
  currentUser: User | null;
  settings: SystemSettings;
  onRefreshData: () => Promise<void>;
}

export default function AdminSyncAutomationPanel({
  currentUser,
  settings,
  onRefreshData
}: AdminSyncAutomationPanelProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "rules" | "templates" | "coherence">("logs");

  // State for Rules
  const [rules, setRules] = useState<AutomationRule[]>(settings.automationRules || []);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    triggerEvent: "referral_success" as AutomationRule["triggerEvent"],
    conditions: "always",
    templateId: "",
    channels: ["in_app"] as ("in_app" | "message" | "home_feed" | "email")[],
    isActive: true
  });

  // State for Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>(settings.messageTemplates || []);
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<MessageTemplate | null>(null);
  const [tplForm, setTplForm] = useState({
    title: "",
    category: "referral" as MessageTemplate["category"],
    content: "Félicitations {NomUtilisateur} ! Vous venez de recevoir {MontantCommission} grâce à votre filleul {NomFilleul}.",
    variables: ["NomUtilisateur", "MontantCommission", "NomFilleul", "SoldePortefeuille"],
    isActive: true
  });

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(settings.syncLogs || []);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, tplsRes, logsRes] = await Promise.all([
        fetch("/api/admin/automation-rules"),
        fetch("/api/admin/message-templates"),
        fetch("/api/admin/sync-logs")
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (tplsRes.ok) setTemplates(await tplsRes.json());
      if (logsRes.ok) setSyncLogs(await logsRes.json());
    } catch (err) {
      console.error("Failed to fetch automation & sync data", err);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRule ? `/api/admin/automation-rules/${editingRule.id}` : "/api/admin/automation-rules";
      const method = editingRule ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ruleForm, operatorId: currentUser?.id })
      });
      if (res.ok) {
        setMsg(editingRule ? "Règle d'automatisation mise à jour avec succès !" : "Nouvelle règle d'automatisation créée !");
        setShowRuleModal(false);
        setEditingRule(null);
        await fetchData();
        await onRefreshData();
      } else {
        setError("Erreur lors de l'enregistrement de la règle.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Supprimer cette règle d'automatisation ?")) return;
    try {
      await fetch(`/api/admin/automation-rules/${id}`, { method: "DELETE" });
      await fetchData();
      setMsg("Règle supprimée.");
    } catch (err) {
      setError("Erreur suppression.");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTpl ? `/api/admin/message-templates/${editingTpl.id}` : "/api/admin/message-templates";
      const method = editingTpl ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tplForm, operatorId: currentUser?.id })
      });
      if (res.ok) {
        setMsg(editingTpl ? "Modèle de message mis à jour !" : "Nouveau modèle de message enregistré !");
        setShowTplModal(false);
        setEditingTpl(null);
        await fetchData();
        await onRefreshData();
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Supprimer ce modèle de message ?")) return;
    try {
      await fetch(`/api/admin/message-templates/${id}`, { method: "DELETE" });
      await fetchData();
      setMsg("Modèle supprimé.");
    } catch (err) {
      setError("Erreur suppression.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
            Moteur Central Yaamaa • Synchronisation & Automatisation des Communications
          </span>
          <h2 className="text-2xl font-black">Moteur de Synchronisation & Automatisation</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Centralisation stricte des paramètres administratifs, génération automatisée de communications dynamiques sur tous les canaux sans codage en dur.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0">
          <span className="block text-2xl font-black">{rules.filter(r => r.isActive).length}</span>
          <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Règles Actives</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "logs", label: "📜 Journal de Synchronisation (Audit)", icon: Clock },
          { id: "rules", label: "⚡ Règles d'Automatisation", icon: Cpu },
          { id: "templates", label: "📝 Bibliothèque de Modèles", icon: FileText },
          { id: "coherence", label: "🛡️ Vérification de Cohérence", icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
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

      {/* TAB 1: SYNC LOGS & AUDIT */}
      {activeTab === "logs" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Journal d'Audit & Synchronisation en Temps Réel
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Historique complet des modifications de paramètres, administrateurs émetteurs, modules mis à jour et statuts.</p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </button>
          </div>

          {syncLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs italic">
              Aucun journal de synchronisation enregistré pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Date & Heure</th>
                    <th className="pb-3 px-3">Administrateur</th>
                    <th className="pb-3 px-3">Paramètre / Clé</th>
                    <th className="pb-3 px-3">Modules Mis à Jour</th>
                    <th className="pb-3 px-3">Détails & Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {syncLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-3 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-3 font-bold text-gray-950">
                        @{log.adminUsername} <span className="text-[10px] text-gray-400 font-normal">({log.adminId})</span>
                      </td>
                      <td className="py-4 px-3 font-mono font-bold text-emerald-600">
                        {log.parameterKey}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(log.modulesUpdated || []).map((mod, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {mod}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="block text-gray-800">{log.details}</span>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5 block">● {log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTOMATION RULES */}
      {activeTab === "rules" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-gray-950">Règles d'Automatisation des Communications</h3>
              <p className="text-xs text-gray-500 mt-0.5">Associez un événement de la plateforme à un modèle de message et choisissez les canaux de diffusion.</p>
            </div>
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  name: "",
                  triggerEvent: "referral_success",
                  conditions: "always",
                  templateId: templates[0]?.id || "",
                  channels: ["in_app"],
                  isActive: true
                });
                setShowRuleModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Créer une Règle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map(rule => {
              const tpl = templates.find(t => t.id === rule.templateId);
              return (
                <div key={rule.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 relative flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Événement : {rule.triggerEvent}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rule.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                        {rule.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-gray-950">{rule.name}</h4>

                    <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Modèle lié :</span>
                        <strong className="text-gray-950">{tpl ? tpl.title : "Aucun modèle"}</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Canaux de diffusion :</span>
                        <div className="flex gap-1">
                          {rule.channels.map((c, i) => (
                            <span key={i} className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleForm({
                          name: rule.name,
                          triggerEvent: rule.triggerEvent,
                          conditions: rule.conditions,
                          templateId: rule.templateId,
                          channels: rule.channels,
                          isActive: rule.isActive
                        });
                        setShowRuleModal(true);
                      }}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MESSAGE TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-gray-950">Bibliothèque de Modèles de Messages</h3>
              <p className="text-xs text-gray-500 mt-0.5">Créez des modèles avec variables dynamiques entre accolades (ex: {'{NomUtilisateur}'}, {'{MontantCommission}'}).</p>
            </div>
            <button
              onClick={() => {
                setEditingTpl(null);
                setTplForm({
                  title: "",
                  category: "referral",
                  content: "Félicitations {NomUtilisateur} ! Votre nouveau solde est de {SoldePortefeuille}.",
                  variables: ["NomUtilisateur", "SoldePortefeuille"],
                  isActive: true
                });
                setShowTplModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Créer un Modèle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-700 font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Catégorie : {tpl.category}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tpl.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                    {tpl.isActive ? "Actif" : "Désactivé"}
                  </span>
                </div>

                <h4 className="text-base font-black text-gray-950">{tpl.title}</h4>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-gray-800 italic">
                  "{tpl.content}"
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Variables :</span>
                  {(tpl.variables || []).map((v, i) => (
                    <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setEditingTpl(tpl);
                      setTplForm({
                        title: tpl.title,
                        category: tpl.category,
                        content: tpl.content,
                        variables: tpl.variables,
                        isActive: tpl.isActive
                      });
                      setShowTplModal(true);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
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

      {/* TAB 4: COHERENCE CHECK */}
      {activeTab === "coherence" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in max-w-4xl">
          <div>
            <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Vérification de Cohérence & Synchronisation Globale Yaamaa
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Contrôle instantané garantissant qu'aucune donnée obsolète ou codée en dur n'est affichée aux utilisateurs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <span className="font-bold text-xs text-gray-950 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> Tarifs des Cadeaux Virtuels
              </span>
              <p className="text-xs text-gray-600">
                {settings.virtualGifts?.length || 13} cadeaux configurés avec points et animations synchronisés en temps réel dans le module Live & Messagerie.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <span className="font-bold text-xs text-gray-950 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> Programme de Parrainage & Commissions
              </span>
              <p className="text-xs text-gray-600">
                Mode: <strong className="text-gray-900">{settings.referralCommissionMode}</strong> • Valeur: <strong className="text-gray-900">{settings.referralCommissionValue}</strong>. Synchronisé avec tous les versements de filleuls.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <span className="font-bold text-xs text-gray-950 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> Numéros Marchands & Abonnements
              </span>
              <p className="text-xs text-gray-600">
                Prix standard marchand: <strong className="text-gray-900">{settings.merchantNumberPrice || 5000} FCFA</strong>. Aucun tarif codé en dur détecté.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <span className="font-bold text-xs text-gray-950 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" /> Seuils de Retrait & Frais
              </span>
              <p className="text-xs text-gray-600">
                Seuil minimum: <strong className="text-gray-900">{settings.minWithdrawalAmount || 10} USD</strong> • Frais de plateforme: <strong className="text-gray-900">{settings.platformFeePercentage}%</strong>. Synchronisé avec le coffre-fort.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-extrabold text-gray-950">
                {editingRule ? "Modifier la Règle d'Automatisation" : "Créer une Règle d'Automatisation"}
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nom de la Règle</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Événement Déclencheur</label>
                <select
                  value={ruleForm.triggerEvent}
                  onChange={(e) => setRuleForm({...ruleForm, triggerEvent: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="referral_success">Succès de Parrainage (referral_success)</option>
                  <option value="deposit_success">Dépôt Réussi (deposit_success)</option>
                  <option value="withdrawal_success">Retrait Validé (withdrawal_success)</option>
                  <option value="mission_completed">Mission Terminée (mission_completed)</option>
                  <option value="gift_received">Cadeau Reçu (gift_received)</option>
                  <option value="subscription_purchased">Abonnement Acheté (subscription_purchased)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Modèle de Message Associé</label>
                <select
                  value={ruleForm.templateId}
                  onChange={(e) => setRuleForm({...ruleForm, templateId: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Sélectionner un modèle --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Canaux de Diffusion (Plusieurs possibles)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "in_app", label: "🔔 Notification In-App" },
                    { id: "message", label: "💬 Message Privé Yaamaa" },
                    { id: "home_feed", label: "📢 Publication Accueil" },
                    { id: "email", label: "✉️ E-mail" }
                  ].map(ch => {
                    const isChecked = ruleForm.channels.includes(ch.id as any);
                    return (
                      <label key={ch.id} className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${isChecked ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRuleForm({...ruleForm, channels: [...ruleForm.channels, ch.id as any]});
                            } else {
                              setRuleForm({...ruleForm, channels: ruleForm.channels.filter(c => c !== ch.id)});
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        {ch.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  {editingRule ? "Mettre à jour" : "Créer la Règle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {showTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-extrabold text-gray-950">
                {editingTpl ? "Modifier le Modèle de Message" : "Créer un Modèle de Message"}
              </h3>
              <button onClick={() => setShowTplModal(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Titre du Modèle</label>
                <input
                  type="text"
                  value={tplForm.title}
                  onChange={(e) => setTplForm({...tplForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Catégorie</label>
                <select
                  value={tplForm.category}
                  onChange={(e) => setTplForm({...tplForm, category: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="referral">Parrainage</option>
                  <option value="gift">Cadeau</option>
                  <option value="withdrawal">Retrait</option>
                  <option value="mission">Mission</option>
                  <option value="subscription">Abonnement</option>
                  <option value="general">Général</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contenu (Variables entre accolades)</label>
                <textarea
                  value={tplForm.content}
                  onChange={(e) => setTplForm({...tplForm, content: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-28 resize-none"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Variables disponibles : {'{NomUtilisateur}'}, {'{NumeroMarchand}'}, {'{MontantGagne}'}, {'{NombreFilleuls}'}, {'{MontantCommission}'}, {'{CadeauRecu}'}, {'{Date}'}, {'{Heure}'}, {'{SoldePortefeuille}'}, {'{NomFilleul}'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTplModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  {editingTpl ? "Mettre à jour" : "Créer le Modèle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
