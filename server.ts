/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  User, 
  Campaign, 
  TaskSubmission, 
  WalletTransaction, 
  AuditLog, 
  SystemSettings,
  Shop,
  Product,
  Order,
  Dispute,
  PromoCampaign,
  SocialMessage,
  Community,
  FriendRequest,
  CallSession,
  BroadcastCampaign,
  SupplierDelivererProfile,
  SupplierDelivererReview,
  MissionRequest,
  SubscriptionPlan,
  UserSubscription,
  SubscriptionNotification,
  BadgeTier,
  SupervisionIncident,
  SupervisionReport,
  ModerationFile,
  ProductBoostCampaign,
  AdPack,
  CampaignTypeConfig,
  MultiVendorOrder,
  CartItem,
  VendorSubOrder
} from "./src/types";
import { ALL_COUNTRIES } from "./src/countries";
import bcrypt from "bcryptjs";

export interface ImpersonationLog {
  id: string;
  founderId: string;
  founderUsername: string;
  targetUserId: string;
  targetUsername: string;
  startedAt: string;
  endedAt?: string;
  ip?: string;
  userAgent?: string;
}

// Initialize Gemini Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = GEMINI_API_KEY 
  ? new GoogleGenAI({ 
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true" || process.env.NODE_ENV === "production";
const tmpDir = isVercel ? '/tmp' : process.cwd();
const STATE_FILE = path.join(tmpDir, "data_state.json");
const BACKUP_FILE = path.join(tmpDir, "data_state_backup.json");

if (isVercel && !fs.existsSync(STATE_FILE)) {
  const rootState = path.join(process.cwd(), "data_state.json");
  if (fs.existsSync(rootState)) {
    try {
      fs.copyFileSync(rootState, STATE_FILE);
    } catch (e) {
      console.error("Failed to copy state to /tmp:", e);
    }
  }
}

// Define Initial State Schema
interface AppState {
  users: User[];
  campaigns: Campaign[];
  submissions: TaskSubmission[];
  transactions: WalletTransaction[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  shops?: Shop[];
  products?: Product[];
  orders?: Order[];
  disputes?: Dispute[];
  promoCampaigns?: PromoCampaign[];
  communities?: Community[];
  socialMessages?: SocialMessage[];
  friendRequests?: FriendRequest[];
  callSessions?: CallSession[];
  broadcastCampaigns: BroadcastCampaign[];
  suppliersDeliverers?: SupplierDelivererProfile[];
  supplierReviews?: SupplierDelivererReview[];
  missionRequests?: MissionRequest[];
  subscriptionPlans?: SubscriptionPlan[];
  userSubscriptions?: UserSubscription[];
  subscriptionNotifications?: SubscriptionNotification[];
  supervisionIncidents?: SupervisionIncident[];
  supervisionReports?: SupervisionReport[];
  moderationFiles?: ModerationFile[];
  multiVendorOrders?: MultiVendorOrder[];
  impersonationLogs?: ImpersonationLog[];
  productBoostCampaigns?: ProductBoostCampaign[];
  nextMerchantSequence?: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  isWithdrawalFrozen: false,
  suspendedCountries: [],
  suspendedCurrencies: [],
  platformFeePercentage: 10,
  payoutsDistributed: 14520,
  totalUsersCount: 15420,
  minWithdrawalAmount: 10.0,
  baseReward: 0.20,
  defaultCommission: 10,
  merchantNumberPrice: 5000,
  merchantPremiumPrice: 5000,
  merchantGoldPrice: 15000,
  merchantDiamondPrice: 35000,
  giftPointsConversionRate: 0.01,
  referralProgramEnabled: true,
  referralEligibleTypes: ["merchant_number", "product_purchase"],
  referralCommissionMode: "percentage",
  referralCommissionValue: 50,
  referralMaxEarningsCap: 1000000,
  referralMaxReferralsPerUser: 100,
  autoSenderName: "Yama Assistance",
  autoSenderPhone: "+221701234567",
  autoSenderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop",
  pinMinLength: 4,
  pinMaxLength: 8,
  maxPinAttempts: 3,
  pinBlockDurationMinutes: 30,
  pinRequiredOperations: {
    balance: false,
    productPayment: true,
    merchantPurchase: true,
    subscription: true,
    virtualGift: true,
    sendMoney: true,
    withdrawal: true,
    pointConversion: true,
    assetConversion: true,
    pointTransfer: true,
    orderValidation: true
  },
  pinRecoveryCodeValidityMinutes: 15,
  pinAllowedRecoveryMethods: ["merchant_number", "email"],
  virtualGifts: [
    { id: "gift_rose", name: "Rose Éternelle", emoji: "🌹", pointsPrice: 10, description: "Un classique pour exprimer de l'affection", rarity: "Commun", category: "Amour", animation: "petals", soundEffect: "love_chime", duration: 5, isActive: true, pointsValue: 10 },
    { id: "gift_heart", name: "Cœur Pulsant", emoji: "💖", pointsPrice: 20, description: "Un cœur vibrant d'énergie positive", rarity: "Commun", category: "Amour", animation: "light", soundEffect: "heartbeat", duration: 4, isActive: true, pointsValue: 20 },
    { id: "gift_fire", name: "Flamme Fun", emoji: "🔥", pointsPrice: 30, description: "Pour enflammer la conversation !", rarity: "Commun", category: "Fête", animation: "lightning", soundEffect: "fire_crackle", duration: 5, isActive: true, pointsValue: 30 },
    { id: "gift_beer", name: "Bière Fraîche", emoji: "🍺", pointsPrice: 50, description: "Santé à notre amitié !", rarity: "Rare", category: "Fête", animation: "confetti", soundEffect: "cheers", duration: 6, isActive: true, pointsValue: 50 },
    { id: "gift_unicorn", name: "Licorne Magique", emoji: "🦄", pointsPrice: 100, description: "Une créature mystique et enchantée", rarity: "Épique", category: "Exclusif", animation: "galaxy", soundEffect: "sparkle_magic", duration: 8, isActive: true, pointsValue: 100 },
    { id: "gift_crown", name: "Couronne Royale", emoji: "👑", pointsPrice: 200, description: "Pour les rois et reines de Yaamaa", rarity: "Épique", category: "Royale", animation: "light", soundEffect: "royal_fanfare", duration: 7, isActive: true, pointsValue: 200 },
    { id: "gift_diamond", name: "Diamant Brillant", emoji: "💎", pointsPrice: 500, description: "La brillance absolue d'un diamant éternel", rarity: "Légendaire", category: "Richesse", animation: "diamonds", soundEffect: "diamond_cling", duration: 8, isActive: true, pointsValue: 500 },
    { id: "gift_rocket", name: "Fusée Spatiale", emoji: "🚀", pointsPrice: 1000, description: "Vers l'infini et au-delà !", rarity: "Légendaire", category: "Gaming", animation: "rocket", soundEffect: "rocket_blast", duration: 10, isActive: true, pointsValue: 1000 },
    { id: "gift_castle", name: "Château de Rêve", emoji: "🏰", pointsPrice: 2000, description: "Un empire digne de votre soutien", rarity: "Mythique", category: "Royale", animation: "castle", soundEffect: "epic_orchestra", duration: 12, isActive: true, pointsValue: 2000 },
    { id: "gift_lion", name: "Lion de la Teranga", emoji: "🦁", pointsPrice: 1500, description: "Le rugissement majestueux de l'Afrique", rarity: "Mythique", category: "Afrique", animation: "lion", soundEffect: "lion_roar", duration: 9, isActive: true, pointsValue: 1500 },
    { id: "gift_dragon", name: "Dragon Impérial", emoji: "🐉", pointsPrice: 3000, description: "Le souffle ardent de la fortune", rarity: "Mythique", category: "Légendaire", animation: "dragon", soundEffect: "dragon_breath", duration: 11, isActive: true, pointsValue: 3000 },
    { id: "gift_phoenix", name: "Phénix Flamboyant", emoji: "🐦", pointsPrice: 5000, description: "Renaissance de gloire et de puissance", rarity: "Mythique", category: "Afrique", animation: "phoenix", soundEffect: "phoenix_cry", duration: 13, isActive: true, pointsValue: 5000 },
    { id: "gift_lamborghini", name: "Supercar Or", emoji: "🏎️", pointsPrice: 4000, description: "Vitesse, luxe et domination absolue", rarity: "Mythique", category: "Richesse", animation: "car", soundEffect: "car_engine", duration: 10, isActive: true, pointsValue: 4000 }
  ],
  rechargePacks: [
    { id: "pack_100", pieces: 100, price: 1.0, currency: "USD", title: "Pack 100 Pièces", isActive: true },
    { id: "pack_200", pieces: 200, price: 2.0, currency: "USD", title: "Pack 200 Pièces", isActive: true },
    { id: "pack_500", pieces: 500, price: 5.0, currency: "USD", title: "Pack 500 Pièces", isActive: true },
    { id: "pack_1000", pieces: 1000, price: 10.0, currency: "USD", title: "Pack 1000 Pièces", isActive: true },
    { id: "pack_5000", pieces: 5000, price: 50.0, currency: "USD", title: "Pack 5000 Pièces", isActive: true },
    { id: "pack_10000", pieces: 10000, price: 100.0, currency: "USD", title: "Pack 10,000 Pièces", isActive: true }
  ],
  withdrawalPacks: [
    { id: "w_100", pieces: 100, value: 1.0, label: "Retrait / Conversion 100 Pièces", isActive: true },
    { id: "w_200", pieces: 200, value: 2.0, label: "Retrait / Conversion 200 Pièces", isActive: true },
    { id: "w_500", pieces: 500, value: 5.0, label: "Retrait / Conversion 500 Pièces", isActive: true },
    { id: "w_1000", pieces: 1000, value: 10.0, label: "Retrait / Conversion 1000 Pièces", isActive: true },
    { id: "w_5000", pieces: 5000, value: 50.0, label: "Retrait / Conversion 5000 Pièces", isActive: true },
    { id: "w_10000", pieces: 10000, value: 100.0, label: "Retrait / Conversion 10,000 Pièces", isActive: true }
  ],
  apiKeys: [
    {
      id: "key_payment_1",
      name: "Kkiapay Production Gateway",
      keyValue: "kk_live_9384729384728934759",
      providerType: "payment",
      recognizedRole: "Passerelle de Paiement Mobile (Bénin / WAEMU)",
      scope: "paiements, dépôts, retraits automatiques",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      operatorId: "user_founder"
    },
    {
      id: "key_enterprise_1",
      name: "Enterprise ERP Sync Key",
      keyValue: "enterprise_live_773829102834758",
      providerType: "enterprise",
      recognizedRole: "Intégration ERP & Commandes Marchandes",
      scope: "commandes, stock boutique, synchronisation",
      status: "active",
      createdAt: "2026-01-05T00:00:00Z",
      operatorId: "user_founder"
    },
    {
      id: "key_ai_1",
      name: "Google Gemini AI Core Key",
      keyValue: "AIzaSy_mock_gemini_production_key_2026",
      providerType: "ai",
      recognizedRole: "Intelligence Artificielle & Assistant Yaamaa AI",
      scope: "génération intelligente, recommandations, modération",
      status: "active",
      createdAt: "2026-01-10T00:00:00Z",
      operatorId: "user_founder"
    }
  ],
  adPacks: [
    {
      id: "pack_starter",
      name: "Pack Starter Visibilité",
      description: "Idéal pour lancer un nouveau produit et obtenir ses premières vues.",
      price: 2500,
      currency: "FCFA",
      durationDays: 7,
      guaranteedImpressions: 10000,
      estimatedViews: 500,
      estimatedClicks: 50,
      estimatedReach: 15000,
      category: "Général",
      diffusionType: "standard",
      priorityLevel: 1,
      isActive: true
    },
    {
      id: "pack_business",
      name: "Pack Business Croissance",
      description: "Puissant pour booster les ventes et attirer un trafic qualifié.",
      price: 10000,
      currency: "FCFA",
      durationDays: 30,
      guaranteedImpressions: 50000,
      estimatedViews: 3000,
      estimatedClicks: 350,
      estimatedReach: 75000,
      category: "E-Commerce",
      diffusionType: "priority",
      priorityLevel: 2,
      isActive: true
    },
    {
      id: "pack_premium",
      name: "Pack VIP Empire",
      description: "Mise en avant maximale sur la page d'accueil et priorités absolues dans l'algorithme.",
      price: 25000,
      currency: "FCFA",
      durationDays: 30,
      guaranteedImpressions: 150000,
      estimatedViews: 10000,
      estimatedClicks: 1200,
      estimatedReach: 200000,
      category: "Exclusif",
      diffusionType: "premium",
      priorityLevel: 3,
      isActive: true
    }
  ],
  campaignTypes: [
    {
      id: "camp_views",
      name: "Campagne Visibilité",
      objective: "views",
      description: "Maximiser les affichages et la notoriété d'un produit.",
      defaultBudget: 5000,
      defaultDuration: 7,
      isAvailable: true
    },
    {
      id: "camp_traffic",
      name: "Campagne Trafic Boutique",
      objective: "shop_visits",
      description: "Attirer des acheteurs qualifiés vers votre boutique en ligne.",
      defaultBudget: 10000,
      defaultDuration: 14,
      isAvailable: true
    },
    {
      id: "camp_sales",
      name: "Campagne Conversions & Ventes",
      objective: "sales",
      description: "Cibler les acheteurs avec un fort historique d'achat.",
      defaultBudget: 20000,
      defaultDuration: 30,
      isAvailable: true
    },
    {
      id: "camp_launch",
      name: "Campagne Lancement Produit",
      objective: "launch",
      description: "Propulser instantanément un nouveau produit sur la plateforme.",
      defaultBudget: 15000,
      defaultDuration: 10,
      isAvailable: true
    }
  ],
  adSettings: {
    maxSponsoredPerSession: 3,
    sponsoredOrganicRatio: 25,
    autoApproval: true,
    antiSpamEnabled: true
  },
  messageTemplates: [
    {
      id: "tpl_referral",
      title: "Bonus Parrainage",
      category: "referral",
      content: "Félicitations {NomUtilisateur} ! Vous venez de recevoir {MontantCommission} grâce à l'achat effectué par votre filleul {NomFilleul}. Votre nouveau solde est de {SoldePortefeuille}.",
      variables: ["NomUtilisateur", "MontantCommission", "NomFilleul", "SoldePortefeuille"],
      isActive: true
    },
    {
      id: "tpl_gift",
      title: "Cadeau Virtuel Reçu",
      category: "gift",
      content: "Bonjour {NomUtilisateur}, vous avez reçu un superbe cadeau {CadeauRecu} ! Date : {Date} à {Heure}.",
      variables: ["NomUtilisateur", "CadeauRecu", "Date", "Heure"],
      isActive: true
    },
    {
      id: "tpl_withdrawal",
      title: "Retrait Validé",
      category: "withdrawal",
      content: "Cher {NomUtilisateur}, votre demande de retrait de {MontantGagne} a été validée avec succès sur votre numéro marchand {NumeroMarchand}.",
      variables: ["NomUtilisateur", "MontantGagne", "NumeroMarchand"],
      isActive: true
    },
    {
      id: "tpl_mission",
      title: "Mission Rémunérée",
      category: "mission",
      content: "Bravo {NomUtilisateur} ! Votre mission '{NomCampagne}' est validée. Vous avez gagné {MontantGagne}.",
      variables: ["NomUtilisateur", "NomCampagne", "MontantGagne"],
      isActive: true
    }
  ],
  automationRules: [
    {
      id: "rule_1",
      name: "Alerte Automatique Parrainage",
      triggerEvent: "referral_success",
      conditions: "always",
      templateId: "tpl_referral",
      channels: ["in_app", "message"],
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z"
    },
    {
      id: "rule_2",
      name: "Notification Cadeau Reçu",
      triggerEvent: "gift_received",
      conditions: "always",
      templateId: "tpl_gift",
      channels: ["in_app"],
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z"
    },
    {
      id: "rule_3",
      name: "Confirmation de Retrait",
      triggerEvent: "withdrawal_success",
      conditions: "always",
      templateId: "tpl_withdrawal",
      channels: ["in_app"],
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z"
    }
  ],
  syncLogs: [
    {
      id: "log_init",
      adminId: "user_founder",
      adminUsername: "founder",
      timestamp: "2026-01-01T00:00:00Z",
      parameterKey: "initialization_sync",
      oldValue: "none",
      newValue: "active",
      modulesUpdated: ["tarifs", "parrainage", "cadeaux", "retraits"],
      status: "success",
      details: "Initialisation du moteur de synchronisation et d'automatisation Yaamaa."
    }
  ]
};

// Seed initial data
function ensureAdminMerchantNumber(u: User) {
  if (u && (u.role === "admin" || u.role === "founder")) {
    if (!u.merchantNumber) {
      u.merchantNumber = u.role === "founder" ? "YA0000000001FR" : "YA0000000002FR";
    }
    if (!u.merchantPackType) {
      u.merchantPackType = "diamond";
    }
    u.merchantNumberEligible = true;
    if (!u.merchantNumberPurchasedAt) {
      u.merchantNumberPurchasedAt = "2026-01-01T00:00:00Z";
    }
  }
}

const SEED_USERS: User[] = [
  {
    id: "user_founder",
    email: "founder@yaamaa.com",
    password: bcrypt.hashSync("password123", 10),
    phone: "+33612345678",
    name: "Pierre Le Fondateur",
    username: "FounderPierre",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    role: "founder",
    level: 50,
    xp: 95000,
    wallet: { available: 5000, pending: 0, totalEarned: 15400, referralEarned: 3200 },
    country: "France",
    currency: "EUR",
    referralCode: "BOSS2026",
    merchantNumber: "YA0000000001FR",
    merchantPackType: "diamond",
    merchantNumberEligible: true,
    merchantNumberPurchasedAt: "2026-01-01T00:00:00Z",
    is2faEnabled: true,
    isSuspended: false
  },
  {
    id: "user_admin",
    email: "celine@yaamaa.com",
    password: bcrypt.hashSync("password123", 10),
    phone: "+33687654321",
    name: "Celine Admin",
    username: "CelineAdmin",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    role: "admin",
    level: 25,
    xp: 34000,
    wallet: { available: 1500, pending: 0, totalEarned: 8400, referralEarned: 950 },
    country: "France",
    currency: "EUR",
    referralCode: "CELINE_A",
    merchantNumber: "YA0000000002FR",
    merchantPackType: "diamond",
    merchantNumberEligible: true,
    merchantNumberPurchasedAt: "2026-01-01T00:00:00Z",
    is2faEnabled: false,
    isSuspended: false
  },
  {
    id: "user_participant_1",
    email: "mamadou@yaamaa.com",
    password: bcrypt.hashSync("password123", 10),
    phone: "+221771234567",
    name: "Mamadou Diop",
    username: "MamadGains",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    role: "participant",
    level: 6,
    xp: 5400,
    wallet: { available: 25000, pending: 3500, totalEarned: 185000, referralEarned: 24000 },
    country: "Sénégal",
    currency: "XOF",
    referralCode: "SENEGAL221",
    referredBy: "BOSS2026",
    is2faEnabled: true,
    isSuspended: false
  },
  {
    id: "user_participant_2",
    email: "amelie@yaamaa.com",
    password: bcrypt.hashSync("password123", 10),
    phone: "+15149999999",
    name: "Amélie Tremblay",
    username: "Lili_QC",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    role: "participant",
    level: 12,
    xp: 14200,
    wallet: { available: 65, pending: 15, totalEarned: 480, referralEarned: 20 },
    country: "Canada",
    currency: "CAD",
    referralCode: "QUEBEC2026",
    is2faEnabled: false,
    isSuspended: false
  },
  {
    id: "user_advertiser_1",
    email: "mark@republican.com",
    password: bcrypt.hashSync("password123", 10),
    phone: "+14155552671",
    name: "Mark Advertiser",
    username: "MarkPromo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    role: "advertiser",
    level: 15,
    xp: 18500,
    wallet: { available: 450, pending: 0, totalEarned: 0, referralEarned: 0 },
    country: "United States",
    currency: "USD",
    referralCode: "USA_PROM",
    is2faEnabled: true,
    isSuspended: false
  }
];

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_1",
    title: "Aimer et S'abonner - Compilation TikTok Humour",
    description: "Allez sur la vidéo TikTok en lien, regardez pendant au moins 30 secondes pour ne pas être marqué comme spam, laissez un like et abonnez-vous au compte. Soumettez votre pseudonyme TikTok ainsi qu'un lien ou capture d'écran de votre profil en preuve.",
    category: "Humour & Divertissement",
    destLink: "https://tiktok.com/@comedycompilation/video/1239847129",
    type: "like_post",
    budgetTotal: 100,
    rewardPerUser: 0.20,
    participantsCount: 450,
    commission: 10,
    totalToPay: 110,
    targeting: {
      countries: ["France", "Sénégal", "Canada", "Côte d'Ivoire"],
      languages: ["Français"],
      gender: "all",
      ageMin: 15,
      ageMax: 45,
      interests: ["Mèmes", "Humour", "Jeux vidéo"],
      devices: ["Mobile"],
      minUserLevel: 1
    },
    schedule: {
      immediate: true
    },
    status: "active",
    advertiserId: "user_advertiser_1",
    advertiserName: "Mark Advertiser",
    createdAt: "2026-06-18T14:30:00Z",
    completedCount: 24,
    proofRequirements: "Votre pseudonyme TikTok et le lien de votre profil public."
  },
  {
    id: "camp_2",
    title: "Lire et donner un avis authentique sur l'App 'SwiftBudget'",
    description: "Téléchargez l'application mobile de budget personnel SwiftBudget sur Google Play Store ou Apple App Store. Testez-la pendant 5 minutes, configurez un premier budget fictif, puis laissez un avis de 5 étoiles authentique indiquant ce que vous appréciez le plus. Fournissez votre nom sur le Play Store et le texte de l'avis laissé.",
    category: "Finance & Fintech",
    destLink: "https://play.google.com/store/apps/details?id=com.swiftbudget.app",
    type: "give_review",
    budgetTotal: 500,
    rewardPerUser: 1.50,
    participantsCount: 300,
    commission: 50,
    totalToPay: 550,
    targeting: {
      countries: ["France", "Canada", "United States"],
      languages: ["Français", "Anglais"],
      gender: "all",
      ageMin: 18,
      ageMax: 60,
      interests: ["Budget", "Épargne", "Investissement"],
      devices: ["Mobile", "Tablet"],
      minUserLevel: 2
    },
    schedule: {
      immediate: true
    },
    status: "active",
    advertiserId: "user_advertiser_1",
    advertiserName: "Mark Advertiser",
    createdAt: "2026-06-19T09:12:00Z",
    completedCount: 112,
    proofRequirements: "Nom utilisé sur le store, texte exact de votre évaluation de l'application."
  },
  {
    id: "camp_3",
    title: "S'abonner à la chaine YouTube 'DevTech Masters'",
    description: "Recherchez la chaine YouTube 'DevTech Masters' ou utilisez le lien direct ci-dessous, abonnez-vous et activez la cloche des notifications. Visionnez la toute dernière vidéo (durée de 2 minutes minimum) pour que l'abonnement reste actif.",
    category: "Technologie",
    destLink: "https://youtube.com/c/devtechmasters",
    type: "follow_account",
    budgetTotal: 150,
    rewardPerUser: 0.25,
    participantsCount: 540,
    commission: 15,
    totalToPay: 165,
    targeting: {
      countries: [],
      languages: [],
      gender: "all",
      ageMin: 13,
      ageMax: 99,
      interests: ["Programmation", "High Tech", "Tutoriels"],
      devices: [],
      minUserLevel: 1
    },
    schedule: {
      immediate: true
    },
    status: "active",
    advertiserId: "user_advertiser_1",
    advertiserName: "Mark Advertiser",
    createdAt: "2026-06-20T11:00:00Z",
    completedCount: 388,
    proofRequirements: "Copie d'écran de l'abonnement avec la clèche active, ou votre lien de chaine YouTube."
  }
];

const SEED_SUBMISSIONS: TaskSubmission[] = [
  {
    id: "sub_1",
    campaignId: "camp_1",
    campaignTitle: "Aimer et S'abonner - Compilation TikTok Humour",
    campaignReward: 0.20,
    campaignCurrency: "EUR",
    participantId: "user_participant_1",
    participantUsername: "MamadGains",
    proofText: "Mon pseudo est @MamadouDiop221. Je me suis abonné à 15h40 et j'ai liké.",
    proofLink: "https://tiktok.com/@MamadouDiop221",
    status: "approved",
    autoCheckedByAI: true,
    fraudProbability: 5,
    aiReport: "Nom vérifié sur l'interface publique. Comportement naturel détecté.",
    createdAt: "2026-06-19T16:00:00Z"
  },
  {
    id: "sub_2",
    campaignId: "camp_2",
    campaignTitle: "Lire et donner un avis authentique sur l'App 'SwiftBudget'",
    campaignReward: 1.50,
    campaignCurrency: "CAD",
    participantId: "user_participant_2",
    participantUsername: "Lili_QC",
    proofText: "Pseudo Store: Amélie T. Avis laissé: 'Cette application simplifie enfin mon budget mensuel! Ultra propre.'",
    status: "pending",
    autoCheckedByAI: false,
    fraudProbability: 12,
    createdAt: "2026-06-20T21:44:00Z"
  }
];

const SEED_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx_1",
    userId: "user_participant_1",
    type: "earn",
    amount: 130, // EUR equivalent in XOF
    currency: "XOF",
    status: "completed",
    method: "Yaamaa Balance",
    details: "Rémunération de la tâche 'Abonnement YouTube'",
    createdAt: "2026-06-19T10:15:00Z"
  },
  {
    id: "tx_2",
    userId: "user_participant_1",
    type: "withdraw",
    amount: 15000,
    currency: "XOF",
    status: "pending",
    method: "Mobile Money (Orange Money)",
    details: "Demande de retrait vers le +221771234567",
    createdAt: "2026-06-20T18:30:00Z"
  },
  {
    id: "tx_3",
    userId: "user_advertiser_1",
    type: "funded_campaign",
    amount: 110,
    currency: "USD",
    status: "completed",
    method: "Carte Bancaire (VISA)",
    details: "Financement campagne 'TikTok compilation Humour'",
    createdAt: "2026-06-18T14:28:00Z"
  }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log_1",
    userId: "user_founder",
    username: "FounderPierre",
    role: "founder",
    action: "Système démarré",
    details: "Initialisation globale de la plateforme Yaamaa v1.0.0",
    timestamp: "2026-06-18T08:00:00Z",
    ip: "192.168.1.1"
  },
  {
    id: "log_2",
    userId: "user_founder",
    username: "FounderPierre",
    role: "founder",
    action: "Configuration Platform",
    details: "Frais de commission de plateforme configurés à 10%",
    timestamp: "2026-06-18T08:15:00Z",
    ip: "192.168.1.1"
  }
];

const SEED_SHOPS: Shop[] = [
  {
    id: "shop_mamadou",
    ownerId: "user_participant_1",
    ownerUsername: "MamadGains",
    name: "AfriqTech Solutions",
    logo: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=150&auto=format&fit=crop",
    description: "Gadgets électroniques, supports digitaux et formations de qualité pour réussir en Afrique.",
    country: "Sénégal",
    contactInfo: "+221771234567, mamadou@yaamaa.com",
    createdAt: "2026-06-20T10:00:00Z"
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: "prod_stand",
    shopId: "shop_mamadou",
    shopName: "AfriqTech Solutions",
    ownerId: "user_participant_1",
    name: "Support de Smartphone Flexible Multi-angle",
    category: "physical",
    description: "Support pivotant à 360 degrés pour vidéos TikTok, tournages de tutoriels et appels vidéos. Très stable, solide et adapté à tous les modèles de smartphones.",
    targetCountries: ["Sénégal", "France", "Côte d'Ivoire"],
    images: [
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=400&auto=format&fit=crop"
    ],
    videoUrl: "",
    quantityAvailable: 48,
    price: 3500,
    currency: "XOF",
    shippingTime: "2-4 jours ouvrés",
    salesCount: 15,
    rating: 4.8,
    termsOfSale: "Garantie de remboursement de 14 jours en cas de défaut de fabrication. Livraison sécurisée par Point Relais ou livraison directe.",
    isApproved: true,
    isBanned: false,
    createdAt: "2026-06-20T11:30:00Z"
  },
  {
    id: "prod_guide",
    shopId: "shop_mamadou",
    shopName: "AfriqTech Solutions",
    ownerId: "user_participant_1",
    name: "E-book : Réussir son Entrepreneuriat en Afrique de l'Ouest",
    category: "ebook",
    description: "Un guide pragmatique contenant les stratégies indispensables, les erreurs à éviter et les secteurs porteurs en Afrique de l'Ouest pour lancer et sécuriser ses revenus.",
    targetCountries: ["Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso", "France"],
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop"
    ],
    videoUrl: "",
    quantityAvailable: 9999,
    price: 5000,
    currency: "XOF",
    shippingTime: "Téléchargement immédiat par e-mail",
    salesCount: 84,
    rating: 4.9,
    termsOfSale: "Produit livrable immédiatement après paiement. Pas de remboursement car contenu numérique.",
    isApproved: true,
    isBanned: false,
    createdAt: "2026-06-21T09:15:00Z"
  }
];

const SEED_ORDERS: Order[] = [
  {
    id: "order_1",
    productId: "prod_stand",
    productName: "Support de Smartphone Flexible Multi-angle",
    productImage: "https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=400&auto=format&fit=crop",
    shopId: "shop_mamadou",
    shopName: "AfriqTech Solutions",
    sellerId: "user_participant_1",
    buyerId: "user_founder",
    buyerUsername: "FounderPierre",
    quantity: 1,
    totalPrice: 3500,
    currency: "XOF",
    shippingAddress: "Villa 142, Sacré-Cœur, Dakar, Sénégal",
    phoneNumber: "+221774567890",
    email: "founder@yaamaa.com",
    paymentMethod: "Wallet Yaamaa",
    trackingNumber: "TRK-DK-94827",
    status: "completed",
    createdAt: "2026-06-21T14:20:00Z"
  },
  {
    id: "order_2",
    productId: "prod_guide",
    productName: "E-book : Réussir son Entrepreneuriat en Afrique de l'Ouest",
    productImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
    shopId: "shop_mamadou",
    shopName: "AfriqTech Solutions",
    sellerId: "user_participant_1",
    buyerId: "user_participant_2",
    buyerUsername: "Lili_QC",
    quantity: 1,
    totalPrice: 5000,
    currency: "XOF",
    shippingAddress: "Numérique via E-mail, Québec, Canada",
    phoneNumber: "+15149999999",
    email: "amelie@yaamaa.com",
    paymentMethod: "Cartes bancaires",
    status: "completed",
    createdAt: "2026-06-22T08:00:00Z"
  }
];

const SEED_DISPUTES: Dispute[] = [];

const SEED_PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: "promo_1",
    ownerId: "user_advertiser_1",
    ownerUsername: "MarkPromo",
    type: "youtube",
    title: "Chaîne YouTube - Secrets de Liberté Financière",
    productServiceName: "Abonnement YouTube Secrets Financiers",
    destLink: "https://youtube.com/c/secretsfinanciers",
    description: "Apprenez les leviers d'épargne forcée, d'investissement locatif et de freelancing pour sortir de la dépendance salariale en 2026.",
    instructions: "Cliquez sur le lien, abonnez-vous et activez la cloche des notifications.",
    images: ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop"],
    videos: [],
    targetCountries: ["France", "Belgique", "Sénégal", "Canada", "Côte d'Ivoire"],
    targetLanguages: ["Français"],
    targetAge: "18+",
    targetInterests: ["Investissement", "Finance", "Bourse", "Entreprenariat"],
    startDate: "2026-06-22",
    endDate: "2026-07-22",
    budgetTier: "standard",
    budgetPrice: 500,
    currency: "EUR",
    paymentStatus: "paid",
    status: "active",
    impressions: 4890,
    views: 1250,
    clicks: 430,
    ctr: 8.79,
    revenueGenerated: 0,
    createdAt: "2026-06-22T10:00:00Z"
  }
];

const SEED_SUPPLIERS_DELIVERERS: SupplierDelivererProfile[] = [
  {
    id: "sup_1",
    userId: "user_participant_1",
    type: "supplier",
    fullName: "Aissatou Diallo",
    profilePhoto: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop",
    companyLogo: "https://images.unsplash.com/photo-1578574577315-3fbeb0ce4ef2?q=80&w=200&auto=format&fit=crop",
    phone: "+221773456789",
    email: "aissatou.agro@yaamaa.com",
    country: "Sénégal",
    city: "Dakar",
    interventionZone: "Dakar Plateau, Almadies, Mermoz",
    professionalAddress: "Rue 10 x Angle Avenue Bourguiba, Dakar",
    activityType: "Agro-alimentaire & Produits Locaux Bio",
    servicesDescription: "Fourniture en gros et détail de céréales locales (mil, fonio), jus naturels artisanaux et épices de Teranga de qualité supérieure.",
    idDocumentUrl: "https://example.com/id_aissatou.pdf",
    companyDocumentUrl: "https://example.com/rccm_aissatou.pdf",
    availabilityHours: "Lundi au Samedi : 08h00 - 19h00",
    rates: "Devis sur mesure selon volume",
    spokenLanguages: ["Français", "Wolof", "Anglais"],
    status: "approved",
    isVerified: true,
    rating: 4.9,
    reviewsCount: 34,
    missionsCompletedCount: 142,
    successRate: 99,
    createdAt: "2026-05-10T10:00:00Z"
  },
  {
    id: "del_1",
    userId: "user_participant_2",
    type: "deliverer",
    fullName: "Moussa Konaté",
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    phone: "+221765432109",
    email: "moussa.express@yaamaa.com",
    country: "Sénégal",
    city: "Dakar",
    interventionZone: "Grand Dakar, Pikine, Guédiawaye, Dakar Plateau",
    professionalAddress: "Cité Keur Gorgui, Immeuble A, Dakar",
    activityType: "Livraison Express Colis & Repas",
    servicesDescription: "Service de livraison rapide à moto pour documents, colis e-commerce, repas chauds et courses urgentes dans tout Dakar et sa banlieue.",
    idDocumentUrl: "https://example.com/id_moussa.pdf",
    drivingLicenseUrl: "https://example.com/permis_moussa.pdf",
    transportMethod: "Moto Yamaha 125cc",
    vehiclePhotos: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300&auto=format&fit=crop"],
    insuranceDocumentUrl: "https://example.com/assurance_moussa.pdf",
    availabilityHours: "7j/7 : 07h00 - 23h00",
    rates: "À partir de 1 000 XOF la course",
    spokenLanguages: ["Français", "Wolof"],
    status: "approved",
    isVerified: true,
    rating: 4.8,
    reviewsCount: 68,
    missionsCompletedCount: 310,
    successRate: 98,
    createdAt: "2026-05-12T14:00:00Z"
  }
];

const SEED_SUPPLIER_REVIEWS: SupplierDelivererReview[] = [
  {
    id: "rev_1",
    profileId: "sup_1",
    userId: "user_participant_2",
    username: "Lili_QC",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    comment: "Produits locaux d'une fraîcheur incroyable ! Livraison rapide et service très professionnel.",
    createdAt: "2026-06-01T10:00:00Z"
  }
];

