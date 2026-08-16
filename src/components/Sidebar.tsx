import React from "react";
import { 
  Bot, 
  Workflow as WorkflowIcon, 
  PlayCircle, 
  Trophy, 
  BarChart3, 
  ShieldCheck, 
  Users2, 
  Layers,
  Sparkles,
  Coffee,
  Building2,
  Activity,
  Palette,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { WhiteLabelConfig } from "../types";

export type NavTab = 
  | "agents" 
  | "health"
  | "workplaces"
  | "studio" 
  | "assets"
  | "dispatcher" 
  | "gamification" 
  | "leaderboard" 
  | "permissions" 
  | "analytics"
  | "whitelabel"
  | "monetization";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewsCount: number;
  claimableQuestsCount: number;
  unhealthyAgentsCount?: number;
  totalAssetsCount?: number;
  whiteLabelConfig?: WhiteLabelConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewsCount,
  claimableQuestsCount,
  unhealthyAgentsCount = 0,
  totalAssetsCount = 0,
  whiteLabelConfig,
}) => {
  const toggles = whiteLabelConfig?.featureToggles;

  const allNavItems = [
    {
      id: "agents" as NavTab,
      label: "AI Agent Roster",
      icon: Bot,
      badge: null,
      description: "Manage & assign enterprise agents",
      enabled: true,
    },
    {
      id: "health" as NavTab,
      label: "Agent Health & Diagnostics",
      icon: Activity,
      badge: unhealthyAgentsCount > 0 ? `${unhealthyAgentsCount} Alert${unhealthyAgentsCount > 1 ? "s" : ""}` : "Optimal",
      badgeColor: unhealthyAgentsCount > 0 
        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 animate-pulse" 
        : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300",
      description: "Failure rate & prompt diagnostics",
      enabled: toggles ? toggles.enableHealthDiagnostics : true,
    },
    {
      id: "workplaces" as NavTab,
      label: "Workplaces & Lounges",
      icon: Coffee,
      badge: "6 Spots",
      badgeColor: "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300",
      description: "Digital workspaces & chill lounges",
      enabled: toggles ? toggles.enableWorkplaceStages : true,
    },
    {
      id: "studio" as NavTab,
      label: "Workflow Studio",
      icon: WorkflowIcon,
      badge: "If/Else",
      badgeColor: "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300",
      description: "Visual drag-and-drop & logic branches",
      enabled: true,
    },
    {
      id: "assets" as NavTab,
      label: "Asset Gallery & Local Gen",
      icon: Layers,
      badge: totalAssetsCount > 0 ? `${totalAssetsCount} Items` : "Creative",
      badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold",
      description: "Apparel shirt designs, vector kits & specs",
      enabled: toggles ? toggles.enableAssetGallery : true,
    },
    {
      id: "dispatcher" as NavTab,
      label: "Task Dispatcher",
      icon: PlayCircle,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} HITL` : null,
      badgeColor: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 animate-pulse",
      description: "Execute workflows with Gemini",
      enabled: true,
    },
    {
      id: "gamification" as NavTab,
      label: "Gamified Hub",
      icon: Trophy,
      badge: claimableQuestsCount > 0 ? `${claimableQuestsCount} Ready` : null,
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
      description: "Quests, XP, Badges & Streaks",
      enabled: toggles ? toggles.enableGamification : true,
    },
    {
      id: "leaderboard" as NavTab,
      label: "Team Leaderboard",
      icon: Users2,
      badge: null,
      description: "Departmental productivity rankings",
      enabled: toggles ? toggles.enableGamification : true,
    },
    {
      id: "permissions" as NavTab,
      label: "App & API Access Hub",
      icon: ShieldCheck,
      badge: "Connected",
      badgeColor: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold",
      description: "Google, SaaS, REST APIs & RBAC",
      enabled: true,
    },
    {
      id: "analytics" as NavTab,
      label: "ROI & Operations",
      icon: BarChart3,
      badge: null,
      description: "Hours saved & efficiency metrics",
      enabled: toggles ? toggles.enableRoiAnalytics : true,
    },
    {
      id: "whitelabel" as NavTab,
      label: "White-Label & Branding",
      icon: Palette,
      badge: "Commercial",
      badgeColor: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold",
      description: "Rebrand, custom domain, SaaS packaging",
      enabled: true,
    },
    {
      id: "monetization" as NavTab,
      label: "Developer Monetization",
      icon: DollarSign,
      badge: "Stripe + Projections",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold",
      description: "Stripe Payables & Receivables, margins & forecasts",
      enabled: true,
    },
  ];

  const navItems = allNavItems.filter((i) => i.enabled);

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all group ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gamified Mini Tip Banner or White-Label Footer */}
      {toggles?.enableGamification !== false ? (
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Productivity Multiplier</span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
            Automate 3 workflows today to maintain your <strong>1.35x XP streak boost</strong>!
          </p>
        </div>
      ) : (
        <div className="p-3 m-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{whiteLabelConfig?.brandName || "Enterprise Workspace"}</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            {whiteLabelConfig?.customDomain || "Single-Tenant Deployment"}
          </p>
        </div>
      )}
    </aside>
  );
};

