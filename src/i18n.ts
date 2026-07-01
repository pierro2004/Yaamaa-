/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "fr" | "en";

export const translations = {
  fr: {
    // Logo & Slogans
    slogan: "« Espace de travail »",
    edition: "ÉDITION PRO",
    
    // Navbar & Navigation
    home: "Accueil",
    missions: "Missions",
    create_campaign: "Créer Campagne",
    boutique: "Boutique",
    promotions: "Promotions",
    wallet: "Portefeuille",
    discussions: "Discussions",
    assistant: "Taskora AI",
    admin_console: "Console Admin",
    founder_console: "Console Fondateur",
    test_mode: "Mode Test :",
    logout: "Déconnexion",
    create_account: "Créer Compte",
    my_wallet: "Mon Portefeuille",
    edit_profile: "Modifier Profil",
    notifications: "Notifications",
    new_notifs: "nouvelles",
    
    // Hero & Banner sections
    hero_title: "Moteur Neurologique de Tâches Rémunérées Taskora AI",
    hero_sub: "Le moyen le plus rapide d'obtenir des compléments de revenus réels en accomplissant de petites tâches en ligne.",
    btn_invite: "Inviter des Filleuls",
    btn_parrainer: "Parrainer & Gagner",
    btn_suivi: "Suivi de mes Filleuls",
    
    // Special referral section
    referral_offer: "🎁 OFFRE SPÉCIALE : PARRAINAGE TASKORA",
    referral_adv: "Vous gagnez 10% sur leurs missions, 5% sur leurs ventes et 3% sur leurs achats à vie !",
    referral_gain: "Gagnez 1.0 € par parrainé certifié rejoignant Taskora.",
    referral_btn: "Suivre mes Filleuls",
    
    // Share / Invite Modal
    modal_title: "Inviter vos Filleuls & Partager",
    modal_badge: "Partage & Invitation",
    modal_advantages: "Vos avantages parrainage",
    modal_copy_success: "Lien d'invitation copié !",
    modal_btn_copy: "Copier le lien",
    modal_btn_share: "Partager",
    modal_btn_sms: "Inviter par SMS 📱",
    modal_sent: "✓ Invitation Envoyée",
    modal_networks_title: "Partager instantanément sur vos réseaux & applications",
    modal_repertoire_title: "📇 Répertoire de vos Contacts & Invitation Directe",
    modal_repertoire_subtitle: "Sélectionnez des contacts de votre répertoire pour leur envoyer directement votre invitation.",
    modal_contacts_count: "Contacts Enregistrés",
    modal_add_contact: "+ Ajouter Contact",
    modal_label_name: "Nom du Contact",
    modal_label_phone: "Numéro de Téléphone",
    modal_sms_success_title: "🎉 Invitation parrainage envoyée avec succès à ",
    modal_sms_success_desc: "Un SMS contenant votre code de parrainage a été expédié.",
    modal_close: "Fermer",
    modal_personal_link: "Votre lien d'invitation personnel",
    
    // General
    loading: "Chargement en cours...",
    error: "Une erreur est survenue.",
    success: "Succès !",
    alert: "Alerte :",
    balance_available: "Solde Disponible",
    balance_pending: "en attente",
    balance_title: "Portefeuille Financier Taskora",
    balance_internal: "💳 Balance Interne Taskora",
  },
  en: {
    // Logo & Slogans
    slogan: "« Working Space »",
    edition: "PRO EDITION",
    
    // Navbar & Navigation
    home: "Home",
    missions: "Missions",
    create_campaign: "Create Campaign",
    boutique: "Shop",
    promotions: "Promotions",
    wallet: "Wallet",
    discussions: "Discussions",
    assistant: "Taskora AI",
    admin_console: "Admin Console",
    founder_console: "Founder Console",
    test_mode: "Test Mode:",
    logout: "Log Out",
    create_account: "Create Account",
    my_wallet: "My Wallet",
    edit_profile: "Edit Profile",
    notifications: "Notifications",
    new_notifs: "new",
    
    // Hero & Banner sections
    hero_title: "Taskora AI Neural Engine for Rewarded Tasks",
    hero_sub: "The fastest way to earn real secondary income by completing small tasks online.",
    btn_invite: "Invite Referrals",
    btn_parrainer: "Refer & Earn",
    btn_suivi: "Track my Referrals",
    
    // Special referral section
    referral_offer: "🎁 SPECIAL OFFER: TASKORA REFERRAL",
    referral_adv: "You earn 10% on their tasks, 5% on their sales and 3% on their purchases for life!",
    referral_gain: "Earn €1.0 per certified referral joining Taskora.",
    referral_btn: "Track my Referrals",
    
    // Share / Invite Modal
    modal_title: "Invite Referrals & Share",
    modal_badge: "Share & Invitation",
    modal_advantages: "Your Referral Benefits",
    modal_copy_success: "Invitation link copied!",
    modal_btn_copy: "Copy Link",
    modal_btn_share: "Share",
    modal_btn_sms: "Invite by SMS 📱",
    modal_sent: "✓ Invitation Sent",
    modal_networks_title: "Instantly share on your networks & applications",
    modal_repertoire_title: "📇 Your Contacts Directory & Direct Invitation",
    modal_repertoire_subtitle: "Select contacts from your directory to send your invitation directly.",
    modal_contacts_count: "Saved Contacts",
    modal_add_contact: "+ Add Contact",
    modal_label_name: "Contact Name",
    modal_label_phone: "Phone Number",
    modal_sms_success_title: "🎉 Referral invitation successfully sent to ",
    modal_sms_success_desc: "An SMS containing your referral code has been sent.",
    modal_close: "Close",
    modal_personal_link: "Your personal invitation link",
    
    // General
    loading: "Loading...",
    error: "An error has occurred.",
    success: "Success!",
    alert: "Alert:",
    balance_available: "Available Balance",
    balance_pending: "pending",
    balance_title: "Taskora Financial Wallet",
    balance_internal: "💳 Taskora Internal Balance",
  },
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.fr;
}
