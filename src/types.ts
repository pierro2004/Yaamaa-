/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "participant" | "advertiser" | "admin" | "founder";

export interface User {
  id: string;
  email: string;
  password?: string;
  phone?: string;
  name: string;
  username: string;
  avatar: string;
  role: UserRole;
  level: number;
  xp: number;
  wallet: {
    available: number;
    pending: number;
    totalEarned: number;
    referralEarned: number;
  };
  country: string;
  currency: string;
  referralCode: string;
  referredBy?: string;
  giftPoints?: number; // points balance to buy/send gifts
  giftPointsEarned?: number; // points earned from receiving gifts
  is2faEnabled: boolean;
  isSuspended: boolean;
  walletBlock?: {
    isBlocked: boolean;
    reason: string;
    blockedByAdminId: string;
    blockedByUsername: string;
    blockedAt: string;
    durationDays?: number;
    internalComment?: string;
  };
  adminPermissions?: {
    manageUsers: boolean;
    managePublications: boolean;
    manageVirtualGifts: boolean;
    manageBadges: boolean;
    manageApi: boolean;
    managePayments: boolean;
    manageWithdrawals: boolean;
    manageWallets: boolean;
    blockWallets: boolean;
    unblockWallets: boolean;
    manageMerchantNumbers: boolean;
    manageSubscriptions: boolean;
    manageStatistics: boolean;
    accessReports: boolean;
    viewAuditLogs: boolean;
    generalSettings: boolean;
    createAdmins: boolean;
    deleteAdmins: boolean;
    manageRolesAndPermissions: boolean;
  };
  friendIds?: string[];
  address?: string;
  bio?: string;
  story?: string;
  merchantNumber?: string;
  merchantNumberPurchasedAt?: string;
  merchantNumberEligible?: boolean;
  merchantPackType?: "premium" | "gold" | "diamond";
  createdAt?: string;
  privacySettings?: {
    isProfilePrivate?: boolean;
    hideMerchantNumber?: boolean;
    hideJoinDate?: boolean;
    hidePublications?: boolean;
    hideHistory?: boolean;
  };
  yaamaaAiActive?: boolean;
  yaamaaAiExpiresAt?: string;
  yaamaaAiSettings?: YaamaaAiSettings;
  yaamaaAiStats?: YaamaaAiStats;
  yaamaaAiHandledConversations?: YaamaaAiHandledConversation[];
  yaamaaAiNotifications?: YaamaaAiNotification[];
  status?: "online" | "offline" | "unavailable";
  language?: "fr" | "en";
  notifications?: Array<{
    id: string;
    title: string;
    desc: string;
    time: string;
    timestamp?: string;
    read?: boolean;
    priority?: "info" | "standard" | "important" | "urgent" | "critical";
    category?: "communication" | "account" | "wallet" | "merchant" | "referral" | "gifts" | "publications" | "moderation" | "admin" | "security";
    linkView?: string;
  }>;
  yaamaaChatApproved?: boolean;
  yaamaaChatRejected?: boolean;
  yaamaaChatApprovedAt?: string;
  notificationPreferences?: {
    calls: boolean;
    messages: boolean;
    gifts: boolean;
    payments: boolean;
    promotions: boolean;
    officialAnnouncements: boolean;
    groupActivity: boolean;
    reminders: boolean;
    securityAlerts: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    soundRingtoneCall: string;
    soundRingtoneMsg: string;
    soundRingtoneGift: string;
    soundRingtonePayment: string;
    soundRingtoneAlert: string;
  };
}

export type MissionType =
  | "watch_video"
  | "like_post"
  | "follow_account"
  | "visit_profile"
  | "read_article"
  | "download_app"
  | "play_game"
  | "answer_survey"
  | "keyword_search"
  | "test_product"
  | "give_review"
  | "custom";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  video?: string;
  destLink: string;
  type: MissionType;
  budgetTotal: number;
  rewardPerUser: number;
  participantsCount: number;
  commission: number;
  totalToPay: number;
  targeting: {
    countries: string[];
    languages: string[];
    gender: "all" | "male" | "female";
    ageMin: number;
    ageMax: number;
    interests: string[];
    devices: string[];
    minUserLevel: number;
  };
  schedule: {
    immediate: boolean;
    startDate?: string;
    endDate?: string;
  };
  status: "pending" | "active" | "paused" | "completed";
  advertiserId: string;
  advertiserName: string;
  createdAt: string;
  completedCount: number;
  proofRequirements: string;
}

export interface TaskSubmission {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignReward: number;
  campaignCurrency: string;
  participantId: string;
  participantUsername: string;
  proofText?: string;
  proofLink?: string;
  proofFileUrl?: string;
  status: "pending" | "approved" | "rejected" | "disputed";
  adminFeedback?: string;
  autoCheckedByAI: boolean;
  fraudProbability: number;
  aiReport?: string;
  createdAt: string;
}