const SEED_MODERATION_FILES: ModerationFile[] = [
  {
    id: "mod_1",
    category: "supplier",
    title: "Candidature Fournisseur Électronique Pro",
    applicantId: "user_aminata",
    applicantUsername: "aminata_tech",
    applicantName: "Aminata Diallo",
    applicantAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "pending",
    urgency: "urgent",
    supportingDocuments: [
      { title: "Registre de Commerce (RCCM)", url: "https://example.com/rccm_aminata.pdf", type: "pdf" },
      { title: "Pièce d'Identité Nationale", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2", type: "image" }
    ],
    applicantInfo: {
      companyName: "Dakar Tech & Supplies SARL",
      ninea: "009847291",
      address: "Avenue Bourguiba, Dakar",
      activity: "Import-export de matériel informatique"
    },
    internalComments: [
      { id: "comm_1", adminId: "user_founder", adminUsername: "Fondateur", text: "Vérifier la validité du NINEA auprès du service fiscal.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    actionHistory: [
      { id: "act_1", adminId: "user_founder", adminUsername: "Fondateur", action: "Création dossier", oldStatus: "-", newStatus: "pending", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() }
    ]
  },
  {
    id: "mod_2",
    category: "deliverer",
    title: "Demande de Partenariat Livreur Express",
    applicantId: "user_moussa",
    applicantUsername: "moussa_express",
    applicantName: "Moussa Ndiaye",
    applicantAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "under_review",
    urgency: "normal",
    assignedAdminId: "user_admin",
    assignedAdminUsername: "Superviseur Admin",
    supportingDocuments: [
      { title: "Permis de Conduire A1", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0", type: "image" },
      { title: "Assurance Moto", url: "https://example.com/assurance_moussa.pdf", type: "pdf" }
    ],
    applicantInfo: {
      vehicleType: "Moto Scooter 125cc",
      plateNumber: "DK-4829-X",
      zone: "Plateau & Almadies, Dakar"
    },
    internalComments: [],
    actionHistory: [
      { id: "act_2", adminId: "user_admin", adminUsername: "Superviseur Admin", action: "Changement de statut", oldStatus: "pending", newStatus: "under_review", comment: "Examen des pièces d'assurance en cours.", createdAt: new Date(Date.now() - 3600000 * 12).toISOString() }
    ]
  },
  {
    id: "mod_3",
    category: "api_integration",
    title: "Demande d'Accès API Partenaire Paiement",
    applicantId: "user_dev",
    applicantUsername: "fintech_lead",
    applicantName: "Jean-Marc Kouassi",
    applicantAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: "more_info_requested",
    urgency: "flagged",
    supportingDocuments: [
      { title: "Architecture Technique OAuth2", url: "https://example.com/arch_oauth.pdf", type: "pdf" }
    ],
    applicantInfo: {
      appName: "PayGateway West Africa",
      webhookUrl: "https://api.paygateway.africa/webhook/yaamaa",
      scope: "payments, merchants"
    },
    internalComments: [
      { id: "comm_2", adminId: "user_founder", adminUsername: "Fondateur", text: "Demander l'URL de test Sandbox et le certificat SSL de production.", createdAt: new Date(Date.now() - 3600000 * 30).toISOString() }
    ],
    actionHistory: [
      { id: "act_3", adminId: "user_founder", adminUsername: "Fondateur", action: "Demande d'informations", oldStatus: "pending", newStatus: "more_info_requested", comment: "Certificat SSL manquant.", createdAt: new Date(Date.now() - 3600000 * 30).toISOString() }
    ]
  },
  {
    id: "mod_4",
    category: "account_verification",
    title: "Vérification de Compte Célébrité / Artiste",
    applicantId: "user_artist",
    applicantUsername: "waly_ballago",
    applicantName: "Waly Seck Officiel",
    applicantAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=150&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: "approved",
    urgency: "normal",
    assignedAdminId: "user_founder",
    assignedAdminUsername: "Fondateur",
    supportingDocuments: [
      { title: "Pièce d'Identité & Contrat de Management", url: "https://example.com/id_waly.pdf", type: "pdf" }
    ],
    applicantInfo: {
      category: "Artiste / Musicien",
      socialProfile: "instagram.com/walyseck"
    },
    internalComments: [
      { id: "comm_3", adminId: "user_founder", adminUsername: "Fondateur", text: "Identité vérifiée et validée.", createdAt: new Date(Date.now() - 3600000 * 60).toISOString() }
    ],
    actionHistory: [
      { id: "act_4", adminId: "user_founder", adminUsername: "Fondateur", action: "Approbation", oldStatus: "pending", newStatus: "approved", comment: "Badge Diamant / Vérifié attribué.", createdAt: new Date(Date.now() - 3600000 * 60).toISOString() }
    ]
  }
];

const SEED_MISSION_REQUESTS: MissionRequest[] = [];

const SEED_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_blue",
    name: "Plan Basic",
    tier: "blue",
    badgeLabel: "Bleu Basic",
    colorTheme: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
      gradient: "from-blue-600 to-sky-400"
    },
    description: "Badge bleu officiel pour les marchands débutants sur la plateforme Yama.",
    benefits: ["Badge Bleu vérifié", "Numéro marchand unique à vie", "Support standard 24/7", "Jusqu'à 20 filleuls"],
    initialPrice: 5000,
    renewalPrice: 3000,
    durationValue: 30,
    durationUnit: "days",
    maxReferrals: 20,
    referralCommission: 2500,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "plan_bronze",
    name: "Plan Argent",
    tier: "bronze",
    badgeLabel: "Bronze Doré",
    colorTheme: {
      bg: "bg-amber-700/10",
      border: "border-amber-700/30",
      text: "text-amber-600",
      gradient: "from-amber-700 to-yellow-600"
    },
    description: "Badge Bronze Doré pour les marchands en expansion avec des avantages accrus.",
    benefits: ["Badge Bronze Doré exclusif", "Numéro marchand prioritaire", "Jusqu'à 50 filleuls", "Visibilité accrue dans l'annuaire"],
    initialPrice: 10000,
    renewalPrice: 6000,
    durationValue: 30,
    durationUnit: "days",
    maxReferrals: 50,
    referralCommission: 5000,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "plan_gold",
    name: "Plan Or",
    tier: "gold",
    badgeLabel: "Or Premium",
    colorTheme: {
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      text: "text-amber-400",
      gradient: "from-amber-500 to-yellow-300"
    },
    description: "Badge Or prestigieux pour les marchands professionnels confirmés.",
    benefits: ["Badge Or étincelant", "Jusqu'à 500 filleuls", "Priorité maximale sur les missions", "Support VIP dédié"],
    initialPrice: 15000,
    renewalPrice: 10000,
    durationValue: 30,
    durationUnit: "days",
    maxReferrals: 500,
    referralCommission: 7500,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "plan_diamond",
    name: "Plan Diamant",
    tier: "diamond",
    badgeLabel: "Diamant Élite",
    colorTheme: {
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/30",
      text: "text-cyan-300",
      gradient: "from-cyan-400 via-sky-300 to-indigo-400"
    },
    description: "Le badge le plus prestigieux et luxueux de l'écosystème Yama pour les élites.",
    benefits: ["Badge Diamant haute distinction", "Jusqu'à 2 000 filleuls", "Zéro commission sur les parrainages", "Concierge et assistance 24/7 VIP"],
    initialPrice: 35000,
    renewalPrice: 25000,
    durationValue: 30,
    durationUnit: "days",
    maxReferrals: 2000,
    referralCommission: 17500,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z"
  }
];

const SEED_USER_SUBSCRIPTIONS: UserSubscription[] = [];

const SEED_SUPERVISION_INCIDENTS: SupervisionIncident[] = [
  {
    id: "inc_1",
    component: "Serveur Principal (Cluster A)",
    componentKey: "server",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    severity: "high",
    title: "Pic de charge CPU > 92%",
    description: "Le cluster de serveurs principaux a subi une forte augmentation des requêtes simultanées suite à une campagne virale.",
    consequences: "Ralentissement temporaire de l'affichage des pages de parrainage et file d'attente API accrue de 45ms.",
    logs: [
      "[INFO] 2026-07-07 04:12:01 - CPU usage normal: 28%",
      "[WARN] 2026-07-07 04:15:22 - Spike detected: Active threads reached 1,024",
      "[CRITICAL] 2026-07-07 04:16:05 - CPU load average over 5m: 4.82 (threshold: 3.50)",
      "[AUTO] 2026-07-07 04:17:00 - Auto-scaling triggered: Spun up 2 additional worker containers."
    ],
    impactedUsersCount: 342,
    probableCauses: "Afflux massif de trafic sur les liens de parrainage WhatsApp & Telegram.",
    recommendations: "Augmenter la capacité de mise à l'échelle automatique (autoscale max workers à 8).",
    correctionSteps: ["Activer le cache Redis sur les redirections de parrainage", "Redistribuer la charge sur la région alternative"],
    isAutoCorrectable: true,
    status: "auto_corrected",
    resolvedAt: new Date(Date.now() - 3600000 * 3.8).toISOString()
  },
  {
    id: "inc_2",
    component: "Passerelle de Paiement Mobile Money",
    componentKey: "payments",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    severity: "critical",
    title: "Latence API Orange Money / Wave",
    description: "Délai de réponse de la passerelle partenaire supérieur à 8 secondes provoquant des timeouts sur l'achat de numéros marchands.",
    consequences: "Échec temporaire de 18 transactions de recharge et blocage de la validation automatique.",
    logs: [
      "[ERROR] 2026-07-06 20:30:10 - HTTP 504 Gateway Timeout from gateway.orange-money.api",
      "[WARN] 2026-07-06 20:31:00 - Retry attempt 1/3 failed after 8000ms",
      "[INFO] 2026-07-06 20:32:15 - Fallback gateway secondary routing activated successfully."
    ],
    impactedUsersCount: 18,
    probableCauses: "Maintenance technique inopinée de l'opérateur télécom partenaire.",
    recommendations: "Basculer systématiquement sur le routage de secours Wave en cas de timeout > 3000ms.",
    correctionSteps: ["Vérifier le statut webhook", "Rejouer manuellement les transactions en attente depuis le panneau admin finance"],
    isAutoCorrectable: false,
    status: "resolved",
    resolvedAt: new Date(Date.now() - 3600000 * 11.5).toISOString()
  },
  {
    id: "inc_3",
    component: "Service de Messagerie WebSocket & Chat",
    componentKey: "messaging",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    severity: "medium",
    title: "Déconnexions intermittentes du socket temps réel",
    description: "Quelques clients connectés en zone rurale ont subi une reconnexion WebSocket en boucle due à des fluctuations de signal 4G.",
    consequences: "Retard de 2 à 4 secondes dans la réception des messages de chat communautaire.",
    logs: [
      "[WARN] 2026-07-07 08:30:15 - WebSocket heartbeat timeout for client conn_9981",
      "[INFO] 2026-07-07 08:30:18 - Automatic reconnection initiated with exponential backoff."
    ],
    impactedUsersCount: 24,
    probableCauses: "Qualité de signal réseau mobile instable.",
    recommendations: "Optimiser le protocole de battement de cœur (heartbeat interval à 15s).",
    correctionSteps: ["Aucune action humaine requise, le mécanisme de reconnexion gère l'état."],
    isAutoCorrectable: true,
    status: "active"
  }
];

const SEED_SUPERVISION_REPORTS: SupervisionReport[] = [
  {
    id: "rep_daily_01",
    type: "daily",
    date: "2026-07-06",
    title: "Rapport de Performance Quotidien - 06/07/2026",
    performanceSummary: "Excellente stabilité globale. Uptime de 99.94%. Temps de réponse moyen de l'API de 38ms.",
    incidentsCount: 2,
    resolvedCount: 2,
    activeUsersCount: 4210,
    growthRate: +4.8,
    details: "Volume total de transactions : 1,450,000 XOF. Aucun incident de sécurité signalé. Taux d'engagement de la communauté en hausse de 12%."
  },
  {
    id: "rep_weekly_01",
    type: "weekly",
    date: "Semaine 27 (01/07 - 07/07/2026)",
    title: "Rapport Hebdomadaire de Supervision & Croissance",
    performanceSummary: "Croissance soutenue des inscriptions marchandes (+240 nouveaux numéros). Stabilité parfaite des bases de données répliquées.",
    incidentsCount: 5,
    resolvedCount: 5,
    activeUsersCount: 15420,
    growthRate: +15.2,
    details: "Les services de cadeaux virtuels et l'assistant IA Yaamaa représentent 45% des interactions de la semaine."
  }
];

function getUserMaxReferrals(user: User): number {
  if (!appState.subscriptionPlans) {
    appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
  }
  const activeSub = (appState.userSubscriptions || []).find(s => s.userId === user.id && s.status === "active" && new Date(s.expirationDate) > new Date());
  if (activeSub) {
    const plan = appState.subscriptionPlans.find(p => p.id === activeSub.planId);
    if (plan && plan.maxReferrals !== undefined) {
      return plan.maxReferrals;
    }
  }
  const tier = activeSub?.tier || user.merchantPackType || "blue";
  const planByTier = appState.subscriptionPlans.find(p => p.tier === tier);
  if (planByTier && planByTier.maxReferrals !== undefined) {
    return planByTier.maxReferrals;
  }
  if (tier === "diamond") return 2000;
  if (tier === "gold") return 500;
  if (tier === "bronze") return 50;
  return 20;
}



// Helper to load state
function loadState(): AppState {
  const isProduction = process.env.NODE_ENV === "production";
  const enableDemoSeed = process.env.ENABLE_DEMO_SEED === "true";
  const useDemoSeed = !isProduction || enableDemoSeed;

  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const state: AppState = JSON.parse(raw);
      let updated = false;

      // In production, if demo seed is explicitly disabled, filter out seed users to ensure clean slate
      if (isProduction && !enableDemoSeed) {
        const hasSeedUsers = state.users.some(u => ["user_founder", "user_admin", "user_participant_1", "user_participant_2", "user_advertiser_1"].includes(u.id));
        if (hasSeedUsers) {
          state.users = [];
          state.campaigns = [];
          state.submissions = [];
          state.transactions = [];
          state.auditLogs = [];
          state.shops = [];
          state.products = [];
          state.orders = [];
          state.disputes = [];
          state.promoCampaigns = [];
          state.communities = [];
          state.socialMessages = [];
          state.friendRequests = [];
          updated = true;
        }
      }

      state.users.forEach(u => {
        ensureAdminMerchantNumber(u);
        if (!u.password) {
          u.password = "password123";
          updated = true;
        }
        if (!u.createdAt) {
          u.createdAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
          updated = true;
        }
        if (u.giftPoints === undefined) {
          u.giftPoints = 1000;
          updated = true;
        }
        if (u.giftPointsEarned === undefined) {
          u.giftPointsEarned = 0;
          updated = true;
        }
        if (!u.language) {
          const frenchCountries = ["CI", "FR", "BE", "CA", "SN", "BF", "BJ", "CM", "CF", "CG", "CD", "DJ", "GA", "GN", "HT", "MC", "NE", "RW", "TG", "TD", "VU", "Côte d'Ivoire", "France", "Bénin", "Burkina Faso", "Cameroun", "Centrafrique", "Congo-Brazzaville", "Congo-Kinshasa (RDC)", "Djibouti", "Gabon", "Guinée", "Haïti", "Monaco", "Niger", "Rwanda", "Sénégal", "Togo", "Tchad", "Vanuatu"];
          u.language = frenchCountries.includes(u.country) ? "fr" : "en";
          updated = true;
        }
      });

      if (state.settings) {
        if (state.settings.merchantNumberPrice === undefined) {
          state.settings.merchantNumberPrice = 5000;
          updated = true;
        }
        if (state.settings.merchantPremiumPrice === undefined) {
          state.settings.merchantPremiumPrice = 5000;
          updated = true;
        }
        if (state.settings.merchantGoldPrice === undefined) {
          state.settings.merchantGoldPrice = 15000;
          updated = true;
        }
        if (state.settings.merchantDiamondPrice === undefined) {
          state.settings.merchantDiamondPrice = 35000;
          updated = true;
        }
        if (state.settings.giftPointsConversionRate === undefined) {
          state.settings.giftPointsConversionRate = 0.01;
          updated = true;
        }
        if (state.settings.virtualGifts === undefined || state.settings.virtualGifts.length === 0 || !state.settings.virtualGifts[0].category) {
          state.settings.virtualGifts = DEFAULT_SETTINGS.virtualGifts;
          updated = true;
        }
        if (state.settings.autoSenderName === undefined) {
          state.settings.autoSenderName = DEFAULT_SETTINGS.autoSenderName || "Yama Assistance";
          updated = true;
        }
        if (state.settings.autoSenderPhone === undefined) {
          state.settings.autoSenderPhone = DEFAULT_SETTINGS.autoSenderPhone || "+221701234567";
          updated = true;
        }
        if (state.settings.autoSenderAvatar === undefined) {
          state.settings.autoSenderAvatar = DEFAULT_SETTINGS.autoSenderAvatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop";
          updated = true;
        }

        // Sync user_admin account with current autoSender settings
        const uAdmin = state.users.find(u => u.id === "user_admin");
        if (uAdmin) {
          const expectedName = state.settings.autoSenderName || "Yama Assistance";
          const expectedPhone = state.settings.autoSenderPhone || "+221701234567";
          const expectedAvatar = state.settings.autoSenderAvatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop";
          
          if (uAdmin.name !== expectedName) {
            uAdmin.name = expectedName;
            uAdmin.username = expectedName.replace(/\s+/g, "");
            updated = true;
          }
          if (uAdmin.phone !== expectedPhone) {
            uAdmin.phone = expectedPhone;
            updated = true;
          }
          if (uAdmin.avatar !== expectedAvatar) {
            uAdmin.avatar = expectedAvatar;
            updated = true;
          }
        }
      }
      
      if (!state.shops) {
        state.shops = useDemoSeed ? SEED_SHOPS : [];
        updated = true;
      }
      if (!state.products) {
        state.products = useDemoSeed ? SEED_PRODUCTS : [];
        updated = true;
      }
      if (!state.orders) {
        state.orders = useDemoSeed ? SEED_ORDERS : [];
        updated = true;
      }
      if (!state.disputes) {
        state.disputes = useDemoSeed ? SEED_DISPUTES : [];
        updated = true;
      }
      if (!state.promoCampaigns) {
        state.promoCampaigns = useDemoSeed ? SEED_PROMO_CAMPAIGNS : [];
        updated = true;
      }
      if (!state.communities) {
        state.communities = [];
        updated = true;
      }
      if (!state.socialMessages) {
        state.socialMessages = [];
        updated = true;
      }
      if (!state.friendRequests) {
        state.friendRequests = [];
        updated = true;
      }
      if (!state.broadcastCampaigns) {
        state.broadcastCampaigns = [];
        updated = true;
      }
      if (!state.suppliersDeliverers) {
        state.suppliersDeliverers = useDemoSeed ? SEED_SUPPLIERS_DELIVERERS : [];
        updated = true;
      }
      if (!state.supplierReviews) {
        state.supplierReviews = useDemoSeed ? SEED_SUPPLIER_REVIEWS : [];
        updated = true;
      }
      if (!state.missionRequests) {
        state.missionRequests = useDemoSeed ? SEED_MISSION_REQUESTS : [];
        updated = true;
      }
      if (!state.subscriptionPlans) {
        state.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
        updated = true;
      }
      if (!state.userSubscriptions) {
        state.userSubscriptions = SEED_USER_SUBSCRIPTIONS;
        updated = true;
      }
      if (!state.subscriptionNotifications) {
        state.subscriptionNotifications = [];
        updated = true;
      }
      if (!state.supervisionIncidents) {
        state.supervisionIncidents = SEED_SUPERVISION_INCIDENTS;
        updated = true;
      }
      if (!state.supervisionReports) {
        state.supervisionReports = SEED_SUPERVISION_REPORTS;
        updated = true;
      }
      if (!state.moderationFiles) {
        state.moderationFiles = useDemoSeed ? SEED_MODERATION_FILES : [];
        updated = true;
      }
      if (!state.multiVendorOrders) {
        state.multiVendorOrders = [];
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
      }
      return state;
    }
  } catch (err) {
    console.error("Error reading persistence file, keeping standard memory:", err);
  }

  // If no file exists, initialize and save
  const freshState: AppState = {
    users: useDemoSeed ? SEED_USERS : [],
    campaigns: useDemoSeed ? SEED_CAMPAIGNS : [],
    submissions: useDemoSeed ? SEED_SUBMISSIONS : [],
    transactions: useDemoSeed ? SEED_TRANSACTIONS : [],
    auditLogs: useDemoSeed ? SEED_AUDIT_LOGS : [],
    settings: DEFAULT_SETTINGS,
    shops: useDemoSeed ? SEED_SHOPS : [],
    products: useDemoSeed ? SEED_PRODUCTS : [],
    orders: useDemoSeed ? SEED_ORDERS : [],
    disputes: useDemoSeed ? SEED_DISPUTES : [],
    promoCampaigns: useDemoSeed ? SEED_PROMO_CAMPAIGNS : [],
    communities: [],
    socialMessages: [],
    friendRequests: [],
    broadcastCampaigns: [],
    suppliersDeliverers: useDemoSeed ? SEED_SUPPLIERS_DELIVERERS : [],
    supplierReviews: useDemoSeed ? SEED_SUPPLIER_REVIEWS : [],
    missionRequests: useDemoSeed ? SEED_MISSION_REQUESTS : [],
    subscriptionPlans: SEED_SUBSCRIPTION_PLANS,
    userSubscriptions: SEED_USER_SUBSCRIPTIONS,
    subscriptionNotifications: [],
    supervisionIncidents: SEED_SUPERVISION_INCIDENTS,
    supervisionReports: SEED_SUPERVISION_REPORTS,
    moderationFiles: useDemoSeed ? SEED_MODERATION_FILES : [],
    multiVendorOrders: []
  };
  saveState(freshState);
  return freshState;
}

// Helper to save state
function saveState(state: AppState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing persistence file:", err);
  }
}

// Global active app partition
let appState = loadState();

// Save state periodic copy for easy recovery
try {
  if (!fs.existsSync(BACKUP_FILE)) {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(appState, null, 2), "utf-8");
  }
} catch (err) {
  console.error("Error creating state backup file:", err);
}

// Audit trail addition helper
function createAuditLog(userId: string, username: string, role: any, action: string, details: string, req: express.Request) {
  const newLog: AuditLog = {
    id: "log_" + Date.now(),
    userId,
    username,
    role,
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip || "127.0.0.1"
  };
  appState.auditLogs.unshift(newLog);
  // Cap logs to last 300 to avoid memory overflow but preserve rich trials!
  if (appState.auditLogs.length > 300) {
    appState.auditLogs = appState.auditLogs.slice(0, 300);
  }
  saveState(appState);
}

// Run express setup
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============================================
// REST API ENDPOINTS
// ============================================

// 1. SYSTEM GENERAL SETTINGS & METRICS
app.get("/api/settings", (req, res) => {
  res.json({
    settings: appState.settings,
    totalUsers: appState.users.length,
    totalCampaigns: appState.campaigns.length,
    activeCampaigns: appState.campaigns.filter(c => c.status === "active").length,
    totalDistributed: appState.settings.payoutsDistributed,
  });
});

// 2. AUTH & USER SIMULATION SETTINGS
app.get("/api/users", (req, res) => {
  appState.users.forEach(u => ensureAdminMerchantNumber(u));
  res.json(appState.users);
});

app.post("/api/users/current", (req, res) => {
  const { userId } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }
  ensureAdminMerchantNumber(user);
  res.json(user);
});

// Real User Login Authentication Email or Merchant Number and Password
app.post("/api/users/login", (req, res) => {
  const { email, identifier, password } = req.body;
  const loginId = identifier || email;
  
  if (!loginId || !password) {
    return res.status(400).json({ error: "Veuillez renseigner votre numéro marchand ou email et votre mot de passe." });
  }

  // Find user by email or merchant number
  const cleanId = loginId.trim().toLowerCase();
  const user = appState.users.find(u => 
    u.email.toLowerCase() === cleanId || 
    (u.merchantNumber && u.merchantNumber.toLowerCase() === cleanId)
  );

  if (!user) {
    return res.status(401).json({ error: "Le numéro marchand ou l'adresse est invalide." });
  }

  // Validate password match
  const isMatch = bcrypt.compareSync(password, user.password || "") || user.password === password;
  if (!isMatch) {
    return res.status(401).json({ error: "Mot de passe invalide." });
  }

  ensureAdminMerchantNumber(user);
  createAuditLog(user.id, user.username, user.role, "Connexion réussie", `L'utilisateur @${user.username} s'est connecté.`, req);
  res.json(user);
});

// Create/Update profile simulation
app.post("/api/users/register", (req, res) => {
  let { name, username, email, phone, role, country, currency, referredBy, password } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: "Veuillez renseigner votre Nom et votre E-mail." });
  }

  const userPassword = bcrypt.hashSync(password || "123456", 10);

  // Default to founder promo code BOSS2026 if not specified (Google search / direct download default)
  const defaultReferredBy = referredBy || "BOSS2026";

  // Ensure unique email
  const emailExists = appState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Cette adresse e-mail est déjà inscrite. Veuillez vous connecter." });
  }

  // Auto-generate username if not provided
  if (!username) {
    username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(10 + Math.random()*90);
  }

  // Check unique username
  const exists = appState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    username = username + Math.floor(10 + Math.random()*90);
  }

  const referralCode = "REF_" + username.substring(0, 4).toUpperCase() + Math.floor(100+Math.random()*900);
  const isFirstUser = appState.users.length === 0;
  const newUser: User = {
    id: "user_" + Date.now(),
    email,
    password: userPassword,
    phone: phone || "",
    name,
    username,
    avatar: isFirstUser 
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    role: isFirstUser ? "founder" : (role || "participant"),
    level: isFirstUser ? 50 : 1,
    xp: isFirstUser ? 95000 : 0,
    wallet: isFirstUser
      ? { available: 5000, pending: 0, totalEarned: 5000, referralEarned: 0 }
      : { available: 0, pending: 0, totalEarned: 0, referralEarned: 0 },
    country: country || "France",
    currency: currency || "EUR",
    referralCode,
    referredBy: defaultReferredBy,
    is2faEnabled: false,
    isSuspended: false,
    createdAt: new Date().toISOString()
  };

  ensureAdminMerchantNumber(newUser);

  appState.users.push(newUser);
  appState.settings.totalUsersCount += 1;

  // Process Referral commission
  if (defaultReferredBy) {
    const inviter = appState.users.find(u => u.referralCode === defaultReferredBy || u.id === defaultReferredBy);
    if (inviter) {
      // 1. Verify that the inviter has a merchant number active. "Without a merchant number, they cannot earn money"
      if (!inviter.merchantNumber) {
        newUser.referredBy = undefined;
      } else {
        // 2. Verify that the inviter has not reached their sponsorship limit
        const currentReferrals = appState.users.filter(u => u.referredBy === inviter.id).length;
        const limit = getUserMaxReferrals(inviter);

        if (currentReferrals >= limit) {
          newUser.referredBy = undefined;
        } else {
          newUser.referredBy = inviter.id;
          // Small invitation bonus
          inviter.wallet.available += 1.0; 
          inviter.wallet.totalEarned += 1.0;
          inviter.wallet.referralEarned += 1.0;
          
          const newTx: WalletTransaction = {
            id: "tx_" + Date.now() + "_ref",
            userId: inviter.id,
            type: "referral_bonus",
            amount: 1.0,
            currency: inviter.currency,
            status: "completed",
            method: "Yaamaa Referral",
            details: `Bonus d'inscription pour avoir parrainé ${username}`,
            createdAt: new Date().toISOString()
          };
          appState.transactions.unshift(newTx);
        }
      }
    }
  }

  saveState(appState);
  createAuditLog(newUser.id, newUser.username, newUser.role, "Inscription", `Compte créé pour ${newUser.name} (${newUser.role})`, req);
  res.json(newUser);
});

// Yaamaa Chat API endpoints
app.post("/api/yaamaa-chat/verify-merchant", (req, res) => {
  const { merchantNumber } = req.body;
  if (!merchantNumber) {
    return res.status(400).json({ error: "Numéro marchand requis." });
  }

  const cleanNum = merchantNumber.trim().toUpperCase();
  const user = appState.users.find(u => u.merchantNumber && u.merchantNumber.toUpperCase() === cleanNum);

  if (!user) {
    return res.status(404).json({ error: "Ce numéro marchand n'existe pas dans la base de données Yaamaa." });
  }

  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.chatCode = generatedCode;
  user.chatCodeCreatedAt = Date.now();
  
  if (!user.notifications) {
    user.notifications = [];
  }

  user.notifications.unshift({
    id: "notif_chat_" + Date.now(),
    title: "Tentative de connexion Yaamaa Chat 🔐",
    desc: `Une demande de connexion a été initiée depuis Yaamaa Chat pour votre numéro marchand (${user.merchantNumber}). Code de sécurité: ${generatedCode}. Valide 5 minutes.`,
    time: "À l'instant",
    read: false,
    priority: "critical",
    category: "security",
    linkView: "chat"
  });

  saveState(appState);
  res.json({ success: true, user, code: generatedCode });
});

app.post("/api/yaamaa-chat/login-with-code", (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: "Identifiant et code requis." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  if (!user.chatCode || user.chatCode !== code.trim()) {
    return res.status(401).json({ error: "Code incorrect" });
  }

  const elapsedMs = Date.now() - (user.chatCodeCreatedAt || 0);
  if (elapsedMs > 5 * 60 * 1000) {
    return res.status(401).json({ error: "Code expiré (délai de 5 minutes dépassé)" });
  }

  user.chatCode = undefined;
  user.chatCodeCreatedAt = undefined;
  saveState(appState);

  createAuditLog(user.id, user.username, user.role, "Connexion Yaamaa Chat réussie", `Connexion réussie via Yaamaa Chat pour ${user.username}`, req);
  res.json({ success: true, user });
});

// Forgot Password API endpoints
app.post("/api/users/forgot-password/request", (req, res) => {
  const { identifier, method } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: "Numéro marchand ou adresse email requis." });
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = appState.users.find(u => 
    u.email.toLowerCase() === cleanId || 
    (u.merchantNumber && u.merchantNumber.toLowerCase() === cleanId)
  );

  if (!user) {
    return res.status(404).json({ error: "Aucun compte ne correspond à cet identifiant." });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeCreatedAt = Date.now();

  if (!user.notifications) user.notifications = [];
  user.notifications.unshift({
    id: "notif_reset_" + Date.now(),
    title: "Récupération de mot de passe Yaamaa 🔑",
    desc: `Votre code de réinitialisation est : ${resetCode}. Valide pendant 5 minutes.`,
    time: "À l'instant",
    read: false,
    priority: "critical",
    category: "security"
  });

  saveState(appState);
  res.json({ success: true, message: "Code de réinitialisation envoyé avec succès.", method: method || "merchant_number" });
});

