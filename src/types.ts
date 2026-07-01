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
  is2faEnabled: boolean;
  isSuspended: boolean;
  friendIds?: string[];
  address?: string;
  bio?: string;
  story?: string;
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

