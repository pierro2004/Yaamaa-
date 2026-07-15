import React, { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Search, Filter, AlertTriangle, ShieldAlert, Info, ExternalLink, X } from "lucide-react";
import { User } from "../types";

interface NotificationCenterModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateView?: (viewName: string) => void;
  onOpenReferrals?: () => void;
  onOpenWalletSecurity?: () => void;
}

export function NotificationCenterModal({ currentUser, onClose, onUpdateUser, onNavigateView, onOpenReferrals, onOpenWalletSecurity }: NotificationCenterModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "urgent" | "important">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<any>(null);

  const notifications = currentUser.notifications || [];

  const handleViewNotification = (notif: any) => {
    if (!notif.read) {
      const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
      onUpdateUser({ ...currentUser, notifications: updated });
    }
    onClose();

    const text = (notif.title + " " + notif.desc).toLowerCase();

    // Check specific actionable keywords
    if (text.includes("double authentification") || text.includes("2fa") || text.includes("sécuriser votre solde") || text.includes("sécurité")) {
      if (onOpenWalletSecurity) {
        onOpenWalletSecurity();
      } else if (onNavigateView) {
        onNavigateView("wallet");
      }
      return;
    }

    if (text.includes("filleul") || text.includes("parrainage") || text.includes("abonnement") && (text.includes("gagné") || text.includes("effectué"))) {
      if (onOpenReferrals) {
        onOpenReferrals();
      } else if (onNavigateView) {
        onNavigateView("wallet");
      }
      return;
    }

    let targetView = notif.linkView;
    if (!targetView && notif.metadata && notif.metadata.linkView) {
      targetView = notif.metadata.linkView;
    }

    if (!targetView) {
      if (text.includes("retrait") || text.includes("xof") || text.includes("solde") || text.includes("wallet") || text.includes("bancaire") || text.includes("paiement")) {
        targetView = "wallet";
      } else if (text.includes("mission") || text.includes("abonnement") || text.includes("tâche") || text.includes("youtube") || text.includes("récompense")) {
        targetView = "missions";
      } else if (text.includes("produit") || text.includes("boutique") || text.includes("achat") || text.includes("commande")) {
        targetView = "boutique";
      } else if (text.includes("message") || text.includes("appel") || text.includes("ami") || text.includes("publication") || text.includes("social") || text.includes("commentaires")) {
        targetView = "social";
      } else {
        targetView = "dashboard";
      }
    }

    if (onNavigateView) {
      onNavigateView(targetView);
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    onUpdateUser({ ...currentUser, notifications: updated });
  };

  const handleRespondYaamaaChat = async (notifId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/yaamaa-chat/respond-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, approved })
      });
      const data = await res.json();
      if (data.success) {
        // update notification read status and add new message to inbox
        const updated = notifications.map(n => n.id === notifId ? {
          ...n,
          read: true,
          desc: approved ? "✅ Tentative de connexion autorisée. Code de sécurité généré dans votre boîte de réception." : "❌ Tentative de connexion refusée."
        } : n);
        onUpdateUser({ 
          ...currentUser, 
          notifications: updated 
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    onUpdateUser({ ...currentUser, notifications: updated });
  };

  const handleDelete = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    onUpdateUser({ ...currentUser, notifications: updated });
  };

  const handleClearAll = () => {
    onUpdateUser({ ...currentUser, notifications: [] });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === "unread" && n.read) return false;
    if (filterTab === "urgent" && n.priority !== "urgent" && n.priority !== "critical") return false;
    if (filterTab === "important" && n.priority !== "important") return false;
    
    if (selectedCategory !== "all" && n.category !== selectedCategory) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Centre de Notifications Yaamaa</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                {unreadCount} notification(s) non lue(s) sur un total de {notifications.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 bg-emerald-600/40 hover:bg-emerald-600/60 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="h-4 w-4" /> Tout marquer lu
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${filterTab === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${filterTab === "unread" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("urgent")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${filterTab === "urgent" ? "bg-rose-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              Urgentes / Critiques
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("important")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${filterTab === "important" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              Importantes
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une alerte..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                title="Supprimer toutes les notifications"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-50">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif: any) => {
              const priority = notif.priority || "standard";
              const isUrgent = priority === "urgent" || priority === "critical";
              const isImportant = priority === "important";

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    notif.read ? "bg-white border-gray-100 opacity-80" : "bg-emerald-50/30 border-emerald-200 shadow-xs font-medium"
                  } ${isUrgent ? "border-l-4 border-l-rose-500 bg-rose-50/20" : isImportant ? "border-l-4 border-l-amber-500" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isUrgent ? "bg-rose-100 text-rose-600" : isImportant ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                      {isUrgent ? <ShieldAlert className="h-5 w-5" /> : isImportant ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-gray-900">{notif.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          priority === "critical" ? "bg-rose-600 text-white" :
                          priority === "urgent" ? "bg-rose-100 text-rose-700" :
                          priority === "important" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {priority}
                        </span>
                        {notif.category && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            {notif.category}
                          </span>
                        )}
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.desc}</p>
                      <span className="text-[10px] text-gray-400 font-mono mt-1.5 block">{notif.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {notif.title.includes("Yaamaa Chat") && !notif.read ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespondYaamaaChat(notif.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> OUI
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondYaamaaChat(notif.id, false)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> NON
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleViewNotification(notif)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition shadow cursor-pointer"
                          title="Accéder directement à l'action ou au contenu concerné"
                        >
                          Voir <ExternalLink className="h-3 w-3" />
                        </button>
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 transition cursor-pointer"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-gray-400 text-xs">
              <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              Aucune notification ne correspond à vos filtres.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Plateforme Intelligente Yaamaa — Notifications en temps réel</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* NOTIFICATION DETAILS MODAL (FULL INFO WHEN CLICKING VOIR) */}
      {selectedNotifDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">{selectedNotifDetail.title}</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedNotifDetail.time}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotifDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  selectedNotifDetail.priority === "critical" ? "bg-rose-600 text-white" :
                  selectedNotifDetail.priority === "urgent" ? "bg-rose-100 text-rose-700" :
                  selectedNotifDetail.priority === "important" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  Priorité : {selectedNotifDetail.priority || "Standard"}
                </span>
                {selectedNotifDetail.category && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    Catégorie : {selectedNotifDetail.category}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Détails de l'événement & gains</h4>
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedNotifDetail.desc}</p>
              </div>

              {selectedNotifDetail.metadata && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 font-mono text-xs space-y-1">
                  <p className="text-emerald-400 font-bold">Données techniques / Source :</p>
                  <pre className="overflow-x-auto text-[11px] text-gray-300">{JSON.stringify(selectedNotifDetail.metadata, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  let targetView = selectedNotifDetail.linkView;
                  if (!targetView && selectedNotifDetail.metadata && selectedNotifDetail.metadata.linkView) {
                    targetView = selectedNotifDetail.metadata.linkView;
                  }
                  if (!targetView) {
                    const lower = (selectedNotifDetail.title + " " + selectedNotifDetail.desc).toLowerCase();
                    if (lower.includes("retrait") || lower.includes("xof") || lower.includes("solde") || lower.includes("wallet") || lower.includes("bancaire") || lower.includes("paiement")) {
                      targetView = "wallet";
                    } else if (lower.includes("mission") || lower.includes("abonnement") || lower.includes("tâche") || lower.includes("youtube") || lower.includes("récompense")) {
                      targetView = "missions";
                    } else if (lower.includes("produit") || lower.includes("boutique") || lower.includes("achat") || lower.includes("commande")) {
                      targetView = "boutique";
                    } else if (lower.includes("message") || lower.includes("appel") || lower.includes("ami") || lower.includes("publication") || lower.includes("social") || lower.includes("commentaires")) {
                      targetView = "social";
                    } else {
                      targetView = "dashboard";
                    }
                  }
                  setSelectedNotifDetail(null);
                  onClose();
                  if (onNavigateView) {
                    onNavigateView(targetView);
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Aller à la source / Voir la section <ExternalLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotifDetail(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
