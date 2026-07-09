import React, { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Search, Filter, AlertTriangle, ShieldAlert, Info, ExternalLink, X } from "lucide-react";
import { User } from "../types";

interface NotificationCenterModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateView?: (viewName: string) => void;
}

export function NotificationCenterModal({ currentUser, onClose, onUpdateUser, onNavigateView }: NotificationCenterModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "urgent" | "important">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const notifications = currentUser.notifications || [];

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    onUpdateUser({ ...currentUser, notifications: updated });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
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
                    {notif.linkView && onNavigateView && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateView(notif.linkView);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer"
                      >
                        Voir <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
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
    </div>
  );
}