export type TransactionType = "earn" | "withdraw" | "referral_bonus" | "funded_campaign" | "deposit";
export type TransactionStatus = "pending" | "completed" | "failed";

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  method: string;
  details: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ip: string;
}

export interface HomeCustomPost {
  id: string;
  title: string;
  content: string;
  image?: string;
  link?: string;
  date: string;
}

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  pointsPrice: number;
  description?: string;
  rarity?: "Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique";
  category?: "Classique" | "Premium" | "Royale" | "Légendaire" | "Richesse" | "Amour" | "Fête" | "Gaming" | "Sport" | "Afrique" | "Événementiel" | "Saisonnier" | "Exclusif";
  animation?: "petals" | "diamonds" | "money" | "light" | "lightning" | "galaxy" | "rocket" | "lion" | "dragon" | "phoenix" | "castle" | "car" | "confetti" | "fireworks";
  soundEffect?: string;
  duration?: number; // duration in seconds
  isActive?: boolean;
  isTemporary?: boolean;
  expiryDate?: string;
  promotionDiscount?: number; // percentage discount
  pointsValue?: number; // points the recipient gets
}

export interface RechargePack {
  id: string;
  pieces: number;
  price: number; // e.g. price in USD or currency defined by admin
  currency: string;
  title: string;
  isActive: boolean;
}

export interface WithdrawalPack {
  id: string;
  pieces: number;
  value: number; // cash value or conversion rate
  label: string;
  isActive: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  providerType: "payment" | "enterprise" | "ai" | "sms" | "webhook" | "custom";
  recognizedRole: string;
  scope: string;
  status: "active" | "testing" | "revoked";
  createdAt: string;
  lastUsedAt?: string;
  operatorId: string;
}

export interface SystemSettings {
  isWithdrawalFrozen: boolean;
  suspendedCountries: string[];
  suspendedCurrencies: string[];
  platformFeePercentage: number;
  payoutsDistributed: number;
  totalUsersCount: number;
  minWithdrawalAmount?: number;
  baseReward?: number;
  defaultCommission?: number;
  homeCustomHeroTitle?: string;
  homeCustomHeroSubtitle?: string;
  homeCustomHeroDescription?: string;
  homeCustomHeroImage?: string;
  homeCustomPromoTitle?: string;
  homeCustomPromoDescription?: string;
  homeCustomPosts?: HomeCustomPost[];
  merchantNumberPrice?: number;
  merchantPremiumPrice?: number;
  merchantGoldPrice?: number;
  merchantDiamondPrice?: number;
  virtualGifts?: VirtualGift[];
  giftPointsConversionRate?: number; // conversion factor, e.g. 0.01 for 1 point = 0.01 currency units
  autoSenderName?: string; // name e.g. "Yama Assistance"
  autoSenderPhone?: string; // number e.g. "+221701234567"
  autoSenderAvatar?: string; // custom avatar
  rechargePacks?: RechargePack[];
  withdrawalPacks?: WithdrawalPack[];
  apiKeys?: ApiKey[];
  referralProgramEnabled?: boolean;
  referralEligibleTypes?: string[];
  referralCommissionMode?: "fixed" | "percentage";
  referralCommissionValue?: number;
  referralMaxEarningsCap?: number;
  referralMaxReferralsPerUser?: number;
}

// ==========================================
// 🛒 BOUTIQUE / MARKETPLACE TYPE DEFINITIONS
// ==========================================

export interface Shop {
  id: string;
  ownerId: string;
  ownerUsername: string;
  name: string;
  logo?: string;
  description: string;
  country: string;
  region?: string;
  commune?: string;
  cityOrVillage?: string;
  contactInfo: string;
  createdAt: string;
}

export type ProductCategory = "physical" | "digital" | "online_course" | "service" | "software" | "ebook" | "other";

export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  ownerId: string;
  name: string;
  category: ProductCategory;
  description: string;
  targetCountries: string[];
  targetRegions?: string[];
  targetCommunes?: string[];
  region?: string;
  commune?: string;
  cityOrVillage?: string;
  images: string[];
  videoUrl?: string;
  courseLink?: string;
  downloadableFile?: string;
  downloadableFileName?: string;
  quantityAvailable: number;
  price: number;
  currency: string;
  shippingTime: string;
  salesCount: number;
  rating: number;
  termsOfSale: string;
  isApproved: boolean;
  isBanned: boolean;
  createdAt: string;
}

