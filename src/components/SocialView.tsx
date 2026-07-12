/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { User, SocialMessage, Community, FriendRequest, CallSession } from "../types";
import { Language, getTranslation } from "../i18n";
import MerchantBadge from "./MerchantBadge";
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  MessageSquare,
  Gift,
  Send,
  PlusCircle,
  Hash,
  Search,
  Check,
  CheckCheck,
  Smile,
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Volume2,
  Play,
  Pause,
  MapPin,
  Sparkles,
  UserX,
  PlusSquare,
  Compass,
  CornerDownRight,
  ChevronRight,
  Info,
  Camera,
  ArrowLeft,
  ArrowDown,
  ShoppingBag,
  CreditCard,
  Phone,
  Video,
  PhoneOff,
  RefreshCw,
  VolumeX,
  MicOff,
  Loader2,
  CornerUpLeft,
  Copy,
  Trash,
  Mail,
  MailOpen
} from "lucide-react";

interface SocialViewProps {
  currentUser: User;
  usersList: User[];
  currentLanguage: Language;
  onRefreshUser: () => void;
  onOpenProfile?: () => void;
  initialActiveFriendId?: string | null;
  initialActiveTab?: "dm" | "communities";
  onViewProfile?: (userId: string) => void;
  onActiveConversationChange?: (hasActiveConv: boolean) => void;
  initiallyOpenGiftsModal?: boolean;
  onResetInitiallyOpenGiftsModal?: () => void;
  systemMetrics?: any;
  onNavigate?: (view: string, subTab?: any) => void;
}

// Preset photo assets for quick & premium messaging in Yaamaa
const PRESET_PHOTOS = [
  {
    name: "Succès Mission",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
    caption: "🔥 Mission validée avec succès sur Yaamaa !"
  },
  {
    name: "Gains & Retrait",
    url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600",
    caption: "💸 Preuve de paiement reçue, Yaamaa paye bien !"
  },
  {
    name: "Motivation",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
    caption: "💪 Ensemble, on va maximiser nos revenus !"
  },
  {
    name: "Graphique de gains",
    url: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=600",
    caption: "📈 Mon solde ne fait que grimper aujourd'hui !"
  }
];

// Programmatically generate a playable WAV base64 audio containing a sweeping tone
function generateSyntheticAudioBase64(durationSeconds: number): string {
  const sampleRate = 4000;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + numSamples, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true); // PCM - Integer
  // channel count
  view.setUint16(22, 1, true); // Mono
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 1, true);
  // bits per sample
  view.setUint16(34, 8, true); // 8-bit audio
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, numSamples, true);

  // Generate a sweeping/vibrating synth tone (330Hz base)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const frequency = 330 + 60 * Math.sin(2 * Math.PI * 1.5 * t);
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const val = Math.floor((sample + 1) * 127);
    view.setUint8(44 + i, val);
  }

  const uint8 = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