app.post("/api/users/forgot-password/verify-and-reset", (req, res) => {
  const { identifier, code, newPassword, confirmNewPassword } = req.body;
  if (!identifier || !code || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = appState.users.find(u => 
    u.email.toLowerCase() === cleanId || 
    (u.merchantNumber && u.merchantNumber.toLowerCase() === cleanId)
  );

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  if (!user.resetCode || user.resetCode !== code.trim()) {
    return res.status(400).json({ error: "Code de réinitialisation incorrect." });
  }

  const elapsed = Date.now() - (user.resetCodeCreatedAt || 0);
  if (elapsed > 5 * 60 * 1000) {
    return res.status(400).json({ error: "Code de réinitialisation expiré (délai de 5 minutes dépassé)." });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  user.resetCode = undefined;
  user.resetCodeCreatedAt = undefined;
  saveState(appState);

  createAuditLog(user.id, user.username, user.role, "Mot de passe réinitialisé", `Réinitialisation réussie du mot de passe pour ${user.username}`, req);
  res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
});

app.get("/api/yaamaa-chat/check-status", (req, res) => {
  const { userId } = req.query;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
  res.json({ 
    approved: user.yaamaaChatApproved ?? false, 
    rejected: user.yaamaaChatRejected ?? false,
    approvedAt: user.yaamaaChatApprovedAt || null 
  });
});

app.post("/api/yaamaa-chat/respond-approval", (req, res) => {
  const { userId, approved } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  user.yaamaaChatApproved = Boolean(approved);
  user.yaamaaChatRejected = !Boolean(approved);
  user.yaamaaChatApprovedAt = new Date().toISOString();

  if (approved) {
    if (!user.notifications) user.notifications = [];
    user.notifications.unshift({
      id: "notif_code_" + Date.now(),
      title: "Code de Connexion Yaamaa Chat 🔑",
      desc: `Vous avez autorisé la connexion. Votre code d'accès sécurisé pour Yaamaa Chat est : 849201.`,
      time: "À l'instant",
      read: false,
      priority: "critical",
      category: "security"
    });
  }

  saveState(appState);
  res.json({ success: true, approved });
});

// Achat de numéro marchand unique et commissions de parrainage associées
app.post("/api/users/purchase-merchant-number", (req, res) => {
  const { userId, paymentMethod, paymentPhone, paymentName, packType } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Identifiant de l'utilisateur requis." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  if (user.merchantNumber) {
    return res.status(400).json({ error: `Vous possédez déjà un numéro marchand unique : ${user.merchantNumber}` });
  }

  const selectedPack = packType || "premium";

  if (!appState.subscriptionPlans) {
    appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
  }
  const matchingPlan = appState.subscriptionPlans.find(p => p.id === selectedPack || p.tier === selectedPack);
  let purchasePrice = 5000;
  let planTier: BadgeTier = "blue";
  let planId = "";
  let planName = "Niveau de Base (Basic)";

  if (matchingPlan) {
    purchasePrice = matchingPlan.initialPrice;
    planTier = matchingPlan.tier;
    planId = matchingPlan.id;
    planName = matchingPlan.name;
  } else {
    if (selectedPack === "gold") {
      purchasePrice = appState.settings.merchantGoldPrice || 15000;
      planTier = "gold";
      planName = "Niveau Motivation (Gold)";
    } else if (selectedPack === "diamond") {
      purchasePrice = appState.settings.merchantDiamondPrice || 35000;
      planTier = "diamond";
      planName = "Niveau Diamant (Diamond)";
    } else {
      purchasePrice = appState.settings.merchantPremiumPrice || 5000;
      planTier = "blue";
      planName = "Niveau de Base (Basic)";
    }
    const foundByTier = appState.subscriptionPlans.find(p => p.tier === planTier);
    if (foundByTier) {
      planId = foundByTier.id;
      planName = foundByTier.name;
    }
  }

  const regDate = user.createdAt ? new Date(user.createdAt) : new Date();
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - regDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const within30Days = diffDays <= 30;

  // Find country code abbreviation (e.g., Bénin -> BJ, Togo -> TG)
  const countryData = ALL_COUNTRIES.find(
    c => c.name.trim().toLowerCase() === (user.country || "").trim().toLowerCase()
  );
  const countryCode = countryData ? countryData.code.toUpperCase() : "BJ";

  // Génération d'un numéro marchand unique et séquentiel au format YA + 10 chiffres + Code Pays (ex: YA0000000001BJ)
  if (!appState.nextMerchantSequence) {
    appState.nextMerchantSequence = 1;
    appState.users.forEach(u => {
      if (u.merchantNumber && u.merchantNumber.startsWith("YA")) {
        const numPart = u.merchantNumber.substring(2, 12);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed >= appState.nextMerchantSequence!) {
          appState.nextMerchantSequence = parsed + 1;
        }
      }
    });
  }

  let generatedNumber = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 1000) {
    const seq = appState.nextMerchantSequence++;
    const digits = String(seq).padStart(10, '0');
    const candidate = `YA${digits}${countryCode}`;
    const duplicate = appState.users.some(u => u.merchantNumber === candidate);
    if (!duplicate) {
      generatedNumber = candidate;
      isUnique = true;
    }
    attempts++;
  }

  if (!generatedNumber) {
    const fallbackSeq = appState.nextMerchantSequence++;
    const fallbackDigits = String(fallbackSeq).padStart(10, '0');
    generatedNumber = `YA${fallbackDigits}${countryCode}`;
  }

  user.merchantNumber = generatedNumber;
  user.merchantNumberPurchasedAt = currentDate.toISOString();
  user.merchantPackType = (planTier === "diamond" ? "diamond" : planTier === "gold" ? "gold" : "premium");
  // L'éligibilité de cet utilisateur à gagner des commissions à l'avenir dépend de s'il a acheté dans les 30 jours requis
  user.merchantNumberEligible = within30Days;

  // Create active user subscription entry
  if (!appState.userSubscriptions) appState.userSubscriptions = [];
  const durationDays = matchingPlan ? (matchingPlan.durationUnit === "years" ? matchingPlan.durationValue * 365 : matchingPlan.durationUnit === "months" ? matchingPlan.durationValue * 30 : matchingPlan.durationUnit === "weeks" ? matchingPlan.durationValue * 7 : matchingPlan.durationValue) : 30;
  const expDate = new Date(currentDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const newSub: UserSubscription = {
    id: "sub_" + Date.now(),
    userId: user.id,
    planId: planId || (matchingPlan ? matchingPlan.id : "plan_basic"),
    planName: planName,
    tier: planTier,
    merchantNumber: generatedNumber,
    startDate: currentDate.toISOString(),
    expirationDate: expDate.toISOString(),
    status: "active",
    isAutoRenew: true,
    createdAt: currentDate.toISOString()
  };
  appState.userSubscriptions.push(newSub);

  const newTx: WalletTransaction = {
    id: "tx_" + Date.now() + "_merchant",
    userId: user.id,
    type: "deposit",
    amount: purchasePrice,
    currency: user.currency || "XOF",
    status: "completed",
    method: paymentMethod || "Mobile Money",
    details: `Achat du numéro marchand unique (${selectedPack.toUpperCase()}) : ${generatedNumber}`,
    createdAt: currentDate.toISOString()
  };
  appState.transactions.unshift(newTx);

  let commissionPaid = false;
  let commissionAmount = 0;
  let referrerUsername = "";

  if (user.referredBy) {
    const inviter = appState.users.find(u => u.id === user.referredBy || u.referralCode === user.referredBy);
    if (inviter) {
      referrerUsername = inviter.username;
      
      let referrerEligible = false;
      if (inviter.merchantNumber && inviter.merchantNumberPurchasedAt && inviter.createdAt) {
        const invRegDate = new Date(inviter.createdAt);
        const invPurDate = new Date(inviter.merchantNumberPurchasedAt);
        const invDiffTime = Math.abs(invPurDate.getTime() - invRegDate.getTime());
        const invDiffDays = Math.ceil(invDiffTime / (1000 * 60 * 60 * 24));
        if (invDiffDays <= 30) {
          // Check that the limit of parrainages is not exceeded for their current merchant tier
          const currentReferrals = appState.users.filter(u => u.referredBy === inviter.id).length;
          const limit = getUserMaxReferrals(inviter);
          if (currentReferrals <= limit) {
            referrerEligible = true;
          }
        }
      }

      if (referrerEligible) {
        commissionAmount = matchingPlan && matchingPlan.referralCommission !== undefined ? parseFloat(String(matchingPlan.referralCommission)) : parseFloat((purchasePrice * 0.50).toFixed(2));
        inviter.wallet.available = parseFloat((inviter.wallet.available + commissionAmount).toFixed(2));
        inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + commissionAmount).toFixed(2));
        inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + commissionAmount).toFixed(2));

        const refTx: WalletTransaction = {
          id: "tx_" + Date.now() + "_ref_comm",
          userId: inviter.id,
          type: "referral_bonus",
          amount: commissionAmount,
          currency: inviter.currency || "XOF",
          status: "completed",
          method: "Yaamaa Referral",
          details: `Commission de parrainage (Achat numéro marchand par @${user.username})`,
          createdAt: currentDate.toISOString()
        };
        appState.transactions.unshift(refTx);

        const refNotif: SubscriptionNotification = {
          id: "notif_comm_" + Date.now(),
          userId: inviter.id,
          title: "Gain de Parrainage 🎁",
          message: `Vous venez de gagner ${commissionAmount} ${inviter.currency || 'XOF'} suite à l'abonnement de ${user.name || user.username} (@${user.username}).`,
          type: "renewal",
          createdAt: currentDate.toISOString(),
          isRead: false
        };
        if (!appState.subscriptionNotifications) appState.subscriptionNotifications = [];
        appState.subscriptionNotifications.unshift(refNotif);

        commissionPaid = true;

        createAuditLog(
          inviter.id,
          inviter.username,
          inviter.role,
          "Commission Parrainage",
          `Commission de parrainage de ${commissionAmount} ${inviter.currency} reçue suite à l'achat du numéro marchand par @${user.username}`,
          req
        );
      } else {
        createAuditLog(
          inviter.id,
          inviter.username,
          inviter.role,
          "Commission Perdue",
          `Commission perdue pour l'achat de @${user.username} car le parrain n'a pas activé son propre numéro marchand dans les 30 jours requis.`,
          req
        );
      }
    }
  }

  saveState(appState);
  createAuditLog(
    user.id,
    user.username,
    user.role,
    "Achat Numéro Marchand",
    `Numéro marchand ${generatedNumber} acheté avec succès par @${user.username}`,
    req
  );

  res.json({
    success: true,
    user,
    merchantNumber: generatedNumber,
    within30Days,
    commissionPaid,
    commissionAmount,
    referrerUsername
  });
});

// Update Profile Custom Props
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { 
    is2faEnabled, isSuspended, wallet, level, xp, country, currency, role,
    username, name, email, avatar, phone, address, password, language, privacySettings
  } = req.body;
  
  const user = appState.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  // Validate unique username if it has changed
  if (username !== undefined && username !== user.username) {
    const cleanUsername = username.trim().toLowerCase();
    const isTaken = appState.users.some(u => u.username.toLowerCase() === cleanUsername && u.id !== id);
    if (isTaken) {
      return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }
    user.username = username.trim();
  }

  if (country !== undefined) user.country = country;
  if (currency !== undefined) user.currency = currency;
  if (is2faEnabled !== undefined) user.is2faEnabled = is2faEnabled;
  if (level !== undefined) user.level = level;
  if (xp !== undefined) user.xp = xp;
  if (role !== undefined) user.role = role;
  if (language !== undefined) user.language = language;
  if (privacySettings !== undefined) user.privacySettings = privacySettings;
  
  // New profile fields
  if (name !== undefined) user.name = name.trim();
  if (email !== undefined) user.email = email.trim();
  if (avatar !== undefined) user.avatar = avatar.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (password !== undefined && password.trim() !== "") user.password = bcrypt.hashSync(password.trim(), 10);

  if (isSuspended !== undefined) {
    user.isSuspended = isSuspended;
    createAuditLog("system", "SYS", "admin", isSuspended ? "Compte Suspendu" : "Compte Activé", `Statut d'exclusion mis à jour pour @${user.username}`, req);
  }
  
  if (wallet !== undefined) {
    user.wallet = { ...user.wallet, ...wallet };
  }

  saveState(appState);
  res.json(user);
});

// 3. CAMPAIGNS ENDPOINTS & CALCULATION WIZARD
app.get("/api/campaigns", (req, res) => {
  res.json(appState.campaigns);
});

app.post("/api/campaigns", (req, res) => {
  const { 
    title, description, category, type, destLink, image, video,
    budgetTotal, rewardPerUser, targeting, schedule, advertiserId
  } = req.body;

  if (!title || !description || !budgetTotal || !rewardPerUser || !advertiserId) {
    return res.status(400).json({ error: "Informations de campagne manquantes." });
  }

  const advertiser = appState.users.find(u => u.id === advertiserId);
  if (!advertiser) {
    return res.status(404).json({ error: "Annonceur introuvable." });
  }

  const commission = parseFloat((budgetTotal * (appState.settings.platformFeePercentage / 100)).toFixed(2));
  const totalToPay = budgetTotal + commission;
  const maxParticipants = Math.floor(budgetTotal / rewardPerUser);

  // Check advertiser balance
  if (advertiser.wallet.available < totalToPay) {
    return res.status(400).json({ 
      error: `Solde insuffisant. Tarif total: ${totalToPay} ${advertiser.currency}, Solde disponible: ${advertiser.wallet.available} ${advertiser.currency}. Veuillez recharger.` 
    });
  }

  // Deduct advertiser balance
  advertiser.wallet.available = parseFloat((advertiser.wallet.available - totalToPay).toFixed(2));
  
  // Create New Campaign
  const newCamp: Campaign = {
    id: "camp_" + Date.now(),
    title,
    description,
    category,
    image: image || "",
    video: video || "",
    destLink,
    type,
    budgetTotal,
    rewardPerUser,
    participantsCount: maxParticipants,
    commission,
    totalToPay,
    targeting: {
      countries: targeting?.countries || [],
      languages: targeting?.languages || [],
      gender: targeting?.gender || "all",
      ageMin: targeting?.ageMin || 13,
      ageMax: targeting?.ageMax || 99,
      interests: targeting?.interests || [],
      devices: targeting?.devices || [],
      minUserLevel: targeting?.minUserLevel || 1
    },
    schedule: {
      immediate: schedule?.immediate !== false,
      startDate: schedule?.startDate,
      endDate: schedule?.endDate
    },
    status: "pending", // Admins or auto-AI validation will shift it to active
    advertiserId,
    advertiserName: advertiser.name,
    createdAt: new Date().toISOString(),
    completedCount: 0,
    proofRequirements: req.body.proofRequirements || "Preuve écrite de votre pseudonyme et confirmation de réalisation"
  };

  appState.campaigns.unshift(newCamp);

  // Add fund transaction record
  const newTx: WalletTransaction = {
    id: "tx_" + Date.now() + "_camp",
    userId: advertiserId,
    type: "funded_campaign",
    amount: totalToPay,
    currency: advertiser.currency,
    status: "completed",
    method: "Yaamaa Wallet",
    details: `Financement de la campagne "${title}" (+frais ${commission})`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(newTx);

  createAuditLog(advertiserId, advertiser.username, "advertiser", "Création Campagne", `Campagne "${title}" créée et financée. En attente de validation administrative.`, req);
  res.json({ campaign: newCamp, remainingBalance: advertiser.wallet.available });
});

// Admin approves or overrides campaign status 
app.put("/api/campaigns/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, operatorId } = req.body;

  const camp = appState.campaigns.find(c => c.id === id);
  if (!camp) return res.status(404).json({ error: "Campagne introuvable" });

  const operator = appState.users.find(u => u.id === operatorId);
  const opName = operator ? operator.username : "Admin";

  camp.status = status;
  saveState(appState);

  createAuditLog(operatorId || "system", opName, "admin", "Statut Campagne", `Campagne "${camp.title}" modifiée: ${status}`, req);
  res.json(camp);
});

// 4. TASK PROOFS & SUBMISSIONS
app.get("/api/submissions", (req, res) => {
  res.json(appState.submissions);
});

app.post("/api/submissions", async (req, res) => {
  const { campaignId, participantId, proofText, proofLink, proofFileUrl } = req.body;

  if (!campaignId || !participantId) {
    return res.status(400).json({ error: "Données de soumission de preuve incomplètes." });
  }

  const user = appState.users.find(u => u.id === participantId);
  if (!user) return res.status(404).json({ error: "Participant introuvable." });

  if (user.isSuspended) {
    return res.status(403).json({ error: "Votre compte est temporairement suspendu. Vous ne pouvez pas soumettre de missions." });
  }

  const camp = appState.campaigns.find(c => c.id === campaignId);
  if (!camp) return res.status(404).json({ error: "Campagne introuvable." });

  // Check if participant already submitted proof
  const existingSubIndex = appState.submissions.findIndex(s => s.campaignId === campaignId && s.participantId === participantId);
  let isUpdatingDisputed = false;
  if (existingSubIndex !== -1) {
    const existingSub = appState.submissions[existingSubIndex];
    if (existingSub.status === "disputed") {
      isUpdatingDisputed = true;
    } else {
      return res.status(400).json({ error: "Vous avez déjà soumis une preuve pour cette mission." });
    }
  }

  // Pre-calculate fraud risk simulation
  // Perform real-time AI Analysis if Gemini is set up, otherwise fallback to smart regex
  let autoCheckedByAI = false;
  let fraudProbability = 8; // generic low probability
  let aiReport = "Analyse heuristique automatique : Preuve textuelle conforme aux critères requis.";

  if (ai) {
    try {
      const prompt = `Vous êtes Yaamaa AI, l'IA de filtrage anti-fraude d'une plateforme de micro-travaux.
Analysez cette soumission de preuve pour la campagne suivante:
Titre de la campagne: "${camp.title}"
Énoncé / Consignes: "${camp.description}"
Preuve exigée: "${camp.proofRequirements}"

Données soumises par le participant (@${user.username}):
Texte de preuve: "${proofText || 'Aucun'}"
Lien fourni: "${proofLink || 'Aucun'}"

Évaluez les probabilités de fraude sur une échelle de 0 à 100. Un score > 50 indique une fraude manifeste (ex: texte générique répété, lien frauduleux, non-respect évident, contenu inapproprié).
Retournez STRICTEMENT un objet au format JSON doté des clés:
- "probability": nombre (de 0 à 100)
- "decision": chaîne ("approved" | "pending" | "rejected")
- "feedback": chaîne de 1-2 phrases résumant l'audit en français et la décision.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (aiResponse && aiResponse.text) {
        const result = JSON.parse(aiResponse.text.trim());
        fraudProbability = Number(result.probability) || 10;
        aiReport = result.feedback || "Audité par Yaamaa AI.";
        autoCheckedByAI = true;
      }
    } catch (e) {
      console.error("Yaamaa AI audit exception:", e);
    }
  } else {
    // If no AI key, simulate standard pattern scans
    const isGenericText = proofText && (proofText.length < 5 || proofText.toLowerCase().includes("ok") && proofText.trim().length <= 3);
    if (isGenericText) {
      fraudProbability = 75;
      aiReport = "Alerte heuristique : Preuve trop brève ou sans contenu significatif pour attester de la réalisation.";
    }
  }

  const status = (fraudProbability < 30) ? "approved" : "pending";

  if (isUpdatingDisputed) {
    const sub = appState.submissions[existingSubIndex];
    sub.proofText = proofText;
    sub.proofLink = proofLink;
    sub.proofFileUrl = proofFileUrl;
    sub.status = status;
    sub.autoCheckedByAI = autoCheckedByAI;
    sub.fraudProbability = fraudProbability;
    sub.aiReport = aiReport;
    sub.createdAt = new Date().toISOString();

    if (status === "approved") {
      // Transfer from pending to available
      user.wallet.pending = Math.max(0, parseFloat((user.wallet.pending - sub.campaignReward).toFixed(2)));
      user.wallet.available = parseFloat((user.wallet.available + sub.campaignReward).toFixed(2));
      user.wallet.totalEarned = parseFloat((user.wallet.totalEarned + sub.campaignReward).toFixed(2));
      
      user.xp += 15;
      user.level = Math.floor(user.xp / 100) + 1;

      camp.completedCount += 1;
      if (camp.completedCount >= camp.participantsCount) {
        camp.status = "completed";
      }

      const newTx: WalletTransaction = {
        id: "tx_" + Date.now() + "_earn",
        userId: participantId,
        type: "earn",
        amount: camp.rewardPerUser,
        currency: user.currency,
        status: "completed",
        method: "Yaamaa Balance",
        details: `Gains pour la mission "${camp.title}" (Correction approuvée automatiquement)`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(newTx);
      appState.settings.payoutsDistributed += camp.rewardPerUser;

      // Referral Commission on Mission Completion (10%)
      if (user.referredBy) {
        const inviter = appState.users.find(u => u.id === user.referredBy || u.referralCode === user.referredBy);
        if (inviter && inviter.merchantNumber) {
          const refComm = parseFloat((camp.rewardPerUser * 0.10).toFixed(4)) || 0.01;
          inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
          inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
          inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + refComm).toFixed(2));

          const refTx: WalletTransaction = {
            id: "tx_" + Date.now() + "_ref_comm",
            userId: inviter.id,
            type: "referral_bonus",
            amount: refComm,
            currency: inviter.currency,
            status: "completed",
            method: "Yaamaa Referral",
            details: `Commission Parrainage (10%) - Mission de @${user.username} : "${camp.title}"`,
            createdAt: new Date().toISOString()
          };
          appState.transactions.unshift(refTx);
        }
      }
    } else {
      // Remains in pending, and was already counted in pending previously, so no duplicate addition
    }

    saveState(appState);
    createAuditLog(participantId, user.username, "participant", "Correction Preuve", `Correction soumise pour "${camp.title}" (Aura-AI: ${status})`, req);
    return res.json({ submission: sub, user });
  }

  const newSubmission: TaskSubmission = {
    id: "sub_" + Date.now(),
    campaignId,
    campaignTitle: camp.title,
    campaignReward: camp.rewardPerUser,
    campaignCurrency: user.currency,
    participantId,
    participantUsername: user.username,
    proofText,
    proofLink,
    proofFileUrl,
    status,
    autoCheckedByAI,
    fraudProbability,
    aiReport,
    createdAt: new Date().toISOString()
  };

  appState.submissions.unshift(newSubmission);

  if (status === "approved") {
    // Credit Participant balances
    user.wallet.available = parseFloat((user.wallet.available + camp.rewardPerUser).toFixed(2));
    user.wallet.totalEarned = parseFloat((user.wallet.totalEarned + camp.rewardPerUser).toFixed(2));
    
    // Level Up / XP management (10 XP per task approved)
    user.xp += 15;
    const oldLevel = user.level;
    user.level = Math.floor(user.xp / 100) + 1;
    if (user.level > oldLevel) {
      // Small level up reward!
      user.wallet.available = parseFloat((user.wallet.available + (user.level * 0.5)).toFixed(2));
    }

    camp.completedCount += 1;
    if (camp.completedCount >= camp.participantsCount) {
      camp.status = "completed";
    }

    // Add Earn Transaction Record
    const newTx: WalletTransaction = {
      id: "tx_" + Date.now() + "_earn",
      userId: participantId,
      type: "earn",
      amount: camp.rewardPerUser,
      currency: user.currency,
      status: "completed",
      method: "Yaamaa Balance",
      details: `Gains pour la mission "${camp.title}" (Approuvée automatiquement)`,
      createdAt: new Date().toISOString()
    };
    appState.transactions.unshift(newTx);
    appState.settings.payoutsDistributed += camp.rewardPerUser;

    // Referral Commission on Mission Completion (10%)
    if (user.referredBy) {
      const inviter = appState.users.find(u => u.id === user.referredBy || u.referralCode === user.referredBy);
      if (inviter && inviter.merchantNumber) {
        const refComm = parseFloat((camp.rewardPerUser * 0.10).toFixed(4)) || 0.01;
        inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
        inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
        inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + refComm).toFixed(2));

        const refTx: WalletTransaction = {
          id: "tx_" + Date.now() + "_ref_comm",
          userId: inviter.id,
          type: "referral_bonus",
          amount: refComm,
          currency: inviter.currency,
          status: "completed",
          method: "Yaamaa Referral",
          details: `Commission Parrainage (10%) - Mission de @${user.username} : "${camp.title}"`,
          createdAt: new Date().toISOString()
        };
        appState.transactions.unshift(refTx);
      }
    }
  } else {
    // Add pending balance reflection to user
    user.wallet.pending = parseFloat((user.wallet.pending + camp.rewardPerUser).toFixed(2));
  }

  saveState(appState);
  createAuditLog(participantId, user.username, "participant", "Soumission Preuve", `Preuve soumise pour "${camp.title}" (Aura-AI: ${status})`, req);
  
  res.json({ submission: newSubmission, user });
});

// Admin reviews submissions manually (Approval/Rejection/Disputes)
app.post("/api/admin/submissions/review", (req, res) => {
  const { submissionId, status, feedback, operatorId } = req.body;

  if (!submissionId || !status) {
    return res.status(400).json({ error: "Données de révision incomplètes." });
  }

  const sub = appState.submissions.find(s => s.id === submissionId);
  if (!sub) return res.status(404).json({ error: "Soumission introuvable." });

  if (sub.status !== "pending" && sub.status !== "disputed") {
    return res.status(400).json({ error: "Cette preuve a déjà été traitée." });
  }

  const camp = appState.campaigns.find(c => c.id === sub.campaignId);
  const participant = appState.users.find(u => u.id === sub.participantId);
  const operator = appState.users.find(u => u.id === operatorId);
  const opName = operator ? operator.username : "Admin";

  const previousStatus = sub.status;
  sub.status = status;
  sub.adminFeedback = feedback || `Vérifié et validé par l'équipe administrative de Yaamaa.`;

  if (status === "approved" && participant) {
    // Transfer from pending to available
    participant.wallet.pending = Math.max(0, parseFloat((participant.wallet.pending - sub.campaignReward).toFixed(2)));
    participant.wallet.available = parseFloat((participant.wallet.available + sub.campaignReward).toFixed(2));
    participant.wallet.totalEarned = parseFloat((participant.wallet.totalEarned + sub.campaignReward).toFixed(2));
    
    participant.xp += 15;
    const oldLevel = participant.level;
    participant.level = Math.floor(participant.xp / 100) + 1;

    if (camp) {
      camp.completedCount += 1;
      if (camp.completedCount >= camp.participantsCount) {
        camp.status = "completed";
      }
    }

    const newTx: WalletTransaction = {
      id: "tx_" + Date.now() + "_verify",
      userId: participant.id,
      type: "earn",
      amount: sub.campaignReward,
      currency: participant.currency,
      status: "completed",
      method: "Verification",
      details: `Gains validés manuellement pour "${sub.campaignTitle}"`,
      createdAt: new Date().toISOString()
    };
    appState.transactions.unshift(newTx);
    appState.settings.payoutsDistributed += sub.campaignReward;

    // Referral Commission on Mission Completion (10%)
    if (participant.referredBy) {
      const inviter = appState.users.find(u => u.id === participant.referredBy || u.referralCode === participant.referredBy);
      if (inviter && inviter.merchantNumber) {
        const refComm = parseFloat((sub.campaignReward * 0.10).toFixed(4)) || 0.01;
        inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
        inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
        inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + refComm).toFixed(2));

        const refTx: WalletTransaction = {
          id: "tx_" + Date.now() + "_ref_comm",
          userId: inviter.id,
          type: "referral_bonus",
          amount: refComm,
          currency: inviter.currency,
          status: "completed",
          method: "Yaamaa Referral",
          details: `Commission Parrainage (10%) - Mission de @${participant.username} : "${sub.campaignTitle}"`,
          createdAt: new Date().toISOString()
        };
        appState.transactions.unshift(refTx);
      }
    }
  } else if (status === "rejected" && participant) {
    // Deduct pending
    participant.wallet.pending = Math.max(0, parseFloat((participant.wallet.pending - sub.campaignReward).toFixed(2)));
  }

  saveState(appState);
  createAuditLog(operatorId || "system", opName, "admin", "Révision Preuve", `Preuve ID ${submissionId} modifiée: ${previousStatus} -> ${status}`, req);
  res.json({ submission: sub, participant });
});

// ==========================================
// 🛡️ TRANSACTION PIN SECURITY SYSTEM
// ==========================================

function logPinAudit(user: any, operation: string, result: "success" | "failure", details?: string, req?: any) {
  if (!user.pinAuditLogs) user.pinAuditLogs = [];
  const entry = {
    id: "pin_audit_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    operation,
    result,
    details,
    ip: req?.ip || req?.headers?.["x-forwarded-for"] || "127.0.0.1",
    device: req?.headers?.["user-agent"] || "Yaamaa App"
  };
  user.pinAuditLogs.unshift(entry);
  if (user.pinAuditLogs.length > 50) user.pinAuditLogs.pop();

  if (!user.notifications) user.notifications = [];
  user.notifications.unshift({
    id: "notif_pin_" + Date.now(),
    title: result === "success" ? "🔐 Sécurité PIN : " + operation : "⚠️ Alerte Sécurité PIN",
    desc: `Opération: ${operation} - Résultat: ${result === "success" ? "Réussi" : "Échoué"}. ${details || ""}`,
    time: "À l'instant",
    timestamp: new Date().toISOString(),
    priority: result === "success" ? "standard" : "critical",
    category: "security"
  });
}

// 1. Create PIN
app.post("/api/wallet/pin/create", async (req, res) => {
  const { userId, pin, confirmPin } = req.body;
  if (!userId || !pin || !confirmPin) {
    return res.status(400).json({ error: "Paramètres PIN manquants." });
  }
  if (pin !== confirmPin) {
    return res.status(400).json({ error: "Les deux codes PIN ne correspondent pas." });
  }
  const minLen = appState.settings.pinMinLength || 4;
  const maxLen = appState.settings.pinMaxLength || 8;
  if (pin.length < minLen || pin.length > maxLen || !/^\d+$/.test(pin)) {
    return res.status(400).json({ error: `Le Code PIN doit contenir entre ${minLen} et ${maxLen} chiffres uniquement.` });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  try {
    user.transactionPinHash = await bcrypt.hash(pin, 10);
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    saveState(appState);

    logPinAudit(user, "Création du Code PIN", "success", "Code PIN configuré avec succès", req);
    createAuditLog(userId, user.username, user.role, "Sécurité PIN", "Création du Code PIN de transaction", req);
    res.json({ success: true, message: "Code PIN créé avec succès." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur serveur lors de la création du PIN." });
  }
});

// 2. Verify PIN
app.post("/api/wallet/pin/verify", async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId || !pin) {
    return res.status(400).json({ error: "ID utilisateur ou code PIN manquant." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (!user.transactionPinHash) {
    return res.status(400).json({ error: "Aucun Code PIN configuré pour ce compte. Veuillez d'abord le créer.", requirePinSetup: true });
  }

  if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
    const remainingMins = Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / 60000);
    return res.status(403).json({ error: `Portefeuille temporairement bloqué en raison de plusieurs tentatives erronées. Veuillez patienter ${remainingMins} minute(s) ou utiliser la récupération.` });
  }

  try {
    const isMatch = await bcrypt.compare(pin, user.transactionPinHash);
    if (!isMatch) {
      if (user.pinFailedAttempts === undefined) user.pinFailedAttempts = 0;
      user.pinFailedAttempts += 1;
      const maxAttempts = appState.settings.maxPinAttempts || 3;
      const attemptsLeft = maxAttempts - user.pinFailedAttempts;

      if (user.pinFailedAttempts >= maxAttempts) {
        const blockDuration = appState.settings.pinBlockDurationMinutes || 30;
        user.pinLockedUntil = new Date(Date.now() + blockDuration * 60000).toISOString();
        saveState(appState);
        logPinAudit(user, "Blocage Temporaire Portefeuille", "failure", `Bloqué suite à ${user.pinFailedAttempts} échecs PIN`, req);
        return res.status(403).json({ error: `Code PIN incorrect. Nombre maximal d'essais atteint. Portefeuille verrouillé pour ${blockDuration} minutes.` });
      }

      saveState(appState);
      logPinAudit(user, "Vérification PIN", "failure", `Code erroné. Restant: ${attemptsLeft}`, req);
      return res.status(400).json({ error: `Code PIN incorrect. Il vous reste ${attemptsLeft} tentative(s).`, attemptsLeft });
    }

    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    saveState(appState);
    logPinAudit(user, "Vérification PIN", "success", "Validation réussie", req);
    res.json({ success: true, message: "PIN validé avec succès." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur de vérification du PIN." });
  }
});

// 3. Change PIN
app.post("/api/wallet/pin/change", async (req, res) => {
  const { userId, oldPin, newPin, confirmNewPin } = req.body;
  if (!userId || !oldPin || !newPin || !confirmNewPin) {
    return res.status(400).json({ error: "Tous les champs PIN sont obligatoires." });
  }
  if (newPin !== confirmNewPin) {
    return res.status(400).json({ error: "Le nouveau code PIN et sa confirmation ne correspondent pas." });
  }
  const minLen = appState.settings.pinMinLength || 4;
  const maxLen = appState.settings.pinMaxLength || 8;
  if (newPin.length < minLen || newPin.length > maxLen || !/^\d+$/.test(newPin)) {
    return res.status(400).json({ error: `Le nouveau Code PIN doit contenir entre ${minLen} et ${maxLen} chiffres.` });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user || !user.transactionPinHash) {
    return res.status(404).json({ error: "Utilisateur ou PIN existant introuvable." });
  }

  try {
    const isOldMatch = await bcrypt.compare(oldPin, user.transactionPinHash);
    if (!isOldMatch) {
      logPinAudit(user, "Modification PIN", "failure", "Ancien PIN incorrect", req);
      return res.status(400).json({ error: "L'ancien code PIN est incorrect." });
    }

    user.transactionPinHash = await bcrypt.hash(newPin, 10);
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    saveState(appState);

    logPinAudit(user, "Modification PIN", "success", "Code PIN modifié avec succès", req);
    res.json({ success: true, message: "Code PIN modifié avec succès." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur lors du changement de PIN." });
  }
});

// 4. Recover PIN Request
app.post("/api/wallet/pin/recover/request", (req, res) => {
  const { identifier, method } = req.body;
  if (!identifier || !method) {
    return res.status(400).json({ error: "Identifiant et méthode de récupération requis." });
  }

  let user: any = null;
  if (method === "merchant_number") {
    user = appState.users.find(u => u.merchantNumber && u.merchantNumber.toLowerCase() === identifier.trim().toLowerCase());
  } else if (method === "email") {
    user = appState.users.find(u => u.email && u.email.toLowerCase() === identifier.trim().toLowerCase());
  }

  if (user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const validityMins = appState.settings.pinRecoveryCodeValidityMinutes || 15;
    user.pinRecoveryCode = code;
    user.pinRecoveryExpiresAt = new Date(Date.now() + validityMins * 60000).toISOString();
    saveState(appState);

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift({
      id: "notif_rec_" + Date.now(),
      title: "🔑 Code de Récupération PIN Yaamaa",
      desc: `Votre code unique de réinitialisation est: ${code} (Valide ${validityMins} minutes).`,
      time: "À l'instant",
      timestamp: new Date().toISOString(),
      priority: "urgent",
      category: "security"
    });

    logPinAudit(user, "Demande Récupération PIN", "success", `Code envoyé via ${method}`, req);
  }

  res.json({ success: true, message: "Si les informations fournies correspondent à un compte Yaamaa valide, un code de réinitialisation sécurisé a été généré et transmis." });
});

// 5. Recover PIN Verify & Reset
app.post("/api/wallet/pin/recover/verify", async (req, res) => {
  const { identifier, method, code, newPin, confirmNewPin } = req.body;
  if (!identifier || !method || !code || !newPin || !confirmNewPin) {
    return res.status(400).json({ error: "Tous les champs de réinitialisation sont obligatoires." });
  }
  if (newPin !== confirmNewPin) {
    return res.status(400).json({ error: "Le nouveau code PIN et sa confirmation ne correspondent pas." });
  }

  let user: any = null;
  if (method === "merchant_number") {
    user = appState.users.find(u => u.merchantNumber && u.merchantNumber.toLowerCase() === identifier.trim().toLowerCase());
  } else if (method === "email") {
    user = appState.users.find(u => u.email && u.email.toLowerCase() === identifier.trim().toLowerCase());
  }

  if (!user || !user.pinRecoveryCode || user.pinRecoveryCode !== code) {
    return res.status(400).json({ error: "Code de récupération invalide." });
  }

  if (user.pinRecoveryExpiresAt && new Date(user.pinRecoveryExpiresAt) < new Date()) {
    return res.status(400).json({ error: "Le code de récupération a expiré. Veuillez refaire une demande." });
  }

  const minLen = appState.settings.pinMinLength || 4;
  const maxLen = appState.settings.pinMaxLength || 8;
  if (newPin.length < minLen || newPin.length > maxLen || !/^\d+$/.test(newPin)) {
    return res.status(400).json({ error: `Le nouveau Code PIN doit contenir entre ${minLen} et ${maxLen} chiffres.` });
  }

  try {
    user.transactionPinHash = await bcrypt.hash(newPin, 10);
    user.pinRecoveryCode = undefined;
    user.pinRecoveryExpiresAt = undefined;
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    saveState(appState);

    logPinAudit(user, "Réinitialisation PIN", "success", "PIN réinitialisé avec succès via code", req);
    res.json({ success: true, message: "Votre Code PIN a été réinitialisé avec succès." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur lors de la réinitialisation du PIN." });
  }
});

// 6. Biometric Toggle
app.post("/api/wallet/pin/biometric/toggle", (req, res) => {
  const { userId, enabled } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  user.biometricEnabled = !!enabled;
  saveState(appState);
  logPinAudit(user, "Biométrie", "success", `Authentification biométrique ${enabled ? 'activée' : 'désactivée'}`, req);
  res.json({ success: true, biometricEnabled: user.biometricEnabled });
});

// Admin PIN Settings & Audit
app.get("/api/admin/pin-settings", (req, res) => {
  res.json({
    pinMinLength: appState.settings.pinMinLength || 4,
    pinMaxLength: appState.settings.pinMaxLength || 8,
    maxPinAttempts: appState.settings.maxPinAttempts || 3,
    pinBlockDurationMinutes: appState.settings.pinBlockDurationMinutes || 30,
    pinRequiredOperations: appState.settings.pinRequiredOperations || {},
    pinRecoveryCodeValidityMinutes: appState.settings.pinRecoveryCodeValidityMinutes || 15,
    pinAllowedRecoveryMethods: appState.settings.pinAllowedRecoveryMethods || ["merchant_number", "email"]
  });
});

app.post("/api/admin/pin-settings", (req, res) => {
  const { pinMinLength, pinMaxLength, maxPinAttempts, pinBlockDurationMinutes, pinRequiredOperations, pinRecoveryCodeValidityMinutes, pinAllowedRecoveryMethods, operatorId } = req.body;
  
  if (pinMinLength !== undefined) appState.settings.pinMinLength = Number(pinMinLength);
  if (pinMaxLength !== undefined) appState.settings.pinMaxLength = Number(pinMaxLength);
  if (maxPinAttempts !== undefined) appState.settings.maxPinAttempts = Number(maxPinAttempts);
  if (pinBlockDurationMinutes !== undefined) appState.settings.pinBlockDurationMinutes = Number(pinBlockDurationMinutes);
  if (pinRequiredOperations !== undefined) appState.settings.pinRequiredOperations = pinRequiredOperations;
  if (pinRecoveryCodeValidityMinutes !== undefined) appState.settings.pinRecoveryCodeValidityMinutes = Number(pinRecoveryCodeValidityMinutes);
  if (pinAllowedRecoveryMethods !== undefined) appState.settings.pinAllowedRecoveryMethods = pinAllowedRecoveryMethods;

  saveState(appState);
  createAuditLog(operatorId || "admin", "Administrateur", "admin", "Config Sécurité PIN", "Mise à jour des paramètres de sécurité PIN", req);
  res.json({ success: true, settings: appState.settings });
});

app.get("/api/admin/pin-audit-logs", (req, res) => {
  const allLogs: any[] = [];
  appState.users.forEach(u => {
    if (u.pinAuditLogs && Array.isArray(u.pinAuditLogs)) {
      u.pinAuditLogs.forEach(l => {
        allLogs.push({ ...l, userId: u.id, username: u.username, name: u.name });
      });
    }
  });
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(allLogs);
});

app.post("/api/admin/wallets/unblock-pin", (req, res) => {
  const { userId, operatorId } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  saveState(appState);

  logPinAudit(user, "Déblocage Portefeuille PIN", "success", "Débloqué par l'administration", req);
  createAuditLog(operatorId || "admin", "Administrateur", "admin", "Déblocage Portefeuille PIN", `Utilisateur ${user.username} débloqué`, req);
  res.json({ success: true, user });
});

// 5. TRANSACTIONS & WITHDRAWAL SECURITY
app.get("/api/transactions", (req, res) => {
  res.json(appState.transactions);
});

app.get("/api/admin/audit-logs", (req, res) => {
  res.json(appState.auditLogs || []);
});

app.post("/api/wallet/withdraw", (req, res) => {
  const { userId, amount, currency, method, details } = req.body;

  if (!userId || !amount || !method) {
    return res.status(400).json({ error: "Composants de retrait obligatoires manquants." });
  }

  if (appState.settings.isWithdrawalFrozen) {
    return res.status(403).json({ error: "Les retraits financiers sont temporairement gelés sur la plateforme pour maintenance périodique." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  if (!user.merchantNumber) {
    return res.status(403).json({ error: "Retrait bloqué. Vous devez obligatoirement posséder un Numéro Marchand actif pour effectuer des retraits et percevoir vos commissions." });
  }

  const activeCurrencies = appState.settings.suspendedCurrencies;
  if (activeCurrencies.includes(user.currency.toUpperCase())) {
    return res.status(403).json({ error: `La devise ${user.currency} est momentanément suspendue.` });
  }

  if (user.wallet.available < amount) {
    return res.status(400).json({ error: "Votre solde disponible est insuffisant pour finaliser ce retrait." });
  }

  // Deduct available state
  user.wallet.available = parseFloat((user.wallet.available - amount).toFixed(2));

  // Instantly approve withdrawals under 10 USD/EUR for fast UX, flag larger ones pending manual check
  const threshold = 10; 
  const isAutoApprove = amount <= threshold;

  const newTx: WalletTransaction = {
    id: "tx_" + Date.now(),
    userId,
    type: "withdraw",
    amount,
    currency,
    status: isAutoApprove ? "completed" : "pending",
    method,
    details: `${details || ''} (${isAutoApprove ? 'Auto-Approuvé' : 'En attente de contrôle manuel de conformité'})`,
    createdAt: new Date().toISOString()
  };

  appState.transactions.unshift(newTx);
  saveState(appState);

  createAuditLog(userId, user.username, user.role, "Débit Retrait", `Retrait ${amount} ${currency} via ${method} (${newTx.status})`, req);
  res.json({ transaction: newTx, user });
});

// Admin approves pending withdrawal
app.post("/api/admin/withdrawals/review", (req, res) => {
  const { transactionId, status, operatorId } = req.body;

  const tx = appState.transactions.find(t => t.id === transactionId);
  if (!tx || tx.type !== "withdraw") return res.status(404).json({ error: "Retrait introuvable." });

  if (tx.status !== "pending") {
    return res.status(400).json({ error: "Ce retrait a déjà été finalisé." });
  }

  const adminUser = appState.users.find(u => u.id === operatorId);
  const operatorUsername = adminUser ? adminUser.username : "Admin";

  tx.status = status;
  
  if (status === "failed") {
    // Reimburse participant
    const user = appState.users.find(u => u.id === tx.userId);
    if (user) {
      user.wallet.available = parseFloat((user.wallet.available + tx.amount).toFixed(2));
    }
  }

  saveState(appState);
  createAuditLog(operatorId || "system", operatorUsername, "admin", "Validation Retrait", `Retrait ID ${transactionId} mis à jour: ${status}`, req);
  res.json(tx);
});

// --- NEW ADMINISTRATOR & DEPOSIT ENDPOINTS ---

// 5.1 USER INITIATES DEPOSIT
app.post("/api/wallet/deposit", (req, res) => {
  const { userId, amount, currency, method, details, autoApprove } = req.body;

  if (!userId || !amount || !method) {
    return res.status(400).json({ error: "Composants de dépôt obligatoires manquants." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const isAuto = autoApprove === true;

  const newTx: WalletTransaction = {
    id: "tx_" + Date.now(),
    userId,
    type: "deposit",
    amount: parseFloat(amount),
    currency,
    status: isAuto ? "completed" : "pending",
    method,
    details: isAuto
      ? `${details || "Recharge de portefeuille"} (Confirmé par passerelle sécurisée et débité de votre compte)`
      : `${details || "Dépôt de compte"} (En attente de validation administrative)`,
    createdAt: new Date().toISOString()
  };

  if (isAuto) {
    user.wallet.available = parseFloat((user.wallet.available + parseFloat(amount)).toFixed(2));
  }

  appState.transactions.unshift(newTx);
  saveState(appState);

  createAuditLog(userId, user.username, user.role, isAuto ? "Validation Dépôt" : "Demande Dépôt", `Dépôt de ${amount} ${currency} via ${method} (${isAuto ? "Automatique" : "En attente"})`, req);
  res.json({ transaction: newTx, user });
});

// 5.1.1 SECURE KKIAPAY VERIFICATION (SERVER-SIDE)
app.post("/api/wallet/deposit-kkiapay", async (req, res) => {
  const { userId, transactionId, amount, currency } = req.body;

  if (!userId || !transactionId || !amount) {
    return res.status(400).json({ error: "Composants obligatoires manquants pour la validation Kkiapay." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const kkiapaySecretKey = process.env.KKIAPAY_SECRET_KEY;

  if (kkiapaySecretKey && kkiapaySecretKey.trim() !== "") {
    try {
      // Secure server-to-server request to Kkiapay to verify the transaction
      const kkiapayResponse = await fetch("https://api.kkiapay.me/api/v1/transactions/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PRIVATE-KEY": kkiapaySecretKey
        },
        body: JSON.stringify({ transactionId })
      });

      if (!kkiapayResponse.ok) {
        return res.status(400).json({ error: "La validation du paiement Kkiapay a échoué auprès de la passerelle." });
      }

      const txDetails = await kkiapayResponse.json();
      
      // Verify status is successful
      if (txDetails.status !== "SUCCESS") {
        return res.status(400).json({ error: `Paiement Kkiapay non validé. Statut actuel: ${txDetails.status}` });
      }
    } catch (error) {
      console.error("Error verifying Kkiapay payment:", error);
      return res.status(500).json({ error: "Erreur de communication avec le serveur Kkiapay." });
    }
  } else {
    console.log(`[KKIAPAY SIMULATION] Aucun KKIAPAY_SECRET_KEY configuré. Validation automatique de la transaction ${transactionId}`);
  }

  // Record successful transaction
  const newTx: WalletTransaction = {
    id: "tx_" + Date.now(),
    userId,
    type: "deposit",
    amount: parseFloat(amount),
    currency: currency || user.currency,
    status: "completed",
    method: "Kkiapay Gateway",
    details: `Dépôt sécurisé via Kkiapay (ID: ${transactionId})`,
    createdAt: new Date().toISOString()
  };

  user.wallet.available = parseFloat((user.wallet.available + parseFloat(amount)).toFixed(2));
  appState.transactions.unshift(newTx);
  saveState(appState);

  createAuditLog(userId, user.username, user.role, "Validation Dépôt", `Dépôt sécurisé Kkiapay de ${amount} ${currency || user.currency}`, req);
  res.json({ transaction: newTx, user });
});

// ==========================================
// 🤝 SOCIAL, FRIENDS, CHAT & COMMUNITIES ENDPOINTS
// ==========================================

// Get pending friend requests for a user
app.get("/api/social/friends/requests", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "userId query parameter is required." });
  }
  const requests = appState.friendRequests || [];
  const pendingRequests = requests.filter(r => r.receiverId === userId && r.status === "pending");
  res.json(pendingRequests);
});

// Get sent friend requests that are pending
app.get("/api/social/friends/sent", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "userId query parameter is required." });
  }
  const requests = appState.friendRequests || [];
  const sentRequests = requests.filter(r => r.senderId === userId && r.status === "pending");
  res.json(sentRequests);
});

// Simulate friend accepting the request
app.post("/api/social/friends/simulate-accept", (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required." });
  }
  if (!appState.friendRequests) appState.friendRequests = [];
  const request = appState.friendRequests.find(r => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: "Invitation introuvable." });
  }
  
  request.status = "accepted";
  const sender = appState.users.find(u => u.id === request.senderId);
  const receiver = appState.users.find(u => u.id === request.receiverId);
  if (sender && receiver) {
    if (!sender.friendIds) sender.friendIds = [];
    if (!receiver.friendIds) receiver.friendIds = [];
    if (!sender.friendIds.includes(request.receiverId)) {
      sender.friendIds.push(request.receiverId);
    }
    if (!receiver.friendIds.includes(request.senderId)) {
      receiver.friendIds.push(request.senderId);
    }
  }
  saveState(appState);
  res.json({ success: true, request, users: appState.users });
});

// Send a friend request
app.post("/api/social/friends/request", (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: "senderId and receiverId are required." });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ error: "Vous ne pouvez pas vous envoyer d'invitation à vous-même." });
  }

  const sender = appState.users.find(u => u.id === senderId);
  const receiver = appState.users.find(u => u.id === receiverId);

  if (!sender || !receiver) {
    return res.status(404).json({ error: "Expéditeur ou destinataire non trouvé." });
  }

  // Ensure they aren't already friends
  if (sender.friendIds?.includes(receiverId) || receiver.friendIds?.includes(senderId)) {
    return res.status(400).json({ error: "Vous êtes déjà amis." });
  }

  if (!appState.friendRequests) appState.friendRequests = [];

  // Check if a pending request already exists
  const existing = appState.friendRequests.find(
    r => (r.senderId === senderId && r.receiverId === receiverId && r.status === "pending")
  );

  if (existing) {
    return res.status(400).json({ error: "Une invitation est déjà en cours." });
  }

  const newRequest: FriendRequest = {
    id: "req_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    senderId,
    senderUsername: sender.username,
    senderAvatar: sender.avatar,
    receiverId,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  appState.friendRequests.push(newRequest);
  saveState(appState);

  res.json(newRequest);
});

