import React, { useState } from "react";
import { Download, HardDrive, Github, ExternalLink, Check, X, Code2 } from "lucide-react";

interface ProjectExportModalProps {
  onClose: () => void;
}

export function ProjectExportModal({ onClose }: ProjectExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadZipInfo = () => {
    alert("Pour télécharger le code source complet de la plateforme Yaamaa et le copier sur votre clé USB :\n\n1. Cliquez sur le menu paramètres (⚙️) en haut dans AI Studio.\n2. Sélectionnez l'option d'exportation (Export to GitHub ou Export to ZIP).\n3. Décompressez le dossier ZIP sur votre ordinateur puis copiez-le sur votre clé USB !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <HardDrive className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Exporter le code pour Clé USB</h2>
              <p className="text-xs text-emerald-200 mt-0.5">Récupérez tous les fichiers sources de Yaamaa</p>
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
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
            <h3 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-emerald-700" /> Méthode officielle d'exportation
            </h3>
            <p className="text-emerald-800">
              Puisque Yaamaa s'exécute dans votre espace de travail intelligent, vous pouvez à tout moment exporter l'intégralité du code source (React, Express, Tailwind, composants) pour l'enregistrer sur votre clé USB.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                Via le menu Paramètres de l'espace de travail
              </div>
              <p className="text-gray-600 pl-8">
                Cliquez sur le menu des paramètres (icône d'engrenage ⚙️ ou menu principal) dans votre interface AI Studio, puis choisissez <b>Export Project (ZIP)</b> ou <b>Export to GitHub</b>.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                Copie sur votre clé USB
              </div>
              <p className="text-gray-600 pl-8">
                Une fois le fichier ZIP téléchargé sur votre ordinateur, extrayez-le et copiez tout le dossier contenant <code className="bg-gray-200 px-1 py-0.5 rounded">src/</code>, <code className="bg-gray-200 px-1 py-0.5 rounded">server.ts</code>, <code className="bg-gray-200 px-1 py-0.5 rounded">package.json</code>, etc., directement sur votre clé USB.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                Commandes pour lancer le projet en local (depuis la clé ou le PC)
              </div>
              <div className="pl-8 pt-1 font-mono text-[11px] bg-slate-900 text-emerald-300 p-3 rounded-xl space-y-1">
                <div>npm install</div>
                <div>npm run dev</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadZipInfo}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" /> Instructions d'export ZIP
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
