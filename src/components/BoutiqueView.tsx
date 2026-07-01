import React, { useState } from "react";
import { 
  Store, 
  ShoppingBag, 
  Search, 
  Filter, 
  Tag, 
  Globe, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  Package, 
  Coins, 
  TrendingUp, 
  Eye, 
  ChevronRight, 
  Camera, 
  FileText,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ShoppingBag as CartIcon,
  Link as LinkIcon,
  MessageCircle,
  Send,
  Facebook,
  MoreVertical,
  Edit,
  Share2,
  Trash2
} from "lucide-react";
import { User, Shop, Product, Order, Dispute } from "../types";
import { ALL_COUNTRIES } from "../countries";
import { getRegionsForCountry, getCommunesForRegion } from "../locationData";

interface BoutiqueViewProps {
  currentUser: User | null;
  shops: Shop[];
  products: Product[];
  orders: Order[];
  disputes: Dispute[];
  syncPlatformData: () => Promise<void>;
  onNavigate: (view: string) => void;
  onTriggerKkiapayPayment?: (amount: number, payload: any) => void;
  onViewProfile?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
}

export default function BoutiqueView({
  currentUser,
  shops,
  products,
  orders,
  disputes,
  syncPlatformData,
  onNavigate,
  onTriggerKkiapayPayment,
  onViewProfile,
  onStartChat
}: BoutiqueViewProps) {
  // Navigation inside Boutique
  const [boutiqueTab, setBoutiqueTab] = useState<"marketplace" | "seller_dashboard" | "my_purchases">("marketplace");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCommune, setSelectedCommune] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popularity" | "price_asc" | "price_desc" | "date">("popularity");

  // Shop Creation Form State
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopCountry, setShopCountry] = useState(currentUser?.country || "Sénégal");
  const [shopRegion, setShopRegion] = useState("");
  const [shopCommune, setShopCommune] = useState("");
  const [shopCityOrVillage, setShopCityOrVillage] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [customCommune, setCustomCommune] = useState("");
  const [sellerContact, setSellerContact] = useState(currentUser?.phone || "");
  const [shopSuccess, setShopSuccess] = useState("");
  const [shopError, setShopError] = useState("");
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);

  // Shop Sharing State & Helpers
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShopShareUrl = (shopId: string) => {
    return `${window.location.origin}/boutique?shopId=${shopId}`;
  };

  const handleCopyLink = (shopId: string) => {
    const url = getShopShareUrl(shopId);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Product Creation Form State
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState<string>("physical");
  const [prodDescription, setProdDescription] = useState("");
  const [prodTargetCountries, setProdTargetCountries] = useState<string[]>(["Tous"]);
  const [prodCountryInput, setProdCountryInput] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodImageInput, setProdImageInput] = useState("");
  const [prodVideoUrl, setProdVideoUrl] = useState("");
  const [prodCourseLink, setProdCourseLink] = useState("");
  const [prodDownloadableFile, setProdDownloadableFile] = useState("");
  const [prodDownloadableFileName, setProdDownloadableFileName] = useState("");
  const [prodQuantity, setProdQuantity] = useState("10");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCurrency, setProdCurrency] = useState(currentUser?.currency || "XOF");
  const [prodShippingTime, setProdShippingTime] = useState("3-5 jours");
  const [prodTerms, setProdTerms] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [productError, setProductError] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // States for product edit/share
  const [activeProductMenuId, setActiveProductMenuId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [productSharedId, setProductSharedId] = useState<string | null>(null);
  const [prodShareCopied, setProdShareCopied] = useState(false);

  const getProductShareUrl = (productId: string) => {
    return `${window.location.origin}/boutique?productId=${productId}`;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: currentUser.id })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Erreur lors de la suppression du produit.");
        return;
      }
      alert("Produit supprimé avec succès.");
      await syncPlatformData();
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Problème de connexion lors de la suppression.");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editForm) return;
    
    if (!editForm.name || !editForm.price || !editForm.images || editForm.images.length === 0) {
      setEditError("Veuillez remplir les champs obligatoires (Nom, Prix, et au moins une image).");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await fetch(`/api/products/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: currentUser.id,
          ...editForm
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setEditError(errData.error || "Une erreur est survenue lors de la mise à jour.");
        setIsSubmittingEdit(false);
        return;
      }

      setEditSuccess("Votre produit a été mis à jour avec succès !");
      setTimeout(() => {
        setEditForm(null);
      }, 1500);
      await syncPlatformData();
    } catch (err) {
      console.error("Update product error:", err);
      setEditError("Problème de connexion lors de la mise à jour du produit.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramShopId = params.get("shopId");
    const paramProductId = params.get("productId");

    if (paramShopId) {
      const targetShop = shops.find(s => s.id === paramShopId);
      if (targetShop) {
        setSearchQuery(targetShop.name);
      }
    }

    if (paramProductId) {
      const targetProd = products.find(p => p.id === paramProductId);
      if (targetProd) {
        setBuyingProduct(targetProd);
        setBoutiqueTab("marketplace");
      }
    }
  }, [products, shops]);

  // Buy Checkout state
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone || "");
  const [buyerEmail, setBuyerEmail] = useState(currentUser?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("Wallet Taskora");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState("");
  const [orderError, setOrderError] = useState("");

  // Dispute creation state
  const [disputedOrder, setDisputedOrder] = useState<Order | null>(null);
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeRefundAmt, setDisputeRefundAmt] = useState("");
  const [disputeSuccess, setDisputeSuccess] = useState("");
  const [disputeError, setDisputeError] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Seller ship tracking state
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isShipping, setIsShipping] = useState(false);

  const myShop = shops.find(s => s.ownerId === currentUser?.id);
  const sellerProducts = products.filter(p => p.shopId === myShop?.id);
  const buyerOrders = orders.filter(o => o.buyerId === currentUser?.id);
  const myShopOrders = orders.filter(o => o.shopId === myShop?.id);

  // Sync / refresh button
  const [isReevaluating, setIsReevaluating] = useState(false);
  const triggerRefresh = async () => {
    setIsReevaluating(true);
    await syncPlatformData();
    setIsReevaluating(false);
  };

  // Create Shop handler
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShopError("Veuillez vous connecter pour créer une boutique.");
      return;
    }
    if (!shopName || !shopDescription || !sellerContact) {
      setShopError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setShopError("");
    setShopSuccess("");
    setIsSubmittingShop(true);

    try {
      const finalRegion = shopRegion === "Saisir manuellement..." ? customRegion : shopRegion;
      const finalCommune = shopCommune === "Saisir manuellement..." ? customCommune : shopCommune;

      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: currentUser.id,
          name: shopName,
          logo: shopLogo,
          description: shopDescription,
          country: shopCountry,
          region: finalRegion,
          commune: finalCommune,
          cityOrVillage: shopCityOrVillage,
          contactInfo: sellerContact
        })
      });

      if (res.ok) {
        setShopSuccess("Félicitations ! Votre boutique a été créée avec succès.");
        // clear Form
        setShopName("");
        setShopLogo("");
        setShopDescription("");
        setShopRegion("");
        setShopCommune("");
        setShopCityOrVillage("");
        setCustomRegion("");
        setCustomCommune("");
        await syncPlatformData();
      } else {
        const err = await res.json();
        setShopError(err.error || "Une erreur est survenue lors de la création.");
      }
    } catch {
      setShopError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmittingShop(false);
    }
  };

  // Create Product handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myShop || !currentUser) return;

    if (!prodName || !prodPrice || !prodDescription) {
      setProductError("Les informations de produit fondamentales sont obligatoires.");
      return;
    }

    if (prodImages.length === 0) {
      setProductError("Téléversement d'image obligatoire : Veuillez téléverser ou ajouter au moins une image de produit.");
      return;
    }

    setProductError("");
    setProductSuccess("");
    setIsSubmittingProduct(true);

    const targetCountries = prodTargetCountries.length > 0 ? prodTargetCountries : [myShop.country];

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: myShop.id,
          ownerId: currentUser.id,
          name: prodName,
          category: prodCategory,
          description: prodDescription,
          targetCountries,
          images: prodImages,
          videoUrl: prodVideoUrl,
          courseLink: prodCourseLink,
          downloadableFile: prodDownloadableFile,
          downloadableFileName: prodDownloadableFileName,
          quantityAvailable: parseInt(prodQuantity) || 0,
          price: parseFloat(prodPrice),
          currency: prodCurrency,
          shippingTime: prodShippingTime,
          termsOfSale: prodTerms
        })
      });

      if (res.ok) {
        setProductSuccess("Votre produit a été publié avec succès sur la Marketplace !");
        setProdName("");
        setProdDescription("");
        setProdImages([]);
        setProdVideoUrl("");
        setProdCourseLink("");
        setProdDownloadableFile("");
        setProdDownloadableFileName("");
        setProdPrice("");
        setProdTerms("");
        await syncPlatformData();
      } else {
        const err = await res.json();
        setProductError(err.error || "Impossible de publier le produit.");
      }
    } catch {
      setProductError("Problème de connexion réseau.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Add target country helper
  const addTargetCountry = () => {
    if (prodCountryInput.trim()) {
      setProdTargetCountries(prev => {
        const filtered = prev.filter(c => c !== "Tous" && c !== "");
        if (filtered.includes(prodCountryInput.trim())) return filtered;
        return [...filtered, prodCountryInput.trim()];
      });
      setProdCountryInput("");
    }
  };

  const removeTargetCountry = (country: string) => {
    setProdTargetCountries(prev => {
      const filtered = prev.filter(c => c !== country);
      return filtered.length === 0 ? ["Tous"] : filtered;
    });
  };

  // Add target image helper
  const addImageLink = () => {
    if (prodImageInput.trim()) {
      setProdImages(prev => [...prev, prodImageInput.trim()]);
      setProdImageInput("");
    }
  };

  const removeProductImage = (index: number) => {
    setProdImages(prev => prev.filter((_, i) => i !== index));
  };

  // Checkout purchase order
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingProduct || !currentUser) return;

    if (buyingProduct.category === "physical" && !shippingAddress) {
      setOrderError("L'adresse de livraison est requise pour les produits physiques.");
      return;
    }

    if (paymentMethod === "Wallet Taskora") {
      if (currentUser.wallet.available < (buyingProduct.price * orderQuantity)) {
        setOrderError("Le solde de votre Wallet Taskora est insuffisant pour finaliser cet achat.");
        return;
      }

      setOrderError("");
      setOrderSuccess("");
      setIsSubmittingOrder(true);

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: buyingProduct.id,
            quantity: orderQuantity,
            buyerId: currentUser.id,
            buyerUsername: currentUser.username,
            shippingAddress: buyingProduct.category === "physical" ? shippingAddress : "Livraison Digitale",
            phoneNumber: buyerPhone,
            email: buyerEmail,
            paymentMethod
          })
        });

        if (res.ok) {
          setOrderSuccess("Félicitations ! Votre achat a été enregistré. Vos fonds sont bloqués sécurisé en Escrow jusqu'à confirmation.");
          setShippingAddress("");
          setTimeout(() => {
            setBuyingProduct(null);
            setBoutiqueTab("my_purchases");
            setOrderSuccess("");
          }, 2200);
          await syncPlatformData();
        } else {
          const err = await res.json();
          setOrderError(err.error || "Une erreur est survenue lors de l'achat.");
        }
      } catch {
        setOrderError("Erreur réseau lors de la transaction.");
      } finally {
        setIsSubmittingOrder(false);
      }
    } else {
      // Direct external checkout via Kkiapay (Mobile money or card)
      if (onTriggerKkiapayPayment) {
        onTriggerKkiapayPayment(buyingProduct.price * orderQuantity, {
          productId: buyingProduct.id,
          quantity: orderQuantity,
          shippingAddress: buyingProduct.category === "physical" ? shippingAddress : "Livraison Digitale",
          phoneNumber: buyerPhone,
          email: buyerEmail
        });
        setBuyingProduct(null);
      } else {
        setOrderError("Le service de paiement Kkiapay n'est pas configuré.");
      }
    }
  };

  // Ship command handler
  const handleMarkShipped = async (orderId: string) => {
    if (!currentUser) return;
    setIsShipping(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: currentUser.id,
          trackingNumber: trackingNumber || "Colis expédié"
        })
      });

      if (res.ok) {
        setShippingOrderId(null);
        setTrackingNumber("");
        await syncPlatformData();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur de mise à jour");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setIsShipping(false);
    }
  };

  // Confirm receipt and release Escrow
  const handleConfirmReceipt = async (orderId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Confirmez-vous avoir reçu la commande conforme ? Cela va reverser immédiatement les fonds au vendeur.")) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: currentUser.id
        })
      });

      if (res.ok) {
        alert("Commande confirmée avec succès ! Les fonds ont été reversés de l'Escrow vers le solde disponible du vendeur.");
        await syncPlatformData();
      } else {
        const err = await res.json();
        alert(err.error || "Une anomalie s'est produite.");
      }
    } catch {
      alert("Problème d'accès internet.");
    }
  };

  // File dispute
  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputedOrder || !currentUser) return;

    if (!disputeDesc) {
      setDisputeError("Veuillez décrire le problème rencontré de manière précise.");
      return;
    }

    setDisputeError("");
    setDisputeSuccess("");
    setIsSubmittingDispute(true);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: disputedOrder.id,
          buyerId: currentUser.id,
          description: disputeDesc,
          images: [],
          reqRefundAmount: parseFloat(disputeRefundAmt) || disputedOrder.totalPrice
        })
      });

      if (res.ok) {
        setDisputeSuccess("Litige enregistré. Les administrateurs vont examiner votre dossier d'arbitrage sous 24h.");
        setDisputeDesc("");
        setDisputeRefundAmt("");
        setTimeout(() => {
          setDisputedOrder(null);
          setDisputeSuccess("");
        }, 2200);
        await syncPlatformData();
      } else {
        const err = await res.json();
        setDisputeError(err.error || "Problème d'arbitrage.");
      }
    } catch {
      setDisputeError("Erreur d'accès réseau.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const getProductCategoryLabel = (cat: string) => {
    switch (cat) {
      case "physical": return "Produit physique";
      case "digital": return "Produit digital";
      case "online_course": return "Formation en ligne";
      case "service": return "Service";
      case "software": return "Logiciel";
      case "ebook": return "E-book";
      default: return "Autres";
    }
  };

  // Filter products for catalog
  const filteredProducts = products.filter(prod => {
    if (prod.isBanned) return false;
    
    // Search query matched in name, desc, shopname
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.shopName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category match
    const matchesCategory = selectedCategory === "all" || prod.category === selectedCategory;

    // Target Country, Region & Commune matches (both shop location and targeted destinations)
    const prodShop = shops.find(s => s.id === prod.shopId);
    
    const matchesCountry = selectedCountry === "all" || 
                           (prodShop && prodShop.country.toLowerCase() === selectedCountry.toLowerCase()) ||
                           prod.targetCountries.some(c => c.toLowerCase() === selectedCountry.toLowerCase()) ||
                           prod.targetCountries.some(c => c.toLowerCase() === "tous");

    const matchesRegion = selectedRegion === "all" ||
                          (prodShop && prodShop.region && prodShop.region.toLowerCase() === selectedRegion.toLowerCase()) ||
                          (prod.targetRegions && prod.targetRegions.some(r => r.toLowerCase() === selectedRegion.toLowerCase())) ||
                          (prod.targetRegions && prod.targetRegions.some(r => r.toLowerCase() === "tous"));

    const matchesCommune = selectedCommune === "all" ||
                           (prodShop && prodShop.commune && prodShop.commune.toLowerCase() === selectedCommune.toLowerCase()) ||
                           (prod.targetCommunes && prod.targetCommunes.some(com => com.toLowerCase() === selectedCommune.toLowerCase())) ||
                           (prod.targetCommunes && prod.targetCommunes.some(com => com.toLowerCase() === "tous"));

    return matchesSearch && matchesCategory && matchesCountry && matchesRegion && matchesCommune;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.salesCount - a.salesCount; // popularity
  });

  // Seller metrics calculations
  const sellerRevenue = myShopOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const sellerPendingEscrow = myShopOrders
    .filter(o => o.status === "paid_escrow" || o.status === "shipped")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div id="boutique_wrapper_screen" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* BOUTIQUE HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-gray-950 flex items-center gap-2">
            <Store className="h-8 w-8 text-emerald-600" />
            Espace Boutique & Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Achetez des solutions directement, ou ouvrez votre propre échoppe pour monétiser vos compétences physiques ou digitales sous Escrow.
          </p>
        </div>

        {/* REFRESH/SYNC BLOCK AND SUB-MENUS */}
        <div className="flex items-center gap-2">
          <button 
            onClick={triggerRefresh}
            className="p-2 bg-gray-55/6 flex items-center justify-center text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isReevaluating ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setBoutiqueTab("marketplace")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                boutiqueTab === "marketplace" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Marketplace
            </button>
            <button
              onClick={() => setBoutiqueTab("seller_dashboard")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                boutiqueTab === "seller_dashboard" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              Ma Boutique (Vendeur)
            </button>
            <button
              onClick={() => setBoutiqueTab("my_purchases")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
                boutiqueTab === "my_purchases" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <CartIcon className="h-3.5 w-3.5" />
              Mes Achats
              {buyerOrders.filter(o => o.status === "shipped").length > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR / WARNING FOR GUEST USERS */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p>Mode Consultation uniquement.</p>
            <p className="text-gray-500 font-normal mt-1">Vous devez sélectionner un utilisateur de test dans le bandeau de navigation supérieur pour simuler des achats, publier des produits ou configurer votre boutique.</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. MARKETPLACE CATALOG VIEW                              */}
      {/* ======================================================== */}
      {boutiqueTab === "marketplace" && (
        <div className="space-y-6 animate-fade-in" id="marketplace_tab_container">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              
              {/* Query search input */}
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des produits physiques, e-books, cours, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Country tag filter */}
              <div className="w-full md:w-52 flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedRegion("all");
                    setSelectedCommune("all");
                  }}
                  className="bg-transparent border-none text-xs font-semibold text-gray-800 w-full focus:ring-0 cursor-pointer"
                >
                  <option value="all">Tous les Pays</option>
                  {ALL_COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Region/Department filter (shown only if a specific country is selected) */}
              {selectedCountry !== "all" && getRegionsForCountry(selectedCountry).length > 0 && (
                <div className="w-full md:w-52 flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-1.5 animate-fade-in">
                  <span className="text-xs text-gray-400 font-bold">Région:</span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedCommune("all");
                    }}
                    className="bg-transparent border-none text-xs font-semibold text-emerald-800 w-full focus:ring-0 cursor-pointer"
                  >
                    <option value="all">Toutes</option>
                    {getRegionsForCountry(selectedCountry).filter(r => r !== "Saisir manuellement...").map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Commune filter (shown only if a specific region is selected) */}
              {selectedCountry !== "all" && selectedRegion !== "all" && getCommunesForRegion(selectedCountry, selectedRegion).length > 0 && (
                <div className="w-full md:w-52 flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-1.5 animate-fade-in">
                  <span className="text-xs text-gray-400 font-bold">Commune:</span>
                  <select
                    value={selectedCommune}
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold text-emerald-800 w-full focus:ring-0 cursor-pointer"
                  >
                    <option value="all">Toutes</option>
                    {getCommunesForRegion(selectedCountry, selectedRegion).filter(c => c !== "Saisir manuellement...").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sorting filters */}
              <div className="w-full md:w-56 flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-semibold text-gray-800 w-full focus:ring-0 cursor-pointer"
                >
                  <option value="popularity">Trier par Popularité</option>
                  <option value="price_asc">Prix : Croissant</option>
                  <option value="price_desc">Prix : Décroissant</option>
                  <option value="date">Nouveautés</option>
                </select>
              </div>

            </div>

            {/* Category tag badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Catégories :</span>
              {[
                { key: "all", label: "Tous les produits" },
                { key: "physical", label: "📦 Produits Physiques" },
                { key: "digital", label: "💾 Produits Digitaux" },
                { key: "online_course", label: "🎓 Formations en Ligne" },
                { key: "service", label: "🛠️ Services Pro" },
                { key: "software", label: "💻 Logiciels" },
                { key: "ebook", label: "📚 E-books" },
                { key: "other", label: "⚡ Autres" }
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    selectedCategory === cat.key 
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/10" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* CATALOG GRID */}
          {sortedProducts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-4">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-950">Aucun produit ne correspond à vos filtres</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Recherchez d'autres termes ou modifiez vos préférences de tri et de géolocalisation.</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSelectedCountry("all"); }}
                className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-lg hover:bg-emerald-100 transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div id="products_catalog_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-transform hover:-translate-y-0.5 flex flex-col group relative"
                  id={`product_card_${prod.id}`}
                >
                  
                  {/* Category tag over image */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                    <span className="bg-gray-900/80 backdrop-blur-md text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md">
                      {getProductCategoryLabel(prod.category)}
                    </span>
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5" />
                      {prod.targetCountries.join(", ")}
                    </span>
                  </div>

                  {/* Product card graphics illustration container */}
                  <div className="relative h-48 bg-gray-50 overflow-hidden">
                    <img 
                      src={prod.images[0] || "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=350&auto=format&fit=crop"} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {prod.quantityAvailable <= 5 && prod.category === "physical" && (
                      <span className="absolute bottom-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md animate-pulse">
                        SStock faible ! ({prod.quantityAvailable})
                      </span>
                    )}
                  </div>

                  {/* Text Details body */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      {(() => {
                        const s = shops.find(item => item.id === prod.shopId);
                        return (
                          <>
                            <p 
                              onClick={() => s && onViewProfile && onViewProfile(s.ownerId)}
                              className="font-mono text-[10px] text-gray-400 font-bold flex items-center gap-1 cursor-pointer hover:text-emerald-600 transition group/shop"
                            >
                               Boutique : <span className="text-gray-700 font-semibold group-hover/shop:underline group-hover/shop:text-emerald-650">@{prod.shopName} (Voir Profil 👤)</span>
                            </p>

                            {s && (
                              <div className="flex flex-col gap-0.5 mt-1 bg-emerald-50/20 p-2 rounded-xl border border-emerald-100/30">
                                <p className="font-mono text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                  📍 {s.country}{s.region ? ` • ${s.region}` : ""}{s.commune ? ` • ${s.commune}` : ""}
                                </p>
                                {s.cityOrVillage && (
                                  <p className="text-[9px] text-gray-500 font-medium ml-3.5">
                                    Localité : {s.cityOrVillage}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      <h4 className="text-sm font-bold text-gray-950 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                        {prod.name}
                      </h4>

                      <p className="text-xs text-gray-500 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-zinc-400 text-[10px] block">PRIX UNITAIRE</span>
                        <span className="text-lg font-black text-gray-900">
                          {prod.price.toLocaleString()} {prod.currency}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block font-mono">VENTES : {prod.salesCount}</span>
                        <span className="text-xs font-bold text-amber-500">★ {prod.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuyingProduct(prod)}
                        className="flex-1 bg-gray-950 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Acheter
                      </button>
                      <button
                        onClick={() => {
                          if (onStartChat) {
                            onStartChat(prod.ownerId);
                          }
                        }}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-indigo-100"
                        title="Discuter avec le vendeur"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-indigo-600" />
                        Discuter
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ======================================================== */}
      {/* 2. MA BOUTIQUE (SELLER WINDOW)                            */}
      {/* ======================================================== */}
      {boutiqueTab === "seller_dashboard" && (
        <div className="space-y-8 animate-fade-in" id="seller_dashboard_container">
          
          {/* USER DOES NOT OWN A SHOP YET -> SHOW REGISTRATION FORM */}
          {!myShop ? (
            <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
                  <Store className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-heading font-black text-gray-950">Créer une boutique en ligne</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Vendez des fichiers digitaux, e-books, cours en ligne ou produits physiques à la communauté Taskora avec notre système d'Escrow garanti.</p>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4">
                
                {/* Shop Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Nom de la boutique *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AfriqTech Solutions"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Photo de profil / Logo de la boutique *</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                    <div className="h-16 w-16 bg-gray-200 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-300 relative">
                      {shopLogo ? (
                        <img src={shopLogo} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition inline-block">
                          <span>Téléverser une image</span>
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
                                    setShopLogo(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {shopLogo && (
                          <button
                            type="button"
                            onClick={() => setShopLogo("")}
                            className="px-2.5 py-1.5 bg-gray-200 hover:bg-rose-100 hover:text-rose-700 rounded-xl text-[10px] font-bold text-gray-600 transition"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">Formats acceptés : PNG, JPG, GIF. Max 5Mo.</p>
                      
                      <div className="relative pt-1">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">Ou coller une URL d'image :</span>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo..."
                          value={shopLogo.startsWith("data:") ? "" : shopLogo}
                          onChange={(e) => setShopLogo(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] text-gray-950 focus:outline-none focus:border-emerald-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Country and Geolocation selectors */}
                <div className="space-y-4 border-t border-b border-gray-100 py-4 my-2" id="shop_geo_section">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="h-4 w-4" /> Localisation de la boutique (Suggestion de produits)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 block">Pays d'origine *</label>
                      <select
                        value={shopCountry}
                        onChange={(e) => {
                          const c = e.target.value;
                          setShopCountry(c);
                          const regions = getRegionsForCountry(c);
                          const firstRegion = regions[0] || "";
                          setShopRegion(firstRegion);
                          if (firstRegion) {
                            const communes = getCommunesForRegion(c, firstRegion);
                            setShopCommune(communes[0] || "");
                          } else {
                            setShopCommune("");
                          }
                        }}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white focus:outline-none focus:border-emerald-600"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name} ({c.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Region / Department select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 block">Département / Région / Province *</label>
                      <select
                        value={shopRegion || (getRegionsForCountry(shopCountry)[0] || "")}
                        onChange={(e) => {
                          const r = e.target.value;
                          setShopRegion(r);
                          const communes = getCommunesForRegion(shopCountry, r);
                          setShopCommune(communes[0] || "");
                        }}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">-- Sélectionnez --</option>
                        {getRegionsForCountry(shopCountry).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Manual Region Input if "Saisir manuellement..." is chosen */}
                  {(shopRegion === "Saisir manuellement...") && (
                    <div className="space-y-1.5 animate-fade-in" id="manual_region_field">
                      <label className="text-[11px] font-bold text-gray-700 block">Saisir le nom du Département / Région *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Département de l'Atlantique"
                        value={customRegion}
                        onChange={(e) => setCustomRegion(e.target.value)}
                        className="w-full px-3.5 py-2 border border-emerald-300 bg-emerald-50/10 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Commune select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 block">Commune / Arrondissement *</label>
                      <select
                        value={shopCommune || (getCommunesForRegion(shopCountry, shopRegion || getRegionsForCountry(shopCountry)[0] || "")[0] || "")}
                        onChange={(e) => setShopCommune(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">-- Sélectionnez --</option>
                        {getCommunesForRegion(shopCountry, shopRegion || getRegionsForCountry(shopCountry)[0] || "").map((com) => (
                          <option key={com} value={com}>
                            {com}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ville / Village / Quartier text input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 block">Ville, Village ou Quartier (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: Quartier Fidjrossè / Village Agbato"
                        value={shopCityOrVillage}
                        onChange={(e) => setShopCityOrVillage(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Manual Commune Input if "Saisir manuellement..." is chosen */}
                  {(shopCommune === "Saisir manuellement...") && (
                    <div className="space-y-1.5 animate-fade-in" id="manual_commune_field">
                      <label className="text-[11px] font-bold text-gray-700 block">Saisir le nom de la Commune *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Commune d'Abomey-Calavi"
                        value={customCommune}
                        onChange={(e) => setCustomCommune(e.target.value)}
                        className="w-full px-3.5 py-2 border border-emerald-300 bg-emerald-50/10 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Seller Contact Info */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block font-heading">Coordonnées professionnelles du vendeur *</label>
                    <input
                      type="text"
                      required
                      placeholder="Téléphone WhatsApp ou Email pour la vente"
                      value={sellerContact}
                      onChange={(e) => setSellerContact(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Description de la boutique *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Décrivez vos offres, vos délais de livraison et vos spécialités..."
                    value={shopDescription}
                    onChange={(e) => setShopDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Alerts */}
                {shopError && (
                  <p className="text-xs text-rose-600 font-bold block">{shopError}</p>
                )}
                {shopSuccess && (
                  <p className="text-xs text-emerald-600 font-bold block">{shopSuccess}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingShop}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingShop ? "Création en cours..." : "Créer ma boutique d'e-commerce"}
                </button>
              </form>
            </div>
          ) : (
            
            // SELLER DASHBOARD PANEL
            <div className="space-y-8 animate-fade-in">
              
              {/* BRAND HEADER BAR */}
              <div className="bg-gradient-to-r from-emerald-650 to-teal-600 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={myShop.logo || "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=150&auto=format&fit=crop"} 
                    alt={myShop.name} 
                    className="h-16 w-16 rounded-2xl border-2 border-white/20 object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-black">{myShop.name}</h3>
                    <p className="text-xs text-emerald-100/80 mt-1 flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" /> Origin : {myShop.country} • Contact : {myShop.contactInfo}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setShowShareOptions(!showShareOptions)}
                        className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                        Partager ma boutique
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 text-xs">
                  <span className="block text-[10px] text-emerald-100 font-mono tracking-wider uppercase">Vendeur Verified</span>
                  <span className="font-bold">@{currentUser?.username}</span>
                </div>
              </div>

              {/* SHARE OPTIONS PANEL */}
              {showShareOptions && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-3 animate-fade-in font-sans">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      Partager votre boutique sur les réseaux sociaux
                    </h4>
                    <button 
                      onClick={() => setShowShareOptions(false)}
                      className="text-emerald-800 hover:text-emerald-950 text-xs font-bold font-mono"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyLink(myShop.id)}
                      className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                    >
                      <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
                      {copied ? "Lien copié !" : "Copier le lien"}
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Découvrez ma boutique "${myShop.name}" sur Taskora ! Retrouvez nos produits de qualité ici : ` + getShopShareUrl(myShop.id))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba56] text-white text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>

                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(getShopShareUrl(myShop.id))}&text=${encodeURIComponent(`Découvrez ma boutique "${myShop.name}" sur Taskora !`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0088cc] hover:bg-[#0077b3] text-white text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Telegram
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShopShareUrl(myShop.id))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                      Facebook
                    </a>
                  </div>
                  <p className="text-[10px] text-emerald-800">Partagez ce lien unique avec vos clients pour leur permettre de commander directement chez vous en toute sécurité !</p>
                </div>
              )}

              {/* STATS TILES ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">PRODUITS PUBLIÉS</span>
                    <span className="text-lg font-black text-gray-950">{sellerProducts.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-50 text-blue-650 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-mono">VENTES CLOSES</span>
                    <span className="text-lg font-black text-gray-950">
                      {myShopOrders.filter(o => o.status === "completed").length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">REVENUS GÉNÉRÉS</span>
                    <span className="text-lg font-black text-gray-950">
                      {sellerRevenue.toLocaleString()} {currentUser?.currency}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">ESCROW BLOQUÉ</span>
                    <span className="text-lg font-black text-gray-950">
                      {sellerPendingEscrow.toLocaleString()} {currentUser?.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* CORE DASHBOARD GRID: ADD PRODUCT & ORDERS INFLOW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COLUMN LEFT: ADD PRODUCT FORM (4 cols) */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <h4 className="text-sm font-black text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-55/10">
                    <PlusCircle className="h-4.5 w-4.5 text-emerald-600" />
                    Publier un nouveau produit
                  </h4>

                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Nom du produit *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Formation Excel Automatisation"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Catégorie du produit</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                      >
                        <option value="physical">Produit physique</option>
                        <option value="digital">Produit digital</option>
                        <option value="online_course">Formation en ligne</option>
                        <option value="service">Service Professionnel</option>
                        <option value="software">Logiciel / Code</option>
                        <option value="ebook">E-book</option>
                        <option value="other">Autres</option>
                      </select>
                    </div>

                    {/* Quantity & Unit Price Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">Quantité disponible</label>
                        <input
                          type="number"
                          value={prodQuantity}
                          onChange={(e) => setProdQuantity(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block font-heading">Prix unitaire *</label>
                        <input
                          type="number"
                          required
                          placeholder="Ex: 5000"
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Currency & target countries input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">Devise acceptée</label>
                        <select
                          value={prodCurrency}
                          onChange={(e) => setProdCurrency(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                        >
                          <option value="XOF">XOF (Franc CFA)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="CAD">CAD ($)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block font-heading">Pays de publication du produit</label>
                        <div className="flex gap-1.5">
                          <select
                            value={prodCountryInput}
                            onChange={(e) => {
                              const country = e.target.value;
                              if (country) {
                                setProdTargetCountries(prev => {
                                  const filtered = prev.filter(c => c !== "Tous" && c !== "");
                                  if (filtered.includes(country)) return filtered;
                                  return [...filtered, country];
                                });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                          >
                            <option value="">-- Sélectionner un pays --</option>
                            <option value="Tous">Tous les pays</option>
                            {ALL_COUNTRIES.map(c => (
                              <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Selected countries badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {prodTargetCountries.map(c => (
                            <span 
                              key={c}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100"
                            >
                              {c}
                              {c !== "Tous" && (
                                <button
                                  type="button"
                                  onClick={() => removeTargetCountry(c)}
                                  className="text-emerald-500 hover:text-emerald-700 font-extrabold"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Image Upload of the product (Televersement Obligatoire) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">Images du produit * (Au moins une requise)</label>
                      
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition relative bg-gray-50/50">
                        <label className="cursor-pointer space-y-1 block">
                          <Camera className="h-6 w-6 mx-auto text-zinc-400" />
                          <span className="text-xs font-bold text-gray-700 block">Téléverser des photos de produit</span>
                          <span className="text-[10px] text-zinc-400 block">Formats : PNG, JPG, GIF. Multiples possibles.</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                Array.from(files).forEach((file: any) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      setProdImages(prev => [...prev, reader.result as string]);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Or paste image link */}
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="url"
                          placeholder="Ou coller l'URL d'une image de rechange..."
                          value={prodImageInput}
                          onChange={(e) => setProdImageInput(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] text-gray-950 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={addImageLink}
                          className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-emerald-600 rounded-xl text-[11px] font-bold shrink-0"
                        >
                          Ajouter URL
                        </button>
                      </div>

                      {/* Displaying Image previews */}
                      {prodImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {prodImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                              <img src={img} alt="Aperçu" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeProductImage(idx)}
                                className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-[10px] h-5 w-5 flex items-center justify-center font-black shadow-md transition"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-zinc-400 block">{prodImages.length} image(s) ajoutée(s). Téléversement obligatoire pour publier le produit.</span>
                    </div>

                    {/* Conditional link to courses, video or websites */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Lien d'accès (Formation, vidéo, site internet...)</label>
                      <input
                        type="url"
                        placeholder="Ex: https://academie.com/mes-cours-excel"
                        value={prodCourseLink}
                        onChange={(e) => setProdCourseLink(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 block">Idéal pour les formations en ligne, vidéos privées ou sites d'adhésion.</span>
                    </div>

                    {/* PDF Document Upload Option */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Fichier PDF téléchargeable (Pour Ebooks, guides...)</label>
                      
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition relative bg-gray-50/50">
                        {prodDownloadableFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-xs">
                              <FileText className="h-6 w-6" />
                              <span>{prodDownloadableFileName || "produit_telechargeable.pdf"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setProdDownloadableFile("");
                                setProdDownloadableFileName("");
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                            >
                              Retirer le fichier PDF
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer space-y-1 block">
                            <FileText className="h-6 w-6 mx-auto text-zinc-400 animate-pulse" />
                            <span className="text-xs font-bold text-gray-700 block">Téléverser un document PDF</span>
                            <span className="text-[10px] text-zinc-400 block">PDF uniquement. Les acheteurs pourront le télécharger automatiquement après paiement.</span>
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
                                    setProductError("Seuls les fichiers au format PDF sont acceptés.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      setProdDownloadableFile(reader.result);
                                      setProdDownloadableFileName(file.name);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Shipping delay & detailed description */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-xs font-bold text-gray-700 block">Délai de livraison estimé / Disponibilité</label>
                        <input
                          type="text"
                          placeholder="Ex: Téléchargement immédiat, ou 3-5 jours pour colis physique"
                          value={prodShippingTime}
                          onChange={(e) => setProdShippingTime(e.target.value)}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Description détaillée du produit *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Qu'est-ce que l'acheteur obtient concrètement ? Détails techniques ou programme de formation."
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Conditions de vente</label>
                      <input
                        type="text"
                        placeholder="Ex: Garantie de 14 jours, pas de remboursement sur le digital..."
                        value={prodTerms}
                        onChange={(e) => setProdTerms(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                      />
                    </div>

                    {productError && (
                      <p className="text-xs text-rose-600 font-bold block">{productError}</p>
                    )}
                    {productSuccess && (
                      <p className="text-xs text-emerald-600 font-bold block">{productSuccess}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingProduct}
                      className="w-full bg-zinc-900 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4.5 w-4.5" />
                      {isSubmittingProduct ? "Publication..." : "Publier le produit"}
                    </button>
                  </form>
                </div>


                {/* COLUMN RIGHT: ORDERS LIST & INCOME REPORT (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* PENDING ORDERS PANEL */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                    <h4 className="text-sm font-black text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Truck className="h-4.5 w-4.5 text-indigo-500 animate-bounce" />
                      Commandes reçues en attente de livraison / expédition
                    </h4>

                    {myShopOrders.filter(o => o.status === "paid_escrow" || o.status === "shipped").length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <ShoppingBag className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                        <p className="text-xs text-gray-500 font-semibold">Aucune commande en attente sur votre boutique</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 shrink-0">
                        {myShopOrders
                          .filter(o => o.status === "paid_escrow" || o.status === "shipped")
                          .map(order => (
                            <div key={order.id} className="py-4 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                                    Commande #{order.id}
                                  </span>
                                  <h5 className="text-xs font-black text-gray-900">{order.productName}</h5>
                                  <p className="text-[11px] text-gray-500">
                                    Acheteur : <span className="text-gray-900 font-bold">@{order.buyerUsername}</span> • Qté: <span className="font-bold">{order.quantity}</span>
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs font-black text-gray-900">{order.totalPrice.toLocaleString()} {order.currency}</span>
                                  <span className={`block text-[9px] font-bold uppercase ${
                                    order.status === "shipped" ? "text-indigo-600" : "text-amber-600"
                                  }`}>
                                    ● {order.status === "shipped" ? "Expédiée" : "À Expédier"}
                                  </span>
                                </div>
                              </div>

                              {/* Customer Contact coordinates */}
                              <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-[11px] text-gray-600 border border-gray-100 font-sans">
                                <p className="font-bold text-gray-900 flex items-center gap-1">📍 Adresse : {order.shippingAddress || "Numérique"}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-gray-500 font-mono">
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.phoneNumber}</span>
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {order.email}</span>
                                </div>
                              </div>

                              {/* SHIP DISPATCHING BOX */}
                              {order.status === "paid_escrow" && (
                                <div className="flex items-center gap-2">
                                  {shippingOrderId === order.id ? (
                                    <div className="flex items-center gap-2 w-full animate-fade-in">
                                      <input
                                        type="text"
                                        placeholder="Numéro de suivi Colis / Lien..."
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-xs text-gray-950 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleMarkShipped(order.id)}
                                        disabled={isShipping}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black shrink-0 hover:bg-indigo-700"
                                      >
                                        Confirmer expédition
                                      </button>
                                      <button
                                        onClick={() => setShippingOrderId(null)}
                                        className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-500"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShippingOrderId(order.id)}
                                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                                    >
                                      <Truck className="h-3.5 w-3.5" />
                                      Expédier le colis
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>


                  {/* MY PUBLISHED PRODUCTS MANAGER */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                    <h4 className="text-sm font-black text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Package className="h-4.5 w-4.5 text-emerald-600" />
                      Mes produits publiés
                    </h4>

                    {sellerProducts.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        Aucun produit publié. Remplissez le formulaire de gauche.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                        {sellerProducts.map(prod => (
                          <div 
                            key={prod.id} 
                            className="py-3 px-2 -mx-2 hover:bg-slate-50/60 rounded-xl flex items-center justify-between gap-4 font-sans transition group"
                          >
                            <div 
                              onClick={() => {
                                setEditForm({ ...prod });
                                setEditError("");
                                setEditSuccess("");
                              }}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            >
                              <img src={prod.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                              <div className="min-w-0">
                                <span className="block text-xs font-bold text-gray-950 translate-y-0.5 truncate group-hover:text-emerald-700 transition">{prod.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">{getProductCategoryLabel(prod.category)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <span className="block text-xs font-mono font-black text-gray-950">{prod.price.toLocaleString()} {prod.currency}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold block">{prod.salesCount} ventes</span>
                              </div>

                              {/* Action Menu (3 Dots) */}
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveProductMenuId(activeProductMenuId === prod.id ? null : prod.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-500 hover:text-gray-950 cursor-pointer"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {activeProductMenuId === prod.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-30" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveProductMenuId(null);
                                      }}
                                    />
                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-40 text-left">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveProductMenuId(null);
                                          setEditForm({ ...prod });
                                          setEditError("");
                                          setEditSuccess("");
                                        }}
                                        className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 font-bold cursor-pointer"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                                        Modifier les infos
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveProductMenuId(null);
                                          setProductSharedId(prod.id);
                                          setProdShareCopied(false);
                                        }}
                                        className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-slate-50 flex items-center gap-2 font-bold cursor-pointer"
                                      >
                                        <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Partager le lien
                                      </button>

                                      <div className="border-t border-gray-100 my-1" />

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveProductMenuId(null);
                                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${prod.name}" ?`)) {
                                            handleDeleteProduct(prod.id);
                                          }
                                        }}
                                        className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold cursor-pointer"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Supprimer définitivement
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}


      {/* ======================================================== */}
      {/* 3. MES ACHATS (BUYER ORDERS TAB)                          */}
      {/* ======================================================== */}
      {boutiqueTab === "my_purchases" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in" id="purchases_tab_container">
          <h4 className="text-lg font-heading font-black text-gray-950 flex items-center gap-2 pb-3 border-b border-gray-100">
            <ShoppingBag className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
            Suivi de mes achats sécurisés (Escrow Actif)
          </h4>

          {buyerOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-3">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-200" />
              <p className="text-sm font-bold text-gray-900">Vous n'avez pas encore effectué d'achats.</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">Visitez la Marketplace, sélectionnez des produits et achetez pour voir votre transaction s'afficher ici.</p>
              <button 
                onClick={() => setBoutiqueTab("marketplace")}
                className="text-xs font-bold bg-zinc-950 text-white px-4 py-2 rounded-xl"
              >
                Parcourir la Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 shrink-0">
              {buyerOrders.map(order => (
                <div key={order.id} className="py-5 space-y-4 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={order.productImage} 
                        alt="" 
                        className="h-16 w-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0" 
                      />
                      <div className="space-y-1">
                        <span className="bg-gray-100 text-gray-700 text-[9px] font-black px-2 py-0.5 rounded font-mono block w-fit">
                          COMMANDE #{order.id}
                        </span>
                        <h5 className="text-sm font-black text-gray-950">{order.productName}</h5>
                        <p className="text-xs text-zinc-400">
                          Boutique : <span className="text-emerald-700 font-bold">{order.shopName}</span> • Quantité : <span className="font-bold">{order.quantity}</span>
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span className="block text-base font-black text-gray-900">{order.totalPrice.toLocaleString()} {order.currency}</span>
                      <p className="text-xs text-gray-500 font-mono">Payé via {order.paymentMethod}</p>
                      
                      {/* Active Status Badge */}
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        order.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        order.status === "shipped" ? "bg-indigo-50 text-indigo-700 animate-pulse" :
                        order.status === "disputed" ? "bg-rose-50 text-rose-700 animate-bounce" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {order.status === "completed" ? "CONFIRMÉ & REVERSÉ" :
                         order.status === "shipped" ? "COLIS EXPÉDIÉ (À CONFIRMER)" :
                         order.status === "disputed" ? "LITIGE DÉCLARÉ" :
                         order.status === "refunded" ? "REMBOURSÉ" :
                         "BLOCAGE SÉCURISÉ (ESCROW)"}
                      </span>
                    </div>
                  </div>

                  {/* DIGITAL PRODUCT AUTO-DOWNLOADS & COURSE ACCESS LINKS */}
                  {(() => {
                    const matchingProduct = products.find(p => p.id === order.productId);
                    const canAccessDigital = ["paid_escrow", "shipped", "completed"].includes(order.status);
                    
                    if (!matchingProduct || !canAccessDigital) return null;
                    
                    const hasPdf = matchingProduct.downloadableFile;
                    const hasLink = matchingProduct.courseLink;
                    
                    if (!hasPdf && !hasLink) return null;

                    return (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3 font-sans animate-fade-in">
                        <div className="flex items-center gap-2 text-emerald-900">
                          <Sparkles className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                          <h6 className="text-xs font-black">Accès instantané à vos ressources numériques sécurisées</h6>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {hasPdf && (
                            <a
                              href={matchingProduct.downloadableFile}
                              download={matchingProduct.downloadableFileName || "produit_telechargeable.pdf"}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition shrink-0 cursor-pointer text-center"
                            >
                              <FileText className="h-4 w-4" />
                              Télécharger mon fichier PDF ({matchingProduct.downloadableFileName || "produit.pdf"})
                            </a>
                          )}
                          
                          {hasLink && (
                            <a
                              href={matchingProduct.courseLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-sm transition shrink-0 cursor-pointer text-center"
                            >
                              <Globe className="h-4 w-4 text-emerald-400" />
                              Accéder à la formation / site d'accès
                            </a>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-emerald-800 font-medium">Taskora Escrow sécurise vos fonds. Une fois satisfait du contenu numérique, veuillez valider le paiement pour reverser le solde au vendeur.</p>
                      </div>
                    );
                  })()}

                  {/* SHIPPING / DELIVERY LOGS CARDS */}
                  {order.status === "shipped" && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-xs text-indigo-900 font-sans space-y-1">
                        <p className="font-extrabold flex items-center gap-1">📣 Avis d'expédition : Les vendeurs ont livré votre produit.</p>
                        <p className="text-indigo-700 font-semibold flex items-center gap-1 font-mono">📌 Numéro de suivi : {order.trackingNumber}</p>
                        <p className="text-gray-500 text-[10px] font-normal">Veuillez vérifier votre colis physique ou boîte mail avant d'approuver l'escrow.</p>
                      </div>

                      <button
                        onClick={() => handleConfirmReceipt(order.id)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition shrink-0 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirmer la réception
                      </button>
                    </div>
                  )}

                  {/* DISPUTE SYSTEM */}
                  {order.status !== "completed" && order.status !== "refunded" && order.status !== "disputed" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDisputedOrder(order)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Signaler un problème / Litige
                      </button>
                    </div>
                  )}

                  {/* If disputed, display feedback */}
                  {order.status === "disputed" && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-800 flex gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">Dossier en attente d'arbitrage administratif.</p>
                        <p className="font-normal text-rose-600 mt-1">Les fonds de {order.totalPrice} {order.currency} restent bloqués de manière stricte sur la plateforme. Notre service modération examine les pièces justificatives.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ======================================================== */}
      {/* 4. MODALS & SUB-PANELS (购买/Litige)                        */}
      {/* ======================================================== */}

      {/* 4.1 PRODUCT CHECKOUT MODAL */}
      {buyingProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-950 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                Informations d'achat
              </h3>
              <button 
                onClick={() => setBuyingProduct(null)}
                className="p-1 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 font-bold text-xs"
              >
                Fermer
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <img src={buyingProduct.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-gray-950">{buyingProduct.name}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Vendeur : <span className="font-bold">{buyingProduct.shopName}</span> • Origin : {buyingProduct.targetCountries.join(", ")}</p>
                <p className="text-xs font-mono font-black text-emerald-600 mt-1">{buyingProduct.price.toLocaleString()} {buyingProduct.currency} / unité</p>
              </div>
            </div>

            <form onSubmit={handlePurchase} className="space-y-4">
              
              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Quantité souhaitée</label>
                <input
                  type="number"
                  min="1"
                  max={buyingProduct.quantityAvailable || 100}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 font-bold focus:outline-none"
                />
              </div>

              {/* Shipping Address for physical products */}
              {buyingProduct.category === "physical" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Adresse de livraison complète *</label>
                  <input
                    type="text"
                    required
                    placeholder="Numéro de villa, quartier, ville, pays"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  />
                </div>
              )}

              {/* Phone & Email contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Numéro de téléphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+221..."
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Adresse Mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="nom@mail.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment methods list */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Moyen de paiement sécurisé</label>
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  {[
                    { key: "Wallet Taskora", label: `Wallet Taskora (${currentUser?.wallet.available.toLocaleString()} disponibles)` },
                    { key: "Mobile Money", label: "Orange / Wave Money (Simulation)" },
                    { key: "Cartes bancaires", label: "Visa / Mastercard" },
                    { key: "Virements bancaires", label: "Transfert Bancaire direct" }
                  ].map(method => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition ${
                        paymentMethod === method.key
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order pricing summary */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between text-xs font-sans">
                <span className="text-gray-500 font-bold">MONTANT TOTAL BLOQUÉ EN ESCROW :</span>
                <span className="text-base font-black text-gray-950 font-mono">
                  {(buyingProduct.price * orderQuantity).toLocaleString()} {buyingProduct.currency}
                </span>
              </div>

              {orderError && (
                <p className="text-xs text-rose-600 font-bold block">{orderError}</p>
              )}
              {orderSuccess && (
                <p className="text-xs text-emerald-600 font-bold block">{orderSuccess}</p>
              )}

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl transition uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" />
                {isSubmittingOrder ? "Traitement transaction..." : "Payer maintenant (Garantie Escrow)"}
              </button>
            </form>

          </div>
        </div>
      )}


      {/* 4.2 FILING DISPUTE MODAL */}
      {disputedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Signaler un problème
              </h3>
              <button 
                onClick={() => setDisputedOrder(null)}
                className="p-1 px-3 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100"
              >
                Fermer
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 font-sans space-y-1">
              <p className="font-extrabold text-gray-900">Produit: {disputedOrder.productName}</p>
              <p>Boutique : {disputedOrder.shopName} • Import : {disputedOrder.totalPrice.toLocaleString()} {disputedOrder.currency}</p>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Description détaillée du problème *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Expliquez ici ce qui ne va pas (colis non reçu, non conformité, lien d'accès rompu, arnaque...)"
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1 font-mono">
                <label className="text-xs font-bold text-gray-700 block">Remboursement demandé ({disputedOrder.currency})</label>
                <input
                  type="number"
                  placeholder={String(disputedOrder.totalPrice)}
                  value={disputeRefundAmt}
                  onChange={(e) => setDisputeRefundAmt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                />
                <span className="text-[9px] text-zinc-400 block mt-1">Par défaut: Remboursement intégral ({disputedOrder.totalPrice.toLocaleString()} {disputedOrder.currency})</span>
              </div>

              {disputeError && (
                <p className="text-xs text-rose-600 font-extrabold block">{disputeError}</p>
              )}
              {disputeSuccess && (
                <p className="text-xs text-emerald-600 font-extrabold block">{disputeSuccess}</p>
              )}

              <button
                type="submit"
                disabled={isSubmittingDispute}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                Soumettre le dossier au litige
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 4.3 EDIT PRODUCT MODAL */}
      {editForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-950 flex items-center gap-2 font-heading">
                <Package className="h-5 w-5 text-emerald-600 animate-pulse" />
                Modifier le produit : {editForm.name}
              </h3>
              <button 
                onClick={() => setEditForm(null)}
                className="p-1 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 font-bold text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  />
                </div>

                {/* Product Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Catégorie *</label>
                  <select
                    value={editForm.category || "physical"}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                  >
                    <option value="physical">📦 Produit Physique / Matériel</option>
                    <option value="digital_pdf">📄 Document PDF / E-Book</option>
                    <option value="digital_course">🎓 Formation / Accès Vidéo / Site</option>
                    <option value="service">🛠️ Service professionnel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Prix *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editForm.price || ""}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 font-bold focus:outline-none"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Devise acceptée</label>
                  <select
                    value={editForm.currency || "XOF"}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 bg-white"
                  >
                    <option value="XOF">XOF (FCFA Ouest)</option>
                    <option value="XAF">XAF (FCFA Centre)</option>
                    <option value="GNF">GNF (Franc Guinéen)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar US)</option>
                  </select>
                </div>

                {/* Quantity Available */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Stock disponible</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.quantityAvailable !== undefined ? editForm.quantityAvailable : 10}
                    onChange={(e) => setEditForm({ ...editForm, quantityAvailable: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Countries */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block font-heading">Pays de publication du produit</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_COUNTRIES.map(c => {
                    const isSelected = editForm.targetCountries?.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() => {
                          const current = editForm.targetCountries || [];
                          let next;
                          if (current.includes(c.name)) {
                            next = current.filter(x => x !== c.name);
                            if (next.length === 0) next = ["Tous"];
                          } else {
                            next = current.filter(x => x !== "Tous");
                            next.push(c.name);
                          }
                          setEditForm({ ...editForm, targetCountries: next });
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {c.flag} {c.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, targetCountries: ["Tous"] })}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                      editForm.targetCountries?.includes("Tous")
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    🌍 Tous les pays
                  </button>
                </div>
              </div>

              {/* Images of the product */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Images du produit (Au moins une requise)</label>
                <div className="grid grid-cols-4 gap-2">
                  {(editForm.images || []).map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img} alt="Aperçu" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImgs = editForm.images.filter((_: any, i: number) => i !== idx);
                          setEditForm({ ...editForm, images: updatedImgs });
                        }}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-[10px] h-5 w-5 flex items-center justify-center font-black shadow-md transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-gray-50/50 hover:bg-emerald-50/10 aspect-square">
                    <Camera className="h-5 w-5 text-gray-400" />
                    <span className="text-[9px] text-gray-500 font-bold mt-1 text-center">Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach((file: any) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setEditForm(prev => ({
                                  ...prev,
                                  images: [...(prev.images || []), reader.result as string]
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Course link or PDF upload depending on selection */}
              <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-xs font-black text-gray-950 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  Ressources numériques additionnelles
                </h5>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Lien d'accès (Formation, vidéo, site...)</label>
                  <input
                    type="url"
                    value={editForm.courseLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, courseLink: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none bg-white"
                    placeholder="https://mon-academie.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Fichier PDF téléchargeable (Ebook, guides...)</label>
                  {editForm.downloadableFile ? (
                    <div className="flex items-center justify-between bg-white border border-gray-150 p-2 rounded-xl">
                      <span className="text-xs font-bold text-rose-600 truncate max-w-[200px]">
                        📄 {editForm.downloadableFileName || "Fichier_Attache.pdf"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, downloadableFile: "", downloadableFileName: "" })}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <label className="border border-dashed border-gray-200 bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] text-gray-600 font-bold mt-1">Téléverser un nouveau document PDF</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setEditForm({
                                  ...editForm,
                                  downloadableFile: reader.result,
                                  downloadableFileName: file.name
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Shipping Delivery Delay */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Délai d'expédition ou Disponibilité</label>
                <input
                  type="text"
                  value={editForm.shippingTime || ""}
                  onChange={(e) => setEditForm({ ...editForm, shippingTime: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  placeholder="Ex: Téléchargement immédiat, ou 3 jours"
                />
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Description détaillée *</label>
                <textarea
                  required
                  rows={3}
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                />
              </div>

              {/* Terms of Sale */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Conditions de vente spécifiques (Optionnel)</label>
                <textarea
                  rows={2}
                  value={editForm.termsOfSale || ""}
                  onChange={(e) => setEditForm({ ...editForm, termsOfSale: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-950 focus:outline-none"
                  placeholder="Politique de retour, garanties..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingEdit ? "Mise à jour en cours..." : "Enregistrer les modifications"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm(null)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.4 SHARE PRODUCT MODAL */}
      {productSharedId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-950 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-emerald-600 animate-pulse" />
                Partager le produit
              </h3>
              <button 
                onClick={() => setProductSharedId(null)}
                className="p-1 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 font-bold text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {(() => {
              const sharedProd = products.find(p => p.id === productSharedId);
              if (!sharedProd) return <p className="text-xs text-gray-500">Produit introuvable.</p>;

              const shareUrl = getProductShareUrl(productSharedId);

              return (
                <div className="space-y-4 font-sans">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <img src={sharedProd.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover bg-white border shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-gray-950">{sharedProd.name}</h4>
                      <p className="text-[10px] font-mono font-bold text-emerald-600">{sharedProd.price.toLocaleString()} {sharedProd.currency}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lien direct de commande</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          setProdShareCopied(true);
                          setTimeout(() => setProdShareCopied(false), 2000);
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition shrink-0 cursor-pointer ${
                          prodShareCopied ? "bg-emerald-600" : "bg-zinc-950 hover:bg-zinc-900"
                        }`}
                      >
                        {prodShareCopied ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center gap-4">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Découvrez et achetez sécurisé sur Taskora : *${sharedProd.name}* au prix de ${sharedProd.price.toLocaleString()} ${sharedProd.currency} : ` + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 text-center group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-md">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-950">WhatsApp</span>
                    </a>

                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Découvrez : ${sharedProd.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 text-center group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-400 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-md">
                        <Send className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-950">Telegram</span>
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 text-center group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-md">
                        <Facebook className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-950">Facebook</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
