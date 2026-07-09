/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  User, 
  Campaign, 
  TaskSubmission, 
  WalletTransaction, 
  SystemSettings, 
  MissionType,
  AuditLog,
  SubscriptionPlan,
  CallRecord,
  CallType
} from "./types";
import { ALL_COUNTRIES, getCurrencyForCountry } from "./countries";
import Navbar from "./components/Navbar";
import PwaInstallBanner from "./components/PwaInstallBanner";
import BoutiqueView from "./components/BoutiqueView";
import PromotionsView from "./components/PromotionsView";
import SocialView from "./components/SocialView";
import SuppliersDeliverersView from "./components/SuppliersDeliverersView";
import UserProfileModal from "./components/UserProfileModal";
import YaamaaAiView from "./components/YaamaaAiView";
import { AudioVideoCallModal } from "./components/AudioVideoCallModal";
import AdminGiftsPanel from "./components/AdminGiftsPanel";
import AdminSubscriptionsPanel from "./components/AdminSubscriptionsPanel";
import AdminSupervisionPanel from "./components/AdminSupervisionPanel";
import { AdminApiKeysPanel } from "./components/AdminApiKeysPanel";
import { AdminPublishingBoard } from "./components/AdminPublishingBoard";
import { ModerationCenterModal } from "./components/ModerationCenterModal";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import { NotificationSettingsModal } from "./components/NotificationSettingsModal";
import { Language, getTranslation } from "./i18n";
import { Store, Megaphone } from "lucide-react";
import { 
  Coins, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Send, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Copy, 
  Upload, 
  ShieldAlert, 
  Play, 
  Flame, 
  ExternalLink, 
  MessageSquare, 
  Clock, 
  Filter, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  RefreshCw, 
  Lock, 
  LockOpen, 
  Check, 
  CheckSquare, 
  ChevronRight, 
  Settings, 
  Globe, 
  Wallet,
  UserCheck,
  Mail,
  Smartphone,
  Share2
} from "lucide-react";

