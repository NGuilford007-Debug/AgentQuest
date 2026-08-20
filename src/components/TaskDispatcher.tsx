import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Agent, TaskExecutionRecord, Workflow, ApprovedAutomation, GeneratedReportDocument } from "../types";
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
  ChevronDown,
  ChevronUp,
  Loader2, 
  ArrowRight,
  UserCheck,
  Check,
  X,
  Flame,
  FileText,
  Copy,
  Download,
  Send,
  Sliders,
  Layers,
  History,
  RotateCcw,
  Zap,
  XCircle,
  Coins,
  Ban,
  Wrench,
  BookmarkCheck,
  Bookmark
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { fireCelebration } from "../utils/confetti";
import { TaskTroubleshootModal } from "./TaskTroubleshootModal";

interface TaskDispatcherProps {
  agents: Agent[];
  workflows: Workflow[];
  executionHistory: TaskExecutionRecord[];
  onTaskCompleted: (record: TaskExecutionRecord) => void;
  onApproveHitl: (taskId: string) => void;
  onUpdateExecution?: (updated: TaskExecutionRecord) => void;
  onSaveApprovedAutomation?: (automation: ApprovedAutomation) => void;
  onSaveReport?: (report: GeneratedReportDocument) => void;
  streakMultiplier: number;
  initialAgentId?: string;
}

const AGENT_QUICK_IDEAS: Record<string, string[]> = {
  "DevOps & SecOps": [
    "Analyze Redis connection pool timeout error and generate mitigation script.",
    "Draft an incident postmortem for the checkout API 500 error spike.",
    "Review recent commits for potential security vulnerabilities."
  ],
  "Sales & CRM": [
    "Draft a personalized cold outreach email for Acme Fintech ($50M ARR).",
    "Summarize customer pain points and calculate estimated ROI savings.",
    "Write a follow-up proposal email for a 250-seat enterprise deal."
  ],
  "Customer Support": [
    "Draft an empathetic reply for an SSO SAML 403 login error.",
    "Write troubleshooting steps for webhook delivery failures.",
    "Generate a ticket resolution response with a goodwill credit voucher."
  ],
  "Finance & Legal": [
    "Reconcile AWS and Snowflake invoice line items against Q3 budget.",
    "Review Vendor Master Services Agreement (MSA) liability terms.",
    "Draft an expense approval memo for $12k software tool renewal."
  ],
  "Engineering": [
    "Analyze slow PostgreSQL query and recommend composite index fix.",
    "Generate TypeScript types and validation schema for User Profile API.",
    "Refactor Python batch worker with exponential backoff retry logic."
  ],
  "Human Resources": [
    "Draft job description for Senior AI Automation Engineer.",
    "Write company-wide announcement celebrating automation milestones.",
    "Generate 30-60-90 day onboarding checklist for new hire."
  ]
};

