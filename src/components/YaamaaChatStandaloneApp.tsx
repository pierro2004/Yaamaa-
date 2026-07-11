/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import YaamaaChatView from "./YaamaaChatView";
import { User } from "../types";
import { Download, Sparkles, Smartphone, Check, X, Shield, MessageSquare } from "lucide-react";
import yaamaaLogo from "../assets/images/yaamaa_logo_updated_1783116905472.jpg";

export default function YaamaaChatStandaloneApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Fetch users list to validate merchant numbers
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch(err => console.error("Failed to load users:", err));

    // Check if chat prompt is available
    const handleChatInstallAvailable = () => {
      setShowInstallPrompt(true);
    };
    window.addEventListener("chat-install-available", handleChatInstallAvailable);

    // Also check saved user from localStorage if any
    const savedUserId = localStorage.getItem("yaamaa_chat_logged_user_id");
    if (savedUserId) {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const found = data.find((u: User) => u.id === savedUserId);
            if (found) setCurrentUser(found);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("chat-install-available", handleChatInstallAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredChatPrompt || (window as any).deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          setInstallSuccess(true);
          (window as any).deferredChatPrompt = null;
          setShowInstallPrompt(false);
          setTimeout(() => setInstallSuccess(false), 3000);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Fallback installation banner
    setShowInstallPrompt(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Standalone Header Banner for Installation */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-emerald-600/30 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-white">Yaamaa Chat</span>
            <span className="hidden sm:inline text-slate-400 ml-1.5">— Application de messagerie indépendante et sécurisée</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer animate-pulse"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Installer l'App</span>
          </button>
        </div>
      </div>

      {/* Main Yaamaa Chat View */}
      <div className="flex-1 flex flex-col">
        <YaamaaChatView
          currentUser={currentUser}
          usersList={usersList}
          onBackToMain={() => {
            window.location.href = "/";
          }}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem("yaamaa_chat_logged_user_id", user.id);
          }}
          onTriggerApproval={async (merchantNumber) => {
            const res = await fetch("/api/yaamaa-chat/verify-merchant", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merchantNumber })
            });
            return await res.json();
          }}
        />
      </div>

      {/* Install Modal / Notification */}
      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <button 
              onClick={() => setShowInstallPrompt(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={yaamaaLogo}
              alt="Yaamaa Chat"
              className="h-16 w-16 rounded-2xl mx-auto mb-4 border border-emerald-500/30 object-cover shadow-lg shadow-emerald-500/20"
            />

            <h3 className="text-lg font-bold text-white mb-1">Installer Yaamaa Chat sur votre appareil</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Yaamaa Chat fonctionne comme une application autonome séparée. Ajoutez-la à votre écran d'accueil pour un accès immédiat.
            </p>

            {installSuccess ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mb-4">
                <Check className="h-4 w-4" />
                <span>Yaamaa Chat installée avec succès !</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const promptEvent = (window as any).deferredChatPrompt || (window as any).deferredPrompt;
                    if (promptEvent) {
                      promptEvent.prompt();
                      const { outcome } = await promptEvent.userChoice;
                      if (outcome === "accepted") {
                        setInstallSuccess(true);
                        setTimeout(() => setShowInstallPrompt(false), 2500);
                      }
                    } else {
                      alert("Pour installer Yaamaa Chat :\n\n- Sur Android/Chrome : Ouvrez le menu du navigateur (3 points) et choisissez 'Installer l'application'.\n- Sur iPhone/Safari : Appuyez sur le bouton Partager puis 'Sur l'écran d'accueil'.");
                    }
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  Installer Yaamaa Chat maintenant
                </button>

                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
                >
                  Continuer sur le navigateur
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