// Ensure instant friendship for quick discussion chat
app.post("/api/social/friends/ensure", (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) {
    return res.status(400).json({ error: "userId and friendId are required." });
  }
  const user = appState.users.find(u => u.id === userId);
  const friend = appState.users.find(u => u.id === friendId);
  if (user && friend) {
    if (!user.friendIds) user.friendIds = [];
    if (!friend.friendIds) friend.friendIds = [];
    if (!user.friendIds.includes(friendId)) {
      user.friendIds.push(friendId);
    }
    if (!friend.friendIds.includes(userId)) {
      friend.friendIds.push(userId);
    }
    saveState(appState);
    return res.json({ success: true, users: appState.users });
  }
  res.status(404).json({ error: "Utilisateur ou ami introuvable." });
});

// Get user public publications (sent in community group chats)
app.get("/api/social/publications/:userId", (req, res) => {
  const userId = req.params.userId;
  const messages = appState.socialMessages || [];
  const userPubs = messages.filter(m => m.senderId === userId && m.communityId);
  res.json(userPubs);
});

// Respond to friend request (accept/decline)
app.post("/api/social/friends/respond", (req, res) => {
  const { requestId, action } = req.body;
  if (!requestId || !action) {
    return res.status(400).json({ error: "requestId and action are required." });
  }

  if (!appState.friendRequests) appState.friendRequests = [];
  const request = appState.friendRequests.find(r => r.id === requestId);

  if (!request) {
    return res.status(404).json({ error: "Invitation introuvable." });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ error: "Cette invitation a déjà été traitée." });
  }

  if (action === "accept") {
    request.status = "accepted";
    
    // Add to friend lists
    const sender = appState.users.find(u => u.id === request.senderId);
    const receiver = appState.users.find(u => u.id === request.receiverId);

    if (sender && receiver) {
      if (!sender.friendIds) sender.friendIds = [];
      if (!receiver.friendIds) receiver.friendIds = [];

      if (!sender.friendIds.includes(request.receiverId)) {
        sender.friendIds.push(request.receiverId);
      }
      if (!receiver.friendIds.includes(request.senderId)) {
        receiver.friendIds.push(request.senderId);
      }
    }
  } else {
    request.status = "declined";
  }

  // Also filter or update the request status
  saveState(appState);
  res.json({ request, users: appState.users });
});

// Remove friend
app.post("/api/social/friends/remove", (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) {
    return res.status(400).json({ error: "userId and friendId are required." });
  }

  const user = appState.users.find(u => u.id === userId);
  const friend = appState.users.find(u => u.id === friendId);

  if (user) {
    if (!user.friendIds) user.friendIds = [];
    user.friendIds = user.friendIds.filter(id => id !== friendId);
  }
  if (friend) {
    if (!friend.friendIds) friend.friendIds = [];
    friend.friendIds = friend.friendIds.filter(id => id !== userId);
  }

  // Also clear any related accepted friend requests to avoid issues
  if (appState.friendRequests) {
    appState.friendRequests = appState.friendRequests.filter(
      r => !(
        (r.senderId === userId && r.receiverId === friendId) || 
        (r.senderId === friendId && r.receiverId === userId)
      )
    );
  }

  saveState(appState);
  res.json({ user, friend });
});

// Get messages for a user (either private chat or community chat)
app.get("/api/social/messages", (req, res) => {
  const { userId, otherId, communityId } = req.query as { userId?: string; otherId?: string; communityId?: string };

  let messages = appState.socialMessages || [];

  if (communityId) {
    // Return group messages for this community
    messages = messages.filter(m => m.communityId === communityId);
  } else if (userId && otherId) {
    // Return private messages between userId and otherId
    messages = messages.filter(m => 
      (m.senderId === userId && m.recipientId === otherId) ||
      (m.senderId === otherId && m.recipientId === userId)
    );
  }

  res.json(messages);
});

// GET active or ringing calls for a user
app.get("/api/social/calls", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  if (!appState.callSessions) {
    appState.callSessions = [];
  }
  
  // Find calls involving this user (either as caller, receiver, or a participant) that are not ended
  const activeCalls = appState.callSessions.filter(
    call => (call.callerId === userId || call.receiverId === userId || (call.participants && call.participants.some(p => p.userId === userId))) && call.status !== "ended"
  );
  
  res.json(activeCalls);
});

// POST to start a call
app.post("/api/social/calls", (req, res) => {
  const { callerId, receiverId, type } = req.body;
  if (!callerId || !receiverId || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  // End any previous non-ended calls involving either participant to avoid stuck states
  appState.callSessions.forEach(call => {
    if ((call.callerId === callerId || call.receiverId === callerId || call.callerId === receiverId || call.receiverId === receiverId) && call.status !== "ended") {
      call.status = "ended";
    }
  });

  const callerUser = appState.users.find(u => u.id === callerId);
  const receiverUser = appState.users.find(u => u.id === receiverId);

  const initialParticipants = [];
  if (callerUser) {
    initialParticipants.push({
      userId: callerUser.id,
      username: callerUser.username,
      name: callerUser.name,
      avatar: callerUser.avatar,
      cameraOn: type === "video",
      micOn: true,
      facingMode: "user",
      isMutedByHost: false
    });
  }
  if (receiverUser) {
    initialParticipants.push({
      userId: receiverUser.id,
      username: receiverUser.username,
      name: receiverUser.name,
      avatar: receiverUser.avatar,
      cameraOn: type === "video",
      micOn: true,
      facingMode: "user",
      isMutedByHost: false
    });
  }

  const newCall: CallSession = {
    id: "call_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    callerId,
    receiverId,
    type,
    status: "ringing",
    createdAt: new Date().toISOString(),
    callerFacingMode: "user",
    receiverFacingMode: "user",
    callerCameraOn: type === "video",
    receiverCameraOn: type === "video",
    participants: initialParticipants,
    speakerOn: true
  };

  appState.callSessions.push(newCall);
  saveState(appState);

  res.status(201).json(newCall);
});

// POST to accept a call
app.post("/api/social/calls/:id/accept", (req, res) => {
  const { id } = req.params;
  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  const call = appState.callSessions.find(c => c.id === id);
  if (!call) {
    return res.status(404).json({ error: "Call session not found" });
  }

  call.status = "active";
  if (call.type === "video") {
    call.receiverCameraOn = true;
  }
  
  // Make sure receiver is in the participants list with cameraOn
  if (call.participants) {
    const rx = call.participants.find(p => p.userId === call.receiverId);
    if (rx) {
      rx.cameraOn = call.type === "video";
    }
  }
  
  saveState(appState);

  res.json(call);
});

// POST to end a call
app.post("/api/social/calls/:id/end", (req, res) => {
  const { id } = req.params;
  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  const call = appState.callSessions.find(c => c.id === id);
  if (!call) {
    return res.status(404).json({ error: "Call session not found" });
  }

  call.status = "ended";
  saveState(appState);

  res.json(call);
});

// POST to update camera settings (facingMode, cameraOn)
app.post("/api/social/calls/:id/update-camera", (req, res) => {
  const { id } = req.params;
  const { userId, facingMode, cameraOn, micOn, speakerOn } = req.body;

  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  const call = appState.callSessions.find(c => c.id === id);
  if (!call) {
    return res.status(404).json({ error: "Call session not found" });
  }

  // Update legacy properties
  const isCaller = call.callerId === userId;
  if (isCaller) {
    if (facingMode) call.callerFacingMode = facingMode;
    if (cameraOn !== undefined) call.callerCameraOn = cameraOn;
  } else {
    if (facingMode) call.receiverFacingMode = facingMode;
    if (cameraOn !== undefined) call.receiverCameraOn = cameraOn;
  }

  if (speakerOn !== undefined) {
    call.speakerOn = speakerOn;
  }

  // Update participant list properties
  if (!call.participants) {
    call.participants = [];
  }

  const p = call.participants.find(part => part.userId === userId);
  if (p) {
    if (facingMode) p.facingMode = facingMode;
    if (cameraOn !== undefined) p.cameraOn = cameraOn;
    if (micOn !== undefined) p.micOn = micOn;
  } else {
    // Add dynamically if missing
    const usr = appState.users.find(u => u.id === userId);
    if (usr) {
      call.participants.push({
        userId,
        username: usr.username,
        name: usr.name,
        avatar: usr.avatar,
        cameraOn: cameraOn !== undefined ? cameraOn : (call.type === "video"),
        micOn: micOn !== undefined ? micOn : true,
        facingMode: facingMode || "user",
        isMutedByHost: false
      });
    }
  }

  saveState(appState);
  res.json(call);
});

// POST to invite a new user to the active call session (Conference call)
app.post("/api/social/calls/:id/invite", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  const call = appState.callSessions.find(c => c.id === id);
  if (!call) {
    return res.status(404).json({ error: "Call session not found" });
  }

  if (!call.participants) {
    call.participants = [];
  }

  if (call.participants.length >= 10) {
    return res.status(400).json({ error: "Maximum limit of 10 participants reached" });
  }

  // Check if already in participants list
  const alreadyIn = call.participants.some(p => p.userId === userId);
  if (!alreadyIn) {
    const targetUser = appState.users.find(u => u.id === userId);
    if (targetUser) {
      call.participants.push({
        userId: targetUser.id,
        username: targetUser.username,
        name: targetUser.name,
        avatar: targetUser.avatar,
        cameraOn: call.type === "video",
        micOn: true,
        facingMode: "user",
        isMutedByHost: false
      });
    }
  }

  saveState(appState);
  res.json(call);
});

// POST to perform administrator/host operations (kick, mute)
app.post("/api/social/calls/:id/host-action", (req, res) => {
  const { id } = req.params;
  const { hostId, targetUserId, action } = req.body; // action: "kick" | "toggle-mute"

  if (!appState.callSessions) {
    appState.callSessions = [];
  }

  const call = appState.callSessions.find(c => c.id === id);
  if (!call) {
    return res.status(404).json({ error: "Call session not found" });
  }

  // Verify that the host is indeed the callerId (creator of the call)
  if (call.callerId !== hostId) {
    return res.status(403).json({ error: "Only the call host can perform this action" });
  }

  if (!call.participants) {
    call.participants = [];
  }

  const targetPart = call.participants.find(p => p.userId === targetUserId);
  if (!targetPart) {
    return res.status(404).json({ error: "Participant not found in this call" });
  }

  if (action === "kick") {
    // Remove from participants array
    call.participants = call.participants.filter(p => p.userId !== targetUserId);
    // If we kicked the legacy receiverId, let's keep it safe but they're removed from live list
  } else if (action === "toggle-mute") {
    const isMuted = !targetPart.isMutedByHost;
    targetPart.isMutedByHost = isMuted;
    if (isMuted) {
      targetPart.micOn = false; // force mic off when muted by host
    }
  }

  saveState(appState);
  res.json(call);
});

// Real-time audio stream in-memory store to keep it ultra-fast & clean
const callAudioStore: Record<string, { userId: string; base64: string; timestamp: number }[]> = {};

// POST to save an audio chunk during a call
app.post("/api/social/calls/:id/audio", (req, res) => {
  const { id } = req.params;
  const { userId, base64 } = req.body;
  if (!userId || !base64) {
    return res.status(400).json({ error: "Missing userId or base64 audio data" });
  }

  if (!callAudioStore[id]) {
    callAudioStore[id] = [];
  }

  const now = Date.now();
  callAudioStore[id].push({ userId, base64, timestamp: now });

  // Filter out chunks older than 15 seconds to prevent memory leaks, keeping a buffer of recent chunks
  const cutoff = now - 15000;
  callAudioStore[id] = callAudioStore[id].filter(c => c.timestamp > cutoff);

  res.json({ success: true });
});

// GET audio chunks during a call
app.get("/api/social/calls/:id/audio", (req, res) => {
  const { id } = req.params;
  const { opponentId, since } = req.query as { opponentId?: string; since?: string };
  if (!opponentId) {
    return res.status(400).json({ error: "opponentId is required" });
  }

  const chunks = callAudioStore[id] || [];
  const sinceTime = since ? parseInt(since, 10) : 0;

  // Filter chunks posted by opponent that are newer than 'since' timestamp
  const filtered = chunks.filter(c => c.userId === opponentId && c.timestamp > sinceTime);
  res.json(filtered);
});

// GET unread message stats for a user
app.get("/api/social/messages/unread-stats", (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const messages = appState.socialMessages || [];
  const unreadDMs: Record<string, number> = {};
  const unreadCommunities: Record<string, number> = {};

  messages.forEach(m => {
    const isRead = m.senderId === userId || (m.readBy && m.readBy.includes(userId));
    if (!isRead) {
      if (m.communityId) {
        unreadCommunities[m.communityId] = (unreadCommunities[m.communityId] || 0) + 1;
      } else if (m.recipientId === userId) {
        unreadDMs[m.senderId] = (unreadDMs[m.senderId] || 0) + 1;
      }
    }
  });

  res.json({ unreadDMs, unreadCommunities });
});

// POST to mark messages as read
app.post("/api/social/messages/mark-read", (req, res) => {
  const { userId, otherId, communityId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const messages = appState.socialMessages || [];
  let updated = false;

  messages.forEach(m => {
    if (communityId && m.communityId === communityId && m.senderId !== userId) {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(userId)) {
        m.readBy.push(userId);
        updated = true;
      }
    } else if (otherId && m.recipientId === userId && m.senderId === otherId) {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(userId)) {
        m.readBy.push(userId);
        updated = true;
      }
    }
  });

  if (updated) {
    saveState(appState);
  }

  res.json({ success: true });
});

// Typing state store: records who is currently typing
const typingStateStore: Record<string, { otherId?: string; communityId?: string; timestamp: number }> = {};

// Post typing status
app.post("/api/social/typing", (req, res) => {
  const { userId, otherId, communityId, isTyping } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  if (isTyping) {
    typingStateStore[userId] = { otherId, communityId, timestamp: Date.now() };
  } else {
    delete typingStateStore[userId];
  }
  res.json({ success: true });
});

// Get typing status
app.get("/api/social/typing", (req, res) => {
  const { userId, otherId, communityId } = req.query;
  const now = Date.now();
  // Clean up stale typing notifications (older than 4 seconds)
  Object.keys(typingStateStore).forEach(uid => {
    if (now - typingStateStore[uid].timestamp > 4000) {
      delete typingStateStore[uid];
    }
  });

  const typers = Object.keys(typingStateStore).filter(uid => {
    if (uid === userId) return false;
    const state = typingStateStore[uid];
    if (otherId && state.otherId === userId && uid === otherId) {
      return true;
    }
    if (communityId && state.communityId === communityId) {
      return true;
    }
    return false;
  });

  const typerUsers = typers.map(uid => {
    const u = appState.users.find(usr => usr.id === uid);
    return u ? { id: u.id, name: u.name, username: u.username } : null;
  }).filter(Boolean);

  res.json({ typers: typerUsers });
});