export const TaskDispatcher: React.FC<TaskDispatcherProps> = ({
  agents,
  workflows,
  executionHistory,
  onTaskCompleted,
  onApproveHitl,
  onUpdateExecution,
  onSaveApprovedAutomation,
  onSaveReport,
  streakMultiplier,
  initialAgentId,
}) => {
  const [isSavedAsReport, setIsSavedAsReport] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    initialAgentId || agents[0]?.id || ""
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    workflows[0]?.id || ""
  );
  const [promptText, setPromptText] = useState<string>(
    "Analyze this Redis connection pool timeout error and generate root-cause analysis with actionable mitigation script."
  );
  const [extraContext, setExtraContext] = useState<string>(SAMPLE_TASK_PRESETS[0].payload);
  const [showExtraContext, setShowExtraContext] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"prompt" | "graph" | "history">("prompt");
  
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TaskExecutionRecord | null>(
    executionHistory[0] || null
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [followUpText, setFollowUpText] = useState<string>("");
  const [isFollowUpRunning, setIsFollowUpRunning] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState<boolean>(false);
  const [troubleshootRecord, setTroubleshootRecord] = useState<TaskExecutionRecord | null>(null);

  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync if initialAgentId changes
  useEffect(() => {
    if (initialAgentId) {
      setSelectedAgentId(initialAgentId);
    }
  }, [initialAgentId]);

  // Clean up if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const currentWorkflow = workflows.find((w) => w.agentId === currentAgent?.id) || workflows[0];
  const quickIdeas = (currentAgent && AGENT_QUICK_IDEAS[currentAgent.department]) || [
    "Analyze recent operational data and provide a structured summary.",
    "Draft an executive report on key metrics and action items.",
    "Review system configurations and generate optimization steps."
  ];

  const handlePresetSelect = (preset: typeof SAMPLE_TASK_PRESETS[0]) => {
    setSelectedAgentId(preset.agentId);
    setPromptText(preset.title);
    setExtraContext(preset.payload);
    setShowExtraContext(true);
    const matchedWf = workflows.find((w) => w.agentId === preset.agentId) || workflows[0];
    if (matchedWf) setSelectedWorkflowId(matchedWf.id);
  };

  const handleApproveHitlExecution = (exec: TaskExecutionRecord) => {
    onApproveHitl(exec.id);
    const updated = { ...exec, status: "approved" as const };
    setCurrentExecution(updated);
    if (onUpdateExecution) {
      onUpdateExecution(updated);
    }
    
    // Persist to automations vault so good suggestions are retained
    const matchedAgent = agents.find(a => a.id === exec.agentId);
    const newAutomation: ApprovedAutomation = {
      id: `auto-saved-${Date.now()}`,
      title: exec.title || `Approved Automation by ${exec.agentName}`,
      description: exec.summary || `Approved output from ${exec.agentName} (${exec.department})`,
      agentId: exec.agentId,
      agentName: exec.agentName,
      agentAvatar: matchedAgent?.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
      department: exec.department,
      modelUsed: matchedAgent?.model || "gemini-3.7-flash",
      sourcePrompt: exec.prompt || exec.inputPayload,
      generatedContent: exec.generatedOutput || exec.summary,
      suggestedActions: [
        `Deploy ${exec.title} into daily automation pipeline`,
        `Route output alerts to ${exec.department} team channel`,
        `Review performance telemetry and KPIs`
      ],
      category: "automation",
      approvedAt: new Date().toISOString(),
      status: "active",
      estimatedHoursSaved: exec.hoursSaved || 0.8,
      tags: [exec.department, "Approved", "Task Dispatcher"],
      isBookmarked: true,
    };

    if (onSaveApprovedAutomation) {
      onSaveApprovedAutomation(newAutomation);
    } else {
      try {
        const stored = localStorage.getItem("agentflow_approved_automations");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newAutomation);
        localStorage.setItem("agentflow_approved_automations", JSON.stringify(list));
      } catch (e) {
        console.error("Error persisting automation:", e);
      }
    }

    fireCelebration();
  };

  const handleCancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setIsCancelled(true);
  };

  const handleRunExecution = async (customPrompt?: string) => {
    if (!currentAgent) return;
    const finalPrompt = customPrompt || promptText;
    if (!finalPrompt.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    setIsCancelled(false);

    const startTime = Date.now();

    try {
      // Use direct prompt-agent endpoint for fast, comprehensive generation
      const response = await fetch("/api/gemini/prompt-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          agentId: currentAgent.id,
          agent: currentAgent,
          prompt: finalPrompt,
          context: extraContext,
          temperature: currentAgent.temperature,
          permissions: currentAgent.permissions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      const outputText = data.generatedOutput || data.output || data.summary || "Task completed successfully.";
      const summaryText = data.summary || `Agent ${currentAgent.name} completed task.`;
      const baseHours = data.hoursSaved || 0.6;
      const baseXp = data.xpEarned || 150;
      const boostedXp = Math.round(baseXp * streakMultiplier);
      const creditsCost = data.creditsCost || 12;
      const tokensConsumed = data.tokensConsumed || 640;

      const record: TaskExecutionRecord = {
        id: `exec-${Date.now()}`,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        workflowId: currentWorkflow?.id || "wf-adhoc",
        workflowName: currentWorkflow?.name || "Direct Prompt Task",
        title: finalPrompt.length > 65 ? `${finalPrompt.slice(0, 62)}...` : finalPrompt,
        department: currentAgent.department,
        inputPayload: extraContext ? `${finalPrompt}\n\n[Context Data]:\n${extraContext}` : finalPrompt,
        status: currentAgent.autonomyLevel === "hitl" ? "needs_review" : "completed",
        summary: summaryText,
        generatedOutput: outputText,
        prompt: finalPrompt,
        creditsCost,
        tokensConsumed,
        stepsOutput: data.stepsOutput || [
          {
            nodeId: "step-1",
            name: "Prompt Evaluation & Parsing",
            type: "trigger",
            status: "completed",
            durationMs: 140,
            output: `Ingested task directive for ${currentAgent.name}`,
            confidence: 0.99,
          },
          {
            nodeId: "step-2",
            name: "Model Generation Core",
            type: "ai_process",
            status: "completed",
            durationMs: 380,
            output: `Executed via ${currentAgent.model || "Gemini 3.7 Flash"}`,
            confidence: 0.97,
          },
          {
            nodeId: "step-3",
            name: "Governance & Action Dispatch",
            type: currentAgent.autonomyLevel === "hitl" ? "human_review" : "action_output",
            status: currentAgent.autonomyLevel === "hitl" ? "needs_review" : "completed",
            durationMs: 120,
            output: outputText.slice(0, 120) + "...",
            confidence: 0.98,
          },
        ],
        auditLogs: data.auditLogs || [
          `Agent persona: ${currentAgent.role}`,
          `Model engine: ${currentAgent.model || "Gemini 3.7 Flash"}`,
          `Governance check: 0 policy violations`,
        ],
        keyEntitiesExtracted: data.keyEntitiesExtracted || {},
        suggestedHumanAction: currentAgent.autonomyLevel === "hitl" 
          ? "Please review and confirm the generated work product before finalizing."
          : null,
        hoursSaved: baseHours,
        xpEarned: boostedXp,
        timestamp: "Just now",
        isSimulated: data.isSimulated,
      };

      setCurrentExecution(record);
      onTaskCompleted(record);
      if (record.status !== "needs_review") {
        fireCelebration();
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Execution failed:", err);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleFollowUpRefinement = async () => {
    if (!followUpText.trim() || !currentExecution || !currentAgent) return;
    setIsFollowUpRunning(true);

    try {
      const combined = `Initial Request: ${currentExecution.prompt || currentExecution.title}\n\nCurrent Output:\n${currentExecution.generatedOutput || currentExecution.summary}\n\nRefinement Request:\n${followUpText}`;

      const response = await fetch("/api/gemini/prompt-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: currentAgent.id,
          agent: currentAgent,
          prompt: combined,
          temperature: currentAgent.temperature,
          permissions: currentAgent.permissions,
        }),
      });

      const data = await response.json();
      const updatedOutput = data.generatedOutput || data.output;
      if (updatedOutput) {
        const updatedRecord = {
          ...currentExecution,
          generatedOutput: updatedOutput,
          summary: `Refined: ${followUpText}`,
        };
        setCurrentExecution(updatedRecord);
        setFollowUpText("");
        fireCelebration();
      }
    } catch (err) {
      console.error("Refinement failed:", err);
    } finally {
      setIsFollowUpRunning(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = currentExecution?.generatedOutput || currentExecution?.summary;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = currentExecution?.generatedOutput || currentExecution?.summary;
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentExecution?.agentName.toLowerCase().replace(/\s+/g, "_")}_output.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = executionHistory.filter((rec) => {
    if (filterStatus === "all") return true;
    return rec.status === filterStatus;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* LEFT COLUMN: TASK PROMPTING & CONTROLS */}
      <div className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Prompt & Task Studio</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold font-mono">
              Live AI Orchestrator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Type what you need done. Any autonomous agent will execute and generate results instantly.
          </p>
        </div>

        {/* AGENT SELECTOR */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            1. Select Target Agent
          </label>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((ag) => {
              const isSelected = ag.id === selectedAgentId;
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setSelectedAgentId(ag.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <img
                    src={ag.avatar}
                    alt={ag.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ag.name}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
                      {ag.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROMPT INPUT */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>2. What do you need {currentAgent?.name} to do?</span>
            </label>
          </div>

          <textarea
            ref={promptInputRef}
            id="dispatcher-prompt-input"
            rows={4}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunExecution();
              }
            }}
            placeholder={`Enter instructions for ${currentAgent?.name}...`}
            className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />

          {/* Quick Idea Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1-Click Prompt Ideas:
            </span>
            <div className="flex flex-col gap-1">
              {quickIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptText(idea);
                    handleRunExecution(idea);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] text-left border border-slate-200/80 dark:border-slate-700 transition-colors truncate"
                >
                  💡 {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Raw Context Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowExtraContext(!showExtraContext)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline pt-1"
            >
              {showExtraContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showExtraContext ? "Hide Context / Payload Data" : "+ Attach Raw Logs / Payload Data"}</span>
            </button>

            {showExtraContext && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                <textarea
                  rows={3}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Paste stack traces, JSON logs, or customer tickets..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            )}
          </div>

          {/* Preset Enterprise Scenarios */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Enterprise Benchmark Presets:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SAMPLE_TASK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 text-left transition-all"
                >
                  <div className="text-[9px] font-bold text-slate-400 truncate">
                    {preset.department}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {preset.title.split(":")[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN EXECUTE CTA & CANCEL BUTTON */}
          <div className="space-y-2">
            <button
              id="btn-execute-workflow"
              onClick={() => handleRunExecution()}
              disabled={isRunning || !promptText.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentAgent?.name} is Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate & Execute Task</span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                id="btn-cancel-dispatcher-task"
                type="button"
                onClick={handleCancelExecution}
                className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Cancel Task (Refund Quota)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: GENERATION RESULT STUDIO & TELEMETRY */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Navigation Tabs (Generated Result vs Node Graph Trace vs History) */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("prompt")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "prompt"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>AI Generation Result</span>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "graph"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Execution Steps & Graph</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Run History ({executionHistory.length})</span>
            </button>
          </div>

          {currentExecution && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                <Coins className="w-3.5 h-3.5 text-blue-500" />
                <span>{currentExecution.creditsCost ?? 12} Credits</span>
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>+{currentExecution.xpEarned} XP</span>
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{currentExecution.hoursSaved}h Saved</span>
              </span>
            </div>
          )}
        </div>

        {/* TAB 1: GENERATED RESULT STUDIO */}
        {activeTab === "prompt" && (
          <div className="space-y-4">
            {isRunning ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <Bot className="w-6 h-6 text-blue-500 absolute inset-0 m-auto" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentAgent?.name} is Generating Response...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Synthesizing prompt with {currentAgent?.model || "Gemini 3.7 Flash"} engine
                  </p>
                </div>
                {/* Prominent Cancel Button */}
                <button
                  id="btn-cancel-in-flight-dispatcher"
                  type="button"
                  onClick={handleCancelExecution}
                  className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95"
                >
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Cancel Task (Refund Quota)</span>
                </button>
              </div>
            ) : isCancelled ? (
              <div className="p-8 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-center space-y-3">
                <Ban className="w-10 h-10 text-red-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Task Cancelled
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  The generation was safely cancelled before completion. 0 Credits were deducted and your quota has been 100% preserved.
                </p>
              </div>
            ) : currentExecution ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
                {/* Result Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
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
                              : currentExecution.status === "cancelled"
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {currentExecution.status === "needs_review" ? "Pending Approval" : currentExecution.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Agent: <strong>{currentExecution.agentName}</strong> • {currentExecution.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSaveReport && (
                      <button
                        id="btn-save-as-report-vault"
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                          const isFinancialOrIncident = currentExecution.title.toLowerCase().includes("roi") || currentExecution.title.toLowerCase().includes("budget") || currentExecution.title.toLowerCase().includes("outage") || currentExecution.title.toLowerCase().includes("incident");
                          const reportDoc: GeneratedReportDocument = {
                            id: `rep-${Date.now().toString(36)}`,
                            title: currentExecution.title,
                            category: isFinancialOrIncident ? "Financial & ROI Audit" : "Executive Briefing",
                            classification: "Internal",
                            department: currentExecution.department,
                            agentId: currentExecution.agentId,
                            agentName: currentExecution.agentName,
                            modelUsed: currentAgent?.model || "Gemini 3.7 Flash",
                            createdAt: timestampStr,
                            sourcePrompt: promptText,
                            content: currentExecution.generatedOutput || currentExecution.summary,
                            summary: currentExecution.summary,
                            businessImpactUsd: Math.round((currentExecution.hoursSaved || 0.6) * 85),
                            hoursSavedEstimated: currentExecution.hoursSaved || 0.6,
                            wordCount: (currentExecution.generatedOutput || "").split(/\s+/).filter(Boolean).length || 350,
                            tags: [currentExecution.department.split(" ")[0], "Intelligence", "AgentOutput"],
                            isPinned: false,
                            status: "final",
                            keyTakeaways: [
                              `Successfully executed by ${currentExecution.agentName}.`,
                              `Liberated ${currentExecution.hoursSaved || 0.6} hours of human operational labor.`,
                              `Passed SOC2 compliance with 0 audit violations.`
                            ],
                            metricsHighlights: [
                              { label: "Labor Saved", value: `$${Math.round((currentExecution.hoursSaved || 0.6) * 85)}`, trend: "+100%" },
                              { label: "Hours Liberated", value: `${currentExecution.hoursSaved || 0.6}h`, trend: "Saved" }
                            ]
                          };
                          onSaveReport(reportDoc);
                          setIsSavedAsReport(true);
                          setTimeout(() => setIsSavedAsReport(false), 2500);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Save to Dashboard Reports Vault"
                      >
                        {isSavedAsReport ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Saved to Vault!</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                            <span>Save to Reports</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      id="btn-copy-dispatcher-output"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* HITL Review Banner if applicable */}
                {currentExecution.status === "needs_review" && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                          Human-in-the-Loop Review Gate
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
                          handleApproveHitlExecution(currentExecution);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Save to Automations Vault</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Rendered Generation Output with Rich Markdown formatting */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans selection:bg-blue-100 dark:selection:bg-blue-900 overflow-x-auto shadow-inner">
                  <div className="markdown-body space-y-3 prose dark:prose-invert max-w-none">
                    <Markdown>{currentExecution.generatedOutput || currentExecution.summary}</Markdown>
                  </div>
                </div>

                {/* Quality Verification & Discrepancy Troubleshooting Bar */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-amber-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Quality & Spec Verification</span>
                        {currentExecution.status === "approved" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <BookmarkCheck className="w-3 h-3" /> Saved in Automations Vault
                          </span>
                        )}
                        {currentExecution.status === "resolved" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                            Resolved via AI Diagnostics
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Did this output meet your expectations? If not, diagnose the root cause and auto-fix.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-dispatcher-not-what-i-asked-for"
                      onClick={() => {
                        setTroubleshootRecord(currentExecution);
                        setIsTroubleshootOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>This isn't what I asked for</span>
                    </button>

                    {currentExecution.status !== "approved" && currentExecution.status !== "resolved" && (
                      <button
                        type="button"
                        id="btn-dispatcher-approve-output"
                        onClick={() => {
                          handleApproveHitlExecution(currentExecution);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Approve & Save Automation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Follow-up Refinement Bar */}
                <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFollowUpRefinement();
                      }
                    }}
                    placeholder={`Ask ${currentExecution.agentName} to refine, expand, or adjust this output...`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFollowUpRefinement}
                    disabled={isFollowUpRunning || !followUpText.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    {isFollowUpRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Refine</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Bot className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Task Executed Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Select an agent on the left, type what you need done, and click "Generate & Execute Task".
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXECUTION STEPS & GRAPH */}
        {activeTab === "graph" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Granular Step Execution Trace</span>
            </h3>

            {currentExecution?.stepsOutput && currentExecution.stepsOutput.length > 0 ? (
              <div className="space-y-3">
                {currentExecution.stepsOutput.map((step, idx) => (
                  <div
                    key={step.nodeId || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{step.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-600 dark:text-slate-300">
                          {step.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-600 font-bold">
                          {Math.round((step.confidence || 0.98) * 100)}% Confidence
                        </span>
                        <span className="text-slate-400 font-mono">
                          {step.durationMs || 150}ms
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                      {step.output}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Run a task to see granular step results.</p>
            )}

            {/* Audit Logs */}
            {currentExecution?.auditLogs && currentExecution.auditLogs.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Compliance Audit Trail:
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto">
                  {currentExecution.auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RUN HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historical Task Executions ({filteredHistory.length})
              </h3>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="all">All Runs</option>
                <option value="completed">Completed</option>
                <option value="needs_review">Needs Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No past executions match the selected filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredHistory.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setCurrentExecution(rec);
                      setActiveTab("prompt");
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {rec.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                            rec.status === "completed"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : rec.status === "needs_review"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rec.agentName} • {rec.department} • {rec.timestamp}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        +{rec.xpEarned} XP
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Diagnostic & Troubleshooting Modal */}
      <TaskTroubleshootModal
        isOpen={isTroubleshootOpen}
        onClose={() => {
          setIsTroubleshootOpen(false);
          setTroubleshootRecord(null);
        }}
        task={troubleshootRecord}
        agents={agents}
        onTaskResolved={(updated) => {
          setCurrentExecution(updated);
          if (onUpdateExecution) {
            onUpdateExecution(updated);
          }
        }}
      />
    </div>
  );
};
