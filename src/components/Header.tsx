import React, { useState, useRef, useEffect } from "react";
import { AccessLevel, EmployeeProfile, WhiteLabelConfig } from "../types";
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Bell, 
  ChevronRight, 
  ChevronDown,
  Bot, 
  CheckCircle2, 
  Zap, 
  Award, 
  ShieldCheck, 
  FolderArchive, 
  Target, 
  Download, 
  Check, 
  RefreshCw, 
  Palette, 
  EyeOff, 
  DollarSign, 
  Lock, 
  Unlock, 
  Shield, 
  Coins,
  CreditCard,
  User,
  Users,
  RotateCcw,
  Settings,
  Gift,
  UserPlus,
  Volume2,
  VolumeX,
  Radio,
  Scale
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { ALL_WORKPLACE_THEMES, WorkplaceZoneTheme, getWorkplaceTheme } from "../utils/workplaceThemes";
import { ThemeStudioModal } from "./ThemeStudioModal";

interface HeaderProps {
  userProfile: EmployeeProfile;
  activeAgentsCount: number;
  totalWorkflowsCount: number;
  onCreateAgent: () => void;
  onOpenGamification: () => void;
  onQuickTask: () => void;
  onOpenSaveStates?: () => void;
  onToggleFocusHUD?: () => void;
  onOpenExport?: () => void;
  onOpenWhiteLabel?: () => void;
  onOpenMonetization?: () => void;
  onOpenPricing?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: () => void;
  isAutoSaving?: boolean;
  lastSavedTime?: string;
  whiteLabelConfig?: WhiteLabelConfig;
  onToggleClientPreview?: () => void;
  isMasterDeveloper?: boolean;
  accessLevel?: AccessLevel;
  onOpenMasterAccessGate?: () => void;
  activeWorkplaceThemeId?: string;
  onSelectWorkplaceTheme?: (themeId: string) => void;
  isPlayingZoneAudio?: boolean;
  onToggleZoneAudio?: () => void;
  onOpenLegal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  activeAgentsCount,
  onCreateAgent,
  onOpenGamification,
  onQuickTask,
  onOpenSaveStates,
  onToggleFocusHUD,
  onOpenExport,
  onOpenWhiteLabel,
  onOpenMonetization,
  onOpenPricing,
  onOpenProfileModal,
  onOpenAuthModal,
  isAutoSaving = false,
  lastSavedTime,
  whiteLabelConfig,
  onToggleClientPreview,
  isMasterDeveloper = true,
  accessLevel = "client_tenant",
  onOpenMasterAccessGate,
  activeWorkplaceThemeId = "stage-war-room",
  onSelectWorkplaceTheme,
  isPlayingZoneAudio = false,
  onToggleZoneAudio,
  onOpenLegal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const activeTheme = getWorkplaceTheme(activeWorkplaceThemeId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const brandName = whiteLabelConfig?.brandName || "AgentFlow";
  const companyName = whiteLabelConfig?.companyName || "Autonomous Multi-Agent Workspace";
  const primaryColor = whiteLabelConfig?.primaryColor || "#3b82f6";
  const enableGamification = whiteLabelConfig?.featureToggles.enableGamification !== false;
  const currentPlan = userProfile.subscriptionPlan || "free";

  const recentAlerts = [
    {
      id: "a-1",
      title: "Agent SentryOps completed P0 Triage",
      desc: "Saved 45 mins. +150 XP awarded.",
      time: "4m ago",
      icon: Zap,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      id: "a-2",
      title: "Daily Quest Ready to Claim!",
      desc: "Zero Delay HITL Verification (+600 XP)",
      time: "12m ago",
      icon: Award,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "a-3",
      title: "Security Gate Passed",
      desc: "GDPR PII scrub active across 4 agents.",
      time: "1h ago",
      icon: ShieldCheck,
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <div className="sticky top-0 z-30 flex flex-col">
      {/* Client Preview Mode Banner */}
      {whiteLabelConfig?.clientPortalMode && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
            <span className="truncate">
              <strong>Client Preview Mode Active:</strong> Viewing white-labeled portal as <em>{brandName}</em> ({whiteLabelConfig.customDomain})
            </span>
          </div>
          {onToggleClientPreview && (
            <button
              onClick={onToggleClientPreview}
              className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <EyeOff className="w-3 h-3" />
              <span>Exit Preview</span>
            </button>
          )}
        </div>
      )}

      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 md:px-6 flex items-center justify-between transition-colors gap-2">
        
        {/* Brand & Active status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {whiteLabelConfig?.logoUrl ? (
                <img src={whiteLabelConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <DynamicIcon name={whiteLabelConfig?.logoIcon || "Bot"} className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  {brandName}
                </span>
                <span 
                  className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded text-white whitespace-nowrap shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block truncate max-w-[160px] lg:max-w-xs">
                {companyName}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block shrink-0" />

          {/* Live Health Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{activeAgentsCount} Agents Operational</span>
          </div>

          {/* Auto-Save Status Indicator */}
          <div 
            onClick={onOpenSaveStates}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            title="Continuous local auto-save is active. Click to manage checkpoints."
          >
            {isAutoSaving ? (
              <>
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Auto-saving...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">
                  {lastSavedTime ? `Saved at ${lastSavedTime}` : "Auto-saved"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Executive Telemetry & Operator Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          
          {/* Autonomy Operational Index */}
          <div 
            onClick={onOpenGamification}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-xs whitespace-nowrap shrink-0"
            title="Operational Autonomy Index: Percentage of tasks executed 100% autonomously without human bottleneck"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
            <span>{userProfile.autonomousRunRatio ?? 0}% Autonomy</span>
          </div>

          {/* OpEx Value Created */}
          <div 
            onClick={onOpenMonetization}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-xs whitespace-nowrap shrink-0"
            title="Total Operating Expense (OpEx) saved by autonomous agent workflows"
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>${(userProfile.costSavedUsd ?? 0).toLocaleString()} Saved</span>
          </div>

          {/* Sign Up / Free Access Tier CTA Button */}
          {onOpenAuthModal && (
            <button
              id="btn-header-signup-free"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                userProfile.isAuthenticated
                  ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-500/20"
              }`}
              title={userProfile.isAuthenticated ? "Manage User Profile & Workspace" : "Create Free Account or Connect Subscription"}
            >
              {userProfile.isAuthenticated ? (
                <>
                  <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="hidden sm:inline">Account</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] uppercase font-extrabold">
                    {currentPlan}
                  </span>
                </>
              ) : (
                <>
                  <Gift className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Free Sign Up</span>
                </>
              )}
            </button>
          )}

          {/* Pricing & Subscription Plans Quick Button */}
          {onOpenPricing && (
            <button
              id="btn-header-pricing"
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
              title="View Subscription Plans, Fleet Tiers & Stripe Checkout"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Pricing & Plans</span>
              <span className="sm:hidden">Plans</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold uppercase">
                {currentPlan === "free" ? "Free" : currentPlan}
              </span>
            </button>
          )}

          {/* Executive Operator Profile Pill */}
          <div 
            id="header-user-profile-pill"
            onClick={onOpenProfileModal || onOpenGamification}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group whitespace-nowrap shrink-0"
            title="Click to view Operator Profile, Company Milestones, or Workspace Settings"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full border border-blue-500/30 object-cover shrink-0"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[100px]">
                {userProfile.name}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[100px]">
                {userProfile.organizationName || userProfile.role}
              </span>
            </div>
          </div>

          {/* Dedicated Settings, Benchmark Presets & Clean Slate Button */}
          {onOpenProfileModal && (
            <button
              id="btn-header-profile-cleanslate"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Settings, Benchmark Presets & Clean Slate"
            >
              <Settings className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="hidden xl:inline">Settings</span>
            </button>
          )}

          {/* Master Access & Governance Switch Button */}
          {onOpenMasterAccessGate && (
            <button
              id="btn-header-access-gate"
              onClick={onOpenMasterAccessGate}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                isMasterDeveloper
                  ? "bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 shadow-2xs"
                  : accessLevel === "team_operator"
                  ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 shadow-2xs"
                  : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 shadow-2xs"
              }`}
              title="Workspace Role & View Switcher (Direct Access)"
            >
              {isMasterDeveloper ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="hidden sm:inline">Founder</span>
                </>
              ) : accessLevel === "team_operator" ? (
                <>
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="hidden sm:inline">Operator</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Client</span>
                </>
              )}
            </button>
          )}

          {/* White-Label Quick Studio Button (Master Developer Only) */}
          {isMasterDeveloper && onOpenWhiteLabel && (
            <button
              id="btn-header-whitelabel"
              onClick={onOpenWhiteLabel}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold border border-purple-200 dark:border-purple-800/60 transition-colors whitespace-nowrap shrink-0"
              title="Open White-Label & Custom Branding Studio"
            >
              <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>White-Label</span>
            </button>
          )}

          {/* Developer Monetization Quick Button (Master Developer Only) */}
          {isMasterDeveloper && onOpenMonetization && (
            <button
              id="btn-header-monetization"
              onClick={onOpenMonetization}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-colors whitespace-nowrap shrink-0"
              title="Open Developer Monetization & Profit Engine"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Monetization</span>
            </button>
          )}

          {/* Legal Governance & Terms Button */}
          {onOpenLegal && (
            <button
              id="btn-header-legal"
              onClick={onOpenLegal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60 transition-colors whitespace-nowrap shrink-0"
              title="Open Terms of Service & Enterprise Legal Governance Center"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Terms & Legal</span>
            </button>
          )}

          {/* Workplace Zone Global Theme Switcher */}
          <div className="relative shrink-0" ref={themePickerRef}>
            <button
              id="btn-header-workplace-theme"
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs active:scale-95 whitespace-nowrap shrink-0 ${activeTheme.colors.accentBorder} bg-slate-900/80 hover:bg-slate-800 text-slate-100`}
              title={`Active Zone Theme: ${activeTheme.name}. Click to change global app theme.`}
            >
              <span className="text-sm">{activeTheme.emoji}</span>
              <span 
                className="w-2 h-2 rounded-full animate-pulse shrink-0" 
                style={{ backgroundColor: activeTheme.colors.primary }}
              />
              <span className={`hidden md:inline font-bold ${activeTheme.colors.accentText}`}>
                {activeTheme.shortName}
              </span>
              <span className="md:hidden font-bold">Theme</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showThemePicker ? "rotate-180" : ""}`} />
            </button>

            {/* Theme Picker Dropdown Menu */}
            {showThemePicker && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">Workplace Zone Themes</h4>
                      <p className="text-[10px] text-slate-400">Atmospheric theme, glows & ambient buffs for entire app</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {ALL_WORKPLACE_THEMES.length} Zones
                  </span>
                </div>

                {/* Theme Cards List */}
                <div className="py-2.5 space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {ALL_WORKPLACE_THEMES.map((theme) => {
                    const isSelected = theme.id === activeWorkplaceThemeId;
                    return (
                      <button
                        key={theme.id}
                        id={`btn-theme-select-${theme.id}`}
                        onClick={() => {
                          onSelectWorkplaceTheme?.(theme.id);
                          setShowThemePicker(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 group ${
                          isSelected
                            ? `${theme.colors.accentBorderStrong} ${theme.colors.cardBg} ${theme.colors.accentGlow}`
                            : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700"
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border border-white/10"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.primary}25, ${theme.colors.secondary}15)`,
                          }}
                        >
                          {theme.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-xs font-bold truncate ${isSelected ? theme.colors.accentText : "text-slate-200 group-hover:text-white"}`}>
                                {theme.name}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${theme.colors.badgeBg} ${theme.colors.badgeText} border ${theme.colors.badgeBorder} shrink-0`}>
                                <Check className="w-2.5 h-2.5" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 shrink-0">
                                {theme.category === "workplace" ? "Workplace" : "Chill Spot"}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {theme.tagline}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800/60">
                            <span className="text-[9px] font-medium text-slate-400">
                              ⚡ <strong className="text-slate-300">{theme.buffMultiplier}</strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shadow-xs" 
                                style={{ backgroundColor: theme.colors.primary }}
                                title="Primary"
                              />
                              <span 
                                className="w-2.5 h-2.5 rounded-full shadow-xs" 
                                style={{ backgroundColor: theme.colors.secondary }}
                                title="Secondary"
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Theme Studio Launcher in Dropdown */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    id="btn-open-theme-studio-from-header"
                    onClick={() => {
                      setShowThemePicker(false);
                      setIsThemeStudioOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Theme Studio & Environmental Aura</span>
                  </button>
                </div>

                {/* Ambient Soundscape Quick Controller */}
                {onToggleZoneAudio && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Radio className={`w-3.5 h-3.5 ${isPlayingZoneAudio ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-[11px] text-slate-300 truncate">
                        {activeTheme.ambientTrackTitle}
                      </span>
                    </div>
                    <button
                      onClick={onToggleZoneAudio}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${
                        isPlayingZoneAudio 
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                      }`}
                    >
                      {isPlayingZoneAudio ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Mute</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Soundscape</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Data Button */}
          {onOpenExport && (
            <button
              id="btn-header-export"
              onClick={onOpenExport}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Export workspace, audit logs CSV, and executive reports"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Save States & Workspace Snapshot button */}
          {onOpenSaveStates && (
            <button
              id="btn-header-save-states"
              onClick={onOpenSaveStates}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Manage save states, snapshots, and backups"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Snapshots</span>
            </button>
          )}

          {/* Focus Task HUD toggle button */}
          {onToggleFocusHUD && (
            <button
              id="btn-header-focus-hud"
              onClick={onToggleFocusHUD}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Toggle Focus Task Checklist HUD"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Task HUD</span>
            </button>
          )}

          {/* Quick Task Agent button - Direct prompt-to-generation UX */}
          <button
            id="btn-quick-task"
            onClick={onQuickTask}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/30 transition-all shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
            title="Type a natural language prompt and get an instant generation from any agent"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="hidden sm:inline">Prompt Agent</span>
            <span className="sm:hidden">Prompt</span>
          </button>

          {/* Create Agent CTA (Master Developer Only) or Client Fleet Mode Badge */}
          {isMasterDeveloper ? (
            <button
              id="btn-create-agent"
              onClick={onCreateAgent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all active:scale-95 hover:opacity-95 whitespace-nowrap shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Build Agent</span>
              <span className="sm:hidden">Build</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold whitespace-nowrap shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{activeAgentsCount} Agents</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative shrink-0">
            <button
              id="btn-header-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    Activity Feed & Alerts
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium cursor-pointer" onClick={() => setShowNotifications(false)}>
                    Dismiss
                  </span>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {recentAlerts.map((alert) => {
                    const Icon = alert.icon;
                    return (
                      <div key={alert.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex gap-2.5 items-start">
                        <div className={`p-1.5 rounded-md ${alert.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 text-xs min-w-0">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {alert.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {alert.desc}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {alert.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {enableGamification && (
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenGamification();
                    }}
                    className="w-full mt-2 py-1.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <span>View All Quests & Rewards</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Theme Studio & Aura Customizer Modal */}
      {isThemeStudioOpen && (
        <ThemeStudioModal
          isOpen={isThemeStudioOpen}
          onClose={() => setIsThemeStudioOpen(false)}
          activeThemeId={activeWorkplaceThemeId || "stage-war-room"}
          onSelectTheme={(themeId) => {
            onSelectWorkplaceTheme?.(themeId);
          }}
          isPlayingAudio={isPlayingZoneAudio}
          onToggleAudio={onToggleZoneAudio}
        />
      )}
    </div>
  );
};
