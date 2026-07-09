import React, { useState, useEffect } from "react";
import { 
  Shield, CheckCircle2, XCircle, AlertTriangle, Clock, Search, Filter, 
  FileText, User, MessageSquare, ArrowRight, Eye, RefreshCw, Send, 
  Lock, Check, AlertCircle, Building, Truck, Key, Award, Layers
} from "lucide-react";
import { User as UserType, ModerationFile, ModerationCategory, ModerationStatus, ModerationUrgency } from "../types";

interface ModerationCenterModalProps {
  currentUser: UserType;
  onClose: () => void;
}

export const ModerationCenterModal: React.FC<ModerationCenterModalProps> = ({
  currentUser,
  onClose
}) => {
  const [files, setFiles] = useState<ModerationFile[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
    urgent: 0,
    flagged: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<ModerationFile | null>(null);
  const [internalCommentText, setInternalCommentText] = useState<string>("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchModerationData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/moderation/files?userId=${currentUser.id}&category=${selectedCategory}&status=${selectedStatus}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setStats(data.stats);
        setCategories(data.categories);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Accès refusé.");
      }
    } catch (err) {
      console.error("Error fetching moderation files:", err);
      setErrorMsg("Erreur réseau lors du chargement du centre de modération.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const handleAction = async (fileId: string, action: string, extraData?: any) => {
    try {
      const res = await fetch(`/api/moderation/files/${fileId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: currentUser.id,
          action,
          ...extraData
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        if (selectedFile && selectedFile.id === fileId) {
          setSelectedFile(data.file);
        }
        fetchModerationData();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'action.");
      }
    } catch (err) {
      console.error("Error executing moderation action:", err);
    }
  };

  const handleAddInternalComment = (fileId: string) => {
    if (!internalCommentText.trim()) return;
    handleAction(fileId, "update_status", { comment: internalCommentText });
    setInternalCommentText("");
  };

  const getCategoryIcon = (cat: ModerationCategory) => {
    switch (cat) {
      case "supplier": return <Building className="w-4 h-4 text-emerald-400" />;
      case "deliverer": return <Truck className="w-4 h-4 text-teal-400" />;
      case "api_integration": return <Key className="w-4 h-4 text-indigo-400" />;
      case "account_verification": return <Award className="w-4 h-4 text-amber-400" />;
      default: return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const getCategoryLabel = (cat: ModerationCategory) => {
    switch (cat) {
      case "supplier": return "Fournisseur";
      case "deliverer": return "Livreur";
      case "api_integration": return "Intégration API";
      case "account_verification": return "Vérification Compte";
      default: return "Autre Validation";
    }
  };

  const getStatusBadge = (st: ModerationStatus) => {
    switch (st) {
      case "pending":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold">En attente</span>;
      case "under_review":
        return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full text-xs font-bold">En cours d'examen</span>;
      case "more_info_requested":
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Infos demandées</span>;
      case "approved":
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Approuvé</span>;
      case "rejected":
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Refusé</span>;
      case "suspended":
        return <span className="bg-gray-700 text-gray-300 border border-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">Suspendu</span>;
    }
  };

  if (currentUser.role !== "admin" && currentUser.role !== "founder") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-fade-in font-sans">
        <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 text-center text-white space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">Accès Restreint</h3>
          <p className="text-xs text-gray-400">
            Le Centre de modération et de validation est exclusivement réservé aux administrateurs autorisés par le Fondateur.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in font-sans">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[92vh] max-h-[900px] text-white">
        
        {/* HEADER */}
        <div className="bg-gray-900/90 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Centre de Modération & Validation — Yaamaa
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Sécurisé RBAC
                </span>
              </h2>
              <p className="text-xs text-gray-400">Examen, validation et traçabilité rigoureuse des candidatures et intégrations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchModerationData}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="bg-gray-950/60 border-b border-gray-800 px-6 py-3 grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">En Attente</span>
              <p className="text-lg font-black text-amber-400">{stats.totalPending}</p>
            </div>
            <Clock className="w-5 h-5 text-amber-500/60" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approuvés</span>
              <p className="text-lg font-black text-emerald-400">{stats.approved}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refusés</span>
              <p className="text-lg font-black text-rose-400">{stats.rejected}</p>
            </div>
            <XCircle className="w-5 h-5 text-rose-500/60" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">En Examen</span>
              <p className="text-lg font-black text-indigo-400">{stats.underReview}</p>
            </div>
            <Eye className="w-5 h-5 text-indigo-500/60" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Urgents</span>
              <p className="text-lg font-black text-amber-500">{stats.urgent}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500/60" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Signalés</span>
              <p className="text-lg font-black text-blue-400">{stats.flagged}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-blue-500/60" />
          </div>
        </div>

        {/* BODY & SPLIT VIEW */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-950">
          
          {/* LEFT LIST / FILTERS */}
          <div className={`w-full ${selectedFile ? 'hidden md:flex md:w-5/12' : 'flex'} flex-col border-r border-gray-800`}>
            
            {/* SEARCH & FILTERS */}
            <div className="p-4 border-b border-gray-800 space-y-3 bg-gray-900/40">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou demandeur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: "all", label: "Tous" },
                  { id: "supplier", label: "Fournisseurs" },
                  { id: "deliverer", label: "Livreurs" },
                  { id: "api_integration", label: "API" },
                  { id: "account_verification", label: "Comptes" },
                  { id: "other", label: "Autres" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === cat.id 
                        ? 'bg-emerald-600 text-white shadow' 
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>Dossiers trouvés : <strong className="text-white">{files.length}</strong></span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="under_review">En examen</option>
                  <option value="more_info_requested">Infos demandées</option>
                  <option value="approved">Approuvés</option>
                  <option value="rejected">Refusés</option>
                  <option value="suspended">Suspendus</option>
                </select>
              </div>
            </div>

            {/* LIST OF FILES */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800/80">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`p-4 hover:bg-gray-900/60 transition cursor-pointer flex flex-col gap-2 ${
                    selectedFile?.id === file.id ? 'bg-emerald-600/10 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-gray-400">{file.id} • {getCategoryLabel(file.category)}</span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{file.title}</h4>
                      </div>
                    </div>
                    {getStatusBadge(file.status)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <img src={file.applicantAvatar} alt={file.applicantName} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs text-gray-300 font-medium">@{file.applicantUsername}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {files.length === 0 && !loading && (
                <div className="p-12 text-center text-gray-500 text-xs">
                  Aucun dossier trouvé pour ces critères.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT DETAIL VIEW */}
          <div className={`flex-1 ${!selectedFile ? 'hidden md:flex' : 'flex'} flex-col bg-gray-950 overflow-y-auto`}>
            {selectedFile ? (
              <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
                
                {/* DETAIL TOP HEADER */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                        {selectedFile.id}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase">{getCategoryLabel(selectedFile.category)}</span>
                      {selectedFile.urgency === "urgent" && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">⚠️ Urgent</span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{selectedFile.title}</h3>
                    <p className="text-xs text-gray-400">Créé le {new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedFile.status)}
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="md:hidden px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-xl"
                    >
                      Retour
                    </button>
                  </div>
                </div>

                {/* APPLICANT INFO & DOCUMENTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* APPLICANT CARD */}
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" /> Informations du Demandeur
                    </h4>
                    
                    <div className="flex items-center gap-3">
                      <img src={selectedFile.applicantAvatar} alt={selectedFile.applicantName} className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/30" />
                      <div>
                        <h5 className="text-sm font-bold text-white">{selectedFile.applicantName}</h5>
                        <p className="text-xs text-emerald-400 font-medium">@{selectedFile.applicantUsername}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-800 text-xs">
                      {Object.entries(selectedFile.applicantInfo).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')} :</span>
                          <span className="font-bold text-white">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DOCUMENTS CARD */}
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-400" /> Pièces Justificatives ({selectedFile.supportingDocuments.length})
                    </h4>

                    <div className="space-y-2">
                      {selectedFile.supportingDocuments.map((doc, idx) => (
                        <div key={idx} className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate">{doc.title}</span>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition shrink-0"
                          >
                            Consulter ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* MODERATION ACTIONS PANEL */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" /> Outils de Décision & Modération
                  </h4>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAction(selectedFile.id, "approve")}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approuver le dossier
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Refuser...
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const note = prompt("Précisez les informations complémentaires souhaitées :");
                        if (note) handleAction(selectedFile.id, "request_info", { comment: note });
                      }}
                      className="px-4 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      Demander des corrections
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction(selectedFile.id, "update_status", { status: "under_review" })}
                      className="px-4 py-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Marquer en examen
                    </button>
                  </div>

                  {/* REJECTION REASON MODAL / FORM PROMPT */}
                  {showRejectModal && (
                    <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl space-y-3 mt-4">
                      <h5 className="text-xs font-bold text-rose-300">Motif du Refus (transmis au demandeur) :</h5>
                      <textarea
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="Expliquez clairement le motif du refus..."
                        className="w-full bg-gray-900 border border-rose-500/50 rounded-xl p-3 text-xs text-white"
                        rows={2}
                      ></textarea>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectModal(false)}
                          className="px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-xl"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleAction(selectedFile.id, "reject", { rejectionReason: rejectionReasonInput });
                            setShowRejectModal(false);
                            setRejectionReasonInput("");
                          }}
                          className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
                        >
                          Confirmer le Refus
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* INTERNAL COMMENTS & TIMELINE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* INTERNAL NOTES */}
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Notes Internes & Commentaires
                      </h4>

                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedFile.internalComments.map(comm => (
                          <div key={comm.id} className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-2xl space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-400">@{comm.adminUsername}</span>
                              <span className="text-gray-500 font-mono">{new Date(comm.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-gray-200">{comm.text}</p>
                          </div>
                        ))}
                        {selectedFile.internalComments.length === 0 && (
                          <p className="text-xs text-gray-500 italic">Aucune note interne pour l'instant.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                      <input
                        type="text"
                        placeholder="Ajouter une note interne..."
                        value={internalCommentText}
                        onChange={(e) => setInternalCommentText(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddInternalComment(selectedFile.id)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ACTION HISTORY LOG */}
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" /> Historique d'Audit & Actions
                    </h4>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedFile.actionHistory.map(act => (
                        <div key={act.id} className="border-l-2 border-emerald-500/50 pl-3 py-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-white">@{act.adminUsername} ({act.action})</span>
                            <span className="text-gray-500 font-mono">{new Date(act.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-300">
                            Statut : <span className="font-mono text-amber-400">{act.oldStatus}</span> ➔ <span className="font-mono text-emerald-400">{act.newStatus}</span>
                          </p>
                          {act.comment && <p className="text-[11px] text-gray-400 italic">"{act.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600 shadow-inner">
                  <Shield className="w-8 h-8 animate-pulse text-emerald-500/50" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="text-base font-bold text-white">Sélectionnez un dossier à examiner</h3>
                  <p className="text-xs text-gray-400">
                    Consultez l'intégralité des pièces, ajoutez des notes internes et validez ou refusez les demandes en un clic.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
