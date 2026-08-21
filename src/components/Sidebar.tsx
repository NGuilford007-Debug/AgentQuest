import React, { useState } from "react";
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
  Activity,
  Palette,
  DollarSign,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  Lock,
  Unlock,
  LayoutDashboard,
  FileText
} from "lucide-react";
import { WhiteLabelConfig } from "../types";

export type NavTab = 
  | "dashboard"
  | "agents" 
  | "health"
  | "workplaces"
  | "studio" 
  | "automations"
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
  automationsCount?: number;
  savedReportsCount?: number;
  whiteLabelConfig?: WhiteLabelConfig;
  isMasterDeveloper?: boolean;
  onOpenMasterAccessGate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  shortLabel?: string;
  category: "core" | "tools" | "enterprise";
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  badgeColor?: string;
  description: string;
  enabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewsCount,
  claimableQuestsCount,
  unhealthyAgentsCount = 0,
  totalAssetsCount = 0,
  automationsCount = 0,
  whiteLabelConfig,
  isMasterDeveloper = true,
  onOpenMasterAccessGate,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const toggles = whiteLabelConfig?.featureToggles;

  const allNavItems: NavItemConfig[] = [
    // CORE FLEET & EXECUTION
    {
      id: "dashboard",
      label: "Business Dashboard",
      shortLabel: "Dashboard",
      category: "core",
      icon: LayoutDashboard,
      badge: "ROI & MRR",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold",
      description: "Executive ROI, MRR potential, coverage & reports",
      enabled: true,
    },
    {
      id: "agents",
      label: "AI Agent Roster",
      shortLabel: "Agents",
      category: "core",
      icon: Bot,
      badge: null,
      description: "Manage & assign enterprise agents",
      enabled: true,
    },
    {
      id: "dispatcher",
      label: "Task Dispatcher",
      shortLabel: "Dispatch",
      category: "core",
      icon: PlayCircle,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} HITL` : null,
      badgeColor: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 animate-pulse",
      description: "Execute workflows with Gemini",
      enabled: true,
    },
    {
      id: "automations",
      label: "Automations Vault",
      shortLabel: "Vault",
      category: "core",
      icon: BookmarkCheck,
      badge: automationsCount > 0 ? `${automationsCount} Saved` : null,
      badgeColor: "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold",
      description: "Approved agent suggestions & playbooks",
      enabled: true,
    },
    {
      id: "studio",
      label: "Workflow Studio",
      shortLabel: "Studio",
      category: "core",
      icon: WorkflowIcon,
      badge: isMasterDeveloper ? "Canvas" : "Active",
      badgeColor: "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300",
      description: isMasterDeveloper ? "Visual drag-and-drop & logic branches" : "Pipeline inspection & test execution",
      enabled: true,
    },

    // TOOLS & INTELLIGENCE
    {
      id: "health",
      label: "Health & Diagnostics",
      shortLabel: "Health",
      category: "tools",
      icon: Activity,
      badge: unhealthyAgentsCount > 0 ? `${unhealthyAgentsCount} Alert${unhealthyAgentsCount > 1 ? "s" : ""}` : null,
      badgeColor: unhealthyAgentsCount > 0 
        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 animate-pulse" 
        : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300",
      description: "Failure rate & prompt diagnostics",
      enabled: toggles ? toggles.enableHealthDiagnostics : true,
    },
    {
      id: "workplaces",
      label: "Workplaces & Lounges",
      shortLabel: "Stages",
      category: "tools",
      icon: Coffee,
      badge: "6 Spots",
      badgeColor: "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300",
      description: "Digital workspaces & chill lounges",
      enabled: toggles ? toggles.enableWorkplaceStages : true,
    },
    {
      id: "assets",
      label: "Asset Gallery & Gen",
      shortLabel: "Assets",
      category: "tools",
      icon: Layers,
      badge: totalAssetsCount > 0 ? `${totalAssetsCount} Items` : null,
      badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold",
      description: "Apparel shirt designs, vector kits & specs",
      enabled: toggles ? toggles.enableAssetGallery : true,
    },
    {
      id: "permissions",
      label: "App & API Hub",
      shortLabel: "APIs",
      category: "tools",
      icon: ShieldCheck,
      badge: "Active",
      badgeColor: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold",
      description: "Google, SaaS, REST APIs & RBAC",
      enabled: true,
    },

    // ENTERPRISE & PERFORMANCE
    {
      id: "gamification",
      label: "Company Milestones",
      shortLabel: "Milestones",
      category: "enterprise",
      icon: Trophy,
      badge: "Roadmap",
      badgeColor: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold",
      description: "Approved automations & self-running roadmap",
      enabled: toggles ? toggles.enableGamification : true,
    },
    {
      id: "leaderboard",
      label: "Department Benchmarks",
      shortLabel: "Benchmarks",
      category: "enterprise",
      icon: Users2,
      badge: "OpEx",
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold",
      description: "Departmental efficiency & hours saved",
      enabled: toggles ? toggles.enableGamification : true,
    },
    {
      id: "analytics",
      label: "ROI & Operations",
      shortLabel: "ROI",
      category: "enterprise",
      icon: BarChart3,
      badge: null,
      description: "Hours saved & efficiency metrics",
      enabled: toggles ? toggles.enableRoiAnalytics : true,
    },
    {
      id: "whitelabel",
      label: "White-Label Studio",
      shortLabel: "Branding",
      category: "enterprise",
      icon: Palette,
      badge: "Tenant",
      badgeColor: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold",
      description: "Rebrand, custom domain, SaaS packaging",
      enabled: isMasterDeveloper,
    },
    {
      id: "monetization",
      label: isMasterDeveloper ? "Monetization & Stripe Hub" : "Agent Monetization & Payouts",
      shortLabel: "Revenue",
      category: "enterprise",
      icon: DollarSign,
      badge: "Stripe",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold",
      description: "Stripe Payables, agent sales, client payouts & forecasts",
      enabled: true,
    },
  ];

  const enabledItems = allNavItems.filter((i) => i.enabled);
  const filteredItems = searchQuery.trim()
    ? enabledItems.filter(
        (i) =>
          i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : enabledItems;

  const categories = [
    { key: "core" as const, title: "Execution Fleet" },
    { key: "tools" as const, title: "Tools & Workspace" },
    { key: "enterprise" as const, title: "Operations & Admin" },
  ];

  return (
    <aside
      className={`h-full flex flex-col justify-between shrink-0 select-none border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Header / Collapse Controller */}
      <div className="p-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace Tabs
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-semibold">
              {filteredItems.length}
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? "mx-auto" : ""
          }`}
          title={isCollapsed ? "Expand Sidebar (View All Labels)" : "Collapse Sidebar (Compact Icon Mode)"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search when expanded */}
      {!isCollapsed && (
        <div className="px-2.5 pt-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tabs..."
              className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Navigation Items Container - Guaranteed Web Page Bounds */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3">
        {categories.map((cat) => {
          const itemsInCat = filteredItems.filter((i) => i.category === cat.key);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {cat.title}
                </div>
              )}
              <div className="space-y-0.5">
                {itemsInCat.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={() => onSelectTab(item.id)}
                      title={`${item.label} — ${item.description}`}
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center px-1.5 py-2.5" : "justify-between px-2.5 py-2"
                      } rounded-xl text-left text-xs font-semibold transition-all group ${
                        isActive
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400"
                              : "bg-slate-200/60 dark:bg-slate-800 text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {!isCollapsed && (
                          <div className="truncate">
                            <span className="block truncate text-xs font-semibold">{item.label}</span>
                          </div>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight shrink-0 ml-1.5 ${
                            item.badgeColor || "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Access Mode Footer */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <button
          onClick={onOpenMasterAccessGate}
          className={`w-full p-2 rounded-xl border text-left flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } transition-all ${
            isMasterDeveloper
              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 hover:bg-purple-100"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          }`}
          title={isMasterDeveloper ? "Master Owner Mode (Click to manage)" : "Client Portal Mode (Click to manage)"}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                isMasterDeveloper ? "bg-purple-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {!isCollapsed && (
              <div className="truncate">
                <div className="text-[11px] font-bold leading-tight truncate">
                  {isMasterDeveloper ? "Master Owner" : "Client Portal"}
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                  {isMasterDeveloper ? "Full Admin Access" : "Execution Mode"}
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
              {isMasterDeveloper ? "OWNER" : "CLIENT"}
            </span>
          )}
        </button>

        {!isCollapsed && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center truncate">
            {whiteLabelConfig?.brandName || "AgentFlow Enterprise"} • v3.7
          </div>
        )}
      </div>
    </aside>
  );
};