export type OrderStatus = "pending_escrow" | "paid_escrow" | "shipped" | "completed" | "disputed" | "refunded";

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  shopId: string;
  shopName: string;
  sellerId: string;
  buyerId: string;
  buyerUsername: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  shippingAddress: string;
  phoneNumber: string;
  email: string;
  paymentMethod: string;
  trackingNumber?: string;
  status: OrderStatus;
  disputeId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  description: string;
  images: string[];
  reqRefundAmount: number;
  currency: string;
  createdAt: string;
  status: "open" | "resolved_refunded" | "resolved_paid_seller" | "closed";
  adminFeedback?: string;
}

// ==========================================
// 📢 PROMOTIONS TYPE DEFINITIONS
// ==========================================

export type PromoType = "product" | "app" | "website" | "shop" | "youtube" | "facebook" | "tiktok" | "business" | "service";

export interface PromoBudgetFormula {
  tier: "basic" | "standard" | "premium" | "enterprise";
  name: string;
  viewsEstimated: number;
  clicksEstimated: number;
  durationDays: number;
  price: number;
}

export interface PromoCampaign {
  id: string;
  ownerId: string;
  ownerUsername: string;
  type: PromoType;
  title: string;
  productServiceName: string;
  destLink: string;
  description: string;
  instructions: string;
  images: string[];
  videos: string[];
  targetCountries: string[];
  targetRegions?: string[];
  targetCommunes?: string[];
  targetLanguages: string[];
  targetAge: string;
  targetInterests: string[];
  startDate: string;
  endDate: string;
  budgetTier: "basic" | "standard" | "premium" | "enterprise";
  budgetPrice: number;
  currency: string;
  paymentStatus: "pending" | "paid";
  status: "pending_validation" | "active" | "paused" | "completed" | "rejected" | "suspended";
  impressions: number;
  views: number;
  clicks: number;
  ctr: number;
  revenueGenerated: number;
  createdAt: string;
}

export interface PlatformFinancialReport {
  marketplaceCommissions: number;
  advertisingRevenue: number;
  transactionFees: number;
  revenueByCountry: Record<string, number>;
}

export interface SocialMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  recipientId?: string; // Set for private messages
  communityId?: string; // Set for community group messages
  voiceUrl?: string;    // If the message is a voice recording
  voiceDuration?: number; // Duration of voice in seconds
  imageUrl?: string;    // If the message contains a photo/image
  documentUrl?: string; // For PDFs, documents, text files, audio files
  documentName?: string;
  documentType?: "pdf" | "audio" | "text" | "photo" | "other";
  documentSize?: string;
  isCustomOffer?: boolean;
  customOfferId?: string;
  customOfferName?: string;
  customOfferPrice?: number;
  customOfferDescription?: string;
  customOfferStatus?: "pending" | "paid" | "shipped" | "received";
  customOfferOrderId?: string;
  readBy?: string[];
  replyToId?: string;
  replyToText?: string;
  replyToSenderUsername?: string;
  reactions?: Record<string, string[]>;
  translation?: string;
  translatedTo?: string;
  translatedFrom?: string;
  isGift?: boolean;
  giftId?: string;
  giftName?: string;
  giftPoints?: number;
  giftImage?: string;
  isAdminOfficial?: boolean;
  adminCampaignId?: string;
  isAiReply?: boolean;
  aiAgentOwnerId?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  creatorUsername: string;
  memberIds: string[]; // List of user IDs who are members
  invitedIds?: string[]; // List of user IDs who are invited
  createdAt: string;
}

export interface CallParticipant {
  userId: string;
  username: string;
  avatar: string;
  name: string;
  cameraOn: boolean;
  micOn: boolean;
  facingMode: "user" | "environment";
  isMutedByHost?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isHandRaised?: boolean;
  isSpeaking?: boolean;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  type: "voice" | "video";
  status: "ringing" | "active" | "ended";
  createdAt: string;
  callerFacingMode: "user" | "environment";
  receiverFacingMode: "user" | "environment";
  callerCameraOn: boolean;
  receiverCameraOn: boolean;
  participants: CallParticipant[]; // supporting up to 10 participants
  speakerOn?: boolean; // dynamic speaker toggle simulation
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  text: string;
  mediaUrl?: string;
  mediaType: "none" | "image" | "video" | "document" | "link";
  mediaName?: string;
  scheduleType: "immediate" | "scheduled";
  scheduledAt?: string;
  status: "draft" | "scheduled" | "sent";
  targeting: {
    targetGroup: string;
    countries?: string[];
    region?: string;
    city?: string;
  };
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  createdAt: string;
  sentCount?: number;
  readCount?: number;
  recipientCount?: number;
  distributedCount?: number;
  sentAt?: string;
}

export interface YaamaaAiSettings {
  personality: string;
  customKnowledge?: string;
  authorizedTopics?: string;
  forbiddenTopics?: string;
  activationSchedule: "always" | "custom";
  activationStartHour?: number;
  activationEndHour?: number;
  autoReplyOn: boolean;
  authorizesHistory: boolean;
  authorizesStock: boolean;
}