function SafeText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(Yaamaa|YAAMAA)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "Yaamaa" || part === "YAAMAA") {
          return (
            <span key={i} translate="no" className="notranslate inline-block">
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}


const COUNTRIES_LIST = [
  { name: "Bénin", flag: "🇧🇯", code: "+229", currency: "XOF", methods: ["MTN Mobile Money", "Moov Money", "Celtiis Cash", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Togo", flag: "🇹🇬", code: "+228", currency: "XOF", methods: ["TMoney", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Côte d'Ivoire", flag: "🇨🇮", code: "+225", currency: "XOF", methods: ["Wave", "Orange Money", "MTN Mobile Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Sénégal", flag: "🇸🇳", code: "+221", currency: "XOF", methods: ["Wave", "Orange Money", "Free Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Cameroun", flag: "🇨🇲", code: "+237", currency: "XAF", methods: ["MTN Mobile Money", "Orange Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Burkina Faso", flag: "🇧🇫", code: "+226", currency: "XOF", methods: ["Orange Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Mali", flag: "🇲🇱", code: "+223", currency: "XOF", methods: ["Orange Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Niger", flag: "🇳🇪", code: "+227", currency: "XOF", methods: ["Airtel Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Gabon", flag: "🇬🇦", code: "+241", currency: "XAF", methods: ["Airtel Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Congo-Brazzaville", flag: "🇨🇬", code: "+242", currency: "XAF", methods: ["MTN Mobile Money", "Airtel Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Congo-Kinshasa (RDC)", flag: "🇨🇩", code: "+243", currency: "CDF", methods: ["M-Pesa", "Airtel Money", "Orange Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Guinée", flag: "🇬🇳", code: "+224", currency: "GNF", methods: ["Orange Money", "MTN Mobile Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Tchad", flag: "🇹🇩", code: "+235", currency: "XAF", methods: ["Airtel Money", "Moov Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Centrafrique", flag: "🇨🇫", code: "+236", currency: "XAF", methods: ["Orange Money", "Telecel Cash", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Rwanda", flag: "🇷🇼", code: "+250", currency: "RWF", methods: ["MTN Mobile Money", "Airtel Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Burundi", flag: "🇧🇮", code: "+257", currency: "BIF", methods: ["Lumicash", "Ecocash", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Madagascar", flag: "🇲🇬", code: "+261", currency: "MGA", methods: ["Mvola", "Orange Money", "Airtel Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Mauritanie", flag: "🇲🇷", code: "+222", currency: "MRU", methods: ["Masrivi", "Bankily", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Guinée-Bissau", flag: "🇬🇼", code: "+245", currency: "XOF", methods: ["MTN Mobile Money", "Orange Money", "Carte Bancaire", "Virement Bancaire"] },
  { name: "Guinée Équatoriale", flag: "🇬🇶", code: "+240", currency: "XAF", methods: ["Muni Cash", "Carte Bancaire", "Virement Bancaire"] },
  { name: "France", flag: "🇫🇷", code: "+33", currency: "EUR", methods: ["Carte Bancaire", "Virement Bancaire"] },
  { name: "Canada", flag: "🇨🇦", code: "+1", currency: "CAD", methods: ["Carte Bancaire", "Virement Interac", "Virement Bancaire"] },
  { name: "Belgique", flag: "🇧🇪", code: "+32", currency: "EUR", methods: ["Carte Bancaire", "Virement Bancaire"] },
  { name: "États-Unis", flag: "🇺🇸", code: "+1", currency: "USD", methods: ["Carte Bancaire", "Virement Bancaire"] }
];

import yaamaaLogo from "./assets/images/yaamaa_logo_updated_1783116905472.jpg";

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>("home");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [initiallyOpenGiftsModal, setInitiallyOpenGiftsModal] = useState<boolean>(false);
  const [discussionFriendId, setDiscussionFriendId] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState<boolean>(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  // Language State
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("yaamaa_language");
    if (saved === "fr" || saved === "en") return saved as Language;
    return navigator.language.startsWith("en") ? "en" : "fr";
  });

  const t = getTranslation(currentLanguage);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem("yaamaa_language", lang);
  };

  // Global State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  // Auto-sender / Automation Sender Profile State
  const [autoSenderName, setAutoSenderName] = useState("Yama Assistance");
  const [autoSenderPhone, setAutoSenderPhone] = useState("+221701234567");
  const [autoSenderAvatar, setAutoSenderAvatar] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop");

  useEffect(() => {
    if (systemMetrics?.settings) {
      if (systemMetrics.settings.autoSenderName) setAutoSenderName(systemMetrics.settings.autoSenderName);
      if (systemMetrics.settings.autoSenderPhone) setAutoSenderPhone(systemMetrics.settings.autoSenderPhone);
      if (systemMetrics.settings.autoSenderAvatar) setAutoSenderAvatar(systemMetrics.settings.autoSenderAvatar);
    }
  }, [systemMetrics]);

  const handleSaveAutoSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoSenderName,
          autoSenderPhone,
          autoSenderAvatar,
          operatorId: currentUser.id
        })
      });
      if (res.ok) {
        alert("Profil émetteur automatisé (Numéro & Avatar) mis à jour avec succès !");
        syncPlatformData(currentUser.id);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion.");
    }
  };

  // Boutique & Promotions State
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [promoCampaigns, setPromoCampaigns] = useState<any[]>([]);

  // Load Indicator / UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  
  // Merchant Number System states
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);
  const [merchantPayMethod, setMerchantPayMethod] = useState<string>("MTN Mobile Money");
  const [merchantPayPhone, setMerchantPayPhone] = useState<string>("");
  const [merchantPayName, setMerchantPayName] = useState<string>("");
  const [merchantStep, setMerchantStep] = useState<"form" | "processing" | "success">("form");
  const [generatedMerchantNumber, setGeneratedMerchantNumber] = useState<string>("");
  const [merchantWithin30Days, setMerchantWithin30Days] = useState<boolean>(true);
  const [merchantPackTypeSelection, setMerchantPackTypeSelection] = useState<string>("premium");
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  
  const selectedPlanObj = subscriptionPlans.find(p => p.id === merchantPackTypeSelection || p.tier === merchantPackTypeSelection);
  const merchantSelectedPrice = selectedPlanObj 
    ? selectedPlanObj.initialPrice 
    : (merchantPackTypeSelection === "gold" 
        ? (systemMetrics?.settings?.merchantGoldPrice ?? 15000) 
        : merchantPackTypeSelection === "diamond" 
          ? (systemMetrics?.settings?.merchantDiamondPrice ?? 35000) 
          : (systemMetrics?.settings?.merchantPremiumPrice ?? 5000));
  
  // Advanced Auth and Verification States
  const [authScreenMode, setAuthScreenMode] = useState<"login" | "register">("login");
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  // Email & Password login states
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  // Simple registration states
  const [registerName, setRegisterName] = useState<string>("");
  const [registerEmail, setRegisterEmail] = useState<string>("");
  const [registerCountry, setRegisterCountry] = useState<string>("Sénégal");
  const [registerReferral, setRegisterReferral] = useState<string>("BOSS2026"); // Automatically prefilled code of Founder Pierre
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [registerConfirm, setRegisterConfirm] = useState<string>("");

  // Forgot Password state
  const [forgotPasswordActive, setForgotPasswordActive] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");

  // Simulated Contacts for Referral sharing
  const [simulatedContacts, setSimulatedContacts] = useState([
    { id: 1, name: "Moussa Diagne", phone: "+221 77 554 12 34", sent: false },
    { id: 2, name: "Aïcha Diallo", phone: "+221 76 345 88 12", sent: false },
    { id: 3, name: "Jean-Baptiste Koffi", phone: "+225 07 48 99 22", sent: false },
    { id: 4, name: "Fatoumata Sylla", phone: "+224 622 15 44 99", sent: false },
    { id: 5, name: "Marc Moreau", phone: "+33 6 45 89 21 03", sent: false },
  ]);
  const [newContactName, setNewContactName] = useState<string>("");
  const [newContactPhone, setNewContactPhone] = useState<string>("");

  // Google Simulated flow states
  const [showGoogleAccountsSelector, setShowGoogleAccountsSelector] = useState<boolean>(false);
  const [googleStep, setGoogleStep] = useState<"none" | "select" | "prompt_new" | "prompt_old">("none");
  const [googleEmail, setGoogleEmail] = useState<string>("");
  const [googleName, setGoogleName] = useState<string>("");
  const [googlePhone, setGooglePhone] = useState<string>("");
  const [googleCountry, setGoogleCountry] = useState<string>("Sénégal");
  const [googlePassword, setGooglePassword] = useState<string>("");

  const [selectedCampaignForTask, setSelectedCampaignForTask] = useState<Campaign | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [withdrawalMethod, setWithdrawalMethod] = useState<string>("Orange Money");
  const [withdrawalDetails, setWithdrawalDetails] = useState<string>("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Unified wallet view tab states
  const [walletTab, setWalletTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [withdrawCountry, setWithdrawCountry] = useState<string>("Bénin");
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>("XOF");
  const [withdrawMethodSelected, setWithdrawMethodSelected] = useState<string>("MTN Mobile Money");
  const [withdrawPhone, setWithdrawPhone] = useState<string>("");
  const [withdrawCardNumber, setWithdrawCardNumber] = useState<string>("");
  const [withdrawCardName, setWithdrawCardName] = useState<string>("");
  const [withdrawIBAN, setWithdrawIBAN] = useState<string>("");
  const [isWithdrawalProcessing, setIsWithdrawalProcessing] = useState<boolean>(false);
  const [withdrawalSuccessState, setWithdrawalSuccessState] = useState<boolean>(false);

  // Filters for user transaction history and performed tasks
  const [personalTxFilter, setPersonalTxFilter] = useState<string>("all");
  const [personalTaskFilter, setPersonalTaskFilter] = useState<string>("all");

  // Campaign Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [campTitle, setCampTitle] = useState<string>("");
  const [campDesc, setCampDesc] = useState<string>("");
  const [campCategory, setCampCategory] = useState<string>("Social Media");
  const [campType, setCampType] = useState<MissionType>("like_post");
  const [campLink, setCampLink] = useState<string>("");
  const [campImage, setCampImage] = useState<string>("");
  const [campVideo, setCampVideo] = useState<string>("");
  const [campBudget, setCampBudget] = useState<number>(100);
  const [campReward, setCampReward] = useState<number>(0.20);
  const [campProofRequirements, setCampProofRequirements] = useState<string>("Veuillez renseigner votre pseudonyme et confirmer la réalisation.");
  const [campTargetCountries, setCampTargetCountries] = useState<string[]>([]);
  const [campTargetGender, setCampTargetGender] = useState<"all" | "male" | "female">("all");
  const [campTargetLevel, setCampTargetLevel] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Task Submission Form State
  const [submitProofText, setSubmitProofText] = useState<string>("");
  const [submitProofLink, setSubmitProofLink] = useState<string>("");
  const [submitProofFile, setSubmitProofFile] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // New Profile Form State
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileUsername, setNewProfileUsername] = useState<string>("");
  const [newProfileEmail, setNewProfileEmail] = useState<string>("");
  const [newProfilePhone, setNewProfilePhone] = useState<string>("");
  const [newProfileRole, setNewProfileRole] = useState<"participant" | "advertiser">("participant");
  const [newProfileCountry, setNewProfileCountry] = useState<string>("France");
  const [newProfileCurrency, setNewProfileCurrency] = useState<string>("EUR");
  const [newProfileReferral, setNewProfileReferral] = useState<string>("");
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile Edit Form State
  const [editProfileName, setEditProfileName] = useState<string>("");
  const [editProfileUsername, setEditProfileUsername] = useState<string>("");
  const [editProfileEmail, setEditProfileEmail] = useState<string>("");
  const [editProfilePhone, setEditProfilePhone] = useState<string>("");
  const [editProfileAddress, setEditProfileAddress] = useState<string>("");
  const [editProfileCountry, setEditProfileCountry] = useState<string>("");
  const [editProfileCurrency, setEditProfileCurrency] = useState<string>("");
  const [editProfilePassword, setEditProfilePassword] = useState<string>("");
  const [editProfileAvatar, setEditProfileAvatar] = useState<string>("");
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [editProfileSuccess, setEditProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authModalOpen && currentUser) {
      setEditProfileName(currentUser.name || "");
      setEditProfileUsername(currentUser.username || "");
      setEditProfileEmail(currentUser.email || "");
      setEditProfilePhone(currentUser.phone || "");
      setEditProfileAddress(currentUser.address || "");
      setEditProfileCountry(currentUser.country || "France");
      setEditProfileCurrency(currentUser.currency || "EUR");
      setEditProfilePassword(currentUser.password || "");
      setEditProfileAvatar(currentUser.avatar || "");
      setEditProfileError(null);
      setEditProfileSuccess(null);
    }
  }, [authModalOpen, currentUser]);

  // Initialize default notifications if not present for connected user
  useEffect(() => {
    if (currentUser && (!currentUser.notifications || currentUser.notifications.length === 0)) {
      const defaultNotifs = [
        {
          id: "notif_welcome",
          title: "Bienvenue sur Yaamaa ! 🚀",
          desc: "Votre compte est connecté. Explorez les missions et gagnez vos premiers gains.",
          time: "À l'instant",
          read: false,
          linkView: "missions"
        },
        {
          id: "notif_referral",
          title: "Prime de Parrainage & Code Promo 🌟",
          desc: `Votre code parrain ${currentUser.referralCode || "YAAMAA"} est actif. Partagez-le pour gagner des commissions sur chaque membre.`,
          time: "Il y a 5 min",
          read: false,
          linkView: "wallet"
        },
        {
          id: "notif_community",
          title: "Invitation Communauté Yaamaa 🤝",
          desc: "Découvrez le fil d'actualité social et échangez avec la communauté active.",
          time: "Il y a 30 min",
          read: false,
          linkView: "social"
        }
      ];
      if (currentUser.merchantNumber) {
        defaultNotifs.unshift({
          id: "notif_merchant_active",
          title: "Abonnement Marchand Actif ✨",
          desc: `Votre numéro ${currentUser.merchantNumber} est activé sur la Marketplace. Vos produits sont visibles du public !`,
          time: "Il y a 1 h",
          read: false,
          linkView: "boutique"
        });
      }
      setCurrentUser(prev => prev ? { ...prev, notifications: defaultNotifs } : null);
    }
  }, [currentUser?.id, currentUser?.merchantNumber]);

  const handleNotificationClick = (notif: { id: string; linkView?: string }) => {
    if (!currentUser) return;
    const updatedNotifs = (currentUser.notifications || []).map(n => 
      n.id === notif.id ? { ...n, read: true } : n
    );
    setCurrentUser(prev => prev ? { ...prev, notifications: updatedNotifs } : null);

    if (notif.linkView) {
      setCurrentView(notif.linkView);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    const updatedNotifs = (currentUser.notifications || []).map(n => ({ ...n, read: true }));
    setCurrentUser(prev => prev ? { ...prev, notifications: updatedNotifs } : null);
  };

  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  // Deposit States
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<string>("Orange Money");
  const [depositDetails, setDepositDetails] = useState<string>("");
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositCountrySearch, setDepositCountrySearch] = useState<string>("");
  const [withdrawCountrySearch, setWithdrawCountrySearch] = useState<string>("");

  // Kkiapay direct instant deposit state variables
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] = useState<boolean>(false);
  const [paymentPurpose, setPaymentPurpose] = useState<"deposit" | "purchase" | "campaign">("deposit");
  const [paymentPayload, setPaymentPayload] = useState<any | null>(null);
  const [wizardFundingMethod, setWizardFundingMethod] = useState<"wallet" | "kkiapay">("wallet");
  const [kkiapayCountry, setKkiapayCountry] = useState<string>("Bénin");
  const [kkiapayMethod, setKkiapayMethod] = useState<string>("MTN Mobile Money");
  const [kkiapayPhone, setKkiapayPhone] = useState<string>("");
  const [kkiapayCardNumber, setKkiapayCardNumber] = useState<string>("");
  const [kkiapayCardExpiry, setKkiapayCardExpiry] = useState<string>("");
  const [kkiapayCardCvv, setKkiapayCardCvv] = useState<string>("");
  const [kkiapayCardName, setKkiapayCardName] = useState<string>("");
  const [kkiapayStep, setKkiapayStep] = useState<"form" | "processing" | "ussd" | "success">("form");
  const [kkiapayPin, setKkiapayPin] = useState<string>("");
  const [kkiapayUssdStep, setKkiapayUssdStep] = useState<number>(1);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);

  // Admin Config States
  const [adminFeePercent, setAdminFeePercent] = useState<string>("10");
  const [adminMinWithdrawal, setAdminMinWithdrawal] = useState<string>("10");
  const [adminBaseReward, setAdminBaseReward] = useState<string>("0.20");
  const [adminDefaultCommission, setAdminDefaultCommission] = useState<string>("10");
  const [adminIsFreezingWithdrawals, setAdminIsFreezingWithdrawals] = useState<boolean>(false);
  const [adminMerchantNumberPrice, setAdminMerchantNumberPrice] = useState<string>("5000");
  const [adminMerchantPremiumPrice, setAdminMerchantPremiumPrice] = useState<string>("5000");
  const [adminMerchantGoldPrice, setAdminMerchantGoldPrice] = useState<string>("15000");
  const [adminMerchantDiamondPrice, setAdminMerchantDiamondPrice] = useState<string>("35000");
  const [adminReferralEnabled, setAdminReferralEnabled] = useState<boolean>(true);
  const [adminReferralMode, setAdminReferralMode] = useState<"percentage" | "fixed">("percentage");
  const [adminReferralValue, setAdminReferralValue] = useState<string>("50");
  const [adminReferralMaxCap, setAdminReferralMaxCap] = useState<string>("1000000");
  const [adminReferralMaxReferrals, setAdminReferralMaxReferrals] = useState<string>("100");

  // Yaamaa AI Assistant state
  const [aiChatType, setAiChatType] = useState<string>("participant_recommend");
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Admin / Founder Control parameters
  const [adminFeedbackText, setAdminFeedbackText] = useState<{[key: string]: string}>({});
  const [critWithdrawalFrozen, setCritWithdrawalFrozen] = useState<boolean>(false);
  const [critPlatformFee, setCritPlatformFee] = useState<number>(10);
  const [critSuspendedCountries, setCritSuspendedCountries] = useState<string>("");
  const [critSuspendedCurrencies, setCritSuspendedCurrencies] = useState<string>("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<string>("dashboard");
  const [adminChartMetric, setAdminChartMetric] = useState<"commission" | "volume">("commission");
  
  // Search and filter states for newly added Registry and Audit subtabs
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");
  const [revealPasswordsId, setRevealPasswordsId] = useState<string[]>([]);

  // Broadcast message automation states
  const [broadcastCampaigns, setBroadcastCampaigns] = useState<any[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState<string>("");
  const [broadcastText, setBroadcastText] = useState<string>("");
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState<string>("");
  const [broadcastMediaType, setBroadcastMediaType] = useState<"none" | "image" | "video" | "document" | "link">("none");
  const [broadcastMediaName, setBroadcastMediaName] = useState<string>("");
  const [broadcastScheduleType, setBroadcastScheduleType] = useState<"immediate" | "scheduled">("immediate");
  const [broadcastScheduledAt, setBroadcastScheduledAt] = useState<string>("");
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState<string>("all");
  const [broadcastCountries, setBroadcastCountries] = useState<string[]>([]);
  const [broadcastRegion, setBroadcastRegion] = useState<string>("");
  const [broadcastCity, setBroadcastCity] = useState<string>("");
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [isSavingBroadcast, setIsSavingBroadcast] = useState<boolean>(false);

  // Audio & Video Call System States
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  const handleInitiateCall = async (targetUserId: string, type: CallType) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/social/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: currentUser.id,
          receiverId: targetUserId,
          type
        })
      });
      if (res.ok) {
        const call = await res.json();
        setActiveCall(call);
        setIsCallModalOpen(true);
      }
    } catch (err) {
      console.error("Error initiating call:", err);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      await fetch(`/api/social/calls/${callId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      setActiveCall(null);
      fetchCallHistory();
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  const handleAcceptCall = async (callId: string) => {
    try {
      const res = await fetch(`/api/social/calls/${callId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res.ok) {
        const call = await res.json();
        setActiveCall(call);
        setIsCallModalOpen(true);
      }
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const handleHostAction = async (callId: string, action: string, targetUserId?: string) => {
    try {
      const res = await fetch(`/api/social/calls/${callId}/host-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: currentUser?.id, action, targetUserId })
      });
      if (res.ok) {
        const call = await res.json();
        setActiveCall(call);
      }
    } catch (err) {
      console.error("Error with host action:", err);
    }
  };

  const fetchCallHistory = async () => {
    try {
      const res = await fetch(`/api/social/calls?userId=${currentUser?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) setCallHistory(data.history);
        if (data.activeCall) setActiveCall(data.activeCall);
      }
    } catch (err) {
      console.error("Error fetching call history:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCallHistory();
    }
  }, [currentUser?.id]);

  // History & Back Button Synchronizer
  const isPopStateRef = React.useRef(false);
  const previousModalStateRef = React.useRef(false);

  const isAnyModalOpen = authModalOpen || isReferralModalOpen || isShareModalOpen || isMerchantModalOpen || isPaymentConfirmationOpen;

  useEffect(() => {
    // Put initial state if not defined
    if (!window.history.state) {
      window.history.replaceState({ view: "home" }, "", "");
    }

    const handlePop = (e: PopStateEvent) => {
      // 1. If any modal is open, back button closes the modal and keeps the current view
      if (authModalOpen || isReferralModalOpen || isShareModalOpen || isMerchantModalOpen || isPaymentConfirmationOpen) {
        setAuthModalOpen(false);
        setIsReferralModalOpen(false);
        setIsShareModalOpen(false);
        setIsMerchantModalOpen(false);
        setIsPaymentConfirmationOpen(false);
        return;
      }

      // 2. Standard navigation pop
      if (e.state && e.state.view) {
        isPopStateRef.current = true;
        setCurrentView(e.state.view);
      }
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [authModalOpen, isReferralModalOpen, isShareModalOpen, isMerchantModalOpen, isPaymentConfirmationOpen]);

  // Push state to browser history when view changes
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    if (window.history.state?.view !== currentView) {
      window.history.pushState({ view: currentView }, "", "");
    }
  }, [currentView]);

  // Handle modal state changes to push/pop history
  useEffect(() => {
    if (isAnyModalOpen && !previousModalStateRef.current) {
      // A modal opened: push history entry
      window.history.pushState({ view: currentView, modal: true }, "", "");
    } else if (!isAnyModalOpen && previousModalStateRef.current) {
      // All modals closed: if the current state was pushed for a modal, pop it
      if (window.history.state?.modal) {
        window.history.back();
      }
    }
    previousModalStateRef.current = isAnyModalOpen;
  }, [isAnyModalOpen, currentView]);

  // Global Initializer & Data Sync
  const syncPlatformData = useCallback(async (currentUserId?: string) => {
    try {
      const [
        settingsRes, usersRes, campaignsRes, submissionsRes, transactionsRes, auditLogsRes,
        shopsRes, productsRes, ordersRes, disputesRes, promoCampaignsRes, broadcastRes, subPlansRes
      ] = await Promise.all([
        fetch("/api/settings").then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch("/api/users").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/campaigns").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/submissions").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/transactions").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/admin/audit-logs").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/shops").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/products").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/orders").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/disputes").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/promotions").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/broadcast-campaigns").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/subscription-plans").then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      setSystemMetrics(settingsRes || {});
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
      setSubmissions(Array.isArray(submissionsRes) ? submissionsRes : []);
      setTransactions(Array.isArray(transactionsRes) ? transactionsRes : []);
      setAuditLogs(Array.isArray(auditLogsRes) ? auditLogsRes : []);
      setShops(Array.isArray(shopsRes) ? shopsRes : []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setDisputes(Array.isArray(disputesRes) ? disputesRes : []);
      setPromoCampaigns(Array.isArray(promoCampaignsRes) ? promoCampaignsRes : []);
      setBroadcastCampaigns(Array.isArray(broadcastRes) ? broadcastRes : []);
      setSubscriptionPlans(Array.isArray(subPlansRes) ? subPlansRes : []);

      // Setup pre-loaded admin views variables from DB state
      const sRes = settingsRes as any;
      if (sRes && sRes.settings) {
        setCritWithdrawalFrozen(sRes.settings.isWithdrawalFrozen);
        setCritPlatformFee(sRes.settings.platformFeePercentage);
        setCritSuspendedCountries(sRes.settings.suspendedCountries?.join(", ") || "");
        setCritSuspendedCurrencies(sRes.settings.suspendedCurrencies?.join(", ") || "");
        setAdminIsFreezingWithdrawals(sRes.settings.isWithdrawalFrozen);
        setAdminFeePercent(String(sRes.settings.platformFeePercentage ?? "10"));
        setAdminMinWithdrawal(String(sRes.settings.minWithdrawalAmount ?? "10"));
        setAdminBaseReward(String(sRes.settings.baseReward ?? "0.2"));
        setAdminDefaultCommission(String(sRes.settings.defaultCommission ?? "10"));
        setAdminMerchantNumberPrice(String(sRes.settings.merchantNumberPrice ?? "5000"));
        setAdminMerchantPremiumPrice(String(sRes.settings.merchantPremiumPrice ?? "5000"));
        setAdminMerchantGoldPrice(String(sRes.settings.merchantGoldPrice ?? "15000"));
        setAdminMerchantDiamondPrice(String(sRes.settings.merchantDiamondPrice ?? "35000"));
        setAdminReferralEnabled(sRes.settings.referralProgramEnabled !== false);
        setAdminReferralMode(sRes.settings.referralCommissionMode || "percentage");
        setAdminReferralValue(String(sRes.settings.referralCommissionValue ?? "50"));
        setAdminReferralMaxCap(String(sRes.settings.referralMaxEarningsCap ?? "1000000"));
        setAdminReferralMaxReferrals(String(sRes.settings.referralMaxReferralsPerUser ?? "100"));
      }

      // Sync Current Active User
      const savedUserId = localStorage.getItem("yaamaa_logged_user_id");
      const targetId = currentUserId || savedUserId || undefined;
      if (targetId) {
        try {
          const userDetailRes = await fetch("/api/users/current", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetId })
          });
          if (userDetailRes.ok) {
            const detail = await userDetailRes.json();
            setCurrentUser(detail);
            localStorage.setItem("yaamaa_logged_user_id", detail.id);
          } else {
            setCurrentUser(null);
            localStorage.removeItem("yaamaa_logged_user_id");
          }
        } catch {
          // Ignore user sync error
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    } catch (err) {
      console.warn("Yaamaa Platform synchronization warning:", err);
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const handleStartChat = async (otherUserId: string) => {
    if (!currentUser) {
      setAuthScreenMode("login");
      setAuthModalOpen(true);
      setAuthSuccessMsg(currentLanguage === "fr" ? "Veuillez vous connecter pour envoyer des messages ou des notes vocales." : "Please log in to send messages or voice notes.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/social/friends/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, friendId: otherUserId })
      });
      if (res.ok) {
        await syncPlatformData(currentUser.id);
        setDiscussionFriendId(otherUserId);
        setCurrentView("discussions");
        setSelectedProfileUserId(null);
      } else {
        const errData = await res.json();
        console.error("Could not ensure friendship", errData);
      }
    } catch (err) {
      console.error("Error linking users for chat", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Broadcast Message Automation Actions
  const getTargetRecipientsCount = (group: string, countriesList: string[], reg: string, cit: string): number => {
    let list = users || [];
    // Filter out potential system/admin items
    list = list.filter(u => u.role !== "admin" && u.role !== "founder" && u.id !== "user_admin");
    
    if (group === "all") return list.length;
    if (group === "countries") {
      if (countriesList.length === 0) return 0;
      return list.filter(u => countriesList.includes(u.country)).length;
    }
    if (group === "region_city") {
      return list.filter(u => {
        const addr = (u.address || "").toLowerCase();
        const matchR = reg ? addr.includes(reg.toLowerCase()) : true;
        const matchC = cit ? addr.includes(cit.toLowerCase()) : true;
        return matchR && matchC;
      }).length;
    }
    if (group === "premium") return list.filter(u => !!u.merchantNumber).length;
    if (group === "free") return list.filter(u => !u.merchantNumber).length;
    if (group === "shop_owners") {
      const owners = new Set((shops || []).map(s => s.ownerId));
      return list.filter(u => owners.has(u.id)).length;
    }
    if (group === "suppliers") {
      const phys = new Set((products || []).filter(p => p.category === "physical").map(p => p.ownerId));
      return list.filter(u => phys.has(u.id) || (u.bio || "").toLowerCase().includes("fournisseur") || (u.name || "").toLowerCase().includes("fournisseur")).length;
    }
    if (group === "delivery") {
      return list.filter(u => (u.bio || "").toLowerCase().includes("livreur") || (u.username || "").toLowerCase().includes("livre") || (u.name || "").toLowerCase().includes("livreur")).length;
    }
    if (group === "creators") {
      return list.filter(u => u.level >= 10 || (u.bio || "").toLowerCase().includes("créateur") || (u.bio || "").toLowerCase().includes("creator")).length;
    }
    if (group === "verified") {
      return list.filter(u => u.is2faEnabled || !!u.merchantNumber || u.level >= 5).length;
    }
    if (group === "new") {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return list.filter(u => u.createdAt ? new Date(u.createdAt).getTime() > oneWeekAgo : false).length;
    }
    if (group === "active") {
      const activeIds = new Set([
        ...(transactions || []).map(t => t.userId),
        ...(submissions || []).map(s => s.participantId)
      ]);
      return list.filter(u => activeIds.has(u.id)).length;
    }
    if (group === "inactive") {
      const activeIds = new Set([
        ...(transactions || []).map(t => t.userId),
        ...(submissions || []).map(s => s.participantId)
      ]);
      return list.filter(u => !activeIds.has(u.id)).length;
    }
    return list.length;
  };

  const handleSaveBroadcastCampaign = async (campaignStatus: "draft" | "scheduled" | "sent") => {
    if (!broadcastTitle || !broadcastText) {
      alert("Le titre et le contenu du message sont obligatoires.");
      return;
    }
    if (broadcastScheduleType === "scheduled" && !broadcastScheduledAt && campaignStatus === "scheduled") {
      alert("Veuillez indiquer une date et une heure de planification d'envoi.");
      return;
    }
    if (!currentUser) return;

    setIsSavingBroadcast(true);
    try {
      const res = await fetch("/api/broadcast-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCampaignId || undefined,
          title: broadcastTitle,
          text: broadcastText,
          mediaUrl: broadcastMediaUrl || undefined,
          mediaType: broadcastMediaType,
          mediaName: broadcastMediaName || undefined,
          scheduleType: broadcastScheduleType,
          scheduledAt: broadcastScheduleType === "scheduled" ? broadcastScheduledAt : undefined,
          status: campaignStatus,
          targeting: {
            targetGroup: broadcastTargetGroup,
            countries: broadcastTargetGroup === "countries" ? broadcastCountries : [],
            region: broadcastTargetGroup === "region_city" ? broadcastRegion : "",
            city: broadcastTargetGroup === "region_city" ? broadcastCity : ""
          },
          senderId: currentUser.id
        })
      });

      if (res.ok) {
        setBroadcastTitle("");
        setBroadcastText("");
        setBroadcastMediaUrl("");
        setBroadcastMediaType("none");
        setBroadcastMediaName("");
        setBroadcastScheduleType("immediate");
        setBroadcastScheduledAt("");
        setBroadcastTargetGroup("all");
        setBroadcastCountries([]);
        setBroadcastRegion("");
        setBroadcastCity("");
        setEditingCampaignId(null);
        alert(campaignStatus === "sent" ? "Campagne de diffusion envoyée avec succès ! 🚀" : campaignStatus === "scheduled" ? "Campagne planifiée avec succès ! 🕒" : "Brouillon sauvegardé avec succès ! 💾");
        await syncPlatformData();
      } else {
        const err = await res.json();
        alert("Erreur de sauvegarde: " + (err.error || "Erreur inconnue."));
      }
    } catch (e) {
      alert("Erreur de communication avec le serveur.");
    } finally {
      setIsSavingBroadcast(false);
    }
  };

  const handleSendBroadcastImmediately = async (campaignId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Êtes-vous sûr de vouloir diffuser cette campagne immédiatement à tous les utilisateurs ciblés ?")) return;
    try {
      const res = await fetch(`/api/broadcast-campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: currentUser.id })
      });
      if (res.ok) {
        alert("Campagne diffusée avec succès ! 🚀");
        await syncPlatformData();
      } else {
        const err = await res.json();
        alert("Erreur: " + (err.error || "Impossible d'envoyer la campagne."));
      }
    } catch (e) {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleDeleteBroadcastCampaign = async (campaignId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Supprimer définitivement cette campagne administrative ? Cette action est irréversible.")) return;
    try {
      const res = await fetch(`/api/broadcast-campaigns/${campaignId}?operatorId=${currentUser.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Campagne supprimée. 🗑️");
        await syncPlatformData();
      } else {
        const err = await res.json();
        alert("Erreur: " + (err.error || "Impossible de supprimer la campagne."));
      }
    } catch (e) {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleLoadCampaignToForm = (camp: any) => {
    setEditingCampaignId(camp.id);
    setBroadcastTitle(camp.title);
    setBroadcastText(camp.text);
    setBroadcastMediaUrl(camp.mediaUrl || "");
    setBroadcastMediaType(camp.mediaType || "none");
    setBroadcastMediaName(camp.mediaName || "");
    setBroadcastScheduleType(camp.scheduleType || "immediate");
    setBroadcastScheduledAt(camp.scheduledAt || "");
    setBroadcastTargetGroup(camp.targeting?.targetGroup || "all");
    setBroadcastCountries(camp.targeting?.countries || []);
    setBroadcastRegion(camp.targeting?.region || "");
    setBroadcastCity(camp.targeting?.city || "");
    const el = document.getElementById("broadcast_form_editor");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    syncPlatformData();

    // Capture referral code from URL parameters
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref") || params.get("invite") || params.get("code");
    if (refCode) {
      setRegisterReferral(refCode);
      sessionStorage.setItem("yaamaa_invite_code", refCode);
      
      const loggedInId = localStorage.getItem("yaamaa_logged_user_id");
      if (!loggedInId) {
        setAuthScreenMode("register");
        setAuthModalOpen(true);
        setAuthSuccessMsg(`🎁 Bienvenue sur Yaamaa ! Vous avez été parrainé(e) avec le code "${refCode}". Créez votre compte ci-dessous pour bénéficier de commissions et bonus de bienvenue !`);
      }
    }
  }, []);

  // Helper to simulate a new referral (filleul) registration
  const handleSimulateNewFilleul = async () => {
    if (!currentUser) return;
    const mockNames = [
      "Alexandre Diallo", 
      "Fatimata Sy", 
      "Thomas Dubois", 
      "Yasmine Koné", 
      "Sébastien Moreau", 
      "Mariama Sow",
      "Koffi Mensah",
      "Awa Diagne"
    ];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomUsername = "Filleul_" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const randomEmail = `${randomUsername.toLowerCase()}@yaamaa-demo.com`;
    const randomCountry = currentUser.country || "Sénégal";
    const randomCurrency = currentUser.currency || "XOF";

    try {
      setIsLoading(true);
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: randomName,
          email: randomEmail,
          country: randomCountry,
          currency: randomCurrency,
          referredBy: currentUser.referralCode,
          password: "password123"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Échec de la simulation de parrainage.");
      } else {
        await syncPlatformData(currentUser.id);
        alert(`🎉 Simulation Réussie !\n\nLe filleul "${randomName}" (@${randomUsername}) s'est inscrit en utilisant votre lien de parrainage.\nVous venez de recevoir +1.0 € de bonus d'inscription !`);
      }
    } catch (err) {
      console.error("Referral simulation failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for user simulation toggle
  const handleUserChange = async (userId: string) => {
    setIsLoading(true);
    if (userId) {
      localStorage.setItem("yaamaa_logged_user_id", userId);
    } else {
      localStorage.removeItem("yaamaa_logged_user_id");
    }
    await syncPlatformData(userId);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("yaamaa_original_founder_id");
    setImpersonatorId(null);
    setCurrentUser(null);
    localStorage.removeItem("yaamaa_logged_user_id");
    setCurrentView("home");
  };

  const [impersonatorId, setImpersonatorId] = useState<string | null>(() => {
    return localStorage.getItem("yaamaa_original_founder_id");
  });

  const handleFounderImpersonate = (targetUser: User) => {
    const activeFounderId = impersonatorId || (currentUser?.role === "founder" ? currentUser.id : "user_founder");
    localStorage.setItem("yaamaa_original_founder_id", activeFounderId);
    setImpersonatorId(activeFounderId);

    setCurrentUser(targetUser);
    localStorage.setItem("yaamaa_logged_user_id", targetUser.id);
    setCurrentView("home");
    syncPlatformData(targetUser.id);
  };

  const handleReturnToFounder = () => {
    const founderId = impersonatorId || "user_founder";
    const founderUser = users.find(u => u.id === founderId) || users.find(u => u.role === "founder") || currentUser;
    localStorage.removeItem("yaamaa_original_founder_id");
    setImpersonatorId(null);

    if (founderUser) {
      setCurrentUser(founderUser);
      localStorage.setItem("yaamaa_logged_user_id", founderUser.id);
      setCurrentView("admin");
      syncPlatformData(founderUser.id);
    }
  };

  // Toggle user account suspension
  const handleToggleUserSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !currentStatus })
      });
      if (res.ok) {
        setAdminMsg("Statut d'exclusion de l'utilisateur mis à jour.");
        await syncPlatformData();
      }
    } catch (e) {
      console.error("Error setting suspension:", e);
    }
  };

  // Switch 2FA Setting for simulated user
  const handleToggle2FA = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is2faEnabled: !currentUser.is2faEnabled })
      });
      if (res.ok) {
        await syncPlatformData(currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Email Connection Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setAuthErrorMsg("Connexion refusée. " + (data.error || "Informations incorrectes."));
        return;
      }

      setAuthSuccessMsg("Connexion réussie ✔");
      setCurrentUser(data);
      localStorage.setItem("yaamaa_logged_user_id", data.id);
      
      // Clear login input states
      setLoginEmail("");
      setLoginPassword("");
      setTimeout(() => {
        setAuthSuccessMsg(null);
        setAuthModalOpen(false);
        if (data.role === "admin" || data.role === "founder") {
          setCurrentView("admin");
        }
        syncPlatformData(data.id);
      }, 700);
    } catch (err) {
      setAuthErrorMsg("Connexion refusée. Échec de communication avec le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email Connection Sign up
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);

    if (!registerName || !registerEmail || !registerPassword) {
      setAuthErrorMsg("Veuillez remplir votre Nom complet, E-mail et Mot de passe.");
      return;
    }

    if (registerPassword !== registerConfirm) {
      setAuthErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    // Dynamic currency assignment matching the comprehensive world list
    const registerCurrency = getCurrencyForCountry(registerCountry);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          country: registerCountry,
          currency: registerCurrency,
          referredBy: registerReferral,
          password: registerPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthErrorMsg(data.error || "Impossible de compléter l'inscription.");
        return;
      }

      setAuthSuccessMsg("Inscription réussie ! Bienvenue sur YAAMAA PRO ✔");
      setCurrentUser(data);
      localStorage.setItem("yaamaa_logged_user_id", data.id);

      // Clean registration states
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirm("");
      setTimeout(() => {
        setAuthSuccessMsg(null);
        setAuthModalOpen(false);
        if (data.role === "admin" || data.role === "founder") {
          setCurrentView("admin");
        }
        syncPlatformData(data.id);
      }, 700);
    } catch (err) {
      setAuthErrorMsg("Échec réseau lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Password Reset Workflow
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);

    if (!forgotPasswordEmail) {
      setAuthErrorMsg("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === forgotPasswordEmail.toLowerCase());
    if (matchedUser) {
      setAuthSuccessMsg(`Un e-mail de récupération simulé a été envoyé pour ${forgotPasswordEmail}. Version Sandbox : votre mot de passe d'évaluation actuel est : "${matchedUser.password || "password123"}".`);
    } else {
      setAuthErrorMsg("Aucun compte n'est enregistré avec cette adresse e-mail.");
    }
  };

  // Google Authentication Accounts list click
  const handleGoogleAccountSelected = (emailSelected: string, nameSelected: string) => {
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);
    
    setGoogleEmail(emailSelected);
    setGoogleName(nameSelected);

    // Look if user already in memory
    const existing = users.find(u => u.email.toLowerCase() === emailSelected.toLowerCase());
    if (existing) {
      // Exist: transition to password verification
      setGoogleStep("prompt_old");
    } else {
      // New: transition to profile details creation
      setGoogleStep("prompt_new");
    }
  };

  // Google Login Old/Existing account submit
  const handleGoogleOldUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, password: googlePassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthErrorMsg("Connexion refusée. " + (data.error || "Mot de passe incorrect."));
        return;
      }

      setAuthSuccessMsg(`Connexion Google réussie ! Bienvenue de retour, ${data.name} ✔`);
      setCurrentUser(data);
      localStorage.setItem("yaamaa_logged_user_id", data.id);
      
      // Clean google states
      setGoogleStep("none");
      setShowGoogleAccountsSelector(false);
      setGooglePassword("");
      setTimeout(() => {
        setAuthSuccessMsg(null);
        setAuthModalOpen(false);
        if (data.role === "admin" || data.role === "founder") {
          setCurrentView("admin");
        }
        syncPlatformData(data.id);
      }, 700);
    } catch (err) {
      setAuthErrorMsg("Erreur de connexion Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign up New account submit
  const handleGoogleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);

    if (!googlePhone) {
      setAuthErrorMsg("Veuillez renseigner votre numéro de téléphone.");
      return;
    }

    if (!googlePassword) {
      setAuthErrorMsg("Veuillez créer un mot de passe d'accès.");
      return;
    }

    setIsLoading(true);
    const devCurrency = getCurrencyForCountry(googleCountry);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleName,
          email: googleEmail,
          phone: googlePhone,
          country: googleCountry,
          currency: devCurrency,
          referredBy: "BOSS2026", // Prefill code automatically
          password: googlePassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthErrorMsg(data.error || "Impossible d'enregistrer le profil Google.");
        return;
      }

      setAuthSuccessMsg("Compte Google créé et connecté avec succès ✔");
      setCurrentUser(data);
      localStorage.setItem("yaamaa_logged_user_id", data.id);

      setGoogleStep("none");
      setShowGoogleAccountsSelector(false);
      setGooglePhone("");
      setGooglePassword("");
      setTimeout(() => {
        setAuthSuccessMsg(null);
        setAuthModalOpen(false);
        if (data.role === "admin" || data.role === "founder") {
          setCurrentView("admin");
        }
        syncPlatformData(data.id);
      }, 700);
    } catch (err) {
      setAuthErrorMsg("Erreur réseau pendant l'inscription Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // Keep compatibility for sandbox profile creations
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!newProfileName || !newProfileUsername || !newProfileEmail) {
      setProfileError("Saisie requise sur les champs Nom, Pseudonyme et Email.");
      return;
    }

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName,
          username: newProfileUsername,
          email: newProfileEmail,
          phone: newProfilePhone,
          role: newProfileRole,
          country: newProfileCountry,
          currency: newProfileCurrency,
          referredBy: newProfileReferral
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setProfileError(data.error || "Une erreur est survenue lors de l'enregistrement.");
        return;
      }

      setAuthModalOpen(false);
      setNewProfileName("");
      setNewProfileUsername("");
      setNewProfileEmail("");
      setNewProfilePhone("");
      setNewProfileReferral("");
      
      await syncPlatformData(data.id);
    } catch (err) {
      setProfileError("Impossible de contacter l'API de Yaamaa.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileError(null);
    setEditProfileSuccess(null);

    if (!currentUser) return;

    if (!editProfileName || !editProfileUsername || !editProfileEmail) {
      setEditProfileError("Saisie requise sur les champs Nom, Pseudonyme et Email.");
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProfileName,
          username: editProfileUsername,
          email: editProfileEmail,
          phone: editProfilePhone,
          address: editProfileAddress,
          country: editProfileCountry,
          currency: editProfileCurrency,
          password: editProfilePassword,
          avatar: editProfileAvatar
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setEditProfileError(data.error || "Une erreur est survenue lors de la mise à jour.");
        return;
      }

      setEditProfileSuccess("Votre profil a été mis à jour avec succès !");
      await syncPlatformData(currentUser.id);
      
      // Close modal after brief success presentation
      setTimeout(() => {
        setAuthModalOpen(false);
        setEditProfileSuccess(null);
      }, 1500);

    } catch (err) {
      setEditProfileError("Impossible de contacter l'API de Yaamaa.");
    }
  };

  // Campaign step progression calculation
  const calculateCampaignSummary = () => {
    const totalRaw = campBudget;
    const feePct = systemMetrics?.settings?.platformFeePercentage || 10;
    const commission = parseFloat((totalRaw * (feePct / 100)).toFixed(2));
    const totalToPay = parseFloat((totalRaw + commission).toFixed(2));
    const participants = Math.floor(totalRaw / campReward);
    return { commission, totalToPay, participants };
  };

  // Submit Completed Wizard Campaign Action
  const handlePublishCampaign = async () => {
    if (!currentUser) return;
    setWizardError(null);

    if (!campTitle || !campDesc || !campLink) {
      setWizardError("Le titre, la description détaillée et l'URL cible sont obligatoires.");
      return;
    }

    const { commission, totalToPay } = calculateCampaignSummary();

    if (wizardFundingMethod === "kkiapay") {
      // Direct checkout via Kkiapay
      setDepositAmount(totalToPay.toString());
      setPaymentPurpose("campaign");
      setKkiapayCountry("Bénin");
      setKkiapayMethod("MTN Mobile Money");
      setKkiapayPhone(currentUser?.phone || "");
      setKkiapayCardNumber("4242 4242 4242 4242");
      setKkiapayCardExpiry("12/28");
      setKkiapayCardCvv("737");
      setKkiapayCardName(currentUser?.fullName || "");
      setKkiapayStep("form");
      setKkiapayPin("");
      setKkiapayUssdStep(1);
      setIsPaymentConfirmationOpen(true);
      return;
    }

    if (currentUser.wallet.available < totalToPay) {
      setWizardError(`Solde insuffisant. Tarif global de ${totalToPay} ${currentUser.currency} exigé.`);
      return;
    }

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campTitle,
          description: campDesc,
          category: campCategory,
          type: campType,
          destLink: campLink,
          image: campImage,
          video: campVideo,
          budgetTotal: campBudget,
          rewardPerUser: campReward,
          proofRequirements: campProofRequirements,
          targeting: {
            countries: campTargetCountries,
            languages: [],
            gender: campTargetGender,
            ageMin: 13,
            ageMax: 99,
            interests: [],
            devices: [],
            minUserLevel: campTargetLevel
          },
          schedule: {
            immediate: true
          },
          advertiserId: currentUser.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setWizardError(data.error || "Échec de création de la campagne.");
        return;
      }

      // Reset campaign form fields
      setCampTitle("");
      setCampDesc("");
      setCampLink("");
      setCampType("like_post");
      setCampBudget(100);
      setCampReward(0.20);
      setWizardStep(1);

      // Auto approve campaign in sandbox if user is admin/founder, else set pending
      if (currentUser.role === "admin" || currentUser.role === "founder") {
        await fetch(`/api/campaigns/${data.campaign.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active", operatorId: currentUser.id })
        });
      }

      await syncPlatformData(currentUser.id);
      setCurrentView("missions");
    } catch (err) {
      setWizardError("Impossible de publier la campagne. Erreur réseau.");
    }
  };

  // Participate and Submit Proof Submission Action
  const handleSubmitTaskProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCampaignForTask) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmittingProof(true);

    if (!submitProofText && !submitProofLink) {
      setSubmitError("Veuillez fournir un texte de preuve ou un lien de profil.");
      setIsSubmittingProof(false);
      return;
    }

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaignForTask.id,
          participantId: currentUser.id,
          proofText: submitProofText,
          proofLink: submitProofLink,
          proofFileUrl: submitProofFile
        })
      });

      const data = await response.json();
      setIsSubmittingProof(false);

      if (!response.ok) {
        setSubmitError(data.error || "Une erreur est survenue.");
        return;
      }

      setSubmitSuccess(
        data.submission.status === "approved" 
          ? `Succès ! Yaamaa AI a auto-approuvé votre soumission sans fraude. +${selectedCampaignForTask.rewardPerUser} ${currentUser.currency} crédités.`
          : "Preuve enregistrée ! En attente de contrôle manuel de conformité par l'annonceur."
      );

      // Reset
      setSubmitProofText("");
      setSubmitProofLink("");
      setSubmitProofFile("");
      setSelectedCampaignForTask(null);

      await syncPlatformData(currentUser.id);
    } catch (err) {
      setIsSubmittingProof(false);
      setSubmitError("Échec de communication réseau.");
    }
  };

  // Trigger Advanced Automated Withdrawal logic
  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (!currentUser.merchantNumber) {
      setWithdrawError("Retrait impossible. Sans numéro marchand unique actif, vous ne pouvez pas effectuer de retraits ni percevoir de gains sur la plateforme. Veuillez acheter et activer votre numéro marchand unique.");
      return;
    }

    const amountNum = parseFloat(withdrawalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError("Veuillez saisir un montant de retrait valide.");
      return;
    }

    if (currentUser.wallet.available < amountNum) {
      setWithdrawError("Votre solde portefeuille disponible est insuffisant.");
      return;
    }

    setIsWithdrawalProcessing(true);
    setWithdrawalSuccessState(false);

    // Build specific details depending on the chosen withdrawal method
    let detailsString = "";
    if (withdrawMethodSelected === "Carte Bancaire") {
      detailsString = `Retrait automatique de fonds vers la carte de ${withdrawCardName || currentUser.fullName} (•••• ${withdrawCardNumber.replace(/\s/g, "").slice(-4) || "4242"}, ${withdrawCountry})`;
    } else if (withdrawMethodSelected === "Virement Bancaire") {
      detailsString = `Virement bancaire SEPA/BCEAO vers l'IBAN ${withdrawIBAN || "BJ60..."} (${withdrawCardName || currentUser.fullName}, ${withdrawCountry})`;
    } else {
      detailsString = `Retrait Mobile Money instantané vers le numéro ${withdrawPhone || currentUser.phone} (Opérateur : ${withdrawMethodSelected}, Pays : ${withdrawCountry})`;
    }

    // Simulate real network communication with African operators or Visa/Mastercard clearing networks
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: amountNum,
          currency: withdrawCurrency, // Use selected country currency
          method: `Retrait Kkiapay / ${withdrawMethodSelected}`,
          details: detailsString
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || "Échec du traitement automatique de votre retrait.");
        setIsWithdrawalProcessing(false);
        return;
      }

      setWithdrawalSuccessState(true);
      setWithdrawSuccess(`Félicitations ! Votre retrait automatique de ${amountNum} ${withdrawCurrency} via ${withdrawMethodSelected} a été traité et transféré avec succès de façon instantanée.`);
      setWithdrawalAmount("");
      setWithdrawPhone("");
      setWithdrawCardNumber("");
      setWithdrawCardName("");
      setWithdrawIBAN("");
      
      await syncPlatformData(currentUser.id);
    } catch (e) {
      setWithdrawError("Erreur lors de la communication de prélèvement avec l'opérateur. Veuillez réessayer.");
    } finally {
      setIsWithdrawalProcessing(false);
    }
  };

  // Admin Reviews Proof Submission
  const handleReviewSubmission = async (subId: string, status: "approved" | "rejected" | "disputed") => {
    if (!currentUser) return;
    const feedback = adminFeedbackText[subId] || "Soumission validée par l'audit administratif.";

    try {
      const response = await fetch("/api/admin/submissions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: subId,
          status,
          feedback,
          operatorId: currentUser.id
        })
      });

      if (response.ok) {
        setAdminMsg(`La preuve a été marquée comme : ${status === 'approved' ? 'Tâche accomplie' : status === 'disputed' ? 'Instruction de correction' : 'Tâche non accomplie'}.`);
        await syncPlatformData(currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin reviews pending withdrawal
  const handleReviewWithdrawal = async (txId: string, status: "completed" | "failed") => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/admin/withdrawals/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txId,
          status,
          operatorId: currentUser.id
        })
      });

      if (response.ok) {
        setAdminMsg(`Le retrait financier a été mis à jour avec le statut : ${status}`);
        await syncPlatformData(currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // User initiates deposit - Opens secure Kkiapay West Africa payment gateway
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setDepositError(null);
    setDepositSuccess(null);

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError("Veuillez saisir un montant de dépôt valide supérieur à 0.");
      return;
    }

    // Detect user country
    const userCountryRaw = (currentUser.country || "").toLowerCase();
    let detectedCountry = "Bénin";
    let detectedMethod = "MTN Mobile Money";

    if (userCountryRaw.includes("benin") || userCountryRaw.includes("bénin")) {
      detectedCountry = "Bénin";
      detectedMethod = "MTN Mobile Money";
    } else if (userCountryRaw.includes("togo")) {
      detectedCountry = "Togo";
      detectedMethod = "TMoney";
    } else if (userCountryRaw.includes("ivoire") || userCountryRaw.includes("ci")) {
      detectedCountry = "Côte d'Ivoire";
      detectedMethod = "Wave";
    } else if (userCountryRaw.includes("sénégal") || userCountryRaw.includes("senegal") || userCountryRaw.includes("sn")) {
      detectedCountry = "Sénégal";
      detectedMethod = "Wave";
    } else if (userCountryRaw.includes("cameroun") || userCountryRaw.includes("cameroon") || userCountryRaw.includes("cm")) {
      detectedCountry = "Cameroun";
      detectedMethod = "MTN Mobile Money";
    }

    setKkiapayCountry(detectedCountry);
    setKkiapayMethod(detectedMethod);
    setKkiapayPhone(currentUser.phone || "");
    setKkiapayCardNumber("4242 4242 4242 4242");
    setKkiapayCardExpiry("12/28");
    setKkiapayCardCvv("737");
    setKkiapayCardName(currentUser.fullName || "");
    setKkiapayStep("form");
    setKkiapayPin("");
    setKkiapayUssdStep(1);
    setIsPaymentConfirmationOpen(true);
  };

  // Process Kkiapay confirmation steps
  const handleStartKkiapayPayment = async () => {
    if (!currentUser) return;
    setIsPaymentProcessing(true);
    setKkiapayStep("processing");
    setKkiapayUssdStep(1);

    // If Card, do instant direct debit processing
    if (kkiapayMethod === "Carte Bancaire") {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await handleExecuteFinalKkiapayDeposit();
    } else {
      // If Mobile money, simulate interactive USSD push
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setKkiapayStep("ussd");
      setKkiapayUssdStep(1);
      setIsPaymentProcessing(false);
    }
  };

  // Finish Kkiapay Mobile Money PIN authentication
  const handleConfirmKkiapayUssdPin = async () => {
    if (!kkiapayPin || kkiapayPin.length < 4) {
      alert("Veuillez saisir votre code PIN secret à 4 chiffres.");
      return;
    }
    setIsPaymentProcessing(true);
    setKkiapayUssdStep(2); // Validating PIN
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await handleExecuteFinalKkiapayDeposit();
  };

  const handleExecuteFinalKkiapayDeposit = async () => {
    if (!currentUser) return;
    try {
      // 1. Direct Purchase via Kkiapay (Mobile money or Card)
      if (paymentPurpose === "purchase") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: paymentPayload.productId,
            quantity: paymentPayload.quantity,
            buyerId: currentUser.id,
            buyerUsername: currentUser.username,
            shippingAddress: paymentPayload.shippingAddress,
            phoneNumber: paymentPayload.phoneNumber,
            email: paymentPayload.email,
            paymentMethod: `Kkiapay (${kkiapayMethod})`
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setDepositError(data.error || "Une erreur s'est produite lors de la validation du paiement Kkiapay.");
          setIsPaymentConfirmationOpen(false);
          return;
        }

        setKkiapayStep("success");
        setDepositAmount("");
        setDepositDetails("");
        await syncPlatformData(currentUser.id);
        return;
      }

      // 2. Direct Campaign Creation via Kkiapay
      if (paymentPurpose === "campaign") {
        // First top up wallet with total campaign cost
        const detailsString = kkiapayMethod === "Carte Bancaire"
          ? `Recharge Yaamaa Pay pour Campagne par Carte (${kkiapayCardName} - Visa •••• 4242)`
          : `Recharge Yaamaa Pay pour Campagne par Mobile Money (${kkiapayMethod} - ${kkiapayPhone})`;

        const depositRes = await fetch("/api/wallet/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            amount: parseFloat(depositAmount),
            currency: currentUser.currency,
            method: `Yaamaa Pay (${kkiapayMethod})`,
            details: detailsString,
            autoApprove: true
          })
        });

        if (!depositRes.ok) {
          const data = await depositRes.json();
          setDepositError(data.error || "Une erreur s'est produite lors du versement Yaamaa Pay.");
          setIsPaymentConfirmationOpen(false);
          return;
        }

        // Now publish campaign from newly loaded wallet
        const campaignRes = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: campTitle,
            description: campDesc,
            category: campCategory,
            type: campType,
            destLink: campLink,
            image: campImage,
            video: campVideo,
            budgetTotal: campBudget,
            rewardPerUser: campReward,
            proofRequirements: campProofRequirements,
            targeting: {
              countries: campTargetCountries,
              languages: [],
              gender: campTargetGender,
              ageMin: 13,
              ageMax: 99,
              interests: [],
              devices: [],
              minUserLevel: campTargetLevel
            },
            schedule: {
              immediate: true
            },
            advertiserId: currentUser.id
          })
        });

        const campData = await campaignRes.json();
        if (!campaignRes.ok) {
          setDepositError(campData.error || "Échec de publication de la campagne après paiement.");
          setIsPaymentConfirmationOpen(false);
          return;
        }

        // Reset campaign form fields
        setCampTitle("");
        setCampDesc("");
        setCampLink("");
        setCampType("like_post");
        setCampBudget(100);
        setCampReward(0.20);
        setWizardStep(1);

        // Auto approve campaign in sandbox if user is admin/founder, else set pending
        if (currentUser.role === "admin" || currentUser.role === "founder") {
          await fetch(`/api/campaigns/${campData.campaign.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "active", operatorId: currentUser.id })
          });
        }

        setKkiapayStep("success");
        setDepositAmount("");
        setDepositDetails("");
        await syncPlatformData(currentUser.id);
        return;
      }

      // 3. Standard Wallet Deposit
      const detailsString = kkiapayMethod === "Carte Bancaire"
        ? `Recharge Yaamaa Pay par Carte (${kkiapayCardName} - Visa •••• 4242)`
        : `Recharge Yaamaa Pay par Mobile Money (${kkiapayMethod} - ${kkiapayPhone})`;

      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: parseFloat(depositAmount),
          currency: currentUser.currency,
          method: `Yaamaa Pay (${kkiapayMethod})`,
          details: detailsString,
          autoApprove: true // Instant automatic wallet credit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setDepositError(data.error || "Une erreur s'est produite lors de la validation du paiement Yaamaa Pay.");
        setIsPaymentConfirmationOpen(false);
        return;
      }

      setKkiapayStep("success");
      setDepositAmount("");
      setDepositDetails("");
      await syncPlatformData(currentUser.id);
    } catch (err) {
      setDepositError("Erreur de connexion avec la passerelle Yaamaa Pay. Veuillez réessayer.");
      setIsPaymentConfirmationOpen(false);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Admin reviews pending deposit
  const handleReviewDeposit = async (txId: string, status: "completed" | "failed") => {
    if (!currentUser) return;
    setAdminMsg(null);
    try {
      const res = await fetch("/api/admin/deposits/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txId,
          status,
          operatorId: currentUser.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMsg(`Erreur: ${data.error}`);
        return;
      }
      setAdminMsg(status === "completed" ? "Le dépôt a été approuvé avec succès et le solde disponible crédité !" : "Le dépôt a été décliné.");
      await syncPlatformData(currentUser.id);
    } catch (err) {
      setAdminMsg("Erreur réseau lors de la validation du dépôt.");
    }
  };

  // Admin configures global settings (tariffs and commissions)
  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setAdminMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isWithdrawalFrozen: adminIsFreezingWithdrawals,
          platformFeePercentage: parseFloat(adminFeePercent),
          minWithdrawalAmount: parseFloat(adminMinWithdrawal),
          baseReward: parseFloat(adminBaseReward),
          defaultCommission: parseFloat(adminDefaultCommission),
          merchantNumberPrice: parseFloat(adminMerchantNumberPrice),
          merchantPremiumPrice: parseFloat(adminMerchantPremiumPrice),
          merchantGoldPrice: parseFloat(adminMerchantGoldPrice),
          merchantDiamondPrice: parseFloat(adminMerchantDiamondPrice),
          referralProgramEnabled: adminReferralEnabled,
          referralCommissionMode: adminReferralMode,
          referralCommissionValue: parseFloat(adminReferralValue),
          referralMaxEarningsCap: parseFloat(adminReferralMaxCap),
          referralMaxReferralsPerUser: parseInt(adminReferralMaxReferrals, 10),
          operatorId: currentUser.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMsg(`Erreur: ${data.error}`);
        return;
      }
      setAdminMsg("Les tarifs globaux, minimums de retrait et commissions de Yaamaa ont été mis à jour avec privilège administratif !");
      await syncPlatformData(currentUser.id);
    } catch (err) {
      setAdminMsg("Erreur réseau lors de l'enregistrement des paramètres administratifs.");
    }
  };

  // Traiter l'achat du numéro marchand unique
  const handlePurchaseMerchantNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setMerchantStep("processing");

    try {
      const response = await fetch("/api/users/purchase-merchant-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          paymentMethod: merchantPayMethod,
          paymentPhone: merchantPayPhone,
          paymentName: merchantPayName,
          packType: merchantPackTypeSelection
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(`Erreur: ${data.error || "Une erreur est survenue lors du paiement."}`);
        setMerchantStep("form");
        return;
      }

      setGeneratedMerchantNumber(data.merchantNumber);
      setMerchantWithin30Days(data.within30Days);
      setMerchantStep("processing");
      
      // Add a small nice delay for visual validation simulation
      setTimeout(async () => {
        setMerchantStep("success");
        await syncPlatformData(currentUser.id);
      }, 1800);
    } catch (err) {
      alert("Erreur réseau ou problème lors du traitement du paiement.");
      setMerchantStep("form");
    }
  };

  // Admin deletes campaign definitively
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette campagne et toutes ses preuves de tâches associées?")) return;
    setAdminMsg(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}?operatorId=${currentUser.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMsg(`Erreur: ${data.error}`);
        return;
      }
      setAdminMsg("La campagne a été supprimée avec succès du réseau.");
      await syncPlatformData(currentUser.id);
    } catch (err) {
      setAdminMsg("Erreur de connexion. Impossible de supprimer la campagne.");
    }
  };

  // Founder promotes/demotes administrator
  const handleFounderRoleToggle = async (targetId: string, currentRole: string) => {
    if (!currentUser || currentUser.role !== "founder") return;
    const action = currentRole === "admin" ? "demote" : "promote";

    try {
      const response = await fetch("/api/founder/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetId,
          action,
          operatorId: currentUser.id
        })
      });

      if (response.ok) {
        setAdminMsg(`Permissions d'administration mises à jour.`);
        await syncPlatformData(currentUser.id);
      } else {
        const d = await response.json();
        alert(d.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Critical Settings (Founder Only)
  const handleSaveFounderSettings = async () => {
    if (!currentUser || currentUser.role !== "founder") return;
    try {
      const countriesArr = critSuspendedCountries.split(",").map(c => c.trim()).filter(Boolean);
      const currenciesArr = critSuspendedCurrencies.split(",").map(c => c.trim()).filter(Boolean);

      const response = await fetch("/api/founder/settings/critical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isWithdrawalFrozen: critWithdrawalFrozen,
          suspendedCountries: countriesArr,
          suspendedCurrencies: currenciesArr,
          platformFeePercentage: critPlatformFee,
          operatorId: currentUser.id
        })
      });

      if (response.ok) {
        setAdminMsg("Paramètres de sécurité généraux mis à jour par le fondateur.");
        await syncPlatformData(currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Restore State from Control Backup Checkpoint
  const handleRestoreState = async () => {
    if (!currentUser || currentUser.role !== "founder") return;
    if (!confirm("Voulez-vous restaurer les données à leur point d'origine ? Votre configuration et historique récents seront écrasés.")) return;

    try {
      const response = await fetch("/api/founder/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: currentUser.id })
      });

      const d = await response.json();
      if (response.ok) {
        alert(d.message);
        await syncPlatformData(currentUser.id);
      } else {
        alert(d.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run Yaamaa Intelligent AI Advice
  const triggerAiGuidance = async () => {
    setAiResponseText("");
    setIsAiLoading(true);

    let payload: any = {};
    if (aiChatType === "advertiser_create") {
      payload = {
        title: campTitle || "Campagne Exemple Booster de visibilité",
        description: campDesc || "Abonnez vous et laissez un mème sur ma dernière vidéo Instagram.",
        type: campType,
        category: campCategory
      };
    } else if (aiChatType === "participant_recommend") {
      payload = {
        username: currentUser?.username || "Guest",
        level: currentUser?.level || 1,
        country: currentUser?.country || "Sénégal",
        interests: "Divertissement, Réseaux Sociaux, Technologies"
      };
    } else {
      payload = { message: aiCustomPrompt || "Qu'est ce que Yaamaa ?" };
    }

    try {
      const response = await fetch("/api/ai/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: aiChatType, payload })
      });

      const d = await response.json();
      setAiResponseText(d.guide || "Aucune réponse de l'assistant.");
      setIsAiLoading(false);
    } catch (err) {
      setAiResponseText("Échec de communication avec l'IA interne de Yaamaa.");
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <Coins className="h-6 w-6 text-emerald-600 absolute animate-pulse" />
        </div>
        <div className="text-center font-sans">
          <h2 className="text-sm font-bold tracking-wider text-gray-900 uppercase">Synchronisation de Yaamaa...</h2>
          <p className="text-xs text-gray-500 mt-1">Veuillez patienter pendant la mise en relation avec le serveur sécurisé.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_55%)] pointer-events-none" id="auth_ambient"></div>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md z-10 space-y-8 animate-fade-in" id="auth_container">
          
          {/* PLATFORM BRAND HEADER */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/20 bg-slate-900">
              <img src={yaamaaLogo} alt="Yaamaa Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 translate="no" className="notranslate mt-6 text-3xl font-black tracking-tight text-white font-heading">
              Yaam<span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">aa</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest align-middle">
                {t.edition}
              </span>
            </h1>
            <p className="mt-2 text-[13px] font-black text-emerald-400 uppercase tracking-widest">
              {t.slogan}
            </p>
            <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              La plateforme collaborative et sécurisée d'opportunités globales.
            </p>
          </div>

          {/* ALERTS */}
          {authErrorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-xs text-rose-400 font-semibold" id="auth_error_alert">
              ⚠️ {authErrorMsg}
            </div>
          )}
          {authSuccessMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-xs text-emerald-400 font-semibold" id="auth_success_alert">
              ✔ {authSuccessMsg}
            </div>
          )}

          {/* FORGOT PASSWORD SCREEN */}
          {forgotPasswordActive ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4" id="forgot_password_pane">
              <h3 className="text-sm font-black uppercase text-white tracking-wider border-b border-gray-800 pb-3">
                Récupération de mot de passe
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Renseignez votre adresse e-mail d'inscription. Notre système simulera la récupération ou rappellera votre mot de passe sandbox d'évaluation.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Adresse E-mail</label>
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent font-sans"
                    placeholder="Ex: amelie@yaamaa.com"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordActive(false);
                      setAuthErrorMsg(null);
                      setAuthSuccessMsg(null);
                    }}
                    className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold text-xs uppercase rounded-xl hover:bg-gray-750 transition"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-555 text-white font-bold text-xs uppercase rounded-xl transition shadow"
                  >
                    Récupérer
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* PRIMARY LOGIN / REGISTER FORM CARD */
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative" id="auth_form_pane">
              
              {/* TAB SELECTOR Header */}
              <div className="flex border-b border-gray-800 pb-4 mb-6">
                <button
                  id="tab_auth_login"
                  type="button"
                  onClick={() => {
                    setAuthScreenMode("login");
                    setAuthErrorMsg(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 text-center font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition ${
                    authScreenMode === "login"
                      ? "border-emerald-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Se Connecter
                </button>
                <button
                  id="tab_auth_register"
                  type="button"
                  onClick={() => {
                    setAuthScreenMode("register");
                    setAuthErrorMsg(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 text-center font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition ${
                    authScreenMode === "register"
                      ? "border-emerald-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Créer un compte
                </button>
              </div>

              {/* 1. LOGIN MODE VIEW */}
              {authScreenMode === "login" && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                      placeholder="Ex: mamadou@yaamaa.com"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordEmail(loginEmail);
                          setForgotPasswordActive(true);
                          setAuthErrorMsg(null);
                          setAuthSuccessMsg(null);
                        }}
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    id="login_submit_btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 bg-emerald-600 font-bold text-white text-xs tracking-wider uppercase rounded-xl hover:bg-emerald-555 transition shadow"
                  >
                    {isLoading ? "Vérification..." : "Se connecter"}
                  </button>
                </form>
              )}

              {/* 2. REGISTER MODE VIEW */}
              {authScreenMode === "register" && (
                <form onSubmit={handleEmailRegister} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nom et Prénom</label>
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                      placeholder="Ex: Babacar Ndiaye"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Adresse E-mail</label>
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: babacar@gmail.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pays de Résidence</label>
                      <select
                        value={registerCountry}
                        onChange={(e) => setRegisterCountry(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white cursor-pointer"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Code de parrainage</label>
                      <input
                        type="text"
                        value={registerReferral}
                        onChange={(e) => setRegisterReferral(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono"
                        placeholder="BOSS2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Mot de passe</label>
                      <input
                        type="password"
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono"
                        placeholder="Créer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Confirmer</label>
                      <input
                        type="password"
                        required
                        value={registerConfirm}
                        onChange={(e) => setRegisterConfirm(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono"
                        placeholder="Répéter"
                      />
                    </div>
                  </div>

                  <button
                    id="register_submit_btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-emerald-600 font-bold text-white text-xs tracking-wider uppercase rounded-xl hover:bg-emerald-550 transition shadow"
                  >
                    {isLoading ? "Création du compte..." : "Créer mon Compte"}
                  </button>
                </form>
              )}

              {/* SEPARATOR */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-3 text-[10px] font-black tracking-widest text-gray-500">OU POUR SIMPLIFIER</span>
                </div>
              </div>

              {/* GOOGLE INTEGRATION INITIATION BUTTON */}
              <button
                id="google_signin_btn"
                type="button"
                onClick={() => {
                  setGoogleStep("select");
                  setShowGoogleAccountsSelector(true);
                  setAuthErrorMsg(null);
                  setAuthSuccessMsg(null);
                }}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-bold text-xs tracking-wider uppercase rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.71l3.27-3.27C17.67 1.54 15 0 12 0 7.35 0 3.4 2.67 1.48 6.56l3.84 2.98c.9-2.7 3.43-4.5 6.68-4.5z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55v2.95h3.81c2.23-2.05 3.6-5.07 3.6-8.65z"/>
                  <path fill="#FBBC05" d="M5.32 14.52c-.22-.65-.35-1.35-.35-2.07s.13-1.42.35-2.07L1.48 6.56C.53 8.47 0 10.63 0 12.92c0 2.29.53 4.45 1.48 6.36l3.84-2.98s-.35-.61-.35-1.76z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.92l-3.81-2.95c-1.06.71-2.42 1.13-4.15 1.13-3.25 0-5.78-2.22-6.68-4.92L1.48 17.26C3.4 21.15 7.35 24 12 24z"/>
                </svg>
                Se connecter avec Google
              </button>

            </div>
          )}

          {/* Slogan & Copy footer */}
          <div className="text-center text-[10.5px] text-gray-500 space-y-1">
             <p className="font-mono uppercase tracking-widest text-[9.5px]">Yaamaa Secure Auth Engine &copy; 2026</p>
             <p>« working space » — Plateforme de collaboration, commerce et de services sécurisés.</p>
          </div>

        </div>

        {/* STEP-BY-STEP GOOGLE ACCOUNT INTEGRATION SIMULATOR DIALOG */}
        {showGoogleAccountsSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in" id="google_virtual_popup">
            <div className="bg-white border text-gray-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
              
              {/* Header */}
              <div className="text-center pb-4 mb-4 border-b">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-emerald-600 mb-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Sign in with Google</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Authentification sécurisée sandbox Google.</p>
              </div>

              {/* alerts inside popup */}
              {authErrorMsg && (
                <div className="mb-3 bg-rose-50 border border-rose-150 p-2.5 rounded-lg text-[11px] text-rose-600 font-bold">
                  {authErrorMsg}
                </div>
              )}

              {/* STEP 1: SELECT EXISTING TEST PROFILE OR TYPE CUSTOM */}
              {googleStep === "select" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">Sélectionnez un compte Google de test disponible :</p>
                  
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {users.map((usr) => (
                      <button
                        key={usr.id}
                        type="button"
                        onClick={() => handleGoogleAccountSelected(usr.email, usr.name)}
                        className="w-full p-2.5 hover:bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between text-left transition select-none active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={usr.avatar} alt={usr.name} className="h-7 w-7 rounded-full object-cover border" referrerPolicy="no-referrer" />
                          <div>
                            <span className="text-xs font-bold text-gray-900 block leading-tight">{usr.name}</span>
                            <span className="text-[9.5px] text-gray-500 font-mono block leading-tight">{usr.email}</span>
                          </div>
                        </div>
                        <span className="text-[8.5px] bg-slate-105 text-slate-500 uppercase px-1 rounded font-black font-sans">{usr.role}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] text-gray-500 mb-1.5">Ou connectez un nouvel e-mail Google personnalisé :</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Ex: dakar.dev@gmail.com"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        className="flex-1 bg-slate-50 border border-gray-200 rounded-xl p-2 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!googleEmail || !googleEmail.includes("@")) {
                            setAuthErrorMsg("Veuillez renseigner un email Google valide.");
                            return;
                          }
                          // Extract a generic name from email
                          const parts = googleEmail.split("@")[0];
                          const fallbackName = parts.charAt(0).toUpperCase() + parts.slice(1);
                          handleGoogleAccountSelected(googleEmail, fallbackName);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGoogleAccountsSelector(false)}
                      className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2A: EXISTING GOOGLE PROFILE - PROMPT OLD PASSWORD */}
              {googleStep === "prompt_old" && (
                <form onSubmit={handleGoogleOldUserSubmit} className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 text-xs">
                    <p className="text-gray-600">Compte existant lié détecté :</p>
                    <p className="font-bold text-gray-900 mt-1">{googleName} ({googleEmail})</p>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Veuillez renseigner le mot de passe de ce compte pour valider la clé d'authentification Google :
                  </p>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Votre mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      placeholder="Ex: password123"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setGoogleStep("select")}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-750 rounded-xl font-bold text-xs"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow"
                    >
                      {isLoading ? "Vérification..." : "Se connecter"}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2B: NEW GOOGLE PROFILE - REGISTER COMPLEMENTS AND CREATE PASSWORD */}
              {googleStep === "prompt_new" && (
                <form onSubmit={handleGoogleNewUserSubmit} className="space-y-3.5">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-emerald-800">
                    <span>Création de profil Google connecté : </span>
                    <strong className="block">{googleName} ({googleEmail})</strong>
                  </div>

                  <p className="text-xs text-gray-500">
                    Pour finaliser votre nouveau compte via Google, merci de fournir ces paramètres :
                  </p>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Numéro de téléphone</label>
                    <input
                      type="tel"
                      required
                      value={googlePhone}
                      onChange={(e) => setGooglePhone(e.target.value)}
                      placeholder="Ex: +221771234567"
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Pays de résidence</label>
                      <select
                        value={googleCountry}
                        onChange={(e) => setGoogleCountry(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none cursor-pointer"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mot de passe</label>
                      </div>
                      <input
                        type="password"
                        required
                        value={googlePassword}
                        onChange={(e) => setGooglePassword(e.target.value)}
                        placeholder="Créer mot de passe"
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg text-[9.5px] text-gray-500 font-mono">
                    * Le code fondateur <strong className="text-emerald-600">BOSS2026</strong> vous est automatiquement appliqué en parrain.
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setGoogleStep("select")}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow"
                    >
                      {isLoading ? "Création..." : "Créer le compte"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/55 text-gray-800 selection:bg-emerald-500 selection:text-white flex flex-col font-sans overflow-x-hidden">
      
      {/* FOUNDER IMPERSONATION BANNER */}
      {impersonatorId && (
        <div className="bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-950 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-2xl z-50 sticky top-0 border-b border-rose-500/30">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">👑 Mode Fondateur Actif</span>
            <span>• Vous consultez le compte de <strong>{currentUser?.name || currentUser?.username}</strong> (@{currentUser?.username})</span>
          </div>
          <button
            type="button"
            onClick={handleReturnToFounder}
            className="bg-white text-rose-950 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5"
          >
            ⬅️ Retourner à mon compte Administrateur / Fondateur
          </button>
        </div>
      )}

      {/* PWA INSTALLATION BANNER */}
      <PwaInstallBanner />

      {/* HEADER / NAVIGATION BAR */}
      <div className={isChatActive ? "hidden lg:block" : "block"}>
        <Navbar 
          currentUser={currentUser}
          usersList={users}
          onChangeUser={handleUserChange}
          onOpenAuth={() => {
            setAuthScreenMode("register");
            setAuthModalOpen(true);
          }}
          currentView={currentView}
          onNavigate={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onLogout={handleLogout}
          currentLanguage={currentLanguage}
          onChangeLanguage={handleLanguageChange}
          onViewProfile={(uid) => setSelectedProfileUserId(uid)}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
          onOpenMerchantModal={() => {
            if (currentUser) {
              setMerchantPayPhone(currentUser.phone || "");
              setMerchantPayName(currentUser.name || "");
              setMerchantStep("form");
              setIsMerchantModalOpen(true);
            }
          }}
          onOpenVirtualGifts={() => {
            setCurrentView("discussions");
            setInitiallyOpenGiftsModal(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          notifications={currentUser?.notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onOpenCallModal={() => setIsCallModalOpen(true)}
          onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        />
      </div>

      {/* EMERGENCY BULLETINS FROM THE FOUNDER SYSTEM */}
      {systemMetrics?.settings?.isWithdrawalFrozen && (
        <div className="bg-amber-500 text-white font-semibold text-xs py-2 px-4 flex items-center justify-center gap-2" id="withdraw_frozen_bulletin">
          <AlertTriangle className="h-4 w-4 animate-bounce" />
          <span>Alerte Système : Les retraits de fonds sont momentanément gelés sur l'ensemble de la plateforme pour cause de maintenance de sécurité.</span>
        </div>
      )}

      {/* EXHORTATION AU NUMÉRO MARCHAND (VISIBLE PARTOUT POUR LES PARTICIPANTS ET ADVERTISERS SANS NUMÉRO MARCHAND) */}
      {currentUser && currentUser.role !== "admin" && currentUser.role !== "founder" && !currentUser.merchantNumber && (() => {
        let remainingDays = 30;
        if (currentUser.createdAt) {
          const regDate = new Date(currentUser.createdAt);
          const today = new Date();
          const diffTime = today.getTime() - regDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          remainingDays = Math.max(0, 30 - diffDays);
        }

        const isPastDue = remainingDays <= 0;

        return (
          <div className={isChatActive ? "hidden lg:block" : "block"}>
            <div className={`py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans tracking-wide transition border-b shadow-sm ${
              isPastDue 
                ? "bg-rose-50 text-rose-800 border-rose-200" 
                : "bg-indigo-50 text-indigo-900 border-indigo-200"
            }`} id="merchant_number_warning_banner">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isPastDue ? "bg-rose-100 animate-pulse" : "bg-indigo-100 animate-pulse"}`}>
                  <span className="text-base">🌟</span>
                </div>
                <div>
                  <p className="font-extrabold text-sm flex items-center gap-2">
                    {isPastDue ? (
                      <span className="text-rose-600">Commissions de parrainage désactivées définitivement ! ⚠️</span>
                    ) : (
                      <span>Activez votre Numéro Marchand unique pour toucher vos gains ! 📈</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {isPastDue ? (
                      <span>Vous avez dépassé le délai légal de 30 jours après votre inscription. Vous ne pouvez plus toucher de commissions d'affiliation sur vos filleuls, même en achetant un numéro marchand maintenant.</span>
                    ) : (
                      <span>
                        Gagnez <strong>50% de commission immédiate</strong> sur chaque achat de numéro marchand par vos filleuls ! 
                        Il vous reste <strong className="text-indigo-750 font-extrabold">{remainingDays} jours</strong> pour activer votre numéro marchand et conserver votre éligibilité de parrainage à vie.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMerchantPayPhone(currentUser.phone || "");
                    setMerchantPayName(currentUser.name || "");
                    setMerchantStep("form");
                    setIsMerchantModalOpen(true);
                  }}
                  className={`px-4 py-2 font-black uppercase text-[10px] tracking-wider rounded-xl transition shadow-xs cursor-pointer ${
                    isPastDue
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isPastDue ? "Acheter un Numéro" : "Activer mon Numéro"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRIMARY VIEWS LAYOUT */}
      {!isMenuOpen ? (
        <>
        <main className={`flex-1 ${isChatActive ? "pt-0 lg:pt-32 lg:sm:pt-36" : "pt-32 sm:pt-36"}`}>

        {/* BOUTIQUE MARKETPLACE VIEW */}
        {currentView === "boutique" && (
          <BoutiqueView
            currentUser={currentUser}
            shops={shops}
            products={products}
            orders={orders}
            disputes={disputes}
            usersList={users}
            syncPlatformData={() => syncPlatformData(currentUser?.id)}
            onNavigate={(v) => setCurrentView(v)}
            onTriggerKkiapayPayment={(amount, payload) => {
              setDepositAmount(amount.toString());
              setPaymentPurpose("purchase");
              setPaymentPayload(payload);
              setKkiapayCountry("Bénin");
              setKkiapayMethod("MTN Mobile Money");
              setKkiapayPhone(currentUser?.phone || "");
              setKkiapayCardNumber("4242 4242 4242 4242");
              setKkiapayCardExpiry("12/28");
              setKkiapayCardCvv("737");
              setKkiapayCardName(currentUser?.fullName || "");
              setKkiapayStep("form");
              setKkiapayPin("");
              setKkiapayUssdStep(1);
              setIsPaymentConfirmationOpen(true);
            }}
            onViewProfile={(uid) => setSelectedProfileUserId(uid)}
            onStartChat={handleStartChat}
            onOpenMerchantModal={() => {
              if (currentUser) {
                setMerchantPayPhone(currentUser.phone || "");
                setMerchantPayName(currentUser.name || "");
                setMerchantStep("form");
                setIsMerchantModalOpen(true);
              }
            }}
          />
        )}

        {/* PROMOTIONS CAMPAIGNS VIEW */}
        {currentView === "promotions" && (
          <PromotionsView
            currentUser={currentUser}
            promoCampaigns={promoCampaigns}
            syncPlatformData={() => syncPlatformData(currentUser?.id)}
            onNavigate={(v) => setCurrentView(v)}
          />
        )}

        {/* SUPPLIERS & DELIVERERS MODULE */}
        {currentView === "suppliers_deliverers" && (
          <SuppliersDeliverersView
            currentUser={currentUser}
            currentLanguage={currentLanguage}
            onNavigate={(v) => setCurrentView(v)}
          />
        )}

        {/* SOCIAL & DISCUSSION MODULE */}
        {currentView === "discussions" && currentUser && (
          <SocialView
            currentUser={currentUser}
            usersList={users}
            currentLanguage={currentLanguage}
            onRefreshUser={() => syncPlatformData(currentUser.id)}
            onOpenProfile={() => setAuthModalOpen(true)}
            initialActiveFriendId={discussionFriendId}
            onViewProfile={(uid) => setSelectedProfileUserId(uid)}
            onActiveConversationChange={setIsChatActive}
            initiallyOpenGiftsModal={initiallyOpenGiftsModal}
            onResetInitiallyOpenGiftsModal={() => setInitiallyOpenGiftsModal(false)}
            systemMetrics={systemMetrics}
            onNavigate={(view, subTab) => {
              setCurrentView(view);
              if (subTab) {
                setWalletTab(subTab);
              }
            }}
          />
        )}

        {/* 1. HOMEPAGE VIEW */}
        {currentView === "home" && (
          <div id="view_home" className="animate-fade-in">
            {/* HERO BANNER */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20 px-4 md:py-28">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)]"></div>
              <div className="mx-auto max-w-7xl text-center relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-500/10 mb-6">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
                  <SafeText text={t.hero_title} />
                </span>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gray-950 sm:text-6xl max-w-4xl mx-auto leading-tight">
                  {currentLanguage === "fr" ? "Créez, Collaborez & Prospérez." : "Create, Collaborate & Prosper."} <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    {currentLanguage === "fr" ? "Votre passerelle d'opportunités et de commerce intelligent." : "Your gateway to smart commerce and endless opportunities."}
                  </span>
                </h1>
                <p className="mt-6 text-base sm:text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
                  {currentLanguage === "fr" 
                    ? "Bienvenue sur Yaamaa, la plateforme unifiée qui révolutionne le travail indépendant, la micro-rémunération et le commerce de proximité. Que vous soyez créateur de services, vendeur de produits ou à la recherche d'activités rémunératrices, nous vous offrons un écosystème sécurisé pour valoriser votre temps et réaliser vos ambitions." 
                    : "Welcome to Yaamaa, the unified ecosystem revolutionizing freelancing, micro-earnings, and digital commerce. Whether you are selling quality products, offering customized services, or completing tasks, we provide a secure hub to maximize your potential and reward your efforts."}
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <button
                    id="hero_btn_missions"
                    onClick={() => setCurrentView("missions")}
                    className="flex items-center gap-2 rounded-xl bg-gray-950 px-6 py-4 text-sm font-semibold text-white shadow-xl hover:bg-gray-800 transition active:scale-95 cursor-pointer"
                  >
                    {currentLanguage === "fr" ? "Découvrir les Missions" : "Discover Missions"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    id="hero_btn_invite"
                    onClick={() => {
                      if (!currentUser) {
                        setAuthScreenMode("register");
                        setAuthModalOpen(true);
                        setAuthSuccessMsg(currentLanguage === "fr" ? "Inscrivez-vous pour obtenir votre lien de parrainage personnalisé et commencer à inviter vos contacts !" : "Register to get your personalized referral link and start inviting your contacts!");
                      } else {
                        setIsShareModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    {currentLanguage === "fr" ? "Inviter des Filleuls" : "Invite Referrals"}
                  </button>
                </div>

                {/* OFFICIAL YAMA COVER BANNER SHOWCASE */}
                <div className="mt-12 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-150/80 relative group bg-white p-2 animate-fade-in">
                  <div className="rounded-2xl overflow-hidden border border-gray-200/60 bg-slate-900">
                    <img
                      src="/src/assets/images/yaamaa_cover_1783033730508.jpg"
                      alt="Yaamaa Official Cover Banner"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-102"
                    />
                  </div>
                </div>

                {/* PARRAINAGE PROMOTIONAL CARD */}
                <div className="mt-10 max-w-3xl mx-auto bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/50 border border-emerald-500/15 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-left shadow-sm animate-fade-in" id="referral_promo_banner">
                  <div className="space-y-1.5 flex-1">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      <SafeText text={currentLanguage === "fr" ? "🎁 OFFRE SPÉCIALE : PARRAINAGE YAAMAA" : "🎁 SPECIAL OFFER: YAAMAA REFERRAL"} />
                    </span>
                    <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-1.5">
                      {currentLanguage === "fr" ? "Gagnez des Commissions Réelles à Vie !" : "Earn Real Lifetime Commissions!"}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                      {currentLanguage === "fr" 
                        ? <>Invitez vos amis et gagnez <span className="font-extrabold text-emerald-600">10%</span> de commission sur toutes leurs missions, <span className="font-extrabold text-emerald-600">5%</span> sur leurs ventes de Boutique et <span className="font-extrabold text-emerald-600">3%</span> sur leurs achats !</>
                        : <>Invite your friends and earn <span className="font-extrabold text-emerald-600">10%</span> commission on all their missions, <span className="font-extrabold text-emerald-600">5%</span> on their Shop sales, and <span className="font-extrabold text-emerald-600">3%</span> on their purchases!</>}
                    </p>
                  </div>
                  <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setAuthScreenMode("register");
                          setAuthModalOpen(true);
                          setAuthSuccessMsg(currentLanguage === "fr" ? "Inscrivez-vous pour obtenir votre lien de parrainage personnalisé et commencer à inviter vos filleuls !" : "Register to get your personalized referral link and start inviting your referrals!");
                        } else {
                          setIsReferralModalOpen(true);
                        }
                      }}
                      className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-4 rounded-xl transition shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-150 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/20"
                    >
                      <Users className="h-4 w-4" />
                      {currentUser 
                        ? (currentLanguage === "fr" ? "Suivre mes Filleuls" : "Track My Referrals")
                        : (currentLanguage === "fr" ? "Parrainer & Gagner" : "Refer & Earn")}
                    </button>
                  </div>
                </div>

                {/* REAL-TIME KEY STATS */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-gray-100">
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-gray-950 tracking-tight">
                      {systemMetrics?.totalUsers?.toLocaleString() || "15 420"}+
                    </p>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Utilisateurs actifs</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-emerald-600 tracking-tight">
                      {((systemMetrics?.totalDistributed || 14520)).toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Distribués en ligne</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-gray-950 tracking-tight">
                      {systemMetrics?.activeCampaigns || "3"}+
                    </p>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Campagnes Actuelles</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-teal-600 tracking-tight">
                      99.8%
                    </p>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Fiabilité IA</p>
                  </div>
                </div>
              </div>
            </section>

            {/* INTEGRATED MINI DEMONSTRATOR SECTIONS FOR LANDING EXPERIENCE */}
            <section className="bg-white py-16 border-y border-gray-100 px-4">
              <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                      Espace Activité
                    </span>
                    <h2 className="text-2xl font-bold text-gray-950 mt-1">
                      Campagnes Populaires de la Communauté
                    </h2>
                  </div>
                  <button 
                    onClick={() => setCurrentView("missions")}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Voir tout notre catalogue de tâches <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {campaigns.slice(0, 3).map((camp) => (
                    <div 
                      key={camp.id} 
                      className="border border-gray-150 rounded-2xl p-5 hover:shadow-lg transition-all bg-white relative hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-650 px-2 py-1 rounded">
                          {camp.category}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 font-mono flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
                          <Coins className="h-3.5 w-3.5" />
                          +{camp.rewardPerUser.toFixed(2)} {currentUser?.currency || "EUR"}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-gray-950 line-clamp-1">{camp.title}</h3>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{camp.description}</p>
                      
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Places: <strong>{camp.completedCount} / {camp.participantsCount}</strong></span>
                        <button 
                          onClick={() => {
                            setSelectedCampaignForTask(camp);
                            setCurrentView("missions");
                          }}
                          className="bg-gray-950 hover:bg-gray-800 text-white rounded-lg px-3 py-1.5 font-bold transition"
                        >
                          Lancer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CLASSMENT / HIGHEST EARNERS */}
            <section className="py-16 px-4">
              <div className="mx-auto max-w-3xl">
                <div className="text-center mb-10">
                  <h3 className="text-xl font-bold text-gray-900">Membres les plus récompensés ce mois</h3>
                  <p className="text-xs text-gray-500 mt-1">Retours sur expérience et performances de gains réels sur Yaamaa.</p>
                </div>

                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-gray-100">
                    {users.slice(0, 4).map((user, idx) => (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setSelectedProfileUserId(user.id)}
                        >
                          <span className="font-mono text-xs font-black text-gray-450 w-5 text-center">
                            #{idx + 1}
                          </span>
                          <img src={user.avatar} className="h-9 w-9 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition" />
                          <div>
                            <span className="text-xs font-bold text-gray-950 flex items-center gap-1.5 group-hover:text-emerald-600 transition group-hover:underline">
                              {user.name}
                              {user.role === "founder" && <span className="bg-rose-50 text-rose-600 font-mono text-[9px] px-1 rounded normal-case no-underline">Fondateur</span>}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">@{user.username} • Niv. {user.level}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-gray-950 text-emerald-600 block">
                            +{user.wallet.totalEarned.toLocaleString()} {user.currency}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono block">Cumul de micro-travaux</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS & FAQ */}
            <section className="bg-white py-16 border-t border-gray-150 px-4">
              <div className="mx-auto max-w-5xl">
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Testimonial Box */}
                  <div>
                    <h4 className="text-base font-bold text-gray-950 uppercase tracking-wider mb-6">Témoignages récents</h4>
                    <div className="bg-gray-50 rounded-2xl p-6 relative">
                      <p className="text-xs md:text-sm text-gray-650 italic leading-relaxed">
                        "En tant qu'étudiante, Yaamaa m'a permis de financer mon abonnement de transports et mes petits extras mensuels uniquement en aimant des vidéos et en répondant à des sondages. Les virements en Mobile Money sur mon portable sont instantanés et fiables."
                      </p>
                      <div className="mt-5 flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" className="h-8 w-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Amélie Tremblay</p>
                          <p className="text-[10px] text-gray-400">Membre certifiée Niveau 12, Québec</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Quick Accordion */}
                  <div>
                    <h4 className="text-base font-bold text-gray-950 uppercase tracking-wider mb-6">Foire Aux Questions (FAQ)</h4>
                    <div className="space-y-4">
                      <div className="border-b border-gray-100 pb-3">
                        <span className="text-xs font-bold text-gray-900 block">Comment fonctionne la détection anti-fraude ?</span>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Yaamaa AI évalue la plausibilité des preuves textuelles en temps réel avec Gemini. Nous croisons les coordonnées, repérons les captures recadrées et bloquons l'usage de VPN suspect.
                        </p>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <span className="text-xs font-bold text-gray-900 block">Quel est le seuil de retrait minimum ?</span>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Le retrait minimum est fixé à seulement 5 EUR/USD ou 3000 XOF pour s'adapter à nos utilisateurs de tous les pays d'Afrique, d'Europe et d'Amérique.
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Comment recharger mes fonds d'annonceur ?</span>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Rendez-vous sur l'onglet Portefeuille et rechargez via Mobile Money ou Carte de Crédit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. MISSIONS / CAMPAIGNS LISTING VIEW */}
        {currentView === "missions" && (
          <div id="view_missions" className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-950">
                  Catalogue des missions rémunérées
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choisissez des missions qui correspondent à votre profil et générez des compléments de portefeuille.
                </p>
              </div>

              {/* Simulation balance info */}
              <div className="bg-white border border-gray-150 p-2.5 rounded-xl flex items-center gap-3">
                <span className="h-8.5 w-8.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Coins className="h-4.5 w-4.5" />
                </span>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mon solde disponible</span>
                  <p className="font-mono text-xs font-extrabold text-emerald-600 -mt-0.5">
                    {currentUser?.wallet.available.toLocaleString() || "0"} {currentUser?.currency || "EUR"}
                  </p>
                </div>
              </div>
            </div>

            {/* MISSIONS ENGINE BODY GRID */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Mission list (2/3 size) */}
              <div className="lg:col-span-2 space-y-4">
                 {campaigns.filter(c => c.status === "active" || c.status === "pending").map((camp) => {
                  const userSub = submissions.find(s => s.campaignId === camp.id && s.participantId === currentUser?.id);
                  const alreadyDone = !!userSub && userSub.status !== "disputed";
                  const isPendingReview = !!userSub && userSub.status === "pending";
                  const isDisputed = !!userSub && userSub.status === "disputed";

                  return (
                    <div 
                      key={camp.id} 
                      className={`bg-white border rounded-2xl p-5 transition hover:shadow-md relative ${
                        isDisputed ? "border-rose-200 bg-rose-50/5" : alreadyDone ? "border-emerald-200 bg-emerald-50/5" : "border-gray-150"
                      }`}
                    >
                      {/* Badge and Reward strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-[9px] font-bold tracking-wider uppercase text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                          {camp.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {camp.status === "pending" && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded">En Validation Admin</span>
                          )}
                          <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50/70 border border-emerald-500/10 rounded px-2 py-0.5">
                            +{camp.rewardPerUser.toFixed(2)} {currentUser?.currency || "EUR"}
                          </span>
                        </div>
                      </div>

                       {/* Title & Descr */}
                      <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5 flex-wrap">
                        {camp.title}
                        {alreadyDone && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isPendingReview ? "bg-amber-100 text-amber-500" : "bg-emerald-100 text-emerald-600"
                          }`}>
                            {isPendingReview ? "En attente d'avis" : "Effectuée ✔"}
                          </span>
                        )}
                        {isDisputed && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
                            Correction requise ⚠️
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{camp.description}</p>
                      
                      {/* Destination Link */}
                      <div className="mt-4 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl text-xs text-gray-600 border border-gray-100">
                        <Play className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                        <span className="font-semibold text-gray-700">Lien action :</span>
                        <a 
                          href={camp.destLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-emerald-600 hover:underline font-serif inline-flex items-center gap-0.5 truncate"
                        >
                          {camp.destLink}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      {/* Targeting limitations information list */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                        <span>Pays autorisés : <strong>{camp.targeting.countries.join(", ") || "Tous"}</strong></span>
                        <span className="text-gray-200">|</span>
                        <span>Niveau minimum : <strong>Niv. {camp.targeting.minUserLevel}</strong></span>
                        <span className="text-gray-200">|</span>
                        <span>Places restantes : <strong>{camp.participantsCount - camp.completedCount} places</strong></span>
                      </div>

                       {/* Interaction trigger */}
                      {(!alreadyDone || isDisputed) && camp.status === "active" && (
                        <div className="mt-5 pt-3 border-t border-gray-50 flex justify-end">
                          <button
                            id={`start_mission_${camp.id}`}
                            onClick={() => {
                              setSelectedCampaignForTask(camp);
                              setSubmitError(null);
                              setSubmitSuccess(null);
                              if (isDisputed && userSub) {
                                setSubmitProofText(userSub.proofText || "");
                                setSubmitProofLink(userSub.proofLink || "");
                                setSubmitProofFile(userSub.proofFileUrl || "");
                              } else {
                                setSubmitProofText("");
                                setSubmitProofLink("");
                                setSubmitProofFile("");
                              }
                            }}
                            className={`font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                              isDisputed
                                ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                : "bg-gray-950 hover:bg-gray-800 text-white"
                            }`}
                          >
                            {isDisputed ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                            {isDisputed ? "Corriger ma preuve" : "Réaliser la tâche"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {campaigns.filter(c => c.status === "active").length === 0 && (
                  <div className="bg-white border border-gray-150 p-8 rounded-2xl text-center">
                    <p className="text-sm font-bold text-gray-800">Aucune mission disponible pour le moment.</p>
                    <p className="text-xs text-gray-400 mt-1">Les annonceurs mettent régulièrement en ligne de nouvelles opportunités.</p>
                  </div>
                )}
              </div>

              {/* Participation Form Side Block (1/3 size) */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-150 rounded-2xl p-5 sticky top-20">
                  <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-4">
                    <Cpu className="h-4 w-4 text-emerald-500 animate-spin" />
                    Soumettre une preuve
                  </h3>

                  {selectedCampaignForTask ? (() => {
                    const selectedSub = submissions.find(s => s.campaignId === selectedCampaignForTask.id && s.participantId === currentUser?.id);
                    const isDisputed = selectedSub && selectedSub.status === "disputed";

                    return (
                      <form onSubmit={handleSubmitTaskProof} className="space-y-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Mission Sélectionnée</span>
                          <p className="text-xs font-bold text-gray-900 mt-1">{selectedCampaignForTask.title}</p>
                          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Récompense : {selectedCampaignForTask.rewardPerUser} {currentUser?.currency}</p>
                        </div>

                        {isDisputed && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs space-y-1.5" id="disputed_sub_alert">
                            <div className="flex items-center gap-1.5 font-bold">
                              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                              <span>Correction demandée par l'annonceur</span>
                            </div>
                            <p className="text-gray-700 leading-normal">
                              <strong>Raison / Instructions :</strong> "{selectedSub.adminFeedback || "Veuillez corriger votre preuve."}"
                            </p>
                          </div>
                        )}

                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                        <strong className="block text-gray-800 mb-1">Preuves Requis :</strong>
                        {selectedCampaignForTask.proofRequirements}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 uppercase">Texte de preuve (Pseudo, Avis ...)</label>
                          <textarea
                            rows={3}
                            value={submitProofText}
                            onChange={(e) => setSubmitProofText(e.target.value)}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Entrez vos preuves écrites..."
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-600 uppercase">Lien Public de référence (optionnel)</label>
                          <input
                            type="url"
                            value={submitProofLink}
                            onChange={(e) => setSubmitProofLink(e.target.value)}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            placeholder="https://tiktok.com/@votre_pseudo/..."
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-600 uppercase">URL Capture d'écran simulée</label>
                          <input
                            type="text"
                            value={submitProofFile}
                            onChange={(e) => setSubmitProofFile(e.target.value)}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            placeholder="https://imgur.com/screenshot.png"
                          />
                        </div>
                      </div>

                      {submitError && (
                        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex gap-1.5 items-start">
                          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-rose-600 font-semibold">{submitError}</span>
                        </div>
                      )}

                      {submitSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex gap-1.5 items-start">
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-emerald-700 font-semibold">{submitSuccess}</span>
                        </div>
                      )}

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaignForTask(null)}
                          className="w-1/3 border border-gray-200 text-gray-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingProof}
                          className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/15"
                        >
                          {isSubmittingProof ? (
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              Soumettre avec l'IA
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    );
                  })() : (
                    <div className="text-center py-10">
                      <HelpCircle className="h-8 w-8 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-400 mt-2">Cliquez sur « Réaliser la tâche » sur l'une des campagnes actives pour initier la vérification par notre IA.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. CAMPAIGN WIZARD FOR ADVERTISERS */}
        {currentView === "campaign-wizard" && (
          <div id="view_campaign_wizard" className="mx-auto max-w-4xl py-10 px-4 animate-fade-in">
            <div className="border-b border-gray-200 pb-6 mb-8 flex items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-950">
                  Assistant de création de campagne ciblée
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Suivez les étapes minutieuses de création de campagne pour booster votre notoriété digitale.
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                  Étape {wizardStep} de 6
                </span>
              </div>
            </div>

            {/* PROGRESS VISUAL RAIL */}
            <div className="flex items-center justify-between mb-8 px-2 max-w-xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((stp) => (
                <div key={stp} className="flex items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    wizardStep >= stp ? "bg-gray-950 text-white scale-110 shadow-md" : "bg-gray-100 text-gray-400 border"
                  }`}>
                    {stp}
                  </div>
                  {stp < 6 && <div className={`h-1 w-6 sm:w-10 rounded ${wizardStep > stp ? "bg-gray-950" : "bg-gray-150"}`}></div>}
                </div>
              ))}
            </div>

            {/* WIZARD CONTENT BOXES */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 md:p-8">
              
              {/* STEP 1: INFO GEN */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 1 : Informations cruciales de campagne</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-700">Titre accrocheur de la tâche</label>
                      <input
                        type="text"
                        value={campTitle}
                        onChange={(e) => setCampTitle(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Ex: Rechercher sur Google et donner un avis ⭐⭐⭐⭐⭐"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-700">Description détaillée des étapes obligatoires</label>
                      <textarea
                        rows={4}
                        value={campDesc}
                        onChange={(e) => setCampDesc(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Quels sont les gestes précis que le participant doit réaliser ?"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">Catégorie</label>
                      <select
                        value={campCategory}
                        onChange={(e) => setCampCategory(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Social Media">Réseaux Sociaux (TikTok, IG)</option>
                        <option value="Google & Reviews">Recherche & Avis Stores</option>
                        <option value="App Testing">Téléchargement d'Applications</option>
                        <option value="Surveys">Sondages & Questionnaires</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">Lien destination Web / Store</label>
                      <input
                        type="url"
                        value={campLink}
                        onChange={(e) => setCampLink(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="https://testapp.com/..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MISSION TYPES */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 2 : Type de Micro-Travail</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { type: "like_post", label: "Aimer une publication", desc: "TikTok / IG / Facebook" },
                      { type: "follow_account", label: "Suivre un profil", desc: "S'abonner à une chaine" },
                      { type: "watch_video", label: "Regarder une vidéo", desc: "Rétention de plus de 1 min" },
                      { type: "download_app", label: "Télécharger app", desc: "Éprouver sur mobile" },
                      { type: "give_review", label: "Évaluer / Laisser avis", desc: "Avis authentique 5 étoiles" },
                      { type: "custom", label: "Mission Personnalisée", desc: "Cahier des charges libre" }
                    ].map((m) => (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => setCampType(m.type as MissionType)}
                        className={`p-4 border text-left rounded-2xl hover:shadow transition-all ${
                          campType === m.type 
                            ? "border-emerald-500 bg-emerald-50/15 ring-2 ring-emerald-500/10" 
                            : "border-gray-150 bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-900 block">{m.label}</span>
                        <span className="text-[10px] text-gray-400 mt-1 block leading-tight">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-700">Contenu exigé en justificatif (Preuves)</label>
                    <textarea
                      rows={2}
                      value={campProofRequirements}
                      onChange={(e) => setCampProofRequirements(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Pseudonyme TikTok utilisé + Capture d'écran."
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: BUDGETS */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 3 : Budget de Campagne</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block">Budget Total à distribuer ({currentUser?.currency})</label>
                        <input
                          type="number"
                          value={campBudget}
                          onChange={(e) => setCampBudget(Math.max(5, parseFloat(e.target.value) || 5))}
                          className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          min={5}
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">Budget minimal de 5 {currentUser?.currency}</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block">Récompense individuelle par participant</label>
                        <input
                          type="number"
                          step="0.05"
                          value={campReward}
                          onChange={(e) => setCampReward(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                          className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block font-semibold">Conseillé : De 0.15 à 2.00 selon difficulté</span>
                      </div>
                    </div>

                    {/* AUTOMATIC CALCULATIONS */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 flex flex-col justify-between">
                      <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Synthèse des calculs automatique</span>
                      
                      <div className="space-y-1.5 mt-4">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Nombre estimé de participants :</span>
                          <strong className="font-mono text-gray-900">{calculateCampaignSummary().participants} participants</strong>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Frais platefome Commission Yaamaa ({systemMetrics?.settings?.platformFeePercentage}%):</span>
                          <strong className="font-mono text-gray-900">+{calculateCampaignSummary().commission} {currentUser?.currency}</strong>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between text-sm text-gray-950">
                          <span className="font-medium text-emerald-700">Total global à régler :</span>
                          <strong className="font-mono font-bold text-emerald-600">{calculateCampaignSummary().totalToPay} {currentUser?.currency}</strong>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-700 mt-4">
                        Le solde requis sera directement débité de votre portefeuille après validation du paiement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: TARGETING */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 4 : Ciblage Démographique</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700">Filtre Nationalités / Pays</label>
                      <input
                        type="text"
                        value={campTargetCountries.join(", ")}
                        onChange={(e) => setCampTargetCountries(e.target.value.split(",").map(c => c.trim()))}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Ex: Sénégal, France, Canada (Laisser vide pour mondial)"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">Niveau utilisateur minimum exigé</label>
                      <select
                        value={campTargetLevel}
                        onChange={(e) => setCampTargetLevel(parseInt(e.target.value) || 1)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="1">Niveau 1 (Tout utilisateur)</option>
                        <option value="2">Niveau 2 (Expérimenté)</option>
                        <option value="5">Niveau 5 (Élite)</option>
                        <option value="10">Niveau 10 (Gold Expert)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700">Sexe ciblé</label>
                      <div className="flex gap-2 mt-1">
                        {["all", "male", "female"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setCampTargetGender(g as any)}
                            className={`flex-1 py-2 text-xs font-bold border rounded-lg transition ${
                              campTargetGender === g 
                                ? "bg-gray-950 text-white" 
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {g === "all" ? "Mixte" : g === "male" ? "Homme" : "Femme"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SCHEDULING */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 5 : Lancement et Programmation</h3>
                  <div className="bg-gray-50 rounded-2xl p-6 border text-center">
                    <Clock className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                    <span className="text-xs font-bold text-gray-950">Lancement de campagne automatisé</span>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-1">
                      Votre campagne sera automatiquement mise en ligne immédiatement après le traitement de la validation administrative ou l'audit d'IA.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 6: PAYMENT SELECTION */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-950 mb-4">Étape 6 : Méthodes de facturation financières</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardFundingMethod("wallet")}
                      className={`p-4 border text-left rounded-2xl transition ${
                        wizardFundingMethod === "wallet"
                          ? "border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10"
                          : "border-gray-150 hover:bg-gray-50/50 bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-950 block">💳 Balance Interne Yaamaa</span>
                      <p className="text-[10px] text-gray-400 mt-1">Utiliser les fonds disponibles de votre compte de simulation.</p>
                      <p className="text-xs font-extrabold text-emerald-600 mt-3">Disponible: {currentUser?.wallet.available} {currentUser?.currency}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardFundingMethod("kkiapay")}
                      className={`p-4 border text-left rounded-2xl transition ${
                        wizardFundingMethod === "kkiapay"
                          ? "border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10"
                          : "border-gray-150 hover:bg-gray-50/50 bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-650 block">🔒 Passerelle Sécurisée Yaamaa Pay</span>
                      <p className="text-[10px] text-gray-400 mt-1">Paiement direct sécurisé via MTN, Moov, Wave, TMoney ou Carte bancaire.</p>
                      <p className="text-xs font-extrabold text-emerald-600 mt-3">Paiement instantané direct</p>
                    </button>
                  </div>

                  {/* ERROR DISPLAY */}
                  {wizardError && (
                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex gap-1.5 items-start mt-4">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-rose-600 font-bold">{wizardError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* BUTTON SWITCH CONTROLS */}
              <div className="flex justify-between items-center border-t border-gray-100 mt-8 pt-5">
                <button
                  type="button"
                  onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                  disabled={wizardStep === 1}
                  className="px-4 py-2 border rounded-xl text-xs text-gray-600 font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Précédent
                </button>

                {wizardStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Small validate values
                      if (wizardStep === 1 && (!campTitle || !campDesc || !campLink)) {
                        setWizardError("Le titre, les descriptions et le lien sont obligatoires.");
                        return;
                      }
                      setWizardError(null);
                      setWizardStep(wizardStep + 1);
                    }}
                    className="px-4 py-2 bg-gray-950 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    type="button"
                    id="submit_campaign_btn"
                    onClick={handlePublishCampaign}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/10"
                  >
                    Financer et Publier la Campagne
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 4. WALLET / RETRAITS VIEW */}
        {currentView === "wallet" && (
          <div id="view_wallet" className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 animate-fade-in font-sans">
            
            {/* Wallet Header */}
            <div className="border-b border-gray-100 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-black tracking-tight text-gray-950">
                  Portefeuille Financier <span translate="no" className="notranslate">Yaamaa</span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Suivez vos soldes, rechargez vos fonds et retirez vos gains instantanément via la passerelle de paiement d'Afrique de l'Ouest.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2.5 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Passerelle Officielle Yaamaa Pay S.A.
                </span>
              </div>
            </div>

            {/* SECTION 1: ALL USER BALANCES - STYLISH MINI CIRCLES - PLACED BEFORE THE THREE BUTTONS */}
            <div className="bg-white border border-gray-100/80 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  📊 État de vos comptes en temps réel
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Mise à jour en direct"></span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                {/* Circle 1: Disponible */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-indigo-100/80 bg-indigo-50/20 flex flex-col items-center justify-center p-2 text-center shadow-sm transition-transform hover:scale-105 duration-150">
                    <span className="text-[9px] sm:text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-0.5">Disponible</span>
                    <span className="font-mono text-sm sm:text-base font-black text-indigo-950 truncate max-w-[80px]" title={currentUser?.wallet.available.toString()}>
                      {currentUser?.wallet.available.toLocaleString() || "0"}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-[#4e3beb] font-black mt-0.5">{currentUser?.currency}</span>
                  </div>
                </div>

                {/* Circle 2: En attente */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-100/80 bg-amber-50/20 flex flex-col items-center justify-center p-2 text-center shadow-sm transition-transform hover:scale-105 duration-150">
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-wider mb-0.5">En Attente</span>
                    <span className="font-mono text-sm sm:text-base font-black text-amber-600 truncate max-w-[80px]" title={currentUser?.wallet.pending.toString()}>
                      {currentUser?.wallet.pending.toLocaleString() || "0"}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-amber-500 font-black mt-0.5">{currentUser?.currency}</span>
                  </div>
                </div>

                {/* Circle 3: Total Gagné */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-emerald-100/80 bg-emerald-50/20 flex flex-col items-center justify-center p-2 text-center shadow-sm transition-transform hover:scale-105 duration-150">
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">Total Gagné</span>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-950 truncate max-w-[80px]" title={currentUser?.wallet.totalEarned.toString()}>
                      {currentUser?.wallet.totalEarned.toLocaleString() || "0"}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-emerald-600 font-black mt-0.5">{currentUser?.currency}</span>
                  </div>
                </div>

                {/* Circle 4: Gains Parrainage */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-pink-100/80 bg-pink-50/20 flex flex-col items-center justify-center p-2 text-center shadow-sm transition-transform hover:scale-105 duration-150 relative">
                    <span className="text-[9px] sm:text-[10px] font-black text-pink-800 uppercase tracking-wider mb-0.5">Parrainage</span>
                    <span className="font-mono text-sm sm:text-base font-black text-pink-600 truncate max-w-[80px]" title={currentUser?.wallet.referralEarned.toString()}>
                      {currentUser?.wallet.referralEarned.toLocaleString() || "0"}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-pink-500 font-black mt-0.5">{currentUser?.currency}</span>
                  </div>
                  {/* Referral Code Copy */}
                  <div className="mt-2 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-150">
                    <span className="text-[9px] text-gray-500 font-bold">Code: <strong className="text-gray-700">{currentUser?.referralCode}</strong></span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser?.referralCode || "");
                        alert("Code de parrainage copié !");
                      }}
                      className="text-[9px] text-[#4e3beb] hover:underline font-black uppercase tracking-wider cursor-pointer"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: THREE ALIGNED TAB CONTROL BUTTONS ("Three aligned buttons shown: depot, retrait, historique") - PLACED BELOW THE CIRCLES */}
            <div className="flex border border-gray-200/80 rounded-2xl p-1 bg-gray-50/70 gap-1.5 mb-8 max-w-2xl">
              <button
                type="button"
                onClick={() => {
                  setWalletTab("deposit");
                  setWithdrawError(null);
                  setWithdrawSuccess(null);
                  setDepositError(null);
                  setDepositSuccess(null);
                }}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  walletTab === "deposit" 
                    ? "bg-[#4e3beb] text-white shadow-md shadow-indigo-600/10 scale-[1.01]" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
              >
                📥 Dépôt de fonds
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletTab("withdraw");
                  setWithdrawError(null);
                  setWithdrawSuccess(null);
                  setDepositError(null);
                  setDepositSuccess(null);
                }}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  walletTab === "withdraw" 
                    ? "bg-[#4e3beb] text-white shadow-md shadow-indigo-600/10 scale-[1.01]" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
              >
                📤 Retrait de gains
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletTab("history");
                  setWithdrawError(null);
                  setWithdrawSuccess(null);
                  setDepositError(null);
                  setDepositSuccess(null);
                }}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  walletTab === "history" 
                    ? "bg-[#4e3beb] text-white shadow-md shadow-indigo-600/10 scale-[1.01]" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
              >
                📋 Historique & Tâches
              </button>
            </div>

            {/* SECTION 3: TAB CONTENT PANELS */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 lg:p-8 shadow-sm">
              
              {/* TAB 1: DEPOSIT MENU */}
              {walletTab === "deposit" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Form Header */}
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                      <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600 text-sm">📥</span>
                      Recharger mon solde Yaamaa
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Saisissez votre pays et votre devise locale. Les opérateurs mobiles de votre pays seront automatiquement filtrés pour démarrer l'auto-débit sécurisé.
                    </p>
                  </div>

                  <form onSubmit={handleCreateDeposit} className="space-y-6 max-w-4xl">
                    
                    {/* Grid Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Pays Selector */}
                      <div className="md:col-span-2">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                          1. Pays d'origine
                        </label>
                        
                        <div className="space-y-2 max-w-xl">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sélectionnez votre Pays</span>
                          <div className="relative">
                            <select
                              value={kkiapayCountry}
                              onChange={(e) => {
                                const selectedCountryName = e.target.value;
                                const c = COUNTRIES_LIST.find((item) => item.name === selectedCountryName);
                                if (c) {
                                  setKkiapayCountry(c.name);
                                  setKkiapayMethod(c.methods[0]);
                                  setDepositMethod(c.methods[0]);
                                  const currentDigits = depositDetails.replace(/^\+\d+\s*/, "");
                                  setDepositDetails(`${c.code} ${currentDigits || ""}`);
                                }
                              }}
                              className="w-full border border-gray-200 rounded-2xl p-4 text-xs font-black bg-white focus:outline-none focus:ring-1 focus:ring-[#4e3beb] shadow-sm cursor-pointer appearance-none pl-11 pr-10"
                            >
                              {COUNTRIES_LIST.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.flag} &nbsp; {c.name} ({c.code})
                                </option>
                              ))}
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                              {COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.flag || "🌍"}
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                              ▼
                            </div>
                          </div>
                          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl text-[11px] text-indigo-900 leading-relaxed">
                            💡 Pays actuel : <strong className="text-indigo-950 font-black">{kkiapayCountry}</strong><br/>
                            Devise de facturation : <strong className="text-indigo-950 font-mono font-bold">{COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.currency}</strong> | Code : <strong className="text-indigo-950 font-mono font-bold">{COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.code}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Devise choice */}
                      <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                          2. Devise de facturation
                        </label>
                        <select
                          value={currentUser?.currency || "XOF"}
                          disabled
                          className="w-full border border-gray-200 rounded-xl p-3.5 text-xs font-mono font-bold bg-gray-50 cursor-not-allowed focus:outline-none"
                        >
                          <option value="XOF">XOF - Franc CFA Afrique de l'Ouest (BCEAO)</option>
                          <option value="XAF">XAF - Franc CFA Afrique Centrale (BEAC)</option>
                          <option value="EUR">EUR - Euro (€)</option>
                          <option value="USD">USD - Dollar Américain ($)</option>
                        </select>
                        <p className="text-[10.5px] text-gray-400 mt-1.5 leading-relaxed">
                          📌 La devise est automatiquement ajustée en fonction de la balance par défaut configurée sur votre compte d'utilisateur.
                        </p>
                      </div>

                      {/* Dynamic operator choices based on country */}
                      <div className="md:col-span-2">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2.5">
                          3. Choisissez votre moyen de paiement ({kkiapayCountry})
                        </label>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(() => {
                            const currentMethods = COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.methods || ["MTN Mobile Money", "Carte Bancaire"];

                            return currentMethods.map((m) => {
                              const isSelected = kkiapayMethod === m;
                              let logoInitials = "📱";
                              let customStyle = "border-gray-200 text-gray-700";

                              if (m === "MTN Mobile Money") { customStyle = "bg-amber-50 border-amber-300 text-amber-950"; logoInitials = "💛 MTN"; }
                              else if (m === "Moov Money") { customStyle = "bg-blue-50 border-blue-300 text-blue-950"; logoInitials = "💙 Moov"; }
                              else if (m === "Celtiis Cash") { customStyle = "bg-orange-50 border-orange-300 text-orange-950"; logoInitials = "💚 Celtiis"; }
                              else if (m === "TMoney") { customStyle = "bg-yellow-50 border-yellow-300 text-yellow-950"; logoInitials = "⭐ TMoney"; }
                              else if (m === "Wave") { customStyle = "bg-sky-50 border-sky-300 text-sky-950"; logoInitials = "🐧 Wave"; }
                              else if (m === "Orange Money") { customStyle = "bg-orange-50/70 border-orange-300 text-orange-900"; logoInitials = "🧡 Orange"; }
                              else if (m === "Free Money") { customStyle = "bg-red-50 border-red-300 text-red-950"; logoInitials = "❤️ Free"; }
                              else if (m === "Airtel Money") { customStyle = "bg-red-50 border-red-300 text-red-950"; logoInitials = "❤️ Airtel"; }
                              else if (m === "M-Pesa") { customStyle = "bg-emerald-50 border-emerald-300 text-emerald-950"; logoInitials = "💚 M-Pesa"; }
                              else if (m === "Mvola") { customStyle = "bg-green-50 border-green-300 text-green-950"; logoInitials = "💚 Mvola"; }
                              else if (m === "Lumicash") { customStyle = "bg-emerald-50 border-emerald-300 text-emerald-950"; logoInitials = "💚 Lumicash"; }
                              else if (m === "Ecocash") { customStyle = "bg-blue-50 border-blue-300 text-blue-950"; logoInitials = "💙 Ecocash"; }
                              else if (m === "Bankily") { customStyle = "bg-indigo-50 border-indigo-300 text-indigo-950"; logoInitials = "💙 Bankily"; }
                              else if (m === "Masrivi") { customStyle = "bg-sky-50 border-sky-300 text-sky-950"; logoInitials = "💙 Masrivi"; }
                              else if (m === "Muni Cash") { customStyle = "bg-orange-50 border-orange-300 text-orange-950"; logoInitials = "🧡 Muni"; }
                              else if (m === "Telecel Cash") { customStyle = "bg-indigo-50 border-indigo-300 text-indigo-950"; logoInitials = "💙 Telecel"; }
                              else if (m === "Carte Bancaire") { customStyle = "bg-slate-50 border-slate-300 text-slate-850"; logoInitials = "💳 Visa/MC"; }
                              else if (m === "Virement Bancaire") { customStyle = "bg-teal-50 border-teal-300 text-teal-950"; logoInitials = "🏦 Banque"; }
                              else if (m === "Virement Interac") { customStyle = "bg-red-50 border-red-300 text-red-950"; logoInitials = "🍁 Interac"; }

                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setKkiapayMethod(m);
                                    setDepositMethod(m);
                                  }}
                                  className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition duration-150 cursor-pointer ${
                                    isSelected 
                                      ? `${customStyle.split(" ")[0]} border-2 border-[#4e3beb] shadow-sm scale-[1.01]` 
                                      : "bg-white border-gray-150 hover:border-indigo-100 text-gray-500"
                                  }`}
                                >
                                  <span className="text-sm font-semibold">{logoInitials}</span>
                                  <span className="truncate">{m}</span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Montant field */}
                      <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                          4. Saisissez le montant à recharger
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full border border-gray-200 rounded-2xl p-4 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb] pr-12"
                            placeholder="Ex: 10000"
                            min={1}
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-black text-gray-400">
                            {currentUser?.currency}
                          </div>
                        </div>
                      </div>

                      {/* Specific information details depending on operator choice */}
                      <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                          5. Informations de facturation sécurisées
                        </label>

                        {kkiapayMethod === "Carte Bancaire" ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={kkiapayCardName}
                              onChange={(e) => setKkiapayCardName(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#4e3beb] font-bold"
                              placeholder="Nom complet du titulaire de la carte"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={kkiapayCardNumber}
                                onChange={(e) => setKkiapayCardNumber(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                                placeholder="Numéro de carte (4242 4242...)"
                              />
                              <input
                                type="text"
                                value={kkiapayCardExpiry}
                                onChange={(e) => setKkiapayCardExpiry(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                                placeholder="MM/AA"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={depositDetails}
                              onChange={(e) => {
                                setDepositDetails(e.target.value);
                                setKkiapayPhone(e.target.value);
                              }}
                              className="w-full border border-gray-200 rounded-xl p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                              placeholder="Ex: +229 97 00 00 00 (Numéro Mobile Money)"
                              required
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                              💡 Pour {kkiapayMethod}, un message push USSD de paiement automatique est transmis directement au numéro indiqué.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Explanatory Banner */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-900 text-xs leading-relaxed max-w-4xl">
                      <span className="text-lg">🔒</span>
                      <div>
                        <strong className="block font-black text-indigo-950">Intégration d'auto-débit sécurisé Yaamaa Pay West Africa</strong>
                        Le système de dépôt Yaamaa intègre la technologie d'auto-débit instantané. En validant le paiement, la passerelle Yaamaa Pay interagit avec l'opérateur pour débiter automatiquement votre solde externe et créditer instantanément votre balance disponible.
                      </div>
                    </div>

                    {depositError && (
                      <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-xs text-rose-600 font-bold max-w-4xl">
                        ⚠️ {depositError}
                      </div>
                    )}

                    {depositSuccess && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs text-emerald-700 font-bold max-w-4xl">
                        ✓ {depositSuccess}
                      </div>
                    )}

                    {/* CTA button triggers the simulated high fidelity modal */}
                    <div className="pt-2 max-w-md">
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#4e3beb] hover:bg-[#3d2ece] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        ⚡ Valider le dépôt & Déclencher le paiement
                      </button>
                    </div>

                  </form>

                </div>
              )}

              {/* TAB 2: WITHDRAW MENU */}
              {walletTab === "withdraw" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Form Header */}
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                      <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 text-sm">📤</span>
                      Demander un Retrait Automatique de gains
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Transférez automatiquement l'argent de votre solde disponible vers votre compte Mobile Money local, votre carte bancaire, ou votre banque.
                    </p>
                  </div>

                  {!currentUser?.merchantNumber && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-950 space-y-3.5 shadow-sm animate-fade-in" id="withdraw_no_merchant_warning">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 text-base shrink-0">
                          🔒
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">Retrait de gains désactivé</h4>
                          <p className="text-xs leading-relaxed text-rose-800 font-medium">
                            Pour des raisons de conformité réglementaire, <strong>vous devez posséder un Numéro Marchand actif pour pouvoir faire des retraits d'argent ou percevoir vos commissions</strong>.
                          </p>
                          <p className="text-[11px] leading-relaxed text-gray-500 mt-1">
                            Sans numéro de base actif, vous ne pouvez ni retirer vos gains ni cumuler de l'argent via le parrainage. Activez-le pour débloquer votre solde et commencer à gagner de l'argent.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMerchantPayPhone(currentUser?.phone || "");
                            setMerchantPayName(currentUser?.name || "");
                            setMerchantStep("form");
                            setIsMerchantModalOpen(true);
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-xl transition shadow cursor-pointer"
                        >
                          Acheter mon numéro marchand de base 👑
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Processing view if loading withdrawal */}
                  {isWithdrawalProcessing ? (
                    <div className="py-10 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-[#4e3beb] animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="animate-pulse text-sm">📡</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-base font-extrabold text-indigo-950">Négociation de virement en cours...</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          La passerelle interagit avec le serveur central de {withdrawMethodSelected} ({withdrawCountry}) pour initier un crédit de virement direct autorisé.
                        </p>
                      </div>

                      <div className="w-full bg-gray-50 border border-gray-150 rounded-2xl p-4 font-mono text-[10.5px] text-gray-600 text-left space-y-1">
                        <div>[SERVER] Connecting route payload to {withdrawMethodSelected}...</div>
                        <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                          <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                          <span>[OPERATOR] Push notification authorization... OK</span>
                        </div>
                        <div>[BCEAO-ROUTING] Clearing transfer transaction ID... CREATED</div>
                      </div>
                    </div>
                  ) : withdrawalSuccessState ? (
                    
                    /* SUCCESS RECEIPT STATE */
                    <div className="py-8 max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                      <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center text-xl shadow-sm">
                        ✓
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black text-gray-900">Transfert de retrait Réussi ! 🎉</h4>
                        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                          Votre demande de retrait instantané a été approuvée par l'audit d'IA et validée par l'opérateur local. Les fonds ont été crédités.
                        </p>
                      </div>

                      {/* Official receipt representation */}
                      <div className="w-full bg-slate-50 border border-gray-200 rounded-3xl p-5 text-xs text-left space-y-2.5 font-sans">
                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 mb-2">
                          <span className="text-gray-400">Référence Yaamaa Pay :</span>
                          <span className="font-mono font-bold text-gray-800">TX-WD-{Math.floor(Math.random() * 900000 + 100000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Montant Débité :</span>
                          <span className="font-bold text-rose-600">-{withdrawalAmount} {withdrawCurrency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Canal de réception :</span>
                          <span className="font-bold text-gray-800">{withdrawMethodSelected} ({withdrawCountry})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bénéficiaire de virement :</span>
                          <span className="font-mono text-gray-800 truncate max-w-[200px]">
                            {withdrawMethodSelected === "Carte Bancaire" ? withdrawCardName : withdrawMethodSelected === "Virement Bancaire" ? withdrawIBAN : withdrawPhone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date d'effet :</span>
                          <span className="text-gray-600">{new Date().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100">
                          <span className="text-gray-400">Statut de la transaction :</span>
                          <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                            APPROUVÉ (INSTANTANÉ)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setWithdrawalSuccessState(false)}
                        className="px-6 py-3 bg-gray-950 text-white font-bold rounded-xl text-xs hover:bg-gray-800 transition shadow"
                      >
                        Faire une nouvelle demande
                      </button>

                    </div>
                  ) : (
                    
                    /* THE RETRAIT FORM SCREEN */
                    <form onSubmit={handleWithdrawFunds} className="space-y-6 max-w-4xl">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Country input */}
                        <div className="md:col-span-2">
                          <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                            1. Choisissez votre Pays de réception
                          </label>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Dropdown Select option */}
                            <div className="lg:col-span-1 space-y-2">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sélection Rapide</span>
                              <div className="relative">
                                <select
                                  value={withdrawCountry}
                                  onChange={(e) => {
                                    const selectedCountryName = e.target.value;
                                    const c = COUNTRIES_LIST.find((item) => item.name === selectedCountryName);
                                    if (c) {
                                      setWithdrawCountry(c.name);
                                      setWithdrawMethodSelected(c.methods[0]);
                                      setWithdrawCurrency(c.currency);
                                      const currentDigits = withdrawPhone.replace(/^\+\d+\s*/, "");
                                      setWithdrawPhone(`${c.code} ${currentDigits || ""}`);
                                    }
                                  }}
                                  className="w-full border border-gray-200 rounded-2xl p-4 text-xs font-black bg-white focus:outline-none focus:ring-1 focus:ring-[#4e3beb] shadow-sm cursor-pointer appearance-none pl-11 pr-10"
                                >
                                  {COUNTRIES_LIST.map((c) => (
                                    <option key={c.name} value={c.name}>
                                      {c.flag} &nbsp; {c.name} ({c.code})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                                  {COUNTRIES_LIST.find(c => c.name === withdrawCountry)?.flag || "🌍"}
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                                  ▼
                                </div>
                              </div>
                              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl text-[11px] text-indigo-900 leading-relaxed">
                                💡 Pays actuel : <strong className="text-indigo-950 font-black">{withdrawCountry}</strong><br/>
                                Devise de versement : <strong className="text-indigo-950 font-mono font-bold">{COUNTRIES_LIST.find(c => c.name === withdrawCountry)?.currency}</strong> | Code : <strong className="text-indigo-950 font-mono font-bold">{COUNTRIES_LIST.find(c => c.name === withdrawCountry)?.code}</strong>
                              </div>
                            </div>

                            {/* Full scrollable searchable countries table */}
                            <div className="lg:col-span-2 border border-gray-150 rounded-2xl bg-gray-50/50 overflow-hidden flex flex-col h-[155px] min-h-[155px] max-h-[155px] w-full shrink-0 select-none">
                              <div className="p-3 bg-gray-100/90 backdrop-blur-xs border-b border-gray-150 flex items-center justify-between gap-2 sticky top-0 z-10 shrink-0 select-none">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                  📋 Tableau interactif des {COUNTRIES_LIST.length} pays de versement
                                </span>
                                <input
                                  type="text"
                                  placeholder="🔍 Filtrer..."
                                  value={withdrawCountrySearch}
                                  onChange={(e) => setWithdrawCountrySearch(e.target.value)}
                                  className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4e3beb] max-w-[120px] font-semibold"
                                />
                              </div>
                              <div className="overflow-y-auto flex-1 divide-y divide-gray-100 bg-white">
                                {COUNTRIES_LIST.filter(c => 
                                  c.name.toLowerCase().includes(withdrawCountrySearch.toLowerCase()) ||
                                  c.code.includes(withdrawCountrySearch) ||
                                  c.currency.toLowerCase().includes(withdrawCountrySearch.toLowerCase())
                                ).map((c) => {
                                  const isSelected = withdrawCountry === c.name;
                                  return (
                                    <div
                                      key={c.name}
                                      onClick={() => {
                                        setWithdrawCountry(c.name);
                                        setWithdrawMethodSelected(c.methods[0]);
                                        setWithdrawCurrency(c.currency);
                                        const currentDigits = withdrawPhone.replace(/^\+\d+\s*/, "");
                                        setWithdrawPhone(`${c.code} ${currentDigits || ""}`);
                                      }}
                                      className={`flex items-center justify-between px-4 py-2.5 text-xs cursor-pointer transition ${
                                        isSelected 
                                          ? "bg-indigo-50/80 border-l-4 border-[#4e3beb] font-black text-indigo-950" 
                                          : "hover:bg-gray-50 text-gray-600"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg leading-none">{c.flag}</span>
                                        <span className="font-bold">{c.name}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="font-mono text-[11px] text-gray-400 font-semibold">{c.code}</span>
                                        <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold w-12 text-center">
                                          {c.currency}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Currency selection */}
                        <div>
                          <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                            2. Devise de versement
                          </label>
                          <select
                            value={withdrawCurrency}
                            onChange={(e) => setWithdrawCurrency(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                          >
                            <option value="XOF">XOF - Franc CFA Afrique de l'Ouest (BCEAO)</option>
                            <option value="XAF">XAF - Franc CFA Afrique Centrale (BEAC)</option>
                            <option value="EUR">EUR - Euro (€)</option>
                            <option value="USD">USD - Dollar Américain ($)</option>
                          </select>
                          <p className="text-[10.5px] text-gray-400 mt-1.5 leading-relaxed">
                            📌 Vous pouvez choisir de convertir vos gains dans une autre devise ou de conserver la devise par défaut de votre compte.
                          </p>
                        </div>

                        {/* Payout channels */}
                        <div className="md:col-span-2">
                          <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2.5">
                            3. Moyen de retrait de fonds disponible ({withdrawCountry})
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {(() => {
                              const methods = COUNTRIES_LIST.find(c => c.name === withdrawCountry)?.methods || ["MTN Mobile Money", "Carte Bancaire", "Virement Bancaire"];

                              return methods.map((m) => {
                                const isSelected = withdrawMethodSelected === m;
                                let logo = "📱";
                                let col = "border-gray-200 text-gray-700";

                                if (m === "MTN Mobile Money") { col = "bg-amber-50 border-amber-300 text-amber-950"; logo = "💛 MTN"; }
                                else if (m === "Moov Money") { col = "bg-blue-50 border-blue-300 text-blue-950"; logo = "💙 Moov"; }
                                else if (m === "Celtiis Cash") { col = "bg-orange-50 border-orange-300 text-orange-950"; logo = "💚 Celtiis"; }
                                else if (m === "TMoney") { col = "bg-yellow-50 border-yellow-300 text-yellow-950"; logo = "⭐ TMoney"; }
                                else if (m === "Wave") { col = "bg-sky-50 border-sky-300 text-sky-950"; logo = "🐧 Wave"; }
                                else if (m === "Orange Money") { col = "bg-orange-50/70 border-orange-300 text-orange-900"; logo = "🧡 Orange"; }
                                else if (m === "Free Money") { col = "bg-red-50 border-red-300 text-red-950"; logo = "❤️ Free"; }
                                else if (m === "Airtel Money") { col = "bg-red-50 border-red-300 text-red-950"; logo = "❤️ Airtel"; }
                                else if (m === "M-Pesa") { col = "bg-emerald-50 border-emerald-300 text-emerald-950"; logo = "💚 M-Pesa"; }
                                else if (m === "Mvola") { col = "bg-green-50 border-green-300 text-green-950"; logo = "💚 Mvola"; }
                                else if (m === "Lumicash") { col = "bg-emerald-50 border-emerald-300 text-emerald-950"; logo = "💚 Lumicash"; }
                                else if (m === "Ecocash") { col = "bg-blue-50 border-blue-300 text-blue-950"; logo = "💙 Ecocash"; }
                                else if (m === "Bankily") { col = "bg-indigo-50 border-indigo-300 text-indigo-950"; logo = "💙 Bankily"; }
                                else if (m === "Masrivi") { col = "bg-sky-50 border-sky-300 text-sky-950"; logo = "💙 Masrivi"; }
                                else if (m === "Muni Cash") { col = "bg-orange-50 border-orange-300 text-orange-950"; logo = "🧡 Muni"; }
                                else if (m === "Telecel Cash") { col = "bg-indigo-50 border-indigo-300 text-indigo-950"; logo = "💙 Telecel"; }
                                else if (m === "Carte Bancaire") { col = "bg-slate-50 border-slate-300 text-slate-850"; logo = "💳 Carte Visa"; }
                                else if (m === "Virement Bancaire") { col = "bg-teal-50 border-teal-300 text-teal-950"; logo = "🏦 Virement"; }
                                else if (m === "Virement Interac") { col = "bg-red-50 border-red-300 text-red-950"; logo = "🍁 Interac"; }

                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setWithdrawMethodSelected(m)}
                                    className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition duration-150 cursor-pointer ${
                                      isSelected 
                                        ? `${col.split(" ")[0]} border-2 border-[#4e3beb] shadow-sm scale-[1.01]` 
                                        : "bg-white border-gray-150 hover:border-indigo-100 text-gray-500"
                                    }`}
                                  >
                                    <span className="text-sm font-semibold">{logo}</span>
                                    <span className="truncate">{m}</span>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Amount and coordinate inputs */}
                        <div>
                          <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                            4. Montant à retirer de votre balance disponible
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              className="w-full border border-gray-200 rounded-2xl p-4 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb] pr-12"
                              placeholder="Ex: 5000"
                              min={1}
                              required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-black text-gray-400">
                              {currentUser?.currency}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Solde disponible pour retrait immédiat : <strong className="text-indigo-950">{currentUser?.wallet.available.toLocaleString()} {currentUser?.currency}</strong>
                          </p>
                        </div>

                        {/* Receipient coordination inputs */}
                        <div>
                          <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-2">
                            5. Informations sur le compte de destination
                          </label>

                          {withdrawMethodSelected === "Carte Bancaire" ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={withdrawCardName}
                                onChange={(e) => setWithdrawCardName(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none font-semibold"
                                placeholder="Nom du bénéficiaire de la Carte"
                                required
                              />
                              <input
                                type="text"
                                value={withdrawCardNumber}
                                onChange={(e) => setWithdrawCardNumber(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono focus:outline-none"
                                placeholder="Numéro de Carte de versement"
                                required
                              />
                            </div>
                          ) : withdrawMethodSelected === "Virement Bancaire" ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={withdrawCardName}
                                onChange={(e) => setWithdrawCardName(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none font-semibold"
                                placeholder="Nom complet du titulaire du compte"
                                required
                              />
                              <input
                                type="text"
                                value={withdrawIBAN}
                                onChange={(e) => setWithdrawIBAN(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono focus:outline-none"
                                placeholder="Code IBAN ou Code Banque (Ex: BJ60...)"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <input
                                type="text"
                                value={withdrawPhone}
                                onChange={(e) => setWithdrawPhone(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                                placeholder="Ex: +229 97 00 00 00 (Numéro Mobile Money de réception)"
                                required
                              />
                              <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                                💡 Le transfert automatique instantané sera routé vers ce compte de réception Mobile Money {withdrawMethodSelected}.
                              </p>
                            </div>
                          )}
                        </div>

                      </div>

                      {withdrawError && (
                        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-xs text-rose-600 font-bold max-w-4xl">
                          ⚠️ {withdrawError}
                        </div>
                      )}

                      {withdrawSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs text-emerald-700 font-bold max-w-4xl">
                          ✓ {withdrawSuccess}
                        </div>
                      )}

                      {/* CTA Trigger */}
                      <div className="pt-2 max-w-md">
                        <button
                          type="submit"
                          disabled={!currentUser?.merchantNumber}
                          className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
                            !currentUser?.merchantNumber
                              ? "bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200"
                              : "bg-gray-950 hover:bg-gray-800 text-white cursor-pointer"
                          }`}
                        >
                          {!currentUser?.merchantNumber ? (
                            <>🔒 Retrait verrouillé (Numéro Marchand requis)</>
                          ) : (
                            <>📤 Valider le retrait automatique (Versement Instantané)</>
                          )}
                        </button>
                      </div>

                    </form>
                  )}

                </div>
              )}

              {/* TAB 3: TRANSACTION & TASK HISTORY LIST */}
              {walletTab === "history" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Division 1: Financial transactions */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h4 className="text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📋</span> Mouvements financiers récents
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Historique complet de vos recharges, missions rémunérées, bonus de parrainages et retraits.</p>
                      </div>

                      <select
                        value={personalTxFilter}
                        onChange={(e) => setPersonalTxFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-[10.5px] bg-gray-50 font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb] cursor-pointer"
                      >
                        <option value="all">Filtre : Tous les mouvements</option>
                        <option value="earn">Missions Rémunérées (Gains)</option>
                        <option value="withdraw">Retraits d'argent</option>
                        <option value="deposit">Dépôts / Recharges</option>
                        <option value="referral_bonus">Bonus Parrainage</option>
                        <option value="funded_campaign">Financement de Campagnes</option>
                      </select>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-2">
                      {transactions
                        .filter(t => t.userId === currentUser?.id)
                        .filter(t => personalTxFilter === "all" || t.type === personalTxFilter)
                        .map((tx) => (
                          <div key={tx.id} className="py-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-gray-900">{tx.details}</p>
                              <span className="text-[10px] text-gray-400 font-mono inline-flex items-center gap-1.5 mt-1">
                                {tx.method} • {new Date(tx.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-xs font-mono font-black block ${
                                tx.type === "withdraw" || tx.type === "funded_campaign" ? "text-rose-500" : "text-emerald-600"
                              }`}>
                                {tx.type === "withdraw" || tx.type === "funded_campaign" ? "-" : "+"}{tx.amount} {tx.currency}
                              </span>
                              <span className={`inline-block text-[9.5px] font-bold rounded px-2 py-0.5 mt-1 ${
                                tx.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}>
                                {tx.status === "completed" ? "Réussi" : "En vérification..."}
                              </span>
                            </div>
                          </div>
                        ))}

                      {transactions
                        .filter(t => t.userId === currentUser?.id)
                        .filter(t => personalTxFilter === "all" || t.type === personalTxFilter)
                        .length === 0 && (
                          <p className="text-xs text-center text-gray-400 py-8">Aucun mouvement financier enregistré pour le moment.</p>
                        )}
                    </div>
                  </div>

                  {/* Division 2: Micro tasks submission logs */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h4 className="text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🎯</span> Preuves de tâches accomplies
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Suivi en temps réel de vos soumissions et validation des audits de tâches administratives.</p>
                      </div>

                      <select
                        value={personalTaskFilter}
                        onChange={(e) => setPersonalTaskFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-[10.5px] bg-gray-50 font-bold focus:outline-none focus:ring-1 focus:ring-[#4e3beb] cursor-pointer"
                      >
                        <option value="all">Filtre : Toutes les preuves</option>
                        <option value="approved">Tâches Accomplies / Validées</option>
                        <option value="pending">En attente de vérification</option>
                        <option value="rejected">Tâches Rejetées</option>
                        <option value="disputed">Instructions de correction</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
                      {submissions
                        .filter(s => s.participantId === currentUser?.id)
                        .filter(s => personalTaskFilter === "all" || s.status === personalTaskFilter)
                        .map((sub) => (
                          <div key={sub.id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-3 text-left">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <strong className="text-xs text-gray-900 block font-bold">{sub.campaignTitle}</strong>
                                <span className="text-[9.5px] text-gray-400 block font-mono mt-0.5">
                                  ID Soumission: {sub.id} • Gains : {sub.campaignReward} {sub.campaignCurrency}
                                </span>
                              </div>
                              <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded uppercase shrink-0 ${
                                sub.status === "approved" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : sub.status === "rejected" 
                                  ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                  : sub.status === "disputed"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}>
                                {sub.status === "approved" 
                                  ? "Tâche validée" 
                                  : sub.status === "rejected" 
                                  ? "Rejetée" 
                                  : sub.status === "disputed"
                                  ? "À corriger"
                                  : "En cours d'audit"}
                              </span>
                            </div>

                            {sub.adminFeedback && (
                              <div className="bg-white border border-amber-200/60 p-3 text-[11px] rounded-xl text-gray-700">
                                <span className="font-extrabold text-[9px] text-amber-600 block uppercase tracking-wider mb-0.5">Note de correction administrative :</span>
                                <p className="italic font-medium">"{sub.adminFeedback}"</p>
                              </div>
                            )}
                          </div>
                        ))}

                      {submissions
                        .filter(s => s.participantId === currentUser?.id)
                        .filter(s => personalTaskFilter === "all" || s.status === personalTaskFilter)
                        .length === 0 && (
                          <p className="text-xs text-center text-gray-400 py-8 md:col-span-2">Aucune preuve de tâche accomplie enregistrée.</p>
                        )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* 5. YAAMAA YAAMAA AI COMPANION */}
        {currentView === "assistant" && (
          <div id="view_assistant" className="mx-auto max-w-4xl py-10 px-4 animate-fade-in">
            <div className="border-b border-gray-200 pb-6 mb-8">
              <span className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                Intelligence Artificielle Certifiée
              </span>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-950 mt-1">
                L'Assistant d'Optimisation <span translate="no" className="notranslate">Yaamaa</span> AI
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Générez automatiquement vos descriptions de campagnes, explorez les meilleures astuces ou vérifiez l'activité système.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

              {/* Modes column (1/3 size) */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white border rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Rôles de Consultation</span>
                  
                  <button
                    onClick={() => setAiChatType("participant_recommend")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      aiChatType === "participant_recommend" ? "bg-gray-950 text-white" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    🚀 Booster de Gains Participant
                  </button>

                  <button
                    onClick={() => setAiChatType("advertiser_create")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      aiChatType === "advertiser_create" ? "bg-gray-950 text-white" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    ✏ Optimisation d'Annonces
                  </button>

                  <button
                    onClick={() => setAiChatType("admin_fraud_report")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      aiChatType === "admin_fraud_report" ? "bg-gray-950 text-white" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    🛡 Rapport Fraude Système
                  </button>

                  <button
                    onClick={() => setAiChatType("custom")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      aiChatType === "custom" ? "bg-gray-950 text-white" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    💬 Discussion Libre
                  </button>
                </div>

                {aiChatType === "custom" && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-650 uppercase">Votre prompt personnalisé</label>
                    <input
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      placeholder="Ex: Donne-moi des idées de micro tâches"
                    />
                  </div>
                )}

                <button
                  onClick={triggerAiGuidance}
                  disabled={isAiLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 shadow"
                >
                  {isAiLoading ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Générer les préconisations
                    </>
                  )}
                </button>
              </div>

              {/* Response markdown look column (2/3 size) */}
              <div className="md:col-span-2">
                <div className="bg-white border rounded-2xl p-6 min-h-[350px] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-4 border-b pb-2">
                      Rapport Généré
                    </span>
                    
                    {aiResponseText ? (
                      <div className="prose prose-sm text-xs leading-relaxed text-gray-700 space-y-3 font-sans whitespace-pre-line">
                        {aiResponseText}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Cpu className="h-10 w-10 text-gray-200 mx-auto animate-pulse" />
                        <p className="text-xs text-gray-400 mt-2">Notre IA de pointe attend vos instructions de calcul.</p>
                      </div>
                    )}
                  </div>

                  <span className="text-[9.5px] text-gray-400 block mt-8 pt-4 border-t font-mono">
                    Audits et optimisations basés sur les données en temps réel de la plateforme Yaamaa.
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Yaamaa AI Personal Agent View */}
        {currentView === "yaamaa-ai" && currentUser && (
          <YaamaaAiView 
            currentUser={currentUser}
            onNavigate={(view) => setCurrentView(view)}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            shops={shops}
            products={products}
          />
        )}

        {/* 6. ADMIN & FOUNDER CONTROL PANEL */}
        {currentView === "admin" && (
          <div id="view_admin" className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="border-b border-gray-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 px-1.5 rounded-full border border-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Espace d'Administration Supérieur
                </span>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-950 mt-1.5">
                  Console d'administration générale
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gérez les preuves de tâches, traitez les retraits bloqués, suspendez des pays/devises et surveillez les journaux de sécurité.
                </p>
              </div>

              {currentUser?.role === "founder" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleRestoreState}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold px-3.5 py-2 rounded-xl transition border border-rose-200"
                  >
                    Restaurer Backup pristine
                  </button>
                </div>
              )}
            </div>

            {adminMsg && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-6 text-xs text-emerald-700 font-bold flex justify-between items-center">
                <span>{adminMsg}</span>
                <button onClick={() => setAdminMsg(null)} className="text-[10px] text-gray-400 underline">Fermer</button>
              </div>
            )}

            {/* SUB-TAB NAVIGATOR */}
            <div id="admin_sub_tabs" className="flex border-b border-gray-150 gap-1 overflow-x-auto pb-px mb-8">
              <button
                type="button"
                onClick={() => setAdminSubTab("dashboard")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "dashboard"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-amber-600" />
                📊 Tableau de Bord
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("proofs")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "proofs"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                📋 Validations & Dépôts ({submissions.filter(s => s.status === "pending").length + transactions.filter(t => t.type === "deposit" && t.status === "pending").length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("finance")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "finance"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Coins className="h-4 w-4" />
                💸 Retraits & Campagnes ({transactions.filter(t => t.type === "withdraw" && t.status === "pending").length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("settings")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "settings"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Settings className="h-4 w-4" />
                ⚙️ Paramètres
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("members_registry")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "members_registry"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Users className="h-4 w-4 text-amber-600" />
                👥 Registre des Membres ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("audit_logs")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "audit_logs"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Clock className="h-4 w-4 text-emerald-600" />
                🕒 Journal d'Activités ({auditLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("admin_boutique")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "admin_boutique"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Store className="h-4 w-4 text-emerald-600" />
                🛒 Admin Boutique ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("admin_disputes")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "admin_disputes"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                ⚖️ Litiges Escrow ({disputes.filter(d => d.status === "pending").length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("admin_promos")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "admin_promos"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Megaphone className="h-4 w-4 text-blue-500" />
                📢 Validation Promos ({promoCampaigns.filter(p => p.status === "pending_validation").length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("broadcast")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "broadcast"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <Megaphone className="h-4 w-4 text-amber-650 animate-pulse" />
                ✉️ Automatisation ({broadcastCampaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("admin_gifts")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "admin_gifts"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🎁</span> Cadeaux & Émetteur
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("admin_subscriptions")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "admin_subscriptions"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🛡️</span> Badges & Abonnements
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("supervision")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "supervision"
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🧠</span> Centre de Supervision
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("moderation")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "moderation"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🛡️</span> Centre de Modération
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("api_keys")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "api_keys"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🔑</span> Clés API & Intégrations
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab("referral_program")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  adminSubTab === "referral_program"
                    ? "border-amber-600 text-amber-700 bg-amber-50/20"
                    : "border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50/50"
                }`}
              >
                <span className="text-sm">🤝</span> Parrainage & Commissions
              </button>
            </div>

            {/* TAB CONTENT: 1. DASHBOARD */}
            {adminSubTab === "dashboard" && (
              <div id="admin_tab_dashboard" className="space-y-8 animate-fade-in">
                {/* METRICS KPI SUMMARY ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Total Users card */}
                  <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Utilisateurs Inscrits</span>
                      <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-950 font-mono tracking-tight">
                      {users.length.toLocaleString()}
                    </p>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>👤 {users.filter(u => u.role === "participant").length} Partic.</span>
                      <span>📣 {users.filter(u => u.role === "advertiser").length} Annonc.</span>
                    </div>
                  </div>

                  {/* Active Campaigns card */}
                  <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Campagnes Actives</span>
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-950 font-mono tracking-tight">
                      {campaigns.filter(c => c.status === "active").length}
                    </p>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>📝 Total: {campaigns.length}</span>
                      <span>✅ Terminé: {campaigns.filter(c => c.status === "completed").length}</span>
                    </div>
                  </div>

                  {/* Pending Audits */}
                  <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Preuves à Evaluer</span>
                      <CheckSquare className={`h-5 w-5 ${submissions.filter(s => s.status === "pending").length > 0 ? "text-amber-500 animate-pulse" : "text-gray-400"}`} />
                    </div>
                    <p className="text-2xl font-black text-gray-950 font-mono tracking-tight">
                      {submissions.filter(s => s.status === "pending").length}
                    </p>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>🤖 AI-Auto-Checked</span>
                      <span className="text-emerald-600 font-bold">{submissions.filter(s => s.status === "approved").length} Validées</span>
                    </div>
                  </div>

                  {/* Platform Revenue Commission */}
                  <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Frais de Plateforme</span>
                      <Coins className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-lg font-extrabold text-gray-950 font-mono tracking-tight leading-none">
                        Commission fixes
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Taux actuel : {systemMetrics?.settings?.platformFeePercentage || 10}%
                      </p>
                    </div>
                    <div className="text-[10px] text-gray-500 flex flex-wrap gap-1">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">Min Retrait: {systemMetrics?.settings?.minWithdrawalAmount || 10}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Prix Numéro Marchand: {systemMetrics?.settings?.merchantNumberPrice ?? 5000} {currentUser?.currency || "XOF"}</span>
                    </div>
                  </div>

                </div>

                {/* GRAPH & LIQUIDITY ANALYSIS PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* INTERACTIVE DATA CHART PANEL */}
                  <div className="lg:col-span-2 bg-white border rounded-3xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Statistiques de Trafic & Croissance</h3>
                        <p className="text-[11px] text-gray-400">Visualisation analytique interactive des performances de Yaamaa.</p>
                      </div>
                      <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setAdminChartMetric("commission")}
                          className={`px-3 py-1.5 rounded-md transition ${adminChartMetric === "commission" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                        >
                          Commissions d'Annonceurs
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminChartMetric("volume")}
                          className={`px-3 py-1.5 rounded-md transition ${adminChartMetric === "volume" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                        >
                          Missions accomplies / h
                        </button>
                      </div>
                    </div>

                    {/* RENDER DYNAMIC SVG LINE GRAPH */}
                    <div className="h-[240px] w-full flex items-center justify-center relative bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                      
                      {/* Interactive labels */}
                      <div className="absolute top-3 left-4 text-[10px] font-mono text-gray-400">
                        {adminChartMetric === "commission" ? "Courbe cumulée (XOF)" : "Volume horaire (missions)"}
                      </div>

                      {/* SVG Line Frame */}
                      <svg viewBox="0 0 500 200" className="w-full h-full text-amber-500" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid Lines */}
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1="150" x2="500" y2="150" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                        
                        {/* Area Fill */}
                        <path
                          d={
                            adminChartMetric === "commission"
                              ? "M 0 170 L 80 150 L 160 135 L 240 100 L 320 85 L 400 45 L 480 25 L 500 20 L 500 200 L 0 200 Z"
                              : "M 0 150 L 80 160 L 160 110 L 240 130 L 320 70 L 400 85 L 480 30 L 500 45 L 500 200 L 0 200 Z"
                          }
                          fill="url(#chartGrad)"
                        />

                        {/* Stroke Path */}
                        <path
                          d={
                            adminChartMetric === "commission"
                              ? "M 0 170 Q 80 150 160 135 T 240 100 T 320 85 T 400 45 T 480 25 T 500 20"
                              : "M 0 150 Q 80 160 160 110 T 240 130 T 320 70 T 400 85 T 480 30 T 500 45"
                          }
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />

                        {/* Interactive dots */}
                        <circle cx="160" cy={adminChartMetric === "commission" ? 135 : 110} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="320" cy={adminChartMetric === "commission" ? 85 : 70} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="480" cy={adminChartMetric === "commission" ? 25 : 30} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                      </svg>

                      {/* Tooltip emulation */}
                      <div className="absolute bottom-16 right-20 bg-gray-950 text-white rounded-lg p-2 shadow-lg text-[9.5px] font-mono border border-gray-800 pointer-events-none">
                        <span className="text-gray-400 block font-sans">Performance Actuelle (Pic)</span>
                        <strong className="text-amber-400">
                          {adminChartMetric === "commission" ? "Commission: +185,420 XOF" : "Volume: 42 tâches/min"}
                        </strong>
                      </div>

                      {/* X Axis Labels */}
                      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                        <span>08:00</span>
                        <span>11:00</span>
                        <span>14:00 (Midi)</span>
                        <span>17:00</span>
                        <span>En direct</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Conversion moyenne</span>
                        <strong className="text-sm text-gray-950 font-mono">94.8%</strong>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">AI Auto-Approval</span>
                        <strong className="text-sm text-gray-950 font-mono">82%</strong>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Signalements Fraude</span>
                        <strong className="text-sm text-rose-600 font-mono">1.2%</strong>
                      </div>
                    </div>

                  </div>

                  {/* LIQUIDITY RESREVES POOL BY CURRENCY */}
                  <div className="bg-white border rounded-3xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Liquidité & Réserves Reseau</h3>
                      <p className="text-[11px] text-gray-400">Fonds circulants (disponibles et en attente) sur le système.</p>
                    </div>

                    {/* Ecosystem Cryptographic Wallets */}
                    <div className="space-y-4">
                      
                      {/* XOF FCFA */}
                      <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-gray-950">Francs CFA (XOF)</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">Afrique de l'Ouest</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-gray-400 block">Disponible</span>
                            <span className="font-mono font-black text-emerald-600">
                              {users.filter(u => u.currency === "XOF").reduce((acc, u) => acc + u.wallet.available, 0).toLocaleString()} F
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 block">En attente</span>
                            <span className="font-mono font-bold text-amber-600">
                              {users.filter(u => u.currency === "XOF").reduce((acc, u) => acc + u.wallet.pending, 0).toLocaleString()} F
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* EUR Euros */}
                      <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-gray-950">Euros (€)</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">Europe Continent</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-gray-400 block">Disponible</span>
                            <span className="font-mono font-black text-emerald-600">
                              {users.filter(u => u.currency === "EUR").reduce((acc, u) => acc + u.wallet.available, 0).toLocaleString()} €
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 block">En attente</span>
                            <span className="font-mono font-bold text-amber-600">
                              {users.filter(u => u.currency === "EUR").reduce((acc, u) => acc + u.wallet.pending, 0).toLocaleString()} €
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* USD Dollars */}
                      <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-gray-950">Dollars (USD $)</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">United States</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-gray-400 block">Disponible</span>
                            <span className="font-mono font-black text-emerald-600">
                              {users.filter(u => u.currency === "USD").reduce((acc, u) => acc + u.wallet.available, 0).toLocaleString()} $
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 block">En attente</span>
                            <span className="font-mono font-bold text-amber-600">
                              {users.filter(u => u.currency === "USD").reduce((acc, u) => acc + u.wallet.pending, 0).toLocaleString()} $
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="text-[9.5px] p-2.5 bg-amber-50/50 rounded-xl text-amber-800 font-semibold border border-amber-100 italic leading-relaxed">
                      💡 <strong>Note d'audit :</strong> Assurez-vous de posséder des liquidités suffisantes sur vos comptes marchands (Orange, Wave, Mobile Money) pour exécuter les demandes de retrait sous 5 min.
                    </div>

                  </div>

                </div>

                {/* SECURITY LOGS AUDIT TERMINAL FEED */}
                <div className="bg-white border rounded-3xl p-6">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 block">Journal d'Audit Central de Sécurité (Garde de Supervision)</span>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Console en direct</span>
                  </div>

                  <div className="bg-gray-950 text-emerald-400 font-mono text-xs rounded-2xl p-4 space-y-1.5 max-h-60 overflow-y-auto">
                    <p className="text-gray-500">[{new Date().toLocaleDateString()}] Initialisation de la console d'administration sécurisée par {currentUser?.name}...</p>
                    {submissions.filter(s => s.status === "pending").map((sub) => (
                      <p key={"log_sub_" + sub.id} className="text-amber-400">
                        &gt; [ALERTE AUDIT] Tâche "{sub.campaignTitle}" soumise par @{sub.participantUsername}. Analyse d'authenticité requise. Probabilité de fraude: {sub.fraudProbability}%.
                      </p>
                    ))}
                    {transactions.filter(t => t.type === "withdraw" && t.status === "pending").map((tx) => (
                      <p key={"log_tx_" + tx.id} className="text-rose-400">
                        &gt; [ALERTE FINANCE] Transfert suspect initié d'un montant de {tx.amount} {tx.currency} via {tx.method}. En attente de validation physique.
                      </p>
                    ))}
                    {transactions.filter(t => t.type === "deposit" && t.status === "pending").map((tx) => (
                      <p key={"log_dep_" + tx.id} className="text-blue-450 text-blue-300">
                        &gt; [INFO DEPOSIT] Preuve de paiement reçue de @{tx.details.split("@")[1]?.split(" ")[0] || tx.userId} via {tx.method}. Montant: {tx.amount} {tx.currency}.
                      </p>
                    ))}
                    <p className="text-emerald-500">&gt; [OK] Tous les processus d'automatisation d'IA antispam tournent à pleine performance.</p>
                    <p className="text-gray-500">&gt; Connexion cryptée établie. Port de service: 3000. Protocole sécurisé TLSv1.3 actif.</p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. PROOFS AUDIT & DEPOSITS VALIDATION */}
            {adminSubTab === "proofs" && (
              <div id="admin_tab_proofs" className="space-y-8 animate-fade-in">
                
                {/* 1. SUBMISSIONS REVIEWS */}
                <div className="bg-white border rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <span className="text-xs font-black uppercase text-gray-950 tracking-wider">Audit des preuves de missions soumises</span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      En attente d'évaluation ({submissions.filter(s => s.status === "pending").length})
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="py-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-extrabold text-gray-950">Mission: {sub.campaignTitle}</span>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Soumis par @{sub.participantUsername} • Gain : {sub.campaignReward} {sub.campaignCurrency}</p>
                          </div>
                          
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sub.status === "approved" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : sub.status === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : sub.status === "disputed"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            {sub.status === "approved" ? "Approuvé" : sub.status === "rejected" ? "Rejeté" : sub.status === "disputed" ? "Instruction" : "En Attente"}
                          </span>
                        </div>

                        {/* SUBMISSION VERBAL PROOFS */}
                        <div className="bg-gray-50 border p-3 rounded-xl space-y-2">
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Texte de preuve du participant</span>
                            <p className="text-xs text-gray-700">{sub.proofText || "Aucun texte renseigné."}</p>
                          </div>
                          
                          {sub.proofLink && (
                            <div>
                              <span className="text-[9px] font-bold text-gray-400 block uppercase">Lien fourni</span>
                              <a href={sub.proofLink} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 hover:underline">{sub.proofLink}</a>
                            </div>
                          )}

                          {sub.proofFileUrl && (
                            <div className="pt-1.5">
                              <span className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Capture d'écran de preuve</span>
                              <img src={sub.proofFileUrl} alt="Screenshot proof" className="max-h-24 rounded border object-contain bg-white" />
                            </div>
                          )}
                        </div>

                        {/* AI ASSISTANT ANTI FRAUD RESULT SCREEN */}
                        <div className="bg-emerald-50/10 border border-emerald-500/10 p-3 rounded-xl flex items-start gap-2 text-[11px] text-gray-700">
                          <Cpu className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[10px] text-emerald-700">Moteur Yaamaa Audit-AI :</span>
                            <span className="italic">"{sub.aiReport || 'Aucun rapport analytique généré.'}"</span>
                            <span className="block font-mono text-[9px] text-gray-400 mt-1">Indicateur de probabilité de fraude : <strong>{sub.fraudProbability}%</strong> (Seuil critique de tolérance : 30%)</span>
                          </div>
                        </div>

                        {/* REVIEW BUTTONS FOR PENDING AND COMPLIANCE */}
                        {sub.status === "pending" && (
                          <div className="flex flex-col gap-2 pt-2 border-t mt-1.5 border-dashed">
                            <input
                              type="text"
                              value={adminFeedbackText[sub.id] || ""}
                              onChange={(e) => setAdminFeedbackText({ ...adminFeedbackText, [sub.id]: e.target.value })}
                              placeholder="Directives obligatoires si correction demandée, ou feedback d'évaluation..."
                              className="w-full border border-gray-205 text-xs p-2.5 rounded-xl font-sans"
                            />
                            <div className="flex flex-wrap gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => handleReviewSubmission(sub.id, "rejected")}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-3.5 py-1.5 rounded-xl border border-rose-200 cursor-pointer"
                              >
                                ❌ Tâche Non Accomplie
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  if (!adminFeedbackText[sub.id]) {
                                    alert("Veuillez d'abord saisir l'instruction de travail à corriger dans le champ de texte!");
                                    return;
                                  }
                                  handleReviewSubmission(sub.id, "disputed");
                                }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold px-3.5 py-1.5 rounded-xl border border-amber-200 cursor-pointer"
                              >
                                ⚠️ Spécifier ce qu'il reste à faire
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReviewSubmission(sub.id, "approved")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-xl shadow cursor-pointer"
                              >
                                ✅ Tâche Accomplie
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {submissions.length === 0 && (
                      <p className="text-xs text-center text-gray-450 py-10">Aucune preuve de tâche sur la plateforme.</p>
                    )}
                  </div>
                </div>

                {/* 2. PENDING DEPOSITS AUDIT */}
                <div className="bg-white border rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <span className="text-xs font-black uppercase text-gray-950 tracking-wider">Validation des dépôts & recharges</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 font-sans">
                      Attente de validation manuelle ({transactions.filter(t => t.type === "deposit" && t.status === "pending").length})
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {transactions.filter(t => t.type === "deposit" && t.status === "pending").map((tx) => (
                      <div key={tx.id} className="py-4 space-y-2 flex flex-col md:flex-row items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{tx.details}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Demandeur : <strong>@{tx.username || tx.userId}</strong> • Montant : <strong className="text-emerald-600 font-bold">+{tx.amount} {tx.currency}</strong> via {tx.method}
                          </p>
                          <span className="text-[9px] text-gray-400 block font-mono">Réf Transaction : {tx.id}</span>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReviewDeposit(tx.id, "failed")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100 cursor-pointer"
                          >
                            Rejeter
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDeposit(tx.id, "completed")}
                            className="bg-emerald-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-emerald-500 cursor-pointer"
                          >
                            Valider & Créditer
                          </button>
                        </div>
                      </div>
                    ))}

                    {transactions.filter(t => t.type === "deposit" && t.status === "pending").length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-6">Aucune recharge en attente d'approbation financière.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 3. WITHDRAWALS & CAMPAIGN MODERATION */}
            {adminSubTab === "finance" && (
              <div id="admin_tab_finance" className="space-y-8 animate-fade-in">
                
                {/* 1. PENDING WITHDRAWALS SECTION */}
                <div className="bg-white border rounded-3xl p-6">
                  <span className="text-xs font-black uppercase text-gray-950 tracking-wider block mb-4 border-b pb-2">
                    Contrôle des décaissements de retraits suspects
                  </span>

                  <div className="divide-y divide-gray-150">
                    {transactions.filter(t => t.type === "withdraw" && t.status === "pending").map((tx) => (
                      <div key={tx.id} className="py-3 flex flex-col md:flex-row items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{tx.details}</p>
                          <span className="text-[10px] text-gray-400 font-mono block">ID Retrait: {tx.id} • Demande : {tx.amount} {tx.currency} via {tx.method}</span>
                          <span className="text-[9.5px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded mt-1 inline-block">Audit requis</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewWithdrawal(tx.id, "failed")}
                            className="bg-rose-50 text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100 cursor-pointer"
                          >
                            Annuler & Rembourser
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewWithdrawal(tx.id, "completed")}
                            className="bg-emerald-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-emerald-500 cursor-pointer"
                          >
                            Solder le Transfert
                          </button>
                        </div>
                      </div>
                    ))}

                    {transactions.filter(t => t.type === "withdraw" && t.status === "pending").length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-6">Aucune demande de retrait d'argent en attente.</p>
                    )}
                  </div>
                </div>

                {/* 2. CAMPAIGN MANAGEMENT OVERRIDES */}
                <div className="bg-white border rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <span className="text-xs font-black uppercase text-gray-950 tracking-wider">Modération des campagnes publicitaires d'influence</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 font-sans">
                      Actions d'administration
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="py-3 flex flex-col md:flex-row items-stretch justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-gray-950 block">{camp.title}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Créé par: <strong>@{camp.creatorUsername || 'Créateur'}</strong> • Budget : {camp.budgetTotal} {camp.targeting?.countries?.[0] ? getCurrencyForCountry(camp.targeting.countries[0]) : "EUR"} • Rémunération : {camp.rewardPerUser}
                          </p>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-1 rounded ${
                            camp.status === "active" ? "bg-emerald-50 text-emerald-700" : camp.status === "completed" ? "bg-zinc-100 text-zinc-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            Statut: {camp.status === "active" ? "Activée/En Ligne" : camp.status === "completed" ? "Terminée" : "En attente/Suspendue"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {camp.status !== "active" && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/campaigns/${camp.id}/status`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "active" })
                                  });
                                  if (res.ok) {
                                    setAdminMsg("La campagne a été approuvée et activée sur le réseau Yaamaa !");
                                    await syncPlatformData(currentUser?.id);
                                  }
                                } catch(e) {}
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-100 cursor-pointer"
                            >
                              Activer
                            </button>
                          )}
                          {camp.status === "active" && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/campaigns/${camp.id}/status`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "paused" })
                                  });
                                  if (res.ok) {
                                    setAdminMsg("La campagne a été suspendue.");
                                    await syncPlatformData(currentUser?.id);
                                  }
                                } catch(e) {}
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-amber-100 cursor-pointer"
                            >
                              Suspendre
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1 cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}

                    {campaigns.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-6">Aucune campagne publicitaire sur la plateforme.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 4. GLOBAL SETTINGS, MEMBERS & CORES */}
            {adminSubTab === "settings" && (
              <div id="admin_tab_settings" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                
                {/* LEFT: SETTINGS FORM */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* TARES AND COMMISSIONS SETTINGS */}
                  <div className="bg-white border rounded-3xl p-6 space-y-4">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-gray-950 block border-b pb-2 flex items-center gap-1">
                      ⚖️ Tarifs et Commissions de l'Instance
                    </span>
                    
                    <form onSubmit={handleSaveAdminSettings} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commission de la Plateforme (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={adminFeePercent}
                            onChange={(e) => setAdminFeePercent(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="0"
                            max="100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Montant Retrait Minimum</label>
                          <input
                            type="number"
                            step="0.01"
                            value={adminMinWithdrawal}
                            onChange={(e) => setAdminMinWithdrawal(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="0.1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rémunération de base mission</label>
                          <input
                            type="number"
                            step="0.01"
                            value={adminBaseReward}
                            onChange={(e) => setAdminBaseReward(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="0.01"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commission de parrainage (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={adminDefaultCommission}
                            onChange={(e) => setAdminDefaultCommission(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="0px"
                            max="100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prix Pack Premium (XOF / Devise)</label>
                          <input
                            type="number"
                            step="1"
                            value={adminMerchantPremiumPrice}
                            onChange={(e) => {
                              setAdminMerchantPremiumPrice(e.target.value);
                              setAdminMerchantNumberPrice(e.target.value); // Sync for legacy code
                            }}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prix Pack Or / Gold (XOF / Devise)</label>
                          <input
                            type="number"
                            step="1"
                            value={adminMerchantGoldPrice}
                            onChange={(e) => setAdminMerchantGoldPrice(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prix Pack Diamant / Diamond (XOF / Devise)</label>
                          <input
                            type="number"
                            step="1"
                            value={adminMerchantDiamondPrice}
                            onChange={(e) => setAdminMerchantDiamondPrice(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            required
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[11px] font-semibold text-gray-950 block">Geler les retraits financiers</span>
                          <span className="text-[9px] text-gray-400 block font-mono">Désactivation d'urgence globale</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={adminIsFreezingWithdrawals}
                          onChange={(e) => setAdminIsFreezingWithdrawals(e.target.checked)}
                          className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition font-sans shadow cursor-pointer"
                      >
                        Enregistrer les Paramètres de Base
                      </button>
                    </form>
                  </div>

                  {/* CRITICAL SAFETY RULES SWITCHES FORM (FOUNDER ONLY) */}
                  {currentUser?.role === "founder" && (
                    <div className="bg-white border rounded-3xl p-6 space-y-4">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-700 block flex items-center gap-1.5">
                          🛡️ Règles Systèmes Supérieures (Super Admin)
                        </span>
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Rôles Founder</span>
                      </div>

                      <div className="space-y-3">
                        
                        {/* GELER RETRAITS */}
                        <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[11px] font-bold text-gray-950">Geler tous les retraits</span>
                            <span className="text-[9px] text-gray-400 block">Désactiver temporairement les transferts</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={critWithdrawalFrozen}
                            onChange={(e) => setCritWithdrawalFrozen(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                        </div>

                        {/* COMMISSION PLATFORME */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-650 uppercase">Taux de Commission Plateforme (%)</label>
                          <input
                            type="number"
                            value={critPlatformFee}
                            onChange={(e) => setCritPlatformFee(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                          />
                        </div>

                        {/* EXCLUDE COUNTRIES */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-650 uppercase">Pays Suspendus (Séparateur: virgule)</label>
                          <input
                            type="text"
                            value={critSuspendedCountries}
                            onChange={(e) => setCritSuspendedCountries(e.target.value)}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            placeholder="Mali, Soudan, ..."
                          />
                        </div>

                        {/* EXCLUDE DEV DEVISES */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-650 uppercase">Devises Suspendues (ex: RUB, AFN)</label>
                          <input
                            type="text"
                            value={critSuspendedCurrencies}
                            onChange={(e) => setCritSuspendedCurrencies(e.target.value)}
                            className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-mono"
                            placeholder="RUB, ..."
                          />
                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={handleSaveFounderSettings}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-xl transition shadow cursor-pointer"
                      >
                        Sauvegarder les règles suprêmes
                      </button>
                    </div>
                  )}

                </div>

                {/* RIGHT: MEMBER LIST */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* FOUNNDER BADGE PANEL */}
                  <div className="bg-gradient-to-tr from-indigo-950 to-indigo-850 text-white rounded-3xl p-5 shadow-sm space-y-2">
                    <span className="text-[10px] text-indigo-300 uppercase tracking-widest block font-extrabold font-mono">Contrôles Souverains</span>
                    <p className="text-xs leading-relaxed text-indigo-150">
                      En tant qu'opérateur de la plateforme Yaamaa, vous êtes habilité à promouvoir ou exclure des participants et à configurer la double-authentification administrative.
                    </p>
                  </div>

                  {/* USER LIST MANAGEMENT FOR PROMOTIONS AND SUSPENSIONS */}
                  <div className="bg-white border rounded-3xl p-5">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-gray-950 block mb-3">Rôles & Exclusions Membres ({users.length})</span>
                    
                    <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
                      {users.map((usr) => (
                        <div key={usr.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-950 truncate">@{usr.username}</p>
                            <span className="text-[9px] text-gray-400 tracking-wide font-mono uppercase block">{usr.role} • {usr.country}</span>
                          </div>

                          {currentUser?.role === "founder" && usr.id !== currentUser.id && (
                            <div className="flex gap-1 shrink-0">
                              {/* Ban and Unban */}
                              <button
                                type="button"
                                onClick={() => handleToggleUserSuspension(usr.id, usr.isSuspended)}
                                className={`p-1.5 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer ${
                                  usr.isSuspended ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {usr.isSuspended ? "Activer" : "Exclure"}
                              </button>

                              {/* Promote / Demote */}
                              <button
                                type="button"
                                onClick={() => handleFounderRoleToggle(usr.id, usr.role)}
                                className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded text-[8.5px] font-black text-gray-600 uppercase cursor-pointer"
                              >
                                {usr.role === "admin" ? "Demote" : "Admin"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT: 5. MEMBERS REGISTRY (FULL DETAILS / IDENTIFIER LEDGER) */}
            {adminSubTab === "members_registry" && (
              <div id="admin_tab_members_registry" className="space-y-6 animate-fade-in text-gray-900">
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                        👥 Registre Complet des Membres & Identifiants
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Consultez tous les profils, les e-mails, les numéros de téléphone, les pays, les devises, les portefeuilles, etc.
                      </p>
                    </div>
                    
                    {/* Role Filtration */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={memberRoleFilter}
                        onChange={(e) => setMemberRoleFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-auto cursor-pointer"
                      >
                        <option value="all">Tous les rôles</option>
                        <option value="participant">Participants</option>
                        <option value="advertiser">Annonceurs</option>
                        <option value="admin">Administrateurs</option>
                        <option value="founder">Fondateurs</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Rechercher par nom, pseudo, email ou pays..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Desktop view: Tabular structure */}
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-gray-100">
                          <th className="p-4">Identifiant / Membre</th>
                          <th className="p-4">Informations d'Inscription</th>
                          <th className="p-4">Géographie & Devise</th>
                          <th className="p-4">Finance & Portefeuille</th>
                          <th className="p-4">Parrainage</th>
                          <th className="p-4">Sécurité & Statut</th>
                          {currentUser?.role === "founder" && <th className="p-4 text-center">Actions rapides</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-750">
                        {users
                          .filter((usr) => {
                            const query = memberSearchQuery.toLowerCase();
                            const matchesSearch =
                              usr.name?.toLowerCase().includes(query) ||
                              usr.username?.toLowerCase().includes(query) ||
                              usr.email?.toLowerCase().includes(query) ||
                              usr.phone?.toLowerCase().includes(query) ||
                              usr.country?.toLowerCase().includes(query);
                            const matchesRole =
                              memberRoleFilter === "all" || usr.role === memberRoleFilter;
                            return matchesSearch && matchesRole;
                          })
                          .map((usr) => {
                            const isRevealed = revealPasswordsId.includes(usr.id);
                            return (
                              <tr key={usr.id} className="hover:bg-slate-50/50">
                                {/* Id & Pseudo */}
                                <td className="p-4 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={usr.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="h-8 w-8 rounded-full border bg-gray-50 object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-950 truncate">@{usr.username}</p>
                                      <span className="text-[10px] text-gray-400 font-mono">ID: {usr.id}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Email, Password, Name, Phone */}
                                <td className="p-4 space-y-1">
                                  <p className="font-bold text-gray-955">{usr.name}</p>
                                  <p className="text-gray-500">{usr.email}</p>
                                  {usr.phone && <p className="text-gray-400 font-mono text-[10px]">Tél: {usr.phone}</p>}
                                  
                                  {/* Simulated Password credentials viewer */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <span className="text-[9px] uppercase font-bold text-gray-400">Mot de passe :</span>
                                    <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-750">
                                      {isRevealed ? usr.password || "Aucun" : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isRevealed) {
                                          setRevealPasswordsId(revealPasswordsId.filter((id) => id !== usr.id));
                                        } else {
                                          setRevealPasswordsId([...revealPasswordsId, usr.id]);
                                        }
                                      }}
                                      className="text-[9px] text-amber-600 underline font-semibold hover:text-amber-850"
                                    >
                                      {isRevealed ? "Masquer" : "Afficher"}
                                    </button>
                                  </div>
                                </td>

                                {/* Country & Currency */}
                                <td className="p-4 space-y-1">
                                  <span className="font-semibold text-gray-800 block">{usr.country}</span>
                                  <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-150 rounded px-1.5 py-0.5 inline-block">
                                    {usr.currency}
                                  </span>
                                </td>

                                {/* Wallet Available and Pending */}
                                <td className="p-4 space-y-1">
                                  <p className="font-bold text-emerald-600 font-mono">
                                    Disponible: {usr.wallet?.available?.toLocaleString() || "0"} {usr.currency}
                                  </p>
                                  <p className="text-amber-500 font-mono text-[10px] font-bold">
                                    En attente: +{usr.wallet?.pending?.toLocaleString() || "0"} {usr.currency}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-mono">
                                    Cumulé gagné: {usr.wallet?.totalEarned?.toLocaleString() || "0"} {usr.currency}
                                  </p>
                                </td>

                                {/* Referral stuff */}
                                <td className="p-4 space-y-1">
                                  <p className="font-mono font-bold text-indigo-700">Code: {usr.referralCode || "N/A"}</p>
                                  {usr.referredBy && (
                                    <p className="text-[10px] text-gray-400 block font-mono">
                                      Parrainé par:{" "}
                                      <span className="bg-gray-100 px-1 rounded">
                                        {users.find((u) => u.id === usr.referredBy || u.referralCode === usr.referredBy)?.username || usr.referredBy}
                                      </span>
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-500 block">
                                    Revenus parrainage: {usr.wallet?.referralEarned || "0"} {usr.currency}
                                  </p>
                                </td>

                                {/* Security / Status badge and role */}
                                <td className="p-4 space-y-1.5">
                                  <div>
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase font-sans border shrink-0 ${
                                      usr.role === "founder" 
                                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                                        : usr.role === "admin"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : usr.role === "advertiser"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                    }`}>
                                      {usr.role === "founder" ? "Fondateur" : usr.role === "admin" ? "Administrateur" : usr.role === "advertiser" ? "Annonceur" : "Participant"}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                      usr.isSuspended ? "text-rose-600" : "text-emerald-700"
                                    }`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${usr.isSuspended ? "bg-rose-600 animate-ping" : "bg-emerald-500"}`} />
                                      {usr.isSuspended ? "Exclu / Suspendu" : "Compte Actif"}
                                    </span>

                                    <span className="text-[10px] text-gray-400 font-mono">
                                      2FA: {usr.is2faEnabled ? "🔐 Activé" : "❌ Désactivé"}
                                    </span>
                                  </div>
                                </td>

                                {/* Action controls (for Founder Only) */}
                                {currentUser?.role === "founder" && (
                                  <td className="p-4 text-center shrink-0">
                                    {usr.id !== currentUser.id ? (
                                      <div className="flex flex-col gap-1 items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleUserSuspension(usr.id, usr.isSuspended)}
                                          className={`w-20 py-1 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer border ${
                                            usr.isSuspended 
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                          }`}
                                        >
                                          {usr.isSuspended ? "Activer" : "Exclure"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleFounderRoleToggle(usr.id, usr.role)}
                                          className="w-20 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-1 rounded text-[9px] font-bold uppercase cursor-pointer"
                                        >
                                          {usr.role === "admin" ? "Rétrograder" : "Admin"}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic">C'est vous-même</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {users.filter((usr) => {
                    const query = memberSearchQuery.toLowerCase();
                    const matchesSearch =
                      usr.name?.toLowerCase().includes(query) ||
                      usr.username?.toLowerCase().includes(query) ||
                      usr.email?.toLowerCase().includes(query);
                    const matchesRole = memberRoleFilter === "all" || usr.role === memberRoleFilter;
                    return matchesSearch && matchesRole;
                  }).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border border-dashed rounded-2xl mt-4">
                      <p className="text-xs text-gray-500 font-medium">Aucun membre ne correspond à vos critères de recherche.</p>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB CONTENT: 6. SYSTEM AUDIT / SYSTEM EVENT LOGS (AUDIT TRAIL) */}
            {adminSubTab === "audit_logs" && (
              <div id="admin_tab_audit_logs" className="space-y-6 animate-fade-in text-gray-900">
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                        🕒 Journal d'Audit & Historique d'Activités Globales
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Traces d'événements, connexions d'utilisateurs, dépôts, retraits, exclusions et modifications de paramètres système.
                      </p>
                    </div>

                    {/* Filter action */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-auto cursor-pointer"
                      >
                        <option value="all">Événements de tous types</option>
                        <option value="Connexion réussie">Connexions</option>
                        <option value="Inscription">Inscriptions</option>
                        <option value="Débit Retrait">Demandes de Retraits</option>
                        <option value="Validation Retrait">Validations de Retrait</option>
                        <option value="Demande Dépôt">Soumission de Dépôts</option>
                        <option value="Validation Dépôt">Validations de Dépôt</option>
                        <option value="Création Campagne">Création Campagnes</option>
                        <option value="Statut Campagne">Modifications Campagnes</option>
                        <option value="Soumission Preuve">Preuves Soumises</option>
                        <option value="Révision Preuve">Validations Preuves (Aura-AI)</option>
                        <option value="Gestion Roles">Modifications de Rôles</option>
                        <option value="Ajustement Tarifs">Ajustements Paramètres</option>
                        <option value="Restauration Base">Restaurations Base</option>
                        <option value="Compte Suspendu">Exclusions / Suspensions</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Rechercher par opérateur ou détails..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Audit Ledger List */}
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <div className="bg-gray-50 px-4 py-3 border-b text-[10px] font-extrabold uppercase tracking-wider text-gray-500 grid grid-cols-12 gap-3 min-w-[800px]">
                      <div className="col-span-3">Date / Instant UTC</div>
                      <div className="col-span-3">Opérateur / Utilisateur</div>
                      <div className="col-span-2">Type d'Événement</div>
                      <div className="col-span-4">Détails de l'Action & Impact</div>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1 min-w-[800px]">
                      {auditLogs
                        .filter((log) => {
                          const query = auditSearchQuery.toLowerCase();
                          const matchesQuery =
                            log.username?.toLowerCase().includes(query) ||
                            log.action?.toLowerCase().includes(query) ||
                            log.details?.toLowerCase().includes(query) ||
                            log.userId?.toLowerCase().includes(query);
                          const matchesAction =
                            auditActionFilter === "all" || log.action === auditActionFilter;
                          return matchesQuery && matchesAction;
                        })
                        .map((log) => (
                          <div 
                            key={log.id} 
                            onClick={() => setSelectedAuditLog(log)}
                            className="px-4 py-3 grid grid-cols-12 gap-3 text-xs items-center hover:bg-slate-100/80 cursor-pointer transition active:bg-slate-200"
                            title="Cliquer pour afficher les détails complets de cette activité"
                          >
                            {/* Timestamp */}
                            <div className="col-span-3 text-gray-400 font-mono text-[10.5px]">
                              {new Date(log.timestamp).toLocaleString()}
                              {log.ip && <span className="block text-[9px] text-gray-300 font-bold">IP: {log.ip}</span>}
                            </div>

                            {/* Operator info */}
                            <div className="col-span-3">
                              <span className="font-bold text-gray-950 block">@{log.username}</span>
                              <span className="text-[9.5px] uppercase font-mono text-gray-400">
                                {log.role} (ID: {log.userId})
                              </span>
                            </div>

                            {/* Event Type Action */}
                            <div className="col-span-2">
                              <span className={`inline-block text-[9.5px] font-semibold px-2 py-0.5 rounded font-sans uppercase border tracking-wider ${
                                log.action.includes("Excl") || log.action.includes("Suspend") || log.action.includes("Désact")
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : log.action.includes("Connex") || log.action.includes("Inscr") || log.action.includes("Valid") || log.action.includes("Réus")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : log.action.includes("Mise à jour") || log.action.includes("Ajust") || log.action.includes("Gestion") || log.action.includes("Modif")
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {log.action}
                              </span>
                            </div>

                            {/* Description DETAILS */}
                            <div className="col-span-4 text-xs font-medium text-gray-700 italic truncate" title={log.details}>
                              "{log.details}"
                            </div>
                          </div>
                        ))}

                      {auditLogs.filter((log) => {
                        const query = auditSearchQuery.toLowerCase();
                        const matchesQuery =
                          log.username?.toLowerCase().includes(query) ||
                          log.action?.toLowerCase().includes(query) ||
                          log.details?.toLowerCase().includes(query);
                        const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
                        return matchesQuery && matchesAction;
                      }).length === 0 && (
                        <p className="text-center py-10 text-gray-400 text-xs italic">Aucune trace d'audit trouvée.</p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Modal for Audit Log */}
                  {selectedAuditLog && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="audit_log_modal_container">
                      <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-6 text-left">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <h3 className="text-base font-black text-gray-950 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-600 animate-pulse" />
                            Détails de l'Activité
                          </h3>
                          <button 
                            onClick={() => setSelectedAuditLog(null)}
                            className="p-1 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 font-bold text-xs cursor-pointer"
                          >
                            Fermer
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Event Action Header */}
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Type d'Événement</span>
                              <span className="text-sm font-extrabold text-gray-900">{selectedAuditLog.action}</span>
                            </div>
                            <span className={`inline-block text-[9.5px] font-semibold px-2.5 py-1 rounded font-sans uppercase border tracking-wider ${
                              selectedAuditLog.action.includes("Excl") || selectedAuditLog.action.includes("Suspend") || selectedAuditLog.action.includes("Désact")
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : selectedAuditLog.action.includes("Connex") || selectedAuditLog.action.includes("Inscr") || selectedAuditLog.action.includes("Valid") || selectedAuditLog.action.includes("Réus")
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : selectedAuditLog.action.includes("Mise à jour") || selectedAuditLog.action.includes("Ajust") || selectedAuditLog.action.includes("Gestion") || selectedAuditLog.action.includes("Modif")
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              Actif
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Operator Username */}
                            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Opérateur / Utilisateur</span>
                              <span className="text-xs font-black text-gray-950">@{selectedAuditLog.username}</span>
                            </div>

                            {/* Operator Role */}
                            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rôle de l'Utilisateur</span>
                              <span className="text-xs font-mono font-bold text-gray-600 uppercase">{selectedAuditLog.role}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Operator ID */}
                            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Identifiant Unique (ID)</span>
                              <span className="text-xs font-mono text-gray-600 truncate block">{selectedAuditLog.userId}</span>
                            </div>

                            {/* IP Address */}
                            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Adresse IP de Connexion</span>
                              <span className="text-xs font-mono font-bold text-gray-700">{selectedAuditLog.ip || "127.0.0.1 (Localhost)"}</span>
                            </div>
                          </div>

                          {/* Full Date & Time */}
                          <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date et Heure de l'Événement</span>
                            <div className="flex flex-col text-xs font-mono font-bold text-gray-800">
                              <span>📅 Date Locale : {new Date(selectedAuditLog.timestamp).toLocaleString()}</span>
                              <span className="text-[10px] text-gray-500 font-normal mt-0.5">⏱️ Heure ISO UTC : {selectedAuditLog.timestamp}</span>
                            </div>
                          </div>

                          {/* Detailed impact */}
                          <div className="p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-800 space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Détails de l'Action & Impact Système</span>
                            <p className="text-xs font-sans leading-relaxed text-zinc-100">
                              "{selectedAuditLog.details}"
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const detailsText = `Yaamaa Audit Log Details:\nID: ${selectedAuditLog.id}\nAction: ${selectedAuditLog.action}\nOperator: @${selectedAuditLog.username} (${selectedAuditLog.role})\nDate: ${new Date(selectedAuditLog.timestamp).toLocaleString()}\nIP: ${selectedAuditLog.ip || "N/A"}\nDetails: ${selectedAuditLog.details}`;
                              navigator.clipboard.writeText(detailsText);
                              alert("Détails copiés dans le presse-papier !");
                            }}
                            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                          >
                            Copier les détails
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(null)}
                            className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 7. ADMIN BOUTIQUE MODERATOR */}
            {adminSubTab === "admin_boutique" && (
              <div id="admin_tab_boutique" className="space-y-6 animate-fade-in text-gray-900">
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2 border-b pb-4 mb-6">
                    <Store className="h-4.5 w-4.5 text-emerald-600" />
                    Modération de la Boutique (E-Commerce)
                  </h3>

                  {/* STATS TILES */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 border p-4 rounded-2xl">
                      <span className="text-[10px] text-gray-500 block">TOTAL BOUTIQUES CRÉÉES</span>
                      <span className="text-lg font-black text-gray-900">{shops.length}</span>
                    </div>
                    <div className="bg-gray-50 border p-4 rounded-2xl">
                      <span className="text-[10px] text-gray-500 block">TOTAL PRODUITS PUBLIÉS</span>
                      <span className="text-lg font-black text-gray-900">{products.length}</span>
                    </div>
                    <div className="bg-gray-50 border p-4 rounded-2xl">
                      <span className="text-[10px] text-gray-500 block">PRODUITS BANNIS / LIMITÉS</span>
                      <span className="text-lg font-black text-rose-650">{products.filter(p => p.isBanned).length}</span>
                    </div>
                  </div>

                  {/* PRODUCTS LIST TABLE */}
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Catalogue des produits publiés</h4>
                  <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
                          <th className="p-3">Produit</th>
                          <th className="p-3">Boutique</th>
                          <th className="p-3">Prix</th>
                          <th className="p-3">Ventes</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700">
                        {products.map(prod => (
                          <tr key={prod.id} className="hover:bg-gray-50/50">
                            <td className="p-3 flex items-center gap-2">
                              {prod.images && prod.images.length > 0 ? (
                                <img src={prod.images[0]} alt="" className="h-8 w-8 rounded-lg object-cover bg-gray-100 border shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-gray-100 border flex items-center justify-center shrink-0">📦</div>
                              )}
                              <div>
                                <span className="font-bold block text-gray-950">{prod.name}</span>
                                <span className="text-[9.5px] text-gray-450 font-mono italic">{prod.category}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-750">
                              {prod.shopName}
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-950">
                              {prod.price.toLocaleString()} {prod.currency}
                            </td>
                            <td className="p-3 font-bold text-emerald-600">{prod.salesCount || 0}</td>
                            <td className="p-3">
                              <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded ${
                                prod.isBanned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {prod.isBanned ? "Banni" : "Actif / Visible"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`Voulez-vous modifier l'état de modération de ${prod.name} ?`)) return;
                                  const res = await fetch(`/api/admin/products/moderate`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      productId: prod.id,
                                      action: prod.isBanned ? "unban" : "ban",
                                      operatorId: currentUser?.id
                                    })
                                  });
                                  if (res.ok) {
                                    await syncPlatformData();
                                  } else {
                                    alert("Erreur de modification administrative.");
                                  }
                                }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                                  prod.isBanned ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                }`}
                              >
                                {prod.isBanned ? "Réactiver" : "Bannir"}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-400 italic">Aucun produit configuré sur la plateforme.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 8. ADMIN ESCROW DISPUTE ARBITRATIONS */}
            {adminSubTab === "admin_disputes" && (
              <div id="admin_tab_disputes" className="space-y-6 animate-fade-in text-gray-900">
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2 border-b pb-4 mb-6">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
                    Arbitrage des Litiges Escrow & Séquestre Financier
                  </h3>
                  <p className="text-xs text-gray-500 -mt-4 mb-6">
                    Lorsqu'un acheteur signale un problème avec sa commande, les fonds restent gelés sur le compte de séquestre temporaire (Escrow) de la plateforme. En tant qu'administrateur, prenez une décision arbitrale finale.
                  </p>

                  <div className="divide-y divide-gray-100 text-sm">
                    {disputes.map(disp => (
                      <div key={disp.id} className="py-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                              ID Dossier : #{disp.id}
                            </span>
                            <p className="text-xs text-gray-500 font-bold font-mono">Dossier Commande lié : {disp.orderId}</p>
                            <p className="text-xs font-bold text-gray-900">
                              Acheteur de plainte : <span className="text-gray-700 font-normal">@{disp.buyerUsername} (ID: {disp.buyerId})</span>
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              Vendeur de boutique : <span className="text-gray-700 font-normal">ID: {disp.sellerId}</span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-gray-400 block font-mono">SOMME RÉCLAMÉE</span>
                            <span className="text-base font-black text-rose-600">
                              {disp.reqRefundAmount.toLocaleString()} {disp.currency}
                            </span>
                            <span className={`block text-[9.5px] font-bold uppercase mt-1 ${
                              disp.status === "open" ? "text-amber-500" : "text-emerald-600"
                            }`}>
                              ● {disp.status === "open" ? "En attente d'arbitrage" : `Résolu (${disp.status})`}
                            </span>
                          </div>
                        </div>

                        {/* Dispute Claim Description */}
                        <div className="bg-gray-50 border p-4 rounded-2xl text-xs text-gray-700 italic">
                          " {disp.description} "
                        </div>

                        {/* DECISION ACTION BUTTONS */}
                        {disp.status === "open" && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={async () => {
                                if (!window.confirm("Valider l'arbitrage : Rembourser intégralement l'acheteur ?")) return;
                                const res = await fetch(`/api/admin/disputes/resolve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    disputeId: disp.id,
                                    resolution: "refund_buyer",
                                    adminFeedback: "Arbitrage administratif : l'acheteur a été remboursé intégralement.",
                                    operatorId: currentUser?.id
                                  })
                                });
                                if (res.ok) {
                                  alert("Litige résolu : acheteur remboursé.");
                                  await syncPlatformData();
                                } else {
                                  alert("Erreur de traitement.");
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
                            >
                              Rembourser l'Acheteur ⏪
                            </button>

                            <button
                              onClick={async () => {
                                if (!window.confirm("Valider l'arbitrage : Libérer l'argent au vendeur ?")) return;
                                const res = await fetch(`/api/admin/disputes/resolve`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    disputeId: disp.id,
                                    resolution: "pay_seller",
                                    adminFeedback: "Arbitrage administratif : Les fonds ont été reversés au vendeur.",
                                    operatorId: currentUser?.id
                                  })
                                });
                                if (res.ok) {
                                  alert("Litige résolu : fonds versés au vendeur.");
                                  await syncPlatformData();
                                } else {
                                  alert("Erreur de traitement.");
                                }
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
                            >
                              Payer le Vendeur ✅
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {disputes.length === 0 && (
                      <div className="py-10 text-center text-gray-405 text-xs italic"> Aucun litige Escrow actif sur la plateforme.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 9. ADMIN AD CAMPAIGN VALIDATION */}
            {adminSubTab === "admin_promos" && (
              <div id="admin_tab_promos" className="space-y-6 animate-fade-in text-gray-900">
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2 border-b pb-4 mb-6">
                    <Megaphone className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                    Validation des Campagnes de Promotions & Publicités
                  </h3>

                  <div className="divide-y divide-gray-100">
                    {promoCampaigns.map(camp => (
                      <div key={camp.id} className="py-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                              Type : {camp.type} • Pack: {camp.budgetTier}
                            </span>
                            <h4 className="text-sm font-black text-gray-950 mt-1">{camp.title}</h4>
                            <p className="text-[11px] text-gray-500">
                              Annonceur : <span className="font-bold text-gray-900">@{camp.ownerUsername}</span> (ID: {camp.ownerId})
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-gray-400 block font-mono">BUDGET PUBLICITAIRE</span>
                            <span className="text-sm font-black text-emerald-600">{camp.budgetPrice.toLocaleString()} {camp.currency}</span>
                            <span className={`block text-[10px] font-bold mt-1 uppercase ${
                              camp.status === "active" ? "text-emerald-600" :
                              camp.status === "rejected" ? "text-rose-600" : "text-amber-500"
                            }`}>
                              ● {camp.status === "active" ? "Campagne active" : 
                                 camp.status === "rejected" ? "Refusée & Remboursée" : "En attente d'approbation"}
                            </span>
                          </div>
                        </div>

                        {/* Campaign Creative Details */}
                        <div className="bg-gray-50 border p-4 rounded-2xl space-y-2 text-xs text-gray-700">
                          <p><strong>Cible / Produit :</strong> "{camp.productServiceName}"</p>
                          <p><strong>Description :</strong> {camp.description}</p>
                          <p><strong>Lien de destination :</strong> <a href={camp.destLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-[11px]">{camp.destLink}</a></p>
                          <p className="font-mono text-[10px] mt-1 text-gray-400 flex items-center gap-1">📍 Pays Cibles : {camp.targetCountries.join(", ")}</p>
                        </div>

                        {/* VALIDATE ACTIONS */}
                        {camp.status === "pending_validation" && (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!window.confirm("Approuver cette campagne publicitaire ? Elle commencera sa diffusion immédiate.")) return;
                                const res = await fetch(`/api/admin/promotions/review`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    campaignId: camp.id,
                                    status: "active",
                                    adminFeedback: "Campagne approuvée.",
                                    operatorId: currentUser?.id
                                  })
                                });
                                if (res.ok) {
                                  await syncPlatformData();
                                } else {
                                  alert("Erreur de validation.");
                                }
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
                            >
                              Approuver & Diffuser 🚀
                            </button>

                            <button
                              onClick={async () => {
                                if (!window.confirm("Refuser cette campagne ? Les fonds de l'annonceur lui seront remboursés.")) return;
                                const res = await fetch(`/api/admin/promotions/review`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    campaignId: camp.id,
                                    status: "rejected",
                                    adminFeedback: "Campagne refusée par la modération.",
                                    operatorId: currentUser?.id
                                  })
                                });
                                if (res.ok) {
                                  await syncPlatformData();
                                } else {
                                  alert("Erreur de modification.");
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
                            >
                              Rejeter (rembourser) ❌
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {promoCampaigns.length === 0 && (
                      <div className="py-10 text-center text-gray-400 text-xs italic"> Aucune promotion lancée pour validation sur la plateforme.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 11. TABLEAU DE PUBLICATIONS ADMINISTRATIVES */}
            {adminSubTab === "broadcast" && (
              <AdminPublishingBoard
                campaigns={broadcastCampaigns}
                currentUser={currentUser}
                onRefreshData={() => syncPlatformData(currentUser?.id)}
              />
            )}

            {/* 12. GESTION DES CADEAUX VIRTUELS & PARAMÈTRES ÉMETTEUR */}
            {adminSubTab === "admin_gifts" && (
              <AdminGiftsPanel 
                systemMetrics={systemMetrics}
                currentUser={currentUser}
                syncPlatformData={syncPlatformData}
              />
            )}

            {/* 13. GESTION DES BADGES & ABONNEMENTS MARCHANDS */}
            {adminSubTab === "admin_subscriptions" && (
              <AdminSubscriptionsPanel
                currentUser={currentUser}
                currentLanguage={currentLanguage}
                users={users}
                onRefreshData={() => syncPlatformData(currentUser?.id)}
              />
            )}

            {/* 14. CENTRE DE SUPERVISION INTELLIGENT */}
            {adminSubTab === "supervision" && (
              <AdminSupervisionPanel
                currentUser={currentUser}
                currentLanguage={currentLanguage}
                users={users}
                systemMetrics={systemMetrics}
                onRefreshData={() => syncPlatformData(currentUser?.id)}
              />
            )}

            {/* CENTRE DE MODÉRATION ET DE VALIDATION */}
            {adminSubTab === "moderation" && (
              <ModerationCenterModal
                currentUser={currentUser}
                onClose={() => setAdminSubTab("dashboard")}
              />
            )}

            {/* 15. CLÉS API & INTÉGRATIONS */}
            {adminSubTab === "api_keys" && (
              <AdminApiKeysPanel
                systemMetrics={systemMetrics}
                currentUser={currentUser}
                onRefreshData={() => syncPlatformData(currentUser?.id)}
              />
            )}

            {/* 16. SYSTÈMES DE PARRAINAGE ET COMMISSIONS */}
            {adminSubTab === "referral_program" && (
              <div id="admin_tab_referral_program" className="space-y-8 animate-fade-in">
                <div className="bg-white border rounded-3xl p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                    <div>
                      <h2 className="text-lg font-black text-gray-950 flex items-center gap-2">
                        <span>🤝</span> Système Automatique de Parrainage & Commissions
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Configurez les règles de versement instantané des commissions de parrainage sans intervention manuelle.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${adminReferralEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {adminReferralEnabled ? '● Programme Actif' : '○ Programme Désactivé'}
                      </span>
                    </div>
                  </div>

                  {/* STATS OVERVIEW */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Total Commissions Versées</span>
                      <p className="text-2xl font-black text-amber-950 font-mono">
                        {transactions.filter(t => t.type === "referral_bonus").reduce((sum, t) => sum + t.amount, 0).toLocaleString()} {currentUser?.currency || 'XOF'}
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Filleuls Enregistrés</span>
                      <p className="text-2xl font-black text-emerald-950 font-mono">
                        {users.filter(u => u.referredBy).length.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-2xl p-5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Transactions Bonus</span>
                      <p className="text-2xl font-black text-indigo-950 font-mono">
                        {transactions.filter(t => t.type === "referral_bonus").length.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* CONFIG FORM */}
                  <form onSubmit={handleSaveAdminSettings} className="space-y-6 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
                        <div>
                          <label className="text-xs font-bold text-gray-900 block">Activer le Programme de Parrainage</label>
                          <span className="text-[10px] text-gray-500">Autorise le calcul et le versement automatique des commissions.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={adminReferralEnabled}
                          onChange={(e) => setAdminReferralEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl border">
                        <label className="text-xs font-bold text-gray-900 block mb-1">Mode de Calcul de la Commission</label>
                        <select
                          value={adminReferralMode}
                          onChange={(e) => setAdminReferralMode(e.target.value as "percentage" | "fixed")}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono bg-white"
                        >
                          <option value="percentage">Pourcentage (%) du montant de l'achat</option>
                          <option value="fixed">Montant fixe par parrainage</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          {adminReferralMode === "percentage" ? "Taux de Commission (%)" : "Montant Fixe de Commission"}
                        </label>
                        <input
                          type="number"
                          step={adminReferralMode === "percentage" ? "1" : "100"}
                          value={adminReferralValue}
                          onChange={(e) => setAdminReferralValue(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono"
                          required
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Plafond Maximum de Gains par Parrain</label>
                        <input
                          type="number"
                          step="1000"
                          value={adminReferralMaxCap}
                          onChange={(e) => setAdminReferralMaxCap(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono"
                          required
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Limite Max de Filleuls par Membre</label>
                        <input
                          type="number"
                          step="1"
                          value={adminReferralMaxReferrals}
                          onChange={(e) => setAdminReferralMaxReferrals(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-600/25 transition cursor-pointer"
                      >
                        Enregistrer les Paramètres de Parrainage
                      </button>
                    </div>
                  </form>

                  {/* PAID COMMISSIONS HISTORY TABLE */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
                      <span>📜</span> Historique Récent des Commissions Versées
                    </h3>
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b text-gray-500 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-3">ID Transaction</th>
                            <th className="p-3">Bénéficiaire (Parrain)</th>
                            <th className="p-3">Montant</th>
                            <th className="p-3">Méthode / Origine</th>
                            <th className="p-3">Détails</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {transactions.filter(t => t.type === "referral_bonus").slice(0, 20).map(tx => {
                            const recipient = users.find(u => u.id === tx.userId);
                            return (
                              <tr key={tx.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-mono font-bold text-gray-900">{tx.id}</td>
                                <td className="p-3 font-medium text-gray-900">
                                  {recipient ? `@${recipient.username}` : tx.userId}
                                </td>
                                <td className="p-3 font-mono font-bold text-emerald-600">
                                  +{tx.amount.toLocaleString()} {tx.currency}
                                </td>
                                <td className="p-3 text-gray-600">{tx.method}</td>
                                <td className="p-3 text-gray-600 max-w-xs truncate">{tx.details}</td>
                                <td className="p-3 text-gray-400 font-mono text-[10px]">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {transactions.filter(t => t.type === "referral_bonus").length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-gray-400">
                                Aucune commission de parrainage versée pour le moment.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white py-12 px-4 mt-16 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-slate-200/85 shadow-xs shrink-0 bg-slate-50">
              <img src={yaamaaLogo} alt="Yaamaa Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span translate="no" className="notranslate font-heading text-lg font-black tracking-tight text-slate-900 block leading-none">
                Yaam<span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">aa</span>
              </span>
              <p className="text-[10.5px] text-gray-400 mt-1 leading-none">
                {t.slogan} &copy; 2026. {currentLanguage === "fr" ? "Tous droits réservés." : "All rights reserved."}
              </p>
            </div>
          </div>
          <p className="max-w-md text-right text-[10px] text-gray-400 leading-relaxed hidden md:block">
            Système multi-devises et multi-pays hautement sécurisé par cryptage algorithmique. Audit intelligent de preuves par modèle neuronal génératif d'IA contre le spam et la fraude.
          </p>
        </div>
      </footer>
      </>
      ) : (
        <div className="flex-1 pt-32 sm:pt-36 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <Coins className="h-10 w-10 text-emerald-500 animate-pulse mb-4" />
          <p className="text-gray-450 font-medium text-xs font-mono uppercase tracking-widest">Menu de navigation ouvert</p>
        </div>
      )}

      {/* REGISTRATION OR PROFILE VIEWER AND EDIT DIALOG MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm animate-fade-in" id="auth_modal_wrapper">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {currentUser ? (
              // 1. FULLY-FEATURED PROFILE VIEWER & MODIFICATION HUB
              <div className="space-y-4">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-teal-600 tracking-wider block uppercase">Mon Identité & Paramètres</span>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mt-0.5">Votre Profil Membre</h3>
                  </div>
                  <button 
                    onClick={() => setAuthModalOpen(false)}
                    className="p-1 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    ✕ Fermer
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  
                  {/* PFP & METRIC PANEL */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-gray-150 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      <img 
                        src={editProfileAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                        alt={currentUser.username}
                        referrerPolicy="no-referrer"
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
                      <p className="font-black text-sm text-gray-950">@{currentUser.username}</p>
                      <p className="text-xs text-gray-500 font-medium">Membre {currentUser.role === "founder" ? "Fondateur 👑" : currentUser.role === "admin" ? "Administrateur 🛡️" : currentUser.role === "advertiser" ? "Annonceur 📢" : "Participant 🤝"}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                          {currentUser.wallet.available.toLocaleString()} {currentUser.currency} disponibles
                        </span>
                        <span className="bg-slate-150 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Niveau {currentUser.level} ({currentUser.xp % 100}/100 XP)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FORM FIELDS - BENTO STYLE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Nom Complet */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nom complet</label>
                      <input
                        type="text"
                        required
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        placeholder="Ex: Pierre Dubois"
                      />
                    </div>

                    {/* Pseudonyme */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pseudonyme unique (@)</label>
                      <input
                        type="text"
                        required
                        value={editProfileUsername}
                        onChange={(e) => setEditProfileUsername(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                        placeholder="pseudonyme"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Adresse E-mail</label>
                      <input
                        type="email"
                        required
                        value={editProfileEmail}
                        onChange={(e) => setEditProfileEmail(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        placeholder="pierre@test.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Numéro de téléphone</label>
                      <input
                        type="tel"
                        value={editProfilePhone}
                        onChange={(e) => setEditProfilePhone(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        placeholder="Ex: +33 6 12 34 56 78"
                      />
                    </div>

                    {/* Adresse physique */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Adresse postale / Domicile</label>
                      <input
                        type="text"
                        value={editProfileAddress}
                        onChange={(e) => setEditProfileAddress(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        placeholder="Ex: 12 Rue des Oliviers, Abidjan, Côte d'Ivoire"
                      />
                    </div>

                    {/* Pays de résidence */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pays d'origine / de résidence</label>
                      <select
                        value={editProfileCountry}
                        onChange={(e) => {
                          const selectedCountry = e.target.value;
                          setEditProfileCountry(selectedCountry);
                          setEditProfileCurrency(getCurrencyForCountry(selectedCountry));
                        }}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-850 cursor-pointer font-medium"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Devise */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Devise monétaire</label>
                      <select
                        value={editProfileCurrency}
                        onChange={(e) => setEditProfileCurrency(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-850 font-medium"
                      >
                        <option value="EUR">Euros (EUR - €)</option>
                        <option value="XOF">Francs CFA (XOF - F.CFA)</option>
                        <option value="USD">Dollars (USD - $)</option>
                        <option value="CAD">Canadien (CAD - C$)</option>
                      </select>
                    </div>

                    {/* Password */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nouveau mot de passe (Facultatif)</label>
                      <input
                        type="password"
                        value={editProfilePassword}
                        onChange={(e) => setEditProfilePassword(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    {/* Avatar URL / Select options */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Photo de profil (URL de l'image)</label>
                      <input
                        type="text"
                        value={editProfileAvatar}
                        onChange={(e) => setEditProfileAvatar(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="Saisissez l'URL d'une image ou cliquez sur un modèle ci-dessous"
                      />
                      
                      {/* Presets Grid */}
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Modèles d'Avatars Recommandés :</span>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
                          ].map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEditProfileAvatar(url)}
                              className={`rounded-lg overflow-hidden border-2 cursor-pointer transition relative h-10 w-full ${
                                editProfileAvatar === url ? "border-teal-500 scale-105" : "border-transparent hover:scale-102"
                              }`}
                            >
                              <img src={url} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {editProfileError && (
                    <div className="bg-rose-50 border border-rose-100 p-2.5 text-[10px] text-rose-600 font-bold rounded-xl">
                      {editProfileError}
                    </div>
                  )}

                  {editProfileSuccess && (
                    <div className="bg-teal-50 border border-teal-100 p-2.5 text-[10px] text-teal-700 font-bold rounded-xl">
                      {editProfileSuccess}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-550 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow cursor-pointer active:scale-99"
                    >
                      Sauvegarder les modifications
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // 2. SIMULATE REGISTRATION FORM (WHEN USER IS NOT LOGGED IN)
              <div className="space-y-4">
                <div className="border-b pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-emerald-600 tracking-wider block">Yaamaa Sandbox</span>
                    <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-widest mt-0.5">Simuler une inscription</h3>
                  </div>
                  <button 
                    onClick={() => setAuthModalOpen(false)}
                    className="text-gray-400 hover:text-gray-800 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleRegisterProfile} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-650 uppercase">Nom complet</label>
                    <input
                      type="text"
                      required
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ex: Pierre Dubois"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-650 uppercase">Pseudonyme unique (@)</label>
                    <input
                      type="text"
                      required
                      value={newProfileUsername}
                      onChange={(e) => setNewProfileUsername(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="Ex: Pierro75"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase">Adresse E-mail</label>
                      <input
                        type="email"
                        required
                        value={newProfileEmail}
                        onChange={(e) => setNewProfileEmail(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="pierre@test.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase">Téléphone</label>
                      <input
                        type="tel"
                        value={newProfilePhone}
                        onChange={(e) => setNewProfilePhone(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="+336..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase">Rôle recherché</label>
                      <select
                        value={newProfileRole}
                        onChange={(e) => setNewProfileRole(e.target.value as any)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="participant">Participant (Gagner gains)</option>
                        <option value="advertiser">Annonceur (Offrir missions)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase">Code Parrainage (Facultatif)</label>
                      <input
                        type="text"
                        value={newProfileReferral}
                        onChange={(e) => setNewProfileReferral(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none font-mono"
                        placeholder="BOSS2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase">Pays de résidence</label>
                      <select
                        value={newProfileCountry}
                        onChange={(e) => {
                          const selectedCountry = e.target.value;
                          setNewProfileCountry(selectedCountry);
                          setNewProfileCurrency(getCurrencyForCountry(selectedCountry));
                        }}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-850 cursor-pointer"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-650 uppercase font-sans">Devise monétaire</label>
                      <select
                        value={newProfileCurrency}
                        onChange={(e) => setNewProfileCurrency(e.target.value)}
                        className="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-850"
                      >
                        <option value="EUR">Euros (EUR - €)</option>
                        <option value="XOF">Francs CFA (XOF - F.CFA)</option>
                        <option value="USD">Dollars (USD - $)</option>
                        <option value="CAD">Canadien (CAD - C$)</option>
                      </select>
                    </div>
                  </div>

                  {profileError && (
                    <div className="bg-rose-50 border border-rose-100 p-2 text-[10px] text-rose-600 font-bold rounded">
                      {profileError}
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition shadow"
                    >
                      Valider la création du profil
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* USER PORTFOLIO & DETAIL VIEWER MODAL */}
      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          currentUserId={currentUser?.id || null}
          onClose={() => setSelectedProfileUserId(null)}
          onStartChat={handleStartChat}
          usersList={users}
          productsList={products}
          promoCampaignsList={promoCampaigns}
          campaignsList={campaigns}
          currentLanguage={currentLanguage}
        />
      )}

      {/* DETAILED INTERACTIVE REFERRAL MODAL */}
      {isReferralModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="referral_dashboard_modal">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 animate-pulse">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Dashboard d'Affiliation</span>
                  <h3 className="text-base font-extrabold text-gray-950">Espace Parrainage & Commissions Filleuls</h3>
                </div>
              </div>
              <button 
                onClick={() => setIsReferralModalOpen(false)}
                className="p-1.5 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 font-extrabold text-xs transition cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>

            {/* Commissions Model Explanation */}
            <div className="bg-emerald-50/30 border border-emerald-500/10 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">💡 Comment ça fonctionne ?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Partagez votre lien ou votre code de parrainage avec vos amis. Vous toucherez des commissions en temps réel sur toutes leurs actions, gains de missions, achats et ventes de Boutique à vie !
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-500/5 text-center">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">S'INSCRIRE</span>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">+1.00 € / Filleul</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-500/5 text-center">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">MISSIONS</span>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">10% Commission</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-500/5 text-center">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">VENTES BOUTIQUE</span>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">5% Commission</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-500/5 text-center">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">ACHATS BOUTIQUE</span>
                  <span className="text-xs font-extrabold text-emerald-700 font-mono">3% Commission</span>
                </div>
              </div>
            </div>

            {/* Merchant Number Premium status card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl p-4 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Statut Yaamaa Premium & Numéro Marchand</span>
                  <p className="text-xs text-gray-750 font-medium mt-1">
                    {currentUser.merchantNumber ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        ✨ Compte Premium Actif (Numéro : {currentUser.merchantNumber})
                      </span>
                    ) : (
                      <span className="text-indigo-900">
                        Compte Standard (Aucun numéro marchand actif)
                      </span>
                    )}
                  </p>
                </div>
                {!currentUser.merchantNumber ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMerchantPayPhone(currentUser.phone || "");
                      setMerchantPayName(currentUser.name || "");
                      setMerchantStep("form");
                      setIsMerchantModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Activer Maintenant 🚀
                  </button>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg">
                    {currentUser.merchantNumberEligible ? "Éligible Commissions" : "Inéligible (Délai dépassé)"}
                  </span>
                )}
              </div>
            </div>

            {/* Invite Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unique Code card */}
              <div className="bg-gray-50/50 border rounded-2xl p-4 relative space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Votre Code de Parrainage Unique</span>
                <div className="flex items-center justify-between bg-white border border-gray-150 rounded-xl p-2.5 mt-2">
                  <span className="font-mono text-sm font-black text-gray-900 tracking-wider">
                    {currentUser.referralCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.referralCode);
                      alert("Code de parrainage copié dans le presse-papiers !");
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copier
                  </button>
                </div>
              </div>

              {/* Unique Invitation Link card */}
              <div className="bg-gray-50/50 border rounded-2xl p-4 relative space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lien d'Invitation Direct (Lien cliquable)</span>
                <div className="flex items-center justify-between bg-white border border-gray-150 rounded-xl p-2.5 mt-2">
                  <span className="font-mono text-[11px] text-gray-500 truncate max-w-[180px]">
                    {window.location.origin}/?ref={currentUser.referralCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser.referralCode}`);
                      alert("Lien d'invitation complet copié avec succès ! Vos futurs filleuls qui cliqueront dessus seront automatiquement affiliés.");
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Copier le lien
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4">
              <div className="text-center bg-gray-50/30 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Nombre de Filleuls</span>
                <span className="font-mono text-xl font-black text-gray-900 mt-1 block">
                  {users.filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.referralCode).length} Filleuls
                </span>
              </div>
              <div className="text-center bg-emerald-50/20 rounded-xl p-3 border border-emerald-500/5">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Revenus d'Affiliation</span>
                <span className="font-mono text-xl font-black text-emerald-600 mt-1 block">
                  {currentUser.wallet.referralEarned.toLocaleString()} {currentUser.currency}
                </span>
              </div>
            </div>

            {/* Tracking Panel List: Filleuls & Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wider">👥 Suivi de vos Filleuls</h4>
                  <p className="text-[10px] text-gray-400">Liste en temps réel des utilisateurs parrainés et de leur statut sur Yaamaa.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateNewFilleul}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                >
                  ⚡ Simuler un Filleul
                </button>
              </div>

              <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="bg-gray-50/50 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider grid grid-cols-12 gap-2 border-b">
                  <div className="col-span-4">Filleul</div>
                  <div className="col-span-3 text-center">Origine</div>
                  <div className="col-span-2 text-center">Statut</div>
                  <div className="col-span-3 text-right">Commissions</div>
                </div>

                <div className="divide-y max-h-[180px] overflow-y-auto" id="referred_users_panel_container">
                  {users.filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.referralCode).length === 0 ? (
                    <div className="p-8 text-center text-gray-400 space-y-2">
                      <p className="text-xs font-medium">Vous n'avez pas encore de filleul enregistré.</p>
                      <p className="text-[10px]">Partagez votre lien ou utilisez le bouton <strong className="text-emerald-600">Simuler un Filleul</strong> ci-dessus pour tester instantanément !</p>
                    </div>
                  ) : (
                    users.filter(u => u.referredBy === currentUser.id || u.referredBy === currentUser.referralCode).map((fil, idx) => {
                      const computedCommission = parseFloat((fil.wallet.totalEarned * 0.10).toFixed(2));
                      const isSimulatedLien = idx % 2 === 0;

                      return (
                        <div key={fil.id} className="px-4 py-3 grid grid-cols-12 gap-2 text-xs items-center hover:bg-gray-50/50 transition">
                          {/* Profile */}
                          <div className="col-span-4 flex items-center gap-2">
                            <img src={fil.avatar} className="h-6 w-6 rounded-full object-cover border" />
                            <div className="truncate">
                              <span className="font-extrabold text-gray-900 truncate block font-sans">@{fil.username}</span>
                              <span className="text-[9px] text-gray-400 truncate block">{fil.name}</span>
                            </div>
                          </div>

                          {/* Origin */}
                          <div className="col-span-3 text-center font-semibold text-[10px]">
                            <span className={`inline-block px-2 py-0.5 rounded font-medium ${
                              isSimulatedLien 
                                ? "bg-teal-50 text-teal-700 border border-teal-100" 
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {isSimulatedLien ? "🔗 Lien Direct" : "🎁 Code Saisi"}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="col-span-2 text-center">
                            {fil.isSuspended ? (
                              <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 uppercase border border-rose-100">
                                Inactif
                              </span>
                            ) : (
                              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                fil.wallet.totalEarned > 5
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              }`}>
                                {fil.wallet.totalEarned > 5 ? "Actif ⭐" : "Actif"}
                              </span>
                            )}
                          </div>

                          {/* Commissions */}
                          <div className="col-span-3 text-right">
                            <span className="font-mono font-black text-emerald-600 block">
                              +{computedCommission.toLocaleString()} {currentUser.currency}
                            </span>
                            <span className="text-[8.5px] text-gray-400 font-mono block">
                              Gains: {fil.wallet.totalEarned.toLocaleString()} {fil.currency}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Closing Buttons */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSimulateNewFilleul}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
              >
                Simuler un Filleul de Test ⚡
              </button>
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL ACHAT NUMÉRO MARCHAND YAAMAA PREMIUM */}
      {isMerchantModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="merchant_number_payment_modal">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            
            {/* Modal Close Button */}
            {merchantStep !== "processing" && (
              <button
                type="button"
                onClick={() => setIsMerchantModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* STEP 1: PAIEMENT FORM */}
            {merchantStep === "form" && (
              <form onSubmit={handlePurchaseMerchantNumber} className="space-y-5">
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
                    <Sparkles className="h-6 w-6 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Yaamaa Premium & Badges</span>
                    <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Achat du Numéro Marchand</h3>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 text-[11px] text-amber-950 leading-relaxed space-y-1">
                  <p className="font-extrabold flex items-center gap-1">🛡️ Condition Spécifique de Parrainage</p>
                  <p>
                    Pour toucher des commissions de 50% sur les personnes que vous parrainez, vous devez posséder un numéro marchand unique actif. Chaque numéro est strictement unique à chaque utilisateur.
                  </p>
                </div>

                {/* GORGEOUS PACK SELECTION GRID */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase block">Choisissez votre Package & Avantages</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(subscriptionPlans.length > 0 ? subscriptionPlans.filter(p => p.isActive) : [
                      { id: "premium", name: "Niveau de Base (Basic)", tier: "blue", initialPrice: 5000, description: "Accès uniquement au Numéro Marchand de Base & Badge spécial.", maxReferrals: 20, benefits: ["Badge vérifié", "Numéro unique à vie"] },
                      { id: "gold", name: "Niveau Motivation (Gold)", tier: "gold", initialPrice: 15000, description: "Soutenez jusqu'à 500 filleuls. Produits mis en avant.", maxReferrals: 500, benefits: ["Badge Or", "500 filleuls max"] },
                      { id: "diamond", name: "Niveau Diamant (Diamond)", tier: "diamond", initialPrice: 35000, description: "Soutenez jusqu'à 2000 filleuls. Visibilité maximale.", maxReferrals: 2000, benefits: ["Badge Diamant", "2000 filleuls max"] }
                    ]).map((plan) => {
                      const isSelected = merchantPackTypeSelection === plan.id || merchantPackTypeSelection === plan.tier;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setMerchantPackTypeSelection(plan.id)}
                          className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 text-emerald-950"
                              : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 font-bold text-xs mt-0.5">
                            {plan.tier === "diamond" ? "💎" : plan.tier === "gold" ? "🌟" : "✨"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black uppercase tracking-wider">{plan.name}</span>
                              <span className="font-mono text-xs font-bold text-emerald-700">
                                {plan.initialPrice?.toLocaleString()} {currentUser.currency || "XOF"}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1">
                              {plan.description} Limite de parrainage : <strong className="text-gray-900">{plan.maxReferrals} filleuls</strong>.
                              {plan.benefits && plan.benefits.length > 0 && (
                                <span className="block text-[8.5px] text-indigo-600 mt-0.5">Avantages : {plan.benefits.join(" • ")}</span>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Votre Pays de Résidence (Définit le suffixe de votre numéro marchand)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs bg-gray-50 text-gray-600"
                      value={currentUser.country || "Bénin"}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nom Complet</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900"
                      value={merchantPayName}
                      onChange={(e) => setMerchantPayName(e.target.value)}
                      placeholder="Nom complet du titulaire"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Opérateur de Paiement Mobile</label>
                    <select
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 cursor-pointer"
                      value={merchantPayMethod}
                      onChange={(e) => setMerchantPayMethod(e.target.value)}
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money 📱</option>
                      <option value="Moov Money">Moov Money 📱</option>
                      <option value="Wave Money">Wave Money 🌊</option>
                      <option value="Orange Money">Orange Money 🍊</option>
                      <option value="Carte Bancaire">Carte Bancaire / Kkiapay 💳</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Numéro Mobile Money de Facturation</label>
                    <input
                      type="tel"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono"
                      value={merchantPayPhone}
                      onChange={(e) => setMerchantPayPhone(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500">Prix Unique à régler :</span>
                    <strong className="text-base text-indigo-700 font-mono">
                      {merchantSelectedPrice} {currentUser.currency || "XOF"}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer text-center"
                  >
                    Valider le Paiement
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PROCESSING */}
            {merchantStep === "processing" && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-sm font-black text-gray-950 uppercase tracking-wider animate-pulse">Paiement en Cours...</p>
                  <p className="text-xs text-gray-500">
                    Une demande de débit de <span className="font-mono font-bold text-indigo-600">{merchantSelectedPrice} {currentUser.currency || "XOF"}</span> a été envoyée sur votre compte mobile.
                  </p>
                  <p className="text-[11px] text-indigo-700 font-medium bg-indigo-50 p-2 rounded-xl mt-2 border border-indigo-100">
                    Veuillez composer votre code secret sur votre téléphone pour approuver l'opération.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {merchantStep === "success" && (
              <div className="space-y-5 py-2">
                <div className="text-center space-y-3">
                  <div className="inline-flex p-3 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600 mx-auto animate-bounce">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-800 uppercase tracking-wider">Paiement Validé ! 🎉</h3>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Félicitations ! Votre paiement a été reçu et vous avez désormais un accès complet à <strong className="text-emerald-700">Yaamaa Premium</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 border rounded-2xl p-4 text-center space-y-2">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Votre Numéro Marchand Unique</span>
                  <div className="flex items-center justify-center gap-2 bg-white border rounded-xl p-3 shadow-xs">
                    <span className="font-mono text-base font-black tracking-widest text-indigo-700 select-all">
                      {generatedMerchantNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMerchantNumber);
                        alert("Numéro marchand copié avec succès !");
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      Copier
                    </button>
                  </div>
                </div>

                <div className={`p-3.5 border rounded-2xl text-[11px] leading-relaxed ${
                  merchantWithin30Days 
                    ? "bg-emerald-50/55 text-emerald-950 border-emerald-150" 
                    : "bg-rose-50 text-rose-950 border-rose-150"
                }`}>
                  {merchantWithin30Days ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-emerald-800">✅ Éligibilité aux Commissions Active</p>
                      <p>
                        Paiement effectué dans les 30 jours requis. Vous êtes désormais éligible pour percevoir vos commissions d'affiliation de <strong>50%</strong> de manière illimitée sur les achats de numéro marchand de vos filleuls !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-extrabold text-rose-800">⚠️ Éligibilité non active (Hors Délai)</p>
                      <p>
                        Votre numéro marchand a été activé. Cependant, étant donné que vous l'avez acheté après la période de grâce de 30 jours, vous ne percevrez pas de commissions d'affiliation de parrainage sur vos filleuls, conformément au règlement de Yaamaa.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMerchantModalOpen(false)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer text-center"
                >
                  Commencer à Gagner 🚀
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* DETAILED INTERACTIVE SHARE / INVITE MODAL */}
      {isShareModalOpen && currentUser && (() => {
        const shareLink = `${window.location.origin}/?ref=${currentUser.referralCode}`;
        const shareMessage = `Rejoins-moi sur Yaamaa ! Gagne des commissions réelles sur tes missions, tes achats et ventes de boutique. Inscris-toi ici : ${shareLink}`;
        const emailSubject = "Invitation exclusive à rejoindre Yaamaa !";
        const emailBody = `Salut ! Je t'invite à rejoindre Yaamaa, une plateforme géniale pour gagner des compléments de revenus réels en réalisant des micro-missions et des ventes de boutique.

Inscris-toi en cliquant sur mon lien d'invitation personnalisé :
${shareLink}

À très vite sur Yaamaa !`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs animate-fade-in" id="share_invite_modal">
            <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 animate-pulse">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Partage & Invitation</span>
                    <h3 className="text-base font-extrabold text-gray-950">Inviter vos Filleuls & Partager</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 font-extrabold text-xs transition cursor-pointer"
                >
                  ✕ Fermer
                </button>
              </div>

              {/* Commission model reminder */}
              <div className="bg-emerald-50/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                    <span>✨ Vos avantages parrainage</span>
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Vous gagnez <strong className="text-emerald-700">10%</strong> sur leurs missions, <strong className="text-emerald-700">5%</strong> sur leurs ventes et <strong className="text-emerald-700">3%</strong> sur leurs achats à vie !
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsShareModalOpen(false);
                    setIsReferralModalOpen(true);
                  }}
                  className="bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-extrabold px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
                >
                  Suivi de mes Filleuls 👥
                </button>
              </div>

              {/* Share link and native copy card */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Votre lien d'invitation personnel</label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 font-mono text-xs text-gray-700"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        alert("Lien d'invitation copié !");
                      }}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="h-4 w-4" /> Copier le lien
                    </button>
                    {navigator.share && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.share({
                              title: "Rejoins-moi sur Yaamaa !",
                              text: shareMessage,
                              url: shareLink
                            });
                          } catch (err) {
                            console.log("Erreur de partage:", err);
                          }
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-4 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Partage Système Natif (Mobile)"
                      >
                        <ExternalLink className="h-4 w-4" /> Partager
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Networks Sharing Grid */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Partager instantanément sur vos réseaux & applications</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 bg-green-50/50 hover:bg-green-50 border border-green-200 rounded-2xl text-center transition group cursor-pointer"
                  >
                    <span className="text-xl group-hover:scale-110 transition duration-150">💬</span>
                    <span className="text-[11px] font-extrabold text-green-700 mt-1">WhatsApp</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-200 rounded-2xl text-center transition group cursor-pointer"
                  >
                    <Send className="h-5 w-5 text-blue-500 group-hover:scale-110 transition duration-150" />
                    <span className="text-[11px] font-extrabold text-blue-700 mt-1">Telegram</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-2xl text-center transition group cursor-pointer"
                  >
                    <span className="text-xl group-hover:scale-110 transition duration-150">📘</span>
                    <span className="text-[11px] font-extrabold text-indigo-700 mt-1">Facebook</span>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    className="flex flex-col items-center justify-center p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-2xl text-center transition group cursor-pointer"
                  >
                    <Mail className="h-5 w-5 text-rose-500 group-hover:scale-110 transition duration-150" />
                    <span className="text-[11px] font-extrabold text-rose-700 mt-1">E-mail</span>
                  </a>

                  {/* SMS */}
                  <a
                    href={`sms:?body=${encodeURIComponent(shareMessage)}`}
                    className="flex flex-col items-center justify-center p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 rounded-2xl text-center transition group cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <Smartphone className="h-5 w-5 text-amber-500 group-hover:scale-110 transition duration-150" />
                    <span className="text-[11px] font-extrabold text-amber-700 mt-1">SMS</span>
                  </a>
                </div>
              </div>

              {/* Simulated Phonebook Directory section */}
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-gray-950 uppercase tracking-wider">📇 Répertoire de vos Contacts & Invitation Directe</h4>
                    <p className="text-[10px] text-gray-400">Sélectionnez des contacts de votre répertoire pour leur envoyer directement votre invitation.</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-1 rounded">
                    {simulatedContacts.length} Contacts Enregistrés
                  </span>
                </div>

                {/* Form to add custom contact */}
                <div className="bg-gray-50 border rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Nom du Contact</label>
                    <input
                      type="text"
                      placeholder="Ex: Fatou Ndiaye"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-800 animate-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Numéro de Téléphone</label>
                    <input
                      type="text"
                      placeholder="Ex: +221 77 654 32 10"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-800 animate-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newContactName.trim() || !newContactPhone.trim()) return;
                      const newId = Date.now();
                      setSimulatedContacts(prev => [
                        ...prev,
                        { id: newId, name: newContactName, phone: newContactPhone, sent: false }
                      ]);
                      setNewContactName("");
                      setNewContactPhone("");
                      alert(`✅ Contact "${newContactName}" ajouté avec succès à votre répertoire !`);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold py-2.5 px-3 rounded-xl transition cursor-pointer text-center uppercase tracking-wider"
                  >
                    + Ajouter Contact
                  </button>
                </div>

                {/* Contacts Directory List */}
                <div className="border rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y max-h-[160px] overflow-y-auto">
                    {simulatedContacts.map((contact) => (
                      <div key={contact.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-gray-50/50 transition">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-100">
                            {contact.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-950 block">{contact.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono font-bold">{contact.phone}</span>
                          </div>
                        </div>

                        <div>
                          {contact.sent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Invitation Envoyée
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSimulatedContacts(prev => prev.map(c => c.id === contact.id ? { ...c, sent: true } : c));
                                alert(`🎉 Invitation parrainage envoyée avec succès à ${contact.name} !\nUn SMS contenant votre code de parrainage "${currentUser.referralCode}" a été expédié.`);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold px-3 py-1.5 rounded-xl transition border border-emerald-200 cursor-pointer"
                            >
                              Inviter par SMS 📱
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close footer buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {isPaymentConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-md animate-fade-in" id="secure_payment_modal">
          <div className="bg-[#fcfcff] border border-gray-100 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col font-sans" style={{ minHeight: "530px" }}>
            
            {/* Yaamaa Pay Theme Header */}
            <div className="bg-[#4e3beb] text-white px-5 py-4 flex items-center justify-between relative shadow-md">
              <div className="flex items-center gap-2">
                <div className="bg-white/15 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-lg font-black tracking-tight translate-x-0 notranslate" translate="no">
                      Yaamaa Pay<span className="text-emerald-400 font-extrabold text-[10px] ml-1 px-1.5 py-0.5 rounded-md bg-white/10 uppercase tracking-widest border border-white/5">SECURE</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-200/80 leading-none mt-0.5">Passerelle de paiement officielle d'Afrique de l'Ouest</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPaymentConfirmationOpen(false)}
                className="text-white/60 hover:text-white bg-white/5 hover:bg-white/15 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Yaamaa Pay Invoice Bar */}
            <div className="bg-[#f0efff] border-b border-indigo-100/50 px-5 py-3 flex justify-between items-center text-xs">
              <div className="text-indigo-900 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Portefeuille <strong translate="no" className="notranslate">Yaamaa</strong></span>
              </div>
              <div className="text-indigo-950 font-black text-sm">
                {depositAmount} {currentUser?.currency}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-5 overflow-y-auto">

              {/* STEP 1: FORM */}
              {kkiapayStep === "form" && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Country Choice */}
                  <div>
                    <label className="text-[10.5px] font-bold text-indigo-900/60 uppercase tracking-wider block mb-1.5">
                      1. Sélectionnez votre Pays d'origine
                    </label>
                    <div className="relative">
                      <select
                        value={kkiapayCountry}
                        onChange={(e) => {
                          const selectedCountryName = e.target.value;
                          const c = COUNTRIES_LIST.find((item) => item.name === selectedCountryName);
                          if (c) {
                            setKkiapayCountry(c.name);
                            setKkiapayMethod(c.methods[0]);
                            const currentDigits = kkiapayPhone.replace(/^\+\d+\s*/, "");
                            setKkiapayPhone(`${c.code} ${currentDigits || ""}`);
                          }
                        }}
                        className="w-full border border-indigo-100 rounded-2xl p-3.5 text-xs font-black bg-white focus:outline-none focus:ring-1 focus:ring-[#4e3beb] shadow-sm cursor-pointer appearance-none pl-11 pr-10"
                      >
                        {COUNTRIES_LIST.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} &nbsp; {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                        {COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.flag || "🌍"}
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
 
                  {/* Payment Methods Grid depending on Country */}
                  <div>
                    <label className="text-[10.5px] font-bold text-indigo-900/60 uppercase tracking-wider block mb-1.5">
                      2. Moyen de paiement local ({kkiapayCountry})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const currentMethods = COUNTRIES_LIST.find(c => c.name === kkiapayCountry)?.methods || ["MTN Mobile Money", "Carte Bancaire"];
 
                        return currentMethods.map((m) => {
                          const isSelected = kkiapayMethod === m;
                          let brandColor = "border-gray-200 text-gray-800";
                          let logoInitials = "📱";
 
                          if (m === "MTN Mobile Money") { brandColor = "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/50"; logoInitials = "💛 MTN"; }
                          else if (m === "Moov Money" || m === "Moov Flooz") { brandColor = "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100/50"; logoInitials = "💙 Moov"; }
                          else if (m === "Celtiis Cash") { brandColor = "bg-orange-50 border-orange-300 text-orange-950 hover:bg-orange-100/50"; logoInitials = "💚 Celtiis"; }
                          else if (m === "TMoney") { brandColor = "bg-yellow-50 border-yellow-400 text-yellow-950 hover:bg-yellow-100/50"; logoInitials = "⭐ TMoney"; }
                          else if (m === "Wave") { brandColor = "bg-sky-50 border-sky-300 text-sky-900 hover:bg-sky-100/50"; logoInitials = "🐧 Wave"; }
                          else if (m === "Telecel Cash") { brandColor = "bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100/50"; logoInitials = "💙 Telecel"; }
                          else if (m === "Carte Bancaire") { brandColor = "bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100/50"; logoInitials = "💳 Carte CB"; }
                          else if (m === "Virement Bancaire") { brandColor = "bg-teal-50 border-teal-300 text-teal-950 hover:bg-teal-100/50"; logoInitials = "🏦 Banque"; }
                          else if (m === "Virement Interac") { brandColor = "bg-red-50 border-red-300 text-red-950 hover:bg-red-100/50"; logoInitials = "🍁 Interac"; }
 
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setKkiapayMethod(m)}
                              className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition duration-150 cursor-pointer ${
                                isSelected 
                                  ? `${brandColor.split(" ")[0]} border-2 border-[#4e3beb] shadow-sm scale-[1.02]` 
                                  : "bg-white border-gray-100 hover:border-indigo-100 text-gray-500"
                              }`}
                            >
                              <span className="text-sm">{logoInitials}</span>
                              <span className="truncate">{m}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Form fields according to selected payment method */}
                  <div className="border-t border-gray-100 pt-4">
                    {kkiapayMethod === "Carte Bancaire" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nom Complet sur la Carte</label>
                          <input
                            type="text"
                            value={kkiapayCardName}
                            onChange={(e) => setKkiapayCardName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#4e3beb] font-semibold"
                            placeholder="Ex: Pierre Gomis"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Numéro de Carte Bancaire</label>
                          <input
                            type="text"
                            value={kkiapayCardNumber}
                            onChange={(e) => setKkiapayCardNumber(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                            placeholder="4242 4242 4242 4242"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Expiration</label>
                            <input
                              type="text"
                              value={kkiapayCardExpiry}
                              onChange={(e) => setKkiapayCardExpiry(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                              placeholder="12/28"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Code CVV</label>
                            <input
                              type="password"
                              value={kkiapayCardCvv}
                              onChange={(e) => setKkiapayCardCvv(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#4e3beb]"
                              placeholder="•••"
                              maxLength={3}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider block mb-1">
                            Saisissez votre numéro {kkiapayMethod} ({kkiapayCountry})
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={kkiapayPhone}
                              onChange={(e) => setKkiapayPhone(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4e3beb] font-mono font-bold tracking-wide"
                              placeholder={
                                kkiapayCountry === "Bénin" ? "+229 XX XX XX XX" :
                                kkiapayCountry === "Togo" ? "+228 XX XX XX XX" :
                                kkiapayCountry === "Côte d'Ivoire" ? "+225 XX XX XX XX" :
                                kkiapayCountry === "Sénégal" ? "+221 XX XX XX XX" : "+237 XX XX XX XX"
                              }
                            />
                          </div>
                          <p className="text-[10.5px] text-gray-400 mt-1 leading-relaxed">
                            💡 Un message push USSD de validation automatique sera transmis sur ce numéro afin d'effectuer le débit sécurisé de votre compte.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleStartKkiapayPayment}
                      className="w-full py-4 bg-[#4e3beb] hover:bg-[#3d2ece] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-indigo-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      💳 Payer {depositAmount} {currentUser?.currency}
                    </button>
                    <p className="text-[9.5px] text-gray-400 text-center mt-2">
                      🔒 Paiements cryptés de bout en bout et protégés par Yaamaa Pay International S.A.
                    </p>
                  </div>

                </div>
              )}

              {/* STEP 2: PROCESSING */}
              {kkiapayStep === "processing" && (
                <div className="py-14 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-[#4e3beb] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-[#4e3beb] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-indigo-950">Négociation de la transaction...</h4>
                    <p className="text-xs text-gray-400 max-w-xs leading-relaxed mx-auto">
                      Yaamaa Pay se connecte au serveur central de l'opérateur pour initialiser l'auto-débit sécurisé sur votre compte.
                    </p>
                  </div>
                  <div className="w-full max-w-xs bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-[10.5px] font-mono text-indigo-800 text-left space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                      <span>[API] POST /checkout/initialize... OK</span>
                    </div>
                    <div>[ROUTING] {kkiapayMethod} ({kkiapayCountry})</div>
                    <div>[SECURE] 3D-Secure Handshake... Initié</div>
                  </div>
                </div>
              )}

              {/* STEP 3: USSD PUSH WITH PHONE SCREEN */}
              {kkiapayStep === "ussd" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-[#fff7ed] border border-orange-100 rounded-2xl p-4 flex gap-3 text-orange-900">
                    <span className="text-xl">📱</span>
                    <div className="text-xs space-y-0.5 leading-relaxed">
                      <strong className="font-extrabold block">Push USSD transmis !</strong>
                      Une demande de débit automatique de <span className="font-black">{depositAmount} {currentUser?.currency}</span> a été initiée vers votre mobile <span className="font-bold">{kkiapayPhone}</span> via {kkiapayMethod}.
                    </div>
                  </div>

                  {/* Phone Mockup representation */}
                  <div className="mx-auto w-64 bg-slate-950 rounded-[2.5rem] p-3 shadow-xl border border-slate-800 text-white relative">
                    {/* Speaker and Camera notch */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                      <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-4 text-center space-y-4 pt-6 min-h-[220px] flex flex-col justify-between">
                      {kkiapayUssdStep === 1 ? (
                        <div className="space-y-3 my-auto">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                            Autorisation {kkiapayMethod}
                          </span>
                          <p className="text-[11px] text-gray-300 leading-relaxed font-semibold">
                            Saisissez votre code PIN secret de paiement à 4 chiffres pour confirmer le prélèvement :
                          </p>
                          <input
                            type="password"
                            value={kkiapayPin}
                            onChange={(e) => setKkiapayPin(e.target.value.replace(/\D/g, "").substring(0, 4))}
                            placeholder="••••"
                            className="w-24 text-center border-b-2 border-amber-400 bg-transparent text-xl font-black text-white focus:outline-none tracking-widest p-1"
                            maxLength={4}
                            required
                          />
                        </div>
                      ) : (
                        <div className="my-auto space-y-3">
                          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
                          <p className="text-[11.5px] text-amber-300 font-extrabold">
                            Validation du code PIN...
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Prélèvement automatique des fonds en cours de validation par votre opérateur externe.
                          </p>
                        </div>
                      )}

                      <div className="text-[9px] text-gray-500 font-mono">
                        Sécurisé par {kkiapayMethod} Gateway
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {kkiapayUssdStep === 1 && (
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmKkiapayUssdPin}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        ✓ Confirmer & Débiter {depositAmount} {currentUser?.currency}
                      </button>
                      <button
                        type="button"
                        onClick={() => setKkiapayStep("form")}
                        className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        Modifier les informations
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SUCCESS */}
              {kkiapayStep === "success" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                  <div className="h-16 w-16 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 shadow-md">
                    <Check className="h-8 w-8 stroke-[3.5]" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-indigo-950">Paiement Approuvé ! 🎉</h4>
                    <p className="text-xs text-gray-500 max-w-xs leading-relaxed mx-auto">
                      L'argent a quitté automatiquement votre compte externe et a été crédité sur votre solde disponible <strong translate="no" className="notranslate">Yaamaa</strong> instantanément.
                    </p>
                  </div>

                  {/* Receipt */}
                  <div className="w-full max-w-xs bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID :</span>
                      <span className="font-mono font-bold text-gray-800">TX-KKPAY-{Math.floor(Math.random() * 900000 + 100000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Montant crédité :</span>
                      <span className="font-bold text-emerald-600">+{depositAmount} {currentUser?.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Opérateur :</span>
                      <span className="font-bold text-gray-800">{kkiapayMethod} ({kkiapayCountry})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Statut :</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        ✓ Succès
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaymentConfirmationOpen(false)}
                    className="w-full max-w-xs py-4 bg-indigo-950 hover:bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
                  >
                    Retourner à mon Wallet
                  </button>
                </div>
              )}

            </div>

            {/* Yaamaa Pay Footer branding */}
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                🛡️ PCI-DSS Compliant
              </span>
              <span translate="no" className="notranslate text-[#4e3beb] font-black">
                yaamaapay.com
              </span>
            </div>

          </div>
        </div>
      )}

      {/* AUDIO & VIDEO COMMUNICATION MODAL */}
      {isCallModalOpen && currentUser && (
        <AudioVideoCallModal
          currentUser={currentUser}
          usersList={users}
          activeCall={activeCall}
          onClose={() => setIsCallModalOpen(false)}
          onInitiateCall={handleInitiateCall}
          onEndCall={handleEndCall}
          onAcceptCall={handleAcceptCall}
          onHostAction={handleHostAction}
          callHistory={callHistory}
          onRefreshCalls={fetchCallHistory}
        />
      )}

      {/* NOTIFICATION CENTER MODAL */}
      {isNotificationCenterOpen && currentUser && (
        <NotificationCenterModal
          currentUser={currentUser}
          onClose={() => setIsNotificationCenterOpen(false)}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* NOTIFICATION & SOUND SETTINGS MODAL */}
      {isNotificationSettingsOpen && currentUser && (
        <NotificationSettingsModal
          currentUser={currentUser}
          onClose={() => setIsNotificationSettingsOpen(false)}
          onUpdateUser={(updated) => setCurrentUser(updated)}
        />
      )}

    </div>
  );
}
