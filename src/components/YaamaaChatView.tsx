/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { 
  MessageSquare, 
  Shield, 
  Lock, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Key, 
  Smartphone, 
  Check, 
  HelpCircle, 
  Sparkles,
  UserCheck,
  Bell,
  RefreshCw,
  LogOut
} from "lucide-react";

interface YaamaaChatViewProps {
  currentUser: User | null;
  usersList: User[];
  onBackToMain: () => void;
  onLoginSuccess: (user: User) => void;
  onTriggerApproval: (merchantNumber: string) => Promise<any>;
}

export default function YaamaaChatView({
  currentUser,
  usersList,
  onBackToMain,
  onLoginSuccess,
  onTriggerApproval
}: YaamaaChatViewProps) {
  const [step, setStep] = useState<"login" | "waiting" | "code" | "chat" | "forgot">("login");
  const [merchantNumberInput, setMerchantNumberInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; isIncoming?: boolean }>>([
    { id: "1", sender: "Administration Yaamaa Chat", text: "Bienvenue sur l'application indépendante Yaamaa Chat. Votre canal de messagerie sécurisé par numéro marchand est actif.", time: "10:00", isIncoming: true }
  ]);
  const [messageInput, setMessageInput] = useState("");

  const handleInstallApp = () => {
    setInstallSuccess(true);
    setTimeout(() => {
      setShowInstallModal(false);
      setInstallSuccess(false);
    }, 2500);
  };

  const handleVerifyMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!merchantNumberInput.trim()) {
      setErrorMessage("Veuillez entrer votre numéro marchand.");
      return;
    }

    try {
      const res = await fetch("/api/yaamaa-chat/verify-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantNumber: merchantNumberInput.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Ce numéro marchand n'existe pas dans la base de données Yaamaa.");
        return;
      }

      setTargetUser(data.user);
      setVerificationCode(data.code || "849201");
      setStep("waiting");
      setSuccessMessage("Une notification de tentative de connexion a été envoyée dans l'application principale Yaamaa Pro associée à ce numéro marchand.");
    } catch (err) {
      setErrorMessage("Erreur de connexion au serveur Yaamaa.");
    }
  };

  const handleCheckApprovalStatus = async () => {
    if (!targetUser) return;
    try {
      const res = await fetch(`/api/yaamaa-chat/check-status?userId=${targetUser.id}&merchantNumber=${merchantNumberInput.trim()}`);
      const data = await res.json();
      if (data.approved) {
        setStep("code");
        setSuccessMessage("Connexion autorisée depuis Yaamaa Pro ! Veuillez saisir le code de sécurité reçu.");
      } else if (data.rejected) {
        setStep("login");
        setErrorMessage("La tentative de connexion a été refusée depuis Yaamaa Pro.");
      } else {
        setSuccessMessage("En attente de votre validation (Ouvrez Yaamaa Pro et cliquez sur 'OUI' dans vos notifications)...");
      }
    } catch (e) {
      setStep("code");
    }
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!enteredCode.trim()) {
      setErrorMessage("Veuillez saisir le code reçu par message dans Yaamaa Pro.");
      return;
    }

    if (targetUser) {
      onLoginSuccess(targetUser);
      setStep("chat");
    } else {
      setErrorMessage("Code invalide ou utilisateur introuvable.");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const newMsg = {
      id: "msg_" + Date.now(),
      sender: targetUser ? targetUser.name : "Marchand",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: false
    };
    setChatMessages([...chatMessages, newMsg]);
    setMessageInput("");

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: "reply_" + Date.now(),
          sender: "Administration Yaamaa Chat",
          text: "Message reçu et pris en compte par le support. Votre réclamation ou question sera traitée sous peu.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isIncoming: true
        }
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Yaamaa Chat <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Application Autonome</span>
            </h1>
            <p className="text-xs text-slate-400">Messagerie sécurisée par Numéro Marchand Yaamaa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstallModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Smartphone className="h-4 w-4" />
            Installer l'App Yaamaa Chat
          </button>

          <button
            onClick={onBackToMain}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à Yaamaa Pro
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center">
        {step === "login" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Connexion Yaamaa Chat</h2>
              <p className="text-sm text-slate-400 mt-1">
                Réservé exclusivement aux détenteurs d'un numéro marchand actif sur la plateforme principale.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyMerchant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Votre Numéro Marchand Yaamaa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={merchantNumberInput}
                    onChange={(e) => setMerchantNumberInput(e.target.value)}
                    placeholder="Ex: DIAMOND-FOUNDER-001 ou MRCH-..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm font-mono uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Retrouvez votre numéro marchand dans votre profil ou tableau de bord Yaamaa Pro.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <span>Vérifier et Se Connecter</span>
                <Send className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
              <p>Mot de passe oublié ? <button onClick={() => setStep("forgot")} className="text-emerald-400 hover:underline font-medium">Récupérer via mon numéro marchand</button></p>
            </div>
          </div>
        )}

        {step === "waiting" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/25 animate-ping" />
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30">
                <Bell className="h-8 w-8 animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Validation de Connexion Requise</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Une notification de tentative de connexion a été envoyée dans la boîte de réception de l'application principale Yaamaa pour le numéro marchand <span className="font-mono text-emerald-400 font-semibold">{merchantNumberInput}</span>.
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left mb-6 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-200">Instructions :</p>
              <p>1. Ouvrez Yaamaa Pro (Plateforme principale)</p>
              <p>2. Consultez vos notifications ou votre boîte de réception</p>
              <p>3. Cliquez sur le bouton <span className="text-emerald-400 font-bold">"OUI"</span> pour autoriser l'accès</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckApprovalStatus}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
              >
                <RefreshCw className="h-4 w-4" />
                <span>J'ai cliqué sur Oui, continuer</span>
              </button>

              <button
                onClick={() => setStep("login")}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition text-xs"
              >
                Annuler / Réessayer
              </button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
                <Key className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Code de Confirmation</h2>
              <p className="text-sm text-slate-400 mt-1">
                Entrez le code à 6 chiffres reçu dans la messagerie de votre application principale Yaamaa Pro.
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm text-center">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Code de Sécurité Yaamaa (Simulé: <span className="font-mono text-emerald-400 font-bold">{verificationCode}</span>)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="Ex: 123456"
                  className="w-full text-center tracking-widest text-2xl font-mono py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <span>Valider et Accéder à Yaamaa Chat</span>
                <Check className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {step === "forgot" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-2xl mb-3 border border-amber-500/20">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Récupération de Compte</h2>
              <p className="text-sm text-slate-400 mt-1">
                Entrez votre numéro marchand pour recevoir un rappel de vos identifiants et un lien de réinitialisation automatique.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Numéro Marchand Yaamaa
                </label>
                <input
                  type="text"
                  placeholder="Ex: DIAMOND-FOUNDER-001"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition text-sm font-mono uppercase"
                />
              </div>

              <button
                onClick={() => {
                  alert("Un message de récupération et vos nouveaux accès temporaires ont été envoyés avec succès dans l'administration Yaamaa Pro.");
                  setStep("login");
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-lg transition text-sm"
              >
                Envoyer la Demande de Récupération
              </button>

              <button
                onClick={() => setStep("login")}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        )}

        {step === "chat" && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
            {/* Chat Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={targetUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {targetUser ? targetUser.name : "Marchand Vérifié"}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      {targetUser?.merchantNumber || merchantNumberInput}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connecté et Sécurisé
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("login")}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Déconnexion
                </button>
              </div>
            </div>

            {/* Chat Body & Sidebar */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Contacts */}
              <div className="w-72 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col">
                <div className="p-4 border-b border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Canaux Yaamaa Chat</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white">Support & Administration</p>
                        <p className="text-xs text-slate-400 truncate">Canal officiel sécurisé</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 hover:bg-slate-900 rounded-xl cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-200">Alertes Administratives</p>
                        <p className="text-xs text-slate-500 truncate">Messages automatiques système</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Message Window */}
              <div className="flex-1 flex flex-col bg-slate-900/50">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isIncoming ? "items-start" : "items-end"}`}
                    >
                      <span className="text-[10px] text-slate-500 mb-1 px-1">{msg.sender} • {msg.time}</span>
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl text-sm ${
                          msg.isIncoming
                            ? "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm"
                            : "bg-emerald-600 text-white rounded-tr-sm shadow-lg shadow-emerald-600/20"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Écrivez votre message sécurisé..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Standalone Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4 border border-emerald-500/20">
              <Smartphone className="h-8 w-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Installer Yaamaa Chat</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Yaamaa Chat est conçue comme une application indépendante. Installez-la sur votre écran d'accueil (mobile ou PC) pour un accès direct et sécurisé.
            </p>

            {installSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl mb-4 text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="h-5 w-5" />
                <span>Application Yaamaa Chat installée avec succès !</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleInstallApp}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Installer sur cet appareil
                </button>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-2xl transition text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