export interface YaamaaAiStats {
  conversationsCount: number;
  satisfactionRate: number;
  responseTime: number;
}

export interface YaamaaAiHandledConversation {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  messageId: string;
  messageText: string;
  aiResponseText: string;
  timestamp: string;
  rating?: number;
  feedback?: string;
}

export interface YaamaaAiNotification {
  id: string;
  senderUsername: string;
  messageSnippet: string;
  timestamp: string;
}

export type SupplierOrDelivererType = "supplier" | "deliverer";
export type SupplierDelivererStatus = "pending" | "approved" | "rejected" | "suspended";

export interface SupplierDelivererProfile {
  id: string;
  userId: string;
  type: SupplierOrDelivererType;
  fullName: string;
  profilePhoto: string;
  companyLogo?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  interventionZone: string;
  professionalAddress: string;
  activityType: string;
  servicesDescription: string;
  idDocumentUrl: string;
  companyDocumentUrl?: string;
  drivingLicenseUrl?: string;
  transportMethod?: string;
  vehiclePhotos?: string[];
  insuranceDocumentUrl?: string;
  certifications?: string[];
  availabilityHours: string;
  rates?: string;
  spokenLanguages?: string[];
  status: SupplierDelivererStatus;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  missionsCompletedCount: number;
  successRate: number;
  createdAt: string;
  adminFeedback?: string;
}

export interface SupplierDelivererReview {
  id: string;
  profileId: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type BadgeTier = "blue" | "bronze" | "gold" | "diamond";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: BadgeTier;
  badgeLabel: string;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    gradient: string;
  };
  description: string;
  benefits: string[];
  initialPrice: number;
  renewalPrice: number;
  durationValue: number;
  durationUnit: "days" | "weeks" | "months" | "years";
  maxReferrals: number;
  referralCommission: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  tier: BadgeTier;
  merchantNumber: string;
  startDate: string;
  expirationDate: string;
  status: "active" | "suspended" | "expired" | "cancelled";
  isAutoRenew: boolean;
  createdAt: string;
  lastRenewedAt?: string;
}

export interface SubscriptionNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "activation" | "reminder" | "expiration" | "renewal" | "suspension" | "reactivation";
  createdAt: string;
  isRead: boolean;
}

export interface MissionRequest {
  id: string;
  profileId: string;
  profileName: string;
  profileType: SupplierOrDelivererType;
  clientId: string;
  clientUsername: string;
  clientAvatar: string;
  title: string;
  description: string;
  budgetOrRates: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
}

export type SupervisionSeverity = "low" | "medium" | "high" | "critical";

export interface SupervisionIncident {
  id: string;
  component: string;
  componentKey: string;
  timestamp: string;
  severity: SupervisionSeverity;
  title: string;
  description: string;
  consequences: string;
  logs: string[];
  impactedUsersCount: number;
  probableCauses: string;
  recommendations: string;
  correctionSteps: string[];
  isAutoCorrectable: boolean;
  status: "active" | "resolved" | "auto_corrected";
  resolvedAt?: string;
}

export interface SupervisionReport {
  id: string;
  type: "daily" | "weekly" | "monthly";
  date: string;
  title: string;
  performanceSummary: string;
  incidentsCount: number;
  resolvedCount: number;
  activeUsersCount: number;
  growthRate: number;
  details: string;
}

export type CallType = "audio_single" | "video_single" | "audio_group" | "video_group" | "audio_meeting" | "video_meeting";
export type CallStatus = "answered" | "missed" | "declined" | "cancelled" | "ongoing" | "completed";

export interface CallRecord {
  id: string;
  type: CallType;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  participants: CallParticipant[];
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: CallStatus;
  isEncrypted: boolean;
  recordingUrl?: string;
}

export type ModerationCategory = "supplier" | "deliverer" | "api_integration" | "account_verification" | "other";
export type ModerationStatus = "pending" | "under_review" | "more_info_requested" | "approved" | "rejected" | "suspended";
export type ModerationUrgency = "normal" | "urgent" | "flagged";

export interface InternalComment {
  id: string;
  adminId: string;
  adminUsername: string;
  text: string;
  createdAt: string;
}

export interface ActionHistoryItem {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  comment?: string;
  createdAt: string;
}

export interface ModerationFile {
  id: string;
  category: ModerationCategory;
  title: string;
  applicantId: string;
  applicantUsername: string;
  applicantName: string;
  applicantAvatar: string;
  createdAt: string;
  status: ModerationStatus;
  urgency: ModerationUrgency;
  assignedAdminId?: string;
  assignedAdminUsername?: string;
  supportingDocuments: Array<{ title: string; url: string; type?: string }>;
  applicantInfo: Record<string, any>;
  internalComments: InternalComment[];
  actionHistory: ActionHistoryItem[];
  rejectionReason?: string;
}






