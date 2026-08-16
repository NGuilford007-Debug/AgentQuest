import React, { useState } from "react";
import { EmployeeProfile, WhiteLabelConfig } from "../types";
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Bell, 
  ChevronRight, 
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
  DollarSign
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

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
  isAutoSaving?: boolean;
  lastSavedTime?: string;
  whiteLabelConfig?: WhiteLabelConfig;
  onToggleClientPreview?: () => void;
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
  isAutoSaving = false,
  lastSavedTime,
  whiteLabelConfig,
  onToggleClientPreview,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const brandName = whiteLabelConfig?.brandName || "AgentFlow";
  const companyName = whiteLabelConfig?.companyName || "Autonomous Multi-Agent Workspace";
  const primaryColor = whiteLabelConfig?.primaryColor || "#3b82f6";
  const enableGamification = whiteLabelConfig?.featureToggles.enableGamification !== false;

  const xpProgressPercent = Math.min(
    100,
    Math.round(
      ((userProfile.xp - (userProfile.nextLevelXp - 5500)) / 5500) * 100
    )
  );

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
            <span>
              <strong>Client Preview Mode Active:</strong> Viewing white-labeled portal as <em>{brandName}</em> ({whiteLabelConfig.customDomain})
            </span>
          </div>
          {onToggleClientPreview && (
            <button
              onClick={onToggleClientPreview}
              className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3" />
              <span>Exit Preview</span>
            </button>
          )}
        </div>
      )}

      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between transition-colors">
        {/* Brand & Active status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden"
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
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  {brandName}
                </span>
                <span 
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
                {companyName}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {/* Live Health Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeAgentsCount} Agents Operational</span>
          </div>

          {/* Auto-Save Status Indicator */}
          <div 
            onClick={onOpenSaveStates}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Continuous local auto-save is active. Click to manage checkpoints."
          >
            {isAutoSaving ? (
              <>
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Auto-saving...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-slate-500 dark:text-slate-400">
                  {lastSavedTime ? `Saved at ${lastSavedTime}` : "Auto-saved"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Gamification Bar & User Hub */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Streak Flame Pill (if gamification enabled) */}
          {enableGamification && (
            <div 
              onClick={onOpenGamification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-xs"
              title={`${userProfile.streakDays} Day Automation Streak (${userProfile.streakMultiplier}x XP Multiplier)`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>{userProfile.streakDays}d Streak</span>
              <span className="text-[10px] px-1 py-0.2 bg-amber-200/80 dark:bg-amber-800/80 rounded text-amber-900 dark:text-amber-100 font-bold">
                {userProfile.streakMultiplier}x
              </span>
            </div>
          )}

          {/* Level & XP Widget (if gamification enabled) */}
          {enableGamification && (
            <div 
              onClick={onOpenGamification}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
            >
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Lv. {userProfile.level}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">
                    ({userProfile.xp.toLocaleString()} XP)
                  </span>
                </div>
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(12, xpProgressPercent)}%`, backgroundColor: primaryColor }}
                  />
                </div>
              </div>
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-8 h-8 rounded-full border border-blue-500/30 object-cover"
              />
            </div>
          )}

          {/* White-Label Quick Studio Button */}
          {onOpenWhiteLabel && (
            <button
              id="btn-header-whitelabel"
              onClick={onOpenWhiteLabel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold border border-purple-200 dark:border-purple-800/60 transition-colors"
              title="Open White-Label & Custom Branding Studio"
            >
              <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden md:inline">White-Label</span>
            </button>
          )}

          {/* Developer Monetization Quick Button */}
          {onOpenMonetization && (
            <button
              id="btn-header-monetization"
              onClick={onOpenMonetization}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-colors"
              title="Open Developer Monetization & Profit Engine"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Monetization</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              id="btn-header-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
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
                        <div className={`p-1.5 rounded-md ${alert.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {alert.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    className="w-full mt-2 py-1.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View All Quests & Rewards</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Export Data Button */}
          {onOpenExport && (
            <button
              id="btn-header-export"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Export workspace, audit logs CSV, and executive reports"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Save States & Workspace Snapshot button */}
          {onOpenSaveStates && (
            <button
              id="btn-header-save-states"
              onClick={onOpenSaveStates}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Manage save states, snapshots, and backups (Ctrl+S)"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden lg:inline">Save States</span>
            </button>
          )}

          {/* Focus Task HUD toggle button */}
          {onToggleFocusHUD && (
            <button
              id="btn-header-focus-hud"
              onClick={onToggleFocusHUD}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Toggle Focus Task Checklist HUD"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>Task HUD</span>
            </button>
          )}

          {/* Quick Task Agent button */}
          <button
            id="btn-quick-task"
            onClick={onQuickTask}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Task Agent</span>
          </button>

          {/* Create Agent CTA */}
          <button
            id="btn-create-agent"
            onClick={onCreateAgent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-all active:scale-95 hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Build Agent</span>
          </button>
        </div>
      </header>
    </div>
  );
};


