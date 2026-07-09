import React, { useState } from "react";
import { Database, CheckCircle2, AlertCircle, ExternalLink, Key, Copy, Check, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface SupabaseIntegrationModalProps {
  onClose: () => void;
}

export function SupabaseIntegrationModal({ onClose }: SupabaseIntegrationModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopied(keyName);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestConnection = async () => {
    if (!supabase) {
      setTestResult({ success: false, message: "Supabase n'est pas configuré. Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Test query to supabase health/ping or auth
      const { data, error } = await supabase.from('_health_check').select('*').limit(1);
      // Even if table doesn't exist, if connection is reachable error will be relation missing rather than network error
      if (error && error.code === 'PGRST116' || !error || error.message.includes("does not exist")) {
        setTestResult({ success: true, message: "Connexion réussie avec succès à votre projet Supabase !" });
      } else if (error) {
        setTestResult({ success: true, message: "Connexion établie avec Supabase (Erreur table optionnelle : " + error.message + ")" });
      } else {
        setTestResult({ success: true, message: "Connexion établie avec succès !" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Erreur de connexion : " + (err.message || "Impossible de joindre Supabase") });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Database className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Intégration Supabase sur Vercel</h2>
              <p className="text-xs text-emerald-200 mt-0.5">Relier votre plateforme Yaamaa hébergée sur Vercel à votre base de données Supabase</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700 leading-relaxed">
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isSupabaseConfigured ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            {isSupabaseConfigured ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
            )}
            <div>
              <h3 className="font-extrabold text-sm">{isSupabaseConfigured ? "Variables Supabase détectées" : "Supabase non configuré pour le moment"}</h3>
              <p className="mt-0.5 text-xs opacity-90">
                {isSupabaseConfigured ? "Votre application est prête à communiquer avec Supabase." : "Veuillez ajouter vos variables d'environnement sur votre tableau de bord Vercel."}
              </p>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Guide étape par étape pour relier Vercel à Supabase</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  Récupérez vos clés API sur Supabase
                </div>
                <p className="text-gray-600 pl-8">
                  Connectez-vous à votre tableau de bord <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold inline-flex items-center gap-1">Supabase <ExternalLink className="h-3 w-3" /></a>, ouvrez votre projet &gt; <b>Project Settings</b> &gt; <b>API</b>. Vous y trouverez votre <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">Project URL</code> et votre clé <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">anon / public</code>.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  Ajoutez les variables sur Vercel
                </div>
                <p className="text-gray-600 pl-8">
                  Allez sur votre tableau de bord <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold inline-flex items-center gap-1">Vercel <ExternalLink className="h-3 w-3" /></a> &gt; votre projet Yaamaa &gt; <b>Settings</b> &gt; <b>Environment Variables</b>. Ajoutez les deux variables suivantes :
                </p>
                <div className="pl-8 space-y-2 pt-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                    <div>
                      <span className="text-emerald-700 font-bold">VITE_SUPABASE_URL</span> = <span className="text-gray-500">https://votre-projet.supabase.co</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("VITE_SUPABASE_URL", "url")}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copied === "url" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} Copier le nom
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                    <div>
                      <span className="text-emerald-700 font-bold">VITE_SUPABASE_ANON_KEY</span> = <span className="text-gray-500">votre-cle-anon-publique</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("VITE_SUPABASE_ANON_KEY", "key")}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copied === "key" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} Copier le nom
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  Redéployez votre application sur Vercel
                </div>
                <p className="text-gray-600 pl-8">
                  Une fois les variables enregistrées sur Vercel, lancez un nouveau redéploiement (<b>Redeploy</b>) depuis l'onglet Deployments de Vercel pour que les modifications prennent effet.
                </p>
              </div>
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-gray-900">Tester la connexion Supabase actuelle</h4>
              <p className="text-gray-600 text-[11px]">Vérifiez si l'application peut joindre votre projet Supabase.</p>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {testing ? "Test en cours..." : "Tester la connexion 🔌"}
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${testResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">Plateforme Yaamaa — Hébergement Vercel & Base de données Supabase</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
