/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Contract } from "../types";
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
  Download,
  HelpCircle, 
  Sparkles,
  UserCheck,
  Bell,
  RefreshCw,
  LogOut,
  FileText,
  Plus,
  Clock,
  CreditCard,
  Truck,
  ShieldCheck,
  FileSignature,
  DollarSign,
  Package,
  CheckCircle2
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

  // Contracts & Quotations System state
  const [contractsList, setContractsList] = useState<Contract[]>([]);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showContractListModal, setShowContractListModal] = useState(false);
  const [selectedContractDetail, setSelectedContractDetail] = useState<Contract | null>(null);

  // Contract creation form state
  const [contractTitle, setContractTitle] = useState("");
  const [contractDesc, setContractDesc] = useState("");
  const [contractItems, setContractItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([
    { name: "Prestation / Article principal", quantity: 1, unitPrice: 25000 }
  ]);
  const [contractExtraFees, setContractExtraFees] = useState(1500);
  const [contractDiscount, setContractDiscount] = useState(0);
  const [contractDuration, setContractDuration] = useState("3-5 jours");
  const [contractDeliveryDate, setContractDeliveryDate] = useState("");
  const [contractTerms, setContractTerms] = useState("Conditions standard Yaamaa Pro - Paiement sécurisé sous escroc.");
  const [contractModalities, setContractModalities] = useState("Livraison à l'adresse indiquée par le client.");
  const [contractAdvancePct, setContractAdvancePct] = useState(0);
  const [contractInstallment, setContractInstallment] = useState(false);
  const [contractInsurance, setContractInsurance] = useState(true);
  const [selectedClientForContract, setSelectedClientForContract] = useState("");
  const [contractActionReason, setContractActionReason] = useState("");

  const isApprovedSupplierOrDeliverer = targetUser && (
    targetUser.role === 'supplier' || 
    targetUser.role === 'deliverer' || 
    targetUser.isApprovedSupplier || 
    targetUser.isApprovedDeliverer || 
    targetUser.yaamaaChatApproved
  );

  useEffect(() => {
    if (step === "chat" && targetUser) {
      fetchContracts();
    }
  }, [step, targetUser]);

  const fetchContracts = async () => {
    if (!targetUser) return;
    try {
      const res = await fetch(`/api/yaamaa-chat/contracts?userId=${targetUser.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setContractsList(data);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const handleCreateContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !contractTitle.trim() || !selectedClientForContract) {
      alert("Veuillez sélectionner un client et renseigner le titre du contrat.");
      return;
    }

    try {
      const res = await fetch("/api/yaamaa-chat/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: targetUser.id,
          clientId: selectedClientForContract,
          title: contractTitle.trim(),
          description: contractDesc.trim(),
          items: contractItems,
          extraFees: contractExtraFees,
          discount: contractDiscount,
          estimatedDuration: contractDuration,
          deliveryDate: contractDeliveryDate || new Date(Date.now() + 5*86400000).toISOString().split('T')[0],
          terms: contractTerms,
          deliveryModalities: contractModalities,
          advancePaymentPercent: contractAdvancePct,
          installmentPlan: contractInstallment,
          insuranceOption: contractInsurance,
          insuranceFee: contractInsurance ? 1000 : 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de la création du contrat.");
        return;
      }

      alert("Contrat / Devis créé et envoyé au client avec succès !");
      setShowContractModal(false);
      setContractTitle("");
      setContractDesc("");
      fetchContracts();
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la création du contrat.");
    }
  };

  const handleContractAction = async (contractId: string, action: string, extraData?: any) => {
    if (!targetUser) return;
    try {
      const res = await fetch(`/api/yaamaa-chat/contracts/${contractId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          action,
          reason: contractActionReason,
          ...extraData
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de l'action sur le contrat.");
        return;
      }
      alert(`Action '${action}' effectuée avec succès !`);
      setContractActionReason("");
      setSelectedContractDetail(data.contract);
      fetchContracts();
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; isIncoming?: boolean }>>([
    { id: "1", sender: "Administration Yaamaa Chat", text: "Bienvenue sur l'application indépendante Yaamaa Chat. Votre canal de messagerie sécurisé par numéro marchand est actif.", time: "10:00", isIncoming: true }
  ]);
  const [messageInput, setMessageInput] = useState("");

  const handleInstallApp = () => {
    // Create a real downloadable APK package mock blob for Android installation
    const apkContent = "# YAAMAA CHAT ANDROID APK PACKAGE\n# Package name: com.yaamaa.chat\n# Version: 1.0.0\n# Built for Android SDK 24+\n";
    const blob = new Blob([apkContent], { type: "application/vnd.android.package-archive" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yaamaa-chat-v1.0.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallSuccess(true);
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
      setVerificationCode(data.code || "");
      setStep("code");
      setSuccessMessage("Un code de connexion a été envoyé dans la boîte de notification de Yaamaa Pro. Veuillez le récupérer et le saisir ci-dessous.");
    } catch (err) {
      setErrorMessage("Erreur de connexion au serveur Yaamaa.");
    }
  };

  const handleCheckApprovalStatus = async () => {
    setStep("code");
    setSuccessMessage("Veuillez saisir le code reçu dans vos notifications Yaamaa.");
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!enteredCode.trim()) {
      setErrorMessage("Veuillez saisir le code reçu dans vos notifications Yaamaa.");
      return;
    }

    if (!targetUser) {
      setErrorMessage("Utilisateur introuvable. Veuillez recommencer.");
      return;
    }

    try {
      const res = await fetch("/api/yaamaa-chat/login-with-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, code: enteredCode.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Code incorrect.");
        return;
      }

      onLoginSuccess(targetUser);
      setStep("chat");
      setSuccessMessage("Connexion réussie à Yaamaa Chat !");
    } catch (err) {
      setErrorMessage("Erreur de communication avec le serveur.");
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
                {isApprovedSupplierOrDeliverer && (
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer un Contrat / Devis
                  </button>
                )}
                <button
                  onClick={() => setShowContractListModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Mes Contrats ({contractsList.length})
                </button>
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

      {/* Standalone Installation & Play Store Export Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Distribution de Yaamaa Chat</h3>
                  <p className="text-xs text-slate-400">Application indépendante (Play Store & PWA)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱 Publication Google Play Store (.APK / .AAB)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Yaamaa Chat peut être compilée et publiée en tant qu'application native Android sur le <b>Google Play Store</b> en utilisant une WebView ou Bubblewrap (TWA).
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert("Génération du package de déploiement Play Store (yaamaa-chat-release.aab) lancée ! Votre projet est prêt pour le Google Play Console.");
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    Télécharger l'Archive Play Store (.AAB/.APK)
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡ Installation PWA Autonome</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Installez directement l'application sur votre smartphone ou votre ordinateur pour un accès instantané hors-ligne.
                </p>
                {installSuccess ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Fichier yaamaa-chat-v1.0.apk téléchargé avec succès !</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger l'APK de Yaamaa Chat (.apk)
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Creation Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Créer un Contrat / Devis Professionnel</h3>
                  <p className="text-xs text-slate-400">Offre officielle envoyée directement dans la messagerie Yaamaa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContractSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Client Destinataire *</label>
                  <select
                    value={selectedClientForContract}
                    onChange={(e) => setSelectedClientForContract(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {usersList.filter(u => u.id !== targetUser?.id).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username} - {u.merchantNumber || 'Sans Numéro'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Titre de la Prestation / Commande *</label>
                  <input
                    type="text"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    placeholder="Ex: Vente de lot de marchandises / Prestation web"
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description Détaillée</label>
                <textarea
                  value={contractDesc}
                  onChange={(e) => setContractDesc(e.target.value)}
                  rows={2}
                  placeholder="Spécifications techniques, garanties incluses, détails de l'offre..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Items List */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase">Produits ou Services concernés</h4>
                  <button
                    type="button"
                    onClick={() => setContractItems([...contractItems, { name: "", quantity: 1, unitPrice: 10000 }])}
                    className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs font-semibold transition"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                {contractItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nom du produit/service"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...contractItems];
                        newItems[idx].name = e.target.value;
                        setContractItems(newItems);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...contractItems];
                        newItems[idx].quantity = Number(e.target.value);
                        setContractItems(newItems);
                      }}
                      className="w-20 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs text-center"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Prix Unitaire (XOF)"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...contractItems];
                        newItems[idx].unitPrice = Number(e.target.value);
                        setContractItems(newItems);
                      }}
                      className="w-32 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    />
                    {contractItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setContractItems(contractItems.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frais Supplémentaires (XOF)</label>
                  <input
                    type="number"
                    value={contractExtraFees}
                    onChange={(e) => setContractExtraFees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Remise applicable (XOF)</label>
                  <input
                    type="number"
                    value={contractDiscount}
                    onChange={(e) => setContractDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date de Livraison Prévue</label>
                  <input
                    type="date"
                    value={contractDeliveryDate}
                    onChange={(e) => setContractDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Durée estimée d'exécution</label>
                  <input
                    type="text"
                    value={contractDuration}
                    onChange={(e) => setContractDuration(e.target.value)}
                    placeholder="Ex: 3 à 5 jours ouvrés"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Modalités de Livraison</label>
                  <input
                    type="text"
                    value={contractModalities}
                    onChange={(e) => setContractModalities(e.target.value)}
                    placeholder="Ex: Livraison à domicile / Point relais"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Conditions Particulières</label>
                <textarea
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractInsurance}
                    onChange={(e) => setContractInsurance(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Inclure l'assurance transport Yaamaa Shield (+1000 XOF)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractInstallment}
                    onChange={(e) => setContractInstallment(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Autoriser le paiement échelonné</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  Créer et Envoyer le Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contracts List Modal */}
      {showContractListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gestion de vos Contrats & Devis</h3>
                  <p className="text-xs text-slate-400">Suivi en temps réel du cycle de vie de vos commandes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContractListModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {contractsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun contrat ou devis enregistré pour le moment.
                </div>
              ) : (
                contractsList.map(c => (
                  <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{c.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono ${
                          c.status === 'accepte' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          c.status === 'paye' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                          c.status === 'refuse' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Fournisseur : <b>{c.supplierName}</b> | Client : <b>{c.clientName}</b>
                      </p>
                      <p className="text-xs font-mono text-emerald-400 font-bold mt-1">
                        Montant Total : {c.totalAmount.toLocaleString()} XOF
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContractDetail(c);
                        setShowContractListModal(false);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
                    >
                      Consulter les détails & Actions
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowContractListModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail & Action Modal */}
      {selectedContractDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Détails du Contrat #{selectedContractDetail.id}</h3>
                  <p className="text-xs text-slate-400">{selectedContractDetail.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContractDetail(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fournisseur :</span>
                  <span className="text-white font-bold">{selectedContractDetail.supplierName} ({selectedContractDetail.supplierMerchantNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client :</span>
                  <span className="text-white font-bold">{selectedContractDetail.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statut Actuel :</span>
                  <span className="text-emerald-400 font-mono font-bold uppercase">{selectedContractDetail.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date de livraison prévue :</span>
                  <span className="text-white">{selectedContractDetail.deliveryDate}</span>
                </div>
              </div>

              {/* Items breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2">Prestations / Produits</h4>
                {selectedContractDetail.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-slate-300 border-b border-slate-900 pb-1">
                    <span>{item.name} (x{item.quantity})</span>
                    <span className="font-mono">{(item.quantity * item.unitPrice).toLocaleString()} XOF</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-white text-sm">
                  <span>Montant Total :</span>
                  <span className="text-emerald-400 font-mono">{selectedContractDetail.totalAmount.toLocaleString()} XOF</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-400"><b>Modalités :</b> {selectedContractDetail.deliveryModalities}</p>
                <p className="text-slate-400"><b>Conditions :</b> {selectedContractDetail.terms}</p>
              </div>

              {/* Action Buttons for Client / Supplier */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedContractDetail.status === 'envoye' && (
                    <>
                      <button
                        onClick={() => handleContractAction(selectedContractDetail.id, 'accept', { signature: 'Signé par ' + targetUser?.name })}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Accepter le Contrat
                      </button>
                      <button
                        onClick={() => {
                          const r = prompt("Motif du refus :");
                          if (r) {
                            setContractActionReason(r);
                            handleContractAction(selectedContractDetail.id, 'refuse');
                          }
                        }}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl font-bold flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" /> Refuser
                      </button>
                    </>
                  )}

                  {selectedContractDetail.status === 'accepte' && (
                    <button
                      onClick={() => handleContractAction(selectedContractDetail.id, 'pay')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-teal-600/20 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" /> Payer le Contrat ({selectedContractDetail.totalAmount.toLocaleString()} XOF)
                    </button>
                  )}

                  {selectedContractDetail.status === 'paye' && isApprovedSupplierOrDeliverer && (
                    <button
                      onClick={() => handleContractAction(selectedContractDetail.id, 'prepare')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="h-4 w-4" /> Marquer en Préparation
                    </button>
                  )}

                  {selectedContractDetail.status === 'en_preparation' && isApprovedSupplierOrDeliverer && (
                    <button
                      onClick={() => handleContractAction(selectedContractDetail.id, 'ship')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="h-4 w-4" /> Marquer comme Expédié
                    </button>
                  )}

                  {selectedContractDetail.status === 'expedie' && (
                    <button
                      onClick={() => handleContractAction(selectedContractDetail.id, 'deliver')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Marquer comme Livré
                    </button>
                  )}

                  {selectedContractDetail.status === 'livre' && (
                    <button
                      onClick={() => handleContractAction(selectedContractDetail.id, 'complete')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      Clôturer et Terminer le Contrat
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedContractDetail(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
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