// Helper to translate text using Gemini (or fallback)
async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === "") return "";
  if (fromLang === toLang) return text;
  
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a professional real-time chat translator. Translate the following message from ${fromLang === "fr" ? "French" : "English"} to ${toLang === "fr" ? "French" : "English"}. Do not add any introduction, explanations, or quotes. Output ONLY the raw translated text.\n\nMessage: "${text}"`,
      });
      const translated = response.text?.trim() || "";
      if (translated.startsWith('"') && translated.endsWith('"')) {
        return translated.substring(1, translated.length - 1);
      }
      return translated;
    } catch (err) {
      console.error("Gemini translation error, using basic fallback:", err);
    }
  }

  // Fallback translation
  const basicTranslations: Record<string, Record<string, string>> = {
    fr: {
      "hello": "bonjour",
      "hi": "salut",
      "how are you?": "comment ça va ?",
      "how are you": "comment ça va",
      "good morning": "bonjour",
      "good night": "bonne nuit",
      "thank you": "merci",
      "thanks": "merci",
      "yes": "oui",
      "no": "non",
      "please": "s'il vous plaît",
      "goodbye": "au revoir",
      "bye": "salut",
      "ok": "d'accord",
      "i love you": "je t'aime"
    },
    en: {
      "bonjour": "hello",
      "salut": "hi",
      "comment ça va ?": "how are you?",
      "comment ça va": "how are you",
      "bonne nuit": "good night",
      "merci": "thank you",
      "oui": "yes",
      "non": "no",
      "s'il vous plaît": "please",
      "au revoir": "goodbye",
      "d'accord": "ok",
      "je t'aime": "i love you"
    }
  };

  const lowerText = text.toLowerCase().trim();
  const dict = basicTranslations[toLang];
  if (dict && dict[lowerText]) {
    return dict[lowerText];
  }

  return text;
}

// Send a chat message
app.post("/api/social/messages", async (req, res) => {
  const { 
    senderId, 
    text, 
    recipientId, 
    communityId, 
    voiceUrl, 
    voiceDuration, 
    imageUrl,
    documentUrl,
    documentName,
    documentType,
    documentSize,
    isCustomOffer,
    customOfferId,
    customOfferName,
    customOfferPrice,
    customOfferDescription,
    customOfferStatus,
    customOfferOrderId,
    replyToId,
    replyToText,
    replyToSenderUsername
  } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: "senderId is required." });
  }

  const sender = appState.users.find(u => u.id === senderId);
  if (!sender) {
    return res.status(404).json({ error: "Sender not found." });
  }

  // Automatic translation logic
  let translationText: string | undefined = undefined;
  let translatedFrom: string | undefined = undefined;
  let translatedTo: string | undefined = undefined;

  if (recipientId && text && text.trim() !== "") {
    const recipient = appState.users.find(u => u.id === recipientId);
    if (recipient) {
      const senderLang = sender.language || "fr";
      const recipientLang = recipient.language || "fr";
      
      if (senderLang !== recipientLang) {
        try {
          translationText = await translateText(text, senderLang, recipientLang);
          translatedFrom = senderLang;
          translatedTo = recipientLang;
        } catch (e) {
          console.error("Async translation failed in messages endpoint:", e);
        }
      }
    }
  }

  const newMessage: SocialMessage = {
    id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    senderId,
    senderUsername: sender.username,
    senderAvatar: sender.avatar,
    text: text || "",
    createdAt: new Date().toISOString(),
    recipientId,
    communityId,
    voiceUrl,
    voiceDuration,
    imageUrl,
    documentUrl,
    documentName,
    documentType,
    documentSize,
    isCustomOffer: !!isCustomOffer,
    customOfferId: customOfferId || undefined,
    customOfferName: customOfferName || undefined,
    customOfferPrice: customOfferPrice ? parseFloat(customOfferPrice) : undefined,
    customOfferDescription: customOfferDescription || undefined,
    customOfferStatus: customOfferStatus || undefined,
    customOfferOrderId: customOfferOrderId || undefined,
    readBy: [senderId],
    replyToId: replyToId || undefined,
    replyToText: replyToText || undefined,
    replyToSenderUsername: replyToSenderUsername || undefined,
    reactions: {},
    translation: translationText,
    translatedFrom,
    translatedTo
  };

  if (!appState.socialMessages) appState.socialMessages = [];
  appState.socialMessages.push(newMessage);
  saveState(appState);

  // Trigger Yaamaa AI Agent if recipient is offline or unavailable
  if (recipientId) {
    setTimeout(() => {
      triggerYaamaaAiAgent(senderId, recipientId, newMessage).catch(err => {
        console.error("Yaamaa AI Agent background trigger error:", err);
      });
    }, 1500);
  }

  res.json(newMessage);
});

// Buy Gift Points
app.post("/api/gifts/buy-points", (req, res) => {
  const { userId, packType } = req.body;
  if (!userId || !packType) {
    return res.status(400).json({ error: "userId and packType are required." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }

  let price = 0;
  let points = 0;
  const packs = appState.settings?.rechargePacks || [
    { id: "pack_100", pieces: 100, price: 1.0 },
    { id: "pack_200", pieces: 200, price: 2.0 },
    { id: "pack_500", pieces: 500, price: 5.0 },
    { id: "pack_1000", pieces: 1000, price: 10.0 },
    { id: "pack_5000", pieces: 5000, price: 50.0 },
    { id: "pack_10000", pieces: 10000, price: 100.0 }
  ];

  const matchedPack = packs.find(p => p.id === packType);
  if (matchedPack) {
    price = matchedPack.price;
    points = matchedPack.pieces;
  } else if (packType === "small") {
    price = 1.0;
    points = 100;
  } else if (packType === "medium") {
    price = 5.0;
    points = 500;
  } else if (packType === "large") {
    price = 10.0;
    points = 1200;
  } else {
    return res.status(400).json({ error: "Pack de recharge invalide." });
  }

  // Deduct from wallet if possible, otherwise allow free buy in Test Mode if low balance
  if (!user.wallet) {
    user.wallet = { available: 0, pending: 0, totalEarned: 0, referralEarned: 0 };
  }

  if (user.wallet.available >= price) {
    user.wallet.available -= price;
  } else {
    // Simulated mock transaction in test mode
    console.log(`User ${user.username} bought points via Test Card Simulator (Low wallet balance)`);
  }

  if (user.giftPoints === undefined) user.giftPoints = 0;
  user.giftPoints += points;

  // Log transaction
  const transactionId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const newTx = {
    id: transactionId,
    userId: user.id,
    type: "deposit" as any,
    amount: price,
    currency: user.currency || "EUR",
    status: "completed" as any,
    method: "Achat Points Cadeaux",
    details: `Achat de ${points} points pour envoyer des cadeaux virtuels`,
    createdAt: new Date().toISOString()
  };

  if (!appState.transactions) appState.transactions = [];
  appState.transactions.push(newTx);

  saveState(appState);
  res.json({
    success: true,
    pointsAdded: points,
    newPointsBalance: user.giftPoints,
    newWalletBalance: user.wallet.available
  });
});

// Send a virtual gift to a friend
app.post("/api/gifts/send", (req, res) => {
  const { senderId, recipientId, giftId } = req.body;
  if (!senderId || !recipientId || !giftId) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  const sender = appState.users.find(u => u.id === senderId);
  const recipient = appState.users.find(u => u.id === recipientId);
  if (!sender || !recipient) {
    return res.status(404).json({ error: "Expéditeur ou destinataire non trouvé" });
  }

  const gifts = appState.settings.virtualGifts || DEFAULT_SETTINGS.virtualGifts || [];
  const gift = gifts.find(g => g.id === giftId);
  if (!gift) {
    return res.status(404).json({ error: "Cadeau non trouvé" });
  }

  if (sender.giftPoints === undefined) sender.giftPoints = 1000;
  if (sender.giftPoints < gift.pointsPrice) {
    return res.status(400).json({ error: "Points insuffisants pour envoyer ce cadeau. Veuillez en acheter." });
  }

  // Deduct points
  sender.giftPoints -= gift.pointsPrice;

  // Add points to recipient using pointsValue (if defined) or pointsPrice as fallback
  if (recipient.giftPointsEarned === undefined) recipient.giftPointsEarned = 0;
  const earnedVal = gift.pointsValue !== undefined ? gift.pointsValue : gift.pointsPrice;
  recipient.giftPointsEarned += earnedVal;

  // Create message
  const newMessage: SocialMessage = {
    id: "msg_gift_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    senderId,
    senderUsername: sender.username,
    senderAvatar: sender.avatar,
    text: `🎁 Cadeau virtuel envoyé : ${gift.emoji} ${gift.name}`,
    createdAt: new Date().toISOString(),
    recipientId,
    isGift: true,
    giftId,
    giftName: gift.name,
    giftPoints: gift.pointsPrice,
    giftImage: gift.emoji,
    readBy: [senderId],
    reactions: {}
  };

  if (!appState.socialMessages) appState.socialMessages = [];
  appState.socialMessages.push(newMessage);
  saveState(appState);

  res.json({
    success: true,
    gift,
    message: newMessage,
    senderPoints: sender.giftPoints,
    recipientPointsEarned: recipient.giftPointsEarned
  });
});

// Convert Earned Points back into Wallet cash
app.post("/api/gifts/convert-points", (req, res) => {
  const { userId, pointsToConvert } = req.body;
  if (!userId || !pointsToConvert) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  const pts = parseInt(pointsToConvert);
  if (user.giftPointsEarned === undefined) user.giftPointsEarned = 0;
  if (user.giftPointsEarned < pts) {
    return res.status(400).json({ error: "Points gagnés insuffisants" });
  }

  const rate = appState.settings.giftPointsConversionRate || 0.01;
  const convertedAmount = pts * rate;

  // Deduct points
  user.giftPointsEarned -= pts;

  // Add cash
  if (!user.wallet) {
    user.wallet = { available: 0, pending: 0, totalEarned: 0, referralEarned: 0 };
  }
  user.wallet.available += convertedAmount;
  user.wallet.totalEarned += convertedAmount;

  // Log transaction
  const transactionId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const newTx = {
    id: transactionId,
    userId: user.id,
    type: "earn" as any,
    amount: convertedAmount,
    currency: user.currency || "EUR",
    status: "completed" as any,
    method: "Conversion Cadeaux",
    details: `Conversion de ${pts} points cadeaux reçus`,
    createdAt: new Date().toISOString()
  };

  if (!appState.transactions) appState.transactions = [];
  appState.transactions.push(newTx);
  
  saveState(appState);

  res.json({
    success: true,
    convertedAmount,
    newPointsEarned: user.giftPointsEarned,
    newWalletBalance: user.wallet.available
  });
});

// React to a message with an emoji
app.post("/api/social/messages/:id/react", (req, res) => {
  const { id } = req.params;
  const { emoji, userId } = req.body;
  
  if (!appState.socialMessages) appState.socialMessages = [];
  const msg = appState.socialMessages.find(m => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: "Message not found." });
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }

  const userList = msg.reactions[emoji] || [];
  if (userList.includes(userId)) {
    // Toggle reaction off
    msg.reactions[emoji] = userList.filter(uid => uid !== userId);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    // Add reaction
    msg.reactions[emoji] = [...userList, userId];
  }

  saveState(appState);
  res.json(msg);
});

// Delete a message (WhatsApp style - we remove it, or can replace with deleted marker)
app.delete("/api/social/messages/:id", (req, res) => {
  const { id } = req.params;
  
  if (!appState.socialMessages) appState.socialMessages = [];
  const msgIndex = appState.socialMessages.findIndex(m => m.id === id);
  if (msgIndex === -1) {
    return res.status(404).json({ error: "Message not found." });
  }

  // We can delete it from the list
  appState.socialMessages.splice(msgIndex, 1);
  saveState(appState);

  res.json({ success: true, id });
});

// Helper to check admin permission
function checkAdminPermission(userId: string): boolean {
  if (!userId) return false;
  const user = appState.users.find(u => u.id === userId);
  return user ? (user.role === "admin" || user.role === "founder") : false;
}

// Target evaluation function for broadcast campaigns
function getTargetUsersForBroadcast(targeting: any): any[] {
  let list = appState.users || [];
  
  // Filter out admins/founders to avoid spamming admin accounts unless targeted
  list = list.filter(u => u.role !== "admin" && u.role !== "founder");

  const { targetGroup, countries, region, city } = targeting;

  if (targetGroup === "all") {
    return list;
  }

  if (targetGroup === "countries" && Array.isArray(countries) && countries.length > 0) {
    return list.filter(u => countries.includes(u.country));
  }

  if (targetGroup === "region_city") {
    return list.filter(u => {
      const addressLower = (u.address || "").toLowerCase();
      const matchRegion = region ? addressLower.includes(region.toLowerCase()) : true;
      const matchCity = city ? addressLower.includes(city.toLowerCase()) : true;
      return matchRegion && matchCity;
    });
  }

  if (targetGroup === "premium") {
    return list.filter(u => !!u.merchantNumber);
  }

  if (targetGroup === "free") {
    return list.filter(u => !u.merchantNumber);
  }

  if (targetGroup === "shop_owners") {
    const shopOwners = new Set((appState.shops || []).map(s => s.ownerId));
    return list.filter(u => shopOwners.has(u.id));
  }

  if (targetGroup === "suppliers") {
    const physSellers = new Set((appState.products || []).filter(p => p.category === "physical").map(p => p.ownerId));
    return list.filter(u => physSellers.has(u.id) || (u.bio || "").toLowerCase().includes("fournisseur") || (u.name || "").toLowerCase().includes("fournisseur"));
  }

  if (targetGroup === "delivery") {
    return list.filter(u => (u.bio || "").toLowerCase().includes("livreur") || (u.username || "").toLowerCase().includes("livre") || (u.name || "").toLowerCase().includes("livreur"));
  }

  if (targetGroup === "creators") {
    return list.filter(u => u.level >= 10 || (u.bio || "").toLowerCase().includes("créateur") || (u.bio || "").toLowerCase().includes("creator"));
  }

  if (targetGroup === "verified") {
    return list.filter(u => u.is2faEnabled || !!u.merchantNumber || u.level >= 5);
  }

  if (targetGroup === "new") {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return list.filter(u => u.createdAt ? new Date(u.createdAt).getTime() > oneWeekAgo : false);
  }

  if (targetGroup === "active") {
    const activeUserIds = new Set([
      ...(appState.transactions || []).map(t => t.userId),
      ...(appState.submissions || []).map(s => s.participantId)
    ]);
    return list.filter(u => activeUserIds.has(u.id));
  }

  if (targetGroup === "inactive") {
    const activeUserIds = new Set([
      ...(appState.transactions || []).map(t => t.userId),
      ...(appState.submissions || []).map(s => s.participantId)
    ]);
    return list.filter(u => !activeUserIds.has(u.id));
  }

  return list;
}

// Function to broadcast messages from admin official
function executeBroadcastCampaign(campaign: any, req: any) {
  const targetUsers = getTargetUsersForBroadcast(campaign.targeting);
  
  if (!appState.socialMessages) appState.socialMessages = [];

  targetUsers.forEach(user => {
    const autoName = appState.settings.autoSenderName || "Yama Assistance";
    const autoAvatar = appState.settings.autoSenderAvatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop";
    
    const newMessage = {
      id: "msg_broadcast_" + campaign.id + "_" + user.id + "_" + Date.now(),
      senderId: "user_admin",
      senderUsername: autoName,
      senderAvatar: autoAvatar,
      text: `📢 MESSAGE OFFICIEL : ${campaign.title}\n\n${campaign.text}`,
      createdAt: new Date().toISOString(),
      recipientId: user.id,
      readBy: [],
      reactions: {},
      isAdminOfficial: true,
      adminCampaignId: campaign.id,
      imageUrl: campaign.mediaType === "image" ? campaign.mediaUrl : undefined,
      voiceUrl: campaign.mediaType === "video" ? campaign.mediaUrl : undefined,
      documentUrl: (campaign.mediaType === "document" || campaign.mediaType === "link") ? campaign.mediaUrl : undefined,
      documentName: campaign.mediaName || undefined,
      documentType: campaign.mediaType === "document" ? "pdf" : undefined as any
    };

    appState.socialMessages!.push(newMessage);
  });

  campaign.status = "sent";
  campaign.sentAt = new Date().toISOString();
  campaign.recipientCount = targetUsers.length;
  campaign.distributedCount = targetUsers.length;

  const adminUser = appState.users.find(u => u.id === campaign.senderId) || { username: campaign.senderUsername, role: "admin" };
  createAuditLog(
    campaign.senderId,
    adminUser.username,
    adminUser.role as any,
    "Diffusion Campagne Admin",
    `Campagne de diffusion "${campaign.title}" envoyée à ${targetUsers.length} utilisateurs (${campaign.targeting.targetGroup}).`,
    req
  );

  saveState(appState);
}

// GET all broadcast campaigns
app.get("/api/broadcast-campaigns", (req, res) => {
  if (!appState.broadcastCampaigns) appState.broadcastCampaigns = [];

  const msgs = appState.socialMessages || [];
  const updatedCampaigns = appState.broadcastCampaigns.map(camp => {
    if (camp.status === "sent") {
      const campaignMsgs = msgs.filter(m => m.adminCampaignId === camp.id);
      camp.distributedCount = campaignMsgs.length;
      camp.readCount = campaignMsgs.filter(m => m.readBy && m.readBy.includes(m.recipientId)).length;
    }
    return camp;
  });

  res.json(updatedCampaigns);
});

// POST to create / save draft or schedule campaign
app.post("/api/broadcast-campaigns", (req, res) => {
  const { 
    id, title, text, mediaUrl, mediaType, mediaName,
    scheduleType, scheduledAt, status, targeting, senderId 
  } = req.body;

  if (!senderId || !checkAdminPermission(senderId)) {
    return res.status(403).json({ error: "Autorisation administrative requise." });
  }

  if (!title || !text) {
    return res.status(400).json({ error: "Le titre et le contenu du message sont obligatoires." });
  }

  const sender = appState.users.find(u => u.id === senderId);
  if (!sender) {
    return res.status(404).json({ error: "Administrateur introuvable." });
  }

  if (!appState.broadcastCampaigns) appState.broadcastCampaigns = [];

  let campaign = appState.broadcastCampaigns.find(c => c.id === id);

  if (campaign) {
    if (campaign.status === "sent") {
      return res.status(400).json({ error: "Impossible de modifier une campagne déjà envoyée." });
    }
    campaign.title = title;
    campaign.text = text;
    campaign.mediaUrl = mediaUrl;
    campaign.mediaType = mediaType;
    campaign.mediaName = mediaName;
    campaign.scheduleType = scheduleType;
    campaign.scheduledAt = scheduledAt;
    campaign.status = status;
    campaign.targeting = targeting;
    campaign.senderId = senderId;
    campaign.senderUsername = sender.username;
    campaign.senderAvatar = sender.avatar;
  } else {
    campaign = {
      id: id || "camp_bc_" + Date.now(),
      title,
      text,
      mediaUrl,
      mediaType,
      mediaName,
      scheduleType,
      scheduledAt,
      status: status || "draft",
      targeting,
      senderId,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      createdAt: new Date().toISOString(),
      recipientCount: 0,
      distributedCount: 0,
      readCount: 0
    };
    appState.broadcastCampaigns.push(campaign);
  }

  const targets = getTargetUsersForBroadcast(campaign.targeting);
  campaign.recipientCount = targets.length;

  if (campaign.status === "sent") {
    executeBroadcastCampaign(campaign, req);
  } else {
    createAuditLog(
      senderId,
      sender.username,
      sender.role as any,
      campaign.status === "draft" ? "Enregistrement Brouillon Message" : "Planification Message Admin",
      `Campagne de diffusion "${campaign.title}" enregistrée en statut ${campaign.status} (cible: ${campaign.targeting.targetGroup}, destinataires potentiels: ${targets.length}).`,
      req
    );
  }

  saveState(appState);
  res.json(campaign);
});

// POST to immediately send a saved campaign
app.post("/api/broadcast-campaigns/:id/send", (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.body;

  if (!operatorId || !checkAdminPermission(operatorId)) {
    return res.status(403).json({ error: "Autorisation administrative requise." });
  }

  if (!appState.broadcastCampaigns) appState.broadcastCampaigns = [];
  const campaign = appState.broadcastCampaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: "Campagne introuvable." });
  }

  if (campaign.status === "sent") {
    return res.status(400).json({ error: "Cette campagne a déjà été envoyée." });
  }

  executeBroadcastCampaign(campaign, req);
  res.json(campaign);
});

// DELETE a campaign
app.delete("/api/broadcast-campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.query as { operatorId?: string };

  if (!operatorId || !checkAdminPermission(operatorId)) {
    return res.status(403).json({ error: "Autorisation administrative requise." });
  }

  if (!appState.broadcastCampaigns) appState.broadcastCampaigns = [];
  const index = appState.broadcastCampaigns.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Campagne introuvable." });
  }

  const campaign = appState.broadcastCampaigns[index];
  if (campaign.status === "sent") {
    return res.status(400).json({ error: "Impossible de supprimer une campagne déjà envoyée." });
  }

  appState.broadcastCampaigns.splice(index, 1);
  
  const adminUser = appState.users.find(u => u.id === operatorId) || { username: "Admin", role: "admin" };
  createAuditLog(
    operatorId,
    adminUser.username,
    adminUser.role as any,
    "Suppression Campagne Admin",
    `Campagne de diffusion "${campaign.title}" supprimée.`,
    req
  );

  saveState(appState);
  res.json({ success: true, id });
});

// POST to toggle read state of a single message manually
app.post("/api/social/messages/:id/toggle-read", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!appState.socialMessages) appState.socialMessages = [];
  const msg = appState.socialMessages.find(m => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: "Message non trouvé." });
  }

  if (!msg.readBy) msg.readBy = [];
  const index = msg.readBy.indexOf(userId);
  if (index > -1) {
    msg.readBy.splice(index, 1);
  } else {
    msg.readBy.push(userId);
  }

  saveState(appState);
  res.json({ success: true, readBy: msg.readBy });
});

// Interval scheduler checking for scheduled broadcast campaigns to send them automatically
setInterval(() => {
  try {
    if (appState && appState.broadcastCampaigns) {
      const now = new Date();
      let stateChanged = false;
      appState.broadcastCampaigns.forEach((campaign: any) => {
        if (campaign.status === "scheduled" && campaign.scheduledAt) {
          const schedTime = new Date(campaign.scheduledAt);
          if (schedTime <= now) {
            const mockReq = { ip: "127.0.0.1" } as any;
            executeBroadcastCampaign(campaign, mockReq);
            stateChanged = true;
            console.log(`[Scheduler] Automatically sent scheduled campaign: "${campaign.title}"`);
          }
        }
      });
      if (stateChanged) {
        saveState(appState);
      }
    }
  } catch (err) {
    console.error("Error in background scheduled broadcast campaigns interval:", err);
  }
}, 20000); // Check every 20 seconds

// Action on custom offer inside chat
app.post("/api/social/messages/:id/offer-action", (req, res) => {
  const { id } = req.params;
  const { action, userId, shippingAddress, phoneNumber, email, paymentMethod } = req.body;

  if (!appState.socialMessages) appState.socialMessages = [];
  const msg = appState.socialMessages.find(m => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: "Message de discussion non trouvé." });
  }

  if (!msg.isCustomOffer) {
    return res.status(400).json({ error: "Ce message n'est pas une offre commerciale." });
  }

  const buyer = appState.users.find(u => u.id === userId);
  if (!buyer) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const seller = appState.users.find(u => u.id === msg.senderId);
  if (!seller) {
    return res.status(404).json({ error: "Vendeur de l'offre introuvable." });
  }

  const price = msg.customOfferPrice || 0;

  if (action === "pay") {
    if (msg.customOfferStatus && msg.customOfferStatus !== "pending") {
      return res.status(400).json({ error: "Cette offre a déjà été payée ou annulée." });
    }

    // Pay with Wallet or card
    if (paymentMethod === "Wallet Yaamaa" || paymentMethod === "Wallet Yaamaa") {
      if (buyer.wallet.available < price) {
        return res.status(400).json({ error: "Solde Wallet insuffisant." });
      }
      buyer.wallet.available = parseFloat((buyer.wallet.available - price).toFixed(2));
    }

    // Create an order in our standard order system so it shows up in dashboards
    const orderId = "order_co_" + Date.now();
    const matchingProduct = msg.customOfferId ? (appState.products || []).find(p => p.id === msg.customOfferId) : null;
    const orderProductId = msg.customOfferId || "custom_offer_prod";
    const orderProductName = msg.customOfferName || "Ordre personnalisé";
    const orderProductImage = matchingProduct && matchingProduct.images && matchingProduct.images.length > 0
      ? matchingProduct.images[0]
      : "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=400&auto=format&fit=crop";
    const orderShopId = matchingProduct ? matchingProduct.shopId : "custom_shop";
    const orderShopName = matchingProduct ? (matchingProduct.shopName || "Boutique du vendeur") : "Service personnalisé - Chat";

    const newOrder: Order = {
      id: orderId,
      productId: orderProductId,
      productName: orderProductName,
      productImage: orderProductImage,
      shopId: orderShopId,
      shopName: orderShopName,
      sellerId: msg.senderId,
      buyerId: buyer.id,
      buyerUsername: buyer.username,
      quantity: 1,
      totalPrice: price,
      currency: buyer.currency || "XOF",
      shippingAddress: shippingAddress || "Livraison de service par Discussion Chat",
      phoneNumber: phoneNumber || buyer.phone || "",
      email: email || buyer.email || "",
      paymentMethod: paymentMethod || "Wallet Yaamaa",
      status: "paid_escrow",
      createdAt: new Date().toISOString()
    };

    if (!appState.orders) appState.orders = [];
    appState.orders.push(newOrder);

    // Create Transaction Log for Buyer
    const newTx: WalletTransaction = {
      id: "tx_order_co_" + Date.now(),
      userId: buyer.id,
      type: "withdraw",
      amount: price,
      currency: buyer.currency || "XOF",
      status: "completed",
      method: paymentMethod || "Wallet Yaamaa",
      details: `Achat Offre Direct Chat - #${orderId} - Bloqué en Escrow`,
      createdAt: new Date().toISOString()
    };
    if (!appState.transactions) appState.transactions = [];
    appState.transactions.unshift(newTx);

    // Update message state
    msg.customOfferStatus = "paid";
    msg.customOfferOrderId = orderId;

    saveState(appState);
    createAuditLog(buyer.id, buyer.username, buyer.role, "Achat Offre Chat", `Offre payée: ${msg.customOfferName} (${price} ${buyer.currency}) - Commande #${orderId}`, req);
    return res.json(msg);
  }

  if (action === "ship") {
    if (msg.customOfferStatus !== "paid") {
      return res.status(400).json({ error: "L'offre doit être payée pour pouvoir être expédiée." });
    }

    // Update order status in standard order system
    const order = (appState.orders || []).find(o => o.id === msg.customOfferOrderId);
    if (order) {
      order.status = "shipped";
      order.updatedAt = new Date().toISOString();
    }

    msg.customOfferStatus = "shipped";
    saveState(appState);
    createAuditLog(seller.id, seller.username, seller.role, "Expédition Offre Chat", `Offre #${msg.customOfferOrderId} marquée expédiée/en cours de livraison`, req);
    return res.json(msg);
  }

  if (action === "receive") {
    if (msg.customOfferStatus !== "shipped") {
      return res.status(400).json({ error: "L'offre doit être expédiée pour confirmer la réception." });
    }

    // Complete order
    const order = (appState.orders || []).find(o => o.id === msg.customOfferOrderId);
    if (order) {
      order.status = "completed";
      order.updatedAt = new Date().toISOString();
    }

    // Transfer funds to seller wallet
    const feePct = appState.settings.platformFeePercentage || 10;
    const commission = parseFloat((price * (feePct / 100)).toFixed(2));
    const sellerPayout = parseFloat((price - commission).toFixed(2));

    seller.wallet.available = parseFloat((seller.wallet.available + sellerPayout).toFixed(2));
    seller.wallet.totalEarned = parseFloat((seller.wallet.totalEarned + sellerPayout).toFixed(2));

    // Create Transaction Log for Seller
    const sellerTx: WalletTransaction = {
      id: "tx_sale_co_" + Date.now(),
      userId: seller.id,
      type: "earn",
      amount: sellerPayout,
      currency: order?.currency || buyer.currency || "XOF",
      status: "completed",
      method: "Wallet Yaamaa",
      details: `Vente Offre Direct Chat - Libération Escrow Commande #${msg.customOfferOrderId}`,
      createdAt: new Date().toISOString()
    };
    if (!appState.transactions) appState.transactions = [];
    appState.transactions.unshift(sellerTx);

    msg.customOfferStatus = "received";
    saveState(appState);
    createAuditLog(buyer.id, buyer.username, buyer.role, "Confirmation Offre Chat", `Offre #${msg.customOfferOrderId} réceptionnée. Fonds libérés pour le vendeur`, req);
    return res.json(msg);
  }

  return res.status(400).json({ error: "Action non valide." });
});

// Get all communities
app.get("/api/social/communities", (req, res) => {
  res.json(appState.communities || []);
});

// Create a community group (can directly initialize with memberIds list)
app.post("/api/social/communities", (req, res) => {
  const { name, description, creatorId, avatar, memberIds } = req.body;

  if (!name || !creatorId) {
    return res.status(400).json({ error: "name and creatorId are required." });
  }

  const creator = appState.users.find(u => u.id === creatorId);
  if (!creator) {
    return res.status(404).json({ error: "Creator not found." });
  }

  // Ensure creator is in the member list
  const finalMemberIds = Array.isArray(memberIds) ? [...memberIds] : [];
  if (!finalMemberIds.includes(creatorId)) {
    finalMemberIds.push(creatorId);
  }

  const newCommunity: Community = {
    id: "comm_" + Date.now(),
    name,
    description: description || "",
    avatar: avatar || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=200&auto=format&fit=crop",
    creatorId,
    creatorUsername: creator.username,
    memberIds: finalMemberIds,
    invitedIds: [],
    createdAt: new Date().toISOString()
  };

  if (!appState.communities) appState.communities = [];
  appState.communities.push(newCommunity);
  saveState(appState);

  res.json(newCommunity);
});

// Join, Leave, Invite/Add to Community
app.post("/api/social/communities/:id/members", (req, res) => {
  const { id } = req.params;
  const { userId, action, targetUserId } = req.body;

  const community = appState.communities?.find(c => c.id === id);
  if (!community) {
    return res.status(404).json({ error: "Community not found." });
  }

  if (action === "join") {
    if (!community.memberIds.includes(userId)) {
      community.memberIds.push(userId);
    }
    // Remove from invited if present
    if (community.invitedIds) {
      community.invitedIds = community.invitedIds.filter(id => id !== userId);
    }
  } else if (action === "leave") {
    community.memberIds = community.memberIds.filter(id => id !== userId);
  } else if (action === "invite") {
    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required for invitation." });
    }
    if (!community.invitedIds) community.invitedIds = [];
    if (!community.invitedIds.includes(targetUserId) && !community.memberIds.includes(targetUserId)) {
      community.invitedIds.push(targetUserId);
    }
  } else if (action === "add_directly") {
    // Directly add a friend into the community
    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required." });
    }
    if (!community.memberIds.includes(targetUserId)) {
      community.memberIds.push(targetUserId);
    }
    if (community.invitedIds) {
      community.invitedIds = community.invitedIds.filter(id => id !== targetUserId);
    }
  } else if (action === "accept_invite") {
    if (!community.memberIds.includes(userId)) {
      community.memberIds.push(userId);
    }
    if (community.invitedIds) {
      community.invitedIds = community.invitedIds.filter(id => id !== userId);
    }
  }

  saveState(appState);
  res.json(community);
});

// Update community details (name, description, avatar) - only by admin/creator
app.put("/api/social/communities/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, avatar, userId } = req.body;

  const community = appState.communities?.find(c => c.id === id);
  if (!community) {
    return res.status(404).json({ error: "Group/Community not found." });
  }

  if (community.creatorId !== userId) {
    return res.status(403).json({ error: "Only the group administrator can modify these details." });
  }

  if (name) community.name = name;
  if (description !== undefined) community.description = description;
  if (avatar) community.avatar = avatar;

  saveState(appState);
  res.json(community);
});

// 5.2 ADMIN REVIEWS PENDING DEPOSIT
app.post("/api/admin/deposits/review", (req, res) => {
  const { transactionId, status, operatorId } = req.body;

  const tx = appState.transactions.find(t => t.id === transactionId);
  if (!tx || tx.type !== "deposit") return res.status(404).json({ error: "Dépôt introuvable." });

  if (tx.status !== "pending") {
    return res.status(400).json({ error: "Ce dépôt a déjà été finalisé." });
  }

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Privilèges admin requis." });
  }
  const operatorUsername = adminUser.username;

  tx.status = status;

  if (status === "completed") {
    // Credit user's wallet available funds
    const user = appState.users.find(u => u.id === tx.userId);
    if (user) {
      user.wallet.available = parseFloat((user.wallet.available + tx.amount).toFixed(2));
    }
  }

  saveState(appState);
  createAuditLog(operatorId || "system", operatorUsername, "admin", "Validation Dépôt", `Dépôt ID ${transactionId} mis à jour: ${status}`, req);
  res.json(tx);
});

// 5.3 ADMIN CONFIGURES SYSTEM WIDE VALUES (TARIFFS AND COMMISSIONS)
app.post("/api/admin/settings", (req, res) => {
  const { 
    isWithdrawalFrozen, 
    platformFeePercentage, 
    minWithdrawalAmount, 
    baseReward, 
    defaultCommission, 
    merchantNumberPrice, 
    merchantPremiumPrice,
    merchantGoldPrice,
    merchantDiamondPrice,
    giftPointsConversionRate,
    virtualGifts,
    rechargePacks,
    withdrawalPacks,
    autoSenderName,
    autoSenderPhone,
    autoSenderAvatar,
    apiKeys,
    referralProgramEnabled,
    referralEligibleTypes,
    referralCommissionMode,
    referralCommissionValue,
    referralMaxEarningsCap,
    referralMaxReferralsPerUser,
    operatorId 
  } = req.body;

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Privilèges d'administration requis pour configurer les tarifs et commissions." });
  }

  if (isWithdrawalFrozen !== undefined) appState.settings.isWithdrawalFrozen = isWithdrawalFrozen;
  if (platformFeePercentage !== undefined) appState.settings.platformFeePercentage = parseFloat(platformFeePercentage);
  if (minWithdrawalAmount !== undefined) appState.settings.minWithdrawalAmount = parseFloat(minWithdrawalAmount);
  if (baseReward !== undefined) appState.settings.baseReward = parseFloat(baseReward);
  if (defaultCommission !== undefined) appState.settings.defaultCommission = parseFloat(defaultCommission);
  if (merchantNumberPrice !== undefined) appState.settings.merchantNumberPrice = parseFloat(merchantNumberPrice);
  if (merchantPremiumPrice !== undefined) appState.settings.merchantPremiumPrice = parseFloat(merchantPremiumPrice);
  if (merchantGoldPrice !== undefined) appState.settings.merchantGoldPrice = parseFloat(merchantGoldPrice);
  if (merchantDiamondPrice !== undefined) appState.settings.merchantDiamondPrice = parseFloat(merchantDiamondPrice);
  if (giftPointsConversionRate !== undefined) appState.settings.giftPointsConversionRate = parseFloat(giftPointsConversionRate);
  if (virtualGifts !== undefined) appState.settings.virtualGifts = virtualGifts;
  if (rechargePacks !== undefined) appState.settings.rechargePacks = rechargePacks;
  if (withdrawalPacks !== undefined) appState.settings.withdrawalPacks = withdrawalPacks;
  if (autoSenderName !== undefined) appState.settings.autoSenderName = autoSenderName;
  if (autoSenderPhone !== undefined) appState.settings.autoSenderPhone = autoSenderPhone;
  if (autoSenderAvatar !== undefined) appState.settings.autoSenderAvatar = autoSenderAvatar;
  if (apiKeys !== undefined) appState.settings.apiKeys = apiKeys;
  if (referralProgramEnabled !== undefined) appState.settings.referralProgramEnabled = referralProgramEnabled;
  if (referralEligibleTypes !== undefined) appState.settings.referralEligibleTypes = referralEligibleTypes;
  if (referralCommissionMode !== undefined) appState.settings.referralCommissionMode = referralCommissionMode;
  if (referralCommissionValue !== undefined) appState.settings.referralCommissionValue = parseFloat(referralCommissionValue);
  if (referralMaxEarningsCap !== undefined) appState.settings.referralMaxEarningsCap = parseFloat(referralMaxEarningsCap);
  if (referralMaxReferralsPerUser !== undefined) appState.settings.referralMaxReferralsPerUser = parseInt(referralMaxReferralsPerUser, 10);

  // Synchronize user_admin profile with autoSender details for real-time contact rendering
  const userAdmin = appState.users.find(u => u.id === "user_admin");
  if (userAdmin) {
    if (autoSenderName !== undefined) {
      userAdmin.name = autoSenderName;
      userAdmin.username = autoSenderName.replace(/\s+/g, "");
    }
    if (autoSenderPhone !== undefined) {
      userAdmin.phone = autoSenderPhone;
    }
    if (autoSenderAvatar !== undefined) {
      userAdmin.avatar = autoSenderAvatar;
    }
  }

  saveState(appState);
  createAuditLog(operatorId, adminUser.username, adminUser.role, "Ajustement Tarifs", `Tarifs et Commissions mis à jour par @${adminUser.username}`, req);
  res.json(appState.settings);
});

// GET Admin Virtual Gifts statistics
app.get("/api/admin/gifts/stats", (req, res) => {
  const messages = appState.socialMessages || [];
  const giftMessages = messages.filter(m => m.isGift === true);
  
  const popularityMap: { [key: string]: number } = {};
  giftMessages.forEach(m => {
    if (m.giftId) {
      popularityMap[m.giftId] = (popularityMap[m.giftId] || 0) + 1;
    }
  });
  
  const totalSent = giftMessages.length;
  const totalPointsSpent = giftMessages.reduce((sum, m) => sum + (m.giftPoints || 0), 0);
  
  res.json({
    totalSent,
    totalPointsSpent,
    popularityMap
  });
});

// ==========================================
// 5.4 AUTOMATION & SYNCHRONIZATION ENGINE ENDPOINTS
// ==========================================

function triggerAutomationEvent(eventKey: string, context: { user?: any, recipient?: any, inviter?: any, amount?: number, commission?: number, giftName?: string, campaignName?: string, subscriptionName?: string, extraData?: any }) {
  if (!appState.settings.automationRules) appState.settings.automationRules = DEFAULT_SETTINGS.automationRules || [];
  if (!appState.settings.messageTemplates) appState.settings.messageTemplates = DEFAULT_SETTINGS.messageTemplates || [];

  const rules = appState.settings.automationRules;
  const templates = appState.settings.messageTemplates;
  const matchingRules = rules.filter(r => r.isActive && r.triggerEvent === eventKey);

  matchingRules.forEach(rule => {
    const template = templates.find(t => t.id === rule.templateId && t.isActive);
    if (!template) return;

    const targetUser = context.recipient || context.user || context.inviter;
    if (!targetUser) return;

    let content = template.content;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const variablesMap: { [key: string]: string } = {
      NomUtilisateur: targetUser.name || targetUser.username || "Utilisateur",
      NumeroMarchand: targetUser.merchantNumber || "N/A",
      MontantGagne: context.amount ? `${context.amount} ${targetUser.currency || 'FCFA'}` : "0 FCFA",
      NombreFilleuls: String(targetUser.referralsCount || 0),
      MontantCommission: context.commission ? `${context.commission} ${targetUser.currency || 'FCFA'}` : "0 FCFA",
      CadeauRecu: context.giftName || "Cadeau",
      Date: dateStr,
      Heure: timeStr,
      NomAbonnement: context.subscriptionName || "Abonnement Standard",
      NomCampagne: context.campaignName || "Campagne Yaamaa",
      SoldePortefeuille: `${targetUser.wallet?.available || 0} ${targetUser.currency || 'FCFA'}`,
      NomFilleul: context.user?.name || context.user?.username || "Filleul"
    };

    Object.keys(variablesMap).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, variablesMap[key]);
    });

    rule.channels.forEach(channel => {
      if (channel === "in_app") {
        if (!targetUser.notifications) targetUser.notifications = [];
        targetUser.notifications.unshift({
          id: "notif_auto_" + Date.now() + "_" + Math.floor(Math.random()*1000),
          title: template.title,
          message: content,
          timestamp: new Date().toISOString(),
          read: false
        });
      } else if (channel === "message") {
        if (!appState.socialMessages) appState.socialMessages = [];
        appState.socialMessages.push({
          id: "msg_auto_" + Date.now() + "_" + Math.floor(Math.random()*1000),
          senderId: "user_admin",
          senderUsername: "Yama Assistance",
          senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop",
          text: content,
          createdAt: new Date().toISOString(),
          recipientId: targetUser.id
        });
      } else if (channel === "home_feed") {
        if (!appState.broadcastCampaigns) appState.broadcastCampaigns = [];
        appState.broadcastCampaigns.unshift({
          id: "bc_auto_" + Date.now(),
          title: template.title,
          text: content,
          mediaType: "none",
          scheduleType: "immediate",
          status: "sent",
          targeting: { targetGroup: "all" },
          senderId: "user_admin",
          senderUsername: "Yama Assistance",
          senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop",
          createdAt: new Date().toISOString(),
          sentCount: 1500,
          readCount: 1200,
          recipientCount: 1500,
          distributedCount: 1500
        });
      }
    });

    if (!appState.settings.syncLogs) appState.settings.syncLogs = [];
    appState.settings.syncLogs.unshift({
      id: "log_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      adminId: "system",
      adminUsername: "Yaamaa Automation Engine",
      timestamp: new Date().toISOString(),
      parameterKey: `automation_rule_${rule.id}`,
      oldValue: "Trigger: " + eventKey,
      newValue: `Dispatched to: ${rule.channels.join(", ")}`,
      modulesUpdated: rule.channels,
      status: "success",
      details: `Règle "${rule.name}" exécutée avec succès pour @${targetUser.username}`
    });
  });
}

app.get("/api/admin/automation-rules", (req, res) => {
  res.json(appState.settings.automationRules || DEFAULT_SETTINGS.automationRules || []);
});

app.post("/api/admin/automation-rules", (req, res) => {
  const { name, triggerEvent, conditions, templateId, channels, isActive, operatorId } = req.body;
  if (!appState.settings.automationRules) appState.settings.automationRules = [];
  const newRule = {
    id: "rule_" + Date.now(),
    name: name || "Nouvelle Règle",
    triggerEvent: triggerEvent || "referral_success",
    conditions: conditions || "always",
    templateId: templateId || "",
    channels: channels || ["in_app"],
    isActive: isActive !== false,
    createdAt: new Date().toISOString()
  };
  appState.settings.automationRules.push(newRule);
  
  if (!appState.settings.syncLogs) appState.settings.syncLogs = [];
  appState.settings.syncLogs.unshift({
    id: "log_" + Date.now(),
    adminId: operatorId || "system",
    adminUsername: appState.users.find(u => u.id === operatorId)?.username || "admin",
    timestamp: new Date().toISOString(),
    parameterKey: "automation_rule_create",
    oldValue: "None",
    newValue: newRule.name,
    modulesUpdated: ["automation_engine"],
    status: "success",
    details: `Création de la règle d'automatisation ${newRule.name}`
  });

  saveState(appState);
  res.json({ success: true, rule: newRule });
});

app.put("/api/admin/automation-rules/:id", (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.body;
  const rules = appState.settings.automationRules || [];
  const rule = rules.find(r => r.id === id);
  if (!rule) return res.status(404).json({ error: "Règle introuvable." });
  Object.assign(rule, req.body);

  if (!appState.settings.syncLogs) appState.settings.syncLogs = [];
  appState.settings.syncLogs.unshift({
    id: "log_" + Date.now(),
    adminId: operatorId || "system",
    adminUsername: appState.users.find(u => u.id === operatorId)?.username || "admin",
    timestamp: new Date().toISOString(),
    parameterKey: `automation_rule_update_${id}`,
    oldValue: "Modified",
    newValue: rule.name,
    modulesUpdated: ["automation_engine"],
    status: "success",
    details: `Mise à jour de la règle d'automatisation ${rule.name}`
  });

  saveState(appState);
  res.json({ success: true, rule });
});

app.delete("/api/admin/automation-rules/:id", (req, res) => {
  const { id } = req.params;
  if (!appState.settings.automationRules) appState.settings.automationRules = [];
  appState.settings.automationRules = appState.settings.automationRules.filter(r => r.id !== id);
  saveState(appState);
  res.json({ success: true });
});

app.get("/api/admin/message-templates", (req, res) => {
  res.json(appState.settings.messageTemplates || DEFAULT_SETTINGS.messageTemplates || []);
});

app.post("/api/admin/message-templates", (req, res) => {
  const { title, category, content, variables, isActive, operatorId } = req.body;
  if (!appState.settings.messageTemplates) appState.settings.messageTemplates = [];
  const newTpl = {
    id: "tpl_" + Date.now(),
    title: title || "Nouveau Modèle",
    category: category || "general",
    content: content || "Félicitations {NomUtilisateur} !",
    variables: variables || ["NomUtilisateur"],
    isActive: isActive !== false
  };
  appState.settings.messageTemplates.push(newTpl);

  if (!appState.settings.syncLogs) appState.settings.syncLogs = [];
  appState.settings.syncLogs.unshift({
    id: "log_" + Date.now(),
    adminId: operatorId || "system",
    adminUsername: appState.users.find(u => u.id === operatorId)?.username || "admin",
    timestamp: new Date().toISOString(),
    parameterKey: "message_template_create",
    oldValue: "None",
    newValue: newTpl.title,
    modulesUpdated: ["messaging_library"],
    status: "success",
    details: `Création du modèle de message ${newTpl.title}`
  });

  saveState(appState);
  res.json({ success: true, template: newTpl });
});

