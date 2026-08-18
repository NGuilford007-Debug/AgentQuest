import React, { useState } from "react";
import { Badge, EmployeeProfile, GamifiedMilestone, Quest } from "../types";
import { INITIAL_GAMIFIED_MILESTONES } from "../data/gamifiedMilestones";
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  Lock, 
  ShieldCheck, 
  Gift, 
  Star,
  ChevronRight,
  Check,
  Milestone as MilestoneIcon,
  Crown,
  Layers,
  ArrowRight,
  PartyPopper,
  User,
  RotateCcw
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { fireCelebration, fireLevelUp } from "../utils/confetti";

interface GamificationDashboardProps {
  userProfile: EmployeeProfile;
  onClaimQuest: (questId: string) => void;
  onRefreshQuests?: () => void;
  onOpenProfileModal?: () => void;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userProfile,
  onClaimQuest,
  onOpenProfileModal,
}) => {
  const [activeBadgeTab, setActiveBadgeTab] = useState<string>("all");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [milestones, setMilestones] = useState<GamifiedMilestone[]>(INITIAL_GAMIFIED_MILESTONES);
  const [activeMilestoneTier, setActiveMilestoneTier] = useState<string>("all");
  const [claimedRewardPopup, setClaimedRewardPopup] = useState<string | null>(null);

  const xpProgressPercent = Math.min(
    100,
    Math.round(
      ((userProfile.xp - (userProfile.nextLevelXp - 5500)) / 5500) * 100
    )
  );

  const handleClaim = (quest: Quest) => {
    onClaimQuest(quest.id);
    fireCelebration();
  };

  const handleClaimMilestone = (msId: string) => {
    setMilestones((prev) =>
      prev.map((ms) => {
        if (ms.id === msId) {
          return {
            ...ms,
            claimed: true,
            unlockedAt: new Date().toISOString().split("T")[0],
          };
        }
        return ms;
      })
    );
    const targetMs = milestones.find((m) => m.id === msId);
    if (targetMs) {
      setClaimedRewardPopup(`+${targetMs.xpReward.toLocaleString()} XP & Perk: ${targetMs.perkReward}`);
      setTimeout(() => setClaimedRewardPopup(null), 4000);
    }
    fireCelebration();
  };

  const filteredBadges = userProfile.badges.filter((b) => {
    if (activeBadgeTab === "all") return true;
    if (activeBadgeTab === "unlocked") return Boolean(b.unlockedAt);
    if (activeBadgeTab === "locked") return !b.unlockedAt;
    return b.rarity === activeBadgeTab;
  });

  const filteredMilestones = milestones.filter((ms) => {
    if (activeMilestoneTier === "all") return true;
    if (activeMilestoneTier === "ready") return ms.completed && !ms.claimed;
    if (activeMilestoneTier === "claimed") return ms.claimed;
    if (activeMilestoneTier === "in_progress") return !ms.completed;
    return ms.tier === activeMilestoneTier;
  });

  const totalMilestonesCount = milestones.length;
  const completedMilestonesCount = milestones.filter((m) => m.completed).length;
  const claimableMilestonesCount = milestones.filter((m) => m.completed && !m.claimed).length;
  const totalXpClaimed = milestones
    .filter((m) => m.claimed)
    .reduce((acc, curr) => acc + curr.xpReward, 0);

  const levelPerks = [
    { level: 5, title: "Shadow Mode Simulation Sandbox", unlocked: userProfile.level >= 5 },
    { level: 10, title: "Multi-Agent Parallel Chaining", unlocked: userProfile.level >= 10 },
    { level: 14, title: "Turbo 1.35x Multiplier Boost", unlocked: userProfile.level >= 14 },
    { level: 18, title: "Enterprise Executive AI Council Crown", unlocked: userProfile.level >= 18 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* HERO LEVEL & STATS BANNER */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/30 object-cover shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-sm">
                Lv. {userProfile.level}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  {userProfile.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-semibold backdrop-blur-xs">
                  {userProfile.levelTitle}
                </span>
                {onOpenProfileModal && (
                  <button
                    id="btn-gamification-open-profile"
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition-all border border-white/30 backdrop-blur-xs cursor-pointer shadow-xs"
                    title="Edit profile identity or start with a clean slate"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-300" />
                    <span>Profile & Clean Slate</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-white/80 mt-1">
                {userProfile.role} • {userProfile.department}
              </p>

              {/* XP Progress bar */}
              <div className="mt-3 w-64 sm:w-80">
                <div className="flex justify-between text-xs text-white/90 font-medium mb-1">
                  <span>Progress to Level {userProfile.level + 1}</span>
                  <span className="font-mono">{userProfile.xp.toLocaleString()} / {userProfile.nextLevelXp.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(8, xpProgressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-300 text-xs font-bold mb-1">
                <Flame className="w-4 h-4 fill-amber-300 animate-bounce" />
                <span>Streak</span>
              </div>
              <div className="text-lg font-extrabold">{userProfile.streakDays} Days</div>
              <div className="text-[10px] text-white/70">{userProfile.streakMultiplier}x Boost</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Time Saved</span>
              </div>
              <div className="text-lg font-extrabold">{userProfile.hoursSavedTotal}h</div>
              <div className="text-[10px] text-white/70">Autonomous Toil</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-300 text-xs font-bold mb-1">
                <Zap className="w-4 h-4" />
                <span>Automations</span>
              </div>
              <div className="text-lg font-extrabold">{userProfile.tasksAutomatedTotal}</div>
              <div className="text-[10px] text-white/70">Tasks Dispatched</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-300 text-xs font-bold mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Cost Impact</span>
              </div>
              <div className="text-lg font-extrabold">${(userProfile.costSavedUsd / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-white/70">Enterprise Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY QUESTS & WEEKLY SPRINT BOUNTIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quests Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Quests & Weekly Sprints
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Reset every 24 hours
            </span>
          </div>

          <div className="space-y-3">
            {userProfile.quests.map((quest) => {
              const isReadyToClaim = quest.completed && !quest.claimed;
              const isClaimed = quest.claimed;
              const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isClaimed
                      ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60"
                      : isReadyToClaim
                      ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-md ring-1 ring-emerald-400/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isClaimed
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          : isReadyToClaim
                          ? "bg-emerald-500 text-white"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      <DynamicIcon name={quest.iconName} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {quest.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            quest.category === "daily"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                              : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                          }`}
                        >
                          {quest.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {quest.description}
                      </p>

                      {/* Progress meter */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isReadyToClaim || isClaimed
                                ? "bg-emerald-500"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {quest.current} / {quest.target} {quest.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Claim Button / Status */}
                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+{quest.xpReward} XP</span>
                      </span>
                    </div>

                    {isClaimed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Claimed</span>
                      </span>
                    ) : isReadyToClaim ? (
                      <button
                        onClick={() => handleClaim(quest)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Award className="w-4 h-4" />
                        <span>Claim Reward</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Progression Perks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Enterprise Level Perks
            </h2>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
            {levelPerks.map((perk) => (
              <div
                key={perk.level}
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  perk.unlocked
                    ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80"
                    : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    perk.unlocked
                      ? "bg-blue-600 text-white"
                      : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Lv.{perk.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {perk.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {perk.unlocked ? "Unlocked & Active" : "Locked (Reach Level " + perk.level + ")"}
                  </div>
                </div>
                {perk.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING REWARD CLAIMED NOTIFICATION POPUP */}
      {claimedRewardPopup && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-2 rounded-xl bg-white/20">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold">Milestone Perk Unlocked!</div>
            <div className="text-[11px] text-white/90">{claimedRewardPopup}</div>
          </div>
        </div>
      )}

      {/* GAMIFIED MILESTONES PROGRESSION ROADMAP */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MilestoneIcon className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enterprise Gamified Milestones & Perks ({completedMilestonesCount}/{totalMilestonesCount})
              </h2>
              {claimableMilestonesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold animate-pulse">
                  {claimableMilestonesCount} Ready to Claim!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unlock exclusive AI superpowers, multiplier boosts, and sandbox sandboxes by hitting enterprise targets.
            </p>
          </div>

          {/* Tier & Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Tiers" },
              { id: "ready", label: "Ready to Claim", count: claimableMilestonesCount },
              { id: "tier_1", label: "Tier 1: Rookie" },
              { id: "tier_2", label: "Tier 2: Alchemist" },
              { id: "tier_3", label: "Tier 3: Maestro" },
              { id: "tier_4", label: "Tier 4: Commander" },
              { id: "tier_5", label: "Tier 5: Grandmaster" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMilestoneTier(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeMilestoneTier === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                {Boolean(tab.count) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-extrabold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Milestones Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMilestones.map((ms) => {
            const isCompleted = ms.completed;
            const isClaimed = ms.claimed;
            const isReady = isCompleted && !isClaimed;
            const progressPercent = Math.min(100, Math.round((ms.currentValue / ms.targetValue) * 100));

            return (
              <div
                key={ms.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isClaimed
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                    : isReady
                    ? "bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20"
                    : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Tier Badge & Reward Tag */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{ms.tierName} (Lv.{ms.tierLevel})</span>
                    </span>

                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>+{ms.xpReward.toLocaleString()} XP</span>
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isClaimed
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                          : isReady
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <DynamicIcon name={ms.iconName} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {ms.title}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                        {ms.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {ms.description}
                  </p>

                  {/* Unlockable Enterprise Perk Box */}
                  <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-500" />
                      <span>Perk Reward:</span>
                    </div>
                    <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 leading-tight">
                      {ms.perkReward}
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-500">Progress</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                        {ms.currentValue} / {ms.targetValue} {ms.metricLabel} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReady || isClaimed ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Claim Button / Status Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {isClaimed
                      ? `Unlocked ${ms.unlockedAt || "Active"}`
                      : isReady
                      ? "Target Achieved!"
                      : "In Progress"}
                  </span>

                  {isClaimed ? (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Perk Claimed</span>
                    </span>
                  ) : isReady ? (
                    <button
                      onClick={() => handleClaimMilestone(ms.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim Perk Reward</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACHIEVEMENT BADGES SHOWCASE */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Achievement Badges & Mastery ({userProfile.badges.length})
            </h2>
          </div>

          {/* Rarity Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "unlocked", "epic", "legendary"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveBadgeTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeBadgeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = Boolean(badge.unlockedAt);
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isUnlocked
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUnlocked
                      ? badge.rarity === "legendary"
                        ? "bg-gradient-to-tr from-amber-500 to-yellow-300 text-white"
                        : badge.rarity === "epic"
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-500 text-white"
                        : "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <DynamicIcon name={badge.iconName} className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {badge.title}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        badge.rarity === "legendary"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : badge.rarity === "epic"
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {badge.rarity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {badge.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      +{badge.xpReward} XP
                    </span>
                    <span>{isUnlocked ? `Unlocked ${badge.unlockedAt}` : `${badge.progress}% Progress`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
