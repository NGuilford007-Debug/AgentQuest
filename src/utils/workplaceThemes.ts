import { WorkplaceStage } from "../types";

export interface WorkplaceZoneTheme {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  iconName: string;
  category: "workplace" | "chill_spot";
  vibe: string;
  tagline: string;
  buffMultiplier: string;
  colors: {
    primary: string; // hex
    secondary: string; // hex
    accentText: string; // tailwind class
    accentTextHover: string;
    accentBg: string;
    accentBgSoft: string;
    accentBorder: string;
    accentBorderStrong: string;
    accentGlow: string;
    ambientAura: string;
    appBgGradient: string;
    cardBg: string;
    headerGradient: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    sidebarActiveBorder: string;
    buttonGradient: string;
    buttonGradientHover: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
  ambientTrack: "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse";
  ambientTrackTitle: string;
}

export const WORKPLACE_ZONE_THEMES: Record<string, WorkplaceZoneTheme> = {
  "stage-war-room": {
    id: "stage-war-room",
    name: "SRE Cyber War Room",
    shortName: "Cyber War Room",
    emoji: "🛡️",
    iconName: "Server",
    category: "workplace",
    vibe: "Cyber Alert",
    tagline: "High-throughput real-time incident resolution & infrastructure telemetry",
    buffMultiplier: "+25% SRE Incident Resolution Speed",
    colors: {
      primary: "#06b6d4", // cyan-500
      secondary: "#3b82f6", // blue-500
      accentText: "text-cyan-400",
      accentTextHover: "hover:text-cyan-300",
      accentBg: "bg-cyan-500",
      accentBgSoft: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/30",
      accentBorderStrong: "border-cyan-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(6,182,212,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.18), transparent)",
      appBgGradient: "from-slate-950 via-[#030c1e] to-slate-950",
      cardBg: "bg-slate-900/80",
      headerGradient: "from-cyan-950/40 via-slate-900/90 to-slate-950/90",
      sidebarActiveBg: "bg-cyan-500/15",
      sidebarActiveText: "text-cyan-400",
      sidebarActiveBorder: "border-cyan-500/40",
      buttonGradient: "from-cyan-500 via-blue-600 to-indigo-600",
      buttonGradientHover: "hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500",
      badgeBg: "bg-cyan-500/20",
      badgeText: "text-cyan-300",
      badgeBorder: "border-cyan-500/40",
    },
    ambientTrack: "cyber_hum",
    ambientTrackTitle: "Sub-Bass Server Core Hum & Fan Array",
  },
  "stage-zen-garden": {
    id: "stage-zen-garden",
    name: "Deep Focus Zen Garden & Dojo",
    shortName: "Zen Garden",
    emoji: "🎋",
    iconName: "Wind",
    category: "chill_spot",
    vibe: "Zen Oasis",
    tagline: "Tranquil sanctuary for deep cognitive tasks, hallucination suppression & clarity",
    buffMultiplier: "+30% Hallucination Suppression & Accuracy",
    colors: {
      primary: "#10b981", // emerald-500
      secondary: "#14b8a6", // teal-500
      accentText: "text-emerald-400",
      accentTextHover: "hover:text-emerald-300",
      accentBg: "bg-emerald-500",
      accentBgSoft: "bg-emerald-500/10",
      accentBorder: "border-emerald-500/30",
      accentBorderStrong: "border-emerald-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(16,185,129,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.18), transparent)",
      appBgGradient: "from-stone-950 via-[#041d13] to-stone-950",
      cardBg: "bg-stone-900/80",
      headerGradient: "from-emerald-950/40 via-stone-900/90 to-stone-950/90",
      sidebarActiveBg: "bg-emerald-500/15",
      sidebarActiveText: "text-emerald-400",
      sidebarActiveBorder: "border-emerald-500/40",
      buttonGradient: "from-emerald-500 via-teal-600 to-green-600",
      buttonGradientHover: "hover:from-emerald-400 hover:via-teal-500 hover:to-green-500",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
      badgeBorder: "border-emerald-500/40",
    },
    ambientTrack: "zen_rain",
    ambientTrackTitle: "432 Hz Theta Frequency & Bamboo Rain",
  },
  "stage-strategy-oasis": {
    id: "stage-strategy-oasis",
    name: "Executive Penthouse Strategy Deck",
    shortName: "Penthouse Deck",
    emoji: "🍸",
    iconName: "TrendingUp",
    category: "workplace",
    vibe: "Deep Focus",
    tagline: "High-level planning, ROI synthesis, and cross-departmental coordination",
    buffMultiplier: "+20% Business Value & ROI Estimation",
    colors: {
      primary: "#f59e0b", // amber-500
      secondary: "#eab308", // yellow-500
      accentText: "text-amber-400",
      accentTextHover: "hover:text-amber-300",
      accentBg: "bg-amber-500",
      accentBgSoft: "bg-amber-500/10",
      accentBorder: "border-amber-500/30",
      accentBorderStrong: "border-amber-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(245,158,11,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.18), transparent)",
      appBgGradient: "from-slate-950 via-[#1e1402] to-slate-950",
      cardBg: "bg-slate-900/80",
      headerGradient: "from-amber-950/40 via-slate-900/90 to-slate-950/90",
      sidebarActiveBg: "bg-amber-500/15",
      sidebarActiveText: "text-amber-400",
      sidebarActiveBorder: "border-amber-500/40",
      buttonGradient: "from-amber-500 via-yellow-600 to-orange-600",
      buttonGradientHover: "hover:from-amber-400 hover:via-yellow-500 hover:to-orange-500",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
      badgeBorder: "border-amber-500/40",
    },
    ambientTrack: "binaural_432",
    ambientTrackTitle: "Binaural Alpha Waves & Skyline Ambience",
  },
  "stage-coffee-lounge": {
    id: "stage-coffee-lounge",
    name: "Rooftop Coffee Bar & Chill Spot",
    shortName: "Coffee Lounge",
    emoji: "☕",
    iconName: "Coffee",
    category: "chill_spot",
    vibe: "Social Cafe",
    tagline: "Casual social hangout, collaborative banter, and agent recharge station",
    buffMultiplier: "+20% Cross-Agent Synergy & Creativity",
    colors: {
      primary: "#f97316", // orange-500
      secondary: "#ea580c", // orange-600
      accentText: "text-orange-400",
      accentTextHover: "hover:text-orange-300",
      accentBg: "bg-orange-500",
      accentBgSoft: "bg-orange-500/10",
      accentBorder: "border-orange-500/30",
      accentBorderStrong: "border-orange-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(249,115,22,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249,115,22,0.18), transparent)",
      appBgGradient: "from-stone-950 via-[#210e03] to-stone-950",
      cardBg: "bg-stone-900/80",
      headerGradient: "from-orange-950/40 via-stone-900/90 to-stone-950/90",
      sidebarActiveBg: "bg-orange-500/15",
      sidebarActiveText: "text-orange-400",
      sidebarActiveBorder: "border-orange-500/40",
      buttonGradient: "from-orange-500 via-amber-600 to-red-600",
      buttonGradientHover: "hover:from-orange-400 hover:via-amber-500 hover:to-red-500",
      badgeBg: "bg-orange-500/20",
      badgeText: "text-orange-300",
      badgeBorder: "border-orange-500/40",
    },
    ambientTrack: "lofi_beats",
    ambientTrackTitle: "Warm Lo-Fi Vinyl Chords & Cozy Cafe Warmth",
  },
  "stage-neural-lab": {
    id: "stage-neural-lab",
    name: "Creative Synth & Neural Prompt Lab",
    shortName: "Neural Lab",
    emoji: "🔮",
    iconName: "Sliders",
    category: "workplace",
    vibe: "Creative Flow",
    tagline: "Rapid prototyping, prompt tuning experiments, and dynamic workflow synthesis",
    buffMultiplier: "+35% Workflow Node Synthesis Precision",
    colors: {
      primary: "#a855f7", // purple-500
      secondary: "#6366f1", // indigo-500
      accentText: "text-purple-400",
      accentTextHover: "hover:text-purple-300",
      accentBg: "bg-purple-500",
      accentBgSoft: "bg-purple-500/10",
      accentBorder: "border-purple-500/30",
      accentBorderStrong: "border-purple-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(168,85,247,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,85,247,0.18), transparent)",
      appBgGradient: "from-slate-950 via-[#18042b] to-slate-950",
      cardBg: "bg-slate-900/80",
      headerGradient: "from-purple-950/40 via-slate-900/90 to-slate-950/90",
      sidebarActiveBg: "bg-purple-500/15",
      sidebarActiveText: "text-purple-400",
      sidebarActiveBorder: "border-purple-500/40",
      buttonGradient: "from-purple-500 via-violet-600 to-indigo-600",
      buttonGradientHover: "hover:from-purple-400 hover:via-violet-500 hover:to-indigo-500",
      badgeBg: "bg-purple-500/20",
      badgeText: "text-purple-300",
      badgeBorder: "border-purple-500/40",
    },
    ambientTrack: "lofi_beats",
    ambientTrackTitle: "Analog Synth Waveform Generator",
  },
  "stage-secops-vault": {
    id: "stage-secops-vault",
    name: "Quantum SecOps Titanium Vault",
    shortName: "SecOps Vault",
    emoji: "🔐",
    iconName: "ShieldCheck",
    category: "workplace",
    vibe: "Zero-Trust",
    tagline: "Zero-trust verification, security boundary audits, and compliance enforcement",
    buffMultiplier: "+40% RBAC & Data Privacy Leak Prevention",
    colors: {
      primary: "#f43f5e", // rose-500
      secondary: "#e11d48", // rose-600
      accentText: "text-rose-400",
      accentTextHover: "hover:text-rose-300",
      accentBg: "bg-rose-500",
      accentBgSoft: "bg-rose-500/10",
      accentBorder: "border-rose-500/30",
      accentBorderStrong: "border-rose-500/60",
      accentGlow: "shadow-[0_0_35px_rgba(244,63,94,0.22)]",
      ambientAura: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(244,63,94,0.18), transparent)",
      appBgGradient: "from-slate-950 via-[#23040e] to-slate-950",
      cardBg: "bg-slate-900/80",
      headerGradient: "from-rose-950/40 via-slate-900/90 to-slate-950/90",
      sidebarActiveBg: "bg-rose-500/15",
      sidebarActiveText: "text-rose-400",
      sidebarActiveBorder: "border-rose-500/40",
      buttonGradient: "from-rose-500 via-pink-600 to-red-600",
      buttonGradientHover: "hover:from-rose-400 hover:via-pink-500 hover:to-red-500",
      badgeBg: "bg-rose-500/20",
      badgeText: "text-rose-300",
      badgeBorder: "border-rose-500/40",
    },
    ambientTrack: "vault_pulse",
    ambientTrackTitle: "Quantum Resonance Lattice & EMP Shield",
  },
};

export const ALL_WORKPLACE_THEMES = Object.values(WORKPLACE_ZONE_THEMES);

export function getWorkplaceTheme(stageId?: string): WorkplaceZoneTheme {
  if (!stageId || !WORKPLACE_ZONE_THEMES[stageId]) {
    return WORKPLACE_ZONE_THEMES["stage-war-room"];
  }
  return WORKPLACE_ZONE_THEMES[stageId];
}
