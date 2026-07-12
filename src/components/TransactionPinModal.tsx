import React, { useState } from "react";
import { ShieldCheck, Lock, KeyRound, Fingerprint, AlertTriangle, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { User } from "../types";

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
  operationTitle?: string;
  operationDescription?: string;
  syncPlatformData?: () => void;
}

export default function TransactionPinModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  operationTitle = "Validation de l'Opération Financière",
  operationDescription = "Veuillez entrer votre Code PIN de transaction Yaamaa (4 à 8 chiffres) pour autoriser cette opération.",
  syncPlatformData
}: TransactionPinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"verify" | "create" | "recover">(currentUser?.transactionPinHash ? "verify" : "create");
  
  // Create PIN state
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Recover state
  const [recoverMethod, setRecoverMethod] = useState<"merchant_number" | "email">("merchant_number");
  const [recoverIdentifier, setRecoverIdentifier] = useState("");
  const [recoverCode, setRecoverCode] = useState("");
  const [recoverStep, setRecoverStep] = useState<"request" | "verify">("request");
  const [recoverSuccessMsg, setRecoverSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasPinSet = !!currentUser?.transactionPinHash;

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError("Veuillez entrer un code PIN valide (au moins 4 chiffres).");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requirePinSetup) {
          setMode("create");
          setError("Veuillez d'abord configurer votre Code PIN de transaction.");
        } else {
          setError(data.error || "Code PIN incorrect.");
        }
        setLoading(false);
        return;
      }

      if (syncPlatformData) syncPlatformData();
      setLoading(false);
      setPin("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
      setLoading(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setError("Les codes PIN ne correspondent pas.");
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      setError("Le Code PIN doit contenir entre 4 et 8 chiffres.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, pin: newPin, confirmPin })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création du PIN.");
        setLoading(false);
        return;
      }

      if (syncPlatformData) syncPlatformData();
      setLoading(false);
      setNewPin("");
      setConfirmPin("");
      setMode("verify");
      setError(null);
      // Auto verify or let user enter
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
      setLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverIdentifier) {
      setError("Veuillez saisir votre identifiant (Numéro marchand ou e-mail).");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pin/recover/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: recoverIdentifier, method: recoverMethod })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la demande de récupération.");
        setLoading(false);
        return;
      }
      setRecoverSuccessMsg(data.message || "Code de réinitialisation généré et envoyé dans vos notifications / chat Yaamaa.");
      setRecoverStep("verify");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverCode || !newPin || newPin !== confirmPin) {
      setError("Veuillez entrer le code de vérification et confirmer le nouveau PIN.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/pin/recover/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: recoverIdentifier,
          method: recoverMethod,
          code: recoverCode,
          newPin,
          confirmNewPin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code de récupération invalide ou expiré.");
        setLoading(false);
        return;
      }

      if (syncPlatformData) syncPlatformData();
      setLoading(false);
      setRecoverSuccessMsg("Votre PIN a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => {
        setMode("verify");
        setRecoverStep("request");
        setRecoverSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erreur réseau.");
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError(null);
    // Simulate biometric scan success
    setTimeout(() => {
      setLoading(false);
      if (syncPlatformData) syncPlatformData();
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-150 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
            id="btn_close_pin_modal"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black font-heading tracking-tight">{operationTitle}</h3>
          <p className="text-xs text-indigo-200 mt-1 max-w-xs mx-auto">{operationDescription}</p>
        </div>

        {/* Content body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {recoverSuccessMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{recoverSuccessMsg}</span>
            </div>
          )}

          {/* MODE: VERIFY PIN */}
          {mode === "verify" && hasPinSet && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-indigo-600" />
                  Code PIN de Transaction (4 à 8 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  autoFocus
                />
              </div>

              {currentUser.biometricEnabled && (
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition cursor-pointer"
                  id="btn_biometric_auth"
                >
                  <Fingerprint className="h-4 w-4 text-indigo-600 animate-pulse" />
                  Utiliser la biométrie (Empreinte / Face ID)
                </button>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode("recover")}
                  className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  id="btn_forgot_pin"
                >
                  Code PIN oublié ? Récupération
                </button>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                  id="btn_change_pin_prompt"
                >
                  Modifier mon PIN
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !pin}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  id="btn_submit_pin_verify"
                >
                  {loading ? "Vérification..." : "Valider l'opération"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* MODE: CREATE OR CHANGE PIN */}
          {(mode === "create" || !hasPinSet) && (
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="text-center mb-3">
                <h4 className="text-sm font-extrabold text-slate-900 font-heading">
                  {hasPinSet ? "Modifier votre Code PIN" : "Création de votre Code PIN de Transaction"}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Indépendant de votre mot de passe de connexion, ce PIN protège tous vos paiements et retraits Yaamaa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                  Nouveau Code PIN (4 à 8 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                  Confirmer le Code PIN
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {hasPinSet && (
                <button
                  type="button"
                  onClick={() => setMode("verify")}
                  className="text-xs text-indigo-600 font-semibold hover:underline block text-center mx-auto"
                >
                  Annuler et revenir
                </button>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !newPin || !confirmPin}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  id="btn_submit_create_pin"
                >
                  {loading ? "Enregistrement..." : "Enregistrer le Code PIN"}
                </button>
              </div>
            </form>
          )}

          {/* MODE: RECOVER PIN */}
          {mode === "recover" && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <h4 className="text-sm font-extrabold text-slate-900 font-heading">Récupération Sécurisée du PIN</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Choisissez une méthode autorisée pour réinitialiser votre code de transaction.
                </p>
              </div>

              {recoverStep === "request" ? (
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setRecoverMethod("merchant_number")}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${recoverMethod === "merchant_number" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                      id="btn_recover_method_merchant"
                    >
                      Numéro Marchand
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoverMethod("email")}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${recoverMethod === "email" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                      id="btn_recover_method_email"
                    >
                      Adresse E-mail
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {recoverMethod === "merchant_number" ? "Votre Numéro Marchand Yaamaa (ex: YM-1001)" : "Votre Adresse E-mail enregistrée"}
                    </label>
                    <input
                      type="text"
                      value={recoverIdentifier}
                      onChange={(e) => setRecoverIdentifier(e.target.value)}
                      placeholder={recoverMethod === "merchant_number" ? "YM-..." : "nom@exemple.com"}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setMode("verify")}
                      className="text-gray-500 hover:underline font-semibold cursor-pointer"
                    >
                      Retour au code PIN
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !recoverIdentifier}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    id="btn_submit_recover_request"
                  >
                    {loading ? "Génération du code..." : "Envoyer le code de réinitialisation"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyRecovery} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Code de Vérification (6 chiffres reçus)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoverCode}
                      onChange={(e) => setRecoverCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nouveau Code PIN (4 à 8 chiffres)</label>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirmer le Nouveau PIN</label>
                    <input
                      type="password"
                      maxLength={8}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !recoverCode || !newPin || !confirmPin}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    id="btn_submit_recover_verify"
                  >
                    {loading ? "Réinitialisation..." : "Confirmer le Nouveau PIN"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