app.put("/api/admin/message-templates/:id", (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.body;
  const tpls = appState.settings.messageTemplates || [];
  const tpl = tpls.find(t => t.id === id);
  if (!tpl) return res.status(404).json({ error: "Modèle introuvable." });
  Object.assign(tpl, req.body);

  if (!appState.settings.syncLogs) appState.settings.syncLogs = [];
  appState.settings.syncLogs.unshift({
    id: "log_" + Date.now(),
    adminId: operatorId || "system",
    adminUsername: appState.users.find(u => u.id === operatorId)?.username || "admin",
    timestamp: new Date().toISOString(),
    parameterKey: `message_template_update_${id}`,
    oldValue: "Modified",
    newValue: tpl.title,
    modulesUpdated: ["messaging_library"],
    status: "success",
    details: `Mise à jour du modèle ${tpl.title}`
  });

  saveState(appState);
  res.json({ success: true, template: tpl });
});

app.delete("/api/admin/message-templates/:id", (req, res) => {
  const { id } = req.params;
  if (!appState.settings.messageTemplates) appState.settings.messageTemplates = [];
  appState.settings.messageTemplates = appState.settings.messageTemplates.filter(t => t.id !== id);
  saveState(appState);
  res.json({ success: true });
});

app.get("/api/admin/sync-logs", (req, res) => {
  res.json(appState.settings.syncLogs || []);
});

// 5.3.1 ADMIN CUSTOMIZES HOME PAGE CONTENT
app.post("/api/admin/home-customization", (req, res) => {
  const { 
    homeCustomHeroTitle, 
    homeCustomHeroSubtitle, 
    homeCustomHeroDescription, 
    homeCustomHeroImage, 
    homeCustomPromoTitle, 
    homeCustomPromoDescription, 
    homeCustomPosts, 
    operatorId 
  } = req.body;

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Privilèges d'administration requis pour personnaliser la page d'accueil." });
  }

  if (homeCustomHeroTitle !== undefined) appState.settings.homeCustomHeroTitle = homeCustomHeroTitle;
  if (homeCustomHeroSubtitle !== undefined) appState.settings.homeCustomHeroSubtitle = homeCustomHeroSubtitle;
  if (homeCustomHeroDescription !== undefined) appState.settings.homeCustomHeroDescription = homeCustomHeroDescription;
  if (homeCustomHeroImage !== undefined) appState.settings.homeCustomHeroImage = homeCustomHeroImage;
  if (homeCustomPromoTitle !== undefined) appState.settings.homeCustomPromoTitle = homeCustomPromoTitle;
  if (homeCustomPromoDescription !== undefined) appState.settings.homeCustomPromoDescription = homeCustomPromoDescription;
  if (homeCustomPosts !== undefined) appState.settings.homeCustomPosts = homeCustomPosts;

  saveState(appState);
  createAuditLog(operatorId, adminUser.username, adminUser.role, "Personnalisation Accueil", `Page d'accueil personnalisée par @${adminUser.username}`, req);
  res.json(appState.settings);
});

// 5.4 ADMIN DELETES CAMPAIGN DEFINITIVELY
app.delete("/api/admin/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.query;

  const adminUser = appState.users.find(u => u.id === (operatorId as string));
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Seuls les administrateurs peuvent supprimer des campagnes." });
  }

  const campIndex = appState.campaigns.findIndex(c => c.id === id);
  if (campIndex === -1) {
    return res.status(404).json({ error: "Campagne introuvable." });
  }

  const deletedCamp = appState.campaigns.splice(campIndex, 1)[0];
  
  // clean up submissions associated with deleted campaign
  appState.submissions = appState.submissions.filter(s => s.campaignId !== id);

  saveState(appState);
  createAuditLog((operatorId as string) || "system", adminUser.username, adminUser.role, "Suppression Campagne", `Campagne "${deletedCamp.title}" supprimée définitivement.`, req);
  res.json({ message: "Campagne supprimée avec succès.", campaigns: appState.campaigns });
});


// 6. SUPERADMIN (FOUNDER) & ADVANCED RBAC OPERATIONS
// Nominate / Revoke Admin roles with custom permissions
app.post("/api/founder/admin/manage", (req, res) => {
  const { targetUserId, action, operatorId, adminPermissions, customRoleTitle } = req.body;

  const founder = appState.users.find(u => u.id === operatorId);
  if (!founder || (founder.role !== "founder" && founder.role !== "admin")) {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants pour gérer les administrateurs." });
  }

  // If regular admin, check if they have createAdmins / manageRolesAndPermissions permission
  if (founder.role === "admin" && founder.id !== "user_founder") {
    const perms = founder.adminPermissions;
    if (perms && !perms.createAdmins && !perms.manageRolesAndPermissions) {
      return res.status(403).json({ error: "Vous n'avez pas l'autorisation d'administrer les rôles et permissions." });
    }
  }

  const target = appState.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: "Utilisateur cible introuvable." });

  if (target.id === founder.id && action === "demote") {
    return res.status(400).json({ error: "Interdit de rétrograder votre propre compte." });
  }

  if (action === "promote") {
    target.role = "admin";
    if (adminPermissions) {
      target.adminPermissions = adminPermissions;
    } else {
      // Default full permissions for new admin if none provided
      target.adminPermissions = {
        manageUsers: true,
        managePublications: true,
        manageVirtualGifts: true,
        manageBadges: true,
        manageApi: true,
        managePayments: true,
        manageWithdrawals: true,
        manageWallets: true,
        blockWallets: true,
        unblockWallets: true,
        manageMerchantNumbers: true,
        manageSubscriptions: true,
        manageStatistics: true,
        accessReports: true,
        viewAuditLogs: true,
        generalSettings: true,
        createAdmins: false,
        deleteAdmins: false,
        manageRolesAndPermissions: false
      };
    }
  } else if (action === "demote") {
    target.role = "participant";
    target.adminPermissions = undefined;
  } else if (action === "update_permissions") {
    if (adminPermissions) {
      target.adminPermissions = adminPermissions;
    }
  } else if (action === "suspend_admin") {
    target.isSuspended = true;
  } else if (action === "reactivate_admin") {
    target.isSuspended = false;
  }

  saveState(appState);
  createAuditLog(operatorId, founder.username, founder.role, "Gestion Admin", `Action "${action}" exécutée sur l'administrateur @${target.username}`, req);
  res.json({ user: target, users: appState.users });
});

// Wallet Blocking / Unblocking endpoint with full security checks
app.post("/api/admin/wallets/block", (req, res) => {
  const { targetUserId, operatorId, action, reason, durationDays, internalComment } = req.body;

  const operator = appState.users.find(u => u.id === operatorId);
  if (!operator || (operator.role !== "admin" && operator.role !== "founder")) {
    return res.status(403).json({ error: "Accès refusé. Privilèges administratifs requis." });
  }

  if (operator.role === "admin" && operator.id !== "user_founder") {
    const perms = operator.adminPermissions;
    if (perms) {
      if (action === "block" && !perms.blockWallets && !perms.manageWallets) {
        return res.status(403).json({ error: "Vous n'avez pas l'autorisation de bloquer les portefeuilles." });
      }
      if (action === "unblock" && !perms.unblockWallets && !perms.manageWallets) {
        return res.status(403).json({ error: "Vous n'avez pas l'autorisation de débloquer les portefeuilles." });
      }
    }
  }

  const target = appState.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: "Utilisateur cible introuvable." });

  if (action === "block") {
    target.walletBlock = {
      isBlocked: true,
      reason: reason || "Violation des conditions d'utilisation financières",
      blockedByAdminId: operator.id,
      blockedByUsername: operator.username,
      blockedAt: new Date().toISOString(),
      durationDays: durationDays ? Number(durationDays) : undefined,
      internalComment: internalComment || "Bloqué temporairement par décision administrative"
    };
    createAuditLog(operatorId, operator.username, operator.role, "Blocage Portefeuille", `Portefeuille de @${target.username} bloqué. Motif: ${reason}`, req);
  } else if (action === "unblock") {
    target.walletBlock = undefined;
    createAuditLog(operatorId, operator.username, operator.role, "Déblocage Portefeuille", `Portefeuille de @${target.username} débloqué et réactivé.`, req);
  }

  saveState(appState);
  res.json({ success: true, targetUser: target });
});

// Critical System Switches
app.post("/api/founder/settings/critical", (req, res) => {
  const { isWithdrawalFrozen, suspendedCountries, suspendedCurrencies, platformFeePercentage, merchantNumberPrice, operatorId } = req.body;

  const founder = appState.users.find(u => u.id === operatorId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Configuration interdite sans privilèges Fondateur." });
  }

  if (isWithdrawalFrozen !== undefined) appState.settings.isWithdrawalFrozen = isWithdrawalFrozen;
  if (suspendedCountries !== undefined) appState.settings.suspendedCountries = suspendedCountries;
  if (suspendedCurrencies !== undefined) appState.settings.suspendedCurrencies = suspendedCurrencies;
  if (platformFeePercentage !== undefined) appState.settings.platformFeePercentage = platformFeePercentage;
  if (merchantNumberPrice !== undefined) appState.settings.merchantNumberPrice = parseFloat(merchantNumberPrice);

  saveState(appState);
  createAuditLog(operatorId, founder.username, "founder", "Ajustement Paramètres", "Mise à jour des règles globales du système", req);
  res.json(appState.settings);
});

// Restore State from pristine backup file
app.post("/api/founder/backup/restore", (req, res) => {
  const { operatorId } = req.body;

  const founder = appState.users.find(u => u.id === operatorId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Action réservée au Super Administrateur." });
  }

  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const raw = fs.readFileSync(BACKUP_FILE, "utf-8");
      appState = JSON.parse(raw);
      saveState(appState);
      createAuditLog(operatorId, founder.username, "founder", "Restauration Base", "Base de données restaurée au point de contrôle de sauvegarde.", req);
      return res.json({ success: true, message: "Les données de l'application ont été restaurées avec succès !" });
    } else {
      return res.status(404).json({ error: "Fichier de sauvegarde introuvable." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Échec de la restauration de la base de données de Yaamaa." });
  }
});

// ==========================================
// 🛡️ MODERATION & VALIDATION CENTER API
// ==========================================
app.get("/api/moderation/files", (req, res) => {
  const { userId, category, status, search } = req.query;
  const user = appState.users.find(u => u.id === userId);
  
  if (!user || (user.role !== "admin" && user.role !== "founder")) {
    return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs autorisés." });
  }

  let files = appState.moderationFiles || [];
  
  if (category && category !== "all") {
    files = files.filter(f => f.category === category);
  }
  if (status && status !== "all") {
    files = files.filter(f => f.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    files = files.filter(f => f.title.toLowerCase().includes(q) || f.applicantUsername.toLowerCase().includes(q) || f.applicantName.toLowerCase().includes(q));
  }

  const allFiles = appState.moderationFiles || [];
  const stats = {
    totalPending: allFiles.filter(f => f.status === "pending").length,
    approved: allFiles.filter(f => f.status === "approved").length,
    rejected: allFiles.filter(f => f.status === "rejected").length,
    underReview: allFiles.filter(f => f.status === "under_review").length,
    urgent: allFiles.filter(f => f.urgency === "urgent" && f.status === "pending").length,
    flagged: allFiles.filter(f => f.urgency === "flagged" || f.status === "more_info_requested").length
  };

  res.json({ files, stats, categories: ["supplier", "deliverer", "api_integration", "account_verification", "other"] });
});

app.post("/api/moderation/files/:id/action", (req, res) => {
  const { id } = req.params;
  const { operatorId, action, status, comment, rejectionReason, assignedAdminId } = req.body;

  const operator = appState.users.find(u => u.id === operatorId);
  if (!operator || (operator.role !== "admin" && operator.role !== "founder")) {
    return res.status(403).json({ error: "Accès refusé. Privilèges administratifs requis." });
  }

  const file = (appState.moderationFiles || []).find(f => f.id === id);
  if (!file) return res.status(404).json({ error: "Dossier de modération introuvable." });

  const oldStatus = file.status;

  if (action === "update_status" && status) {
    file.status = status;
  } else if (action === "approve") {
    file.status = "approved";
    file.rejectionReason = undefined;
  } else if (action === "reject") {
    file.status = "rejected";
    file.rejectionReason = rejectionReason || "Dossier rejeté par l'administration";
  } else if (action === "request_info") {
    file.status = "more_info_requested";
    if (comment) {
      file.internalComments.push({
        id: "comm_" + Date.now(),
        adminId: operator.id,
        adminUsername: operator.username,
        text: `[Infos demandées] ${comment}`,
        createdAt: new Date().toISOString()
      });
    }
  } else if (action === "suspend") {
    file.status = "suspended";
  } else if (action === "assign" && assignedAdminId) {
    const assignedAdmin = appState.users.find(u => u.id === assignedAdminId);
    file.assignedAdminId = assignedAdminId;
    file.assignedAdminUsername = assignedAdmin ? assignedAdmin.username : "Inconnu";
  }

  if (comment && action !== "request_info") {
    file.internalComments.push({
      id: "comm_" + Date.now(),
      adminId: operator.id,
      adminUsername: operator.username,
      text: comment,
      createdAt: new Date().toISOString()
    });
  }

  file.actionHistory.unshift({
    id: "act_" + Date.now(),
    adminId: operator.id,
    adminUsername: operator.username,
    action: action,
    oldStatus,
    newStatus: file.status,
    comment: comment || rejectionReason,
    createdAt: new Date().toISOString()
  });

  createAuditLog(
    operator.id,
    operator.username,
    operator.role,
    "Modération & Validation",
    `Dossier #${file.id} (${file.title}) mis à jour. Action: ${action}, Statut: ${oldStatus} -> ${file.status}`,
    req
  );

  const applicant = appState.users.find(u => u.id === file.applicantId);
  if (applicant) {
    if (!applicant.notifications) applicant.notifications = [];
    let notifText = `Votre dossier de modération "${file.title}" a changé de statut : ${file.status}.`;
    if (file.status === "approved") notifText = `Félicitations ! Votre dossier "${file.title}" a été approuvé.`;
    else if (file.status === "rejected") notifText = `Votre dossier "${file.title}" a été refusé. Motif : ${file.rejectionReason || "Non spécifié"}.`;
    else if (file.status === "more_info_requested") notifText = `Des informations complémentaires sont requises pour votre dossier "${file.title}".`;

    applicant.notifications.unshift({
      id: "notif_mod_" + Date.now(),
      title: "Centre de Modération Yaamaa",
      desc: notifText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    });
  }

  saveState(appState);
  res.json({ success: true, file, files: appState.moderationFiles });
});



// 7. YAAMAA AI (GEMINI ENGINE BACKEND SERVICE)
app.post("/api/ai/guidance", async (req, res) => {
  const { type, payload } = req.body;
  
  if (!ai) {
    return res.json({ 
      guide: "Yaamaa AI Mode Simulation : Veuillez renseigner le secret GEMINI_API_KEY dans le menu de gauche pour intégrer notre moteur neuronal d'IA en temps réel. En attendant, optimisez votre campagne en choisissant une formulation claire, une récompense incitative d'au moins 0.15€, et en demandant des pseudonymes précis en guise de preuve."
    });
  }

  try {
    let prompt = "";
    if (type === "advertiser_create") {
      prompt = `Vous êtes un expert en marketing digital sur Yaamaa.
L'annonceur souhaite créer la campagne suivante:
Titre: "${payload.title}"
Description: "${payload.description}"
Type de mission: "${payload.type}"
Catégorie: "${payload.category}"

Optimisez le titre pour qu'il soit extrêmement captivant, réécrivez la description sous forme de liste d'étapes claires, déterminez le meilleur appel à l'action (CTA) pour maximiser les taux d'engagement, et proposez d'autres intérêts ou critères de ciblage optimaux d'audience.
Rédigez votre réponse en français professionnel, chaleureux et bien structuré au format Markdown.`;
    } else if (type === "participant_recommend") {
      prompt = `Vous êtes le recommandateur intelligent de Yaamaa AI pour les participants et créateurs de gains.
Le participant possède le profil suivant:
Pseudo: "@${payload.username}"
Niveau: ${payload.level}
Pays: "${payload.country}"
Intérêts: ${payload.interests || "technologie, divertissement, réseaux sociaux"}

Prenez en compte les campagnes actives suivantes actuellement sur notre plateforme:
${JSON.stringify(appState.campaigns.filter(c => c.status === "active"))}

Proposez-lui les 2 meilleures missions adaptées à son pays, estimez les gains totaux potentiels et donnez des astuces claires pour réussir rapidement et éviter d'être pénalisé. Rédigez en français dynamique, motivant et clair en Markdown.`;
    } else if (type === "admin_fraud_report") {
      prompt = `Vous êtes l'architecte de sécurité Yaamaa AI.
Générez un court rapport d'audit de sécurité de l'activité récente de la plateforme.
Nombre d'utilisateurs: ${appState.users.length}
Nombre de campagnes actives: ${appState.campaigns.filter(c => c.status === "active").length}
Nombre total de soumissions de preuves: ${appState.submissions.length}
Historique récent des soumissions: ${JSON.stringify(appState.submissions.slice(0, 5))}

Analysez la liste des soumissions récentes pour identifier d'éventuels comportements anormaux, robots de spam, ou multi-comptes VPN. Rédigez votre synthèse globale et vos recommandations de sécurité pour les administrateurs en français sous format Markdown. Un ton technique et pragmatique de haut niveau est attendu.`;
    } else {
      prompt = `Répondez gentiment à ce message à propos de Yaamaa: "${payload.message}". Yaamaa est une plateforme de micro-travaux (Gagnez de l'argent en accomplissant des petites tâches. Les annonceurs y créent des campagnes ciblées de likes, follow, téléchargement d'app, sondages, avis, visibilité). Répondez en français de manière concise et accueillante.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "Impossible de générer des suggestions pour le moment.";
    res.json({ guide: text });
  } catch (err: any) {
    console.error("AI Assistant general failed:", err);
    res.status(500).json({ error: "L'assistant intelligent de Yaamaa a subi une exception momentanée: " + err.message });
  }
});


// ==========================================
// 🤖 YAAMAA AI PERSONAL AGENT BACKEND API
// ==========================================

// Helper function to trigger Yaamaa AI Agent automatic response
async function triggerYaamaaAiAgent(senderId: string, recipientId: string, incomingMsg: any) {
  try {
    const sender = appState.users.find(u => u.id === senderId);
    const recipient = appState.users.find(u => u.id === recipientId);

    if (!sender || !recipient) return;

    // Check if recipient has Yaamaa AI active & enabled
    if (!recipient.yaamaaAiActive || !recipient.yaamaaAiSettings || !recipient.yaamaaAiSettings.autoReplyOn) {
      return;
    }

    // Verify online status. If explicit 'online', do not trigger. Otherwise, trigger.
    if (recipient.status === "online") {
      return;
    }

    // Verify schedule
    const settings = recipient.yaamaaAiSettings;
    if (settings.activationSchedule === "custom") {
      const currentHour = new Date().getHours();
      const start = settings.activationStartHour ?? 20;
      const end = settings.activationEndHour ?? 8;
      
      let isWithinSchedule = false;
      if (start <= end) {
        isWithinSchedule = currentHour >= start && currentHour <= end;
      } else {
        // Overrides midnight (e.g. 20h to 8h)
        isWithinSchedule = currentHour >= start || currentHour <= end;
      }
      
      if (!isWithinSchedule) return;
    }

    // Load recipient's shops and products
    const recipientShops = appState.shops?.filter(s => s.ownerId === recipient.id) || [];
    const shopProducts = appState.products?.filter(p => p.ownerId === recipient.id) || [];

    // Filter stock info if not authorized
    const cleanProducts = shopProducts.map(p => {
      const prod: any = {
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        currency: p.currency,
        shippingTime: p.shippingTime,
        termsOfSale: p.termsOfSale
      };
      if (settings.authorizesStock) {
        prod.quantityAvailable = p.quantityAvailable;
      }
      return prod;
    });

    // Conversation history if authorized
    let conversationContext = "Non partagé par l'utilisateur.";
    if (settings.authorizesHistory && appState.socialMessages) {
      const recentMessages = appState.socialMessages
        .filter(m => 
          (m.senderId === senderId && m.recipientId === recipientId) || 
          (m.senderId === recipientId && m.recipientId === senderId)
        )
        .slice(-10)
        .map(m => `[${m.senderUsername} à ${new Date(m.createdAt).toLocaleTimeString()}]: ${m.text}`);
      conversationContext = recentMessages.join("\n");
    }

    // Formulate prompt
    const prompt = `Vous êtes l'Agent Yaamaa AI, l'assistant virtuel intelligent personnel de ${recipient.name} (nom d'utilisateur: @${recipient.username}). Votre rôle de confiance est de répondre à la place de votre propriétaire car il est actuellement hors ligne ou indisponible.

Voici les consignes d'identité et de communication définies par votre propriétaire :
- Style de personnalité / Ton requis : ${settings.personality}
- Connaissances spécifiques à utiliser pour répondre : ${settings.customKnowledge || "Aucune"}
- Sujets autorisés : ${settings.authorizedTopics || "Tous les sujets polis et constructifs"}
- Sujets interdits (si le message porte sur l'un de ces sujets, refusez poliment de répondre) : ${settings.forbiddenTopics || "Aucun"}

Voici les informations sur les activités commerciales / la boutique de votre propriétaire :
${recipientShops.length > 0 ? JSON.stringify(recipientShops.map(s => ({ name: s.name, description: s.description, contact: s.contactInfo, country: s.country, region: s.region }))) : "Le propriétaire n'a pas encore configuré de boutique."}
Produits et prix autorisés en vitrine :
${cleanProducts.length > 0 ? JSON.stringify(cleanProducts) : "Aucun produit en vente."}

Voici l'historique récent des 10 derniers échanges avec ce correspondant (pour le contexte) :
${conversationContext}

Message entrant de @${sender.username} auquel vous devez répondre :
"${incomingMsg.text}"

RÈGLES ABSOLUES À RESPECTER :
1. Répondez de manière naturelle, fluide, polie et personnalisée, parfaitement adaptée au style de communication choisi.
2. Adaptez AUTOMATIQUEMENT la langue de votre réponse à celle de l'interlocuteur (s'il écrit en français, répondez en français, s'il écrit en anglais, répondez en anglais, etc.).
3. Ne divulguez pas de fausses informations. Si vous ne connaissez pas la réponse ou si les détails ne figurent pas dans vos consignes, proposez poliment d'attendre le retour de ${recipient.name}.
4. Indiquez impérativement qu'il s'agit d'une réponse automatique générée par l'IA. À la toute fin de votre message, ajoutez la signature exacte suivante sur une nouvelle ligne :
"[Réponse automatique de Yaamaa AI]"
5. Restez bref, chaleureux et professionnel.`;

    let aiText = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      aiText = response.text || "";
    }

    // If Gemini fails or isn't configured, fall back to a beautiful smart simulation reply!
    if (!aiText) {
      const txt = incomingMsg.text.toLowerCase();
      const shopName = recipientShops[0]?.name || "ma boutique";
      const contactInfo = recipientShops[0]?.contactInfo || recipient.phone || "mon profil";

      if (txt.includes("prix") || txt.includes("combien") || txt.includes("tarif") || txt.includes("acheter")) {
        if (cleanProducts.length > 0) {
          const list = cleanProducts.map(p => `- ${p.name} : ${p.price} ${p.currency}`).join("\n");
          aiText = `Bonjour ! Je suis l'assistant Yaamaa AI de ${recipient.name}. Voici les tarifs de nos produits disponibles sur ${shopName} :\n${list}\n\nN'hésitez pas à passer commande directement sur la boutique. Je reste à votre écoute !`;
        } else {
          aiText = `Bonjour ! Je suis l'assistant Yaamaa AI de ${recipient.name}. Je n'ai pas de liste de tarifs disponible pour le moment, mais mon propriétaire vous répondra dès son retour !`;
        }
      } else if (txt.includes("produit") || txt.includes("article") || txt.includes("dispo")) {
        if (cleanProducts.length > 0) {
          const list = cleanProducts.map(p => `- ${p.name} (${p.description})`).join("\n");
          aiText = `Bonjour ! Ravi de vous assister. Voici les articles actuellement disponibles dans ${shopName} :\n${list}\n\nVous pouvez les acheter directement via l'onglet Boutique de Yaamaa !`;
        } else {
          aiText = `Bonjour ! Je suis l'assistant Yaamaa AI de ${recipient.name}. Aucun produit n'est publié pour le moment, mais restez à l'écoute !`;
        }
      } else if (txt.includes("livraison") || txt.includes("delai") || txt.includes("délai")) {
        if (cleanProducts.length > 0) {
          const list = cleanProducts.map(p => `- ${p.name} : Livraison sous ${p.shippingTime}`).join("\n");
          aiText = `Bonjour ! Pour la livraison, voici nos délais moyens :\n${list}\n\nWe will ship your products very fast!`;
        } else {
          aiText = `Bonjour ! Je suis l'assistant de ${recipient.name}. Concernant la livraison, mon propriétaire vous contactera dès son retour pour convenir des modalités.`;
        }
      } else if (txt.includes("contact") || txt.includes("telephone") || txt.includes("téléphone") || txt.includes("whatsapp")) {
        aiText = `Bonjour ! Vous pouvez contacter directement mon propriétaire ${recipient.name} au numéro suivant : ${contactInfo}. Ils se feront un plaisir de vous répondre !`;
      } else {
        // General customized friendly fallback based on personality
        const toneMsg = settings.personality === "amical" || settings.personality === "enthousiaste"
          ? `Merveilleuse journée à vous ! Je suis l'assistant virtuel intelligent de ${recipient.name}. Mon propriétaire est indisponible pour le moment, mais j'ai bien enregistré votre message : "${incomingMsg.text}". Ils prendront le relais très rapidement ! ✨`
          : `Bonjour. Je suis l'assistant virtuel Yaamaa AI de ${recipient.name}. Mon propriétaire est actuellement hors ligne. Votre message a été reçu et ils vous recontacteront dans les plus brefs délais.`;
        aiText = toneMsg;
      }
      aiText += `\n\n[Réponse automatique de Yaamaa AI]`;
    }

    // Save AI message to state
    const aiMessage = {
      id: "msg_ai_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderId: recipient.id,
      senderUsername: recipient.username,
      senderAvatar: recipient.avatar,
      text: aiText,
      createdAt: new Date().toISOString(),
      recipientId: sender.id,
      readBy: [recipient.id],
      isAiReply: true,
      aiAgentOwnerId: recipient.id,
      reactions: {}
    };

    if (!appState.socialMessages) appState.socialMessages = [];
    appState.socialMessages.push(aiMessage);

    // Update stats
    if (!recipient.yaamaaAiStats) {
      recipient.yaamaaAiStats = { conversationsCount: 0, satisfactionRate: 100, responseTime: 1.2 };
    }
    recipient.yaamaaAiStats.conversationsCount += 1;

    // Add handled conversation
    const handledConv = {
      id: "handled_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderId: sender.id,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      messageId: incomingMsg.id,
      messageText: incomingMsg.text,
      aiResponseText: aiText,
      timestamp: new Date().toISOString()
    };
    recipient.yaamaaAiHandledConversations = recipient.yaamaaAiHandledConversations || [];
    recipient.yaamaaAiHandledConversations.unshift(handledConv);

    // Add notification for the recipient
    const notification = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderUsername: sender.username,
      messageSnippet: incomingMsg.text.slice(0, 50) + (incomingMsg.text.length > 50 ? "..." : ""),
      timestamp: new Date().toISOString()
    };
    recipient.yaamaaAiNotifications = recipient.yaamaaAiNotifications || [];
    recipient.yaamaaAiNotifications.unshift(notification);

    saveState(appState);
  } catch (err) {
    console.error("Yaamaa AI Agent automatic response failed:", err);
  }
}

// Endpoint to retrieve AI configuration
app.get("/api/yaamaa-ai/:userId", (req, res) => {
  const { userId } = req.params;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  // Initialize if needed
  if (!user.yaamaaAiSettings) {
    user.yaamaaAiSettings = {
      personality: "professionnelle",
      customKnowledge: "",
      authorizedTopics: "",
      forbiddenTopics: "",
      activationSchedule: "always",
      activationStartHour: 20,
      activationEndHour: 8,
      autoReplyOn: true,
      authorizesHistory: true,
      authorizesStock: true
    };
  }
  if (!user.yaamaaAiStats) {
    user.yaamaaAiStats = {
      conversationsCount: 0,
      satisfactionRate: 100,
      responseTime: 1.2
    };
  }
  if (!user.yaamaaAiHandledConversations) {
    user.yaamaaAiHandledConversations = [];
  }
  if (!user.yaamaaAiNotifications) {
    user.yaamaaAiNotifications = [];
  }
  if (!user.status) {
    user.status = "online";
  }

  res.json({
    yaamaaAiActive: !!user.yaamaaAiActive,
    yaamaaAiExpiresAt: user.yaamaaAiExpiresAt || null,
    yaamaaAiSettings: user.yaamaaAiSettings,
    yaamaaAiStats: user.yaamaaAiStats,
    yaamaaAiHandledConversations: user.yaamaaAiHandledConversations,
    yaamaaAiNotifications: user.yaamaaAiNotifications,
    status: user.status
  });
});

// Endpoint to purchase/rent or activate the AI agent (Mode Test supported too)
app.post("/api/yaamaa-ai/purchase", (req, res) => {
  const { userId, type } = req.body; // type can be "real" or "free_test"
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const cost = 5000; // 5000 XOF or equivalent in local currency
  const currency = user.currency || "XOF";

  if (type === "real") {
    if (user.wallet.available < cost) {
      return res.status(400).json({ 
        error: `Solde insuffisant. Le coût de location est de ${cost} ${currency}. Votre solde actuel est de ${user.wallet.available} ${currency}. Veuillez recharger ou utiliser l'activation Mode Test.` 
      });
    }
    user.wallet.available = parseFloat((user.wallet.available - cost).toFixed(2));
    
    // Create transaction
    const transaction = {
      id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      userId: user.id,
      type: "funded_campaign" as any, // purchase/funded campaign
      amount: -cost,
      currency: currency,
      status: "completed" as any,
      method: "Solde Portefeuille",
      details: "Location de l'Assistant Intelligent Yaamaa AI (30 Jours)",
      createdAt: new Date().toISOString()
    };
    if (!appState.transactions) appState.transactions = [];
    appState.transactions.unshift(transaction);
  }

  // Activate agent
  user.yaamaaAiActive = true;
  user.yaamaaAiExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  if (!user.yaamaaAiSettings) {
    user.yaamaaAiSettings = {
      personality: "professionnelle",
      customKnowledge: "",
      authorizedTopics: "",
      forbiddenTopics: "",
      activationSchedule: "always",
      activationStartHour: 20,
      activationEndHour: 8,
      autoReplyOn: true,
      authorizesHistory: true,
      authorizesStock: true
    };
  }
  if (!user.yaamaaAiStats) {
    user.yaamaaAiStats = {
      conversationsCount: 0,
      satisfactionRate: 100,
      responseTime: 1.2
    };
  }
  if (!user.yaamaaAiHandledConversations) user.yaamaaAiHandledConversations = [];
  if (!user.yaamaaAiNotifications) user.yaamaaAiNotifications = [];

  createAuditLog(user.id, user.username, user.role, "Activation Yaamaa AI", `Agent Yaamaa AI activé (Méthode: ${type})`, req);
  saveState(appState);

  res.json({
    success: true,
    yaamaaAiActive: true,
    yaamaaAiExpiresAt: user.yaamaaAiExpiresAt,
    wallet: user.wallet,
    yaamaaAiSettings: user.yaamaaAiSettings,
    yaamaaAiStats: user.yaamaaAiStats
  });
});

// Endpoint to update AI Settings and status
app.put("/api/yaamaa-ai/:userId", (req, res) => {
  const { userId } = req.params;
  const { settings, status } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  if (settings) {
    user.yaamaaAiSettings = {
      ...user.yaamaaAiSettings,
      ...settings
    };
  }
  if (status !== undefined) {
    user.status = status;
  }

  saveState(appState);
  res.json({
    success: true,
    yaamaaAiSettings: user.yaamaaAiSettings,
    status: user.status
  });
});

// Endpoint to evaluate handled conversations
app.post("/api/yaamaa-ai/:userId/evaluate", (req, res) => {
  const { userId } = req.params;
  const { conversationId, rating, feedback } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  const handled = user.yaamaaAiHandledConversations?.find(c => c.id === conversationId);
  if (!handled) return res.status(404).json({ error: "Conversation introuvable" });

  handled.rating = rating;
  handled.feedback = feedback;

  // Recalculate average satisfaction rate
  const ratedConvs = user.yaamaaAiHandledConversations?.filter(c => c.rating !== undefined) || [];
  if (ratedConvs.length > 0) {
    const totalStars = ratedConvs.reduce((sum, c) => sum + (c.rating || 0), 0);
    const avgStars = totalStars / ratedConvs.length;
    user.yaamaaAiStats = user.yaamaaAiStats || { conversationsCount: 0, satisfactionRate: 100, responseTime: 1.2 };
    user.yaamaaAiStats.satisfactionRate = Math.round((avgStars / 5) * 100);
  }

  saveState(appState);
  res.json({
    success: true,
    yaamaaAiHandledConversations: user.yaamaaAiHandledConversations,
    yaamaaAiStats: user.yaamaaAiStats
  });
});

// Endpoint to clear AI notifications
app.post("/api/yaamaa-ai/:userId/clear-notifications", (req, res) => {
  const { userId } = req.params;
  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  user.yaamaaAiNotifications = [];
  saveState(appState);
  res.json({ success: true });
});

// ==========================================
// 🛒 BOUTIQUE & MARKETPLACE BACKEND API ROUTES
// ==========================================

app.get("/api/shops", (req, res) => {
  res.json(appState.shops || []);
});

app.post("/api/shops", (req, res) => {
  const { ownerId, name, logo, description, country, region, commune, cityOrVillage, contactInfo } = req.body;
  if (!ownerId || !name || !description || !country || !contactInfo) {
    return res.status(400).json({ error: "Tous les champs de la boutique sont obligatoires." });
  }

  const user = appState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: "Utilisateur / Propriétaire introuvable." });

  const newShop: Shop = {
    id: "shop_" + Date.now(),
    ownerId,
    ownerUsername: user.username,
    name,
    logo: logo || "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=150&auto=format&fit=crop",
    description,
    country,
    region: region || "",
    commune: commune || "",
    cityOrVillage: cityOrVillage || "",
    contactInfo,
    createdAt: new Date().toISOString()
  };

  if (!appState.shops) appState.shops = [];
  appState.shops.push(newShop);
  saveState(appState);
  createAuditLog(ownerId, user.username, user.role, "Création Boutique", `Boutique ouverte : ${name}`, req);
  res.json(newShop);
});

app.get("/api/products", (req, res) => {
  res.json(appState.products || []);
});

