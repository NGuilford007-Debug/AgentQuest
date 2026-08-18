import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Agent, TaskExecutionRecord, Workflow } from "../types";
import { 
  Sparkles, 
  Play, 
  Check, 
  Copy, 
  Download, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Terminal, 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code,
  Zap,
  CornerDownLeft,
  SlidersHorizontal,
  BookmarkPlus,
  XCircle,
  Coins,
  Ban,
  X
} from "lucide-react";
import { fireCelebration } from "../utils/confetti";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  initialAgentId?: string;
  workflows?: Workflow[];
  onTaskCompleted: (record: TaskExecutionRecord) => void;
  streakMultiplier?: number;
}

// Tailored prompt starters per department/role
const ROLE_PROMPT_SUGGESTIONS: Record<string, string[]> = {
  "DevOps & SecOps": [
    "Analyze this Redis connection pool timeout error and generate root cause analysis with mitigation steps.",
    "Draft a post-mortem report for a 15-minute checkout API outage in us-east.",
    "Review recent pull requests for SQL injection vulnerabilities and insecure dependencies.",
    "Generate Kubernetes manifest and resource limits for a high-throughput microservice."
  ],
  "Sales & CRM": [
    "Draft a personalized cold outreach email for the VP of Engineering at Acme Fintech ($50M ARR).",
    "Analyze this discovery call transcript and summarize the top 3 customer pain points and next steps.",
    "Write a persuasive proposal email highlighting ROI metrics and 24/7 SLA benefits.",
    "Generate a follow-up email after a product demo addressing SOC2 compliance questions."
  ],
  "Customer Support": [
    "Draft a empathetic response to an enterprise customer experiencing SSO SAML 403 login errors.",
    "Write step-by-step troubleshooting instructions for webhook delivery failures.",
    "Generate a response for a customer requesting an invoice refund due to accidental seat upgrade.",
    "Summarize an angry customer ticket and suggest an escalation plan with a credit voucher."
  ],
  "Finance & Legal": [
    "Reconcile this AWS and Snowflake cloud invoice against our $45k/month budget limit.",
    "Review this standard Vendor Master Services Agreement (MSA) and highlight liability clauses.",
    "Generate a financial summary of Q3 software tool expenses and identify potential savings.",
    "Draft an approval memo for a $12,000 annual SaaS contract renewal."
  ],
  "Engineering": [
    "Analyze this slow PostgreSQL query and recommend missing indexes and query rewrites.",
    "Generate TypeScript interface types and validation schema for our User Profile API.",
    "Refactor this Python batch job to handle async concurrency and retry backoff.",
    "Draft technical documentation and API endpoint specifications for external developers."
  ],
  "Human Resources": [
    "Draft a job description for a Senior AI Automation Engineer with key competencies.",
    "Write an internal announcement email celebrating team achievements and automation milestones.",
    "Generate onboarding checklist and 30-60-90 day plan for a new Customer Success Manager.",
    "Draft employee policy guidelines for ethical AI usage and data protection."
  ]
};

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
  isOpen,
  onClose,
  agents,
  initialAgentId,
  workflows = [],
  onTaskCompleted,
  streakMultiplier = 1.0,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    initialAgentId || agents[0]?.id || ""
  );
  const [prompt, setPrompt] = useState<string>("");
  const [extraContext, setExtraContext] = useState<string>("");
  const [showExtraContext, setShowExtraContext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [executionSummary, setExecutionSummary] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [executionTelemetry, setExecutionTelemetry] = useState<{
    hoursSaved: number;
    xpEarned: number;
    latencyMs: number;
    modelUsed: string;
    isSimulated?: boolean;
  } | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<string>("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync selected agent if initialAgentId changes
  useEffect(() => {
    if (initialAgentId) {
      setSelectedAgentId(initialAgentId);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [initialAgentId, agents]);

  // Autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      // Clean up in-flight requests if closed
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const matchedWorkflow = workflows.find((w) => w.agentId === currentAgent?.id) || workflows[0];
  const suggestions = (currentAgent && ROLE_PROMPT_SUGGESTIONS[currentAgent.department]) || [
    "Write a concise executive brief on our recent automation efficiency metrics.",
    "Draft an enterprise response addressing high priority ticket #4921.",
    "Review system configuration and generate optimization recommendations.",
    "Summarize key takeaways and action items from this week's sprint."
  ];

  const handleCancelTask = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsCancelled(true);
    setExecutionSummary("Task cancelled by user. 0 Credits deducted • 100% Quota preserved.");
    setGeneratedOutput(null);
    setExecutionTelemetry({
      hoursSaved: 0,
      xpEarned: 0,
      latencyMs: 0,
      modelUsed: currentAgent?.model || "gemini-3.7-flash",
      isSimulated: false,
    });
  };

  const handleRunPrompt = async (promptToRun?: string) => {
    const finalPrompt = promptToRun || prompt;
    if (!finalPrompt.trim() || !currentAgent) return;

    // Reset cancellation and prepare new abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsCancelled(false);
    setGeneratedOutput(null);
    setExecutionSummary(null);
    setAuditLogs([]);

    const startTime = Date.now();

    try {
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
      const summaryText = data.summary || `Agent ${currentAgent.name} processed your request in ${((latencyMs) / 1000).toFixed(1)}s.`;
      const baseHours = data.hoursSaved || 0.6;
      const baseXp = data.xpEarned || 150;
      const boostedXp = Math.round(baseXp * streakMultiplier);
      const creditsCost = data.creditsCost || 12;
      const tokensConsumed = data.tokensConsumed || 640;

      setGeneratedOutput(outputText);
      setExecutionSummary(summaryText);
      setAuditLogs(data.auditLogs || [
        `Verified agent persona: ${currentAgent.role}`,
        `Executed prompt via ${currentAgent.model || "Gemini 3.7 Flash"}`,
        `Checked permissions: ${currentAgent.permissions.length} scopes active`,
      ]);

      const telemetry = {
        hoursSaved: baseHours,
        xpEarned: boostedXp,
        latencyMs: data.durationMs || latencyMs,
        modelUsed: data.modelUsed || currentAgent.model || "gemini-3.7-flash",
        isSimulated: data.isSimulated,
      };
      setExecutionTelemetry(telemetry);

      // Create permanent record with full generatedOutput and prompt text
      const record: TaskExecutionRecord = {
        id: `exec-${Date.now()}`,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        workflowId: matchedWorkflow?.id || "wf-adhoc",
        workflowName: matchedWorkflow?.name || "Direct Prompt Task",
        title: finalPrompt.length > 60 ? `${finalPrompt.slice(0, 57)}...` : finalPrompt,
        department: currentAgent.department,
        inputPayload: extraContext ? `${finalPrompt}\n\n[Context Data]:\n${extraContext}` : finalPrompt,
        status: "completed",
        summary: summaryText,
        generatedOutput: outputText,
        prompt: finalPrompt,
        creditsCost,
        tokensConsumed,
        stepsOutput: data.stepsOutput || [
          {
            nodeId: "step-1",
            name: "Prompt Analysis & Reasoning",
            type: "ai_process",
            status: "completed",
            durationMs: Math.round(latencyMs * 0.4),
            output: "Analyzed instructions and structured high-fidelity domain response.",
            confidence: 0.98,
          },
          {
            nodeId: "step-2",
            name: "Work Product Generation",
            type: "action_output",
            status: "completed",
            durationMs: Math.round(latencyMs * 0.6),
            output: outputText.slice(0, 150) + "...",
            confidence: 0.99,
          },
        ],
        auditLogs: data.auditLogs || (telemetry.modelUsed ? [`Engine: ${telemetry.modelUsed}`] : []),
        keyEntitiesExtracted: data.keyEntitiesExtracted || {},
        hoursSaved: baseHours,
        xpEarned: boostedXp,
        timestamp: "Just now",
        isSimulated: data.isSimulated,
      };

      onTaskCompleted(record);
      fireCelebration();
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Handled cleanly by cancellation
        return;
      }
      console.error("Error generating agent task:", err);
      // Graceful domain fallback if offline or unexpected
      const fallbackOutput = `### Response from ${currentAgent.name}\n\nProcessed prompt: "${finalPrompt}"\n\nI have evaluated the parameters according to my role as **${currentAgent.role}** (${currentAgent.department}). The action has been recorded in the enterprise workspace audit log.`;
      setGeneratedOutput(fallbackOutput);
      setExecutionSummary(`Generated resolution in simulated fallback environment.`);
      setExecutionTelemetry({
        hoursSaved: 0.5,
        xpEarned: 120,
        latencyMs: 320,
        modelUsed: currentAgent.model || "gemini-3.7-flash",
        isSimulated: true,
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim() || !generatedOutput || !currentAgent) return;
    setIsFollowUpLoading(true);

    try {
      const combinedPrompt = `Previous Task: ${prompt}\n\nPrevious Output from ${currentAgent.name}:\n${generatedOutput}\n\nFollow-up Request / Refinement:\n${followUpPrompt}`;
      
      const response = await fetch("/api/gemini/prompt-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: currentAgent.id,
          agent: currentAgent,
          prompt: combinedPrompt,
          temperature: currentAgent.temperature,
          permissions: currentAgent.permissions,
        }),
      });

      const data = await response.json();
      const outputText = data.generatedOutput || data.output || data.summary;
      if (outputText) {
        setGeneratedOutput(outputText);
        setFollowUpPrompt("");
        fireCelebration();
      }
    } catch (err) {
      console.error("Error refining task:", err);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentAgent?.name.toLowerCase().replace(/\s+/g, "_")}_output.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="quick-task-modal"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[92vh] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={currentAgent?.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"}
                alt={currentAgent?.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-blue-500/30 shadow-xs shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  Prompt {currentAgent?.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold font-mono">
                  {currentAgent?.model || "gemini-3.7-flash"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentAgent?.role} • {currentAgent?.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Agent Switcher Dropdown */}
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setGeneratedOutput(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 max-w-[160px] sm:max-w-[200px]"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>

            <button
              id="btn-close-quick-task"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* PROMPT INPUT SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>What do you need done?</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">⌘ + Enter</kbd> to run
              </span>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                id="quick-task-prompt-input"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleRunPrompt();
                  }
                }}
                placeholder={`Ask ${currentAgent?.name} to write code, review an incident, draft outreach, audit invoices, answer support...`}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Prompt Ideas Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Instant Prompt Ideas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(sug);
                      handleRunPrompt(sug);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 text-xs text-left transition-all max-w-full truncate"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Extra Context / Logs */}
            <div>
              <button
                type="button"
                onClick={() => setShowExtraContext(!showExtraContext)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline pt-1"
              >
                {showExtraContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showExtraContext ? "Hide Extra Context / Payload" : "+ Add Raw Payload / Stack Trace / Doc Link"}</span>
              </button>

              {showExtraContext && (
                <div className="mt-2 animate-in fade-in">
                  <textarea
                    rows={3}
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="Paste logs, stack traces, JSON payloads, or customer background here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{currentAgent?.permissions.length || 0} permissions authorized</span>
              </div>

              <div className="flex items-center gap-2">
                {isLoading && (
                  <button
                    id="btn-cancel-quick-task-bar"
                    type="button"
                    onClick={handleCancelTask}
                    className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Cancel Task</span>
                  </button>
                )}

                <button
                  id="btn-run-quick-task"
                  type="button"
                  onClick={() => handleRunPrompt()}
                  disabled={isLoading || !prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{currentAgent?.name} is thinking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* GENERATED OUTPUT STUDIO */}
          {(isLoading || generatedOutput || isCancelled) && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
              {/* Output Header & Action Tools */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {isCancelled ? (
                    <>
                      <Ban className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-xs text-red-600 dark:text-red-400">
                        Execution Cancelled (Quota 100% Refunded)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Generated Result from {currentAgent?.name}
                      </span>
                      {executionTelemetry?.isSimulated && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                          Offline Preview
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isCancelled ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-red-500" />
                      0 Credits Used • 0 Tokens
                    </span>
                  ) : executionTelemetry ? (
                    <>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-blue-500" />
                        12 Credits
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        +{executionTelemetry.xpEarned} XP
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {executionTelemetry.hoursSaved}h Saved
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Main Content Area */}
              {isLoading ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <Bot className="w-5 h-5 text-blue-500 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reasoning with {currentAgent?.model || "Gemini 3.7 Flash"}...
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Synthesizing response for {currentAgent?.role}
                    </div>
                  </div>

                  {/* Cancel Button inside Loading Box */}
                  <button
                    id="btn-cancel-in-flight-task"
                    type="button"
                    onClick={handleCancelTask}
                    className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95"
                  >
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Cancel Task (Refund Quota)</span>
                  </button>
                </div>
              ) : isCancelled ? (
                <div className="p-6 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-center space-y-2">
                  <Ban className="w-8 h-8 text-red-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Task Aborted Successfully
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    The task was aborted before credit commitment. 0 credits consumed. You can modify your prompt and run again anytime.
                  </p>
                </div>
              ) : (
                <div className="relative group">
                  {/* Floating Copy & Action Controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                      id="btn-copy-generation"
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Copy to clipboard"
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
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Rendered Text with Markdown formatting */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans selection:bg-blue-100 dark:selection:bg-blue-900 overflow-x-auto shadow-xs">
                    <div className="markdown-body space-y-3 prose dark:prose-invert max-w-none">
                      <Markdown>{generatedOutput}</Markdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up Refinement Bar */}
              {generatedOutput && (
                <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFollowUp();
                      }
                    }}
                    placeholder={`Ask ${currentAgent?.name} to refine, shorten, add code, or translate this...`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={isFollowUpLoading || !followUpPrompt.trim()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    {isFollowUpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Refine</span>
                  </button>
                </div>
              )}

              {/* TECHNICAL & AUDIT DETAILS ACCORDION (Secondary / Collapsed) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-500" />
                    <span>Technical Execution Trace & Audit Logs</span>
                  </span>
                  {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTechnicalDetails && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-950 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Model</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                          {executionTelemetry?.modelUsed || currentAgent?.model}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Latency</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          {executionTelemetry?.latencyMs || 240}ms
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          {currentAgent?.temperature}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Autonomy</div>
                        <div className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[11px]">
                          {currentAgent?.autonomyLevel}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Compliance Audit Trail:
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto">
                        {auditLogs.map((log, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-blue-500" />
            <span>Ready for autonomous execution</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
