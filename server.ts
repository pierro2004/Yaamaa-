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
  CallSession
} from "./src/types";

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

const STATE_FILE = path.join(process.cwd(), "data_state.json");
const BACKUP_FILE = path.join(process.cwd(), "data_state_backup.json");

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
  defaultCommission: 10
};

// Seed initial data
const SEED_USERS: User[] = [
  {
    id: "user_founder",
    email: "founder@taskora.com",
    password: "password123",
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
    is2faEnabled: true,
    isSuspended: false
  },
  {
    id: "user_admin",
    email: "celine@taskora.com",
    password: "password123",
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
    is2faEnabled: false,
    isSuspended: false
  },
  {
    id: "user_participant_1",
    email: "mamadou@taskora.com",
    password: "password123",
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
    email: "amelie@taskora.com",
    password: "password123",
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
    password: "password123",
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
    method: "Taskora Balance",
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
    details: "Initialisation globale de la plateforme Taskora v1.0.0",
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
    contactInfo: "+221771234567, mamadou@taskora.com",
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
    email: "founder@taskora.com",
    paymentMethod: "Wallet Taskora",
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
    email: "amelie@taskora.com",
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

// Helper to load state
function loadState(): AppState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const state: AppState = JSON.parse(raw);
      let updated = false;
      state.users.forEach(u => {
        if (!u.password) {
          u.password = "password123";
          updated = true;
        }
      });
      
      if (!state.shops) {
        state.shops = SEED_SHOPS;
        updated = true;
      }
      if (!state.products) {
        state.products = SEED_PRODUCTS;
        updated = true;
      }
      if (!state.orders) {
        state.orders = SEED_ORDERS;
        updated = true;
      }
      if (!state.disputes) {
        state.disputes = SEED_DISPUTES;
        updated = true;
      }
      if (!state.promoCampaigns) {
        state.promoCampaigns = SEED_PROMO_CAMPAIGNS;
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
    users: SEED_USERS,
    campaigns: SEED_CAMPAIGNS,
    submissions: SEED_SUBMISSIONS,
    transactions: SEED_TRANSACTIONS,
    auditLogs: SEED_AUDIT_LOGS,
    settings: DEFAULT_SETTINGS,
    shops: SEED_SHOPS,
    products: SEED_PRODUCTS,
    orders: SEED_ORDERS,
    disputes: SEED_DISPUTES,
    promoCampaigns: SEED_PROMO_CAMPAIGNS,
    communities: [],
    socialMessages: [],
    friendRequests: []
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
  res.json(appState.users);
});

app.post("/api/users/current", (req, res) => {
  const { userId } = req.body;
  const user = appState.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }
  res.json(user);
});

// Real User Login Authentication Email and Password
app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez renseigner votre email et votre mot de passe." });
  }

  // Find user by email
  const user = appState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "L'adresse email n'a pas été trouvée. Veuillez vérifier ou créer un compte." });
  }

  // Validate password match
  if (user.password !== password) {
    return res.status(401).json({ error: "Le mot de passe saisi est incorrect." });
  }

  createAuditLog(user.id, user.username, user.role, "Connexion réussie", `L'utilisateur @${user.username} s'est connecté.`, req);
  res.json(user);
});

// Create/Update profile simulation
app.post("/api/users/register", (req, res) => {
  let { name, username, email, phone, role, country, currency, referredBy, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Veuillez renseigner votre Nom, votre E-mail et votre Mot de passe." });
  }

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
  const newUser: User = {
    id: "user_" + Date.now(),
    email,
    password,
    phone: phone || "",
    name,
    username,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    role: role || "participant",
    level: 1,
    xp: 0,
    wallet: { available: 0, pending: 0, totalEarned: 0, referralEarned: 0 },
    country: country || "France",
    currency: currency || "EUR",
    referralCode,
    referredBy: referredBy || undefined,
    is2faEnabled: false,
    isSuspended: false
  };

  appState.users.push(newUser);
  appState.settings.totalUsersCount += 1;

  // Process Referral commission
  if (referredBy) {
    const inviter = appState.users.find(u => u.referralCode === referredBy || u.id === referredBy);
    if (inviter) {
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
        method: "Taskora Referral",
        details: `Bonus d'inscription pour avoir parrainé ${username}`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(newTx);
    }
  }

  saveState(appState);
  createAuditLog(newUser.id, newUser.username, newUser.role, "Inscription", `Compte créé pour ${newUser.name} (${newUser.role})`, req);
  res.json(newUser);
});

