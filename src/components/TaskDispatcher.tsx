import React, { useState } from "react";
import { Agent, TaskExecutionRecord, Workflow } from "../types";
import { SAMPLE_TASK_PRESETS } from "../data/initialData";
import { 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Award, 
  Terminal, 
  Bot, 
  ChevronRight, 
  Loader2, 
  ArrowRight,
  UserCheck,
  Check,
  X,
  Flame,
  FileText
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { fireCelebration } from "../utils/confetti";

interface TaskDispatcherProps {
  agents: Agent[];
  workflows: Workflow[];
  executionHistory: TaskExecutionRecord[];
  onTaskCompleted: (record: TaskExecutionRecord) => void;
  onApproveHitl: (taskId: string) => void;
  streakMultiplier: number;
}

export const TaskDispatcher: React.FC<TaskDispatcherProps> = ({
  agents,
  workflows,
  executionHistory,
  onTaskCompleted,
  onApproveHitl,
  streakMultiplier,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || "");
  const [taskTitle, setTaskTitle] = useState<string>("P0 Incident: Redis Connection Pool Exhaustion in us-east");
  const [taskPayload, setTaskPayload] = useState<string>(SAMPLE_TASK_PRESETS[0].payload);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TaskExecutionRecord | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const currentWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handlePresetSelect = (preset: typeof SAMPLE_TASK_PRESETS[0]) => {
    setSelectedAgentId(preset.agentId);
    setTaskTitle(preset.title);
    setTaskPayload(preset.payload);
    const matchedWf = workflows.find((w) => w.agentId === preset.agentId) || workflows[0];
    if (matchedWf) setSelectedWorkflowId(matchedWf.id);
  };

  const handleRunExecution = async () => {
    if (!currentAgent) return;
    setIsRunning(true);
    setActiveStepIndex(0);

    const nodesToExecute = currentWorkflow?.nodes && currentWorkflow.nodes.length > 0
      ? currentWorkflow.nodes
      : [
          { id: "step-1", type: "trigger", name: "Trigger Ingestion", description: "Parse task context" },
          { id: "step-2", type: "ai_process", name: "Gemini Analysis", description: "Evaluate payload" },
          { id: "step-3", type: "action_output", name: "Action Dispatch", description: "Execute output" },
        ];

    try {
      const response = await fetch("/api/gemini/execute-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: currentAgent,
          taskInput: {
            title: taskTitle,
            payload: taskPayload,
          },
          nodes: nodesToExecute,
          permissions: currentAgent.permissions,
        }),
      });

      const data = await response.json();
      const needsReview = (data.stepsOutput || []).some(
        (s: any) => s.type === "human_review" || s.status === "needs_review"
      );

      const baseHours = data.hoursSaved || 0.6;
      const baseXp = data.xpEarned || 120;
      const boostedXp = Math.round(baseXp * streakMultiplier);

      const record: TaskExecutionRecord = {
        id: `exec-${Date.now()}`,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        workflowId: currentWorkflow?.id || "wf-default",
        workflowName: currentWorkflow?.name || "Standard Workflow",
        title: taskTitle,
        department: currentAgent.department,
        inputPayload: taskPayload,
        status: needsReview ? "needs_review" : "completed",
        summary: data.summary || "Agent completed workflow execution.",
        stepsOutput: data.stepsOutput || [],
        auditLogs: data.auditLogs || [],
        keyEntitiesExtracted: data.keyEntitiesExtracted || {},
        suggestedHumanAction: data.suggestedHumanAction || null,
        hoursSaved: baseHours,
        xpEarned: boostedXp,
        timestamp: "Just now",
        isSimulated: data.isSimulated,
      };

      setCurrentExecution(record);
      onTaskCompleted(record);
      if (!needsReview) {
        fireCelebration();
      }
    } catch (err) {
      console.error("Execution failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredHistory = executionHistory.filter((rec) => {
    if (filterStatus === "all") return true;
    return rec.status === filterStatus;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* LEFT COLUMN: TASK DISPATCH CONTROLS & PRESETS */}
      <div className="w-full md:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Task Dispatcher</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              Live AI Orchestrator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Feed enterprise payloads to assigned agents for autonomous execution.
          </p>
        </div>

        {/* Quick Enterprise Presets */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Quick Enterprise Presets
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_TASK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 text-left transition-all"
              >
                <div className="text-[10px] font-bold text-slate-400 truncate">
                  {preset.department}
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {preset.title.split(":")[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Agent & Workflow Pickers */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} • {ag.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Workflow Graph
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.nodes.length} nodes)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title / Subject
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payload / Incident Context / Raw Data
            </label>
            <textarea
              rows={5}
              value={taskPayload}
              onChange={(e) => setTaskPayload(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
          </div>

          <button
            id="btn-execute-workflow"
            onClick={handleRunExecution}
            disabled={isRunning}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Gemini Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Dispatch & Execute Agent</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE EXECUTION INSPECTOR & RECENT RUNS */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6">
        {/* CURRENT EXECUTION CARD */}
        {currentExecution ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentExecution.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        currentExecution.status === "completed"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : currentExecution.status === "needs_review"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {currentExecution.status === "needs_review" ? "Pending Approval" : currentExecution.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Agent: <strong>{currentExecution.agentName}</strong> • Workflow: {currentExecution.workflowName}
                  </div>
                </div>
              </div>

              {/* Gamification Reward pill */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>+{currentExecution.xpEarned} XP</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>{currentExecution.hoursSaved}h Saved</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>Workflow Executive Summary:</strong> {currentExecution.summary}
            </div>

            {/* HUMAN IN THE LOOP APPROVAL BANNER (if needed) */}
            {currentExecution.status === "needs_review" && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                      Human-in-the-Loop Specialist Review Required
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                      {currentExecution.suggestedHumanAction ||
                        "Please verify the generated output before final dispatch to production channels."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const feedback = window.prompt("Enter rejection reason / correction instructions for the agent:");
                      if (feedback) {
                        setTaskPayload(`${taskPayload}\n\n[Human Correction Directive]: ${feedback}`);
                        handleRunExecution();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-semibold"
                  >
                    Reject with Feedback
                  </button>
                  <button
                    onClick={() => {
                      onApproveHitl(currentExecution.id);
                      setCurrentExecution({ ...currentExecution, status: "approved" });
                      fireCelebration();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Export & Copy Bar */}
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `# Execution Report: ${currentExecution.title}\n\nAgent: ${currentExecution.agentName}\nDepartment: ${currentExecution.department}\nStatus: ${currentExecution.status}\n\nSummary:\n${currentExecution.summary}\n\nSteps:\n${currentExecution.stepsOutput.map((s) => `### ${s.name}\n${s.output}`).join("\n\n")}`
                  );
                  alert("Report copied to clipboard!");
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                Copy Markdown
              </button>
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentExecution, null, 2));
                  const a = document.createElement("a");
                  a.href = dataStr;
                  a.download = `execution-${currentExecution.id}.json`;
                  a.click();
                  a.remove();
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                Download JSON
              </button>
            </div>

            {/* Step by step pipeline output cards */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                Pipeline Stage-by-Stage Output ({currentExecution.stepsOutput.length} Steps)
              </h4>
              <div className="space-y-2.5">
                {currentExecution.stepsOutput.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {step.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.durationMs && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {step.durationMs}ms
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          {Math.round(step.confidence * 100)}% Confidence
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                      {step.output}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            {currentExecution.auditLogs && currentExecution.auditLogs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Enterprise Security & Audit Trail</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1">
                  {currentExecution.auditLogs.map((log, i) => (
                    <div key={i} className="text-slate-400">
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ready to Dispatch Automated Workflow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Select an agent and task preset from the left panel, or paste custom data to trigger autonomous execution with real Gemini intelligence.
            </p>
          </div>
        )}

        {/* RECENT RUNS / EXECUTION HISTORY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Enterprise Automations ({executionHistory.length})
            </h3>
            <div className="flex items-center gap-1 text-xs">
              {["all", "completed", "needs_review"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-slate-800 dark:bg-slate-700 text-white"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredHistory.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setCurrentExecution(rec)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {rec.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {rec.agentName} • {rec.department} • {rec.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    +{rec.hoursSaved}h
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    +{rec.xpEarned} XP
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      rec.status === "completed" || rec.status === "approved"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {rec.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
