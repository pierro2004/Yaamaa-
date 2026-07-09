import React, { useState } from "react";
import { Bell, Volume2, VolumeX, Shield, Smartphone, Music, Check, X, RotateCcw } from "lucide-react";
import { User } from "../types";
import { playYaamaaSound } from "../utils/soundEngine";

interface NotificationSettingsModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export function NotificationSettingsModal({ currentUser, onClose, onUpdateUser }: NotificationSettingsModalProps) {
  const defaultPrefs = currentUser.notificationPreferences || {
    calls: true,
    messages: true,
    gifts: true,
    payments: true,
    promotions: true,
    officialAnnouncements: true,
    groupActivity: true,
    reminders: true,
    securityAlerts: true,
    soundEnabled: true,
    soundVolume: 80,
    soundRingtoneCall: "default_ring",
    soundRingtoneMsg: "chime_ding",
    soundRingtoneGift: "sparkle_arpeggio",
    soundRingtonePayment: "cash_register",
    soundRingtoneAlert: "urgent_alarm"
  };

  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof prefs, val: any) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
  };

  const handleTestSound = (type: "call" | "message" | "gift" | "payment" | "alert" | "security") => {
    playYaamaaSound(type, prefs.soundVolume, prefs.soundEnabled);
  };

  const handleSave = () => {
    const updated = {
      ...currentUser,
      notificationPreferences: prefs
    };
    onUpdateUser(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setPrefs({
      calls: true,
      messages: true,
      gifts: true,
      payments: true,
      promotions: true,
      officialAnnouncements: true,
      groupActivity: true,
      reminders: true,
      securityAlerts: true,
      soundEnabled: true,
      soundVolume: 80,
      soundRingtoneCall: "default_ring",
      soundRingtoneMsg: "chime_ding",
      soundRingtoneGift: "sparkle_arpeggio",
      soundRingtonePayment: "cash_register",
      soundRingtoneAlert: "urgent_alarm"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Paramètres de Notifications & Sons</h2>
              <p className="text-xs text-emerald-200 mt-0.5">Personnalisez vos alertes, sonneries et préférences</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Sound & Ringtones */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-emerald-700" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Moteur de Sonneries & Sons</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={() => handleToggle("soundEnabled")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {prefs.soundEnabled && (
              <div className="space-y-4 pt-2 border-t border-emerald-200/60">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Volume des sonneries ({prefs.soundVolume}%)</span>
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={prefs.soundVolume}
                    onChange={(e) => handleChange("soundVolume", parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-xs font-semibold text-gray-800">Appels Vocaux/Vidéo</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound("call")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Tester 🎵
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-xs font-semibold text-gray-800">Messages Privés</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound("message")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Tester 🎵
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-xs font-semibold text-gray-800">Cadeaux Virtuels</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound("gift")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Tester 🎵
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-xs font-semibold text-gray-800">Paiements & Portefeuille</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound("payment")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Tester 🎵
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100 sm:col-span-2">
                    <span className="text-xs font-semibold text-gray-800">Alertes de Sécurité & Urgences</span>
                    <button
                      type="button"
                      onClick={() => handleTestSound("security")}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Tester 🎵
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Category Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Catégories de Notifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "calls", label: "Appels vocaux et vidéo", desc: "Sonneries et rappels d'appels" },
                { key: "messages", label: "Messages privés et groupes", desc: "Nouveaux messages & conversations" },
                { key: "gifts", label: "Cadeaux virtuels & points", desc: "Réception de cadeaux et bonus" },
                { key: "payments", label: "Portefeuille & Transactions", desc: "Dépôts, retraits et paiements" },
                { key: "promotions", label: "Promotions & Campagnes", desc: "Offres publicitaires et missions" },
                { key: "officialAnnouncements", label: "Annonces officielles Yaamaa", desc: "Actualités et mises à jour" },
                { key: "groupActivity", label: "Activité des groupes", desc: "Événements et réunions audio/vidéo" },
                { key: "reminders", label: "Rappels & Tâches", desc: "Alertes programmées et abonnements" },
                { key: "securityAlerts", label: "Sécurité & Appareils", desc: "Connexions suspectes et alertes admin" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900">{item.label}</h4>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(prefs as any)[item.key]}
                      onChange={() => handleToggle(item.key as any)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Réinitialiser par défaut
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {saved ? <Check className="h-4 w-4" /> : null} {saved ? "Enregistré !" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
