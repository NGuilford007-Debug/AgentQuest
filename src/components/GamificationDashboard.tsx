import React, { useState } from "react";
import { Badge, EmployeeProfile, GamifiedMilestone, Quest } from "../types";
import { INITIAL_GAMIFIED_MILESTONES } from "../data/gamifiedMilestones";
import { 
  Trophy, 
  Award, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  Lock, 
  ShieldCheck, 
  BookmarkCheck, 
  Sparkles,
  ChevronRight,
  Check,
  Milestone as MilestoneIcon,
  Crown,
  Layers,
  ArrowRight,
  User,
  RotateCcw,
  Bot,
  DollarSign,
  Workflow,
  FolderOpen,
  Cpu,
  BarChart3,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface GamificationDashboardProps {
  userProfile: EmployeeProfile;
  onClaimQuest?: (questId: string) => void;
  onRefreshQuests?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAutomationsVault?: () => void;
  onOpenAgentBuilder?: () => void;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userProfile,
  onClaimQuest,
  onOpenProfileModal,
  onOpenAutomationsVault,
  onOpenAgentBuilder,
}) => {
  const [activeTab, setActiveTab] = useState<"milestones" | "achievements" | "capabilities">("milestones");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activePhaseFilter, setActivePhaseFilter] = useState<string>("all");
  const [activeAchievementFilter, setActiveAchievementFilter] = useState<string>("all");

  // Dynamically compute milestones from live user profile metrics so clean slate shows 0 progress
  const milestones: GamifiedMilestone[] = React.useMemo(() => {
    return INITIAL_GAMIFIED_MILESTONES.map((ms) => {
      let currentValue = ms.currentValue;
      if (ms.category === "impact" || ms.metricLabel.includes("hours")) {
        currentValue = Math.min(ms.targetValue, userProfile.hoursSavedTotal || 0);
      } else if (ms.category === "automations" || ms.metricLabel.includes("playbook")) {
        currentValue = Math.min(ms.targetValue, userProfile.approvedAutomationsCount || 0);
      } else if (ms.metricLabel.includes("OpEx") || ms.metricLabel.includes("$")) {
        currentValue = Math.min(ms.targetValue, userProfile.costSavedUsd || 0);
      } else if (ms.metricLabel.includes("active agents")) {
        currentValue = userProfile.hoursSavedTotal === 0 && userProfile.approvedAutomationsCount === 0 ? 0 : ms.currentValue;
      }
      const completed = currentValue >= ms.targetValue;
      return {
        ...ms,
        currentValue,
        completed,
      };
    });
  }, [userProfile]);

  const completedMilestonesCount = milestones.filter((m) => m.completed).length;
  const totalMilestonesCount = milestones.length;
  const progressRatio = Math.round((completedMilestonesCount / totalMilestonesCount) * 100);

  const filteredMilestones = milestones.filter((ms) => {
    if (activePhaseFilter === "all") return true;
    if (activePhaseFilter === "completed") return ms.completed;
    if (activePhaseFilter === "in_progress") return !ms.completed;
    return ms.tier === activePhaseFilter;
  });

  const filteredAchievements = userProfile.badges.filter((b) => {
    if (activeAchievementFilter === "all") return true;
    if (activeAchievementFilter === "unlocked") return Boolean(b.unlockedAt);
    if (activeAchievementFilter === "locked") return !b.unlockedAt;
    if (activeAchievementFilter === "automation") return b.category === "automation" || b.achievementType === "approved_automation";
    if (activeAchievementFilter === "governance") return b.category === "governance";
    return true;
  });

  const autonomousCapabilities = [
    {
      id: "cap-1",
      title: "Resilient Multi-Model Dynamic Failover",
      description: "Sub-50ms automatic fallback cascade across Gemini models to guarantee 99.9% uptime.",
      status: "Active & Operational",
      icon: Cpu,
      category: "Infrastructure",
      impact: "Zero workflow interruption during high-demand spikes",
    },
    {
      id: "cap-2",
      title: "Approved Automations Vault Storage",
      description: "Standardized repository of vetted agent outputs that re-execute with single-click precision.",
      status: "Active & Operational",
      icon: BookmarkCheck,
      category: "Knowledge",
      impact: "$2,400/yr saved per standardized procedure",
    },
    {
      id: "cap-3",
      title: "Human-in-the-Loop Governance Gateways",
      description: "Policy verification and SOC2 compliance checks before financial or production actions execute.",
      status: "Active & Operational",
      icon: ShieldCheck,
      category: "Governance",
      impact: "100% compliance with zero PII data leaks",
    },
    {
      id: "cap-4",
      title: "Multi-Node Conditional Logic Pipelines",
      description: "Visual workflow studio connecting triggers, LLM intelligence, logic branching, and webhooks.",
      status: "Active & Operational",
      icon: Workflow,
      category: "Automation",
      impact: "Eliminates multi-step human routing delays",
    },
    {
      id: "cap-5",
      title: "White-Label Multi-Tenant SaaS Engine",
      description: "Custom branding, CNAME domain mapping, and per-tenant metered token monetization.",
      status: "Active & Operational",
      icon: DollarSign,
      category: "Monetization",
      impact: "Direct recurring revenue stream from client workspaces",
    },
    {
      id: "cap-6",
      title: "Cross-Department Autonomous Mesh",
      description: "Inter-agent communication coordinating DevOps, Sales, Support, Finance, and Marketing.",
      status: "Scaling Phase",
      icon: Layers,
      category: "Enterprise",
      impact: "Self-running business engine without department silos",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* EXECUTIVE CONTROL ROOM HERO BANNER */}
      <div className="rounded-2xl p-6 md:p-8 bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle executive grid accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Autonomous Engine Active
              </span>
              <span className="text-xs text-slate-400">
                Business-in-a-Box Roadmap
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Company Milestones & Automations
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Tracking operational progress toward a fully autonomous, self-running business in a box. 
              Liberating manual toil, vetting approved playbooks, and eliminating corporate operating expenses.
            </p>

            {/* Strategic Phase Progress */}
            <div className="pt-2 flex items-center gap-4">
              <div className="w-48 sm:w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {completedMilestonesCount}/{totalMilestonesCount} Strategic Goals ({progressRatio}%)
              </span>
            </div>
          </div>

          {/* Executive Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Autonomy Ratio</span>
              </div>
              <div className="text-xl font-bold text-white">{userProfile.autonomousRunRatio ?? 0}%</div>
              <div className="text-[10px] text-slate-400">Hands-Off Execution</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>OpEx Replaced</span>
              </div>
              <div className="text-xl font-bold text-white">${(userProfile.costSavedUsd ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">Labor Cost Eliminated</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Hours Liberated</span>
              </div>
              <div className="text-xl font-bold text-white">{(userProfile.hoursSavedTotal ?? 0).toFixed(1)}h</div>
              <div className="text-[10px] text-slate-400">Engineering & Staff Time</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold mb-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Vault Playbooks</span>
              </div>
              <div className="text-xl font-bold text-white">{userProfile.approvedAutomationsCount ?? 0}</div>
              <div className="text-[10px] text-slate-400">Approved in Production</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "milestones"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <MilestoneIcon className="w-4 h-4" />
            <span>Company Milestones ({completedMilestonesCount}/{totalMilestonesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "achievements"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Approved Automation Achievements ({userProfile.badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("capabilities")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "capabilities"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Autonomous Engine Capabilities</span>
          </button>
        </div>

        {onOpenProfileModal && (
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            <span>Operator Settings & Clean Slate</span>
          </button>
        )}
      </div>

      {/* TAB 1: COMPANY STRATEGIC MILESTONES */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enterprise Scaling Milestones
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Core phases for transforming operational overhead into a self-executing autonomous machine.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Phases" },
                { id: "completed", label: "Verified" },
                { id: "in_progress", label: "In Progress" },
                { id: "tier_1", label: "Phase 1: Foundation" },
                { id: "tier_2", label: "Phase 2: Acceleration" },
                { id: "tier_3", label: "Phase 3: OpEx" },
                { id: "tier_4", label: "Phase 4: Mesh" },
                { id: "tier_5", label: "Phase 5: Self-Running" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActivePhaseFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activePhaseFilter === filter.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Milestones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMilestones.map((ms) => {
              const progressPercent = Math.min(100, Math.round((ms.currentValue / ms.targetValue) * 100));

              return (
                <div
                  key={ms.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    ms.completed
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Phase badge & status */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {ms.tierName}
                      </span>
                      {ms.completed ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Icon */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          ms.completed
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <DynamicIcon name={ms.iconName} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {ms.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {ms.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ms.description}
                    </p>

                    {/* Business Impact Box */}
                    {ms.businessImpact && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-0.5">
                        <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Business Impact:</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                          {ms.businessImpact}
                        </div>
                      </div>
                    )}

                    {/* Operational Capability */}
                    {ms.operationalCapability && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-500" />
                          <span>Capability Unlocked:</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {ms.operationalCapability}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">Benchmark Progress</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {ms.currentValue} / {ms.targetValue} {ms.metricLabel} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ms.completed ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{ms.completed ? `Verified: ${ms.unlockedAt || "Active"}` : "Operational Target"}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {ms.completed ? "100% Attained" : `${ms.targetValue - ms.currentValue} remaining`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: APPROVED AUTOMATION ACHIEVEMENTS */}
      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Approved Automations & Operational Milestones
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional accomplishments verified and locked into the company's autonomous playbook vault.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Achievements" },
                { id: "unlocked", label: "Unlocked in Vault" },
                { id: "locked", label: "In Progress" },
                { id: "automation", label: "Automations" },
                { id: "governance", label: "Governance" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveAchievementFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeAchievementFilter === filter.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((badge) => {
              const isUnlocked = Boolean(badge.unlockedAt);
              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isUnlocked
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {badge.category}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          {badge.progress}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                          isUnlocked
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        <DynamicIcon name={badge.iconName} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {badge.title}
                        </h3>
                        {badge.targetMetric && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                            Target: {badge.targetMetric}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {badge.description}
                    </p>

                    {badge.businessImpact && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span>Financial & Operational Value:</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {badge.businessImpact}
                        </div>
                      </div>
                    )}

                    {badge.associatedPlaybook && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <BookmarkCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Vault Link: <strong>{badge.associatedPlaybook}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{isUnlocked ? `Stored: ${badge.unlockedAt}` : "Benchmark in Progress"}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUTONOMOUS ENGINE CAPABILITIES */}
      {activeTab === "capabilities" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Autonomous Fleet Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Core structural capabilities powering hands-off, self-executing business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autonomousCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {cap.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{cap.status}</span>
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {cap.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {cap.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Operational Impact:
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {cap.impact}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR SELECTED BADGE / ACHIEVEMENT */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 uppercase">
                {selectedBadge.category} Achievement
              </span>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <DynamicIcon name={selectedBadge.iconName} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedBadge.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedBadge.unlockedAt ? `Unlocked: ${selectedBadge.unlockedAt}` : `Progress: ${selectedBadge.progress}%`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedBadge.description}
            </p>

            {selectedBadge.businessImpact && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Bottom-Line Business Value:
                </span>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                  {selectedBadge.businessImpact}
                </p>
              </div>
            )}

            {selectedBadge.targetMetric && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500">Benchmark Target: </span>
                <strong className="text-slate-900 dark:text-slate-100">{selectedBadge.targetMetric}</strong>
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Close Achievement Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
