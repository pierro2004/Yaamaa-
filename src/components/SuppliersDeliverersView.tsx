import React, { useState, useEffect } from "react";
import { User, SupplierDelivererProfile, SupplierDelivererReview, MissionRequest, SupplierOrDelivererType } from "../types";
import { 
  Truck, 
  Store, 
  Search, 
  Filter, 
  CheckCircle2, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Plus, 
  Clock, 
  Award, 
  FileText, 
  MessageSquare, 
  Send, 
  X, 
  AlertCircle, 
  Check, 
  UserCheck, 
  Eye, 
  ChevronRight,
  Briefcase
} from "lucide-react";

interface SuppliersDeliverersViewProps {
  currentUser: User | null;
  currentLanguage: "fr" | "en";
  onNavigate: (view: string) => void;
}

export default function SuppliersDeliverersView({
  currentUser,
  currentLanguage,
  onNavigate
}: SuppliersDeliverersViewProps) {
  const [profiles, setProfiles] = useState<SupplierDelivererProfile[]>([]);
  const [reviews, setReviews] = useState<SupplierDelivererReview[]>([]);
  const [missions, setMissions] = useState<MissionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"directory" | "my_applications" | "admin_panel">("directory");
  const [filterType, setFilterType] = useState<"all" | "supplier" | "deliverer">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerType, setRegisterType] = useState<SupplierOrDelivererType>("supplier");
  const [selectedProfile, setSelectedProfile] = useState<SupplierDelivererProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMissionModal, setShowMissionModal] = useState<boolean>(false);
  const [missionTargetProfile, setMissionTargetProfile] = useState<SupplierDelivererProfile | null>(null);

  // Registration Form State
  const [formFullName, setFormFullName] = useState<string>(currentUser?.name || "");
  const [formProfilePhoto, setFormProfilePhoto] = useState<string>(currentUser?.avatar || "");
  const [formCompanyLogo, setFormCompanyLogo] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>(currentUser?.phone || "+221770000000");
  const [formEmail, setFormEmail] = useState<string>(currentUser?.email || "");
  const [formCountry, setFormCountry] = useState<string>(currentUser?.country || "Sénégal");
  const [formCity, setFormCity] = useState<string>("Dakar");
  const [formInterventionZone, setFormInterventionZone] = useState<string>("Dakar & Banlieue");
  const [formProfessionalAddress, setFormProfessionalAddress] = useState<string>("");
  const [formActivityType, setFormActivityType] = useState<string>("");
  const [formServicesDescription, setFormServicesDescription] = useState<string>("");
  const [formIdDoc, setFormIdDoc] = useState<string>("https://example.com/id_verified.pdf");
  const [formCompanyDoc, setFormCompanyDoc] = useState<string>("");
  const [formDrivingLicense, setFormDrivingLicense] = useState<string>("");
  const [formTransportMethod, setFormTransportMethod] = useState<string>("Moto 125cc");
  const [formVehiclePhotos, setFormVehiclePhotos] = useState<string>("https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300");
  const [formInsuranceDoc, setFormInsuranceDoc] = useState<string>("");
  const [formCertifications, setFormCertifications] = useState<string>("");
  const [formAvailability, setFormAvailability] = useState<string>("24h/24, 7j/7");
  const [formRates, setFormRates] = useState<string>("À partir de 1 500 XOF");
  const [formLanguages, setFormLanguages] = useState<string>("Français, Wolof");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Mission Request Form
  const [missionTitle, setMissionTitle] = useState<string>("");
  const [missionDescription, setMissionDescription] = useState<string>("");
  const [missionBudget, setMissionBudget] = useState<string>("");

  // Review form
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suppliers-deliverers");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.suppliersDeliverers || []);
        setReviews(data.reviews || []);
        setMissions(data.missions || []);
      }
    } catch (err) {
      console.error("Error fetching suppliers & deliverers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage(currentLanguage === "fr" ? "Veuillez vous connecter pour vous inscrire." : "Please login to register.");
      return;
    }
    if (!formFullName || !formPhone || !formEmail || !formCity || !formServicesDescription) {
      setErrorMessage(currentLanguage === "fr" ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/suppliers-deliverers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          type: registerType,
          fullName: formFullName,
          profilePhoto: formProfilePhoto,
          companyLogo: formCompanyLogo,
          phone: formPhone,
          email: formEmail,
          country: formCountry,
          city: formCity,
          interventionZone: formInterventionZone,
          professionalAddress: formProfessionalAddress,
          activityType: formActivityType,
          servicesDescription: formServicesDescription,
          idDocumentUrl: formIdDoc,
          companyDocumentUrl: formCompanyDoc,
          drivingLicenseUrl: formDrivingLicense,
          transportMethod: formTransportMethod,
          vehiclePhotos: formVehiclePhotos ? [formVehiclePhotos] : [],
          insuranceDocumentUrl: formInsuranceDoc,
          certifications: formCertifications ? formCertifications.split(",") : [],
          availabilityHours: formAvailability,
          rates: formRates,
          spokenLanguages: formLanguages ? formLanguages.split(",").map(s => s.trim()) : ["Français"]
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(currentLanguage === "fr" ? "Votre dossier d'inscription a été soumis avec succès ! En attente de validation admin." : "Registration submitted successfully! Pending admin approval.");
        setShowRegisterModal(false);
        fetchData();
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      setErrorMessage("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminStatus = async (profileId: string, status: string, feedback?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/suppliers-deliverers/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          status,
          adminFeedback: feedback || "",
          operatorId: currentUser.id
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error updating profile status:", err);
    }
  };

  const handleSendMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !missionTargetProfile) return;
    if (!missionTitle) return;

    try {
      const res = await fetch("/api/suppliers-deliverers/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: missionTargetProfile.id,
          clientId: currentUser.id,
          title: missionTitle,
          description: missionDescription,
          budgetOrRates: missionBudget
        })
      });
      if (res.ok) {
        setShowMissionModal(false);
        setMissionTitle("");
        setMissionDescription("");
        setMissionBudget("");
        alert(currentLanguage === "fr" ? "Demande de mission envoyée avec succès ! Le prestataire a été notifié dans sa messagerie." : "Mission request sent successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Error sending mission request:", err);
    }
  };

  const handleAddReview = async (profileId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/suppliers-deliverers/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          userId: currentUser.id,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      if (res.ok) {
        setNewReviewComment("");
        fetchData();
      }
    } catch (err) {
      console.error("Error adding review:", err);
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    if (activeTab === "directory" && p.status !== "approved") return false;
    if (activeTab === "my_applications" && currentUser && p.userId !== currentUser.id) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    if (selectedCountry !== "all" && p.country !== selectedCountry) return false;
    if (selectedCity !== "all" && p.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.fullName.toLowerCase().includes(q) ||
             p.city.toLowerCase().includes(q) ||
             p.activityType.toLowerCase().includes(q) ||
             p.servicesDescription.toLowerCase().includes(q);
    }
    return true;
  });

  const countriesList = Array.from(new Set(profiles.map(p => p.country)));
  const citiesList = Array.from(new Set(profiles.map(p => p.city)));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-slate-800 py-12 px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4 border border-emerald-500/20">
            <Truck className="h-3.5 w-3.5" />
            <span>{currentLanguage === "fr" ? "Annuaire Professionnel Officiel" : "Official B2B Directory"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-heading">
            {currentLanguage === "fr" ? "Fournisseurs & Livreurs Agréés" : "Approved Suppliers & Deliverers"}
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {currentLanguage === "fr" 
              ? "Trouvez des prestataires qualifiés, commandez des produits en gros ou confiez vos livraisons express en toute sécurité."
              : "Find qualified service providers, order wholesale goods or delegate fast secure deliveries."}
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setRegisterType("supplier");
                setShowRegisterModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Store className="h-4 w-4" />
              <span>{currentLanguage === "fr" ? "S'inscrire en tant que Fournisseur" : "Register as Supplier"}</span>
            </button>
            <button
              onClick={() => {
                setRegisterType("deliverer");
                setShowRegisterModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>{currentLanguage === "fr" ? "S'inscrire en tant que Livreur" : "Register as Deliverer"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS & FILTERS BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 backdrop-blur-md">
          
          {/* TABS */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "directory" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{currentLanguage === "fr" ? "Annuaire Officiel" : "Directory"}</span>
            </button>
            <button
              onClick={() => setActiveTab("my_applications")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "my_applications" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" 
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>{currentLanguage === "fr" ? "Mes Inscriptions" : "My Applications"}</span>
            </button>
            {(currentUser?.role === "admin" || currentUser?.role === "founder") && (
              <button
                onClick={() => setActiveTab("admin_panel")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "admin_panel" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>{currentLanguage === "fr" ? "Console Admin & Validation" : "Admin Dashboard"}</span>
              </button>
            )}
          </div>

          {/* TYPE FILTER & SEARCH */}
          {activeTab === "directory" && (
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700 shrink-0">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterType === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {currentLanguage === "fr" ? "Tous" : "All"}
                </button>
                <button
                  onClick={() => setFilterType("supplier")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterType === "supplier" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {currentLanguage === "fr" ? "Fournisseurs" : "Suppliers"}
                </button>
                <button
                  onClick={() => setFilterType("deliverer")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterType === "deliverer" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {currentLanguage === "fr" ? "Livreurs" : "Deliverers"}
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLanguage === "fr" ? "Rechercher par nom, ville, service..." : "Search name, city, service..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT LIST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-slate-400 text-xs font-mono">Chargement de l'annuaire...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/40 rounded-3xl border border-slate-800">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-base font-bold text-white font-heading">
              {currentLanguage === "fr" ? "Aucun profil trouvé" : "No profiles found"}
            </h3>
            <p className="mt-1 text-slate-400 text-xs">
              {currentLanguage === "fr" ? "Modifiez vos filtres ou inscrivez-vous dès maintenant." : "Change filters or register now."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div 
                key={profile.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group"
              >
                {/* STATUS BADGE FOR MY APPLICATIONS OR ADMIN */}
                {activeTab !== "directory" && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      profile.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      profile.status === "pending" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}>
                      {profile.status === "approved" ? "Approuvé" : profile.status === "pending" ? "En attente" : "Rejeté/Suspendu"}
                    </span>
                  </div>
                )}

                <div>
                  {/* HEADER */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img 
                        src={profile.profilePhoto} 
                        alt={profile.fullName} 
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-emerald-500 transition"
                        referrerPolicy="no-referrer"
                      />
                      {profile.isVerified && (
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow" title="Vérifié">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          profile.type === "supplier" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {profile.type === "supplier" ? "Fournisseur" : "Livreur"}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-white truncate font-heading">
                        {profile.fullName}
                      </h3>
                      <p className="text-xs text-emerald-400 font-mono truncate">{profile.activityType}</p>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{profile.city}, {profile.country} ({profile.interventionZone})</span>
                    </div>
                    <p className="text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                      {profile.servicesDescription}
                    </p>
                  </div>

                  {/* STATS & RATINGS */}
                  <div className="mt-5 grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 text-center">
                    <div>
                      <span className="block text-xs font-bold text-amber-400 flex items-center justify-center gap-1 font-mono">
                        <Star className="h-3 w-3 fill-amber-400" /> {profile.rating}
                      </span>
                      <span className="block text-[10px] text-slate-400">{profile.reviewsCount} avis</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-400 font-mono">{profile.missionsCompletedCount}</span>
                      <span className="block text-[10px] text-slate-400">Missions</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-indigo-400 font-mono">{profile.successRate}%</span>
                      <span className="block text-[10px] text-slate-400">Succès</span>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-6 pt-4 border-t border-slate-700/55 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProfile(profile);
                      setShowProfileModal(true);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Détails</span>
                  </button>

                  {profile.status === "approved" && currentUser?.id !== profile.userId && (
                    <button
                      onClick={() => {
                        setMissionTargetProfile(profile);
                        setShowMissionModal(true);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <Send className="h-4 w-4" />
                      <span>Mission</span>
                    </button>
                  )}

                  {/* ADMIN QUICK ACTIONS */}
                  {activeTab === "admin_panel" && currentUser && (currentUser.role === "admin" || currentUser.role === "founder") && (
                    <div className="flex gap-1">
                      {profile.status !== "approved" && (
                        <button
                          onClick={() => handleAdminStatus(profile.id, "approved")}
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                          title="Approuver"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {profile.status !== "rejected" && (
                        <button
                          onClick={() => handleAdminStatus(profile.id, "rejected", "Documents non conformes")}
                          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
                          title="Rejeter"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative animate-fade-in">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                {registerType === "supplier" ? <Store className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-white font-heading">
                  {registerType === "supplier" ? "Inscription Fournisseur Agréé" : "Inscription Livreur Agréé"}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLanguage === "fr" ? "Remplissez ce formulaire pour soumettre votre dossier professionnel." : "Fill out this form to submit your professional profile."}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Téléphone Mobile *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Adresse E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Type d'Activité / Spécialité *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agro-alimentaire / Moto Express"
                    value={formActivityType}
                    onChange={(e) => setFormActivityType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pays *</label>
                  <input
                    type="text"
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Zone d'intervention *</label>
                  <input
                    type="text"
                    required
                    value={formInterventionZone}
                    onChange={(e) => setFormInterventionZone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description des Services / Produits *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Décrivez précisément vos services, produits en gros, tarifs ou conditions..."
                  value={formServicesDescription}
                  onChange={(e) => setFormServicesDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {registerType === "deliverer" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Moyen de Transport</label>
                    <input
                      type="text"
                      placeholder="Moto Yamaha 125cc / Voiture / Vélo"
                      value={formTransportMethod}
                      onChange={(e) => setFormTransportMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Permis de Conduire (URL)</label>
                    <input
                      type="text"
                      value={formDrivingLicense}
                      onChange={(e) => setFormDrivingLicense(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Photo de Profil (URL)</label>
                  <input
                    type="text"
                    value={formProfilePhoto}
                    onChange={(e) => setFormProfilePhoto(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pièce d'Identité (URL)</label>
                  <input
                    type="text"
                    value={formIdDoc}
                    onChange={(e) => setFormIdDoc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-600 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>Soumettre le Dossier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PROFILE MODAL */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative animate-fade-in">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img 
                src={selectedProfile.profilePhoto} 
                alt={selectedProfile.fullName} 
                className="h-24 w-24 rounded-3xl object-cover border-4 border-slate-700 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    selectedProfile.type === "supplier" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  }`}>
                    {selectedProfile.type === "supplier" ? "Fournisseur Agréé" : "Livreur Agréé"}
                  </span>
                  {selectedProfile.isVerified && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Vérifié
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-black text-white font-heading">{selectedProfile.fullName}</h2>
                <p className="text-sm text-emerald-400 font-mono">{selectedProfile.activityType}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> {selectedProfile.city}, {selectedProfile.country}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-emerald-500" /> {selectedProfile.phone}</span>
                </div>
              </div>
            </div>

            {/* DESCRIPTION & DETAILS */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-2">Services & Prestations</h4>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedProfile.servicesDescription}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Zone d'intervention:</span> <span className="text-white font-bold">{selectedProfile.interventionZone}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Disponibilité:</span> <span className="text-white font-bold">{selectedProfile.availabilityHours}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tarifs indicatifs:</span> <span className="text-emerald-400 font-bold">{selectedProfile.rates || "Sur devis"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Langues parlées:</span> <span className="text-white">{selectedProfile.spokenLanguages?.join(", ")}</span></div>
                {selectedProfile.transportMethod && (
                  <div className="flex justify-between"><span className="text-slate-400">Transport:</span> <span className="text-indigo-400 font-bold">{selectedProfile.transportMethod}</span></div>
                )}
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="mt-8">
              <h4 className="text-sm font-black text-white font-heading mb-4 flex items-center justify-between">
                <span>Évaluations & Avis Clients ({selectedProfile.reviewsCount})</span>
                <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
                  <Star className="h-4 w-4 fill-amber-400" /> {selectedProfile.rating} / 5.0
                </span>
              </h4>

              {/* LIST REVIEWS */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {reviews.filter(r => r.profileId === selectedProfile.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Aucun avis pour le moment.</p>
                ) : (
                  reviews.filter(r => r.profileId === selectedProfile.id).map(rev => (
                    <div key={rev.id} className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 flex items-start gap-3">
                      <img src={rev.userAvatar} alt={rev.username} className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{rev.username}</span>
                          <span className="text-amber-400 flex items-center gap-0.5 text-xs font-mono">
                            <Star className="h-3 w-3 fill-amber-400" /> {rev.rating}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* WRITE A REVIEW */}
              {currentUser && currentUser.id !== selectedProfile.userId && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h5 className="text-xs font-bold text-slate-300 mb-2">Laisser un avis</h5>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-400">Note:</span>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewReviewRating(num)}
                        className={`p-1 ${newReviewRating >= num ? "text-amber-400" : "text-slate-600"}`}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Votre commentaire..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => handleAddReview(selectedProfile.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MISSION REQUEST MODAL */}
      {showMissionModal && missionTargetProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative animate-fade-in">
            <button
              onClick={() => setShowMissionModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-heading">
                  Envoyer une Demande de Mission
                </h3>
                <p className="text-xs text-slate-400">
                  À: {missionTargetProfile.fullName} ({missionTargetProfile.type === "supplier" ? "Fournisseur" : "Livreur"})
                </p>
              </div>
            </div>

            <form onSubmit={handleSendMission} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Titre de la Mission / Commande *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Livraison de 50 sacs de riz ou Approvisionnement fruits"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description détaillée *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Précisez les volumes, les adresses de départ et d'arrivée, ou les exigences particulières..."
                  value={missionDescription}
                  onChange={(e) => setMissionDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Budget ou Tarifs proposés</label>
                <input
                  type="text"
                  placeholder="Ex: 15 000 XOF ou Devis à valider"
                  value={missionBudget}
                  onChange={(e) => setMissionBudget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMissionModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  Envoyer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