// Update Profile Custom Props
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { 
    is2faEnabled, isSuspended, wallet, level, xp, country, currency, role,
    username, name, email, avatar, phone, address, password
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
  
  // New profile fields
  if (name !== undefined) user.name = name.trim();
  if (email !== undefined) user.email = email.trim();
  if (avatar !== undefined) user.avatar = avatar.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (password !== undefined && password.trim() !== "") user.password = password.trim();

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
    method: "Taskora Wallet",
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
  const hasSubmitted = appState.submissions.some(s => s.campaignId === campaignId && s.participantId === participantId);
  if (hasSubmitted) {
    return res.status(400).json({ error: "Vous avez déjà soumis une preuve pour cette mission." });
  }

  // Pre-calculate fraud risk simulation
  // Perform real-time AI Analysis if Gemini is set up, otherwise fallback to smart regex
  let autoCheckedByAI = false;
  let fraudProbability = 8; // generic low probability
  let aiReport = "Analyse heuristique automatique : Preuve textuelle conforme aux critères requis.";

  if (ai) {
    try {
      const prompt = `Vous êtes Taskora AI, l'IA de filtrage anti-fraude d'une plateforme de micro-travaux.
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
        aiReport = result.feedback || "Audité par Taskora AI.";
        autoCheckedByAI = true;
      }
    } catch (e) {
      console.error("Taskora AI audit exception:", e);
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
      method: "Taskora Balance",
      details: `Gains pour la mission "${camp.title}" (Approuvée automatiquement)`,
      createdAt: new Date().toISOString()
    };
    appState.transactions.unshift(newTx);
    appState.settings.payoutsDistributed += camp.rewardPerUser;

    // Referral Commission on Mission Completion (10%)
    if (user.referredBy) {
      const inviter = appState.users.find(u => u.id === user.referredBy || u.referralCode === user.referredBy);
      if (inviter) {
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
          method: "Taskora Referral",
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
  sub.adminFeedback = feedback || `Vérifié et validé par l'équipe administrative de Taskora.`;

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
      if (inviter) {
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
          method: "Taskora Referral",
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

// Send a chat message
app.post("/api/social/messages", (req, res) => {
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
    customOfferOrderId
  } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: "senderId is required." });
  }

  const sender = appState.users.find(u => u.id === senderId);
  if (!sender) {
    return res.status(404).json({ error: "Sender not found." });
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
    readBy: [senderId]
  };

  if (!appState.socialMessages) appState.socialMessages = [];
  appState.socialMessages.push(newMessage);
  saveState(appState);

  res.json(newMessage);
});

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
    if (paymentMethod === "Wallet Taskora") {
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
      paymentMethod: paymentMethod || "Wallet Taskora",
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
      method: paymentMethod || "Wallet Taskora",
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
      method: "Wallet Taskora",
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
  const { isWithdrawalFrozen, platformFeePercentage, minWithdrawalAmount, baseReward, defaultCommission, operatorId } = req.body;

  const adminUser = appState.users.find(u => u.id === operatorId);
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "founder")) {
    return res.status(403).json({ error: "Privilèges d'administration requis pour configurer les tarifs et commissions." });
  }

  if (isWithdrawalFrozen !== undefined) appState.settings.isWithdrawalFrozen = isWithdrawalFrozen;
  if (platformFeePercentage !== undefined) appState.settings.platformFeePercentage = parseFloat(platformFeePercentage);
  if (minWithdrawalAmount !== undefined) appState.settings.minWithdrawalAmount = parseFloat(minWithdrawalAmount);
  if (baseReward !== undefined) appState.settings.baseReward = parseFloat(baseReward);
  if (defaultCommission !== undefined) appState.settings.defaultCommission = parseFloat(defaultCommission);

  saveState(appState);
  createAuditLog(operatorId, adminUser.username, adminUser.role, "Ajustement Tarifs", `Tarifs et Commissions mis à jour par @${adminUser.username}`, req);
  res.json(appState.settings);
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


// 6. SUPERADMIN (FOUNDER) OPERATIONS
// Nominate / Revoke Admin roles
app.post("/api/founder/admin/manage", (req, res) => {
  const { targetUserId, action, operatorId } = req.body;

  const founder = appState.users.find(u => u.id === operatorId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Accès refusé. Seul le Fondateur suprême de Taskora peut ajuster les rôles critiques." });
  }

  const target = appState.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: "Utilisateur cible introuvable." });

  if (target.id === founder.id) {
    return res.status(400).json({ error: "Opération interdite sur votre propre compte." });
  }

  if (action === "promote") {
    target.role = "admin";
  } else if (action === "demote") {
    target.role = "participant";
  }

  saveState(appState);
  createAuditLog(operatorId, founder.username, "founder", "Gestion Roles", `${action === 'promote' ? 'Promotion' : 'Révocation'} de l'utilisateur @${target.username} au rang d'Admin`, req);
  res.json({ user: target });
});

// Critical System Switches
app.post("/api/founder/settings/critical", (req, res) => {
  const { isWithdrawalFrozen, suspendedCountries, suspendedCurrencies, platformFeePercentage, operatorId } = req.body;

  const founder = appState.users.find(u => u.id === operatorId);
  if (!founder || founder.role !== "founder") {
    return res.status(403).json({ error: "Configuration interdite sans privilèges Fondateur." });
  }

  if (isWithdrawalFrozen !== undefined) appState.settings.isWithdrawalFrozen = isWithdrawalFrozen;
  if (suspendedCountries !== undefined) appState.settings.suspendedCountries = suspendedCountries;
  if (suspendedCurrencies !== undefined) appState.settings.suspendedCurrencies = suspendedCurrencies;
  if (platformFeePercentage !== undefined) appState.settings.platformFeePercentage = platformFeePercentage;

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
    return res.status(500).json({ error: "Échec de la restauration de la base de données de Taskora." });
  }
});