export default function SocialView({
  currentUser,
  usersList,
  currentLanguage,
  onRefreshUser,
  onOpenProfile,
  initialActiveFriendId,
  initialActiveTab,
  onViewProfile,
  onActiveConversationChange,
  initiallyOpenGiftsModal,
  onResetInitiallyOpenGiftsModal,
  systemMetrics,
  onNavigate
}: SocialViewProps) {
  const t = getTranslation(currentLanguage);

  // Layout / Active States
  const [activeTab, setActiveTab] = useState<"dm" | "communities">(initialActiveTab || "dm");
  const [activeFriendId, setActiveFriendId] = useState<string | null>(initialActiveFriendId || null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialActiveFriendId) {
      setActiveFriendId(initialActiveFriendId);
      setActiveTab("dm");
    }
  }, [initialActiveFriendId]);

  // DB Data
  const [friends, setFriends] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  // Directory Search & Filters
  const [directorySearch, setDirectorySearch] = useState("");
  const [newMsgText, setNewMsgText] = useState("");

  // Friends see-all and custom search and add states
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccessMsg, setSearchSuccessMsg] = useState<string | null>(null);

  // Group editing states (creator only)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupAvatar, setEditGroupAvatar] = useState("");
  const [editGroupError, setEditGroupError] = useState<string | null>(null);

  // Group Creation States
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommAvatar, setNewCommAvatar] = useState("");
  const [selectedFriendsForNewComm, setSelectedFriendsForNewComm] = useState<string[]>([]);

  // Staged Attachment for unified send flow
  interface StagedAttachment {
    type: "image" | "document" | "voice";
    url: string;
    name?: string;
    size?: string;
    duration?: number;
    documentType?: "pdf" | "audio" | "text" | "photo" | "other";
  }
  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<SocialMessage | null>(null);

  // Long press / reactions popup states
  const [longPressedMessageId, setLongPressedMessageId] = useState<string | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Virtual Gifts System States
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const [giftPointsBalance, setGiftPointsBalance] = useState<number>(currentUser?.giftPoints !== undefined ? currentUser.giftPoints : 1000);
  const [giftPointsEarnedBalance, setGiftPointsEarnedBalance] = useState<number>(currentUser?.giftPointsEarned !== undefined ? currentUser.giftPointsEarned : 0);
  const [giftConversionRate, setGiftConversionRate] = useState<number>(0.01);
  const [systemGifts, setSystemGifts] = useState<any[]>([]);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [pointsToConvert, setPointsToConvert] = useState<string>("100");
  const [isConverting, setIsConverting] = useState(false);

  React.useEffect(() => {
    if (initiallyOpenGiftsModal) {
      const recipientId = activeFriendId || (activeCommunityId ? (communities.find((c: any) => c.id === activeCommunityId)?.creatorId || null) : null);
      setGiftRecipientId(recipientId);
      setGiftCatalogTab("send");
      setShowGiftCatalogModal(true);
      if (onResetInitiallyOpenGiftsModal) {
        onResetInitiallyOpenGiftsModal();
      }
    }
  }, [initiallyOpenGiftsModal, onResetInitiallyOpenGiftsModal, activeFriendId, activeCommunityId, communities]);

  const DEFAULT_LOCAL_GIFTS = [
    { id: "gift_rose", name: "Rose Éternelle", emoji: "🌹", pointsPrice: 10 },
    { id: "gift_heart", name: "Cœur Pulsant", emoji: "💖", pointsPrice: 20 },
    { id: "gift_fire", name: "Flamme Fun", emoji: "🔥", pointsPrice: 30 },
    { id: "gift_beer", name: "Bière Fraîche", emoji: "🍺", pointsPrice: 50 },
    { id: "gift_unicorn", name: "Licorne Magique", emoji: "🦄", pointsPrice: 100 },
    { id: "gift_crown", name: "Couronne Royale", emoji: "👑", pointsPrice: 200 },
    { id: "gift_diamond", name: "Diamant Brillant", emoji: "💎", pointsPrice: 500 },
    { id: "gift_rocket", name: "Fusée Spatiale", emoji: "🚀", pointsPrice: 1000 },
    { id: "gift_castle", name: "Château de Rêve", emoji: "🏰", pointsPrice: 2000 }
  ];

  useEffect(() => {
    if (currentUser) {
      if (currentUser.giftPoints !== undefined) setGiftPointsBalance(currentUser.giftPoints);
      if (currentUser.giftPointsEarned !== undefined) setGiftPointsEarnedBalance(currentUser.giftPointsEarned);
    }
  }, [currentUser]);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (data && data.settings) {
          if (data.settings.virtualGifts) setSystemGifts(data.settings.virtualGifts);
          if (data.settings.giftPointsConversionRate !== undefined) setGiftConversionRate(data.settings.giftPointsConversionRate);
        }
      })
      .catch(err => {
        console.warn("Failed to load settings:", err);
      });
  }, []);

  const handleBuyPoints = async (packType: string) => {
    setBuyingPack(packType);
    try {
      const res = await fetch("/api/gifts/buy-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, packType })
      });
      if (res.ok) {
        const data = await res.json();
        setGiftPointsBalance(data.newPointsBalance);
        showToast(`Succès ! +${data.pointsAdded} points ajoutés à votre compte. 🎉`);
        if (onRefreshUser) onRefreshUser();
      } else {
        const err = await res.json();
        showErrorToast(err?.error || "Erreur lors de l'achat.");
      }
    } catch (err) {
      showErrorToast("Erreur de connexion.");
    } finally {
      setBuyingPack(null);
    }
  };

  const handleSendGift = async (giftId: string) => {
    if (!activeFriendId) {
      showErrorToast("Veuillez d'abord sélectionner un ami à qui envoyer le cadeau !");
      return;
    }
    const targetGift = (systemGifts.length > 0 ? systemGifts : DEFAULT_LOCAL_GIFTS).find(g => g.id === giftId);
    if (!targetGift) return;

    if (giftPointsBalance < targetGift.pointsPrice) {
      showErrorToast("Points insuffisants. Veuillez acheter des points d'abord !");
      return;
    }

    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: activeFriendId,
          giftId: giftId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGiftPointsBalance(data.senderPoints);
        showToast(`Cadeau ${targetGift.name} envoyé avec succès ! 🎁`);
        
        // Append message locally so it appears in chat instantly
        setMessages(prev => [...prev, data.message]);
        if (onRefreshUser) onRefreshUser();
        setShowGiftsModal(false);
      } else {
        const err = await res.json();
        showErrorToast(err?.error || "Erreur d'envoi.");
      }
    } catch (err) {
      showErrorToast("Erreur de connexion.");
    }
  };

  const handleConvertPoints = async () => {
    const pts = parseInt(pointsToConvert);
    if (isNaN(pts) || pts <= 0) {
      showErrorToast("Veuillez saisir un nombre valide de points.");
      return;
    }
    if (giftPointsEarnedBalance < pts) {
      showErrorToast("Vous ne possédez pas autant de points reçus.");
      return;
    }
    setIsConverting(true);
    try {
      const res = await fetch("/api/gifts/convert-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          pointsToConvert: pts
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGiftPointsEarnedBalance(data.newPointsEarned);
        showToast(`Conversion réussie ! +${data.convertedAmount.toLocaleString()} FCFA ajoutés à votre portefeuille. 💰`);
        if (onRefreshUser) onRefreshUser();
      } else {
        const err = await res.json();
        showErrorToast(err?.error || "Erreur lors de la conversion.");
      }
    } catch (err) {
      showErrorToast("Erreur de connexion.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleStartLongPress = (msgId: string) => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      setLongPressedMessageId(msgId);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (e) {}
      }
    }, 500);
  };

  const handleCancelLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  // Voice Message States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isVirtualRecording, setIsVirtualRecording] = useState(false);

  // Custom Offer Form States
  const [showCustomOfferModal, setShowCustomOfferModal] = useState(false);
  const [coTitle, setCoTitle] = useState("");
  const [coDesc, setCoDesc] = useState("");
  const [coPrice, setCoPrice] = useState("");
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [coQuantity, setCoQuantity] = useState<number>(1);
  const [recordingIntervalId, setRecordingIntervalId] = useState<any>(null);

  // Virtual Gifts & Full Screen Animations States
  const [showGiftCatalogModal, setShowGiftCatalogModal] = useState(false);
  const [giftSendingError, setGiftSendingError] = useState<string | null>(null);
  const [giftSendingSuccess, setGiftSendingSuccess] = useState<string | null>(null);
  const [giftCategoryFilter, setGiftCategoryFilter] = useState("all");
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<{ id: string; emoji: string; name: string; type: string; sound: string; duration: number } | null>(null);
  const playedGiftIds = useRef<Set<string>>(new Set());
  
  // Custom interactive gift states
  const [giftCatalogTab, setGiftCatalogTab] = useState<"send" | "buy" | "withdraw">("send");
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null);
  const [purchasingPoints, setPurchasingPoints] = useState(false);
  const [convertingPoints, setConvertingPoints] = useState(false);
  const [conversionPointsAmount, setConversionPointsAmount] = useState("");

  // Navigation & Modal History Sync (Support phone hardware & browser back buttons)
  const previousChatStateRef = React.useRef(false);
  const previousGiftStateRef = React.useRef(false);

  const isChatOpen = !!(activeFriendId || activeCommunityId);

  // Synchronize active chat with browser history
  React.useEffect(() => {
    if (isChatOpen && !previousChatStateRef.current) {
      window.history.pushState({ inChat: true }, "", "");
    } else if (!isChatOpen && previousChatStateRef.current) {
      if (window.history.state?.inChat) {
        window.history.back();
      }
    }
    previousChatStateRef.current = isChatOpen;
  }, [isChatOpen]);

  // Synchronize gift catalog with browser history
  React.useEffect(() => {
    if (showGiftCatalogModal && !previousGiftStateRef.current) {
      window.history.pushState({ inGiftCatalog: true }, "", "");
    } else if (!showGiftCatalogModal && previousGiftStateRef.current) {
      if (window.history.state?.inGiftCatalog) {
        window.history.back();
      }
    }
    previousGiftStateRef.current = showGiftCatalogModal;
  }, [showGiftCatalogModal]);

  // Listen to popstate to close chat or gift catalog
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showGiftCatalogModal) {
        setShowGiftCatalogModal(false);
        return;
      }
      if (activeFriendId || activeCommunityId) {
        setActiveFriendId(null);
        setActiveCommunityId(null);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showGiftCatalogModal, activeFriendId, activeCommunityId]);

  // Fetch current user's products when custom offer modal is opened
  useEffect(() => {
    if (showCustomOfferModal && currentUser) {
      fetch("/api/products")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const userProds = data.filter((p: any) => p.ownerId === currentUser.id && !p.isBanned);
            setMyProducts(userProds);
          }
        })
        .catch((err) => console.error("Error fetching my products for custom offer:", err));
    }
  }, [showCustomOfferModal, currentUser]);

  // Automatic timeout dismissal for premium 4D gift animations
  useEffect(() => {
    if (activeGiftAnimation) {
      const durationMs = (activeGiftAnimation.duration || 5) * 1000;
      const timer = setTimeout(() => {
        setActiveGiftAnimation(null);
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [activeGiftAnimation]);

  // Voice playback emulation states
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const playbackIntervalRef = useRef<any>(null);
  const soundIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentPlayingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Call session states
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [showCallTypeModal, setShowCallTypeModal] = useState(false);
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const [callFacingMode, setCallFacingMode] = useState<"user" | "environment">("user");
  const [isMuted, setIsMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showInviteListModal, setShowInviteListModal] = useState(false);

  // Premium Chat Scrolling, Typing, and Call Indicators
  const [showNewMessagesBtn, setShowNewMessagesBtn] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callStatusMessage, setCallStatusMessage] = useState<string>("Connexion...");
  const [isCallOnHold, setIsCallOnHold] = useState(false);
  const [typers, setTypers] = useState<Array<{ id: string; name: string; username: string }>>([]);
  const typingTimeoutRef = useRef<any>(null);

  // Call system refs
  const callVideoLocalRef = useRef<HTMLVideoElement | null>(null);
  const callVideoRemoteRef = useRef<HTMLVideoElement | null>(null);
  const callPollingIntervalIdRef = useRef<any>(null);

  // Silence detection refs
  const silenceAudioCtxRef = useRef<AudioContext | null>(null);
  const silenceIntervalIdRef = useRef<any>(null);

  // Image attach dialog states
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImageCaption, setCustomImageCaption] = useState("");

  // Live Camera and File Attachment States & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Group Member Management States
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Unread Message, Notification, Call Audio and Ringtone States/Refs
  const [unreadStats, setUnreadStats] = useState<{ unreadDMs: Record<string, number>; unreadCommunities: Record<string, number> }>({ unreadDMs: {}, unreadCommunities: {} });
  const [inAppNotification, setInAppNotification] = useState<{ title: string; text: string; type: "dm" | "community"; id: string; senderName: string } | null>(null);

  const callAudioRecorderRef = useRef<MediaRecorder | null>(null);
  const callAudioPlayerIntervalRef = useRef<any>(null);
  const lastAudioTimestampRef = useRef<number>(0);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingAudioQueueRef = useRef<boolean>(false);
  const activeCallRef = useRef<CallSession | null>(null);

  const ringtoneIntervalRef = useRef<any>(null);
  const ringtoneAudioCtxRef = useRef<AudioContext | null>(null);
  const isRingtonePlayingRef = useRef<boolean>(false);

  // Keep track of the last faceMode & camera state to prevent getUserMedia polling conflicts
  const lastActiveFacingModeRef = useRef<string | null>(null);
  const lastActiveCameraOnRef = useRef<boolean | null>(null);

  // Toast States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatScrollerRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // Polling data
  useEffect(() => {
    // Request notification permission if supported
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(err => console.log("Notification permission error:", err));
    }

    fetchSocialData();
    fetchPendingFriendRequests();
    markActiveMessageAsRead();
    fetchUnreadStats();

    const interval = setInterval(() => {
      fetchMessagesAndCommunities();
      fetchPendingFriendRequests();
      markActiveMessageAsRead();
      fetchUnreadStats();
    }, 1000); // 1-second ultra-high-speed polling for lightning-fast responsiveness

    return () => {
      clearInterval(interval);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [activeFriendId, activeCommunityId, activeTab]);

  // Sync state for local friend objects when users list or currentUser updates
  useEffect(() => {
    if (currentUser) {
      const friendIds = currentUser.friendIds || [];
      const matchedFriends = usersList.filter(u => friendIds.includes(u.id));
      setFriends(matchedFriends);
    }
  }, [currentUser, usersList]);

  // Smart, user-controlled scroll behavior:
  // - Do NOT scroll to bottom when switching to a different conversation (let the user read or scroll at their leisure).
  // - When new messages arrive:
  //   - If the last message was sent by the current user, always scroll to bottom.
  //   - If the last message was sent by another user, only scroll to bottom if the user was already near the bottom.
  useEffect(() => {
    const activeConvId = activeTab === "dm" ? activeFriendId : activeCommunityId;
    const isNewConversation = prevActiveIdRef.current !== activeConvId;
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;

    // Check if the latest message was sent by current user
    const lastMessage = messages[messages.length - 1];
    const isLastMessageMine = lastMessage?.senderId === currentUser.id;

    if (isNewConversation) {
      prevActiveIdRef.current = activeConvId;
      setNewMessagesCount(0);
      setShowNewMessagesBtn(false);
      setTimeout(() => {
        const scroller = chatScrollerRef.current;
        if (scroller) {
          scroller.scrollTop = scroller.scrollHeight;
        }
      }, 50);
    } else if (hasNewMessages) {
      const scroller = chatScrollerRef.current;
      if (scroller) {
        const threshold = 150; // pixels from bottom to trigger auto-scroll
        const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < threshold;

        if (isNearBottom || isLastMessageMine) {
          scroller.scrollTop = scroller.scrollHeight;
          setNewMessagesCount(0);
          setShowNewMessagesBtn(false);
        } else {
          // Increment unread count badge for the floating scroll bottom button
          setNewMessagesCount(prev => prev + 1);
          setShowNewMessagesBtn(true);
        }
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, activeFriendId, activeCommunityId, activeTab, currentUser.id]);

  const handleChatScroll = () => {
    const scroller = chatScrollerRef.current;
    if (!scroller) return;

    const threshold = 180;
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

    if (distanceFromBottom > threshold) {
      setShowNewMessagesBtn(true);
    } else {
      setShowNewMessagesBtn(false);
      setNewMessagesCount(0);
    }
  };

  const handleScrollToBottom = () => {
    const scroller = chatScrollerRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
    setNewMessagesCount(0);
    setShowNewMessagesBtn(false);
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showErrorToast = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  // API calls
  const handleSearchFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchSuccessMsg(null);
    setSearchResults([]);
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Veuillez saisir un nom, un identifiant ou un numéro de marchand.");
      return;
    }
    try {
      const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = usersList.filter(u => 
        u.id !== currentUser.id && 
        (
          u.username.toLowerCase().includes(query.toLowerCase()) || 
          u.name.toLowerCase().includes(query.toLowerCase()) || 
          (u.merchantNumber && u.merchantNumber.toLowerCase().includes(query.toLowerCase())) ||
          (u.merchantNumber && u.merchantNumber.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanQuery)) ||
          (u.phone && u.phone.includes(query)) ||
          u.id.toLowerCase() === query.toLowerCase()
        )
      );
      if (found.length > 0) {
        setSearchResults(found);
      } else {
        setSearchError("Aucun membre ou marchand trouvé avec ce numéro ou nom.");
      }
    } catch (err) {
      setSearchError("Erreur lors de la recherche.");
    }
  };

  const handleAddSearchedFriend = async (friendId: string) => {
    try {
      await handleSendFriendRequest(friendId);
      setSearchSuccessMsg("Demande d'ami envoyée avec succès !");
      showToast("Demande d'ami envoyée !");
    } catch (err) {
      setSearchError("Erreur lors de l'envoi de la demande d'ami.");
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditGroupError(null);
    if (!editGroupName.trim()) {
      setEditGroupError("Le nom du groupe ne peut pas être vide.");
      return;
    }
    try {
      const res = await fetch(`/api/social/communities/${activeCommunityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName,
          description: editGroupDescription,
          avatar: editGroupAvatar,
          userId: currentUser.id
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCommunities(prev => prev.map(c => c.id === activeCommunityId ? updated : c));
        setShowEditGroupModal(false);
        showToast("Le groupe a été modifié avec succès !");
      } else {
        const err = await res.json();
        setEditGroupError(err.error || "Impossible de modifier le groupe");
      }
    } catch (err) {
      setEditGroupError("Erreur réseau");
    }
  };

  const fetchSocialData = async () => {
    try {
      const commRes = await fetch("/api/social/communities");
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunities(Array.isArray(commData) ? commData : []);
      }
      await fetchMessagesOnly();
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  };

  const fetchMessagesAndCommunities = async () => {
    try {
      const commRes = await fetch("/api/social/communities");
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunities(Array.isArray(commData) ? commData : []);
      }
      await fetchMessagesOnly();
    } catch (err) {
      console.error("Error fetching messages/communities periodically:", err);
    }
  };

  // ==========================================
  // INTUITIVE REAL-TIME VIDEO & VOICE CALLS
  // ==========================================

  useEffect(() => {
    pollCallSessions();
    const callInterval = setInterval(() => {
      pollCallSessions();
    }, 800); // 800ms ultra-rapid connection polling rate for instant answer/ringing responsiveness

    return () => {
      clearInterval(callInterval);
    };
  }, [currentUser, activeCall, callStream]);

  // Poll typing status of other users in the current discussion
  useEffect(() => {
    if (!currentUser) return;
    const activeConvId = activeTab === "dm" ? activeFriendId : activeCommunityId;
    if (!activeConvId) {
      setTypers([]);
      return;
    }

    const pollTyping = async () => {
      try {
        let url = `/api/social/typing?userId=${currentUser.id}`;
        if (activeTab === "dm" && activeFriendId) {
          url += `&otherId=${activeFriendId}`;
        } else if (activeTab === "communities" && activeCommunityId) {
          url += `&communityId=${activeCommunityId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTypers(data.typers || []);
        }
      } catch (err) {
        console.error("Error polling typing status:", err);
      }
    };

    pollTyping();
    const interval = setInterval(pollTyping, 1200);
    return () => clearInterval(interval);
  }, [currentUser, activeTab, activeFriendId, activeCommunityId]);

  // Call duration counter
  useEffect(() => {
    let timer: any = null;
    if (activeCall && activeCall.status === "active") {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  const [isTypingState, setIsTypingState] = useState(false);

  const handleTextareaChange = (val: string) => {
    setNewMsgText(val);
    if (!currentUser) return;

    const otherId = activeTab === "dm" ? activeFriendId || undefined : undefined;
    const communityId = activeTab === "communities" ? activeCommunityId || undefined : undefined;

    if (!isTypingState) {
      setIsTypingState(true);
      fetch("/api/social/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, otherId, communityId, isTyping: true })
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      fetch("/api/social/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, otherId, communityId, isTyping: false })
      }).catch(() => {});
    }, 2500);
  };

  const pollCallSessions = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/social/calls?userId=${currentUser.id}`);
      if (res.ok) {
        const calls: CallSession[] = await res.json();
        const liveCall = calls.find(c => c.status !== "ended");

        if (liveCall) {
          activeCallRef.current = liveCall;

          // Check if we were kicked or removed from the call by the host
          const isInCall = liveCall.callerId === currentUser.id || liveCall.receiverId === currentUser.id || (liveCall.participants && liveCall.participants.some(p => p.userId === currentUser.id));
          if (!isInCall) {
            stopAllCallStreams();
            setActiveCall(null);
            showToast("Vous avez été retiré de la conférence par l'organisateur 🚷");
            return;
          }

          // Check if the host has muted our microphone
          if (liveCall.participants) {
            const selfPart = liveCall.participants.find(p => p.userId === currentUser.id);
            if (selfPart) {
              if (selfPart.isMutedByHost && !isMuted) {
                setIsMuted(true);
                showToast("L'administrateur a coupé votre micro 🔇");
                if (callStream) {
                  callStream.getAudioTracks().forEach(track => { track.enabled = false; });
                }
              }
            }
          }

          // Automatic Ringtone play for receiver
          if (liveCall.status === "ringing" && liveCall.receiverId === currentUser.id) {
            startRingtone();
          } else {
            stopRingtone();
          }

          // Start voice streaming audio loops for active calls
          if (liveCall.status === "active") {
            const opponentId = liveCall.callerId === currentUser.id ? liveCall.receiverId : liveCall.callerId;
            startAudioReceiving(opponentId);
            if (callStream) {
              startAudioTransmission(callStream);
            }
          }

          // If a live call is found and has updates, update local state
          const isCaller = liveCall.callerId === currentUser.id;
          const myFacingMode = isCaller ? liveCall.callerFacingMode : (liveCall.participants?.find(p => p.userId === currentUser.id)?.facingMode || "user");
          const myCamOn = isCaller ? liveCall.callerCameraOn : (liveCall.participants?.find(p => p.userId === currentUser.id)?.cameraOn !== false);

          const videoStateChanged = lastActiveFacingModeRef.current !== myFacingMode || lastActiveCameraOnRef.current !== myCamOn || !callStream;
          
          if (!activeCall || activeCall.id !== liveCall.id || activeCall.status !== liveCall.status || activeCall.participants?.length !== liveCall.participants?.length || videoStateChanged) {
            setActiveCall(liveCall);
            setCallFacingMode(myFacingMode);
            setCameraEnabled(myCamOn);

            if (videoStateChanged) {
              lastActiveFacingModeRef.current = myFacingMode;
              lastActiveCameraOnRef.current = myCamOn;

              if (liveCall.status === "active" || (liveCall.status === "ringing" && isCaller)) {
                if (liveCall.type === "video") {
                  if (myCamOn) {
                    startCallCameraStream(myFacingMode);
                  } else {
                    startCallAudioStream();
                  }
                } else {
                  startCallAudioStream();
                }
              } else if (liveCall.status === "ringing" && !isCaller) {
                if (liveCall.type === "video") {
                  startCallCameraStream(myFacingMode);
                } else {
                  startCallAudioStream();
                }
              }
            }
          }
        } else {
          // No live calls anymore - clean up streams if active
          stopRingtone();
          if (activeCall) {
            stopAllCallStreams();
            setActiveCall(null);
          }
        }
      }
    } catch (err) {
      console.error("Error polling calls:", err);
    }
  };

  const handleInviteToCall = async (friendId: string) => {
    if (!activeCall) return;
    try {
      const res = await fetch(`/api/social/calls/${activeCall.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: friendId })
      });
      if (res.ok) {
        const updatedCall = await res.json();
        setActiveCall(updatedCall);
        showToast("Invitation envoyée avec succès ! 🚀");
        setShowInviteListModal(false);
      } else {
        const errData = await res.json();
        showErrorToast(errData.error || "Erreur d'invitation");
      }
    } catch (err) {
      console.error("Error inviting friend:", err);
    }
  };

  const handleToggleMic = async () => {
    if (!activeCall) return;
    const nextMicState = !isMuted;
    setIsMuted(nextMicState);

    // Update audio tracks of active stream locally
    if (callStream) {
      callStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMicState;
      });
    }

    try {
      const res = await fetch(`/api/social/calls/${activeCall.id}/update-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          micOn: !nextMicState
        })
      });
      if (res.ok) {
        const updatedCall = await res.json();
        setActiveCall(updatedCall);
      }
    } catch (err) {
      console.error("Error updating mic state:", err);
    }
  };

  const handleHostAction = async (targetUserId: string, action: "kick" | "toggle-mute") => {
    if (!activeCall) return;
    try {
      const res = await fetch(`/api/social/calls/${activeCall.id}/host-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: currentUser.id,
          targetUserId,
          action
        })
      });
      if (res.ok) {
        const updatedCall = await res.json();
        setActiveCall(updatedCall);
        showToast(action === "kick" ? "Participant exclu !" : "Statut micro mis à jour !");
      } else {
        const errData = await res.json();
        showErrorToast(errData.error || "Action impossible");
      }
    } catch (err) {
      console.error("Error executing host action:", err);
    }
  };

  const startCallCameraStream = async (facingModeValue: "user" | "environment") => {
    if (callStream) {
      try {
        callStream.getVideoTracks().forEach(track => track.stop());
      } catch (e) {}
    }

    try {
      const constraints = {
        video: { facingMode: facingModeValue },
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCallStream(stream);

      if (callVideoLocalRef.current) {
        callVideoLocalRef.current.srcObject = stream;
        callVideoLocalRef.current.play().catch(e => console.log("Video play error", e));
      }
    } catch (err) {
      console.warn("Could not access camera/mic, falling back to mock stream:", err);
      startMockCallStream();
    }
  };

  const startCallAudioStream = async () => {
    if (callStream) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setCallStream(stream);
    } catch (err) {
      console.warn("Could not access mic, using silent stream:", err);
      startMockCallStream();
    }
  };

  const startMockCallStream = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let frame = 0;
        const interval = setInterval(() => {
          if (!activeCall) {
            clearInterval(interval);
            return;
          }
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 50 + Math.sin(frame * 0.1) * 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Simulateur d'Appel Actif", canvas.width / 2, canvas.height / 2 + 10);
          ctx.fillStyle = "#64748b";
          ctx.font = "10px Inter, sans-serif";
          ctx.fillText(`Mode: ${callFacingMode === "user" ? "Selfie 🤳" : "Arrière 📷"}`, canvas.width / 2, canvas.height / 2 + 30);
          
          frame++;
        }, 100);

        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
        if (stream) {
          setCallStream(stream);
          if (callVideoLocalRef.current) {
            callVideoLocalRef.current.srcObject = stream;
            callVideoLocalRef.current.play().catch(e => console.log("Video play error", e));
          }
        }
      }
    } catch (e) {
      console.error("Error creating mock call stream:", e);
    }
  };

  const startRingtone = () => {
    if (isRingtonePlayingRef.current) return;
    isRingtonePlayingRef.current = true;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringtoneAudioCtxRef.current = audioCtx;
      
      const playBeep = () => {
        if (!isRingtonePlayingRef.current) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard phone ringtone frequency
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, audioCtx.currentTime); // slightly offset
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        
        setTimeout(() => {
          try { osc1.stop(); } catch(e){}
          try { osc2.stop(); } catch(e){}
          try { osc1.disconnect(); } catch(e){}
          try { osc2.disconnect(); } catch(e){}
          try { gainNode.disconnect(); } catch(e){}
        }, 1600);
      };
      
      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 2500);
    } catch (err) {
      console.error("Audio ringtone error:", err);
    }
  };

  const stopRingtone = () => {
    isRingtonePlayingRef.current = false;
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringtoneAudioCtxRef.current) {
      try {
        ringtoneAudioCtxRef.current.close();
      } catch (e) {}
      ringtoneAudioCtxRef.current = null;
    }
  };

  const startAudioTransmission = (stream: MediaStream) => {
    if (callAudioRecorderRef.current) return;
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const audioStream = new MediaStream(audioTracks);
      let options = {};
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
      let selectedType = '';
      for (const t of types) {
        if (t === '' || (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t))) {
          selectedType = t;
          break;
        }
      }
      if (selectedType) {
        options = { mimeType: selectedType };
      }

      const mediaRecorder = new MediaRecorder(audioStream, options);
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && activeCallRef.current) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            if (typeof reader.result === "string" && activeCallRef.current) {
              const base64 = reader.result.split(',')[1];
              if (base64) {
                fetch(`/api/social/calls/${activeCallRef.current.id}/audio`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: currentUser.id, base64 })
                }).catch(err => {});
              }
            }
          };
          reader.readAsDataURL(e.data);
        }
      };
      mediaRecorder.start(600);
      callAudioRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Error starting voice recorder transmission:", err);
    }
  };

  const stopAudioTransmission = () => {
    if (callAudioRecorderRef.current) {
      try {
        callAudioRecorderRef.current.stop();
      } catch (e) {}
      callAudioRecorderRef.current = null;
    }
  };

  const startAudioReceiving = (opponentId: string) => {
    if (callAudioPlayerIntervalRef.current) return;
    lastAudioTimestampRef.current = Date.now() - 600;
    audioQueueRef.current = [];
    isPlayingAudioQueueRef.current = false;

    const playNextAudio = () => {
      if (audioQueueRef.current.length === 0) {
        isPlayingAudioQueueRef.current = false;
        return;
      }
      isPlayingAudioQueueRef.current = true;
      const base64 = audioQueueRef.current.shift();
      if (!base64) {
        playNextAudio();
        return;
      }
      try {
        const audioUrl = `data:audio/webm;base64,${base64}`;
        const audio = new Audio(audioUrl);
        audio.volume = isSpeakerOn ? 1.0 : 0.45;
        audio.play().then(() => {
          audio.onended = () => {
            playNextAudio();
          };
        }).catch(() => {
          playNextAudio();
        });
      } catch (err) {
        playNextAudio();
      }
    };

    callAudioPlayerIntervalRef.current = setInterval(async () => {
      if (!activeCallRef.current) return;
      try {
        const res = await fetch(`/api/social/calls/${activeCallRef.current.id}/audio?opponentId=${opponentId}&since=${lastAudioTimestampRef.current}`);
        if (res.ok) {
          const chunks = await res.json();
          if (chunks && chunks.length > 0) {
            chunks.forEach((c: any) => {
              audioQueueRef.current.push(c.base64);
              if (c.timestamp > lastAudioTimestampRef.current) {
                lastAudioTimestampRef.current = c.timestamp;
              }
            });
            if (!isPlayingAudioQueueRef.current) {
              playNextAudio();
            }
          }
        }
      } catch (err) {}
    }, 600);
  };

  const stopAudioReceiving = () => {
    if (callAudioPlayerIntervalRef.current) {
      clearInterval(callAudioPlayerIntervalRef.current);
      callAudioPlayerIntervalRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingAudioQueueRef.current = false;
  };

  const stopAllCallStreams = () => {
    stopRingtone();
    stopAudioTransmission();
    stopAudioReceiving();
    activeCallRef.current = null;
    lastActiveFacingModeRef.current = null;
    lastActiveCameraOnRef.current = null;

    if (callStream) {
      callStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      setCallStream(null);
    }
    if (callVideoLocalRef.current) {
      callVideoLocalRef.current.srcObject = null;
    }
    if (callVideoRemoteRef.current) {
      callVideoRemoteRef.current.srcObject = null;
    }
  };

  const handleInitiateCallPrompt = () => {
    setShowCallTypeModal(true);
  };

  const handleStartCall = async (type: "voice" | "video") => {
    if (!currentUser || !activeFriendId) return;
    setShowCallTypeModal(false);

    try {
      const res = await fetch("/api/social/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: currentUser.id,
          receiverId: activeFriendId,
          type
        })
      });

      if (res.ok) {
        const call: CallSession = await res.json();
        setActiveCall(call);
        showToast(`Appel ${type === "video" ? "Vidéo" : "Vocal"} lancé... 📞`);
        
        if (type === "video") {
          startCallCameraStream("user");
        } else {
          startCallAudioStream();
        }
      }
    } catch (err) {
      console.error("Error starting call:", err);
      showErrorToast("Erreur lors du lancement de l'appel.");
    }
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    try {
      const res = await fetch(`/api/social/calls/${activeCall.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const updatedCall = await res.json();
        setActiveCall(updatedCall);
        showToast("Appel accepté ! En cours de connexion...");

        if (updatedCall.type === "video") {
          startCallCameraStream("user");
        } else {
          startCallAudioStream();
        }
      }
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      const res = await fetch(`/api/social/calls/${activeCall.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        stopAllCallStreams();
        setActiveCall(null);
        showToast("Appel terminé.");
      }
    } catch (err) {
      console.error("Error ending call:", err);
      stopAllCallStreams();
      setActiveCall(null);
    }
  };

  const handleToggleCameraRotation = async () => {
    if (!activeCall) return;
    const nextFacingMode = callFacingMode === "user" ? "environment" : "user";
    setCallFacingMode(nextFacingMode);

    try {
      await fetch(`/api/social/calls/${activeCall.id}/update-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          facingMode: nextFacingMode
        })
      });

      if (cameraEnabled && activeCall.type === "video") {
        startCallCameraStream(nextFacingMode);
      }
    } catch (err) {
      console.error("Error updating camera rotation:", err);
    }
  };

  const handleToggleCameraOnOff = async () => {
    if (!activeCall) return;
    const nextCamState = !cameraEnabled;
    setCameraEnabled(nextCamState);

    try {
      await fetch(`/api/social/calls/${activeCall.id}/update-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          cameraOn: nextCamState
        })
      });

      if (nextCamState) {
        startCallCameraStream(callFacingMode);
      } else {
        if (callStream) {
          callStream.getVideoTracks().forEach(track => track.stop());
        }
      }
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };

  const fetchPendingFriendRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/social/friends/requests?userId=${currentUser.id}`);
      if (res.ok) {
        const requests = await res.json();
        setPendingRequests(requests);
      }

      // Fetch outbound sent requests
      const sentRes = await fetch(`/api/social/friends/sent?userId=${currentUser.id}`);
      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentRequests(sentData);
      }
    } catch (err) {
      console.error("Error loading pending requests:", err);
    }
  };

  const handleSimulateAccept = async (requestId: string) => {
    try {
      const res = await fetch("/api/social/friends/simulate-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        showToast("Simulation réussie ! Invitation confirmée par votre ami.");
        fetchPendingFriendRequests();
        onRefreshUser();
      } else {
        showErrorToast("Impossible de simuler l'acceptation.");
      }
    } catch (err) {
      showErrorToast("Erreur de connexion.");
    }
  };

  const fetchMessagesOnly = async () => {
    if (activeTab === "dm" && activeFriendId) {
      const res = await fetch(`/api/social/messages?userId=${currentUser.id}&otherId=${activeFriendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);

        // Play and queue any unplayed virtual gifts in real-time
        if (Array.isArray(data)) {
          data.forEach((msg: any) => {
            if (msg.isGift && !playedGiftIds.current.has(msg.id)) {
              playedGiftIds.current.add(msg.id);
              triggerGiftAnimationEffect(msg);
            }
          });
        }
      }
    } else if (activeTab === "communities" && activeCommunityId) {
      const res = await fetch(`/api/social/messages?communityId=${activeCommunityId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);

        // Play and queue any unplayed virtual gifts in real-time
        if (Array.isArray(data)) {
          data.forEach((msg: any) => {
            if (msg.isGift && !playedGiftIds.current.has(msg.id)) {
              playedGiftIds.current.add(msg.id);
              triggerGiftAnimationEffect(msg);
            }
          });
        }
      }
    } else {
      setMessages([]);
    }
  };

  const playGiftSynthesizedSound = (soundName: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.4, now);
      mainGain.connect(ctx.destination);

      if (soundName === "love_chime" || soundName === "diamond_cling") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(soundName === "love_chime" ? 880 : 1200, now);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(soundName === "love_chime" ? 1100 : 1500, now);

        const bellGain = ctx.createGain();
        bellGain.gain.setValueAtTime(0.3, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc1.connect(bellGain);
        osc2.connect(bellGain);
        bellGain.connect(mainGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
      } else if (soundName === "heartbeat") {
        [0, 0.4, 0.8].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(60, now + delay);
          osc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.15);

          gain.gain.setValueAtTime(0.6, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

          osc.connect(gain);
          gain.connect(mainGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.25);
        });
      } else if (soundName === "royal_fanfare" || soundName === "epic_orchestra") {
        const freqs = soundName === "royal_fanfare" ? [349.23, 440.00, 523.25, 698.46] : [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(f, now + idx * 0.15);
          osc.frequency.linearRampToValueAtTime(f * 1.005, now + 1.5);

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1000, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(mainGain);

          osc.start(now);
          osc.stop(now + 2.0);
        });
      } else if (soundName === "sparkle_magic") {
        for (let i = 0; i < 15; i++) {
          const time = now + i * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(400 + i * 120, time);

          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

          osc.connect(gain);
          gain.connect(mainGain);
          osc.start(time);
          osc.stop(time + 0.3);
        }
      } else if (soundName === "rocket_blast" || soundName === "dragon_breath") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(soundName === "rocket_blast" ? 150 : 800, now);
        filter.frequency.exponentialRampToValueAtTime(soundName === "rocket_blast" ? 1200 : 150, now + 1.5);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(mainGain);

        noiseNode.start(now);
        noiseNode.stop(now + 2.0);
      } else if (soundName === "lion_roar") {
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(45, now + 1.5);
        
        mod.type = "sine";
        mod.frequency.setValueAtTime(35, now);
        modGain.gain.setValueAtTime(25, now);
        
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
        
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(250, now);
        
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(mainGain);
        
        mod.start(now);
        osc.start(now);
        mod.stop(now + 1.7);
        osc.stop(now + 1.7);
      } else if (soundName === "car_engine") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.6);
        osc.frequency.linearRampToValueAtTime(140, now + 1.0);
        osc.frequency.linearRampToValueAtTime(450, now + 1.6);
        osc.frequency.exponentialRampToValueAtTime(40, now + 2.2);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(350, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(mainGain);

        osc.start(now);
        osc.stop(now + 2.5);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.error("Web Audio API synthesis failed:", e);
    }
  };

  const triggerGiftAnimationEffect = (msg: any) => {
    const giftList = systemMetrics?.settings?.virtualGifts || [];
    const giftConfig = giftList.find((g: any) => g.id === msg.giftId);
    
    const animType = giftConfig?.animation || "petals";
    const soundName = giftConfig?.soundEffect || "love_chime";
    const duration = giftConfig?.duration || 5;

    setActiveGiftAnimation({
      id: msg.id,
      emoji: msg.giftImage || "🎁",
      name: msg.giftName || "Cadeau",
      type: animType,
      sound: soundName,
      duration: duration
    });

    playGiftSynthesizedSound(soundName);
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
      osc.frequency.setValueAtTime(1567.98, audioCtx.currentTime + 0.08); // G6
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    } catch (err) {
      console.error("Notification sound error:", err);
    }
  };

  const handleBuyPointsInteractive = async (packType: string, packPrice: number) => {
    if (!currentUser) return;
    setGiftSendingError(null);
    setGiftSendingSuccess(null);
    setPurchasingPoints(true);

    const availableWallet = currentUser.wallet?.available || 0;
    if (availableWallet < packPrice) {
      setGiftSendingError(`Votre solde portefeuille (${availableWallet.toFixed(2)} ${currentUser.currency || "EUR"}) est insuffisant pour ce pack. Redirection vers la recharge...`);
      setPurchasingPoints(false);
      setTimeout(() => {
        if (onNavigate) {
          setShowGiftCatalogModal(false);
          onNavigate("wallet", "deposit");
        } else {
          setGiftSendingError("Veuillez recharger votre portefeuille dans l'onglet Portefeuille.");
        }
      }, 2500);
      return;
    }

    try {
      const res = await fetch("/api/gifts/buy-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          packType: packType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setGiftSendingError(data.error || "Une erreur est survenue lors de l'achat de pièces.");
      } else {
        setGiftSendingSuccess(`Succès ! +${data.pointsAdded} Pièces créditées.`);
        if (onRefreshUser) {
          onRefreshUser();
        }
        setTimeout(() => {
          setGiftSendingSuccess(null);
          setGiftCatalogTab("send");
        }, 1500);
      }
    } catch (err) {
      setGiftSendingError("Erreur réseau lors de l'achat de pièces.");
    } finally {
      setPurchasingPoints(false);
    }
  };

  const handleConvertPointsInteractive = async () => {
    if (!currentUser) return;
    const pts = parseInt(conversionPointsAmount);
    if (isNaN(pts) || pts <= 0) {
      setGiftSendingError("Veuillez entrer un nombre de pièces valide.");
      return;
    }

    const earned = currentUser.giftPointsEarned || 0;
    if (earned < pts) {
      setGiftSendingError(`Solde de pièces gagnées insuffisant. Vous n'avez que ${earned} pièces.`);
      return;
    }

    setGiftSendingError(null);
    setGiftSendingSuccess(null);
    setConvertingPoints(true);

    try {
      const res = await fetch("/api/gifts/convert-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          pointsToConvert: pts
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setGiftSendingError(data.error || "Une erreur est survenue.");
      } else {
        setGiftSendingSuccess(`Félicitations ! Vos pièces ont été converties avec succès.`);
        setConversionPointsAmount("");
        if (onRefreshUser) {
          onRefreshUser();
        }
        setTimeout(() => {
          setGiftSendingSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setGiftSendingError("Erreur réseau lors de la conversion.");
    } finally {
      setConvertingPoints(false);
    }
  };

  const handleSendVirtualGift = async (giftId: string) => {
    const targetRecipientId = giftRecipientId || (activeFriend ? activeFriend.id : null);
    if (!currentUser || !targetRecipientId) {
      setGiftSendingError("Veuillez sélectionner un destinataire.");
      return;
    }
    setGiftSendingError(null);
    setGiftSendingSuccess(null);

    // Client-side quick points check to direct immediately to buy/recharge
    const gifts = systemMetrics?.settings?.virtualGifts || [];
    const gift = gifts.find((g: any) => g.id === giftId);
    const userPoints = currentUser.giftPoints || 0;
    
    if (gift && userPoints < gift.pointsPrice) {
      setGiftSendingError(`Points insuffisants (${userPoints} / ${gift.pointsPrice} Pièces). Veuillez acheter des pièces.`);
      setGiftCatalogTab("buy");
      return;
    }

    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: targetRecipientId,
          giftId: giftId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("insuffisants")) {
          setGiftSendingError(`${data.error} Redirection vers l'achat de pièces...`);
          setGiftCatalogTab("buy");
        } else {
          setGiftSendingError(data.error || "Une erreur est survenue lors de l'envoi du cadeau.");
        }
      } else {
        setGiftSendingSuccess(`Excellent ! Cadeau ${data.gift?.emoji || "🎁"} ${data.gift?.name || ""} envoyé.`);
        
        if (onRefreshUser) {
          onRefreshUser();
        }

        setTimeout(() => {
          setShowGiftCatalogModal(false);
          setGiftSendingSuccess(null);
          setGiftRecipientId(null);
        }, 1200);

        await fetchMessagesOnly();
      }
    } catch (err) {
      setGiftSendingError("Erreur réseau lors de l'envoi du cadeau.");
    }
  };

  const lastMarkedChatRef = useRef<{ type: string; id: string | null }>({ type: "", id: null });

  const markActiveMessageAsRead = async () => {
    if (!currentUser) return;
    
    const currentChatId = activeTab === "dm" ? activeFriendId : activeCommunityId;
    const isNewChat = lastMarkedChatRef.current.type !== activeTab || lastMarkedChatRef.current.id !== currentChatId;
    
    // Check if we actually have unread messages in the active chat using the ref
    const refData = lastUnreadStatsRef.current;
    let hasUnread = false;
    
    if (activeTab === "dm" && activeFriendId) {
      hasUnread = (refData?.unreadDMs?.[activeFriendId] || 0) > 0;
    } else if (activeTab === "communities" && activeCommunityId) {
      hasUnread = (refData?.unreadCommunities?.[activeCommunityId] || 0) > 0;
    }
    
    // If it's not a newly opened chat and there are no unread messages, don't fetch!
    if (!isNewChat && !hasUnread) {
      return;
    }

    try {
      const body: any = { userId: currentUser.id };
      if (activeTab === "dm" && activeFriendId) {
        body.otherId = activeFriendId;
      } else if (activeTab === "communities" && activeCommunityId) {
        body.communityId = activeCommunityId;
      } else {
        return;
      }

      // Update ref immediately so we don't spam requests while this one is in-flight
      lastMarkedChatRef.current = { type: activeTab, id: currentChatId };

      await fetch("/api/social/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      setUnreadStats(prev => {
        const nextDMs = { ...prev.unreadDMs };
        const nextComms = { ...prev.unreadCommunities };
        if (body.otherId) {
          nextDMs[body.otherId] = 0;
        } else if (body.communityId) {
          nextComms[body.communityId] = 0;
        }
        const updated = { unreadDMs: nextDMs, unreadCommunities: nextComms };
        lastUnreadStatsRef.current = updated;
        return updated;
      });
    } catch (err) {
      console.error("Error marking active chat as read:", err);
    }
  };

  const lastUnreadStatsRef = useRef<{ unreadDMs: Record<string, number>; unreadCommunities: Record<string, number> }>({ unreadDMs: {}, unreadCommunities: {} });

  const fetchUnreadStats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/social/messages/unread-stats?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        
        const safeUnreadDMs = data && typeof data.unreadDMs === "object" ? data.unreadDMs : {};
        const safeUnreadCommunities = data && typeof data.unreadCommunities === "object" ? data.unreadCommunities : {};

        let hasNewMessage = false;
        let newMsgSenderName = "";
        let newMsgType: "dm" | "community" = "dm";
        let newMsgId = "";
        
        // Check unread count changes for DMs
        Object.keys(safeUnreadDMs).forEach(friendId => {
          const prevCount = lastUnreadStatsRef.current?.unreadDMs?.[friendId] || 0;
          const currentCount = safeUnreadDMs[friendId] || 0;
          if (currentCount > prevCount && friendId !== activeFriendId) {
            hasNewMessage = true;
            newMsgType = "dm";
            newMsgId = friendId;
            const friendUser = usersList.find(u => u.id === friendId);
            newMsgSenderName = friendUser ? friendUser.name : "Un ami";
          }
        });
        
        // Check unread count changes for Communities
        Object.keys(safeUnreadCommunities).forEach(commId => {
          const prevCount = lastUnreadStatsRef.current?.unreadCommunities?.[commId] || 0;
          const currentCount = safeUnreadCommunities[commId] || 0;
          if (currentCount > prevCount && commId !== activeCommunityId) {
            hasNewMessage = true;
            newMsgType = "community";
            newMsgId = commId;
            const comm = communities.find(c => c.id === commId);
            newMsgSenderName = comm ? comm.name : "Un salon";
          }
        });
        
        if (hasNewMessage) {
          playNotificationSound();
          setInAppNotification({
            id: newMsgId,
            title: newMsgType === "dm" ? "Nouveau message 💬" : "Nouveau message de groupe 👥",
            text: `Vous avez reçu un message de ${newMsgSenderName}`,
            type: newMsgType,
            senderName: newMsgSenderName
          });
          
          setTimeout(() => {
            setInAppNotification(null);
          }, 4500);

          // Native Web Notification Integration (Push notifications)
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              let fetchUrl = "";
              if (newMsgType === "dm") {
                fetchUrl = `/api/social/messages?userId=${currentUser.id}&otherId=${newMsgId}`;
              } else {
                fetchUrl = `/api/social/messages?communityId=${newMsgId}`;
              }
              
              fetch(fetchUrl)
                .then(r => r.json())
                .then(msgs => {
                  if (Array.isArray(msgs) && msgs.length > 0) {
                    const lastMsg = msgs[msgs.length - 1];
                    let bodyPreview = lastMsg.text;
                    if (lastMsg.voiceUrl) bodyPreview = "🎵 Message vocal enregistré";
                    if (lastMsg.imageUrl) bodyPreview = "🖼️ Photo / Image";
                    if (lastMsg.documentUrl) bodyPreview = `📄 Document : ${lastMsg.documentName || "Fichier"}`;
                    if (lastMsg.isCustomOffer) bodyPreview = `💼 Offre commerciale : ${lastMsg.customOfferName} (${lastMsg.customOfferPrice} FCFA)`;

                    const notificationTitle = newMsgType === "dm" 
                      ? `@${lastMsg.senderUsername} (${newMsgSenderName})`
                      : `#${newMsgSenderName} • @${lastMsg.senderUsername}`;

                    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                      navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(notificationTitle, {
                          body: bodyPreview,
                          icon: lastMsg.senderAvatar || "/logo.jpg",
                          badge: "/logo.jpg",
                          tag: `msg-${newMsgId}`,
                          silent: true
                        });
                      });
                    } else {
                      const nativeNotif = new Notification(notificationTitle, {
                        body: bodyPreview,
                        icon: lastMsg.senderAvatar || "/logo.jpg",
                        silent: true
                      });
                      nativeNotif.onclick = () => {
                        window.focus();
                        setActiveTab(newMsgType === "dm" ? "dm" : "communities");
                        if (newMsgType === "dm") {
                          setActiveFriendId(newMsgId);
                          setActiveCommunityId(null);
                        } else {
                          setActiveCommunityId(newMsgId);
                          setActiveFriendId(null);
                        }
                        nativeNotif.close();
                      };
                    }
                  }
                })
                .catch(err => console.log("Error querying last message preview:", err));
            } catch (err) {
              console.error("Error displaying native notification:", err);
            }
          }
        }
        
        const safeData = {
          unreadDMs: safeUnreadDMs,
          unreadCommunities: safeUnreadCommunities
        };
        lastUnreadStatsRef.current = safeData;
        setUnreadStats(safeData);
      }
    } catch (err) {
      console.error("Error loading unread stats:", err);
    }
  };

  // Friend Request Actions
  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      const res = await fetch("/api/social/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser.id, receiverId })
      });

      if (res.ok) {
        showToast("Demande d'invitation envoyée ! En attente de confirmation.");
        onRefreshUser();
      } else {
        const err = await res.json();
        showErrorToast(err.error || "Une invitation est déjà en cours ou vous êtes déjà amis.");
      }
    } catch (err) {
      showErrorToast("Erreur de connexion au serveur.");
    }
  };

  const handleRespondFriendRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/social/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });

      if (res.ok) {
        showToast(action === "accept" ? "Invitation acceptée ! Vous êtes désormais amis." : "Invitation déclinée.");
        onRefreshUser();
        fetchPendingFriendRequests();
      } else {
        showErrorToast("Impossible de répondre à l'invitation.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm("Voulez-vous vraiment retirer cet ami ? Vous ne pourrez plus discuter avec lui.")) {
      return;
    }
    try {
      const res = await fetch("/api/social/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, friendId })
      });

      if (res.ok) {
        showToast("Ami retiré de votre liste.");
        if (activeFriendId === friendId) {
          setActiveFriendId(null);
        }
        onRefreshUser();
      } else {
        showErrorToast("Échec du retrait d'ami.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau.");
    }
  };

  // Message Send Logic (Text, Image, Voice, Documents - background upload with optimistic UI update!)
  const handleSendMessage = async (customPayload?: { 
    text?: string; 
    voiceUrl?: string; 
    voiceDuration?: number; 
    imageUrl?: string;
    documentUrl?: string;
    documentName?: string;
    documentType?: "pdf" | "audio" | "text" | "photo" | "other";
    documentSize?: string;
  }) => {
    let payloadToUse = customPayload;
    if (!payloadToUse && stagedAttachment) {
      payloadToUse = {
        text: newMsgText.trim() || stagedAttachment.name || "",
        voiceUrl: stagedAttachment.type === "voice" ? stagedAttachment.url : undefined,
        voiceDuration: stagedAttachment.type === "voice" ? stagedAttachment.duration : undefined,
        imageUrl: stagedAttachment.type === "image" ? stagedAttachment.url : undefined,
        documentUrl: (stagedAttachment.type !== "image" && stagedAttachment.type !== "voice") ? stagedAttachment.url : undefined,
        documentName: stagedAttachment.name,
        documentType: stagedAttachment.documentType,
        documentSize: stagedAttachment.size
      };
    }

    const textToSend = payloadToUse ? (payloadToUse.text || "") : newMsgText.trim();
    
    if (!textToSend && !payloadToUse?.voiceUrl && !payloadToUse?.imageUrl && !payloadToUse?.documentUrl) return;

    const payload: any = {
      senderId: currentUser.id,
      text: textToSend,
      voiceUrl: payloadToUse?.voiceUrl,
      voiceDuration: payloadToUse?.voiceDuration,
      imageUrl: payloadToUse?.imageUrl,
      documentUrl: payloadToUse?.documentUrl,
      documentName: payloadToUse?.documentName,
      documentType: payloadToUse?.documentType,
      documentSize: payloadToUse?.documentSize
    };

    if (replyingToMessage) {
      payload.replyToId = replyingToMessage.id;
      payload.replyToText = replyingToMessage.text;
      payload.replyToSenderUsername = replyingToMessage.senderUsername;
    }

    if (activeTab === "dm" && activeFriendId) {
      payload.recipientId = activeFriendId;
    } else if (activeTab === "communities" && activeCommunityId) {
      payload.communityId = activeCommunityId;
    } else {
      return;
    }

    // 1. Create temporary optimistic message ID and object
    const tempId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMsg: any = {
      id: tempId,
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      senderAvatar: currentUser.avatar,
      senderName: currentUser.name,
      text: payload.text,
      voiceUrl: payload.voiceUrl,
      voiceDuration: payload.voiceDuration,
      imageUrl: payload.imageUrl,
      documentUrl: payload.documentUrl,
      documentName: payload.documentName,
      documentType: payload.documentType,
      documentSize: payload.documentSize,
      recipientId: payload.recipientId,
      communityId: payload.communityId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      replyToId: payload.replyToId,
      replyToText: payload.replyToText,
      replyToSenderUsername: payload.replyToSenderUsername,
      reactions: {}
    };

    // 2. Immediately append to the messages list (instant render, no waiting!)
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMsgText("");
    setStagedAttachment(null);
    setReplyingToMessage(null);

    // Scroll to bottom immediately
    setTimeout(() => {
      const container = document.getElementById("yaamaa_messages_scroll_container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 80);

    // 3. Initiate the background request
    fetch("/api/social/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      if (res.ok) {
        const newMsg = await res.json();
        // Swap out the temporary optimistic message with the real persistent database record
        setMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isFailed: true } : m));
        showErrorToast("Échec de l'envoi du message.");
      }
    })
    .catch((err) => {
      console.error("Background upload failed:", err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isFailed: true } : m));
      showErrorToast("Erreur de connexion. Message non envoyé.");
    });
  };

  // Delete message helper
  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/social/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        showToast("Message supprimé 🗑️");
      } else {
        showErrorToast("Impossible de supprimer le message.");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Erreur lors de la suppression.");
    }
  };

  // Toggle emoji reaction helper
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/social/messages/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userId: currentUser.id })
      });
      if (res.ok) {
        const updatedMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  // Custom Offer Send Logic
  const handleSendCustomOffer = async () => {
    if (!coTitle.trim()) {
      showErrorToast("Veuillez saisir un titre pour l'ordre.");
      return;
    }
    const priceNum = parseFloat(coPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showErrorToast("Veuillez saisir un montant valide supérieur à 0.");
      return;
    }
    if (coQuantity <= 0) {
      showErrorToast("La quantité doit être supérieure à 0.");
      return;
    }

    const finalTotalPrice = priceNum * coQuantity;
    const finalDescription = `Produit: ${coTitle.trim()}\nQuantité: ${coQuantity}\nPrix unitaire: ${priceNum.toLocaleString()} FCFA\n\n${coDesc.trim() || "Aucune description supplémentaire."}`;

    const payload: any = {
      senderId: currentUser.id,
      recipientId: activeFriendId,
      text: `📝 ORDRE COMMERCIAL : ${coTitle.trim()} (x${coQuantity}) - ${finalTotalPrice.toLocaleString()} FCFA`,
      isCustomOffer: true,
      customOfferId: selectedProductId || undefined,
      customOfferName: `${coTitle.trim()} (x${coQuantity})`,
      customOfferDescription: finalDescription,
      customOfferPrice: finalTotalPrice,
      customOfferStatus: "pending"
    };

    try {
      const res = await fetch("/api/social/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        showToast("L'ordre personnalisé a été envoyé !");
        // Reset form
        setShowCustomOfferModal(false);
        setCoTitle("");
        setCoDesc("");
        setCoPrice("");
        setSelectedProductId("");
        setCoQuantity(1);
      } else {
        showErrorToast("Échec de l'envoi de l'offre.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau lors de l'envoi de l'offre.");
    }
  };

  // Custom Offer Action Handler (Pay, Ship, Receive)
  const handleCustomOfferAction = async (msgId: string, action: "pay" | "ship" | "receive") => {
    try {
      const res = await fetch(`/api/social/messages/${msgId}/offer-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId: currentUser.id,
          paymentMethod: "Wallet Yaamaa" // Uses Wallet Yaamaa by default
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Update the message state in memory
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, customOfferStatus: data.customOfferStatus, customOfferOrderId: data.customOfferOrderId } : m));
        
        if (action === "pay") {
          showToast("Paiement séquestre validé ! Commande enregistrée.");
        } else if (action === "ship") {
          showToast("Service marqué comme livré/expédié !");
        } else if (action === "receive") {
          showToast("Réception confirmée ! Fonds transférés au vendeur.");
        }
        
        // Refresh currentUser info (wallet balance change!)
        onRefreshUser();
      } else {
        showErrorToast(data.error || "Une erreur est survenue lors de l'action.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau lors de la transaction.");
    }
  };

  // Send photo helper
  const handleSendPhoto = (url: string, caption?: string) => {
    setStagedAttachment({
      type: "image",
      url: url,
      name: caption || "Photo de gain"
    });
    setShowImageDropdown(false);
    setCustomImageUrl("");
    setCustomImageCaption("");
    showToast("Photo sélectionnée ! Prête à envoyer.");
  };

  // Camera Access & Live Capture
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      setCameraStream(stream);
      // Wait a tick for the video element to be in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn("Camera hardware access rejected or unavailable inside sandboxed iframe", err);
      showToast("Simulation de caméra activée (Flux de capture virtuel)");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && cameraStream) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          handleSendPhoto(dataUrl, "📸 Photo prise en direct");
          stopCamera();
        }
      } catch (err) {
        console.error("Failed capturing canvas", err);
        // Fallback simulated photo
        const randomID = Math.floor(Math.random() * 1000);
        handleSendPhoto(`https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop&sig=${randomID}`, "📸 Photo prise en direct (Simulation)");
        stopCamera();
      }
    } else {
      // Direct Simulation fallback for local test/iframe restriction
      const randomID = Math.floor(Math.random() * 1000);
      handleSendPhoto(`https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop&sig=${randomID}`, "📸 Photo prise en direct (Simulation)");
      stopCamera();
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Local Storage file import (Photo, Audio, PDF, Text)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Determine type
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav") || file.name.endsWith(".ogg") || file.name.endsWith(".m4a") || file.name.endsWith(".webm");
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (isImage) {
          setStagedAttachment({
            type: "image",
            url: reader.result,
            name: file.name,
            size: formatFileSize(file.size)
          });
          showToast("Photo sélectionnée ! Prête à envoyer.");
        } else if (isAudio) {
          setStagedAttachment({
            type: "document",
            url: reader.result,
            name: file.name,
            documentType: "audio",
            size: formatFileSize(file.size)
          });
          showToast("Fichier audio sélectionné ! Prêt à envoyer.");
        } else if (isPdf) {
          setStagedAttachment({
            type: "document",
            url: reader.result,
            name: file.name,
            documentType: "pdf",
            size: formatFileSize(file.size)
          });
          showToast("Document PDF sélectionné ! Prêt à envoyer.");
        } else {
          setStagedAttachment({
            type: "document",
            url: reader.result,
            name: file.name,
            documentType: "text",
            size: formatFileSize(file.size)
          });
          showToast("Fichier sélectionné ! Prêt à envoyer.");
        }
        setShowImageDropdown(false);
      }
    };
    
    reader.onerror = () => {
      showErrorToast("Impossible de lire le fichier sélectionné.");
    };

    reader.readAsDataURL(file);
    
    // Clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Micro voice message recorder (Actual microphone & MediaRecorder API)
  const startRecording = async () => {
    setIsVirtualRecording(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia non supporté");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      
      setIsRecording(true);
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingIntervalId(interval);


      
    } catch (err) {
      console.warn("Error accessing actual microphone, starting high-fidelity simulated fallback:", err);
      setIsVirtualRecording(true);
      setIsRecording(true);
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingIntervalId(interval);
      showToast("Simulation de micro activée (Enregistrement virtuel de démonstration) 🎙️");
    }
  };

  const cancelRecording = () => {
    if (recordingIntervalId) {
      clearInterval(recordingIntervalId);
    }
    if (silenceIntervalIdRef.current) {
      clearInterval(silenceIntervalIdRef.current);
      silenceIntervalIdRef.current = null;
    }
    if (silenceAudioCtxRef.current) {
      try {
        silenceAudioCtxRef.current.close();
      } catch (e) {}
      silenceAudioCtxRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    
    if (mediaRecorderRef.current) {
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    
    setIsRecording(false);
    setIsVirtualRecording(false);
    setRecordingDuration(0);
    setRecordingIntervalId(null);
  };

  const stopAndStageVoice = () => {
    if (recordingIntervalId) {
      clearInterval(recordingIntervalId);
    }
    if (silenceIntervalIdRef.current) {
      clearInterval(silenceIntervalIdRef.current);
      silenceIntervalIdRef.current = null;
    }
    if (silenceAudioCtxRef.current) {
      try {
        silenceAudioCtxRef.current.close();
      } catch (e) {}
      silenceAudioCtxRef.current = null;
    }
    
    const finalDuration = recordingDuration === 0 ? 3 : recordingDuration;

    if (isVirtualRecording) {
      const base64Audio = generateSyntheticAudioBase64(finalDuration);
      setStagedAttachment({
        type: "voice",
        url: base64Audio,
        duration: finalDuration,
        name: `Message vocal (${finalDuration}s)`
      });
      showToast("Enregistrement vocal terminé. Cliquez sur Envoyer pour l'expédier ! 🎙️");
      setIsRecording(false);
      setIsVirtualRecording(false);
      setRecordingDuration(0);
      setRecordingIntervalId(null);
      return;
    }
    
    if (!mediaRecorderRef.current) {
      setIsRecording(false);
      setIsVirtualRecording(false);
      setRecordingDuration(0);
      setRecordingIntervalId(null);
      return;
    }
    
    const mediaRecorder = mediaRecorderRef.current;
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        setStagedAttachment({
          type: "voice",
          url: base64Audio,
          duration: finalDuration,
          name: `Message vocal (${finalDuration}s)`
        });
        showToast("Enregistrement vocal terminé. Cliquez sur Envoyer pour l'expédier ! 🎙️");
      };
      reader.readAsDataURL(audioBlob);
      
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };
    
    try {
      mediaRecorder.stop();
    } catch (err) {
      console.error("Error stopping recorder:", err);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
    
    setIsRecording(false);
    setIsVirtualRecording(false);
    setRecordingDuration(0);
    setRecordingIntervalId(null);
  };

  const stopVoiceSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    if (currentPlayingAudioRef.current) {
      try {
        currentPlayingAudioRef.current.pause();
      } catch (e) {}
      currentPlayingAudioRef.current = null;
    }
  };

  const playVoiceSound = (durationSec: number, currentProgressPercent: number) => {
    stopVoiceSound();
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const totalTimeMs = durationSec * 1000;
      let elapsedMs = (currentProgressPercent / 100) * totalTimeMs;
      
      // We will produce human-sounding vocal syllables every 180ms
      soundIntervalRef.current = setInterval(() => {
        if (elapsedMs >= totalTimeMs) {
          stopVoiceSound();
          return;
        }
        
        // Build voice formant synthesizer
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        // Human speech pitch simulation
        const pitch = 130 + Math.sin(elapsedMs / 400) * 35 + Math.random() * 15;
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.type = "sawtooth";
        
        osc2.frequency.setValueAtTime(pitch * 2 + Math.random() * 5, ctx.currentTime);
        osc2.type = "triangle";
        
        // Bandpass filter to simulate throat/mouth cavity vowel sound formants
        filter.type = "bandpass";
        const formant = 600 + Math.sin(elapsedMs / 250) * 300 + Math.random() * 40;
        filter.frequency.setValueAtTime(formant, ctx.currentTime);
        filter.Q.setValueAtTime(4, ctx.currentTime);
        
        // Voice envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17);
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc2.start();
        
        osc.stop(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.18);
        
        elapsedMs += 180;
      }, 180);
      
    } catch (err) {
      console.warn("Blocked or unsupported Web Audio", err);
    }
  };

  // Real voice playback + fallback synthesized voice
  const togglePlayVoice = (msgId: string, duration: number) => {
    if (playingMessageId === msgId) {
      setPlayingMessageId(null);
      stopVoiceSound();
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      return;
    }

    stopVoiceSound();
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);

    const targetMsg = messages.find(m => m.id === msgId);
    if (targetMsg && targetMsg.voiceUrl) {
      setPlayingMessageId(msgId);
      
      try {
        const audio = new Audio(targetMsg.voiceUrl);
        currentPlayingAudioRef.current = audio;
        
        audio.onloadedmetadata = () => {
          if (audio.duration && audio.duration !== Infinity) {
            duration = audio.duration;
          }
        };

        audio.onended = () => {
          setPlayingMessageId(null);
          setPlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
          stopVoiceSound();
          if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        };

        audio.ontimeupdate = () => {
          if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setPlaybackProgress(prev => ({ ...prev, [msgId]: pct }));
          }
        };

        let lastPct = playbackProgress[msgId] || 0;
        if (lastPct >= 100) lastPct = 0;
        audio.currentTime = (lastPct / 100) * (audio.duration || duration || 5);

        playbackIntervalRef.current = setInterval(() => {
          if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            if (pct >= 100) {
              clearInterval(playbackIntervalRef.current);
            } else {
              setPlaybackProgress(prev => ({ ...prev, [msgId]: pct }));
            }
          } else {
            lastPct += (100 / (duration || 5));
            if (lastPct >= 100) {
              lastPct = 100;
              audio.pause();
              setPlayingMessageId(null);
              clearInterval(playbackIntervalRef.current);
            }
            setPlaybackProgress(prev => ({ ...prev, [msgId]: lastPct }));
          }
        }, 200);

        audio.play().catch(e => {
          console.warn("Audio play rejected, falling back to voice synth", e);
          playVoiceSound(duration || 5, playbackProgress[msgId] || 0);
        });

      } catch (err) {
        console.error("Failed to play real audio:", err);
        setPlayingMessageId(msgId);
        playVoiceSound(duration || 5, playbackProgress[msgId] || 0);
      }
    } else {
      setPlayingMessageId(msgId);
      const initialProgress = playbackProgress[msgId] || 0;
      let current = initialProgress >= 100 ? 0 : initialProgress;

      playVoiceSound(duration || 5, current);

      playbackIntervalRef.current = setInterval(() => {
        current += (100 / (duration || 5));
        if (current >= 100) {
          current = 100;
          setPlayingMessageId(null);
          stopVoiceSound();
          clearInterval(playbackIntervalRef.current);
        }
        setPlaybackProgress(prev => ({
          ...prev,
          [msgId]: current
        }));
      }, 1000);
    }
  };

  // Communities action
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) {
      showErrorToast("Le nom du groupe est requis.");
      return;
    }

    try {
      const res = await fetch("/api/social/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCommName.trim(),
          description: newCommDesc.trim(),
          creatorId: currentUser.id,
          avatar: newCommAvatar.trim() || undefined,
          memberIds: selectedFriendsForNewComm // Direct WhatsApp member additions!
        })
      });

      if (res.ok) {
        const newComm = await res.json();
        setCommunities(prev => [...prev, newComm]);
        setActiveCommunityId(newComm.id);
        setActiveTab("communities");
        setIsCreatingCommunity(false);
        setNewCommName("");
        setNewCommDesc("");
        setNewCommAvatar("");
        setSelectedFriendsForNewComm([]);
        showToast(`Groupe "${newComm.name}" créé avec ${newComm.memberIds.length} membre(s) !`);
      } else {
        showErrorToast("Échec de la création du groupe.");
      }
    } catch (err) {
      showErrorToast("Erreur de réseau.");
    }
  };

  const handleDirectAddFriendToGroup = async (commId: string, friendId: string) => {
    try {
      const res = await fetch(`/api/social/communities/${commId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          action: "add_directly",
          targetUserId: friendId
        })
      });

      if (res.ok) {
        const updatedComm = await res.json();
        setCommunities(prev => prev.map(c => c.id === commId ? updatedComm : c));
        const friendObj = friends.find(f => f.id === friendId);
        showToast(`@${friendObj?.username || friendId} a été ajouté directement au groupe !`);
      } else {
        showErrorToast("Échec de l'ajout.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau.");
    }
  };

  const handleJoinCommunity = async (commId: string) => {
    try {
      const res = await fetch(`/api/social/communities/${commId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          action: "join"
        })
      });

      if (res.ok) {
        const updatedComm = await res.json();
        setCommunities(prev => prev.map(c => c.id === commId ? updatedComm : c));
        setActiveCommunityId(commId);
        showToast(`Vous avez rejoint la communauté !`);
      } else {
        showErrorToast("Impossible de s'inscrire.");
      }
    } catch (err) {
      showErrorToast("Erreur de réseau.");
    }
  };

  const handleLeaveCommunity = async (commId: string) => {
    try {
      const res = await fetch(`/api/social/communities/${commId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          action: "leave"
        })
      });

      if (res.ok) {
        const updatedComm = await res.json();
        setCommunities(prev => prev.map(c => c.id === commId ? updatedComm : c));
        if (activeCommunityId === commId) {
          setActiveCommunityId(null);
        }
        showToast(`Vous avez quitté le groupe.`);
      } else {
        showErrorToast("Erreur de réseau.");
      }
    } catch (err) {
      showErrorToast("Erreur réseau.");
    }
  };

  // Toggle checklist of friends for new group creation
  const handleToggleFriendForNewComm = (friendId: string) => {
    setSelectedFriendsForNewComm(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // USER DYNAMIC INTERESTS MAPPING
  const getUserInterests = (u: User): string[] => {
    const ALL_INTEREST_TAGS = ["Freelancing", "Design", "E-commerce", "Technologies", "Crypto", "Gaming", "Music", "Marketing", "Dev", "Art", "Business", "Divertissement"];
    if (u.role === "founder" || u.role === "admin") {
      return ["Technologies", "Business", "Marketing", "E-commerce"];
    }
    // Determinate stable interests based on username characters
    const charSum = u.username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const i1 = charSum % ALL_INTEREST_TAGS.length;
    const i2 = (charSum + 3) % ALL_INTEREST_TAGS.length;
    const i3 = (charSum + 7) % ALL_INTEREST_TAGS.length;
    
    return Array.from(new Set([ALL_INTEREST_TAGS[i1], ALL_INTEREST_TAGS[i2], ALL_INTEREST_TAGS[i3]]));
  };

  // FRIEND SUGGESTIONS ENGINE (Smarter based on interests & geographic location)
  const getFriendSuggestions = (): { user: User; reason: string; sameCountry: boolean; score: number }[] => {
    const matchedFriendIds = friends.map(f => f.id);
    
    // Also skip users who sent a pending request or vice-versa
    const pendingParticipantIds = [
      ...pendingRequests.map(r => r.senderId),
      ...pendingRequests.map(r => r.receiverId),
      ...sentRequests.map(r => r.senderId),
      ...sentRequests.map(r => r.receiverId)
    ];
    
    const myInterests = getUserInterests(currentUser);
    
    return usersList
      .filter(u => u.id !== currentUser.id && !matchedFriendIds.includes(u.id) && !pendingParticipantIds.includes(u.id))
      .map(u => {
        let sameCountry = u.country?.toLowerCase() === currentUser.country?.toLowerCase();
        const uInterests = getUserInterests(u);
        const overlap = uInterests.filter(val => myInterests.includes(val));
        
        let score = 0;
        if (sameCountry) score += 15;
        score += overlap.length * 10;
        
        let reason = "";
        if (overlap.length > 0 && sameCountry) {
          reason = `Même pays (${u.country}) • Partage vos goûts (${overlap.slice(0, 2).join(", ")})`;
        } else if (overlap.length > 0) {
          reason = `Intérêts communs: ${overlap.slice(0, 2).join(", ")}`;
        } else if (sameCountry) {
          reason = `Réside dans le même pays (${u.country})`;
        } else {
          reason = `Membre actif (${u.country || "Afrique"})`;
        }
        
        return { user: u, reason, sameCountry, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  // GROUP SUGGESTIONS ENGINE (Smarter based on user and members interests)
  const getGroupSuggestions = (): { community: Community; reason: string; score: number }[] => {
    const joinedIds = communities
      .filter(c => c.memberIds && c.memberIds.includes(currentUser.id))
      .map(c => c.id);
      
    const unjoined = communities.filter(c => !joinedIds.includes(c.id));
    const myInterests = getUserInterests(currentUser);
    
    return unjoined.map(comm => {
      let score = 0;
      let reason = "Recommandé selon vos intérêts";
      
      // 1. Keyword overlap with community name and description
      const nameAndDesc = (comm.name + " " + comm.description).toLowerCase();
      myInterests.forEach(interest => {
        if (nameAndDesc.includes(interest.toLowerCase())) {
          score += 25;
        }
      });
      
      // 2. Overlap with existing members' interests
      const members = usersList.filter(u => comm.memberIds?.includes(u.id));
      let sharedCount = 0;
      members.forEach(m => {
        const mInterests = getUserInterests(m);
        const overlap = mInterests.filter(val => myInterests.includes(val));
        sharedCount += overlap.length;
      });
      
      score += sharedCount * 5;
      
      if (sharedCount > 0) {
        reason = `${sharedCount} intérêts en commun avec les membres`;
      } else {
        reason = `Découvrez ce groupe de discussion`;
      }
      
      return { community: comm, reason, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  };

  const activeFriend = usersList.find(u => u.id === activeFriendId);
  const activeCommunity = communities.find(c => c.id === activeCommunityId);
  const hasActiveConversation = !!((activeTab === "dm" && activeFriend) || (activeTab === "communities" && activeCommunity));

  useEffect(() => {
    if (onActiveConversationChange) {
      onActiveConversationChange(hasActiveConversation);
    }
  }, [hasActiveConversation, onActiveConversationChange]);

  // Search filtered other members
  const filteredUsers = usersList.filter(u => {
    if (u.id === currentUser.id) return false;
    const query = directorySearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col min-h-0 bg-slate-50/50" id="yaamaa_social_container">
      
      {/* FLOATING ROUND EYE-CATCHING VIRTUAL GIFT BUTTON */}
      {hasActiveConversation && (
        <button
          type="button"
          onClick={() => {
            const recipientId = activeFriend ? activeFriend.id : (activeCommunity ? (activeCommunity.creatorId || null) : null);
            setGiftRecipientId(recipientId);
            setGiftCatalogTab("send");
            setShowGiftCatalogModal(true);
          }}
          className="fixed left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 z-50 cursor-pointer animate-pulse border border-yellow-300"
          title="Boutique de Cadeaux Virtuels & Retrait"
          id="btn_floating_gifts_store"
        >
          <div className="relative flex flex-col items-center justify-center">
            <Gift className="h-6 w-6 animate-bounce" />
            <span className="text-[7.5px] font-black uppercase tracking-wider block mt-0.5 leading-none">Gift</span>
          </div>
        </button>
      )}

      {/* VIRTUAL GIFTS STORE & WITHDRAWAL SYSTEM MODAL */}
      {showGiftsModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Gift className="h-6 w-6 text-yellow-200 animate-bounce" />
                <div className="text-left">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider leading-none">Boutique de Cadeaux Virtuels</h3>
                  <p className="text-[10px] text-yellow-100 mt-1">Achetez des points, envoyez des cadeaux ou convertissez vos gains en argent réel !</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftsModal(false)}
                className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white font-extrabold text-sm transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Balances Display Card */}
            <div className="p-4 bg-orange-50/50 border-b border-orange-100 grid grid-cols-2 gap-4">
              <div className="bg-white p-3.5 rounded-2xl border border-orange-200 shadow-2xs text-left">
                <span className="text-[9.5px] font-extrabold text-orange-600 uppercase tracking-wider block">Mes Points Disponibles</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-800">⭐ {giftPointsBalance}</span>
                  <span className="text-[9px] text-gray-500">points</span>
                </div>
                <p className="text-[8.5px] text-gray-400 mt-1">Utilisez ces points pour envoyer des cadeaux à vos amis.</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-orange-200 shadow-2xs text-left">
                <span className="text-[9.5px] font-extrabold text-emerald-600 uppercase tracking-wider block">Mes Points Reçus (Convertibles)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-800">💖 {giftPointsEarnedBalance}</span>
                  <span className="text-[9px] text-gray-500">points</span>
                </div>
                <p className="text-[8.5px] text-emerald-600 font-extrabold mt-1">
                  Valeur estimée: {(giftPointsEarnedBalance * (1 / giftConversionRate)).toLocaleString()} FCFA
                </p>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 min-h-0 text-left">
              {/* SECTION 1: BUY POINTS / RECHARGE PACKS */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5 border-l-3 border-amber-500 pl-2">
                  <span>1. Acheter des Packs de Pièces / Cadeaux</span>
                  <span className="text-[9px] text-amber-600 font-extrabold lowercase bg-amber-100 px-1.5 py-0.5 rounded-md">personnalisé admin</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(systemMetrics?.settings?.rechargePacks || [
                    { id: "pack_100", pieces: 100, price: 1.0, currency: "USD", title: "Pack 100 Pièces" },
                    { id: "pack_200", pieces: 200, price: 2.0, currency: "USD", title: "Pack 200 Pièces" },
                    { id: "pack_500", pieces: 500, price: 5.0, currency: "USD", title: "Pack 500 Pièces" },
                    { id: "pack_1000", pieces: 1000, price: 10.0, currency: "USD", title: "Pack 1000 Pièces" },
                    { id: "pack_5000", pieces: 5000, price: 50.0, currency: "USD", title: "Pack 5000 Pièces" },
                    { id: "pack_10000", pieces: 10000, price: 100.0, currency: "USD", title: "Pack 10,000 Pièces" }
                  ]).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={buyingPack !== null}
                      onClick={() => handleBuyPoints(p.id)}
                      className="p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between items-center gap-2 bg-amber-50/40 hover:bg-amber-50 border-amber-200 relative overflow-hidden shadow-2xs"
                    >
                      <span className="font-bold text-[10.5px] text-slate-700 block">{p.title || `${p.pieces} Pièces`}</span>
                      <span className="text-lg font-black text-slate-800 block">⭐ {p.pieces} pts</span>
                      <div className="bg-slate-900 text-white text-[9.5px] font-black py-1 px-3 rounded-xl block w-full">
                        {buyingPack === p.id ? "Chargement..." : `${p.price} ${p.currency || "USD"}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION WITHDRAWAL / CONVERSION PACKS */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5 border-l-3 border-emerald-500 pl-2">
                  <span>Retrait ou Conversion Automatique par Packs</span>
                  <span className="text-[9px] text-emerald-600 font-extrabold lowercase bg-emerald-100 px-1.5 py-0.5 rounded-md">clic instantané</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(systemMetrics?.settings?.withdrawalPacks || [
                    { id: "w_100", pieces: 100, value: 1.0, label: "100 Pièces" },
                    { id: "w_200", pieces: 200, value: 2.0, label: "200 Pièces" },
                    { id: "w_500", pieces: 500, value: 5.0, label: "500 Pièces" },
                    { id: "w_1000", pieces: 1000, value: 10.0, label: "1000 Pièces" },
                    { id: "w_5000", pieces: 5000, value: 50.0, label: "5000 Pièces" },
                    { id: "w_10000", pieces: 10000, value: 100.0, label: "10,000 Pièces" }
                  ]).map((w: any) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setShowGiftsModal(false);
                        if (onNavigate) onNavigate("wallet");
                      }}
                      className="p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between items-center gap-2 bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200 relative overflow-hidden shadow-2xs"
                    >
                      <span className="font-bold text-[10.5px] text-slate-700 block">{w.label || `${w.pieces} Pièces`}</span>
                      <span className="text-lg font-black text-emerald-700 block">💖 {w.pieces} pts</span>
                      <div className="bg-emerald-600 text-white text-[9.5px] font-black py-1 px-3 rounded-xl block w-full">
                        Retirer {w.value}€
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: SEND A GIFT TO CURRENT CHAT COMPANION */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5 border-l-3 border-amber-500 pl-2">
                  <span>2. Envoyer un Cadeau Virtuel</span>
                </h4>
                
                {activeFriendId ? (
                  <>
                    <p className="text-[10px] text-gray-500 mb-3">
                      Sélectionnez un objet à envoyer à votre correspondant actuel. Les points seront immédiatement retirés de votre solde et ajoutés à son portefeuille.
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {(systemGifts.length > 0 ? systemGifts : DEFAULT_LOCAL_GIFTS).map((gift) => (
                        <button
                          key={gift.id}
                          type="button"
                          onClick={() => handleSendGift(gift.id)}
                          className="p-2 border border-slate-100 rounded-2xl bg-slate-50/60 hover:bg-amber-50 hover:border-amber-300 hover:scale-103 transition cursor-pointer text-center flex flex-col justify-between items-center gap-1 relative group"
                        >
                          <span className="text-3xl block group-hover:animate-bounce mt-1">{gift.emoji}</span>
                          <span className="font-bold text-[9px] text-slate-700 truncate block w-full mt-1 leading-none">{gift.name}</span>
                          <span className="text-[8px] font-extrabold bg-slate-200 text-slate-700 px-1 rounded-sm mt-1">
                            ⭐ {gift.pointsPrice} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center border border-dashed border-gray-250">
                    <p className="text-[11px] text-gray-500">
                      ⚠️ Aucun ami n'est sélectionné actuellement. Sélectionnez une discussion privée à gauche de l'écran pour lui envoyer un cadeau !
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 3: CONVERT EARNED POINTS TO MONEY & WITHDRAW */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5 border-l-3 border-amber-500 pl-2">
                  <span>3. Retirer mon Argent (Conversion)</span>
                </h4>
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-left space-y-0.5">
                      <p className="text-[11.5px] font-extrabold text-slate-800">Convertir les points en FCFA</p>
                      <p className="text-[9.5px] text-gray-500">
                        Taux de conversion actuel: <span className="font-bold text-emerald-600">1 point reçu = {Math.round(1 / giftConversionRate)} FCFA</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={pointsToConvert}
                        onChange={(e) => setPointsToConvert(e.target.value)}
                        placeholder="Ex: 100"
                        className="w-24 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={handleConvertPoints}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                      >
                        {isConverting ? "En cours..." : "Convertir"}
                      </button>
                    </div>
                  </div>

                  {parseInt(pointsToConvert) > 0 && !isNaN(parseInt(pointsToConvert)) && (
                    <div className="text-[10px] text-emerald-800 font-extrabold text-right">
                      👉 Vous obtiendrez: <span className="text-xs font-black">{(parseInt(pointsToConvert) * (1 / giftConversionRate)).toLocaleString()} FCFA</span> ajoutés à votre portefeuille !
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 text-center">
              <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Yaamaa Virtual Gifts System v2 • Sécurisé & Garanti</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Slide-down in-app notification banner */}
      {inAppNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white border-l-4 border-emerald-500 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-bounce cursor-pointer transition hover:bg-emerald-50/25"
             onClick={() => {
               setActiveTab(inAppNotification.type === "dm" ? "dm" : "communities");
               if (inAppNotification.type === "dm") {
                 setActiveFriendId(inAppNotification.id);
               } else {
                 setActiveCommunityId(inAppNotification.id);
               }
               setInAppNotification(null);
             }}>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-full shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-950 truncate">{inAppNotification.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{inAppNotification.text}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setInAppNotification(null); }} className="text-gray-450 hover:text-gray-600 text-sm font-bold px-1.5 py-0.5 rounded-lg">&times;</button>
        </div>
      )}
      


      {/* FLOATING ACTION TOASTS */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold z-50 animate-bounce border border-emerald-500">
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 bg-rose-650 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold z-50 animate-bounce border border-rose-500">
          <AlertCircle className="h-5 w-5 text-rose-200" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CORE WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
        
        {/* LEFT COLUMN: CONTACTS, CHAT ROOMS & PENDING INVITATIONS */}
        <div className={`${hasActiveConversation ? "hidden lg:flex" : "flex"} lg:col-span-4 bg-white border border-gray-200 rounded-3xl shadow-sm flex-col overflow-hidden h-[calc(100vh-160px)] lg:h-[800px] min-h-[450px]`} id="left_chat_pane">
          
          {/* SEARCH CHAT / CONTACT */}
          <div className="p-4 border-b border-gray-100 bg-slate-50/50 space-y-3">
            {/* PROMINENT SEARCH AND ADD FRIEND BUTTON */}
            <button
              onClick={() => {
                setShowSearchModal(true);
                setSearchQuery("");
                setSearchResults([]);
                setSearchError(null);
                setSearchSuccessMsg(null);
              }}
              className="w-full bg-gradient-to-br from-white to-emerald-50/30 hover:from-white hover:to-emerald-100/50 border border-emerald-100 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 py-3 px-4 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Search className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
              <span>Rechercher &amp; Ajouter un ami (Nom ou Numéro)</span>
            </button>

            <div className="flex gap-1.5 p-1 bg-white border border-gray-200 rounded-2xl">
              <button
                onClick={() => {
                  setActiveTab("dm");
                  setMessages([]);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition flex items-center justify-center gap-1.5 ${
                  activeTab === "dm"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Amis ({friends.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("communities");
                  setMessages([]);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition flex items-center justify-center gap-1.5 ${
                  activeTab === "communities"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Groupes ({communities.filter(c => c.memberIds && c.memberIds.includes(currentUser.id)).length})
              </button>
            </div>
          </div>

          {/* CHAT/CONTACT LIST */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            
            {/* PENDING FRIEND REQUESTS NOTIFICATION BANNER */}
            {pendingRequests.length > 0 && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <div className="flex items-center gap-2 text-amber-950 font-black text-[11px] uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span>Invitations d'amis ({pendingRequests.length})</span>
                </div>
                <div className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <img
                          src={req.senderAvatar}
                          alt={req.senderUsername}
                          className="h-8 w-8 rounded-lg object-cover border border-gray-100 shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-[10.5px] font-black text-gray-900 truncate">@{req.senderUsername}</p>
                          <p className="text-[9px] text-gray-400">Veut devenir votre ami</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, "accept")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-[9.5px] font-bold shadow-xs cursor-pointer"
                          title="Accepter"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, "decline")}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-lg text-[9.5px] font-bold cursor-pointer"
                          title="Décliner"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DM TAB VIEW */}
            {activeTab === "dm" ? (
              <div className="space-y-4">
                {/* 1. All Friends */}
                <div className="space-y-1.5">
                  {(() => {
                    const adminContact = usersList.find(u => u.id === "user_admin");
                    const chatContacts = [...friends];
                    if (adminContact && !chatContacts.some(c => c.id === adminContact.id)) {
                      chatContacts.unshift(adminContact);
                    }
                    if (chatContacts.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-400">
                          <p className="text-[11px]">Aucun contact dans votre liste.</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider px-2">Discussions ({chatContacts.length})</p>
                        {chatContacts.slice(0, showAllFriends ? chatContacts.length : 20).map((friend) => {
                          const isActive = activeFriendId === friend.id;
                          const dmUnreadCount = (unreadStats?.unreadDMs && unreadStats.unreadDMs[friend.id]) || 0;
                          const isSystemAdmin = friend.id === "user_admin";
                          return (
                            <div
                              key={friend.id}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl transition border group ${
                                isActive
                                  ? isSystemAdmin
                                    ? "bg-amber-50/75 border-amber-200 text-amber-950 font-extrabold shadow-sm"
                                    : "bg-emerald-50 border-emerald-150 text-emerald-950 font-extrabold shadow-sm"
                                  : isSystemAdmin
                                    ? "bg-amber-50/20 border-amber-100/50 hover:bg-amber-50/40 text-gray-800 hover:border-amber-150"
                                    : "bg-white border-gray-150 hover:bg-slate-50 text-gray-700 hover:border-slate-150/80"
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setActiveFriendId(friend.id);
                                  setActiveCommunityId(null);
                                }}
                                className="flex items-center gap-3 text-left transition min-w-0 flex-1 cursor-pointer"
                              >
                                <div
                                  className="relative shrink-0 cursor-pointer hover:scale-105 transition active:scale-95"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewProfile) onViewProfile(friend.id);
                                  }}
                                  title="Voir le profil"
                                >
                                  <img
                                    src={friend.avatar}
                                    alt={friend.username}
                                    referrerPolicy="no-referrer"
                                    className={`h-11 w-11 rounded-xl object-cover border shadow-xs transition-all ${
                                      isSystemAdmin 
                                        ? "border-amber-300 group-hover:border-amber-500" 
                                        : "border-gray-250 group-hover:border-emerald-500"
                                    }`}
                                  />
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                    isSystemAdmin ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                  }`}></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-black truncate flex items-center gap-1.5">
                                      {isSystemAdmin ? "📢 Administration" : `@${friend.username}`}
                                      {isSystemAdmin && (
                                        <span className="bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                          Officiel
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {dmUnreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                                          {dmUnreadCount}
                                        </span>
                                      )}
                                      <span className="text-[8px] font-mono font-bold text-gray-400">{friend.country}</span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{isSystemAdmin ? "Messages & Diffusions" : friend.name}</p>
                                </div>
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (onViewProfile) onViewProfile(friend.id);
                                }}
                                className="ml-2 text-[9.5px] font-black uppercase text-gray-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/50 p-1.5 px-2 rounded-lg transition shrink-0 cursor-pointer"
                                title="Voir le profil"
                              >
                                Profil
                              </button>
                            </div>
                          );
                        })}

                        {chatContacts.length > 20 && (
                          <div className="pt-2 text-center">
                            <button
                              onClick={() => setShowAllFriends(!showAllFriends)}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer active:scale-95 transition"
                            >
                              {showAllFriends ? "Réduire ⬆" : `Voir tout (${chatContacts.length}) ⬇`}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 2. Suggestions de Contacts */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Suggestions d'amis</p>
                    <span className="text-[8.5px] text-gray-400 font-extrabold uppercase">Selon vos intérêts & pays</span>
                  </div>
                  {getFriendSuggestions().length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-gray-400">
                      <p className="text-[10px]">Aucune nouvelle suggestion.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 px-1">
                      {getFriendSuggestions().map(({ user: sUser, reason }) => (
                        <div
                          key={sUser.id}
                          className="flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100/50 border border-gray-150/50 rounded-2xl transition shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div 
                              className="relative shrink-0 cursor-pointer hover:scale-105 transition"
                              onClick={() => {
                                if (onViewProfile) onViewProfile(sUser.id);
                              }}
                              title="Voir le profil"
                            >
                              <img
                                src={sUser.avatar}
                                alt={sUser.username}
                                className="h-9 w-9 rounded-xl object-cover border border-gray-200"
                              />
                            </div>
                            <div 
                              className="min-w-0 cursor-pointer hover:opacity-80 transition flex-1"
                              onClick={() => {
                                if (onViewProfile) onViewProfile(sUser.id);
                              }}
                              title="Voir le profil"
                            >
                              <p className="text-[11px] font-black text-gray-900 truncate">@{sUser.username}</p>
                              <p className="text-[9px] text-gray-400 font-medium truncate">{reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              onClick={() => {
                                if (onViewProfile) onViewProfile(sUser.id);
                              }}
                              className="text-[9px] font-extrabold uppercase text-gray-500 hover:text-emerald-700 bg-slate-100/80 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                              title="Profil"
                            >
                              Profil
                            </button>
                            <button
                              onClick={() => handleSendFriendRequest(sUser.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 p-1.5 px-2.5 rounded-lg text-[9.5px] font-black transition cursor-pointer shrink-0 active:scale-95"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Group tab view
              <div className="space-y-4">
                {/* Create Group block at the very top */}
                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      setIsCreatingCommunity(true);
                      setSelectedFriendsForNewComm([]);
                    }}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white p-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                  >
                    <PlusSquare className="h-4 w-4" />
                    Créer un Groupe
                  </button>
                </div>

                {/* Available Joined Groups */}
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider px-2 mb-2">Vos Groupes Rejoints</p>
                  {communities.filter(c => c.memberIds && c.memberIds.includes(currentUser.id)).length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <p className="text-[10.5px]">Aucun groupe rejoint.</p>
                    </div>
                  ) : (
                    communities
                      .filter(c => c.memberIds && c.memberIds.includes(currentUser.id))
                      .map((comm) => {
                        const isActive = activeCommunityId === comm.id;
                        const commUnreadCount = (unreadStats?.unreadCommunities && unreadStats.unreadCommunities[comm.id]) || 0;
                        return (
                          <button
                            key={comm.id}
                            onClick={() => {
                              setActiveCommunityId(comm.id);
                              setActiveFriendId(null);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition border ${
                              isActive
                                ? "bg-teal-50 border-teal-150 text-teal-950 font-extrabold shadow-sm"
                                : "bg-transparent border-transparent hover:bg-slate-50 text-gray-700 hover:border-slate-100"
                            }`}
                          >
                            <img
                              src={comm.avatar}
                              alt={comm.name}
                              referrerPolicy="no-referrer"
                              className="h-11 w-11 rounded-xl object-cover border border-gray-250 shadow-xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-black truncate"># {comm.name}</p>
                                {commUnreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center animate-pulse shadow-sm shrink-0">
                                    {commUnreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{comm.memberIds?.length || 0} membres actifs</p>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>

                {/* 3. Suggestions de Groupes */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] uppercase font-black text-teal-600 tracking-wider">Suggestions de groupes</p>
                    <span className="text-[8.5px] text-gray-400 font-extrabold uppercase">Recommandations d'intérêts</span>
                  </div>
                  {getGroupSuggestions().length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-gray-400">
                      <p className="text-[10px]">Toutes les communautés rejointes !</p>
                    </div>
                  ) : (
                    <div className="space-y-2 px-1">
                      {getGroupSuggestions().map(({ community: sComm, reason }) => (
                        <div
                          key={sComm.id}
                          className="flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100/50 border border-gray-150/50 rounded-2xl transition shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={sComm.avatar}
                              alt={sComm.name}
                              className="h-9 w-9 rounded-xl object-cover border border-gray-250 shrink-0 shadow-xs"
                            />
                            <div className="min-w-0">
                              <p className="text-[11.5px] font-black text-gray-950 truncate"># {sComm.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium truncate">{reason}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleJoinCommunity(sComm.id)}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 p-1.5 px-2.5 rounded-lg text-[9.5px] font-black transition cursor-pointer shrink-0 active:scale-95"
                          >
                            Rejoindre
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: MODERN WHATSAPP INTERACTIVE CHAT SCREEN */}
        <div className={`${
          hasActiveConversation 
            ? "fixed inset-0 z-[100] flex flex-col bg-white h-screen w-screen overflow-hidden lg:relative lg:inset-auto lg:z-auto lg:h-[800px] lg:w-auto lg:col-span-8 lg:border lg:border-gray-200 lg:rounded-3xl lg:shadow-sm" 
            : "hidden lg:flex col-span-12 lg:col-span-8 bg-white border border-gray-200 rounded-3xl shadow-sm flex-col relative overflow-hidden h-[calc(100vh-160px)] lg:h-[800px] min-h-[450px]"
        }`} id="middle_chat_pane">
          
          {!hasActiveConversation ? (
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse scale-150"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-2xl transform hover:rotate-6 transition duration-350">
                  <span className="text-4xl font-extrabold tracking-widest font-sans">Y</span>
                </div>
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white text-[10px] font-black">
                  ✓
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Yaamaa Messagerie</h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-2.5 leading-relaxed font-bold">
                Communiquez en toute simplicité et sécurité avec vos proches et vos communautés sur Yaamaa.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md w-full mt-8 pt-6 border-t border-gray-100">
                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-xs text-left">
                  <span className="text-lg">🔒</span>
                  <p className="text-[11px] font-black text-gray-900 mt-1.5 font-bold">Chiffrement de bout en bout</p>
                  <p className="text-[9.5px] text-gray-500 mt-0.5 font-medium leading-normal">Vos discussions privées et fichiers restent entièrement confidentiels.</p>
                </div>
                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-xs text-left">
                  <span className="text-lg">📞</span>
                  <p className="text-[11px] font-black text-gray-900 mt-1.5 font-bold">Appels voix &amp; vidéo fluides</p>
                  <p className="text-[9.5px] text-gray-500 mt-0.5 font-medium leading-normal">Passez des appels HD gratuits et sans interruption avec vos contacts.</p>
                </div>
              </div>
              
              <p className="text-[9.5px] font-mono text-gray-450 mt-10 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-spin" style={{ animationDuration: "3s" }} />
                Yaamaa • Connectez-vous à l'instant
              </p>
            </div>
          ) : (
            <>
              {/* SCREEN HEADER */}
          {activeTab === "dm" && activeFriend ? (
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-500/10 shrink-0" id="chat_header">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveFriendId(null);
                    setActiveCommunityId(null);
                  }}
                  className="p-2.5 bg-slate-150/70 hover:bg-slate-200 text-gray-700 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0 border border-gray-200/50"
                  title="Retour aux discussions"
                >
                  <ArrowLeft className="h-4.5 w-4.5 text-emerald-700" />
                </button>
                <div 
                  className="relative cursor-pointer hover:scale-105 transition"
                  onClick={() => {
                    if (onViewProfile) onViewProfile(activeFriend.id);
                  }}
                  title="Voir le profil"
                >
                  <img
                    src={activeFriend.avatar}
                    alt={activeFriend.username}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-xl object-cover border border-white shadow-md shrink-0"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white animate-pulse"></span>
                </div>
                <div 
                  className="cursor-pointer hover:opacity-80 transition"
                  onClick={() => {
                    if (onViewProfile) onViewProfile(activeFriend.id);
                  }}
                  title="Voir le profil"
                >
                  <p className="text-xs font-black text-gray-900 flex items-center gap-1.5 flex-wrap">
                    {activeFriend.id === "user_admin" ? "📢 Administration Officielle" : `@${activeFriend.username}`}
                    {activeFriend.merchantNumber && <MerchantBadge tier={activeFriend.merchantPackType} size="xs" />}
                    {activeFriend.id === "user_admin" ? (
                      <span className="bg-amber-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Officiel</span>
                    ) : friends.some(f => f.id === activeFriend.id) ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-bold">Ami</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-full font-bold">Non Ami</span>
                    )}
                  </p>
                  {typers.length > 0 ? (
                    <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                      En train d'écrire...
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-450 font-bold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      {activeFriend.name} • {activeFriend.country}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Call Symbol Button */}
                <button
                  onClick={handleInitiateCallPrompt}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center border border-emerald-400 shadow-sm shrink-0"
                  title="Lancer un appel (Vocal ou Vidéo)"
                  id="btn_call_initiate"
                >
                  <Phone className="h-4.5 w-4.5" />
                </button>

                {friends.some(f => f.id === activeFriend.id) ? (
                  <button
                    onClick={() => handleRemoveFriend(activeFriend.id)}
                    className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                    title="Retirer cet ami"
                  >
                    Retirer des amis
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendFriendRequest(activeFriend.id)}
                    className="text-emerald-600 hover:bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition active:scale-95 shrink-0"
                    title="Envoyer une invitation d'ami"
                  >
                    Ajouter aux amis
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === "communities" && activeCommunity ? (
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-teal-500/10 shrink-0" id="chat_header_group">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveFriendId(null);
                    setActiveCommunityId(null);
                  }}
                  className="p-2.5 bg-slate-150/70 hover:bg-slate-200 text-gray-700 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0 border border-gray-200/50"
                  title="Retour aux discussions"
                >
                  <ArrowLeft className="h-4.5 w-4.5 text-teal-700" />
                </button>
                <img
                  src={activeCommunity.avatar}
                  alt={activeCommunity.name}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 rounded-xl object-cover border border-white shadow-md shrink-0"
                />
                <div>
                  <p className="text-xs font-black text-gray-900"># {activeCommunity.name}</p>
                  {typers.length > 0 ? (
                    <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                      {typers[0].name} est en train d'écrire...
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium">{activeCommunity.description || "Aucune description de groupe."}</p>
                  )}
                </div>
              </div>

              {/* ACTION MENU FOR WHATSAPP GROUP */}
              <div className="flex items-center gap-1.5">
                {/* View Members Button */}
                {activeCommunity.memberIds?.includes(currentUser.id) ? (
                  <button
                    onClick={() => {
                      setShowMembersModal(!showMembersModal);
                      setShowAddMembersModal(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition ${
                      showMembersModal
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-150"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Voir les Membres ({activeCommunity.memberIds?.length || 0})
                  </button>
                ) : (
                  <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-bold">
                    🔒 Membres cachés
                  </span>
                )}

                {/* Invite Friend Dropdown Trigger */}
                <button
                  onClick={() => {
                    setShowAddMembersModal(!showAddMembersModal);
                    setShowMembersModal(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition ${
                    showAddMembersModal
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150"
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Ajouter des Membres
                </button>

                {/* Leave option */}
                {activeCommunity.creatorId !== currentUser.id && (
                  <button
                    onClick={() => handleLeaveCommunity(activeCommunity.id)}
                    className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer shrink-0"
                  >
                    Quitter
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* GROUP MEMBERS LIST MODAL PANEL */}
          {activeTab === "communities" && activeCommunity && showMembersModal && (
            <div className="bg-slate-100/95 backdrop-blur-xs border-b border-teal-150 p-4 space-y-3 animate-fade-in relative z-40 max-h-[350px] overflow-y-auto shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-600" />
                    Membres du Groupe #{activeCommunity.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Seuls les membres du groupe peuvent voir cette liste. ({activeCommunity.memberIds?.length || 0} membres)
                  </p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px] cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* Verify access authority again */}
              {!activeCommunity.memberIds?.includes(currentUser.id) ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-rose-100 space-y-1">
                  <p className="text-xs font-black text-rose-650">Accès Refusé 🔒</p>
                  <p className="text-[10px] text-gray-500">Vous devez faire partie de ce groupe pour voir ses membres.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {usersList
                    .filter(usr => activeCommunity.memberIds?.includes(usr.id))
                    .map(usr => {
                      const isCreator = usr.id === activeCommunity.creatorId;
                      const isMe = usr.id === currentUser.id;
                      return (
                        <div
                          key={usr.id}
                          onClick={() => {
                            if (onViewProfile) onViewProfile(usr.id);
                          }}
                          className="p-2.5 bg-white rounded-2xl border border-gray-150 flex items-center gap-2.5 shadow-xs hover:border-emerald-300 transition cursor-pointer"
                        >
                          <img
                            src={usr.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                            alt={usr.username}
                            className="h-9 w-9 rounded-xl object-cover border border-gray-150 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-gray-900 text-[11px] truncate block">
                                @{usr.username}
                              </span>
                              {isMe && (
                                <span className="bg-teal-50 text-teal-700 font-extrabold text-[8px] px-1 rounded-sm">
                                  Moi
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-gray-500 block truncate">{usr.name}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] px-1 bg-slate-100 rounded text-gray-500 font-medium">
                                {usr.country || "Afrique"}
                              </span>
                              {isCreator && (
                                <span className="text-[8px] px-1 bg-amber-50 text-amber-700 font-black rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE ADD MEMBERS MODAL PANEL */}
          {activeTab === "communities" && activeCommunity && showAddMembersModal && (
            <div className="bg-slate-100/90 backdrop-blur-xs border-b border-teal-150 p-4 space-y-4 animate-fade-in relative z-40 max-h-[350px] overflow-y-auto shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Ajouter des Membres à #{activeCommunity.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ajoutez vos amis d'un clic ou invitez de nouveaux membres suggérés.</p>
                </div>
                <button
                  onClick={() => setShowAddMembersModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px] cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COLUMN 1: FRIENDS LIST (Instant Add) */}
                <div className="space-y-2">
                  <h5 className="text-[10px] uppercase font-bold text-emerald-800 tracking-wide flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    Vos Amis ({friends.length})
                  </h5>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {friends.map(friend => {
                      const isAlreadyMember = activeCommunity.memberIds?.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          className="p-2 bg-white rounded-xl border border-gray-150 flex items-center justify-between text-xs transition hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={friend.avatar}
                              alt={friend.username}
                              className="h-6 w-6 rounded-full object-cover border border-gray-200"
                            />
                            <span className="font-extrabold text-gray-800 text-[11px] truncate">@{friend.username}</span>
                          </div>
                          
                          {isAlreadyMember ? (
                            <span className="text-emerald-600 font-black text-[9.5px] bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-0.5">
                              ✔ Ajouté
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDirectAddFriendToGroup(activeCommunity.id, friend.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Ajouter
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {friends.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                        Aucun ami disponible pour ce groupe.
                      </p>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: NON-FRIENDS SUGGESTIONS LIST (Send request/Invite) */}
                <div className="space-y-2">
                  <h5 className="text-[10px] uppercase font-bold text-amber-800 tracking-wide flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Suggestions de Membres ({
                      usersList
                        .filter(usr => usr.id !== currentUser.id && !currentUser.friendIds?.includes(usr.id) && !activeCommunity.memberIds?.includes(usr.id))
                        .length
                    })
                  </h5>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {usersList
                      .filter(usr => usr.id !== currentUser.id && !currentUser.friendIds?.includes(usr.id) && !activeCommunity.memberIds?.includes(usr.id))
                      .map(usr => {
                        // Check if we sent them a pending request
                        const hasPendingSent = sentRequests.some(r => r.receiverId === usr.id && r.status === "pending");
                        return (
                          <div
                            key={usr.id}
                            className="p-2 bg-white rounded-xl border border-gray-150 flex items-center justify-between text-xs transition hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={usr.avatar}
                                alt={usr.username}
                                className="h-6 w-6 rounded-full object-cover border border-gray-200"
                              />
                              <div className="truncate">
                                <span className="font-extrabold text-gray-800 text-[11px] block truncate">@{usr.username}</span>
                                <span className="text-[8.5px] text-gray-400 block truncate">{usr.country} • {usr.name}</span>
                              </div>
                            </div>
                            
                            {hasPendingSent ? (
                              <span className="text-amber-600 font-extrabold text-[9px] bg-amber-50 px-2 py-0.5 rounded-full">
                                En attente...
                              </span>
                            ) : (
                              <button
                                onClick={async () => {
                                  await handleSendFriendRequest(usr.id);
                                  fetchPendingFriendRequests();
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1 rounded-lg text-[10px] transition cursor-pointer"
                              >
                                Inviter
                              </button>
                            )}
                          </div>
                        );
                      })}
                    {usersList.filter(usr => usr.id !== currentUser.id && !currentUser.friendIds?.includes(usr.id) && !activeCommunity.memberIds?.includes(usr.id)).length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                        Aucune nouvelle suggestion disponible.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE DISCUSSION SCREEN VIEW */}
          <div 
            ref={chatScrollerRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50 relative" 
            id="chat_messages_scroller"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm1-61c3.148 0 5.7-2.552 5.7-5.7 0-3.148-2.552-5.7-5.7-5.7-3.148 0-5.7 2.552-5.7 5.7 0 3.148 2.552 5.7 5.7 5.7zm4 41c1.933 0 3.5-1.567 3.5-3.5S41.433 26 39.5 26s-3.5 1.567-3.5 3.5 1.567 3.5 3.5 3.5zM22 68c1.38 0 2.5-1.12 2.5-2.5S23.38 63 22 63s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5z'/%3E%3C/g%3E%3C/svg%3E")` 
            }}
          >
            {/* FLOATING SUSPENDED GIFT SYMBOL ON THE LEFT / MIDDLE */}
            {activeTab === "dm" && activeFriend && (
              <div className="absolute left-4 top-1/3 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    setGiftRecipientId(activeFriend.id);
                    setGiftCatalogTab("send");
                    setShowGiftCatalogModal(true);
                  }}
                  className="h-14 w-14 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white animate-bounce cursor-pointer group"
                  title="Offrir un Cadeau Suspendu"
                  style={{ animationDuration: "2.8s" }}
                >
                  <Gift className="h-6.5 w-6.5 text-white animate-pulse group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            )}

            {/* FLOATING SUSPENDED GIFT SYMBOL IN COMMUNITY / FORUM */}
            {activeTab === "communities" && activeCommunity && (
              <div className="absolute left-4 top-1/3 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    setGiftRecipientId(activeCommunity.creatorId || null);
                    setGiftCatalogTab("send");
                    setShowGiftCatalogModal(true);
                  }}
                  className="h-14 w-14 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-500 to-amber-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white animate-bounce cursor-pointer group"
                  title="Offrir un Cadeau au Créateur ou aux membres"
                  style={{ animationDuration: "2.8s" }}
                >
                  <Gift className="h-6.5 w-6.5 text-white animate-pulse group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            )}

            {((activeTab === "dm" && !activeFriend) || (activeTab === "communities" && !activeCommunity)) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 animate-bounce">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-black text-gray-800">Aucune discussion active</h3>
                <p className="text-[11px] text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Sélectionnez un contact ami dans la barre latérale pour entamer une discussion cryptée et sécurisée. Ou rejoignez un salon thématique.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <Smile className="h-10 w-10 text-emerald-350 stroke-1 mb-2 animate-pulse" />
                <p className="text-[11.5px] font-bold text-gray-700">Début de la conversation</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Dites bonjour ! Vous pouvez écrire des messages, enregistrer des vocaux ou partager des images de gains.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                const isVoice = !!msg.voiceUrl;
                const isImage = !!msg.imageUrl;
                const isPlaying = playingMessageId === msg.id;
                const progress = playbackProgress[msg.id] || 0;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 max-w-[90%] relative group ${
                      isMine ? "ml-auto flex-row-reverse" : ""
                    }`}
                  >
                    {/* DIRECT GIFT OFFER BUTTON FOR THE MESSAGE SENDER / DONOR */}
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          setGiftRecipientId(msg.senderId);
                          setGiftCatalogTab("send");
                          setShowGiftCatalogModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 h-7 w-7 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs cursor-pointer border border-pink-200 shrink-0 self-center"
                        title={`Envoyer un cadeau à @${msg.senderUsername}`}
                      >
                        <Gift className="h-4 w-4 text-pink-500 animate-pulse" />
                      </button>
                    )}

                    {/* Avatar side */}
                    {!isMine && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderUsername}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-lg object-cover border border-gray-200 shrink-0 shadow-xs cursor-pointer hover:border-emerald-500 transition"
                        onClick={() => {
                          if (onViewProfile) onViewProfile(msg.senderId);
                        }}
                      />
                    )}
                    
                    <div className="space-y-0.5">
                      {/* Name tag */}
                      {!isMine && (
                        <div 
                          className="flex items-center gap-1.5 pl-1 cursor-pointer hover:opacity-85 transition"
                          onClick={() => {
                            if (onViewProfile) onViewProfile(msg.senderId);
                          }}
                        >
                          <span className="text-[9.5px] font-black text-gray-500">
                            @{msg.senderUsername}
                          </span>
                          {usersList.find(u => u.id === msg.senderId)?.merchantNumber && (
                            <MerchantBadge tier={usersList.find(u => u.id === msg.senderId)?.merchantPackType} size="xs" />
                          )}
                        </div>
                      )}

                      {/* Msg Bubble Container */}
                      <div
                        onMouseDown={() => handleStartLongPress(msg.id)}
                        onMouseUp={handleCancelLongPress}
                        onMouseLeave={handleCancelLongPress}
                        onTouchStart={() => handleStartLongPress(msg.id)}
                        onTouchEnd={handleCancelLongPress}
                        className={`p-3 rounded-2xl text-xs shadow-xs leading-relaxed font-medium transition relative border select-none ${
                          isMine
                            ? "bg-emerald-600 border-emerald-650 text-white rounded-br-none"
                            : "bg-white border-gray-150 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {/* FLOATING LONG-PRESS MENU */}
                        {longPressedMessageId === msg.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-white border border-gray-200 p-1 rounded-full shadow-xl flex items-center gap-1 z-50 animate-in fade-in zoom-in-90 duration-150">
                            {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, emoji);
                                  setLongPressedMessageId(null);
                                }}
                                className="text-sm hover:scale-125 active:scale-95 transition cursor-pointer p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                            <div className="w-[1px] h-4 bg-gray-200 self-center mx-1"></div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingToMessage(msg);
                                setLongPressedMessageId(null);
                              }}
                              className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-full transition shrink-0 cursor-pointer"
                            >
                              ↩️ Répondre
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLongPressedMessageId(null);
                              }}
                              className="text-[9px] font-extrabold uppercase text-gray-400 hover:text-gray-600 hover:bg-gray-50 px-2 py-1 rounded-full transition shrink-0 cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        )}

                        {/* QUOTED REPLY BLOCK */}
                        {msg.replyToId && (
                          <div className={`mb-2 p-2 rounded-xl border-l-4 text-[11px] text-left max-w-sm ${
                            isMine 
                              ? "bg-emerald-700/50 border-emerald-300 text-emerald-50" 
                              : "bg-slate-100 border-emerald-500 text-gray-700"
                          }`}>
                            <span className="font-extrabold block text-[9px] uppercase tracking-wide">
                              @{msg.replyToSenderUsername}
                            </span>
                            <span className="opacity-90 block truncate font-medium mt-0.5">
                              {msg.replyToText || "Média"}
                            </span>
                          </div>
                        )}

                        {/* VIRTUAL GIFT PRESENTATION CARD */}
                        {msg.isGift && (
                          <div className="my-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-slate-900 border border-amber-200/50 flex items-center gap-3 max-w-sm shadow-xs">
                            <span className="text-3xl animate-bounce shrink-0 select-none">
                              {msg.giftImage || "🎁"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black uppercase text-amber-800 tracking-wide">
                                Cadeau Virtuel Envoyé !
                              </span>
                              <p className="text-[12px] font-extrabold text-slate-800 truncate">
                                {msg.giftName || "Objet Virtuel"}
                              </p>
                              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black bg-amber-200/70 text-amber-950 px-1.5 py-0.5 rounded-md mt-1">
                                ⭐ {msg.giftPoints || 0} Points
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 0. CUSTOM OFFER DIRECT CARD */}
                        {msg.isCustomOffer && (
                          <div className="my-1 p-3.5 rounded-2xl bg-amber-50 text-slate-900 border border-amber-200/60 space-y-3 max-w-sm shadow-xs font-sans">
                            <div className="flex items-center justify-between border-b border-amber-100 pb-1.5 gap-2">
                              <span className="flex items-center gap-1 text-[9.5px] font-black text-amber-800 uppercase tracking-wider">
                                <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                                Ordre Personnalisé
                              </span>
                              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                msg.customOfferStatus === "received"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : msg.customOfferStatus === "shipped"
                                  ? "bg-sky-100 text-sky-800"
                                  : msg.customOfferStatus === "paid"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {msg.customOfferStatus === "received" ? "Terminé ✔" :
                                 msg.customOfferStatus === "shipped" ? "Livré 🚚" :
                                 msg.customOfferStatus === "paid" ? "Payé (Escrow) 🔒" : "En attente ⏳"}
                              </span>
                            </div>

                            <div className="space-y-1 text-left">
                              <h4 className="text-[11px] font-black text-slate-900 leading-tight">
                                {msg.customOfferName}
                              </h4>
                              <p className="text-[10px] text-slate-600 leading-normal font-medium">
                                {msg.customOfferDescription}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                              <div className="text-left">
                                <span className="text-[8.5px] text-amber-800 font-bold block uppercase">Prix proposé</span>
                                <span className="text-[12.5px] font-black text-amber-950 font-mono">
                                  {msg.customOfferPrice?.toLocaleString()} FCFA
                                </span>
                              </div>
                              {msg.customOfferOrderId && (
                                <div className="text-right">
                                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Commande</span>
                                  <span className="text-[9px] font-mono font-extrabold text-slate-600">
                                    #{msg.customOfferOrderId}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="pt-1.5 text-center">
                              {/* Buyer Action */}
                              {!isMine && msg.customOfferStatus === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleCustomOfferAction(msg.id, "pay")}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-lg transition text-[9.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  Payer l'ordre (Séquestre)
                                </button>
                              )}

                              {/* Seller Action */}
                              {isMine && msg.customOfferStatus === "paid" && (
                                <button
                                  type="button"
                                  onClick={() => handleCustomOfferAction(msg.id, "ship")}
                                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-2 px-3 rounded-lg transition text-[9.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                  🚚 Expédier / Livrer le service
                                </button>
                              )}

                              {/* Buyer Action */}
                              {!isMine && msg.customOfferStatus === "shipped" && (
                                <button
                                  type="button"
                                  onClick={() => handleCustomOfferAction(msg.id, "receive")}
                                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-2 px-3 rounded-lg transition text-[9.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                >
                                  ✔ Confirmer la réception
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 1. PHOTO MESSAGE */}
                        {isImage && (
                          <div className="mb-2 rounded-xl overflow-hidden bg-slate-50 border border-gray-100 max-w-sm">
                            <img
                              src={msg.imageUrl}
                              alt="Partagée"
                              className="w-full max-h-52 object-cover hover:scale-102 transition cursor-zoom-in"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          </div>
                        )}

                        {/* 2. VOICE MESSAGE WIDGET */}
                        {isVoice ? (
                          <div className="flex items-center gap-2 py-0.5 px-0.5 min-w-[150px] md:min-w-[170px]">
                            <button
                              type="button"
                              onClick={() => togglePlayVoice(msg.id, msg.voiceDuration || 5)}
                              className={`p-1.5 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer ${
                                isMine
                                  ? "bg-emerald-500 hover:bg-emerald-450 text-white"
                                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                              }`}
                            >
                              {isPlaying ? (
                                <Pause className="h-3 w-3 animate-pulse fill-current" />
                              ) : (
                                <Play className="h-3 w-3 fill-current ml-0.5" />
                              )}
                            </button>
                            
                            <div className="flex-1 space-y-0.5">
                              {/* Audio Waveform Emulation - Extra Slim and Fine */}
                              <div className="flex items-end gap-0.5 h-4.5">
                                {[...Array(10)].map((_, i) => {
                                  const heights = [3, 5, 2, 6, 4, 5, 3, 4, 2, 5];
                                  const height = heights[i % heights.length] * 2.0;
                                  const isActive = progress > (i * (100 / 10));
                                  return (
                                    <span
                                      key={i}
                                      className="w-0.5 rounded-full transition-all duration-300"
                                      style={{
                                        height: `${height}px`,
                                        backgroundColor: isActive 
                                          ? (isMine ? "#a7f3d0" : "#10b981") 
                                          : (isMine ? "#047857" : "#e2e8f0")
                                      }}
                                    ></span>
                                  );
                                })}
                              </div>
                              
                              <div className="flex justify-between items-center text-[7.5px] leading-none">
                                <span className={isMine ? "text-emerald-100" : "text-gray-400"}>
                                  Vocal
                                </span>
                                <span className={`font-mono font-bold ${isMine ? "text-emerald-100" : "text-gray-500"}`}>
                                  {isPlaying 
                                    ? `0:${Math.floor((progress/100)*(msg.voiceDuration || 5)).toString().padStart(2, '0')}` 
                                    : `0:${(msg.voiceDuration || 5).toString().padStart(2, '0')}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : msg.documentUrl ? (
                          /* Document Attachment Widget */
                          <div className="space-y-2">
                            {msg.documentType === "pdf" ? (
                              <div className={`flex items-center gap-3 border p-2.5 rounded-xl max-w-xs text-gray-800 ${isMine ? "bg-emerald-700/50 border-emerald-550 text-white" : "bg-rose-50/70 border-rose-100"}`}>
                                <div className="bg-rose-500 text-white p-2 rounded-lg font-black font-mono text-[9px] tracking-wider uppercase shrink-0">
                                  PDF
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[11px] font-extrabold truncate block ${isMine ? "text-white" : "text-gray-900"}`} title={msg.documentName}>
                                    {msg.documentName || "document.pdf"}
                                  </p>
                                  <span className={`text-[9px] block ${isMine ? "text-emerald-100" : "text-gray-400"}`}>
                                    {msg.documentSize || "1.2 MB"} • PDF
                                  </span>
                                </div>
                                <a
                                  href={msg.documentUrl}
                                  download={msg.documentName || "document.pdf"}
                                  className={`font-extrabold p-1.5 px-2.5 rounded-lg text-[9px] cursor-pointer transition shrink-0 uppercase select-none ${isMine ? "bg-white hover:bg-emerald-50 text-emerald-800" : "bg-rose-600 hover:bg-rose-700 text-white"}`}
                                >
                                  Ouvrir
                                </a>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-3 border p-2.5 rounded-xl max-w-xs text-gray-800 ${isMine ? "bg-emerald-700/50 border-emerald-550 text-white" : "bg-sky-50/70 border-sky-100"}`}>
                                <div className="bg-sky-500 text-white p-2 rounded-lg font-black font-mono text-[9px] tracking-wider uppercase shrink-0">
                                  DOC
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[11px] font-extrabold truncate block ${isMine ? "text-white" : "text-gray-900"}`} title={msg.documentName}>
                                    {msg.documentName || "note.txt"}
                                  </p>
                                  <span className={`text-[9px] block ${isMine ? "text-emerald-100" : "text-gray-400"}`}>
                                    {msg.documentSize || "4 KB"} • Document
                                  </span>
                                </div>
                                <a
                                  href={msg.documentUrl}
                                  download={msg.documentName || "note.txt"}
                                  className={`font-extrabold p-1.5 px-2.5 rounded-lg text-[9px] cursor-pointer transition shrink-0 uppercase select-none ${isMine ? "bg-white hover:bg-emerald-50 text-emerald-800" : "bg-sky-600 hover:bg-sky-700 text-white"}`}
                                >
                                  Ouvrir
                                </a>
                              </div>
                            )}
                            {msg.text && !msg.text.startsWith("📄") && !msg.text.startsWith("📝") && !msg.text.startsWith("📎") && !msg.text.startsWith("🎵") && (
                              <p className="text-[11.5px] font-bold leading-relaxed break-words">{msg.text}</p>
                            )}
                            {msg.translation && msg.translation !== msg.text && (
                              <div className={`mt-1.5 pt-1.5 border-t border-dashed ${isMine ? "border-emerald-500/50 text-emerald-100" : "border-gray-200 text-gray-500"} text-[10.5px] italic font-medium flex items-start gap-1`}>
                                <span className="shrink-0 font-extrabold text-[8.5px] uppercase bg-slate-100 text-slate-700 px-1 py-0.5 rounded-sm not-italic select-none" title={`Traduit de ${msg.translatedFrom || 'auto'} vers ${msg.translatedTo || 'auto'}`}>
                                  TRADUIT
                                </span>
                                <span className="break-words">{msg.translation}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Standard Text */
                          <div>
                            <p className="text-[11.5px] font-bold leading-relaxed break-words">{msg.text}</p>
                            {msg.translation && msg.translation !== msg.text && (
                              <div className={`mt-1.5 pt-1.5 border-t border-dashed ${isMine ? "border-emerald-500/50 text-emerald-100" : "border-gray-200 text-gray-500"} text-[10.5px] italic font-medium flex items-start gap-1`}>
                                <span className="shrink-0 font-extrabold text-[8.5px] uppercase bg-slate-100 text-slate-700 px-1 py-0.5 rounded-sm not-italic select-none" title={`Traduit de ${msg.translatedFrom || 'auto'} vers ${msg.translatedTo || 'auto'}`}>
                                  TRADUIT
                                </span>
                                <span className="break-words">{msg.translation}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* REACTIONS DISPLAY ROW */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-2 ${isMine ? "justify-end" : "justify-start"}`}>
                            {Object.entries(msg.reactions).map(([emoji, uids]) => {
                              const userIds = (uids || []) as string[];
                              if (userIds.length === 0) return null;
                              const hasIReacted = userIds.includes(currentUser.id);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border transition cursor-pointer select-none active:scale-90 ${
                                    hasIReacted
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold"
                                      : isMine
                                      ? "bg-emerald-700/40 border-emerald-550 text-emerald-50 hover:bg-emerald-700/60"
                                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                                  }`}
                                  title={`${userIds.length} personne(s) (${emoji})`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[9px] opacity-90">{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timing + WhatsApp Style Ticks */}
                        <div className="flex items-center justify-end gap-1 mt-1.5 text-[8.5px] font-bold select-none">
                          <span className={isMine ? "text-emerald-100/80" : "text-gray-400"}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            msg.isOptimistic ? (
                              <Loader2 className="h-3 w-3 text-emerald-100 animate-spin shrink-0" />
                            ) : msg.isFailed ? (
                              <span className="text-rose-200 text-[10px] font-black shrink-0" title="Échec de l'envoi">⚠️</span>
                            ) : (
                              <CheckCheck className="h-3 w-3 text-emerald-250 shrink-0" />
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* HOVER ACTIONS BAR FOR EACH MESSAGE */}
                    <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-1 z-20 px-2 py-1 bg-white border border-gray-200 rounded-full shadow-md ${
                      isMine 
                        ? "-left-48 flex-row-reverse" 
                        : "-right-48 flex-row"
                    }`}>
                      {/* Quick Reactions Emojis */}
                      {!msg.isAdminOfficial && ["👍", "❤️", "😂", "🙏"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition text-xs cursor-pointer p-0.5 select-none"
                          title={`Réagir avec ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                      
                      {!msg.isAdminOfficial && <span className="h-3 w-[1px] bg-gray-200 mx-0.5"></span>}

                      {/* Reply button */}
                      {!msg.isAdminOfficial && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToMessage(msg);
                            showToast("Répondre au message 💬");
                            const inputEl = document.querySelector("#yaamaa_chat_form input");
                            if (inputEl) {
                              (inputEl as HTMLInputElement).focus();
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-emerald-600 hover:scale-110 transition cursor-pointer"
                          title="Répondre"
                        >
                          <CornerUpLeft className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Toggle Read/Unread manually */}
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/social/messages/${msg.id}/toggle-read`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: currentUser.id })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readBy: data.readBy } : m));
                            showToast(data.readBy.includes(currentUser.id) ? "Marqué comme lu 📩" : "Marqué comme non lu ✉️");
                            fetchUnreadStats();
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-emerald-650 hover:scale-110 transition cursor-pointer flex items-center justify-center"
                        title={msg.readBy?.includes(currentUser.id) ? "Marquer comme non lu" : "Marquer comme lu"}
                      >
                        {msg.readBy?.includes(currentUser.id) ? (
                          <Mail className="h-3.5 w-3.5 text-gray-400 hover:text-emerald-600" />
                        ) : (
                          <MailOpen className="h-3.5 w-3.5 text-emerald-600 hover:text-emerald-700 animate-pulse" />
                        )}
                      </button>

                      {/* Copy Text button */}
                      {msg.text && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            showToast("Message copié 📋");
                          }}
                          className="p-1 text-gray-500 hover:text-emerald-600 hover:scale-110 transition cursor-pointer"
                          title="Copier le texte"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:scale-110 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* LIVE VOICE RECORDING BANNER */}
            {isRecording && (
              <div className="sticky bottom-1 left-0 right-0 bg-emerald-600/95 border border-emerald-500 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between gap-4 text-white shadow-xl z-10 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-rose-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </div>
                  <div className="font-bold text-xs space-y-0.5">
                    <p className="uppercase tracking-wider font-extrabold text-[10px] text-emerald-100">Enregistrement vocal en cours...</p>
                    <p className="font-mono text-emerald-200">
                      Durée: 0:{recordingDuration.toString().padStart(2, '0')} s
                    </p>
                  </div>
                </div>

                {/* Micro Audio Animation Bars */}
                <div className="flex items-center gap-0.5 h-4 px-3 shrink-0">
                  {[...Array(6)].map((_, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-emerald-100 rounded-full animate-bounce"
                      style={{
                        height: `${Math.floor(Math.random() * 12) + 4}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.6s"
                      }}
                    ></span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="bg-transparent hover:bg-white/10 text-emerald-100 hover:text-white px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={stopAndStageVoice}
                    className="bg-white hover:bg-slate-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-lg text-[10.5px] shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    Valider l'enregistrement
                  </button>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* CHAT INPUT AREA WITH PRESETS & AUDIO */}
          {((activeTab === "dm" && activeFriend) || (activeTab === "communities" && activeCommunity)) && (
            <div className="border-t border-gray-100 p-2 sm:p-3 bg-white space-y-2 shrink-0">
              
              {/* IMAGE SELECTION ACCORDION */}
              {showImageDropdown && (
                <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-gray-150 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-wider flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                      Partager un fichier ou un média
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setShowImageDropdown(false);
                      }}
                      className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Dynamic accept trigger helper for file categories */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3.5 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-xl transition cursor-pointer text-center group"
                    >
                      <span className="text-xl group-hover:scale-110 transition">🖼️</span>
                      <span className="text-[10px] sm:text-[10.5px] font-black text-gray-700">Photo / Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "audio/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3.5 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-xl transition cursor-pointer text-center group"
                    >
                      <span className="text-xl group-hover:scale-110 transition">🎵</span>
                      <span className="text-[10px] sm:text-[10.5px] font-black text-gray-700">Audio / Musique</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "application/pdf";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3.5 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-xl transition cursor-pointer text-center group"
                    >
                      <span className="text-xl group-hover:scale-110 transition">📄</span>
                      <span className="text-[10px] sm:text-[10.5px] font-black text-gray-700">Document PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "text/plain,.txt,.json,.md,.doc,.docx";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3.5 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-xl transition cursor-pointer text-center group"
                    >
                      <span className="text-xl group-hover:scale-110 transition">📝</span>
                      <span className="text-[10px] sm:text-[10.5px] font-black text-gray-700">Fichier Texte</span>
                    </button>
                  </div>

                  {/* Hidden inputs & camera toggle block */}
                  <div className="pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col justify-center">
                      <p className="text-[9.5px] text-gray-400 font-extrabold uppercase mb-1">Téléchargement direct</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute("accept");
                            fileInputRef.current.click();
                          }
                        }}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                      >
                        <Paperclip className="h-4 w-4" />
                        Parcourir tous les fichiers
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Camera toggle trigger */}
                    <div className="flex flex-col justify-center">
                      <p className="text-[9.5px] text-gray-400 font-extrabold uppercase mb-1">Prendre une photo</p>
                      {isCameraActive ? (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                          Désactiver la caméra
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                          Activer l'appareil photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CAMERA STREAM VIEW IF ACTIVE */}
                  {isCameraActive && (
                    <div className="bg-slate-900 rounded-2xl p-3 border border-gray-800 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                      <div className="w-full text-center">
                        <span className="bg-red-500 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                          Caméra en direct
                        </span>
                      </div>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-64 object-cover rounded-xl bg-black"
                      />
                      <div className="flex gap-2.5 w-full justify-center">
                        <button
                          type="button"
                          onClick={takePhoto}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="h-4 w-4" />
                          Capturer la photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-gray-800 hover:bg-gray-750 text-gray-300 font-black px-4 py-2 rounded-xl text-xs cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Preset Photos */}
                  <div className="pt-2 border-t border-gray-150 space-y-2">
                    <p className="text-[9.5px] text-gray-400 font-extrabold uppercase">Captures de gains instantanées</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PRESET_PHOTOS.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendPhoto(photo.url, photo.caption)}
                          className="group relative rounded-xl overflow-hidden border border-gray-200 text-left cursor-pointer hover:border-emerald-500 transition shadow-xs focus:ring-0 text-[10.5px]"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="h-16 w-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="p-1.5 bg-white font-extrabold text-[9px] truncate">
                            {photo.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom URL Option */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Ou coller l'URL d'une image en ligne</label>
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="https://example.com/ma-preuve-de-gain.png"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:ring-0 text-[11px]"
                      />
                    </div>
                    <div className="w-full md:w-56">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Légende facultative</label>
                      <input
                        type="text"
                        value={customImageCaption}
                        onChange={(e) => setCustomImageCaption(e.target.value)}
                        placeholder="Wow ! Regardez mon retrait !"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 font-bold focus:ring-0 text-[11px]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!customImageUrl.trim()}
                      onClick={() => handleSendPhoto(customImageUrl.trim(), customImageCaption.trim())}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-extrabold px-4 py-2 rounded-lg text-xs shrink-0 cursor-pointer text-center w-full md:w-auto"
                    >
                      Envoyer URL
                    </button>
                  </div>
                </div>
              )}

              {/* STAGED ATTACHMENT PREVIEW */}
              {stagedAttachment && (
                <div className="bg-emerald-50/40 p-2 sm:p-2.5 rounded-2xl border border-dashed border-emerald-300 flex items-center justify-between gap-3 animate-fade-in mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 font-bold text-xs overflow-hidden">
                      {stagedAttachment.type === "image" ? (
                        <img src={stagedAttachment.url} className="h-full w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      ) : stagedAttachment.type === "voice" ? (
                        <Mic className="h-5 w-5" />
                      ) : (
                        <Paperclip className="h-5 w-5" />
                      )}
                    </div>
                    <div className="truncate min-w-0 text-left">
                      <p className="font-extrabold text-[11px] sm:text-xs text-gray-900 truncate">
                        {stagedAttachment.name || (stagedAttachment.type === "image" ? "Photo sélectionnée" : stagedAttachment.type === "voice" ? "Message vocal enregistré" : "Fichier sélectionné")}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold truncate">
                        {stagedAttachment.type === "voice" 
                          ? `${stagedAttachment.duration} s` 
                          : stagedAttachment.size || "Média prêt"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedAttachment(null)}
                    className="h-6 w-6 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-850 flex items-center justify-center transition cursor-pointer font-black text-xs shrink-0"
                    title="Supprimer la sélection"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* REPLYING TO MESSAGE PREVIEW BANNER */}
              {replyingToMessage && (
                <div className="bg-slate-100 p-2.5 px-3.5 rounded-xl border-l-4 border-emerald-500 flex items-center justify-between gap-3 animate-fade-in mb-2 text-xs">
                  <div className="truncate min-w-0 text-left">
                    <p className="font-extrabold text-emerald-800 text-[9.5px] uppercase tracking-wide">
                      Réponse à @{replyingToMessage.senderUsername}
                    </p>
                    <p className="text-gray-600 truncate text-[11px] font-medium mt-0.5">
                      {replyingToMessage.text || (replyingToMessage.voiceUrl ? "🎙️ Message vocal" : replyingToMessage.imageUrl ? "🖼️ Image" : "📎 Fichier")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className="h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition cursor-pointer font-black text-[10px] shrink-0"
                    title="Annuler la réponse"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* MESSAGE FORM INPUT ROW */}
              {activeFriend?.id === "user_admin" ? (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-center text-amber-900 text-xs font-bold shadow-xs animate-fade-in flex flex-col items-center gap-1.5">
                  <span className="text-sm">🔒 Canal Officiel d'Annonces</span>
                  <p className="text-[11px] text-amber-700 font-medium max-w-lg">
                    Ce canal de discussion est réservé exclusivement aux informations importantes, diffusions de masse et notifications officielles de l'administration de la plateforme. Les réponses et réactions y sont désactivées.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isRecording) {
                      stopAndStageVoice();
                    } else {
                      handleSendMessage();
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2"
                  id="yaamaa_chat_form"
                >
                  {/* FILE/MEDIA POPUP BUTTON */}
                  <button
                    type="button"
                    onClick={() => setShowImageDropdown(!showImageDropdown)}
                    className={`p-2 sm:p-2.5 rounded-xl border transition shrink-0 cursor-pointer ${
                      showImageDropdown
                        ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border-gray-200 hover:bg-slate-100 text-gray-500 hover:text-gray-800"
                    }`}
                    title="Partager un fichier, photo, document, PDF ou audio"
                  >
                    <Paperclip className="h-4 sm:h-4.5 w-4 sm:w-4.5 text-emerald-600" />
                  </button>
                  
                  {/* VOCAL MICRO RECORD DIRECT BUTTON */}
                  <button
                    type="button"
                    onClick={isRecording ? stopAndStageVoice : startRecording}
                    className={`p-2 sm:p-2.5 rounded-xl border shrink-0 cursor-pointer transition active:scale-95 ${
                      isRecording 
                        ? "bg-rose-50/50 border-rose-200 text-rose-600 hover:bg-rose-100 animate-pulse" 
                        : "bg-slate-50 border-gray-200 hover:bg-slate-100 text-gray-500 hover:text-gray-800"
                    }`}
                    title={isRecording ? "Arrêter et envoyer l'enregistrement" : "Enregistrer un message vocal"}
                  >
                    <Mic className={`h-4 sm:h-4.5 w-4 sm:w-4.5 ${isRecording ? "text-rose-600" : "text-emerald-600"}`} />
                  </button>

                  {/* CUSTOM OFFER "FAIRE L'ORDRE" BUTTON (ONLY IN PRIVATE DM) */}
                  {activeTab === "dm" && activeFriend && (
                    <button
                      type="button"
                      onClick={() => setShowCustomOfferModal(true)}
                      className="p-2 sm:p-2.5 rounded-xl border bg-amber-50 border-amber-200 hover:bg-amber-150 text-amber-700 hover:text-amber-800 shrink-0 cursor-pointer font-extrabold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition active:scale-95"
                      title="Faire un ordre / Offre personnalisée"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 animate-pulse" />
                      <span className="inline">Faire l'ordre</span>
                    </button>
                  )}

                  {/* GIFT CATALOG BUTTON IN THE MIDDLE OF THE CONVERSATION INPUT BAR */}
                  <button
                    type="button"
                    onClick={() => {
                      setGiftRecipientId(activeFriend ? activeFriend.id : (activeCommunity?.creatorId || null));
                      setGiftCatalogTab("send");
                      setShowGiftCatalogModal(true);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl border bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-700 hover:text-pink-800 shrink-0 cursor-pointer font-extrabold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition active:scale-95"
                    title="Ouvrir le catalogue de cadeaux virtuels"
                    id="btn_open_gift_catalog_chat"
                  >
                    <Gift className="h-4 w-4 text-pink-600 animate-pulse" />
                    <span className="hidden sm:inline">Cadeaux 🎁</span>
                  </button>

                  <textarea
                    rows={1}
                    value={isRecording ? `Message vocal en cours (durée: ${recordingDuration}s)... Cliquez sur le micro pour arrêter.` : newMsgText}
                    onChange={(e) => !isRecording && handleTextareaChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        if (isRecording) {
                          stopAndStageVoice();
                        } else {
                          handleSendMessage();
                        }
                      }
                    }}
                    disabled={isRecording}
                    placeholder={isRecording ? "Enregistrement vocal en cours..." : "Tapez un message (Entrée pour la ligne suivante)..."}
                    className={`flex-1 min-w-0 border focus:outline-none rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold transition min-h-[42px] max-h-[140px] overflow-y-auto resize-none ${
                      isRecording 
                        ? "bg-rose-50/50 border-rose-200 text-rose-750 placeholder-rose-400 select-none cursor-not-allowed" 
                        : "bg-slate-50 border-gray-200 focus:border-emerald-300 focus:bg-white text-gray-800"
                    }`}
                  />

                  <button
                    type="submit"
                    className={`p-2 sm:p-2.5 rounded-xl cursor-pointer shadow-sm transition shrink-0 active:scale-95 ${
                      isRecording 
                        ? "bg-rose-600 hover:bg-rose-700 text-white animate-bounce" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    title={isRecording ? "Envoyer l'enregistrement vocal" : "Envoyer"}
                  >
                    <Send className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
                  </button>
                </form>
              )}

            </div>
          )}

          {/* Floating "New Messages" / "Go to bottom" button */}
          {showNewMessagesBtn && (
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="absolute bottom-20 right-6 bg-emerald-600 hover:bg-emerald-750 text-white shadow-xl px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-black tracking-wide transition-all transform hover:scale-105 active:scale-95 z-40 animate-bounce cursor-pointer border border-emerald-500"
            >
              <ArrowDown className="h-4 w-4 stroke-[3]" />
              {newMessagesCount > 0 ? (
                <span>{newMessagesCount} nouveau{newMessagesCount > 1 ? "s" : ""} message{newMessagesCount > 1 ? "s" : ""}</span>
              ) : (
                <span>Défiler vers le bas</span>
              )}
            </button>
          )}

          </>
         )}
        </div>

        {/* RIGHT COLUMN REMOVED */}

      </div>

      {/* CUSTOM OFFER CREATION MODAL OVERLAY */}
      {showCustomOfferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="custom_offer_modal_overlay">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">Faire un ordre personnalisé</h3>
                  <p className="text-[10px] text-gray-400 font-medium">L'ordre sera envoyé dans cette discussion et sécurisé par séquestre.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomOfferModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Product Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Sélectionner un produit publié</label>
                {myProducts.length === 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10.5px] font-bold text-rose-700">
                    Aucun produit publié trouvé dans votre boutique. Veuillez d'abord publier vos produits dans l'onglet Boutique.
                  </div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      setSelectedProductId(prodId);
                      const prod = myProducts.find(p => p.id === prodId);
                      if (prod) {
                        setCoTitle(prod.name);
                        setCoPrice(prod.price.toString());
                        setCoDesc(prod.description || "");
                      } else {
                        setCoTitle("");
                        setCoPrice("");
                        setCoDesc("");
                      }
                    }}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 transition cursor-pointer"
                  >
                    <option value="">-- Choisir parmi vos produits publiés --</option>
                    {myProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price.toLocaleString()} FCFA)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Titre de l'ordre (Produit ou Service)</label>
                <input
                  type="text"
                  value={coTitle}
                  onChange={(e) => setCoTitle(e.target.value)}
                  placeholder="Ex: Plan architectural de villa"
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Description détaillée & Notes</label>
                <textarea
                  value={coDesc}
                  onChange={(e) => setCoDesc(e.target.value)}
                  rows={3}
                  placeholder="Notes facultatives pour l'acheteur..."
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 transition resize-none font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={coQuantity}
                    onChange={(e) => setCoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-black text-gray-800 transition"
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    value={coPrice}
                    onChange={(e) => setCoPrice(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-black text-gray-800 transition font-mono"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Montant total de l'ordre :</span>
                <span className="text-sm font-black text-amber-950 font-mono">
                  {((parseFloat(coPrice) || 0) * coQuantity).toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 bg-slate-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCustomOfferModal(false)}
                className="flex-1 bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendCustomOffer}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5 animate-pulse" />
                Envoyer l'offre
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4D ULTRA-PREMIUM VIRTUAL GIFT FULL SCREEN ANIMATION OVERLAY */}
      {activeGiftAnimation && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-950/80 backdrop-blur-md pointer-events-none select-none">
          {/* Custom CSS animations injection */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes yama-gift-bounce {
              0%, 100% { transform: scale(1) translateY(0) rotate(0deg); filter: drop-shadow(0 0 15px rgba(245,158,11,0.6)); }
              50% { transform: scale(1.25) translateY(-25px) rotate(8deg); filter: drop-shadow(0 0 35px rgba(239,68,68,0.9)); }
            }
            @keyframes yama-particle-fall {
              0% { transform: translateY(-50px) translateX(0) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(105vh) translateX(var(--drift, 100px)) rotate(var(--spin, 360deg)); opacity: 0; }
            }
            @keyframes yama-particle-burst {
              0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
              15% { opacity: 1; }
              100% { transform: translate(var(--burst-x, 200px), var(--burst-y, -200px)) scale(var(--burst-scale, 1.5)) rotate(var(--spin, 720deg)); opacity: 0; }
            }
            @keyframes yama-particle-shoot {
              0% { transform: translateX(-150px) translateY(var(--wave-y, 0px)) scale(0.8); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateX(110vw) translateY(var(--wave-y-end, 0px)) scale(1.4); opacity: 0; }
            }
            @keyframes yama-text-glow {
              0%, 100% { text-shadow: 0 0 15px rgba(251,191,36,0.6), 0 0 30px rgba(251,146,60,0.4); }
              50% { text-shadow: 0 0 30px rgba(251,191,36,1), 0 0 50px rgba(239,68,68,0.8); }
            }
            @keyframes yama-shockwave {
              0% { transform: scale(0.6); opacity: 0.8; border-color: rgba(251,191,36,0.8); }
              100% { transform: scale(2.5); opacity: 0; border-color: rgba(239,68,68,0); }
            }
            .yama-animate-bounce-gift {
              animation: yama-gift-bounce 2s ease-in-out infinite;
            }
            .yama-animate-text-glow {
              animation: yama-text-glow 1.5s ease-in-out infinite;
            }
            .yama-shockwave-ring {
              animation: yama-shockwave 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
            }
          `}} />

          {/* Particle stream elements generator */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 45 }).map((_, i) => {
              const delay = Math.random() * 2.5;
              const duration = 2.5 + Math.random() * 2.5;
              const size = 16 + Math.random() * 32;
              const spin = -360 + Math.random() * 720;
              const drift = -150 + Math.random() * 300;
              
              let animationStyle = {};
              let particleContent = activeGiftAnimation.emoji;

              if (activeGiftAnimation.type === "petals") {
                particleContent = ["🌸", "🌹", "🌷", "💖", "✨"][i % 5];
                animationStyle = {
                  left: `${Math.random() * 100}%`,
                  top: `-40px`,
                  fontSize: `${size}px`,
                  animation: `yama-particle-fall ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  "--drift": `${drift}px`,
                  "--spin": `${spin}deg`
                } as any;
              } else if (activeGiftAnimation.type === "diamonds") {
                particleContent = ["💎", "✨", "💎", "⭐", "💙"][i % 5];
                animationStyle = {
                  left: `${Math.random() * 100}%`,
                  top: `-40px`,
                  fontSize: `${size}px`,
                  animation: `yama-particle-fall ${duration - 0.5}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                  animationDelay: `${delay}s`,
                  "--drift": `${drift * 0.5}px`,
                  "--spin": `${spin * 1.5}deg`
                } as any;
              } else if (activeGiftAnimation.type === "money") {
                particleContent = ["💵", "💰", "💵", "💸", "🪙"][i % 5];
                animationStyle = {
                  left: `${Math.random() * 100}%`,
                  top: `-40px`,
                  fontSize: `${size}px`,
                  animation: `yama-particle-fall ${duration + 0.5}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  "--drift": `${drift * 1.2}px`,
                  "--spin": `${spin}deg`
                } as any;
              } else if (activeGiftAnimation.type === "rocket") {
                particleContent = ["🚀", "🔥", "✨", "⭐"][i % 4];
                const waveY = -150 + Math.random() * 300;
                const waveYEnd = waveY + (-100 + Math.random() * 200);
                animationStyle = {
                  left: `-100px`,
                  top: `${20 + Math.random() * 60}%`,
                  fontSize: `${size}px`,
                  animation: `yama-particle-shoot ${duration - 1.2}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                  animationDelay: `${delay * 0.6}s`,
                  "--wave-y": `${waveY}px`,
                  "--wave-y-end": `${waveYEnd}px`
                } as any;
              } else if (activeGiftAnimation.type === "car") {
                particleContent = ["🏎️", "💨", "🔥", "🏁"][i % 4];
                animationStyle = {
                  left: `-120px`,
                  top: `${60 + Math.random() * 25}%`,
                  fontSize: `${size}px`,
                  animation: `yama-particle-shoot ${duration - 1.5}s ease-in-out infinite`,
                  animationDelay: `${delay * 0.5}s`,
                  "--wave-y": "0px",
                  "--wave-y-end": "0px"
                } as any;
              } else {
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 350;
                const burstX = Math.cos(angle) * dist;
                const burstY = Math.sin(angle) * dist;
                animationStyle = {
                  left: `50%`,
                  top: `45%`,
                  fontSize: `${size * 0.8}px`,
                  animation: `yama-particle-burst ${duration - 1}s cubic-bezier(0.1, 0.8, 0.3, 1) infinite`,
                  animationDelay: `${delay * 0.4}s`,
                  "--burst-x": `${burstX}px`,
                  "--burst-y": `${burstY}px`,
                  "--burst-scale": `${0.5 + Math.random() * 1.5}`
                } as any;
              }

              return (
                <span
                  key={i}
                  className="absolute select-none pointer-events-none filter drop-shadow-md z-10 transition-transform duration-300"
                  style={animationStyle}
                >
                  {particleContent}
                </span>
              );
            })}
          </div>

          {(["lion", "dragon", "light", "lightning"].includes(activeGiftAnimation.type)) && (
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-64 h-64 border-4 rounded-full yama-shockwave-ring" style={{ animationDelay: "0s" }} />
              <div className="w-64 h-64 border-4 rounded-full yama-shockwave-ring" style={{ animationDelay: "0.5s" }} />
              <div className="w-64 h-64 border-4 rounded-full yama-shockwave-ring" style={{ animationDelay: "1s" }} />
            </div>
          )}

          <div className="relative z-20 flex flex-col items-center justify-center p-8 max-w-lg text-center">
            <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-red-500/20 blur-3xl opacity-75 rounded-full animate-pulse pointer-events-none" />

            <div className="relative mb-8 flex items-center justify-center w-52 h-52 bg-slate-900/60 border border-white/20 rounded-full shadow-2xl backdrop-blur-xl animate-fade-in">
              <div className="absolute inset-2 bg-gradient-to-br from-amber-500/10 to-pink-500/10 rounded-full" />
              <span className="text-8xl select-none yama-animate-bounce-gift drop-shadow-2xl">
                {activeGiftAnimation.emoji}
              </span>
            </div>

            <div className="space-y-3 max-w-md animate-scale-up">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-500/30 shadow-lg">
                👑 CADEAU ULTRA PREMIUM YAMA 👑
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight yama-animate-text-glow leading-tight">
                @{activeFriend?.username || "Abonné"}
              </h1>
              
              <p className="text-lg font-extrabold text-amber-200">
                a reçu <span className="underline decoration-pink-500 decoration-2">{activeGiftAnimation.name}</span> !
              </p>

              <div className="pt-4 flex justify-center items-center gap-2 text-slate-400 font-bold text-xs">
                <span>Animation 4D Immersive</span>
                <span>•</span>
                <span>Audio spatialisé</span>
                <span>•</span>
                <span>+{activeGiftAnimation.duration}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIRTUAL GIFT SELECTION CATALOG MODAL */}
      {showGiftCatalogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="gift_catalog_modal_overlay">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20">
                  <Gift className="h-5 w-5 text-pink-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    Système de Cadeaux Yama
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Offrez des cadeaux 3D/4D, achetez des pièces ou convertissez vos revenus.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGiftCatalogModal(false);
                  setGiftSendingError(null);
                  setGiftSendingSuccess(null);
                  setGiftRecipientId(null);
                }}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* THREE MODULE INTERACTIVE TABS */}
            <div className="px-5 bg-slate-950 border-b border-slate-800 flex gap-1 shrink-0">
              {[
                { id: "send", label: "Envoyer un Cadeau 🎁" },
                { id: "buy", label: "Acheter des Pièces 🪙" },
                { id: "withdraw", label: "Retrait & Revenus 💰" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setGiftCatalogTab(tab.id as any);
                    setGiftSendingError(null);
                    setGiftSendingSuccess(null);
                  }}
                  className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    giftCatalogTab === tab.id
                      ? "border-pink-500 text-pink-400 bg-pink-500/5"
                      : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Balances & Alerts Banner */}
            <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">Mon Solde :</span>
                  <span className="inline-flex items-center gap-1 font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20">
                    🪙 {currentUser?.giftPoints?.toLocaleString() || "0"} Pièces
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">Gains Reçus :</span>
                  <span className="inline-flex items-center gap-1 font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    💎 {currentUser?.giftPointsEarned?.toLocaleString() || "0"} Pièces
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-[180px] text-right">
                {giftSendingError && (
                  <p className="text-[11px] text-rose-400 font-bold animate-pulse">{giftSendingError}</p>
                )}
                {giftSendingSuccess && (
                  <p className="text-[11px] text-emerald-400 font-black animate-bounce">{giftSendingSuccess}</p>
                )}
              </div>
            </div>

            {/* TAB CONTENT MODULE */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40">
              
              {/* TAB 1: SEND GIFT CATALOG */}
              {giftCatalogTab === "send" && (
                <div className="space-y-4">
                  
                  {/* Recipient Dropdown if in Community/Group */}
                  {activeTab === "communities" && activeCommunity && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-md">
                      <label className="text-[10px] font-black uppercase tracking-wider text-teal-400">Destinataire du cadeau :</label>
                      <select
                        value={giftRecipientId || ""}
                        onChange={(e) => setGiftRecipientId(e.target.value || null)}
                        className="bg-slate-950 text-white font-extrabold text-xs px-3 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Choisir un donateur / membre --</option>
                        {usersList.map((usr: any) => (
                          <option key={usr.id} value={usr.id}>
                            @{usr.username} {usr.id === activeCommunity.creatorId ? "(Créateur ⭐)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Recipient Information Display */}
                  {(() => {
                    const recipientUser = usersList.find((u: any) => u.id === (giftRecipientId || activeFriend?.id));
                    return recipientUser ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                        <img
                          src={recipientUser.avatar}
                          alt={recipientUser.username}
                          className="h-9 w-9 rounded-xl object-cover border border-slate-700 shadow-sm animate-pulse"
                        />
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-wider">Cadeau destiné à :</p>
                          <p className="text-xs font-bold text-pink-400">@{recipientUser.username} <span className="text-[10px] text-slate-400">({recipientUser.name})</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs font-bold text-center">
                        ⚠️ Veuillez sélectionner un destinataire pour pouvoir lui envoyer le cadeau.
                      </div>
                    );
                  })()}

                  {/* Categories Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0 border-b border-slate-800/60">
                    {[
                      { id: "all", label: "Tous" },
                      { id: "Classique", label: "Classique" },
                      { id: "Premium", label: "Premium" },
                      { id: "Royale", label: "Royale" },
                      { id: "Légendaire", label: "Légendaire" },
                      { id: "Richesse", label: "Richesse" },
                      { id: "Amour", label: "Amour" },
                      { id: "Fête", label: "Fête" },
                      { id: "Gaming", label: "Gaming" },
                      { id: "Sport", label: "Sport" },
                      { id: "Afrique", label: "Afrique" },
                      { id: "Saisonnier", label: "Saisonnier" },
                      { id: "Exclusif", label: "Exclusif" }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setGiftCategoryFilter(cat.id)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 transition cursor-pointer border ${
                          giftCategoryFilter === cat.id
                            ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/20"
                            : "bg-slate-800 border-slate-750 hover:border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Gifts Catalog Grid */}
                  {(() => {
                    const rawGifts = systemMetrics?.settings?.virtualGifts || [];
                    const filteredGifts = rawGifts.filter((g: any) => {
                      if (g.active === false) return false;
                      if (giftCategoryFilter === "all") return true;
                      return g.category === giftCategoryFilter;
                    });

                    if (filteredGifts.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Gift className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500 text-xs font-bold">Aucun cadeau virtuel disponible dans cette catégorie.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {filteredGifts.map((gift: any) => {
                          const isAffordable = (currentUser?.giftPoints || 0) >= gift.pointsPrice;
                          const currentRecipient = giftRecipientId || activeFriend?.id;
                          
                          const rarityGlows: Record<string, string> = {
                            "Commun": "border-slate-750 hover:border-slate-600 bg-slate-800/20 hover:bg-slate-800/40",
                            "Rare": "border-blue-900/50 hover:border-blue-700 bg-blue-950/10 hover:bg-blue-950/20 shadow-blue-900/5",
                            "Épique": "border-purple-900/50 hover:border-purple-700 bg-purple-950/10 hover:bg-purple-950/20 shadow-purple-900/5",
                            "Légendaire": "border-amber-900/50 hover:border-amber-700 bg-amber-950/10 hover:bg-amber-950/20 shadow-amber-900/5",
                            "Mythique": "border-rose-900/50 hover:border-rose-700 bg-rose-950/10 hover:bg-rose-950/20 shadow-rose-900/5"
                          };

                          const badgeColors: Record<string, string> = {
                            "Commun": "bg-slate-800 text-slate-300",
                            "Rare": "bg-blue-900/30 text-blue-300 border border-blue-800/30",
                            "Épique": "bg-purple-900/30 text-purple-300 border border-purple-800/30",
                            "Légendaire": "bg-amber-900/30 text-amber-300 border border-amber-800/30",
                            "Mythique": "bg-rose-900/30 text-rose-300 border border-rose-800/30"
                          };

                          return (
                            <div
                              key={gift.id}
                              className={`rounded-2xl p-4 border flex flex-col items-center justify-between text-center relative group overflow-hidden transition-all duration-300 select-none ${
                                rarityGlows[gift.rarity || "Commun"]
                              }`}
                            >
                              <div className="absolute -inset-10 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                              <span className={`absolute top-2.5 right-2.5 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${badgeColors[gift.rarity || "Commun"]}`}>
                                {gift.rarity || "Commun"}
                              </span>

                              <span className="text-4xl my-3 group-hover:scale-125 transition-transform duration-300 shrink-0 filter drop-shadow-md">
                                {gift.emoji || "🎁"}
                              </span>

                              <div className="w-full space-y-1">
                                <h4 className="text-xs font-black text-white truncate px-1">{gift.name}</h4>
                                <p className="text-[10px] text-slate-400 leading-tight font-medium line-clamp-2 px-1">
                                  {gift.description || "Objet cadeau interactif."}
                                </p>
                              </div>

                              <div className="mt-4 w-full pt-3 border-t border-slate-800/50 flex items-center justify-between gap-2 shrink-0">
                                <span className="text-[10.5px] font-black text-amber-400">
                                  🪙 {gift.pointsPrice}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleSendVirtualGift(gift.id)}
                                  disabled={!currentRecipient}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition active:scale-95 cursor-pointer ${
                                    currentRecipient
                                      ? "bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/10"
                                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                                  }`}
                                  title={currentRecipient ? `Envoyer` : "Veuillez choisir un destinataire"}
                                >
                                  Envoyer
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* TAB 2: BUY COINS PACKS */}
              {giftCatalogTab === "buy" && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-300 font-bold">
                      Besoin de pièces pour gâter vos proches ? Achetez des pièces instantanément avec votre solde de portefeuille.
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
                      Solde actuel du Portefeuille : <span className="text-emerald-400 font-black">{(currentUser?.wallet?.available || 0).toFixed(2)} {currentUser?.currency || "EUR"}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigate) {
                          setShowGiftCatalogModal(false);
                          onNavigate("wallet", "deposit");
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase text-[10px] px-4 py-2 rounded-xl transition cursor-pointer shadow-md active:scale-95 animate-pulse"
                    >
                      💳 Recharger mon portefeuille
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { packType: "pack_100", coins: 100, price: 1.00, label: "Pack Mini", desc: "Parfait pour offrir des coeurs ou des roses !" },
                      { packType: "pack_500", coins: 500, price: 5.00, label: "Pack Standard", desc: "Populaire pour de superbes animations de cadeaux." },
                      { packType: "pack_1000", coins: 1000, price: 10.00, label: "Pack Premium", desc: "Pour les vrais amateurs d'effets ultra premium 3D." },
                      { packType: "pack_5000", coins: 5000, price: 45.00, label: "Pack Royal", desc: "Valeur incroyable avec 10% de réduction incluse !" },
                      { packType: "pack_10000", coins: 10000, price: 80.00, label: "Pack Légendaire", desc: "Régnez sur la communauté avec le maximum de pièces !" }
                    ].map((pack) => {
                      const isAffordableWallet = (currentUser?.wallet?.available || 0) >= pack.price;
                      return (
                        <div key={pack.packType} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition duration-300">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[9.5px] font-black uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md">
                                {pack.label}
                              </span>
                              <span className="text-xs font-black text-white">
                                {pack.price.toFixed(2)} {currentUser?.currency || "EUR"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-2xl">🪙</span>
                              <p className="text-lg font-black text-amber-300">
                                {pack.coins.toLocaleString()} <span className="text-xs font-bold text-slate-400">Pièces</span>
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium leading-normal">
                              {pack.desc}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={purchasingPoints}
                            onClick={() => handleBuyPointsInteractive(pack.packType, pack.price)}
                            className={`w-full mt-4 py-2 rounded-xl font-black uppercase text-[10px] transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                              isAffordableWallet
                                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white border border-slate-700"
                            }`}
                          >
                            {purchasingPoints ? "Traitement..." : isAffordableWallet ? "Acheter instantanément" : "Acheter / Recharger"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: CONVERT EARNED POINTS TO WALLET CASH */}
              {giftCatalogTab === "withdraw" && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      💰 Convertir vos revenus de cadeaux
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Chaque fois qu'un utilisateur vous envoie un cadeau virtuel, vos points gagnés augmentent automatiquement ! Vous pouvez convertir ces points en argent réel utilisable directement dans votre portefeuille, puis le retirer.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase">Gains cumulés</p>
                        <p className="text-lg font-black text-emerald-400 mt-1">
                          💎 {currentUser?.giftPointsEarned?.toLocaleString() || "0"} <span className="text-xs font-bold text-slate-400">Pièces</span>
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase">Taux de conversion</p>
                        <p className="text-xs font-bold text-white mt-1">
                          100 Pièces = <span className="text-emerald-400 font-black">1.00 {currentUser?.currency || "EUR"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Tool Action */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h5 className="text-[11px] font-black uppercase text-slate-300 tracking-wider">Demander une conversion instantanée</h5>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wide block">Nombre de pièces à convertir :</label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="Ex: 500"
                          value={conversionPointsAmount}
                          onChange={(e) => setConversionPointsAmount(e.target.value)}
                          className="bg-slate-900 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl border border-slate-850 focus:border-emerald-500 outline-none flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setConversionPointsAmount(String(currentUser?.giftPointsEarned || 0))}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 text-[10px] font-black uppercase rounded-xl transition cursor-pointer"
                        >
                          Max
                        </button>
                      </div>
                      {conversionPointsAmount && !isNaN(parseInt(conversionPointsAmount)) && (
                        <p className="text-[10px] text-emerald-400 font-bold">
                          Vous recevrez : <span className="font-black">{(parseInt(conversionPointsAmount) * 0.01).toFixed(2)} {currentUser?.currency || "EUR"}</span> dans votre portefeuille !
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={convertingPoints}
                      onClick={handleConvertPointsInteractive}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase py-2.5 rounded-xl text-xs tracking-wider transition cursor-pointer active:scale-95 shadow-md shadow-emerald-600/10"
                    >
                      {convertingPoints ? "Traitement..." : "Convertir en argent de portefeuille"}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-[10px] font-bold text-slate-500 shrink-0">
              Les transferts de cadeaux et conversions de pièces sont immédiats. En cas de litige, contactez l'assistance Yaamaa.
            </div>

          </div>
        </div>
      )}

      {/* SEARCH & ADD FRIEND MODAL OVERLAY */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="search_friend_modal_overlay">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">Ajouter un ami</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Recherchez un membre de la plateforme par nom ou numéro.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSearchFriend} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Identifiant, Nom ou Numéro de Téléphone</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Celine ou +22501020304"
                    className="flex-1 bg-slate-50 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 transition"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl text-xs font-black uppercase transition active:scale-95"
                  >
                    Chercher
                  </button>
                </div>
              </div>

              {searchError && (
                <p className="text-[11px] text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">{searchError}</p>
              )}

              {searchSuccessMsg && (
                <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">{searchSuccessMsg}</p>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Résultats de recherche ({searchResults.length})</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {searchResults.map(resUser => {
                      const isFriend = friends.some(f => f.id === resUser.id);
                      const isPending = pendingRequests.some(r => r.senderId === currentUser.id && r.receiverId === resUser.id) || sentRequests.some(r => r.senderId === currentUser.id && r.receiverId === resUser.id);
                      return (
                        <div key={resUser.id} className="p-3.5 bg-slate-50 rounded-2xl border border-gray-150 flex flex-col gap-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 truncate min-w-0 cursor-pointer" onClick={() => { if (onViewProfile) onViewProfile(resUser.id); setShowSearchModal(false); }}>
                              <img src={resUser.avatar} className="h-10 w-10 rounded-xl object-cover border" />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-xs text-gray-900">@{resUser.username}</p>
                                  {resUser.merchantNumber && <MerchantBadge tier={resUser.merchantPackType} size="xs" />}
                                </div>
                                <p className="text-[10px] text-gray-600 truncate">{resUser.name}</p>
                                {resUser.merchantNumber && (
                                  <p className="text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    Numéro Marchand: {resUser.merchantNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-200/60 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewProfile) onViewProfile(resUser.id);
                                setShowSearchModal(false);
                              }}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              Profil
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFriendId(resUser.id);
                                setShowSearchModal(false);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                            >
                              Écrire
                            </button>
                            {isFriend ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold">Ami</span>
                            ) : isPending ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold">En attente</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddSearchedFriend(resUser.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg active:scale-95 transition cursor-pointer shadow-xs"
                              >
                                Ajouter contact
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY CREATION MODAL OVERLAY */}
      {isCreatingCommunity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="create_group_modal_overlay">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusSquare className="h-5 w-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">Créer un Groupe</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Formez un nouveau salon de discussion et d'entraide.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCommunity(false);
                  setSelectedFriendsForNewComm([]);
                }}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[9.5px] font-extrabold uppercase text-gray-500 mb-1">Nom du Groupe *</label>
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="ex: Les Leaders Bénin 🇧🇯"
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold focus:ring-0 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-extrabold uppercase text-gray-500 mb-1">Objectif / Description</label>
                <textarea
                  rows={2}
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="Entraide, conseils, etc..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold focus:ring-0 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-extrabold uppercase text-gray-500 mb-1">URL Avatar / Image du Groupe</label>
                <input
                  type="url"
                  value={newCommAvatar}
                  onChange={(e) => setNewCommAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold focus:ring-0 text-[10.5px]"
                />
              </div>

              {/* ADD FRIENDS CHECKLIST (WhatsApp direct member addition) */}
              <div>
                <label className="block text-[9.5px] font-extrabold uppercase text-gray-500 mb-1.5">Ajouter des Amis Directement</label>
                {friends.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-dashed border-gray-200 text-center text-[10px] text-gray-400 rounded-xl">
                    Aucun ami disponible à cocher. Vous devez d'abord ajouter des amis.
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1.5">
                    {friends.map(friend => {
                      const isChecked = selectedFriendsForNewComm.includes(friend.id);
                      return (
                        <label key={friend.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded-lg transition">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFriendForNewComm(friend.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex items-center gap-1.5 truncate">
                            <img src={friend.avatar} className="h-5 w-5 rounded object-cover" />
                            <span className="font-bold text-[11px] text-gray-700">@{friend.username}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl uppercase tracking-wider text-[10px] shadow-xs cursor-pointer text-center transition"
              >
                Créer et Inviter ({selectedFriendsForNewComm.length})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP DETAILS MODAL OVERLAY */}
      {showEditGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit_group_modal_overlay">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">Modifier le Groupe</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Modifiez le nom, la description ou la photo du groupe.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditGroupModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
              {editGroupError && (
                <p className="text-[11px] text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">{editGroupError}</p>
              )}

              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Nom du groupe</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 transition"
                  placeholder="Ex: Graphistes Pro"
                />
              </div>

              {/* Group Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Description</label>
                <textarea
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 transition resize-none"
                  rows={3}
                  placeholder="Description du salon..."
                />
              </div>

              {/* Group Photo Link / Upload */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Photo du groupe</label>
                
                {/* Preview */}
                <div className="flex items-center gap-3">
                  <img src={editGroupAvatar} className="h-14 w-14 rounded-2xl object-cover border" />
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-bold text-amber-700 block cursor-pointer bg-amber-50 hover:bg-amber-100 py-2 px-3 rounded-xl text-center border border-amber-150">
                      📁 Importer depuis ma galerie
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setEditGroupAvatar(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-black text-slate-400">Ou coller l'URL d'une image</span>
                  <input
                    type="text"
                    value={editGroupAvatar}
                    onChange={(e) => setEditGroupAvatar(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-amber-400 focus:bg-white focus:outline-none rounded-xl px-4 py-2 text-[10px] font-mono text-gray-800 transition"
                    placeholder="URL de l'image..."
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditGroupModal(false)}
                  className="flex-1 bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer active:scale-95"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* CALL SELECTION MODAL */}
      {showCallTypeModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="call_type_modal">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-600 animate-pulse" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Lancer un appel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCallTypeModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-gray-500 font-bold">
                Souhaitez-vous lancer un appel vocal ou vidéo avec <span className="text-emerald-600">@{activeFriend?.username}</span> ?
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartCall("voice")}
                  className="p-4 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-200/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group active:scale-95"
                >
                  <span className="p-3 bg-emerald-100 text-emerald-700 rounded-full group-hover:bg-emerald-200 transition">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-black text-gray-800">Appel Vocal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartCall("video")}
                  className="p-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group active:scale-95"
                >
                  <span className="p-3 bg-blue-100 text-blue-700 rounded-full group-hover:bg-blue-200 transition">
                    <Video className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-black text-gray-800">Appel Vidéo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CALL OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col justify-between p-4 md:p-6 overflow-hidden animate-fade-in text-white" id="active_call_overlay">
          
          {/* Header containing call metadata, conference status & Invite Button */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                  <Phone className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <div>
                {(() => {
                  const callMins = Math.floor(callDuration / 60);
                  const callSecs = callDuration % 60;
                  const durationStr = `${callMins.toString().padStart(2, "0")}:${callSecs.toString().padStart(2, "0")}`;
                  return (
                    <>
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-300">
                        {activeCall.status === "ringing" ? "Lancement de la réunion..." : `Conférence Active • ${durationStr}`}
                      </h4>
                      <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                        {(activeCall.participants || []).length} / 10 Participants
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Gift Button in Call */}
              {activeCall.status === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    const opponentId = activeCall.callerId === currentUser.id ? activeCall.receiverId : activeCall.callerId;
                    setGiftRecipientId(opponentId);
                    setGiftCatalogTab("send");
                    setShowGiftCatalogModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-lg shadow-pink-500/20"
                  id="btn_gift_in_call"
                  title="Envoyer un cadeau au correspondant"
                >
                  <Gift className="h-3.5 w-3.5 animate-pulse text-white" />
                  Cadeau 🎁
                </button>
              )}

              {/* Invite button */}
              {activeCall.status === "active" && (
                <button
                  type="button"
                  onClick={() => setShowInviteListModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/10"
                  id="btn_invite_friends_to_call"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Inviter des amis
                </button>
              )}

              {/* Status Badge */}
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span>Son: {isSpeakerOn ? "Haut-Parleur Actif 🔊" : "Coupe-Son 🔇"}</span>
              </div>
            </div>
          </div>

          {/* Central Area: Grid of Participants */}
          <div className="flex-1 my-4 flex items-center justify-center relative overflow-y-auto">
            {activeCall.status === "ringing" && activeCall.callerId === currentUser.id ? (
              // Ringing state interface (waiting for first responder)
              <div className="flex flex-col items-center gap-6 text-center animate-pulse py-10">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl animate-ping"></div>
                  <img
                    src={usersList.find(u => u.id === activeCall.receiverId)?.avatar || currentUser.avatar}
                    alt="Ringing avatar"
                    className="h-28 w-28 rounded-full object-cover border-4 border-slate-800 relative z-10 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Appel en cours...</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {callStatusMessage || `Connexion en cours avec @${usersList.find(u => u.id === activeCall.receiverId)?.username || "Correspondant"}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full text-[10px] text-slate-400 font-mono">
                  <span>Sécurisé de bout en bout</span>
                </div>
              </div>
            ) : (
              // Active Call (Pinned Layout: Creator/Host at the top, others side-by-side below)
              <div className="w-full h-full flex flex-col gap-4 p-2 max-w-5xl overflow-y-auto relative">
                {isCallOnHold && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-35 flex flex-col items-center justify-center text-center p-6 gap-3 rounded-3xl">
                    <div className="h-16 w-16 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-500 flex items-center justify-center animate-bounce">
                      <Pause className="h-8 w-8 stroke-[2.5]" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Appel en attente</h3>
                    <p className="text-xs text-slate-400 max-w-xs font-bold leading-relaxed">
                      L'appel a été mis en attente. Cliquez sur le bouton "Lecture" en bas pour reprendre la conversation.
                    </p>
                  </div>
                )}
                {(() => {
                  const callParts = activeCall.participants || [
                    {
                      userId: activeCall.callerId,
                      username: usersList.find(u => u.id === activeCall.callerId)?.username || "Organisateur",
                      name: usersList.find(u => u.id === activeCall.callerId)?.name || "Organisateur",
                      avatar: usersList.find(u => u.id === activeCall.callerId)?.avatar || "",
                      cameraOn: activeCall.callerCameraOn,
                      micOn: !isMuted,
                      facingMode: activeCall.callerFacingMode,
                      isMutedByHost: false
                    },
                    {
                      userId: activeCall.receiverId,
                      username: usersList.find(u => u.id === activeCall.receiverId)?.username || "Participant",
                      name: usersList.find(u => u.id === activeCall.receiverId)?.name || "Participant",
                      avatar: usersList.find(u => u.id === activeCall.receiverId)?.avatar || "",
                      cameraOn: activeCall.receiverCameraOn,
                      micOn: true,
                      facingMode: activeCall.receiverFacingMode,
                      isMutedByHost: false
                    }
                  ];
                  const hostPart = callParts.find(p => p.userId === activeCall.callerId) || callParts[0];
                  const otherParts = callParts.filter(p => p.userId !== hostPart.userId);

                  const renderParticipantCard = (part: typeof hostPart, isLarge: boolean) => {
                    const isMe = part.userId === currentUser.id;
                    const isHost = activeCall.callerId === currentUser.id;
                    const isThisPartHost = activeCall.callerId === part.userId;

                    return (
                      <div 
                        key={part.userId} 
                        className={`relative rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden ${
                          isLarge ? "h-56 md:h-72 w-full" : "h-36 md:h-44"
                        } flex flex-col justify-between shadow-lg group transition hover:border-slate-700`}
                      >
                        {/* Video / Camera feed or Avatar placeholder */}
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950">
                          {activeCall.type === "video" && part.cameraOn ? (
                            isMe ? (
                              // Local stream is strictly MUTED to prevent echo feedback loop
                              <video
                                ref={callVideoLocalRef}
                                autoPlay
                                playsInline
                                muted={true}
                                className="w-full h-full object-cover transform scale-x-[-1]"
                              />
                            ) : (
                              // Simulated remote feed with live CSS pulse and noise waves
                              <div className="absolute inset-0 w-full h-full bg-slate-900/90 flex flex-col items-center justify-center gap-3">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-slate-950/30"></div>
                                <img
                                  src={part.avatar}
                                  alt={part.name}
                                  className={`${isLarge ? "h-20 w-20" : "h-12 w-12"} rounded-full object-cover border-2 border-emerald-500 animate-pulse relative z-10`}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5 z-20">
                                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                                  <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400">FLUX SIMULÉ HD</span>
                                </div>
                              </div>
                            )
                          ) : (
                            // Voice Call or Camera Off Mode: Beautiful audio ripples
                            <div className="flex flex-col items-center gap-3 relative z-10">
                              <div className="relative">
                                <div className={`absolute -inset-2 bg-emerald-500/10 rounded-full blur-md ${part.micOn && !part.isMutedByHost ? "animate-pulse" : ""}`}></div>
                                <img
                                  src={part.avatar}
                                  alt={part.name}
                                  className={`${isLarge ? "h-24 w-24" : "h-14 w-14"} rounded-full object-cover border-2 ${isMe ? "border-emerald-500" : "border-slate-700"} relative z-10`}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {part.micOn && !part.isMutedByHost ? (
                                <div className="flex items-center gap-1 justify-center h-4">
                                  <div className="h-2 w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                                  <div className="h-3 w-0.5 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                  <div className="h-4 w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                  <div className="h-2 w-0.5 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Micro Coupé
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Header overlay: participant name, badge & Admin operations */}
                        <div className="relative z-20 p-2.5 flex items-center justify-between bg-gradient-to-b from-slate-950/85 to-transparent">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-white truncate max-w-[120px] bg-slate-950/60 px-2 py-0.5 rounded-lg">
                              {isMe ? "Moi" : part.name}
                            </span>
                            {isThisPartHost && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md animate-pulse">
                                Hôte / Organisateur
                              </span>
                            )}
                          </div>

                          {/* Admin / Host controls to mute/kick others */}
                          {isHost && !isMe && (
                            <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => handleHostAction(part.userId, "toggle-mute")}
                                className={`p-1.5 rounded-lg transition cursor-pointer text-xs ${
                                  part.isMutedByHost 
                                    ? "bg-rose-500 text-white" 
                                    : "bg-slate-800/90 hover:bg-slate-700 hover:text-emerald-400 text-slate-300"
                                }`}
                                title={part.isMutedByHost ? "Rétablir le micro" : "Désactiver le micro du participant"}
                              >
                                {part.isMutedByHost ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHostAction(part.userId, "kick")}
                                className="p-1.5 bg-rose-600/90 hover:bg-rose-600 rounded-lg text-white transition cursor-pointer"
                                title="Retirer cet ami du meeting"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Footer overlay: quick self-toggles, camera facing, etc */}
                        <div className="relative z-20 p-2.5 flex items-end justify-between bg-gradient-to-t from-slate-950/85 to-transparent">
                          <div className="text-[9px] text-slate-400 font-mono">
                            @{part.username}
                          </div>

                          {/* Quick actions for self (click on card elements or bottom) */}
                          {isMe && (
                            <div className="flex items-center gap-1.5">
                              {/* Selfie/Rear swap button on local panel */}
                              {activeCall.type === "video" && (
                                <button
                                  type="button"
                                  onClick={handleToggleCameraRotation}
                                  className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 rounded-lg transition cursor-pointer text-xs flex items-center justify-center border border-slate-700"
                                  title="Changer Selfie/Arrière"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Camera Toggle on local panel */}
                              {activeCall.type === "video" && (
                                <button
                                  type="button"
                                  onClick={handleToggleCameraOnOff}
                                  className={`p-1.5 rounded-lg transition cursor-pointer text-xs ${
                                    cameraEnabled 
                                      ? "bg-slate-800/90 hover:bg-slate-700 text-white" 
                                      : "bg-rose-500/45 text-rose-300 border border-rose-500/50"
                                  }`}
                                  title={cameraEnabled ? "Éteindre Caméra" : "Allumer Caméra"}
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Mic Toggle on local panel */}
                              <button
                                type="button"
                                onClick={handleToggleMic}
                                className={`p-1.5 rounded-lg transition cursor-pointer text-xs ${
                                  !isMuted 
                                    ? "bg-slate-800/90 hover:bg-slate-700 text-white" 
                                    : "bg-rose-500/45 text-rose-300 border border-rose-500/50"
                                }`}
                                title={isMuted ? "Activer le Micro" : "Couper le Micro"}
                              >
                                {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  };

                  return (
                    <div className="w-full flex-1 flex flex-col gap-4">
                      {/* Host Card at top */}
                      <div className="w-full">
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          Organisateur de l'appel
                        </p>
                        {renderParticipantCard(hostPart, true)}
                      </div>

                      {/* Side-by-side others below */}
                      {otherParts.length > 0 && (
                        <div className="w-full">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 px-1">
                            Participants Connectés ({otherParts.length})
                          </p>
                          <div className={`grid gap-3 ${
                            otherParts.length === 1 
                              ? "grid-cols-1" 
                              : otherParts.length === 2 
                                ? "grid-cols-2" 
                                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                          }`}>
                            {otherParts.map(part => renderParticipantCard(part, false))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Incoming call notice overlay */}
            {activeCall.status === "ringing" && activeCall.receiverId === currentUser.id && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-6">
                <div className="space-y-2">
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full animate-bounce tracking-wider">
                    Appel Entrant... 📞
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {usersList.find(u => u.id === activeCall.callerId)?.name || "Utilisateur"} vous appelle
                  </h3>
                  <p className="text-xs text-slate-400">
                    Type d'appel : <span className="font-black text-emerald-400 uppercase">{activeCall.type === "video" ? "Vidéo (Caméra activée)" : "Vocal"}</span>
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-500/25 cursor-pointer transition flex items-center gap-2"
                  >
                    <PhoneOff className="h-4 w-4" />
                    Refuser
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCall}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 cursor-pointer transition flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Accepter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls Area */}
          <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-800/60 mt-2">
            
            {/* Speaker / Haut-Parleur Switch Button (Désactiver ou mettre le haut-parleur) */}
            <button
              type="button"
              onClick={() => {
                setIsSpeakerOn(!isSpeakerOn);
                showToast(isSpeakerOn ? "Haut-parleur désactivé 🔇" : "Haut-parleur activé 🔊");
              }}
              className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 border flex items-center justify-center ${
                isSpeakerOn 
                  ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700" 
                  : "bg-rose-500/25 border-rose-500 text-rose-500"
              }`}
              title={isSpeakerOn ? "Désactiver le haut-parleur" : "Activer le haut-parleur"}
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Rotate Camera Switch Button (Pivoter la caméra en arrière/avant) */}
            {activeCall.type === "video" && activeCall.status === "active" && (
              <button
                type="button"
                onClick={handleToggleCameraRotation}
                className="p-4 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-white rounded-2xl transition cursor-pointer active:scale-95 border border-slate-700 flex items-center justify-center"
                title="Tourner la caméra (Selfie / Arrière)"
              >
                <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: "3s" }} />
              </button>
            )}

            {/* Camera Disable/Enable Toggle Button */}
            {activeCall.type === "video" && activeCall.status === "active" && (
              <button
                type="button"
                onClick={handleToggleCameraOnOff}
                className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 border flex items-center justify-center ${
                  cameraEnabled 
                    ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700" 
                    : "bg-rose-500/25 border-rose-500 text-rose-500"
                }`}
                title={cameraEnabled ? "Couper la caméra" : "Activer la caméra"}
              >
                <Camera className="h-5 w-5" />
              </button>
            )}

            {/* Mic Mute/Unmute Button */}
            {activeCall.status === "active" && (
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 border flex items-center justify-center ${
                  !isMuted 
                    ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700" 
                    : "bg-rose-500/25 border-rose-500 text-rose-500"
                }`}
                title={isMuted ? "Activer le micro" : "Couper le micro"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}

            {/* Toggle Hold / Mettre en attente */}
            {activeCall.status === "active" && (
              <button
                type="button"
                onClick={() => {
                  setIsCallOnHold(!isCallOnHold);
                  showToast(isCallOnHold ? "Appel repris ▶" : "Appel mis en attente ⏸");
                }}
                className={`p-4 rounded-2xl transition cursor-pointer active:scale-95 border flex items-center justify-center ${
                  !isCallOnHold 
                    ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700" 
                    : "bg-amber-500/25 border-amber-500 text-amber-500 animate-pulse"
                }`}
                title={isCallOnHold ? "Reprendre l'appel" : "Mettre l'appel en attente"}
              >
                {isCallOnHold ? <Play className="h-5 w-5 text-amber-400" /> : <Pause className="h-5 w-5" />}
              </button>
            )}

            {/* Invite Contacts to conference button */}
            {activeCall.status === "active" && (
              <button
                type="button"
                onClick={() => setShowInviteListModal(true)}
                className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center"
                title="Ajouter un ami à la conférence"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            )}

            {/* Hangup button (Couper l'appel) */}
            <button
              type="button"
              onClick={handleEndCall}
              className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition cursor-pointer active:scale-95 shadow-lg shadow-rose-600/30 flex items-center justify-center"
              title="Raccrocher"
              id="btn_hangup_call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* CONFERENCE CALL INVITE FRIENDS MODAL */}
      {showInviteListModal && activeCall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-fade-in" id="conference_invite_modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden text-white animate-scale-up">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-wider">Inviter à la Conférence</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteListModal(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-bold">
                  Aucun ami disponible pour être invité.
                </p>
              ) : (
                friends.map(friend => {
                  const isInCall = (activeCall.participants || []).some(p => p.userId === friend.id);
                  return (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-950 rounded-2xl border border-slate-800/60 transition">
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="h-9 w-9 rounded-full object-cover border border-slate-700"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-200">{friend.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">@{friend.username}</p>
                        </div>
                      </div>

                      {isInCall ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Connecté
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInviteToCall(friend.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Inviter
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInviteListModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
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