app.post("/api/products", (req, res) => {
  const { 
    shopId, ownerId, name, category, description, targetCountries, targetRegions, targetCommunes,
    region, commune, cityOrVillage,
    images, videoUrl, courseLink, downloadableFile, downloadableFileName, quantityAvailable, price, currency, shippingTime, termsOfSale 
  } = req.body;

  if (!shopId || !ownerId || !name || !category || !price || !currency) {
    return res.status(400).json({ error: "Paramètres de produit indispensables manquants." });
  }

  const user = appState.users.find(u => u.id === ownerId);
  const shop = appState.shops?.find(s => s.id === shopId);
  if (!user || !shop) return res.status(404).json({ error: "Boutique ou utilisateur introuvable." });

  const newProduct: Product = {
    id: "prod_" + Date.now(),
    shopId,
    shopName: shop.name,
    ownerId,
    name,
    category,
    description: description || "",
    targetCountries: Array.isArray(targetCountries) ? targetCountries : [shop.country],
    targetRegions: Array.isArray(targetRegions) ? targetRegions : (shop.region ? [shop.region] : []),
    targetCommunes: Array.isArray(targetCommunes) ? targetCommunes : (shop.commune ? [shop.commune] : []),
    region: region || shop.region || "",
    commune: commune || shop.commune || "",
    cityOrVillage: cityOrVillage || shop.cityOrVillage || "",
    images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=400&auto=format&fit=crop"],
    videoUrl: videoUrl || "",
    courseLink: courseLink || "",
    downloadableFile: downloadableFile || "",
    downloadableFileName: downloadableFileName || "",
    quantityAvailable: Number(quantityAvailable) || 0,
    price: parseFloat(Number(price).toFixed(2)),
    currency,
    shippingTime: shippingTime || "Livrable",
    salesCount: 0,
    rating: 5.0,
    termsOfSale: termsOfSale || "",
    isApproved: true,
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  if (!appState.products) appState.products = [];
  appState.products.push(newProduct);
  saveState(appState);
  createAuditLog(ownerId, user.username, user.role, "Ajout Produit", `Produit publié : ${name} dans ${shop.name}`, req);
  res.json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { 
    ownerId, name, category, description, targetCountries, targetRegions, targetCommunes,
    region, commune, cityOrVillage,
    images, videoUrl, courseLink, downloadableFile, downloadableFileName, quantityAvailable, price, currency, shippingTime, termsOfSale 
  } = req.body;

  const productIndex = appState.products?.findIndex(p => p.id === id);
  if (productIndex === undefined || productIndex === -1) {
    return res.status(404).json({ error: "Produit non trouvé." });
  }

  const product = appState.products[productIndex];
  if (product.ownerId !== ownerId) {
    return res.status(403).json({ error: "Action non autorisée. Vous n'êtes pas le propriétaire de ce produit." });
  }

  const user = appState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

  const updatedProduct = {
    ...product,
    name: name || product.name,
    category: category || product.category,
    description: description !== undefined ? description : product.description,
    targetCountries: Array.isArray(targetCountries) ? targetCountries : product.targetCountries,
    targetRegions: Array.isArray(targetRegions) ? targetRegions : product.targetRegions,
    targetCommunes: Array.isArray(targetCommunes) ? targetCommunes : product.targetCommunes,
    region: region !== undefined ? region : product.region,
    commune: commune !== undefined ? commune : product.commune,
    cityOrVillage: cityOrVillage !== undefined ? cityOrVillage : product.cityOrVillage,
    images: Array.isArray(images) && images.length > 0 ? images : product.images,
    videoUrl: videoUrl !== undefined ? videoUrl : product.videoUrl,
    courseLink: courseLink !== undefined ? courseLink : product.courseLink,
    downloadableFile: downloadableFile !== undefined ? downloadableFile : product.downloadableFile,
    downloadableFileName: downloadableFileName !== undefined ? downloadableFileName : product.downloadableFileName,
    quantityAvailable: quantityAvailable !== undefined ? Number(quantityAvailable) : product.quantityAvailable,
    price: price !== undefined ? parseFloat(Number(price).toFixed(2)) : product.price,
    currency: currency || product.currency,
    shippingTime: shippingTime !== undefined ? shippingTime : product.shippingTime,
    termsOfSale: termsOfSale !== undefined ? termsOfSale : product.termsOfSale
  };

  appState.products[productIndex] = updatedProduct;
  saveState(appState);
  createAuditLog(ownerId, user.username, user.role, "Modification Produit", `Produit mis à jour : ${updatedProduct.name}`, req);
  res.json(updatedProduct);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { ownerId } = req.body;

  const productIndex = appState.products?.findIndex(p => p.id === id);
  if (productIndex === undefined || productIndex === -1) {
    return res.status(404).json({ error: "Produit non trouvé." });
  }

  const product = appState.products[productIndex];
  if (product.ownerId !== ownerId) {
    return res.status(403).json({ error: "Action non autorisée. Vous n'êtes pas le propriétaire de ce produit." });
  }

  const user = appState.users.find(u => u.id === ownerId);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

  appState.products.splice(productIndex, 1);
  saveState(appState);
  createAuditLog(ownerId, user.username, user.role, "Suppression Produit", `Produit supprimé : ${product.name}`, req);
  res.json({ success: true });
});

// ============================================
// SMART RECOMMENDATIONS & PRODUCT BOOST ENDPOINTS
// ============================================

// Track product view and behavior for AI recommendation
app.post("/api/products/:id/track-view", (req, res) => {
  const { id } = req.params;
  const { userId, durationSeconds = 5 } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  const product = appState.products?.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: "Produit introuvable" });

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  if (!user.viewHistory) user.viewHistory = [];
  user.viewHistory.unshift({
    productId: product.id,
    category: product.category,
    viewedAt: new Date().toISOString(),
    durationSeconds: Number(durationSeconds) || 5
  });

  if (!user.categoryInterests) user.categoryInterests = {};
  const currentWeight = user.categoryInterests[product.category] || 0;
  user.categoryInterests[product.category] = currentWeight + Math.max(1, Math.floor(durationSeconds / 5));

  saveState(appState);
  res.json({ success: true });
});

// Track product click (for sponsored ads)
app.post("/api/products/:id/click", (req, res) => {
  const { id } = req.params;
  const product = appState.products?.find(p => p.id === id);
  if (product) {
    if (!appState.productBoostCampaigns) appState.productBoostCampaigns = [];
    const boost = appState.productBoostCampaigns.find(b => b.productId === id && b.status === "active");
    if (boost) {
      boost.clicks = (boost.clicks || 0) + 1;
      boost.impressions = (boost.impressions || 0) + 1;
      if (boost.impressions > 0) {
        // ctr calculation
      }
    }
    saveState(appState);
  }
  res.json({ success: true });
});

// Seller boosts a product
app.post("/api/products/boost", (req, res) => {
  const { 
    productId, sellerId, title, description, budget, durationDays, estimatedReach,
    targetCategory, targetCountry, targetRegion, targetInterests, targetAgeRange 
  } = req.body;

  const seller = appState.users.find(u => u.id === sellerId);
  const product = appState.products?.find(p => p.id === productId);

  if (!seller || !product) {
    return res.status(404).json({ error: "Vendeur ou produit introuvable." });
  }

  const cost = parseFloat(budget) || 10;
  if (seller.wallet.available < cost) {
    return res.status(400).json({ error: "Solde insuffisant dans votre portefeuille pour financer ce boost publicitaire." });
  }

  // Deduct budget from seller wallet
  seller.wallet.available = parseFloat((seller.wallet.available - cost).toFixed(2));

  // Add transaction
  if (!appState.transactions) appState.transactions = [];
  appState.transactions.unshift({
    id: "tx_boost_" + Date.now(),
    userId: seller.id,
    type: "funded_campaign",
    amount: cost,
    currency: product.currency || "FCFA",
    status: "completed",
    method: "Portefeuille Yaamaa",
    details: `Boost publicitaire pour le produit : ${product.name}`,
    createdAt: new Date().toISOString()
  });

  const endDate = new Date(Date.now() + (Number(durationDays) || 7) * 24 * 60 * 60 * 1000).toISOString();

  const newBoost: ProductBoostCampaign = {
    id: "boost_" + Date.now(),
    productId: product.id,
    productName: product.name,
    productImage: product.images?.[0] || "",
    sellerId: seller.id,
    sellerUsername: seller.username,
    title: title || `Promotion Sponsorisée : ${product.name}`,
    description: description || product.description,
    budget: cost,
    currency: product.currency || "FCFA",
    durationDays: Number(durationDays) || 7,
    estimatedReach: Number(estimatedReach) || 25000,
    targetCategory: targetCategory || product.category,
    targetCountry: targetCountry || product.targetCountries?.[0] || seller.country,
    targetRegion: targetRegion || "",
    targetInterests: Array.isArray(targetInterests) ? targetInterests : ["Shopping", "Mode", "High-Tech"],
    targetAgeRange: targetAgeRange || "18-45",
    impressions: Math.floor(Math.random() * 500) + 100,
    clicks: Math.floor(Math.random() * 50) + 10,
    salesGenerated: 0,
    revenueGenerated: 0,
    status: "active",
    createdAt: new Date().toISOString(),
    endDate,
    adminBoosted: false
  };

  if (!appState.productBoostCampaigns) appState.productBoostCampaigns = [];
  appState.productBoostCampaigns.unshift(newBoost);

  saveState(appState);
  createAuditLog(seller.id, seller.username, seller.role, "Boost Produit", `Campagne publicitaire lancée pour ${product.name} (Budget: ${cost})`, req);
  res.json({ success: true, boost: newBoost });
});

// Admin manual boost
app.post("/api/admin/boost-product", (req, res) => {
  const { adminId, productId, budget, durationDays, estimatedReach, targetCategory, targetCountry } = req.body;
  const admin = appState.users.find(u => u.id === adminId);
  if (!admin || (admin.role !== "admin" && admin.role !== "founder")) {
    return res.status(403).json({ error: "Accès refusé. Réservé aux administrateurs." });
  }

  const product = appState.products?.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const endDate = new Date(Date.now() + (Number(durationDays) || 7) * 24 * 60 * 60 * 1000).toISOString();

  const adminBoost: ProductBoostCampaign = {
    id: "boost_admin_" + Date.now(),
    productId: product.id,
    productName: product.name,
    productImage: product.images?.[0] || "",
    sellerId: product.ownerId,
    sellerUsername: product.shopName,
    title: `Sponsorisé Officiel Yaamaa : ${product.name}`,
    description: product.description,
    budget: parseFloat(budget) || 50,
    currency: product.currency || "FCFA",
    durationDays: Number(durationDays) || 7,
    estimatedReach: Number(estimatedReach) || 50000,
    targetCategory: targetCategory || product.category,
    targetCountry: targetCountry || "Tous",
    targetInterests: ["Tous", "Tendance", "Offre Spéciale"],
    targetAgeRange: "18-65",
    impressions: 1200,
    clicks: 180,
    salesGenerated: 2,
    revenueGenerated: product.price * 2,
    status: "active",
    createdAt: new Date().toISOString(),
    endDate,
    adminBoosted: true
  };

  if (!appState.productBoostCampaigns) appState.productBoostCampaigns = [];
  appState.productBoostCampaigns.unshift(adminBoost);

  saveState(appState);
  createAuditLog(admin.id, admin.username, admin.role, "Boost Admin", `Boost manuel appliqué au produit ${product.name} par l'administration`, req);
  res.json({ success: true, boost: adminBoost });
});

// Get all product boost campaigns
app.get("/api/product-boosts", (req, res) => {
  res.json(appState.productBoostCampaigns || []);
});

// Update boost status
app.put("/api/product-boosts/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, adminId } = req.body;
  const boost = appState.productBoostCampaigns?.find(b => b.id === id);
  if (!boost) return res.status(404).json({ error: "Campagne de boost introuvable." });

  boost.status = status;
  saveState(appState);
  res.json({ success: true, boost });
});

// Admin Ad Packs CRUD
app.get("/api/admin/ad-packs", (req, res) => {
  res.json(appState.settings.adPacks || DEFAULT_SETTINGS.adPacks || []);
});

app.post("/api/admin/ad-packs", (req, res) => {
  const { name, description, price, currency, durationDays, guaranteedImpressions, estimatedViews, estimatedClicks, estimatedReach, category, diffusionType, priorityLevel, isActive } = req.body;
  if (!appState.settings.adPacks) appState.settings.adPacks = [];
  const newPack: AdPack = {
    id: "pack_" + Date.now(),
    name: name || "Nouveau Pack",
    description: description || "",
    price: parseFloat(price) || 5000,
    currency: currency || "FCFA",
    durationDays: parseInt(durationDays) || 7,
    guaranteedImpressions: parseInt(guaranteedImpressions) || 10000,
    estimatedViews: parseInt(estimatedViews) || 500,
    estimatedClicks: parseInt(estimatedClicks) || 50,
    estimatedReach: parseInt(estimatedReach) || 15000,
    category: category || "Général",
    diffusionType: diffusionType || "standard",
    priorityLevel: parseInt(priorityLevel) || 1,
    isActive: isActive !== false
  };
  appState.settings.adPacks.push(newPack);
  saveState(appState);
  res.json({ success: true, pack: newPack });
});

app.put("/api/admin/ad-packs/:id", (req, res) => {
  const { id } = req.params;
  const packs = appState.settings.adPacks || DEFAULT_SETTINGS.adPacks || [];
  const pack = packs.find(p => p.id === id);
  if (!pack) return res.status(404).json({ error: "Pack introuvable." });
  Object.assign(pack, req.body);
  saveState(appState);
  res.json({ success: true, pack });
});

app.delete("/api/admin/ad-packs/:id", (req, res) => {
  const { id } = req.params;
  if (!appState.settings.adPacks) appState.settings.adPacks = DEFAULT_SETTINGS.adPacks || [];
  appState.settings.adPacks = appState.settings.adPacks.filter(p => p.id !== id);
  saveState(appState);
  res.json({ success: true });
});

// Admin Campaign Types CRUD
app.get("/api/admin/campaign-types", (req, res) => {
  res.json(appState.settings.campaignTypes || DEFAULT_SETTINGS.campaignTypes || []);
});

app.post("/api/admin/campaign-types", (req, res) => {
  const { name, objective, description, defaultBudget, defaultDuration, isAvailable } = req.body;
  if (!appState.settings.campaignTypes) appState.settings.campaignTypes = [];
  const newType: CampaignTypeConfig = {
    id: "camp_type_" + Date.now(),
    name: name || "Nouveau Type",
    objective: objective || "views",
    description: description || "",
    defaultBudget: parseFloat(defaultBudget) || 5000,
    defaultDuration: parseInt(defaultDuration) || 7,
    isAvailable: isAvailable !== false
  };
  appState.settings.campaignTypes.push(newType);
  saveState(appState);
  res.json({ success: true, campaignType: newType });
});

app.put("/api/admin/campaign-types/:id", (req, res) => {
  const { id } = req.params;
  const types = appState.settings.campaignTypes || DEFAULT_SETTINGS.campaignTypes || [];
  const ct = types.find(t => t.id === id);
  if (!ct) return res.status(404).json({ error: "Type de campagne introuvable." });
  Object.assign(ct, req.body);
  saveState(appState);
  res.json({ success: true, campaignType: ct });
});

app.delete("/api/admin/campaign-types/:id", (req, res) => {
  const { id } = req.params;
  if (!appState.settings.campaignTypes) appState.settings.campaignTypes = DEFAULT_SETTINGS.campaignTypes || [];
  appState.settings.campaignTypes = appState.settings.campaignTypes.filter(t => t.id !== id);
  saveState(appState);
  res.json({ success: true });
});

// Admin Ad Settings
app.get("/api/admin/ad-settings", (req, res) => {
  res.json(appState.settings.adSettings || DEFAULT_SETTINGS.adSettings || { maxSponsoredPerSession: 3, sponsoredOrganicRatio: 25, autoApproval: true, antiSpamEnabled: true });
});

app.put("/api/admin/ad-settings", (req, res) => {
  if (!appState.settings.adSettings) appState.settings.adSettings = { maxSponsoredPerSession: 3, sponsoredOrganicRatio: 25, autoApproval: true, antiSpamEnabled: true };
  Object.assign(appState.settings.adSettings, req.body);
  saveState(appState);
  res.json({ success: true, adSettings: appState.settings.adSettings });
});