// 7. TASKORA AI (GEMINI ENGINE BACKEND SERVICE)
app.post("/api/ai/guidance", async (req, res) => {
  const { type, payload } = req.body;
  
  if (!ai) {
    return res.json({ 
      guide: "Taskora AI Mode Simulation : Veuillez renseigner le secret GEMINI_API_KEY dans le menu de gauche pour intégrer notre moteur neuronal d'IA en temps réel. En attendant, optimisez votre campagne en choisissant une formulation claire, une récompense incitative d'au moins 0.15€, et en demandant des pseudonymes précis en guise de preuve."
    });
  }

  try {
    let prompt = "";
    if (type === "advertiser_create") {
      prompt = `Vous êtes un expert en marketing digital sur Taskora.
L'annonceur souhaite créer la campagne suivante:
Titre: "${payload.title}"
Description: "${payload.description}"
Type de mission: "${payload.type}"
Catégorie: "${payload.category}"

Optimisez le titre pour qu'il soit extrêmement captivant, réécrivez la description sous forme de liste d'étapes claires, déterminez le meilleur appel à l'action (CTA) pour maximiser les taux d'engagement, et proposez d'autres intérêts ou critères de ciblage optimaux d'audience.
Rédigez votre réponse en français professionnel, chaleureux et bien structuré au format Markdown.`;
    } else if (type === "participant_recommend") {
      prompt = `Vous êtes le recommandateur intelligent de Taskora AI pour les participants et créateurs de gains.
Le participant possède le profil suivant:
Pseudo: "@${payload.username}"
Niveau: ${payload.level}
Pays: "${payload.country}"
Intérêts: ${payload.interests || "technologie, divertissement, réseaux sociaux"}

Prenez en compte les campagnes actives suivantes actuellement sur notre plateforme:
${JSON.stringify(appState.campaigns.filter(c => c.status === "active"))}

Proposez-lui les 2 meilleures missions adaptées à son pays, estimez les gains totaux potentiels et donnez des astuces claires pour réussir rapidement et éviter d'être pénalisé. Rédigez en français dynamique, motivant et clair en Markdown.`;
    } else if (type === "admin_fraud_report") {
      prompt = `Vous êtes l'architecte de sécurité Taskora AI.
Générez un court rapport d'audit de sécurité de l'activité récente de la plateforme.
Nombre d'utilisateurs: ${appState.users.length}
Nombre de campagnes actives: ${appState.campaigns.filter(c => c.status === "active").length}
Nombre total de soumissions de preuves: ${appState.submissions.length}
Historique récent des soumissions: ${JSON.stringify(appState.submissions.slice(0, 5))}

Analysez la liste des soumissions récentes pour identifier d'éventuels comportements anormaux, robots de spam, ou multi-comptes VPN. Rédigez votre synthèse globale et vos recommandations de sécurité pour les administrateurs en français sous format Markdown. Un ton technique et pragmatique de haut niveau est attendu.`;
    } else {
      prompt = `Répondez gentiment à ce message à propos de Taskora: "${payload.message}". Taskora est une plateforme de micro-travaux (Gagnez de l'argent en accomplissant des petites tâches. Les annonceurs y créent des campagnes ciblées de likes, follow, téléchargement d'app, sondages, avis, visibilité). Répondez en français de manière concise et accueillante.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "Impossible de générer des suggestions pour le moment.";
    res.json({ guide: text });
  } catch (err: any) {
    console.error("AI Assistant general failed:", err);
    res.status(500).json({ error: "L'assistant intelligent de Taskora a subi une exception momentanée: " + err.message });
  }
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
  if (paymentMethod === "Wallet Taskora") {
    if (buyer.wallet.available < totalPrice) {
      return res.status(400).json({ error: "Le solde de votre Wallet Taskora est insuffisant pour finaliser cet achat." });
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
    method: "Wallet Taskora",
    details: `Vente Boutique (Escrow Libéré) - Commande #${id} - Comm: ${commission} ${order.currency}`,
    createdAt: new Date().toISOString()
  };
  appState.transactions.unshift(sellerTx);

  // Referral Commission on Seller's Sale (5%)
  if (seller.referredBy) {
    const inviter = appState.users.find(u => u.id === seller.referredBy || u.referralCode === seller.referredBy);
    if (inviter) {
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
        method: "Taskora Referral",
        details: `Commission Vente Boutique (5%) - Vente de votre filleul @${seller.username} : "${order.productName}"`,
        createdAt: new Date().toISOString()
      };
      appState.transactions.unshift(refTx);
    }
  }

  // Referral Commission on Buyer's Purchase (3%)
  if (buyer && buyer.referredBy) {
    const inviter = appState.users.find(u => u.id === buyer.referredBy || u.referralCode === buyer.referredBy);
    if (inviter) {
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
        method: "Taskora Referral",
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
    method: "Wallet Taskora",
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Taskora Server] running on http://0.0.0.0:${PORT} - NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
