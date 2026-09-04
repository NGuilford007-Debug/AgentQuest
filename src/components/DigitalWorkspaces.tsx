import React, { useState, useEffect, useRef } from "react";
import { 
  WorkplaceStage, 
  Agent, 
  WorkplaceStageItem 
} from "../types";
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  Coffee, 
  Play, 
  Pause, 
  Sliders, 
  ShieldCheck, 
  Thermometer, 
  Activity, 
  Wind, 
  Users, 
  Bell, 
  TrendingUp, 
  Server, 
  Disc, 
  CheckCircle2, 
  Plus, 
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Cpu,
  Palette,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows,
  ChevronsUpDown
} from "lucide-react";
import { 
  startAmbientSound, 
  stopAmbientSound, 
  playInteractiveSound, 
  AmbientSoundType 
} from "../utils/audioSynth";
import { fireCelebration } from "../utils/confetti";
import { getWorkplaceTheme } from "../utils/workplaceThemes";
import { ThemeStudioModal } from "./ThemeStudioModal";

interface DigitalWorkspacesProps {
  stages: WorkplaceStage[];
  agents: Agent[];
  onUpdateStages: (stages: WorkplaceStage[]) => void;
  onDispatchWithAgent: (agentId: string) => void;
  onRewardXP: (amount: number, hours?: number) => void;
  activeWorkplaceThemeId?: string;
  onSelectWorkplaceTheme?: (themeId: string) => void;
}

