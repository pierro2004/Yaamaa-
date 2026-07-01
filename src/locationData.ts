// Location hierarchy database for global countries and specialized West African / Francophone regions
export interface HierarchyData {
  regions: {
    [regionName: string]: string[]; // list of communes/cities/villages
  };
}

export const LOCATION_HIERARCHY: { [countryName: string]: HierarchyData } = {
  "Bénin": {
    regions: {
      "Atlantique": ["Abomey-Calavi", "Allada", "Kpomassè", "Ouidah", "Sô-Ava", "Toffo", "Tori-Bossito", "Zè"],
      "Littoral": ["Cotonou - 1er Arrondissement", "Cotonou - 2ème Arrondissement", "Cotonou - 3ème Arrondissement", "Cotonou - 4ème Arrondissement", "Cotonou - 5ème Arrondissement", "Cotonou - 6ème Arrondissement"],
      "Ouémé": ["Porto-Novo", "Adjarra", "Adjohoun", "Aguégués", "Akpro-Missérété", "Avrankou", "Bonou", "Dangbo", "Sèmè-Kpodji"],
      "Zou": ["Abomey", "Bohicon", "Covè", "Djidja", "Ouinhi", "Za-Kpota", "Zagnanado", "Zogbodomey"],
      "Borgou": ["Parakou", "Bembéréké", "N'Dali", "Nikki", "Pèrèrè", "Sinendé", "Tchaourou", "Kalalé"],
      "Collines": ["Dassa-Zoumé", "Savalou", "Savè", "Bantè", "Glazoué", "Ouèssè"],
      "Mono": ["Lokossa", "Athiémé", "Bopa", "Comè", "Grand-Popo", "Houéyogbé"],
      "Couffo": ["Dogbo-Tota", "Aplahoué", "Djakotomey", "Klouékanmè", "Lalo", "Toviklin"],
      "Atacora": ["Natitingou", "Boukoumbé", "Cobly", "Kérou", "Kouandé", "Matéri", "Pehunco", "Tanguiéta", "Toucountouna"],
      "Donga": ["Djougou", "Bassila", "Copargo", "Ouaké"],
      "Alibori": ["Kandi", "Banikoara", "Gogounou", "Karimama", "Malanville", "Segbana"],
      "Plateau": ["Sakété", "Pobè", "Adja-Ouéré", "Kétou", "Ifangni"]
    }
  },
  "Sénégal": {
    regions: {
      "Dakar": ["Dakar Plateau", "Almadies", "Ngor", "Yoff", "Grand Yoff", "Pikine", "Guédiawaye", "Rufisque", "Sangalkam", "Hann Bel-Air", "Parcelles Assainies"],
      "Thiès": ["Thiès Ville", "Mbour", "Saly Portudal", "Joal-Fadiouth", "Tivaouane", "Popenguine", "Kayar", "Khombole"],
      "Saint-Louis": ["Saint-Louis Ville", "Richard-Toll", "Dagana", "Podor", "Ndioum", "Rao", "Mpal"],
      "Ziguinchor": ["Ziguinchor Ville", "Oussouye", "Bignona", "Cap Skirring", "Kafountine", "Abéné"],
      "Diourbel": ["Diourbel Ville", "Touba Mosquée", "Mbacké", "Bambey"],
      "Kaolack": ["Kaolack Ville", "Nioro du Rip", "Guinguinéo"],
      "Louga": ["Louga Ville", "Linguère", "Dahra", "Kébémer"],
      "Fatick": ["Fatick Ville", "Foundiougne", "Gossas", "Sokone"],
      "Kolda": ["Kolda Ville", "Vélingara", "Médina Yoro Koula"],
      "Matam": ["Matam Ville", "Ourossogui", "Kanel", "Ranérou"],
      "Tambacounda": ["Tambacounda Ville", "Bakel", "Goudiry", "Koumpentoum"]
    }
  },
  "Côte d'Ivoire": {
    regions: {
      "Abidjan": ["Cocody", "Plateau", "Yopougon", "Abobo", "Treichville", "Marcory", "Koumassi", "Port-Bouët", "Adjamé", "Attécoubé", "Bingerville", "Anyama"],
      "Yamoussoukro": ["Yamoussoukro Ville", "Kossou", "Attégouakro"],
      "Gbêkê (Bouaké)": ["Bouaké Ville", "Diabo", "Botro", "Sakassou", "Béoumi"],
      "San-Pédro": ["San-Pédro Ville", "Grand-Béréby", "Grabo", "Tabou"],
      "Poro (Korhogo)": ["Korhogo Ville", "Sinématiali", "Dikodougou", "M'Bengué"],
      "Tonkpi (Man)": ["Man Ville", "Danané", "Biankouma", "Zouan-Hounien"],
      "Haut-Sassandra (Daloa)": ["Daloa Ville", "Issia", "Vavoua", "Zoukougbeu"],
      "Indénié-Djuablin (Abengourou)": ["Abengourou Ville", "Agnibilékrou", "Bettié"]
    }
  },
  "Togo": {
    regions: {
      "Maritime (Lomé)": ["Lomé Commune", "Golfe 1", "Golfe 2", "Golfe 3", "Golfe 4", "Golfe 5", "Golfe 6", "Golfe 7", "Agoè-Nyivé", "Tsévié", "Aného", "Vogan", "Tabligbo"],
      "Plateaux": ["Atakpamé", "Kpalimé", "Badou", "Notsé", "Amlamé", "Elavagnon"],
      "Centrale": ["Sokodé", "Tchamba", "Sotouboua", "Blitta"],
      "Kara": ["Kara Ville", "Bafilo", "Niamtougou", "Guérin-Kouka", "Kandé", "Pagouda"],
      "Savanes": ["Dapaong", "Mango", "Tandjouaré", "Cinkassé", "Mandouri"]
    }
  },
  "France": {
    regions: {
      "Île-de-France (Paris)": ["Paris 75001", "Paris 75008", "Paris 75015", "Boulogne-Billancourt", "Saint-Denis", "Versailles", "Nanterre", "Créteil", "Argenteuil"],
      "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Cannes", "Antibes", "Avignon", "La Seyne-sur-Mer"],
      "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne", "Valence", "Chambéry", "Annecy", "Clermont-Ferrand"],
      "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers", "La Rochelle", "Pau", "Mérignac", "Pessac", "Bayonne"],
      "Occitanie": ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Montauban", "Tarbes", "Albi"],
      "Hauts-de-France": ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Calais", "Saint-Quentin", "Beauvais"]
    }
  },
  "Cameroun": {
    regions: {
      "Centre": ["Yaoundé I", "Yaoundé II", "Yaoundé III", "Yaoundé IV", "Yaoundé V", "Yaoundé VI", "Mbalmayo", "Bafia", "Obala"],
      "Littoral": ["Douala I", "Douala II", "Douala III", "Douala IV", "Douala V", "Edéa", "Nkongsamba", "Kribi"],
      "Ouest": ["Bafoussam", "Foumban", "Dschang", "Mbouda", "Bangangté", "Baham"],
      "Adamaoua": ["Ngaoundéré", "Banyo", "Meiganga", "Tibati"],
      "Est": ["Bertoua", "Abong-Mbang", "Batouri", "Yokadouma"],
      "Extrême-Nord": ["Maroua", "Kousseri", "Yagoua", "Mokolo"],
      "Nord": ["Garoua", "Guider", "Figuil", "Poli"],
      "Nord-Ouest": ["Bamenda", "Wum", "Kumbo", "Nkambe"],
      "Sud": ["Ebolowa", "Sangmélima", "Ambam", "Kribi Ville"],
      "Sud-Ouest": ["Buea", "Limbe", "Kumba", "Mamfe"]
    }
  },
  "Burkina Faso": {
    regions: {
      "Centre": ["Ouagadougou", "Saaba", "Komsilga", "Koubri"],
      "Hauts-Bassins": ["Bobo-Dioulasso", "Houndé", "Orodara"],
      "Nord": ["Ouahigouya", "Gourcy", "Yako"],
      "Sahel": ["Dori", "Djibo", "Gorom-Gorom"],
      "Est": ["Fada N'Gourma", "Bogandé", "Diapaga"],
      "Cascades": ["Banfora", "Sindou"]
    }
  },
  "Niger": {
    regions: {
      "Niamey": ["Niamey I", "Niamey II", "Niamey III", "Niamey IV", "Niamey V"],
      "Maradi": ["Maradi Ville", "Tessaoua", "Dakoro", "Guidan Roumdji"],
      "Zinder": ["Zinder Ville", "Mirriah", "Magaria", "Gouré"],
      "Tahoua": ["Tahoua Ville", "Abalak", "Iléla", "Keita", "Madaoua"],
      "Tillabéri": ["Tillabéri Ville", "Ayorou", "Kollo", "Tera", "Filingué"],
      "Agadez": ["Agadez Ville", "Arlit", "Tchirozérine", "Bilma"]
    }
  },
  "Canada": {
    regions: {
      "Québec": ["Montréal", "Québec Ville", "Laval", "Gatineau", "Sherbrooke", "Trois-Rivières", "Longueuil", "Saguenay"],
      "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Windsor"],
      "Colombie-Britannique": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna"],
      "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge"]
    }
  },
  "Mali": {
    regions: {
      "Bamako": ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V", "Commune VI"],
      "Kayes": ["Kayes Ville", "Nioro du Sahel", "Kita", "Bafoulabé"],
      "Koulikoro": ["Koulikoro Ville", "Kati", "Banamba", "Nara"],
      "Sikasso": ["Sikasso Ville", "Bougouni", "Koutiala"],
      "Ségou": ["Ségou Ville", "San", "Niono"]
    }
  }
};

export function getRegionsForCountry(countryName: string): string[] {
  const match = LOCATION_HIERARCHY[countryName];
  if (match) {
    return Object.keys(match.regions);
  }
  
  // Standard generated fallback regions for other countries
  return ["Région Centrale", "Région Nord", "Région Sud", "Région Est", "Région Ouest", "Saisir manuellement..."];
}

export function getCommunesForRegion(countryName: string, regionName: string): string[] {
  const countryMatch = LOCATION_HIERARCHY[countryName];
  if (countryMatch && countryMatch.regions[regionName]) {
    return countryMatch.regions[regionName];
  }
  
  if (regionName === "Saisir manuellement...") {
    return ["Saisir manuellement..."];
  }

  // Standard generated fallback communes for other regions
  return [
    `Commune Principale de ${regionName}`,
    `Deuxième Commune de ${regionName}`,
    `Zone Commerciale de ${regionName}`,
    `Saisir manuellement...`
  ];
}
