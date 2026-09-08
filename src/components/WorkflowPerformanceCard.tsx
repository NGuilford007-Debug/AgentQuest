import React, { useState, useEffect, useMemo } from "react";
import { 
  Workflow, 
  WorkflowNode, 
  StepExecutionResult, 
  TaskExecutionRecord 
} from "../types";
import { 
  Activity, 
  Timer, 
  CheckCircle2, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  BarChart3, 
  Play, 
  Loader2, 
  Clock, 
  Sparkles, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { playInteractiveSound } from "../utils/audioSynth";

export interface WorkflowPerformanceCardProps {
  workflow: Workflow;
  nodes: WorkflowNode[];
  isSimulating: boolean;
  activeRunningNodeId: string | null;
  simulationResults: Record<string, StepExecutionResult>;
  executionHistory?: TaskExecutionRecord[];
  onRunLiveSimulation: () => void;
  onOpenMetricsModal?: () => void;
}

export const WorkflowPerformanceCard: React.FC<WorkflowPerformanceCardProps> = ({
  workflow,
  nodes,
  isSimulating,
  activeRunningNodeId,
  simulationResults,
  executionHistory = [],
  onRunLiveSimulation,
  onOpenMetricsModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("agentflow_workflow_perf_card_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("agentflow_workflow_perf_card_collapsed", String(next));
      } catch {
        // ignore
      }
      playInteractiveSound("click");
      return next;
    });
  };

  // Real-time live timer during active simulation
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  useEffect(() => {
    let interval: number | null = null;
    if (isSimulating) {
      const startTime = Date.now();
      setLiveElapsedMs(0);
      interval = window.setInterval(() => {
        setLiveElapsedMs(Date.now() - startTime);
      }, 50);
    } else {
      if (liveElapsedMs > 0) {
        // keep final elapsed duration visible after simulation completes
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  // Historical execution records for this specific active pipeline
  const pipelineExecutions = useMemo(() => {
    return executionHistory.filter((e) => e.workflowId === workflow.id);
  }, [executionHistory, workflow.id]);

  // Real-time step results duration from current live simulation
  const liveSimulationDuration = useMemo(() => {
    return Object.values(simulationResults).reduce((sum, res) => sum + (res.durationMs || 0), 0);
  }, [simulationResults]);

  // Theoretical node baseline latency estimation (ms) based on current canvas node composition
  const estimatedBaselineMs = useMemo(() => {
    if (nodes.length === 0) return 420;
    return nodes.reduce((sum, n) => {
      switch (n.type) {
        case "trigger":
          return sum + 65;
        case "ai_process":
          return sum + 380;
        case "condition":
          return sum + 120;
        case "human_review":
        case "permission_gate":
          return sum + 160;
        case "action_output":
          return sum + 190;
        default:
          return sum + 130;
      }
    }, 0);
  }, [nodes]);

  // Average Execution Time computation
  const avgExecutionTimeMs = useMemo(() => {
    const historicalDurations: number[] = [];
    pipelineExecutions.forEach((rec) => {
      const totalStepsDuration = rec.stepsOutput?.reduce((sum, s) => sum + (s.durationMs || 0), 0) || 0;
      if (totalStepsDuration > 0) {
        historicalDurations.push(totalStepsDuration);
      }
    });

    if (historicalDurations.length > 0) {
      const historicalSum = historicalDurations.reduce((a, b) => a + b, 0);
      if (liveSimulationDuration > 0) {
        return Math.round((historicalSum + liveSimulationDuration) / (historicalDurations.length + 1));
      }
      return Math.round(historicalSum / historicalDurations.length);
    }

    if (liveSimulationDuration > 0) {
      return liveSimulationDuration;
    }

    // Default to estimated baseline derived from pipeline composition
    return estimatedBaselineMs;
  }, [pipelineExecutions, liveSimulationDuration, estimatedBaselineMs]);

  // Format execution time
  const formattedAvgTime = useMemo(() => {
    if (avgExecutionTimeMs < 1000) {
      return `${avgExecutionTimeMs}ms`;
    }
    return `${(avgExecutionTimeMs / 1000).toFixed(2)}s`;
  }, [avgExecutionTimeMs]);

  // Real-time Success Rate calculation
  const effectiveSuccessRate = useMemo(() => {
    if (pipelineExecutions.length > 0) {
      const successful = pipelineExecutions.filter(
        (e) => e.status === "completed" || e.status === "approved" || e.status === "resolved"
      ).length;
      return (successful / pipelineExecutions.length) * 100;
    }

    // Workflow configured success rate or enterprise 99.4% standard
    const baseRate = workflow.successRate ?? 99.4;
    const liveResultsArray = Object.values(simulationResults);
    if (liveResultsArray.length > 0) {
      const liveFailed = liveResultsArray.filter((r) => r.status === "failed").length;
      if (liveFailed > 0) {
        return Math.max(80, Number((baseRate - (liveFailed / liveResultsArray.length) * 15).toFixed(1)));
      }
    }
    return baseRate;
  }, [pipelineExecutions, workflow.successRate, simulationResults]);

  // Node currently executing during simulation
  const activeNode = useMemo(() => {
    if (!activeRunningNodeId) return null;
    return nodes.find((n) => n.id === activeRunningNodeId) || null;
  }, [activeRunningNodeId, nodes]);

  // Total execution count
  const totalRunsCount = Math.max(workflow.totalRuns || 0, pipelineExecutions.length);
  const completedStepsCount = Object.keys(simulationResults).length;

  return (
    <div
      id="workflow-performance-summary-card"
      className="absolute top-4 left-4 z-20 select-none transition-all duration-200"
    >
      {/* Collapsed Pill View */}
      {isCollapsed ? (
        <button
          id="btn-expand-workflow-perf-card"
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group"
          title="Click to expand real-time Pipeline Performance Telemetry card"
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {isSimulating ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              )}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">Telemetry</span>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Average Execution Time Chip */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Timer className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {isSimulating ? `${(liveElapsedMs / 1000).toFixed(2)}s` : formattedAvgTime}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Success Rate Chip */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {effectiveSuccessRate.toFixed(1)}%
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors ml-0.5" />
        </button>
      ) : (
        /* Full Expanded Performance Card */
        <div className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl overflow-hidden transition-all text-slate-900 dark:text-slate-100">
          {/* Card Header */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Pipeline Performance
                  </h4>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                      workflow.isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {workflow.isActive ? "Active" : "Draft"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {workflow.name}
                </p>
              </div>
            </div>

            {/* Collapse Button */}
            <button
              id="btn-collapse-workflow-perf-card"
              type="button"
              onClick={toggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Minimize performance summary card"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Real-Time Metrics Grid: Avg Execution Time + Success Rate */}
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Card 1: Real-time Avg Execution Time */}
              <div 
                id="perf-avg-execution-time-stat"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    <Timer className="w-3 h-3 text-indigo-500" />
                    Avg Runtime
                  </span>
                  {isSimulating && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                    <span>
                      {isSimulating ? `${(liveElapsedMs / 1000).toFixed(2)}s` : formattedAvgTime}
                    </span>
                    {isSimulating && (
                      <span className="text-[10px] font-normal text-amber-500 animate-pulse">
                        live
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span className="truncate">
                      {avgExecutionTimeMs < 1000 ? "Sub-second SLA" : "Optimized pipeline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Real-time Success Rate */}
              <div 
                id="perf-success-rate-stat"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Success SLA
                  </span>
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </div>

                <div className="my-1">
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {effectiveSuccessRate.toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, effectiveSuccessRate))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Simulation Progress Banner */}
            {isSimulating && (
              <div 
                id="perf-live-simulation-banner"
                className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] space-y-1 animate-in fade-in"
              >
                <div className="flex items-center justify-between font-bold text-indigo-700 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Executing Pipeline...</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    Step {completedStepsCount + 1} of {Math.max(nodes.length, 1)}
                  </span>
                </div>
                {activeNode && (
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                    Running node: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{activeNode.name}</span> ({activeNode.type.replace("_", " ")})
                  </p>
                )}
              </div>
            )}

            {/* Pipeline Attributes & Latency Specs */}
            <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>Pipeline Nodes</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {nodes.length} nodes ({nodes.filter(n => n.type === "ai_process").length} AI)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  <span>Total Executions</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {totalRunsCount} runs
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Last Executed</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
                  {workflow.lastRun || "Ready for live run"}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <button
                id="btn-perf-trigger-test"
                type="button"
                onClick={onRunLiveSimulation}
                disabled={isSimulating}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                title="Run step-by-step canvas test on this pipeline"
              >
                {isSimulating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-white" />
                )}
                <span>{isSimulating ? "Testing..." : "Test Run"}</span>
              </button>

              {onOpenMetricsModal && (
                <button
                  id="btn-perf-open-deep-telemetry"
                  type="button"
                  onClick={onOpenMetricsModal}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Open Deep Pipeline Metrics & Email Telemetry"
                >
                  <BarChart3 className="w-3 h-3 text-indigo-500" />
                  <span>Metrics</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