// Smart Recommendation Engine (Alibaba / TikTok / Facebook inspired)
app.get("/api/recommendations/:userId", (req, res) => {
  const { userId } = req.params;
  const user = appState.users.find(u => u.id === userId);
  const products = appState.products || [];
  const activeBoosts = (appState.productBoostCampaigns || []).filter(b => b.status === "active");

  // Calculate product scores (Ranking Algorithm)
  // Factors: views, likes, favorites, cartAdds, sales, rating, conversion rate, recency, regional popularity
  const scoredProducts = products.filter(p => p.isApproved && !p.isBanned).map(prod => {
    const views = Math.max(1, prod.salesCount * 5 + 10);
    const likes = prod.salesCount * 2 + 5;
    const favorites = prod.salesCount * 3 + 2;
    const cartAdds = prod.salesCount * 4 + 3;
    const purchases = prod.salesCount;
    const rating = prod.rating || 5.0;
    const conversionRate = purchases / views;
    
    // Freshness (days since creation)
    const daysOld = Math.max(0, (Date.now() - new Date(prod.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
    const freshnessBonus = Math.max(0, 20 - daysOld * 2);

    let baseScore = (views * 0.5) + (likes * 2) + (favorites * 3) + (cartAdds * 4) + (purchases * 15) + (rating * 10) + (conversionRate * 100) + freshnessBonus;

    // Personalization boost if user has category interests or view history
    if (user) {
      if (user.categoryInterests && user.categoryInterests[prod.category]) {
        baseScore += user.categoryInterests[prod.category] * 20;
      }
      if (user.country && prod.targetCountries?.includes(user.country)) {
        baseScore += 50;
      }
    }

    // Check if boosted
    const isBoosted = activeBoosts.some(b => b.productId === prod.id);
    if (isBoosted) {
      baseScore += 300; // Sponsored boost priority
    }

    return {
      ...prod,
      computedScore: baseScore,
      isSponsored: isBoosted
    };
  });

  scoredProducts.sort((a, b) => b.computedScore - a.computedScore);

  // Categorize recommendations
  const sponsored = scoredProducts.filter(p => p.isSponsored);
  const personalized = user && user.categoryInterests && Object.keys(user.categoryInterests).length > 0
    ? scoredProducts.filter(p => user.categoryInterests![p.category] && user.categoryInterests![p.category] > 0)
    : scoredProducts.slice(0, 6);

  const trending = scoredProducts.slice(0, 8);
  const similarToRecent = user?.viewHistory && user.viewHistory.length > 0
    ? scoredProducts.filter(p => p.category === user.viewHistory![0].category)
    : scoredProducts.slice(2, 8);

  res.json({
    personalized: personalized.length > 0 ? personalized : scoredProducts.slice(0, 6),
    sponsored,
    trending,
    similarToRecent,
    allScored: scoredProducts
  });
});


// Moderate or block product
app.post("/api/admin/products/moderate", (req, res) => {
  const { productId, action, operatorId } = req.body;
  const product = appState.products?.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produit non trouvé." });

  const opUser = appState.users.find(u => u.id === operatorId);
  if (!opUser || (opUser.role !== "admin" && opUser.role !== "founder")) {
    return res.status(403).json({ error: "Permissions de modération insuffisantes." });
  }

  if (action === "ban") {
    product.isBanned = true;
  } else if (action === "unban") {
    product.isBanned = false;
  } else if (action === "approve") {
    product.isApproved = true;
  } else if (action === "disapprove") {
    product.isApproved = false;
  }

  saveState(appState);
  createAuditLog(operatorId, opUser.username, opUser.role, "Modération Produit", `Produit ID ${productId} modéré: ${action}`, req);
  res.json(product);
});

app.get("/api/orders", (req, res) => {
  res.json(appState.orders || []);
});

app.post("/api/orders", (req, res) => {
  const { 
    productId, quantity, buyerId, buyerUsername, shippingAddress, 
    phoneNumber, email, paymentMethod 
  } = req.body;

  if (!productId || !quantity || !buyerId || !buyerUsername || !paymentMethod) {
    return res.status(400).json({ error: "Informations d'achat incomplètes." });
  }

  const pList = appState.products || [];
  const product = pList.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produit non trouvé." });

  if (product.quantityAvailable < quantity && product.category === "physical") {
    return res.status(400).json({ error: "La quantité en stock est insuffisante pour honorer cette commande." });
  }

  const buyer = appState.users.find(u => u.id === buyerId);
  if (!buyer) return res.status(404).json({ error: "Acheteur introuvable." });

  const totalPrice = product.price * quantity;

  // Escrow Wallet deduction logic
  if (paymentMethod === "Wallet Yaamaa" || paymentMethod === "Wallet Yaamaa") {
    if (buyer.wallet.available < totalPrice) {
      return res.status(400).json({ error: "Le solde de votre Wallet Yaamaa est insuffisant pour finaliser cet achat." });
    }
    buyer.wallet.available = parseFloat((buyer.wallet.available - totalPrice).toFixed(2));
  }

  // Update physical stock if quantity is finite
  if (product.category === "physical") {
    product.quantityAvailable -= quantity;
  }

  const orderId = "order_" + Date.now();
  const newOrder: Order = {
    id: orderId,
    productId,
    productName: product.name,
    productImage: product.images[0] || "https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=400&auto=format&fit=crop",
    shopId: product.shopId,
    shopName: product.shopName,
    sellerId: product.ownerId,
    buyerId,
    buyerUsername,
    quantity,
    totalPrice,
    currency: product.currency,
    shippingAddress: shippingAddress || "Numérique",
    phoneNumber: phoneNumber || "",
    email: email || "",
    paymentMethod,
    status: "paid_escrow", // straight to escrow status (funds locked)
    createdAt: new Date().toISOString()
  };

  // Add transactional log for buyer
  const newTx: WalletTransaction = {
    id: "tx_order_" + Date.now(),
    userId: buyerId,
    type: "withdraw",
    amount: totalPrice,
    currency: product.currency,
    status: "completed",
    method: paymentMethod,
    details: `Achat Marketplace ${quantity}x - Bloqué en Escrow - Commande #${orderId}`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(newTx);

  if (!appState.orders) appState.orders = [];
  appState.orders.push(newOrder);
  saveState(appState);
  createAuditLog(buyerId, buyerUsername, buyer.role, "Achat Escrow", `Achat #${orderId}: ${quantity}x ${product.name} (${totalPrice} ${product.currency})`, req);
  res.json(newOrder);
});

// --- MULTI-VENDOR CART & AUTOMATED PAYMENT SPLITTING SYSTEM ---

app.get("/api/multivendor-orders", (req, res) => {
  res.json(appState.multiVendorOrders || []);
});

app.post("/api/multivendor-orders", (req, res) => {
  const { buyerId, buyerUsername, deliveryAddress, items, paymentMethod } = req.body;
  if (!buyerId || !buyerUsername || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
    return res.status(400).json({ error: "Données de commande multi-vendeurs incomplètes." });
  }

  const buyer = appState.users.find(u => u.id === buyerId);
  if (!buyer) return res.status(404).json({ error: "Acheteur introuvable." });

  const vendorGroups: Record<string, { sellerId: string; shopId: string; shopName: string; items: CartItem[]; subtotal: number; deliveryFee: number }> = {};
  
  let subtotalAll = 0;
  let totalDeliveryFees = 0;
  let totalDiscounts = 0;
  const currency = items[0]?.currency || "XOF";

  for (const item of items) {
    const product = (appState.products || []).find(p => p.id === item.productId);
    if (!product) {
      return res.status(404).json({ error: `Produit introuvable: ${item.productName}` });
    }
    if (product.quantityAvailable < item.quantity && product.category === "physical") {
      return res.status(400).json({ error: `Stock insuffisant pour le produit: ${product.name}` });
    }

    const lineSubtotal = item.unitPrice * item.quantity;
    subtotalAll += lineSubtotal;
    const fee = item.deliveryFee || 0;
    totalDeliveryFees += fee;
    const disc = item.discountAmount || 0;
    totalDiscounts += disc;

    const sellerId = product.ownerId;
    if (!vendorGroups[sellerId]) {
      vendorGroups[sellerId] = {
        sellerId,
        shopId: product.shopId,
        shopName: product.shopName,
        items: [],
        subtotal: 0,
        deliveryFee: 0
      };
    }
    vendorGroups[sellerId].items.push({
      ...item,
      unitPrice: product.price,
      currency: product.currency,
      lineTotal: lineSubtotal
    });
    vendorGroups[sellerId].subtotal += lineSubtotal;
    vendorGroups[sellerId].deliveryFee += fee;
  }

  const finalAmount = parseFloat((subtotalAll + totalDeliveryFees - totalDiscounts).toFixed(2));

  if (paymentMethod === "Wallet Yaamaa" || paymentMethod === "Wallet") {
    if (buyer.wallet.available < finalAmount) {
      return res.status(400).json({ error: `Solde Yaamaa insuffisant (${buyer.wallet.available} ${currency}) pour régler le panier de ${finalAmount} ${currency}.` });
    }
    buyer.wallet.available = parseFloat((buyer.wallet.available - finalAmount).toFixed(2));
  }

  for (const item of items) {
    const product = (appState.products || []).find(p => p.id === item.productId);
    if (product && product.category === "physical") {
      product.quantityAvailable -= item.quantity;
      product.salesCount = (product.salesCount || 0) + item.quantity;
    }
  }

  const orderId = "mv_order_" + Date.now();
  const feePct = appState.settings.platformFeePercentage || 10;

  const vendorSubOrders: VendorSubOrder[] = [];
  const splitTransactionLogs: any[] = [];

  for (const sellerId of Object.keys(vendorGroups)) {
    const vg = vendorGroups[sellerId];
    const subOrderId = "sub_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const commissionAmount = parseFloat((vg.subtotal * (feePct / 100)).toFixed(2));
    const sellerPayout = parseFloat((vg.subtotal - commissionAmount).toFixed(2));

    vendorSubOrders.push({
      subOrderId,
      sellerId,
      shopId: vg.shopId,
      shopName: vg.shopName,
      items: vg.items,
      subtotal: vg.subtotal,
      deliveryFee: vg.deliveryFee,
      commissionAmount,
      sellerPayout,
      status: "received",
      updatedAt: new Date().toISOString()
    });

    splitTransactionLogs.push({
      id: "split_tx_" + Math.random().toString(36).substring(2, 9),
      sellerId,
      grossAmount: vg.subtotal,
      commissionDeducted: commissionAmount,
      netCredited: sellerPayout,
      timestamp: new Date().toISOString(),
      status: "pending"
    });
  }

  const newMultiOrder: MultiVendorOrder = {
    id: orderId,
    buyerId,
    buyerUsername,
    deliveryAddress,
    paymentMethod,
    subtotal: subtotalAll,
    totalDeliveryFees,
    totalDiscounts,
    totalTax: 0,
    finalAmount,
    currency,
    vendorSubOrders,
    splitTransactionLogs,
    status: "paid_escrow",
    createdAt: new Date().toISOString()
  };

  const buyerTx: WalletTransaction = {
    id: "tx_mv_" + Date.now(),
    userId: buyerId,
    type: "withdraw",
    amount: finalAmount,
    currency,
    status: "completed",
    method: paymentMethod,
    details: `Panier Multi-Vendeurs Commande #${orderId} (${items.length} articles, ${Object.keys(vendorGroups).length} vendeurs)`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(buyerTx);

  if (!appState.multiVendorOrders) appState.multiVendorOrders = [];
  appState.multiVendorOrders.unshift(newMultiOrder);

  saveState(appState);
  createAuditLog(buyerId, buyerUsername, buyer.role, "Achat Panier Multi-Vendeurs", `Commande #${orderId}: ${finalAmount} ${currency} répartie entre ${Object.keys(vendorGroups).length} vendeurs`, req);
  res.json(newMultiOrder);
});

app.put("/api/multivendor-orders/:id/sub-orders/:subOrderId/status", (req, res) => {
  const { id, subOrderId } = req.params;
  const { status, trackingNumber, userId } = req.body;

  const orders = appState.multiVendorOrders || [];
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Commande multi-vendeurs introuvable." });

  const subOrder = order.vendorSubOrders.find(s => s.subOrderId === subOrderId);
  if (!subOrder) return res.status(404).json({ error: "Sous-commande vendeur introuvable." });

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur non autorisé." });

  if (user.role !== "admin" && subOrder.sellerId !== userId && order.buyerId !== userId) {
    return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier cette sous-commande." });
  }

  const oldStatus = subOrder.status;
  subOrder.status = status;
  if (trackingNumber) subOrder.trackingNumber = trackingNumber;
  subOrder.updatedAt = new Date().toISOString();

  if ((status === "delivered" || (status as string) === "completed") && (oldStatus as string) !== "delivered" && (oldStatus as string) !== "completed") {
    const seller = appState.users.find(u => u.id === subOrder.sellerId);
    if (seller) {
      const netPayout = subOrder.sellerPayout;
      seller.wallet.available = parseFloat((seller.wallet.available + netPayout).toFixed(2));
      seller.wallet.totalEarned = parseFloat((seller.wallet.totalEarned + netPayout).toFixed(2));

      const sellerTx: WalletTransaction = {
        id: "tx_sale_mv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
        userId: seller.id,
        type: "earn",
        amount: netPayout,
        currency: order.currency,
        status: "completed",
        method: "Wallet Yaamaa",
        details: `Vente Panier Multi-Vendeurs (Escrow Libéré) - Commande #${order.id} (Sous-commande #${subOrderId})`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(sellerTx);

      const splitLog = order.splitTransactionLogs.find(s => s.sellerId === subOrder.sellerId);
      if (splitLog) {
        splitLog.status = "success";
      }

      if (seller.referredBy) {
        const inviter = appState.users.find(u => u.id === seller.referredBy || u.referralCode === seller.referredBy);
        if (inviter && inviter.merchantNumber) {
          const refComm = parseFloat((subOrder.subtotal * 0.05).toFixed(2));
          inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
          inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
          appState.transactions.unshift({
            id: "tx_ref_sell_" + Date.now(),
            userId: inviter.id,
            type: "earn",
            amount: refComm,
            currency: order.currency,
            status: "completed",
            method: "Affiliation",
            details: `Commission Vente Boutique (5%) - Filleul @${seller.username}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }

  saveState(appState);
  createAuditLog(userId, user.username, user.role, "Mise à jour Commande Multi-Vendeurs", `Sous-commande #${subOrderId} (Vendeur: ${subOrder.sellerId}) passée à ${status}`, req);
  res.json(order);
});

// Mark as shipped by seller
app.post("/api/orders/:id/ship", (req, res) => {
  const { id } = req.params;
  const { trackingNumber, sellerId } = req.body;

  const ordersList = appState.orders || [];
  const order = ordersList.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  if (order.sellerId !== sellerId) {
    return res.status(403).json({ error: "Seul le vendeur de cette boutique est autorisé à expédier ce produit." });
  }

  order.status = "shipped";
  order.trackingNumber = trackingNumber || "Colis Expédié";
  order.updatedAt = new Date().toISOString();

  saveState(appState);
  
  const seller = appState.users.find(u => u.id === sellerId);
  const sellerUsername = seller ? seller.username : "Vendeur";
  createAuditLog(sellerId, sellerUsername, seller?.role || "participant", "Expédition Commande", `Commande #${id} marquée expédiée. Suivi: ${order.trackingNumber}`, req);
  res.json(order);
});

// Confirm receipt by buyer
app.post("/api/orders/:id/confirm", (req, res) => {
  const { id } = req.params;
  const { buyerId } = req.body;

  const ordersList = appState.orders || [];
  const order = ordersList.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  if (order.buyerId !== buyerId) {
    return res.status(403).json({ error: "Erreur, seul l'acheteur est autorisé à confirmer la réception." });
  }

  if (order.status === "completed") {
    return res.status(400).json({ error: "Cette commande a déjà été clôturée." });
  }

  const seller = appState.users.find(u => u.id === order.sellerId);
  const buyer = appState.users.find(u => u.id === buyerId);
  if (!seller) return res.status(404).json({ error: "Vendeur introuvable, impossible de reverser les fonds." });

  // Calculate platform fee and transfer funds
  const feePct = appState.settings.platformFeePercentage || 10;
  const commission = parseFloat((order.totalPrice * (feePct / 100)).toFixed(2));
  const sellerNetPayout = parseFloat((order.totalPrice - commission).toFixed(2));

  // Release funds to seller wallet
  seller.wallet.available = parseFloat((seller.wallet.available + sellerNetPayout).toFixed(2));
  seller.wallet.totalEarned = parseFloat((seller.wallet.totalEarned + sellerNetPayout).toFixed(2));

  order.status = "completed";
  order.updatedAt = new Date().toISOString();

  // Create earning transaction log for Seller
  const sellerTx: WalletTransaction = {
    id: "tx_sale_" + Date.now(),
    userId: order.sellerId,
    type: "earn",
    amount: sellerNetPayout,
    currency: order.currency,
    status: "completed",
    method: "Wallet Yaamaa",
    details: `Vente Boutique (Escrow Libéré) - Commande #${id} - Comm: ${commission} ${order.currency}`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(sellerTx);

  // Referral Commission on Seller's Sale (5%)
  if (seller.referredBy) {
    const inviter = appState.users.find(u => u.id === seller.referredBy || u.referralCode === seller.referredBy);
    if (inviter && inviter.merchantNumber) {
      const refComm = parseFloat((order.totalPrice * 0.05).toFixed(2)) || 0.1;
      inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
      inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
      inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + refComm).toFixed(2));

      const refTx: WalletTransaction = {
        id: "tx_sale_ref_" + Date.now(),
        userId: inviter.id,
        type: "referral_bonus",
        amount: refComm,
        currency: inviter.currency,
        status: "completed",
        method: "Yaamaa Referral",
        details: `Commission Vente Boutique (5%) - Vente de votre filleul @${seller.username} : "${order.productName}"`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(refTx);
    }
  }

  // Referral Commission on Buyer's Purchase (3%)
  if (buyer && buyer.referredBy) {
    const inviter = appState.users.find(u => u.id === buyer.referredBy || u.referralCode === buyer.referredBy);
    if (inviter && inviter.merchantNumber) {
      const refComm = parseFloat((order.totalPrice * 0.03).toFixed(2)) || 0.05;
      inviter.wallet.available = parseFloat((inviter.wallet.available + refComm).toFixed(2));
      inviter.wallet.totalEarned = parseFloat((inviter.wallet.totalEarned + refComm).toFixed(2));
      inviter.wallet.referralEarned = parseFloat((inviter.wallet.referralEarned + refComm).toFixed(2));

      const refTx: WalletTransaction = {
        id: "tx_buy_ref_" + Date.now(),
        userId: inviter.id,
        type: "referral_bonus",
        amount: refComm,
        currency: inviter.currency,
        status: "completed",
        method: "Yaamaa Referral",
        details: `Commission Achat Boutique (3%) - Achat de votre filleul @${buyer.username} : "${order.productName}"`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(refTx);
    }
  }

  // Increment sales count on the product
  const product = appState.products?.find(p => p.id === order.productId);
  if (product) {
    product.salesCount += order.quantity;
  }

  saveState(appState);
  createAuditLog(buyerId, buyer?.username || "Acheteur", buyer?.role || "participant", "Réception Commande", `Réception confirmée pour la commande #${id}. ${sellerNetPayout} ${order.currency} transférés au vendeur.`, req);
  res.json(order);
});

// DISPUTE MANAGEMENT
app.get("/api/disputes", (req, res) => {
  res.json(appState.disputes || []);
});

app.post("/api/disputes", (req, res) => {
  const { orderId, buyerId, description, images, reqRefundAmount } = req.body;

  if (!orderId || !buyerId || !description) {
    return res.status(400).json({ error: "Tous les champs de signalement sont obligatoires." });
  }

  const orderList = appState.orders || [];
  const order = orderList.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  if (order.buyerId !== buyerId) {
    return res.status(403).json({ error: "Seul l'acheteur de cette commande peut émettre un litige." });
  }

  const buyer = appState.users.find(u => u.id === buyerId);

  const disputeId = "disp_" + Date.now();
  const newDispute: Dispute = {
    id: disputeId,
    orderId,
    productId: order.productId,
    productName: order.productName,
    buyerId,
    buyerUsername: order.buyerUsername,
    sellerId: order.sellerId,
    description,
    images: Array.isArray(images) ? images : [],
    reqRefundAmount: Number(reqRefundAmount) || order.totalPrice,
    currency: order.currency,
    status: "open",
    createdAt: new Date().toISOString()
  };

  order.status = "disputed";
  order.disputeId = disputeId;

  if (!appState.disputes) appState.disputes = [];
  appState.disputes.push(newDispute);
  saveState(appState);

  createAuditLog(buyerId, buyer?.username || "Acheteur", buyer?.role || "participant", "Déclaration Litige", `Nouveau litige ID ${disputeId} déclaré sur commande #${orderId}`, req);
  res.json({ dispute: newDispute, order });
});

// Admin resolves dispute
app.post("/api/admin/disputes/resolve", (req, res) => {
  const { disputeId, resolution, adminFeedback, operatorId } = req.body;

  if (!disputeId || !resolution || !operatorId) {
    return res.status(400).json({ error: "Composants de résolution obligatoires manquants." });
  }

  const disputesList = appState.disputes || [];
  const dispute = disputesList.find(d => d.id === disputeId);
  if (!dispute) return res.status(404).json({ error: "Litige introuvable." });

  if (dispute.status !== "open") {
    return res.status(400).json({ error: "Ce litige a déjà reçu une sentence arbitrale." });
  }

  const orderList = appState.orders || [];
  const order = orderList.find(o => o.id === dispute.orderId);
  if (!order) return res.status(404).json({ error: "Commande liée introuvable." });

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Droits d'arbitrage administratifs requis." });
  }

  const buyer = appState.users.find(u => u.id === dispute.buyerId);
  const seller = appState.users.find(u => u.id === dispute.sellerId);

  if (resolution === "refund_buyer") {
    // Return locked funds back to buyer
    if (buyer) {
      buyer.wallet.available = parseFloat((buyer.wallet.available + dispute.reqRefundAmount).toFixed(2));
    }
    
    dispute.status = "resolved_refunded";
    dispute.adminFeedback = adminFeedback || "Remboursement accordé à l'acheteur après arbitrage.";
    order.status = "refunded";

    // Create refund transaction log
    const refundTx: WalletTransaction = {
      id: "tx_refund_" + Date.now(),
      userId: dispute.buyerId,
      type: "deposit",
      amount: dispute.reqRefundAmount,
      currency: dispute.currency,
      status: "completed",
      method: "Arbitrage Escrow",
      details: `Remboursement Litige (Plainte acceptée) - Commande #${order.id}`,
      createdAt: new Date().toISOString()
    };
    appState.transactions.unshift(refundTx);

  } else if (resolution === "pay_seller") {
    // Deliver funds to seller (minus standard commission)
    if (seller) {
      const feePct = appState.settings.platformFeePercentage || 10;
      const commission = parseFloat((dispute.reqRefundAmount * (feePct / 100)).toFixed(2));
      const netPayout = parseFloat((dispute.reqRefundAmount - commission).toFixed(2));

      seller.wallet.available = parseFloat((seller.wallet.available + netPayout).toFixed(2));
      seller.wallet.totalEarned = parseFloat((seller.wallet.totalEarned + netPayout).toFixed(2));

      // Seller log
      const sellerTx: WalletTransaction = {
        id: "tx_litige_gain_" + Date.now(),
        userId: dispute.sellerId,
        type: "earn",
        amount: netPayout,
        currency: dispute.currency,
        status: "completed",
        method: "Arbitrage Escrow",
        details: `Gain Libéré après arbitrage du litige - Commande #${order.id}`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(sellerTx);
    }

    dispute.status = "resolved_paid_seller";
    dispute.adminFeedback = adminFeedback || "Fonds transférés au vendeur après arbitrage.";
    order.status = "completed";
  } else {
    return res.status(400).json({ error: "Option de résolution inconnue." });
  }

  saveState(appState);
  createAuditLog(operatorId, adminUser.username, adminUser.role, "Arbitrage Litige", `Arbitrage rendu pour le litige ID ${disputeId}. Sentence: ${resolution}`, req);
  res.json({ dispute, order });
});

// ==========================================
// 📢 PROMOTIONS & ADS BACKEND API ROUTES
// ==========================================

app.get("/api/promotions", (req, res) => {
  res.json(appState.promoCampaigns || []);
});

app.post("/api/promotions", (req, res) => {
  const { 
    ownerId, ownerUsername, type, title, productServiceName, destLink, description, 
    instructions, images, videos, targetCountries, targetRegions, targetCommunes, targetLanguages, targetAge, targetInterests,
    budgetTier, budgetPrice, currency, startDate, endDate 
  } = req.body;

  if (!ownerId || !type || !title || !destLink || !budgetTier || !budgetPrice) {
    return res.status(400).json({ error: "Champs obligatoires de campagne promotionnelle manquants." });
  }

  const promoter = appState.users.find(u => u.id === ownerId);
  if (!promoter) return res.status(404).json({ error: "Annonceur / Promoteur introuvable." });

  // Pre-payment process
  if (promoter.wallet.available < budgetPrice) {
    return res.status(400).json({ error: "Solde insuffisant pour pré-charger la campagne de promotion publicitaire." });
  }

  // Deduct cash from promoter's wallet
  promoter.wallet.available = parseFloat((promoter.wallet.available - budgetPrice).toFixed(2));

  // Ledger transaction
  const promoTx: WalletTransaction = {
    id: "tx_promo_" + Date.now(),
    userId: ownerId,
    type: "funded_campaign",
    amount: budgetPrice,
    currency: currency || "EUR",
    status: "completed",
    method: "Wallet Yaamaa",
    details: `Financement Campagne Pub 📢 Tier: ${budgetTier.toUpperCase()}`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(promoTx);

  const newPromo: PromoCampaign = {
    id: "promo_" + Date.now(),
    ownerId,
    ownerUsername: promoter.username,
    type,
    title,
    productServiceName: productServiceName || title,
    destLink,
    description: description || "",
    instructions: instructions || "",
    images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop"],
    videos: Array.isArray(videos) ? videos : [],
    targetCountries: Array.isArray(targetCountries) ? targetCountries : ["Tous les pays"],
    targetRegions: Array.isArray(targetRegions) ? targetRegions : ["Tous"],
    targetCommunes: Array.isArray(targetCommunes) ? targetCommunes : ["Tous"],
    targetLanguages: Array.isArray(targetLanguages) ? targetLanguages : ["Tous"],
    targetAge: targetAge || "all",
    targetInterests: Array.isArray(targetInterests) ? targetInterests : [],
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    budgetTier,
    budgetPrice: Number(budgetPrice),
    currency: currency || "EUR",
    paymentStatus: "paid",
    status: "pending_validation",
    impressions: 0,
    views: 0,
    clicks: 0,
    ctr: 0.0,
    revenueGenerated: 0,
    createdAt: new Date().toISOString()
  };

  if (!appState.promoCampaigns) appState.promoCampaigns = [];
  appState.promoCampaigns.push(newPromo);
  saveState(appState);

  createAuditLog(ownerId, promoter.username, promoter.role, "Création Promotion", `Campagne Pub créée: ${title} (${budgetPrice} ${currency})`, req);
  res.json(newPromo);
});

// Admin reviews promotion campaign
app.post("/api/admin/promotions/review", (req, res) => {
  const { campaignId, status, adminFeedback, operatorId } = req.body;

  if (!campaignId || !status || !operatorId) {
    return res.status(400).json({ error: "Informations de révision manquantes." });
  }

  const promoList = appState.promoCampaigns || [];
  const promo = promoList.find(p => p.id === campaignId);
  if (!promo) return res.status(404).json({ error: "Campagne de promotion introuvable." });

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Permissions administratives insuffisantes." });
  }

  // Set the target status
  if (status === "active") {
    promo.status = "active";
  } else if (status === "rejected") {
    promo.status = "rejected";
    // Refund owner since ads are rejected
    const owner = appState.users.find(u => u.id === promo.ownerId);
    if (owner) {
      owner.wallet.available = parseFloat((owner.wallet.available + promo.budgetPrice).toFixed(2));
      
      const refundTx: WalletTransaction = {
        id: "tx_promo_ref_" + Date.now(),
        userId: promo.ownerId,
        type: "deposit",
        amount: promo.budgetPrice,
        currency: promo.currency,
        status: "completed",
        method: "Remboursement Administrateur",
        details: `Remboursement Campagne Publicitaire (Rejetée: ${adminFeedback || 'Non Conforme'})`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(refundTx);
    }
  } else if (status === "suspended") {
    promo.status = "suspended";
  } else if (status === "paused") {
    promo.status = "paused";
  }

  saveState(appState);
  createAuditLog(operatorId, adminUser.username, adminUser.role, "Révision Promotion", `Campagne ID ${campaignId} révisée: ${status} (${adminFeedback || 'Aucun commentaire'})`, req);
  res.json(promo);
});

// Track impressions, clicks, etc.
app.post("/api/promotions/:id/track", (req, res) => {
  const { id } = req.params;
  const { trackType } = req.body; // "impression" | "view" | "click"

  const promoList = appState.promoCampaigns || [];
  const promo = promoList.find(p => p.id === id);
  if (!promo) return res.status(404).json({ error: "Campagne introuvable" });

  if (trackType === "impression") {
    promo.impressions += 1;
  } else if (trackType === "view") {
    promo.views += 1;
  } else if (trackType === "click") {
    promo.clicks += 1;
    // Simulate a minor conversion boost on tracking
    if (Math.random() > 0.9) {
      promo.revenueGenerated = parseFloat((promo.revenueGenerated + (promo.budgetPrice * 0.05)).toFixed(2));
    }
  }

  // Re-calculate advertiser CTR
  if (promo.impressions > 0) {
    promo.ctr = parseFloat(((promo.clicks / promo.impressions) * 100).toFixed(2));
  } else {
    promo.ctr = 0;
  }

  saveState(appState);
  res.json({ success: true, impressions: promo.impressions, clicks: promo.clicks, ctr: promo.ctr });
});

// Track impressions, clicks, etc.
app.post("/api/promotions/:id/track", (req, res) => {
  const { id } = req.params;
  const { trackType } = req.body; // "impression" | "view" | "click"

  const promoList = appState.promoCampaigns || [];
  const promo = promoList.find(p => p.id === id);
  if (!promo) return res.status(404).json({ error: "Campagne introuvable" });

  if (trackType === "impression") {
    promo.impressions += 1;
  } else if (trackType === "view") {
    promo.views += 1;
  } else if (trackType === "click") {
    promo.clicks += 1;
    // Simulate a minor conversion boost on tracking
    if (Math.random() > 0.9) {
      promo.revenueGenerated = parseFloat((promo.revenueGenerated + (promo.budgetPrice * 0.05)).toFixed(2));
    }
  }

  // Re-calculate advertiser CTR
  if (promo.impressions > 0) {
    promo.ctr = parseFloat(((promo.clicks / promo.impressions) * 100).toFixed(2));
  } else {
    promo.ctr = 0;
  }

  saveState(appState);
  res.json({ success: true, impressions: promo.impressions, clicks: promo.clicks, ctr: promo.ctr });
});

// ==========================================
// 🤝 SUPPLIERS & DELIVERERS API ENDPOINTS
// ==========================================

app.get("/api/suppliers-deliverers", (req, res) => {
  if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];
  if (!appState.supplierReviews) appState.supplierReviews = [];
  if (!appState.missionRequests) appState.missionRequests = [];
  res.json({
    suppliersDeliverers: appState.suppliersDeliverers,
    reviews: appState.supplierReviews,
    missions: appState.missionRequests
  });
});

app.post("/api/suppliers-deliverers/register", (req, res) => {
  const {
    userId,
    type,
    fullName,
    profilePhoto,
    companyLogo,
    phone,
    email,
    country,
    city,
    interventionZone,
    professionalAddress,
    activityType,
    servicesDescription,
    idDocumentUrl,
    companyDocumentUrl,
    drivingLicenseUrl,
    transportMethod,
    vehiclePhotos,
    insuranceDocumentUrl,
    certifications,
    availabilityHours,
    rates,
    spokenLanguages
  } = req.body;

  if (!userId || !type || !fullName || !phone || !email || !country || !city) {
    return res.status(400).json({ error: "Informations obligatoires manquantes pour l'inscription." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];

  const newProfile: SupplierDelivererProfile = {
    id: "sd_" + Date.now(),
    userId,
    type,
    fullName,
    profilePhoto: profilePhoto || user.avatar,
    companyLogo,
    phone,
    email,
    country,
    city,
    interventionZone: interventionZone || city,
    professionalAddress: professionalAddress || "",
    activityType: activityType || "Général",
    servicesDescription: servicesDescription || "",
    idDocumentUrl: idDocumentUrl || "https://example.com/id_doc.pdf",
    companyDocumentUrl,
    drivingLicenseUrl,
    transportMethod,
    vehiclePhotos: Array.isArray(vehiclePhotos) ? vehiclePhotos : [],
    insuranceDocumentUrl,
    certifications: Array.isArray(certifications) ? certifications : [],
    availabilityHours: availabilityHours || "24h/24",
    rates,
    spokenLanguages: Array.isArray(spokenLanguages) ? spokenLanguages : ["Français"],
    status: "pending",
    isVerified: false,
    rating: 5.0,
    reviewsCount: 0,
    missionsCompletedCount: 0,
    successRate: 100,
    createdAt: new Date().toISOString()
  };

  appState.suppliersDeliverers.unshift(newProfile);
  saveState(appState);

  createAuditLog(userId, user.username, user.role, "Inscription Fournisseur/Livreur", `Candidature ${type} soumise: ${fullName} (${city}, ${country})`, req);
  res.json({ success: true, profile: newProfile });
});

app.post("/api/suppliers-deliverers/admin/status", (req, res) => {
  const { profileId, status, adminFeedback, operatorId } = req.body;

  if (!profileId || !status || !operatorId) {
    return res.status(400).json({ error: "Paramètres de révision manquants." });
  }

  const admin = appState.users.find(u => u.id === operatorId);
  if (!admin || (admin.role !== "admin" && admin.role !== "founder")) {
    return res.status(403).json({ error: "Permissions administratives insuffisantes." });
  }

  if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];
  const profile = appState.suppliersDeliverers.find(p => p.id === profileId);
  if (!profile) return res.status(404).json({ error: "Profil introuvable." });

  profile.status = status;
  if (status === "approved") {
    profile.isVerified = true;
  } else if (status === "rejected" || status === "suspended") {
    profile.isVerified = false;
  }
  if (adminFeedback !== undefined) {
    profile.adminFeedback = adminFeedback;
  }

  saveState(appState);
  createAuditLog(operatorId, admin.username, admin.role, "Gestion Fournisseur/Livreur", `Profil ID ${profileId} passé au statut: ${status}`, req);
  res.json(profile);
});

app.post("/api/suppliers-deliverers/review", (req, res) => {
  const { profileId, userId, rating, comment } = req.body;

  if (!profileId || !userId || !rating) {
    return res.status(400).json({ error: "Données d'évaluation incomplètes." });
  }

  const user = appState.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];
  const profile = appState.suppliersDeliverers.find(p => p.id === profileId);
  if (!profile) return res.status(404).json({ error: "Profil introuvable." });

  if (!appState.supplierReviews) appState.supplierReviews = [];

  const newReview: SupplierDelivererReview = {
    id: "rev_" + Date.now(),
    profileId,
    userId,
    username: user.username,
    userAvatar: user.avatar,
    rating: Number(rating),
    comment: comment || "",
    createdAt: new Date().toISOString()
  };

  appState.supplierReviews.unshift(newReview);

  // Recalculate average rating
  const profileReviews = appState.supplierReviews.filter(r => r.profileId === profileId);
  const totalRating = profileReviews.reduce((sum, r) => sum + r.rating, 0);
  profile.rating = parseFloat((totalRating / profileReviews.length).toFixed(1));
  profile.reviewsCount = profileReviews.length;

  saveState(appState);
  res.json({ success: true, review: newReview, profile });
});

app.post("/api/suppliers-deliverers/mission", (req, res) => {
  const { profileId, clientId, title, description, budgetOrRates } = req.body;

  if (!profileId || !clientId || !title) {
    return res.status(400).json({ error: "Informations de mission incomplètes." });
  }

  const client = appState.users.find(u => u.id === clientId);
  if (!client) return res.status(404).json({ error: "Client introuvable." });

  if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];
  const profile = appState.suppliersDeliverers.find(p => p.id === profileId);
  if (!profile) return res.status(404).json({ error: "Prestataire introuvable." });

  if (!appState.missionRequests) appState.missionRequests = [];

  const newMission: MissionRequest = {
    id: "mission_" + Date.now(),
    profileId,
    profileName: profile.fullName,
    profileType: profile.type,
    clientId,
    clientUsername: client.username,
    clientAvatar: client.avatar,
    title,
    description: description || "",
    budgetOrRates: budgetOrRates || "À négocier",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  appState.missionRequests.unshift(newMission);

  if (!appState.socialMessages) appState.socialMessages = [];
  const chatMsg: SocialMessage = {
    id: "msg_mission_" + Date.now(),
    senderId: clientId,
    senderUsername: client.username,
    senderAvatar: client.avatar,
    recipientId: profile.userId,
    text: `📋 [DEMANDE DE MISSION] "${title}"\n\nDescription: ${description || 'Aucune description'}\nBudget/Tarifs: ${budgetOrRates || 'À négocier'}\n\nVeuillez accepter ou refuser cette mission dans votre espace Fournisseur & Livreur.`,
    createdAt: new Date().toISOString()
  };
  appState.socialMessages.push(chatMsg);

  saveState(appState);
  res.json({ success: true, mission: newMission });
});

app.post("/api/suppliers-deliverers/mission/status", (req, res) => {
  const { missionId, status, operatorId } = req.body;

  if (!missionId || !status || !operatorId) {
    return res.status(400).json({ error: "Paramètres de mission invalides." });
  }

  if (!appState.missionRequests) appState.missionRequests = [];
  const mission = appState.missionRequests.find(m => m.id === missionId);
  if (!mission) return res.status(404).json({ error: "Mission introuvable." });

  mission.status = status; // "accepted" | "rejected" | "completed"

  if (status === "accepted" || status === "completed") {
    if (!appState.suppliersDeliverers) appState.suppliersDeliverers = [];
    const profile = appState.suppliersDeliverers.find(p => p.id === mission.profileId);
    if (profile && status === "completed") {
      profile.missionsCompletedCount += 1;
    }
  }

  saveState(appState);
  res.json(mission);
});

// SUBSCRIPTION PLANS & USER SUBSCRIPTIONS API
app.get("/api/subscription-plans", (req, res) => {
  if (!appState.subscriptionPlans) {
    appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
    saveState(appState);
  }
  res.json(appState.subscriptionPlans);
});

app.post("/api/subscription-plans", (req, res) => {
  if (!appState.subscriptionPlans) appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
  const { id, name, tier, badgeLabel, colorTheme, description, benefits, initialPrice, renewalPrice, durationValue, durationUnit, maxReferrals, referralCommission, isActive, operatorId } = req.body;
  
  if (id) {
    const plan = appState.subscriptionPlans.find(p => p.id === id);
    if (plan) {
      if (name !== undefined) plan.name = name;
      if (tier !== undefined) plan.tier = tier;
      if (badgeLabel !== undefined) plan.badgeLabel = badgeLabel;
      if (colorTheme !== undefined) plan.colorTheme = colorTheme;
      if (description !== undefined) plan.description = description;
      if (benefits !== undefined) plan.benefits = benefits;
      if (initialPrice !== undefined) plan.initialPrice = parseFloat(initialPrice);
      if (renewalPrice !== undefined) plan.renewalPrice = parseFloat(renewalPrice);
      if (durationValue !== undefined) plan.durationValue = parseInt(durationValue);
      if (durationUnit !== undefined) plan.durationUnit = durationUnit;
      if (maxReferrals !== undefined) plan.maxReferrals = parseInt(maxReferrals);
      if (referralCommission !== undefined) plan.referralCommission = parseFloat(referralCommission);
      if (isActive !== undefined) plan.isActive = !!isActive;

      appState.auditLogs.unshift({
        id: "log_" + Date.now(),
        userId: operatorId || "admin",
        username: "Administrateur",
        role: "admin",
        action: "UPDATE_SUBSCRIPTION_PLAN",
        details: `Plan mis à jour : ${plan.name} (${plan.tier})`,
        timestamp: new Date().toISOString(),
        ip: "127.0.0.1"
      });
      saveState(appState);
      return res.json({ success: true, plan });
    }
  }

  const newPlan: SubscriptionPlan = {
    id: "plan_" + Date.now(),
    name: name || "Nouveau Plan",
    tier: tier || "blue",
    badgeLabel: badgeLabel || "Badge",
    colorTheme: colorTheme || { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", gradient: "from-blue-600 to-sky-400" },
    description: description || "",
    benefits: benefits || [],
    initialPrice: parseFloat(initialPrice || "5000"),
    renewalPrice: parseFloat(renewalPrice || "3000"),
    durationValue: parseInt(durationValue || "30"),
    durationUnit: durationUnit || "days",
    maxReferrals: maxReferrals !== undefined ? parseInt(maxReferrals) : 20,
    referralCommission: referralCommission !== undefined ? parseFloat(referralCommission) : 2500,
    isActive: isActive !== false,
    createdAt: new Date().toISOString()
  };

  appState.subscriptionPlans.push(newPlan);
  appState.auditLogs.unshift({
    id: "log_" + Date.now(),
    userId: operatorId || "admin",
    username: "Administrateur",
    role: "admin",
    action: "CREATE_SUBSCRIPTION_PLAN",
    details: `Création du plan d'abonnement : ${newPlan.name} (${newPlan.tier})`,
    timestamp: new Date().toISOString(),
    ip: "127.0.0.1"
  });
  saveState(appState);
  res.json({ success: true, plan: newPlan });
});

app.delete("/api/subscription-plans/:id", (req, res) => {
  const { id } = req.params;
  if (!appState.subscriptionPlans) appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
  appState.subscriptionPlans = appState.subscriptionPlans.filter(p => p.id !== id);
  saveState(appState);
  res.json({ success: true });
});

app.get("/api/user-subscriptions", (req, res) => {
  if (!appState.userSubscriptions) appState.userSubscriptions = [];
  res.json(appState.userSubscriptions);
});

app.post("/api/user-subscriptions/action", (req, res) => {
  if (!appState.userSubscriptions) appState.userSubscriptions = [];
  if (!appState.subscriptionPlans) appState.subscriptionPlans = SEED_SUBSCRIPTION_PLANS;
  if (!appState.subscriptionNotifications) appState.subscriptionNotifications = [];

  const { userId, planId, action, subscriptionId, durationOverrideDays, operatorId } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const now = new Date();

  if (action === "assign" || action === "renew") {
    const plan = appState.subscriptionPlans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ error: "Plan introuvable." });

    if (!user.merchantNumber) {
      const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
      user.merchantNumber = `YM-${randomNum}`;
      user.merchantNumberPurchasedAt = now.toISOString();
    }
    user.merchantPackType = plan.tier === "diamond" ? "diamond" : (plan.tier === "gold" ? "gold" : "premium");

    const days = durationOverrideDays ? parseInt(durationOverrideDays) : (plan.durationUnit === "years" ? plan.durationValue * 365 : plan.durationUnit === "months" ? plan.durationValue * 30 : plan.durationUnit === "weeks" ? plan.durationValue * 7 : plan.durationValue);
    const expDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    let sub = appState.userSubscriptions.find(s => s.userId === userId && s.status === "active");
    if (sub) {
      sub.planId = plan.id;
      sub.planName = plan.name;
      sub.tier = plan.tier;
      sub.expirationDate = expDate.toISOString();
      sub.lastRenewedAt = now.toISOString();
    } else {
      sub = {
        id: "sub_" + Date.now(),
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        tier: plan.tier,
        merchantNumber: user.merchantNumber,
        startDate: now.toISOString(),
        expirationDate: expDate.toISOString(),
        status: "active",
        isAutoRenew: true,
        createdAt: now.toISOString()
      };
      appState.userSubscriptions.push(sub);
    }

    appState.subscriptionNotifications.unshift({
      id: "notif_" + Date.now(),
      userId: user.id,
      title: "Abonnement Marchand Activé 🌟",
      message: `Votre abonnement ${plan.name} (${plan.badgeLabel}) est désormais actif avec votre numéro marchand ${user.merchantNumber}.`,
      type: "activation",
      createdAt: now.toISOString(),
      isRead: false
    });

    appState.auditLogs.unshift({
      id: "log_" + Date.now(),
      userId: operatorId || "admin",
      username: "Administrateur",
      role: "admin",
      action: "ASSIGN_SUBSCRIPTION",
      details: `Abonnement ${plan.name} attribué à l'utilisateur ${user.username} (${user.merchantNumber})`,
      timestamp: now.toISOString(),
      ip: "127.0.0.1"
    });

    saveState(appState);
    return res.json({ success: true, subscription: sub, user });
  }

  if (action === "suspend") {
    const sub = appState.userSubscriptions.find(s => s.id === subscriptionId);
    if (sub) {
      sub.status = "suspended";
      appState.subscriptionNotifications.unshift({
        id: "notif_" + Date.now(),
        userId: sub.userId,
        title: "Abonnement Suspendu ⚠️",
        message: "Votre abonnement marchand a été temporairement suspendu par l'administration.",
        type: "suspension",
        createdAt: now.toISOString(),
        isRead: false
      });
      saveState(appState);
      return res.json({ success: true, subscription: sub });
    }
  }

  if (action === "reactivate") {
    const sub = appState.userSubscriptions.find(s => s.id === subscriptionId);
    if (sub) {
      sub.status = "active";
      appState.subscriptionNotifications.unshift({
        id: "notif_" + Date.now(),
        userId: sub.userId,
        title: "Abonnement Réactivé ✅",
        message: "Votre abonnement marchand a été réactivé avec succès.",
        type: "reactivation",
        createdAt: now.toISOString(),
        isRead: false
      });
      saveState(appState);
      return res.json({ success: true, subscription: sub });
    }
  }

  if (action === "cancel") {
    const sub = appState.userSubscriptions.find(s => s.id === subscriptionId);
    if (sub) {
      sub.status = "cancelled";
      saveState(appState);
      return res.json({ success: true, subscription: sub });
    }
  }

  res.status(400).json({ error: "Action non reconnue." });
});

// --- SUPERVISION API ENDPOINTS ---
app.get("/api/supervision-incidents", (req, res) => {
  if (!appState.supervisionIncidents) appState.supervisionIncidents = SEED_SUPERVISION_INCIDENTS;
  res.json(appState.supervisionIncidents);
});

app.post("/api/supervision-incidents/simulate", (req, res) => {
  if (!appState.supervisionIncidents) appState.supervisionIncidents = SEED_SUPERVISION_INCIDENTS;
  const newInc: SupervisionIncident = {
    id: "inc_" + Date.now(),
    component: "API Externe & Passerelle SMS",
    componentKey: "api_sms",
    timestamp: new Date().toISOString(),
    severity: "high",
    title: "Surcharge temporaire de la file d'attente SMS OTP",
    description: "Le fournisseur SMS a retourné un code de limitation de débit (Rate Limit 429) sur l'envoi des codes de vérification 2FA.",
    consequences: "Retard de 45 secondes dans la réception des SMS de validation pour les nouveaux inscrits.",
    logs: [
      "[WARN] 2026-07-07 08:40:10 - Provider API rate limit hit (HTTP 429)",
      "[INFO] 2026-07-07 08:40:12 - Routing to secondary backup SMS provider (Twilio US)."
    ],
    impactedUsersCount: 85,
    probableCauses: "Pic simultané de demandes d'authentification à deux facteurs.",
    recommendations: "Augmenter le quota mensuel auprès du fournisseur principal.",
    correctionSteps: ["Bascule automatique effectuée vers le fournisseur secondaire."],
    isAutoCorrectable: true,
    status: "active"
  };
  appState.supervisionIncidents.unshift(newInc);
  saveState(appState);
  res.json(newInc);
});

app.post("/api/supervision-incidents/:id/resolve", (req, res) => {
  if (!appState.supervisionIncidents) appState.supervisionIncidents = SEED_SUPERVISION_INCIDENTS;
  const inc = appState.supervisionIncidents.find(i => i.id === req.params.id);
  if (inc) {
    inc.status = "resolved";
    inc.resolvedAt = new Date().toISOString();
    saveState(appState);
    return res.json(inc);
  }
  res.status(404).json({ error: "Incident non trouvé." });
});

app.post("/api/supervision-incidents/:id/autocorrect", (req, res) => {
  if (!appState.supervisionIncidents) appState.supervisionIncidents = SEED_SUPERVISION_INCIDENTS;
  const inc = appState.supervisionIncidents.find(i => i.id === req.params.id);
  if (inc) {
    inc.status = "auto_corrected";
    inc.resolvedAt = new Date().toISOString();
    inc.logs.push(`[AUTO-FIX] 2026-07-07 - Script d'auto-réparation exécuté avec succès par l'agent Yama Core.`);
    saveState(appState);
    return res.json(inc);
  }
  res.status(404).json({ error: "Incident non trouvé." });
});

app.get("/api/supervision-reports", (req, res) => {
  if (!appState.supervisionReports) appState.supervisionReports = SEED_SUPERVISION_REPORTS;
  res.json(appState.supervisionReports);
});

app.post("/api/supervision-reports", (req, res) => {
  if (!appState.supervisionReports) appState.supervisionReports = SEED_SUPERVISION_REPORTS;
  const { type } = req.body;
  const newRep: SupervisionReport = {
    id: "rep_" + type + "_" + Date.now(),
    type: type || "daily",
    date: new Date().toISOString().split("T")[0],
    title: `Rapport de Supervision ${type === "weekly" ? "Hebdomadaire" : type === "monthly" ? "Mensuel" : "Quotidien"} – ${new Date().toLocaleDateString()}`,
    performanceSummary: "Surveillance complète effectuée. Aucune faille de sécurité détectée. Stabilité optimale des services.",
    incidentsCount: appState.supervisionIncidents.length,
    resolvedCount: appState.supervisionIncidents.filter(i => i.status !== "active").length,
    activeUsersCount: appState.users.length,
    growthRate: +6.5,
    details: "Indicateurs de performance dans les normes d'excellence Yama. Évolutivité du système validée."
  };
  appState.supervisionReports.unshift(newRep);
  saveState(appState);
  res.json(newRep);
});

// ============================================
// IMPERSONATION & ADMIN CREDENTIALS ENDPOINTS
// ============================================
app.post("/api/admin/reset-user-password", (req, res) => {
  const { founderId, targetUserId, newPassword } = req.body;
  const founder = appState.users.find(u => u.id === founderId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Accès refusé. Seul le Fondateur peut réinitialiser les mots de passe." });
  }
  const targetUser = appState.users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: "Utilisateur cible introuvable." });
  }
  const pwd = newPassword && newPassword.trim() !== "" ? newPassword.trim() : "123456";
  targetUser.password = bcrypt.hashSync(pwd, 10);
  createAuditLog(founder.id, founder.username, "founder", "Réinitialisation mot de passe", `Le fondateur a réinitialisé le mot de passe de @${targetUser.username}.`, req);
  saveState(appState);
  res.json({ success: true, message: `Mot de passe réinitialisé avec succès pour @${targetUser.username}` });
});

app.post("/api/admin/impersonate", (req, res) => {
  const { founderId, targetUserId, silent = true } = req.body;
  const founder = appState.users.find(u => u.id === founderId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Accès refusé. Seul le Fondateur (Super Administrateur) peut utiliser la fonction d'impersonation." });
  }
  const targetUser = appState.users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: "Utilisateur cible introuvable." });
  }

  if (!appState.impersonationLogs) {
    appState.impersonationLogs = [];
  }

  const clientIpHeader = req.headers['x-forwarded-for'];
  const clientIp = Array.isArray(clientIpHeader) ? clientIpHeader[0] : (clientIpHeader || req.ip || "127.0.0.1");
  const uaHeader = req.headers['user-agent'];
  const userAgent = Array.isArray(uaHeader) ? uaHeader[0] : (uaHeader || "");

  const log: ImpersonationLog = {
    id: "imp_" + Date.now(),
    founderId: founder.id,
    founderUsername: founder.username,
    targetUserId: targetUser.id,
    targetUsername: targetUser.username,
    startedAt: new Date().toISOString(),
    ip: clientIp,
    userAgent
  };
  appState.impersonationLogs.unshift(log);

  // If not silent, notify user. By default silent = true (no trace or notification in user account)
  if (!silent) {
    if (!targetUser.notifications) {
      targetUser.notifications = [];
    }
    targetUser.notifications.unshift({
      id: "notif_imp_" + Date.now(),
      title: "Alerte de Sécurité : Session Supervisée 🛡️",
      desc: `Le Fondateur de la plateforme (@${founder.username}) a ouvert une session d'impersonation sur votre compte pour des raisons de support et d'audit.`,
      time: "À l'instant",
      read: false,
      priority: "critical",
      category: "security"
    });
  }

  createAuditLog(founder.id, founder.username, "founder", "Impersonation de compte", `Le fondateur a pris le contrôle de la session de @${targetUser.username} (${targetUser.id}) [Mode: ${silent ? 'Silencieux/Discret' : 'Notifié'}].`, req);
  saveState(appState);

  res.json({
    success: true,
    targetUser,
    impersonationLogId: log.id,
    message: `Session ouverte en tant que ${targetUser.name || targetUser.username}`
  });
});

app.post("/api/admin/stop-impersonate", (req, res) => {
  const { founderId, impersonationLogId } = req.body;
  if (appState.impersonationLogs) {
    const log = appState.impersonationLogs.find(l => l.id === impersonationLogId);
    if (log && !log.endedAt) {
      log.endedAt = new Date().toISOString();
    }
  }
  const founder = appState.users.find(u => u.id === founderId);
  if (founder) {
    createAuditLog(founder.id, founder.username, founder.role, "Fin d'impersonation", "Le fondateur est retourné à son compte d'origine.", req);
  }
  saveState(appState);
  res.json({ success: true });
});

app.get("/api/admin/impersonation-logs", (req, res) => {
  res.json(appState.impersonationLogs || []);
});

// Serve Vite setup for building client files / index.html
async function startServer() {
  // Vite developer mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/chat", (req, res) => {
      res.sendFile(path.join(distPath, "chat.html"));
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Yaamaa Server] running on http://0.0.0.0:${PORT} - NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
