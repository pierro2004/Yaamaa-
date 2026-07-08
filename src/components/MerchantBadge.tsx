import React from "react";
import { BadgeTier } from "../types";

interface MerchantBadgeProps {
  tier?: BadgeTier | string;
  merchantPackType?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function MerchantBadge({ tier, merchantPackType, size = "sm", showLabel = false }: MerchantBadgeProps) {
  const raw = (tier || merchantPackType || "blue").toLowerCase();
  
  let t: "blue" | "bronze" | "gold" | "diamond" = "blue";
  if (raw.includes("diamond") || raw === "diamond") t = "diamond";
  else if (raw.includes("gold") || raw === "gold") t = "gold";
  else if (raw.includes("bronze") || raw.includes("silver") || raw === "bronze") t = "bronze";
  else t = "blue";

  const sizeClasses = {
    xs: "h-3.5 w-3.5 text-[9px]",
    sm: "h-4.5 w-4.5 text-[10px]",
    md: "h-5.5 w-5.5 text-xs",
    lg: "h-7 w-7 text-sm"
  }[size];

  if (t === "diamond") {
    return (
      <span 
        className={`inline-flex items-center gap-1 font-bold shrink-0 select-none ${
          showLabel ? "px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-sm" : ""
        }`}
        title="Plan Diamant Élite — Numéro Marchand Vérifié à Vie"
      >
        <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-white shadow-md border border-cyan-200/50 ${sizeClasses}`}>
          💎
        </span>
        {showLabel && <span className="text-[10px] tracking-wide uppercase font-mono font-black text-cyan-300">Diamant</span>}
      </span>
    );
  }

  if (t === "gold") {
    return (
      <span 
        className={`inline-flex items-center gap-1 font-bold shrink-0 select-none ${
          showLabel ? "px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 shadow-sm" : ""
        }`}
        title="Plan Or Premium — Numéro Marchand Vérifié à Vie"
      >
        <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-bold shadow-md border border-amber-200/60 ${sizeClasses}`}>
          👑
        </span>
        {showLabel && <span className="text-[10px] tracking-wide uppercase font-mono font-black text-amber-400">Or</span>}
      </span>
    );
  }

  if (t === "bronze") {
    return (
      <span 
        className={`inline-flex items-center gap-1 font-bold shrink-0 select-none ${
          showLabel ? "px-2 py-0.5 rounded-full bg-amber-700/15 border border-amber-600/30 text-amber-500 shadow-sm" : ""
        }`}
        title="Plan Argent / Bronze Doré — Numéro Marchand Vérifié à Vie"
      >
        <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-700 via-yellow-700 to-amber-900 text-amber-100 shadow-md border border-amber-500/40 ${sizeClasses}`}>
          🛡️
        </span>
        {showLabel && <span className="text-[10px] tracking-wide uppercase font-mono font-black text-amber-600">Argent</span>}
      </span>
    );
  }

  // Default: Blue (Basic)
  return (
    <span 
      className={`inline-flex items-center gap-1 font-bold shrink-0 select-none ${
        showLabel ? "px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-400 shadow-sm" : ""
      }`}
      title="Plan Basic — Numéro Marchand Vérifié à Vie"
    >
      <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-600 text-white shadow-md border border-blue-300/40 ${sizeClasses}`}>
        ✓
      </span>
      {showLabel && <span className="text-[10px] tracking-wide uppercase font-mono font-black text-blue-400">Basic</span>}
    </span>
  );
}

interface AvatarWithBadgeProps {
  src?: string;
  name?: string;
  tier?: BadgeTier | string;
  merchantPackType?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarWithBadge({ src, name, tier, merchantPackType, size = "md", className = "" }: AvatarWithBadgeProps) {
  const hasMerchant = !!tier || !!merchantPackType;
  const raw = (tier || merchantPackType || "").toLowerCase();
  
  let ringGradient = "";
  if (raw.includes("diamond") || raw === "diamond") {
    ringGradient = "from-cyan-400 via-sky-500 to-indigo-600";
  } else if (raw.includes("gold") || raw === "gold") {
    ringGradient = "from-amber-400 via-yellow-500 to-amber-600";
  } else if (raw.includes("bronze") || raw.includes("silver") || raw === "bronze") {
    ringGradient = "from-amber-700 via-yellow-700 to-amber-900";
  } else if (hasMerchant) {
    ringGradient = "from-blue-500 via-indigo-600 to-sky-600";
  }

  const dimensionClasses = {
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  }[size];

  const badgeSize = size === "sm" ? "xs" : size === "md" ? "sm" : size === "lg" ? "md" : "lg";

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div className={`rounded-full p-0.5 shadow-md bg-gradient-to-br ${hasMerchant ? ringGradient : 'from-slate-200 to-slate-400'} ${dimensionClasses}`}>
        <img
          src={src || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
          alt={name || "Avatar"}
          className="w-full h-full rounded-full object-cover bg-slate-100"
          referrerPolicy="no-referrer"
        />
      </div>
      {hasMerchant && (
        <div className="absolute -bottom-0.5 -right-0.5 z-10 shadow-lg scale-90 sm:scale-100">
          <MerchantBadge tier={tier} merchantPackType={merchantPackType} size={badgeSize} />
        </div>
      )}
    </div>
  );
}