export const DigitalWorkspaces: React.FC<DigitalWorkspacesProps> = ({
  stages,
  agents,
  onUpdateStages,
  onDispatchWithAgent,
  onRewardXP,
  activeWorkplaceThemeId = "stage-war-room",
  onSelectWorkplaceTheme,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(activeWorkplaceThemeId || stages[0]?.id || "stage-war-room");
  const [filterCategory, setFilterCategory] = useState<"all" | "workplace" | "chill_spot">("all");
  
  // Ambient Sound State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.4);
  const [selectedSoundTrack, setSelectedSoundTrack] = useState<AmbientSoundType>("off");

  // Carousel & View Mode State for Stage Tabs
  const stageCarouselRef = useRef<HTMLDivElement>(null);
  const compactCarouselRef = useRef<HTMLDivElement>(null);
  const [stageViewMode, setStageViewMode] = useState<"cards" | "compact" | "grid">("cards");

  const scrollStages = (direction: "left" | "right") => {
    const targetRef = stageViewMode === "compact" ? compactCarouselRef.current : stageCarouselRef.current;
    if (targetRef) {
      const scrollAmount = direction === "left" ? -320 : 320;
      targetRef.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Floating notifications / interactive item feedback
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({});
  const [agentMoods, setAgentMoods] = useState<Record<string, string>>({});
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<Agent | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);

  const currentStage = stages.find((s) => s.id === selectedStageId) || stages[0];
  const isGlobalAppTheme = activeWorkplaceThemeId === currentStage?.id;
  const currentTheme = getWorkplaceTheme(currentStage?.id);

  // Auto-scroll active stage into view whenever selectedStageId changes
  useEffect(() => {
    const targetRef = stageViewMode === "compact" ? compactCarouselRef.current : stageCarouselRef.current;
    if (targetRef && currentStage) {
      const activeEl = targetRef.querySelector(`[data-stage-id="${currentStage.id}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedStageId, stageViewMode, currentStage]);

  // Sync ambient sound when switching stages or toggling play
  useEffect(() => {
    if (isPlayingAudio && currentStage) {
      startAmbientSound(currentStage.ambientTrack as AmbientSoundType, audioVolume);
      setSelectedSoundTrack(currentStage.ambientTrack as AmbientSoundType);
    } else {
      stopAmbientSound();
      setSelectedSoundTrack("off");
    }
    return () => {
      stopAmbientSound();
    };
  }, [selectedStageId, isPlayingAudio, audioVolume]);

  // Periodic thought bubble rotator for stationed agents
  useEffect(() => {
    if (!currentStage) return;
    const interval = setInterval(() => {
      const thoughts = currentStage.defaultThoughts;
      if (thoughts.length > 0) {
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        const stationedAgents = agents.filter((a) => currentStage.assignedAgentIds.includes(a.id));
        if (stationedAgents.length > 0) {
          const targetAgent = stationedAgents[Math.floor(Math.random() * stationedAgents.length)];
          setAgentThoughts((prev) => ({
            ...prev,
            [targetAgent.id]: randomThought,
          }));
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [currentStage, agents]);

  // Handle clicking interactive stage item (coffee bar, gong, server rack)
  const handleTriggerStageItem = (item: WorkplaceStageItem) => {
    if (item.soundEffectType) {
      playInteractiveSound(item.soundEffectType);
    } else {
      playInteractiveSound("chime");
    }

    fireCelebration();
    onRewardXP(item.xpReward);
    setActiveNotification(`✨ ${item.name} activated! ${item.bonusEffect} (+${item.xpReward} XP)`);

    // Temporary highlight
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  // Give agent a coffee / energy boost
  const handleBoostAgent = (agentId: string) => {
    playInteractiveSound("coffee");
    onRewardXP(50);
    setAgentMoods((prev) => ({
      ...prev,
      [agentId]: "⚡ Energy Boosted (100%)",
    }));
    setActiveNotification(`☕ Handed fresh roast to Agent! Latency reduced & granted +50 XP.`);
    setTimeout(() => setActiveNotification(null), 3500);
  };

  // Broadcast refreshments & morale boost to all agents in current stage
  const handleSendRefreshments = () => {
    playInteractiveSound("coffee");
    fireCelebration();
    onRewardXP(60);

    const targetAgents = agents.filter((a) => currentStage.assignedAgentIds.includes(a.id));
    if (targetAgents.length > 0) {
      setAgentMoods((prev) => {
        const next = { ...prev };
        targetAgents.forEach((a) => {
          next[a.id] = "⚡ Energy Boosted (100%)";
        });
        return next;
      });
      setActiveNotification(
        `☕ Fresh artisan refreshments & espresso served to ${targetAgents.length} agent${
          targetAgents.length > 1 ? "s" : ""
        } in ${currentStage.name}! Peak morale active & +60 XP earned!`
      );
    } else {
      setActiveNotification(
        `☕ Fresh artisan espresso & pastries brewed for ${currentStage.name}! Station an agent here to receive max focus buffs (+60 XP granted)!`
      );
    }
    setTimeout(() => setActiveNotification(null), 4000);
  };

  // Reassign agent to this stage
  const handleAssignAgentToCurrentStage = (agentId: string) => {
    const updatedStages = stages.map((s) => {
      if (s.id === currentStage.id) {
        if (!s.assignedAgentIds.includes(agentId)) {
          return { ...s, assignedAgentIds: [...s.assignedAgentIds, agentId] };
        }
        return s;
      } else {
        // Remove from other stages
        return {
          ...s,
          assignedAgentIds: s.assignedAgentIds.filter((id) => id !== agentId),
        };
      }
    });

    onUpdateStages(updatedStages);
    setIsAssignModalOpen(false);
    playInteractiveSound("chime");
    setActiveNotification(`🚀 Agent relocated to ${currentStage.name}!`);
    setTimeout(() => setActiveNotification(null), 3000);
  };

  // Remove agent from this stage
  const handleUnassignAgent = (agentId: string) => {
    const updatedStages = stages.map((s) =>
      s.id === currentStage.id
        ? { ...s, assignedAgentIds: s.assignedAgentIds.filter((id) => id !== agentId) }
        : s
    );
    onUpdateStages(updatedStages);
  };

  // Filtered stage list
  const filteredStages = stages.filter((s) => {
    if (filterCategory === "workplace") return s.category === "workplace";
    if (filterCategory === "chill_spot") return s.category === "chill_spot";
    return true;
  });

  const stationedAgents = agents.filter((a) => currentStage.assignedAgentIds.includes(a.id));
  const unassignedAgents = agents.filter((a) => !currentStage.assignedAgentIds.includes(a.id));

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-900 text-slate-100">
      {/* LEFT / TOP: Main Digital Stage Presentation & Canvas */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800/80 bg-slate-950">
        
        {/* Stage Selector Ribbon */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Stages:
            </span>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({stages.length})
              </button>
              <button
                onClick={() => setFilterCategory("workplace")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === "workplace"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Workplaces
              </button>
              <button
                onClick={() => setFilterCategory("chill_spot")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === "chill_spot"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Chill Spots
              </button>
            </div>

            {/* Quick Stage Jump Dropdown (Always Reachable) */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs ml-1 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Jump:</span>
              <select
                value={currentStage.id}
                onChange={(e) => {
                  setSelectedStageId(e.target.value);
                  playInteractiveSound("click");
                }}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer max-w-[130px] truncate"
                title="Direct stage selector"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.assignedAgentIds.length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Controls: Carousel navigation, View toggles & Ambient audio */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle & Carousel Scroll Arrows */}
            <div className="flex items-center gap-1 bg-slate-800/70 border border-slate-700/70 rounded-xl p-1 text-xs shrink-0">
              <button
                onClick={() => scrollStages("left")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
                title="Scroll stages left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollStages("right")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
                title="Scroll stages right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
              <button
                onClick={() => setStageViewMode("cards")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  stageViewMode === "cards"
                    ? "bg-slate-700 text-slate-100 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Cards Carousel view"
              >
                Carousel
              </button>
              <button
                onClick={() => setStageViewMode("compact")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  stageViewMode === "compact"
                    ? "bg-slate-700 text-slate-100 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Compact Tabs view"
              >
                Tabs
              </button>
              <button
                onClick={() => setStageViewMode("grid")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  stageViewMode === "grid"
                    ? "bg-slate-700 text-slate-100 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Full Grid view"
              >
                Grid
              </button>
            </div>

            {/* Ambient Soundscape Controls Header */}
            <div className="flex items-center gap-2 shrink-0 bg-slate-800/70 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs">
              <button
                onClick={() => {
                  setIsPlayingAudio(!isPlayingAudio);
                  if (!isPlayingAudio) {
                    playInteractiveSound("chime");
                  }
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold transition-all text-xs ${
                  isPlayingAudio
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                title="Toggle Ambient Audio Synthesis"
              >
                {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isPlayingAudio ? "Sound Live" : "Play Vibe"}</span>
              </button>

              {isPlayingAudio && (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-700">
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-14 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    title="Volume slider"
                  />
                  <span className="text-[10px] text-slate-400 w-5">
                    {Math.round(audioVolume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stage Tabs / Switcher Rendering (Adapts to stageViewMode) */}
        {stageViewMode === "compact" ? (
          /* Compact Tabs Bar (Guaranteed reachable and minimal height) */
          <div 
            ref={compactCarouselRef}
            className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {filteredStages.map((stage) => {
              const isSelected = stage.id === currentStage.id;
              const count = stage.assignedAgentIds.length;
              const isTheme = stage.id === activeWorkplaceThemeId;
              return (
                <button
                  key={stage.id}
                  id={`stage-compact-tab-${stage.id}`}
                  data-stage-id={stage.id}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    playInteractiveSound("click");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? `${stage.themeColor.border} bg-slate-800 text-white shadow-xs font-bold ring-1 ring-blue-500/50`
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">
                    {stage.category === "workplace" ? "🏢" : "☕"}
                  </span>
                  <span>{stage.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 text-slate-300 font-mono">
                    {count}
                  </span>
                  {isTheme && (
                    <span className="text-[8px] font-extrabold px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      Theme
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : stageViewMode === "grid" ? (
          /* Full Grid View */
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 border-b border-slate-800/60 bg-slate-900/30">
            {filteredStages.map((stage) => {
              const isSelected = stage.id === currentStage.id;
              const count = stage.assignedAgentIds.length;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    playInteractiveSound("click");
                  }}
                  className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                    isSelected
                      ? `${stage.themeColor.border} bg-slate-800/90 shadow-md ${stage.themeColor.glow}`
                      : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                        stage.category === "workplace"
                          ? "bg-cyan-950/70 text-cyan-400 border border-cyan-800/50"
                          : "bg-amber-950/70 text-amber-400 border border-amber-800/50"
                      }`}
                    >
                      {stage.category === "workplace" ? "Workplace" : "Chill Spot"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {stage.id === activeWorkplaceThemeId && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          Theme
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Users className="w-3 h-3" />
                        <span>{count}</span>
                      </div>
                    </div>
                  </div>

                  <h4 className={`text-xs font-bold truncate ${isSelected ? stage.themeColor.accent : "text-slate-200"}`}>
                    {stage.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {stage.focusRating}% Focus • {stage.ambientTrackTitle.split("&")[0]}
                  </p>

                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Cards Carousel View with Smooth Scrolling (Default, no squished or unreachable cards) */
          <div className="relative border-b border-slate-800/60 bg-slate-900/30">
            <div 
              ref={stageCarouselRef}
              className="p-4 flex gap-3 overflow-x-auto scroll-smooth no-scrollbar"
            >
              {filteredStages.map((stage) => {
                const isSelected = stage.id === currentStage.id;
                const count = stage.assignedAgentIds.length;
                return (
                  <button
                    key={stage.id}
                    id={`stage-card-${stage.id}`}
                    data-stage-id={stage.id}
                    onClick={() => {
                      setSelectedStageId(stage.id);
                      playInteractiveSound("click");
                    }}
                    className={`min-w-[210px] max-w-[250px] shrink-0 p-3.5 rounded-xl text-left border transition-all relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? `${stage.themeColor.border} bg-slate-800/90 shadow-md ${stage.themeColor.glow} ring-1 ring-blue-500/50`
                        : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                          stage.category === "workplace"
                            ? "bg-cyan-950/70 text-cyan-400 border border-cyan-800/50"
                            : "bg-amber-950/70 text-amber-400 border border-amber-800/50"
                        }`}
                      >
                        {stage.category === "workplace" ? "Workplace" : "Chill Spot"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {stage.id === activeWorkplaceThemeId && (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                            Theme
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Users className="w-3 h-3" />
                          <span>{count}</span>
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-xs font-bold truncate ${isSelected ? stage.themeColor.accent : "text-slate-200"}`}>
                      {stage.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {stage.focusRating}% Focus • {stage.ambientTrackTitle.split("&")[0]}
                    </p>

                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Notification Banner */}
        {activeNotification && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border border-blue-400/50 text-blue-100 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{activeNotification}</span>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="text-blue-300 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* DIGITAL STAGE ISOMETRIC / VIRTUAL WORKSPACE CANVAS */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <div className={`flex-1 rounded-2xl border ${currentStage.themeColor.border} relative overflow-hidden bg-gradient-to-b ${currentStage.themeColor.bannerGradient} p-6 flex flex-col justify-between min-h-[460px] shadow-2xl`}>
            
            {/* Ambient Background Grid Pattern & Cyber Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Stage Title Overlay */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    currentStage.category === "workplace"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {currentStage.category === "workplace" ? "Digital Workplace" : "Chill Lounge Spot"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentStage.subtitle}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span>{currentStage.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 font-normal border border-slate-700">
                    {currentStage.focusRating}% Focus Vibe
                  </span>
                </h2>
              </div>

              {/* Stage Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0 justify-start sm:justify-end">
                {/* Global Theme Button */}
                <button
                  id="btn-set-workplace-theme"
                  data-action="apply-app-theme"
                  onClick={() => {
                    if (onSelectWorkplaceTheme) {
                      onSelectWorkplaceTheme(currentStage.id);
                      playInteractiveSound("chime");
                      fireCelebration();
                      setActiveNotification(`✨ Activated "${currentStage.name}" as the Global App Theme! Header, sidebar & workspaces now reflect this zone's theme palette.`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isGlobalAppTheme
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600"
                  }`}
                  title="Set this workplace zone as the application-wide theme"
                >
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isGlobalAppTheme ? "✓ Active App Theme" : "Set Theme (Apply to App)"}</span>
                </button>

                {/* Theme Studio Button */}
                <button
                  id="btn-open-theme-studio"
                  onClick={() => setIsThemeStudioOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 border border-blue-500/30 cursor-pointer"
                  title="Open Theme Studio to preview and customize all themes and environmental auras"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Theme Studio</span>
                </button>

                <button
                  id="btn-assign-agent-stage"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Agent</span>
                </button>

                {/* Highly Reachable Send Refreshments Action */}
                <button
                  id="btn-send-refreshments"
                  onClick={handleSendRefreshments}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer hover:shadow-amber-500/20"
                  title="Send fresh espresso & artisan refreshments to all agents in this zone"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Refreshments</span>
                </button>
              </div>
            </div>

            {/* Interactive Stations & Stage Hotspots Ribbon */}
            <div className="relative z-10 my-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Hotspots & Environmental Buffs (Click to Activate)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentStage.interactiveItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTriggerStageItem(item)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-blue-400 text-left transition-all group shadow-md"
                  >
                    <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-300 group-hover:scale-110 transition-transform">
                      {item.icon === "Server" && <Server className="w-4 h-4 text-cyan-400" />}
                      {item.icon === "Coffee" && <Coffee className="w-4 h-4 text-amber-400" />}
                      {item.icon === "Activity" && <Activity className="w-4 h-4 text-emerald-400" />}
                      {item.icon === "Bell" && <Bell className="w-4 h-4 text-amber-300" />}
                      {item.icon === "CupSoda" && <Coffee className="w-4 h-4 text-emerald-300" />}
                      {item.icon === "Wind" && <Wind className="w-4 h-4 text-cyan-300" />}
                      {item.icon === "TrendingUp" && <TrendingUp className="w-4 h-4 text-blue-400" />}
                      {item.icon === "Cookie" && <Sparkles className="w-4 h-4 text-orange-400" />}
                      {item.icon === "Disc" && <Disc className="w-4 h-4 text-purple-400" />}
                      {item.icon === "Sliders" && <Sliders className="w-4 h-4 text-purple-300" />}
                      {item.icon === "Sparkles" && <Sparkles className="w-4 h-4 text-pink-400" />}
                      {item.icon === "ShieldAlert" && <ShieldCheck className="w-4 h-4 text-rose-400" />}
                      {item.icon === "FileCheck" && <CheckCircle2 className="w-4 h-4 text-rose-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                          {item.name}
                        </h5>
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                          +{item.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                        ✦ {item.bonusEffect}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STATIONED AGENTS VISUAL SPOTLIGHT */}
            <div className="relative z-10 mt-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Stationed Agents in this Zone ({stationedAgents.length})</span>
                </h4>
                <div className="flex items-center gap-2">
                  {stationedAgents.length > 0 && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Applying {currentStage.buffMultiplier}
                    </span>
                  )}
                  <button
                    onClick={handleSendRefreshments}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    title="Quick dispatch refreshments to all agents"
                  >
                    <Coffee className="w-3 h-3 text-amber-400" />
                    <span>Send Refreshments (+60 XP)</span>
                  </button>
                </div>
              </div>

              {stationedAgents.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">
                    No Agents Currently Stationed Here
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Station your AI agents in this {currentStage.category === "workplace" ? "digital workplace" : "chill spot"} to activate the environmental efficiency bonus.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      + Station an Agent in {currentStage.name}
                    </button>
                    <button
                      onClick={handleSendRefreshments}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-400" />
                      <span>Brew Refreshments (+60 XP)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {stationedAgents.map((agent) => {
                    const currentThought = agentThoughts[agent.id] || currentStage.defaultThoughts[0];
                    const mood = agentMoods[agent.id] || "In Flow State";

                    return (
                      <div
                        key={agent.id}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/90 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/60 transition-all"
                      >
                        {/* Live Thought Bubble */}
                        <div className="mb-3 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] text-slate-200 relative flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="italic leading-snug">
                            "{currentThought}"
                          </span>
                        </div>

                        {/* Agent Identity & Status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400/60 shadow-md"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-bold text-white truncate">
                                {agent.name}
                              </h5>
                              <p className="text-[11px] text-slate-400 truncate">
                                {agent.role}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                                  {agent.department}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold truncate">
                                  {mood}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Agent Quick Actions */}
                        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleBoostAgent(agent.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Give coffee boost (+50 XP)"
                            >
                              <Coffee className="w-3 h-3" />
                              <span>Boost</span>
                            </button>

                            <button
                              onClick={() => onDispatchWithAgent(agent.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                              title="Dispatch task immediately"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Task</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleUnassignAgent(agent.id)}
                            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove from this lounge"
                          >
                            Unassign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT: REAL-TIME STAGE INFO DISPLAY & TELEMETRY PANEL */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto p-5 shrink-0">
        
        {/* Stage Header Info */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              currentStage.category === "workplace"
                ? "bg-cyan-950 text-cyan-400 border border-cyan-800/50"
                : "bg-amber-950 text-amber-400 border border-amber-800/50"
            }`}>
              Stage Info Display
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>

          <h3 className="text-lg font-black text-white">
            {currentStage.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {currentStage.subtitle}
          </p>
        </div>

        {/* Environmental Telemetry Metrics */}
        <div className="py-4 border-b border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Environmental Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-400" />
                <span>Ambient Temp</span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1">
                {currentStage.temperature}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Energy Load</span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1">
                {currentStage.energyLoad}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span>Noise Level</span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1">
                {currentStage.noiseLevel}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Focus Rating</span>
              </div>
              <div className="text-xs font-bold text-purple-300 mt-1">
                {currentStage.focusRating}% Score
              </div>
            </div>
          </div>
        </div>

        {/* Stage Efficiency Buff Panel */}
        <div className="py-4 border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Environmental Buff</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/40">
            <div className="text-xs font-bold text-blue-200 mb-1">
              {currentStage.buffMultiplier}
            </div>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              {currentStage.buffDescription}
            </p>
          </div>
        </div>

        {/* Ambient Soundscape Presets */}
        <div className="py-4 border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-emerald-400" />
              <span>Procedural Soundscape</span>
            </div>
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="text-[11px] text-emerald-400 font-semibold hover:underline"
            >
              {isPlayingAudio ? "Mute" : "Start"}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {currentStage.ambientTrackTitle}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isPlayingAudio
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-700 text-slate-400"
              }`}>
                {isPlayingAudio ? "Synthesizing" : "Standby"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Synthesized live with native Web Audio API oscillators and bandpass filters for distraction-free focus.
            </p>
          </div>
        </div>

        {/* Stationed Agents Roster List in Stage Display */}
        <div className="pt-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Stationed AI Workforce</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {stationedAgents.length} Agents
              </span>
            </div>

            <div className="space-y-2">
              {stationedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDispatchWithAgent(agent.id)}
                    className="p-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition-colors"
                    title="Dispatch task"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Dispatch in Stage Vibe button */}
          <div className="mt-5 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                if (stationedAgents.length > 0) {
                  onDispatchWithAgent(stationedAgents[0].id);
                } else if (agents.length > 0) {
                  onDispatchWithAgent(agents[0].id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Execution in {currentStage.name}</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: ASSIGN AGENT TO CURRENT STAGE */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Station Agent in {currentStage.name}</span>
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-3 overflow-y-auto space-y-2 flex-1">
              <p className="text-xs text-slate-400 mb-2">
                Select an agent to station in this spot and activate environmental efficiency buffs:
              </p>

              {agents.map((agent) => {
                const isCurrentlyHere = currentStage.assignedAgentIds.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrentlyHere
                        ? "bg-blue-950/40 border-blue-600/60"
                        : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {agent.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {agent.role} • {agent.department}
                        </p>
                      </div>
                    </div>

                    {isCurrentlyHere ? (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-1 rounded border border-blue-800">
                        Stationed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignAgentToCurrentStage(agent.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Station Here
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Theme Studio & Environmental Aura Modal */}
      {isThemeStudioOpen && (
        <ThemeStudioModal
          isOpen={isThemeStudioOpen}
          onClose={() => setIsThemeStudioOpen(false)}
          activeThemeId={activeWorkplaceThemeId}
          onSelectTheme={(themeId) => {
            if (onSelectWorkplaceTheme) {
              onSelectWorkplaceTheme(themeId);
            }
          }}
          isPlayingAudio={isPlayingAudio}
          onToggleAudio={() => setIsPlayingAudio(!isPlayingAudio)}
        />
      )}
    </div>
  );
};
