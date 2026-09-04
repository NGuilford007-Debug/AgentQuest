import React, { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  Activity, 
  Wrench, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  ChevronRight,
  ShieldAlert,
  Bot
} from "lucide-react";
import { Agent } from "../types";
import { playInteractiveSound } from "../utils/audioSynth";

interface AgentHealthToastSystemProps {
  agents: Agent[];
  onNavigateToHealth: (agentId: string) => void;
  onQuickHeal?: (agentId: string) => void;
}

export const AgentHealthToastSystem: React.FC<AgentHealthToastSystemProps> = ({
  agents,
  onNavigateToHealth,
  onQuickHeal,
}) => {
  // Track dismissed agent IDs (keyed by agentId -> timestamp of dismissal)
  const [dismissedMap, setDismissedMap] = useState<Record<string, { dismissedAt: number; rate: number }>>({});
  
  // Track previously alerted agent IDs to detect transitions to healthy
  const previouslyUnhealthyRef = useRef<Set<string>>(new Set());
  
  // Restoration success notifications
  const [healedToasts, setHealedToasts] = useState<Array<{ id: string; name: string; successRate: number }>>([]);
  
  // Active index if multiple degraded agents exist
  const [activeToastIndex, setActiveToastIndex] = useState<number>(0);
  
  // Last played sound timestamp to prevent audio spam
  const lastSoundPlayedRef = useRef<number>(0);

  // Filter agents whose successRate is below 85%
  const degradedAgents = agents.filter((agent) => {
    const successRate = agent.stats?.successRate ?? 100;
    return successRate < 85;
  });

  // Check for newly degraded or healed agents
  useEffect(() => {
    const currentUnhealthyIds = new Set(degradedAgents.map((a) => a.id));

    // Detect if an agent that was previously unhealthy has now been healed
    previouslyUnhealthyRef.current.forEach((prevId) => {
      if (!currentUnhealthyIds.has(prevId)) {
        const healedAgent = agents.find((a) => a.id === prevId);
        if (healedAgent && (healedAgent.stats?.successRate ?? 100) >= 85) {
          const toastId = `healed-${prevId}-${Date.now()}`;
          setHealedToasts((prev) => [
            ...prev,
            { id: toastId, name: healedAgent.name, successRate: healedAgent.stats.successRate },
          ]);
          playInteractiveSound("chime");

          // Auto dismiss the healed celebration after 5 seconds
          setTimeout(() => {
            setHealedToasts((current) => current.filter((t) => t.id !== toastId));
          }, 5000);
        }
      }
    });

    // Detect newly degraded agents and trigger alert sound
    const newlyDegraded = degradedAgents.filter((a) => {
      const dismissed = dismissedMap[a.id];
      if (!dismissed) return true;
      // If the success rate dropped further since dismissal, re-alert!
      return a.stats.successRate < dismissed.rate - 0.5;
    });

    if (newlyDegraded.length > 0) {
      const now = Date.now();
      if (now - lastSoundPlayedRef.current > 4000) {
        lastSoundPlayedRef.current = now;
        playInteractiveSound("alert");
      }
    }

    // Update previous set
    previouslyUnhealthyRef.current = currentUnhealthyIds;
  }, [agents, degradedAgents, dismissedMap]);

  // Active un-dismissed degraded agents
  const visibleDegradedAgents = degradedAgents.filter((agent) => {
    const dismissed = dismissedMap[agent.id];
    if (!dismissed) return true;
    // Re-surface if rate dropped further
    return agent.stats.successRate < dismissed.rate - 0.5;
  });

  const handleDismiss = (agentId: string, currentRate: number) => {
    playInteractiveSound("click");
    setDismissedMap((prev) => ({
      ...prev,
      [agentId]: { dismissedAt: Date.now(), rate: currentRate },
    }));
  };

  const handleDebugAndFix = (agentId: string) => {
    playInteractiveSound("click");
    onNavigateToHealth(agentId);
    // Remove from active toast view after navigation
    setDismissedMap((prev) => ({
      ...prev,
      [agentId]: { dismissedAt: Date.now(), rate: 0 },
    }));
  };

  if (visibleDegradedAgents.length === 0 && healedToasts.length === 0) {
    return null;
  }

  const currentAgent = visibleDegradedAgents[activeToastIndex] || visibleDegradedAgents[0];

  return (
    <div 
      id="agent-health-toast-container"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 max-w-md w-[calc(100vw-2rem)] pointer-events-none"
      role="region"
      aria-label="Agent Health Alerts"
    >
      {/* 1. Restoration / Healed Celebration Toasts */}
      {healedToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full bg-emerald-950/90 text-emerald-100 border border-emerald-500/50 shadow-xl shadow-emerald-950/40 rounded-2xl p-3.5 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>Agent Restored & Optimized</span>
              </div>
              <p className="text-[11px] text-emerald-300 truncate">
                <strong>{toast.name}</strong> success rate elevated to <strong>{toast.successRate}%</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setHealedToasts((current) => current.filter((t) => t.id !== toast.id))}
            className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors shrink-0 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* 2. Critical Health Degradation Alert Toast (<85% Success Rate) */}
      {currentAgent && (
        <div
          id={`health-alert-toast-${currentAgent.id}`}
          className="pointer-events-auto w-full bg-slate-900/95 dark:bg-slate-900/98 text-slate-100 border-2 border-rose-500/70 shadow-2xl shadow-rose-950/50 rounded-2xl p-4 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-rose-500/30 space-y-3"
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide uppercase text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Health Alert: SLA Threshold Breached</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {visibleDegradedAgents.length > 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80">
                  {activeToastIndex + 1} of {visibleDegradedAgents.length}
                </span>
              )}
              <button
                id={`btn-toast-dismiss-${currentAgent.id}`}
                onClick={() => handleDismiss(currentAgent.id, currentAgent.stats.successRate)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss alert for now"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agent Identification & Metric Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
            {currentAgent.avatar ? (
              <img
                src={currentAgent.avatar}
                alt={currentAgent.name}
                className="w-10 h-10 rounded-xl object-cover border border-rose-500/40 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-white truncate">
                  {currentAgent.name}
                </h4>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                  {currentAgent.stats.successRate}% Success
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentAgent.role} • {currentAgent.department}
              </p>
            </div>
          </div>

          {/* Diagnostic Root Telemetry & Gauge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Accuracy Benchmark:</span>
              <span className="text-rose-400 font-bold">
                {currentAgent.stats.successRate}% <span className="text-slate-500 font-normal">/ 85.0% threshold</span>
              </span>
            </div>

            {/* Threshold Gauge Bar */}
            <div className="relative w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, currentAgent.stats.successRate))}%` }}
              />
              {/* 85% Benchmark Marker line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-xs" 
                style={{ left: "85%" }}
                title="85% Minimum Success Threshold"
              />
            </div>
            
            <p className="text-[11px] text-slate-300 leading-snug pt-0.5">
              Success rate dropped below the <strong>85% SLA minimum</strong>. Elevated task rejections or model hallucinations require tuning.
            </p>
          </div>

          {/* Multi-agent Paging (if > 1 agent is degraded) */}
          {visibleDegradedAgents.length > 1 && (
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
              <span>{visibleDegradedAgents.length} agents currently below 85%</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveToastIndex((prev) => (prev > 0 ? prev - 1 : visibleDegradedAgents.length - 1))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setActiveToastIndex((prev) => (prev < visibleDegradedAgents.length - 1 ? prev + 1 : 0))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons: Direct "Debug & Fix" */}
          <div className="flex items-center gap-2 pt-1">
            <button
              id={`btn-toast-debug-fix-${currentAgent.id}`}
              onClick={() => handleDebugAndFix(currentAgent.id)}
              className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              title="Open Agent Health Monitor to diagnose and optimize this agent"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Debug & Fix</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
            </button>

            <button
              id={`btn-toast-ack-${currentAgent.id}`}
              onClick={() => handleDismiss(currentAgent.id, currentAgent.stats.successRate)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Dismiss this alert"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
