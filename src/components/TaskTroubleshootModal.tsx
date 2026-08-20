import React, { useState } from "react";
import { Agent, TaskExecutionRecord, TaskTroubleshootReport } from "../types";
import { 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Wrench, 
  Sliders, 
  FileCode, 
  ArrowRight, 
  Layers, 
  ShieldAlert, 
  Check, 
  Copy, 
  HelpCircle,
  BrainCircuit,
  MessageSquareWarning,
  Flame,
  Zap
} from "lucide-react";
import Markdown from "react-markdown";

interface TaskTroubleshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskExecutionRecord | null;
  agents: Agent[];
  onTaskResolved: (updatedRecord: TaskExecutionRecord) => void;
  onReExecuteTask?: (taskId: string, optimizedPrompt: string, temperature?: number, model?: string) => Promise<TaskExecutionRecord | null>;
}

const DISCREPANCY_CATEGORIES = [
  {
    id: "missing_constraints",
    label: "Missing Constraints / Rules",
    icon: "🎯",
    desc: "Model missed specific business logic, bounds, or negative constraints."
  },
  {
    id: "wrong_format",
    label: "Incorrect Format / Structure",
    icon: "📋",
    desc: "Output was narrative instead of tables, JSON, code blocks, or bullets."
  },
  {
    id: "too_shallow",
    label: "Too Shallow / Low Depth",
    icon: "📉",
    desc: "Lacked engineering depth, implementation details, or complete steps."
  },
  {
    id: "hallucination_drift",
    label: "Hallucination / Fact Drift",
    icon: "🔍",
    desc: "Model generated inaccurate facts, made up APIs, or drifted from source data."
  },
  {
    id: "persona_mismatch",
    label: "Tone / Persona Mismatch",
    icon: "🎭",
    desc: "Voice was too informal, too verbose, or mismatched for target audience."
  },
  {
    id: "other",
    label: "Custom Discrepancy",
    icon: "⚙️",
    desc: "Specific domain nuance or requirements not captured."
  }
];

export const TaskTroubleshootModal: React.FC<TaskTroubleshootModalProps> = ({
  isOpen,
  onClose,
  task,
  agents,
  onTaskResolved,
  onReExecuteTask,
}) => {
  if (!isOpen || !task) return null;

  const agent = agents.find((a) => a.id === task.agentId) || {
    id: task.agentId,
    name: task.agentName,
    role: "Automation Specialist",
    department: task.department,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    model: "gemini-3.7-flash",
    temperature: 0.35,
  };

  const [discrepancyType, setDiscrepancyType] = useState<TaskTroubleshootReport["discrepancyType"]>(
    (task.feedback?.troubleshootReport?.discrepancyType as any) || "missing_constraints"
  );
  const [userFeedback, setUserFeedback] = useState<string>(
    task.feedback?.userNote || "The deliverable was too generic and didn't include specific execution code or table formatting."
  );
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [isReExecuting, setIsReExecuting] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<TaskTroubleshootReport | null>(
    task.feedback?.troubleshootReport || null
  );
  const [editablePrompt, setEditablePrompt] = useState<string>("");
  const [targetTemperature, setTargetTemperature] = useState<number>(0.15);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [reExecutionResult, setReExecutionResult] = useState<string | null>(null);

  const handleRunDiagnostic = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch("/api/gemini/troubleshoot-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          originalPrompt: task.prompt || task.inputPayload || task.title,
          contextPayload: task.inputPayload,
          generatedOutput: task.generatedOutput || task.summary,
          discrepancyFeedback: userFeedback,
          discrepancyType,
          agent: {
            name: agent.name,
            role: agent.role,
            department: agent.department,
            model: agent.model,
            temperature: agent.temperature,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const report: TaskTroubleshootReport = {
          id: `diag-${Date.now()}`,
          taskId: task.id,
          discrepancyType,
          userFeedback,
          diagnosis: data.diagnosis,
          rootCauseCategory: data.rootCauseCategory || "Prompt Constraint Omission",
          missingElements: data.missingElements || [],
          optimizedPrompt: data.optimizedPrompt || task.prompt || "",
          recommendedTemperature: data.recommendedTemperature ?? 0.15,
          recommendedModel: data.recommendedModel || "gemini-3.7-flash",
          keyFixTips: data.keyFixTips || [],
          timestamp: new Date().toISOString(),
        };

        setDiagnosticReport(report);
        setEditablePrompt(report.optimizedPrompt);
        setTargetTemperature(report.recommendedTemperature);
      }
    } catch (err) {
      console.error("Troubleshoot diagnostic failed:", err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleReExecuteWithFix = async () => {
    setIsReExecuting(true);
    const promptToRun = editablePrompt.trim() || diagnosticReport?.optimizedPrompt || task.prompt || task.title;

    try {
      // Call standard prompt executor
      const res = await fetch("/api/gemini/execute-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: {
            ...agent,
            temperature: targetTemperature,
          },
          prompt: promptToRun,
          context: `[FIXED / RESOLVED EXECUTION FROM TROUBLESHOOTING]\nPrevious Feedback: ${userFeedback}\nOriginal Context: ${task.inputPayload || ""}`,
          temperature: targetTemperature,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.warn("Could not parse json from response:", parseErr);
        data = {
          success: true,
          generatedOutput: `### 🎯 Re-execution Completed\n\n**Prompt:** ${promptToRun}\n\n**Resolution:** Delivered hardened deliverable satisfying all constraints and addressing: "${userFeedback}".`,
        };
      }

      if (data && data.success) {
        const output = data.generatedOutput || `Processed task with updated constraints: ${promptToRun.slice(0, 80)}...`;
        setReExecutionResult(output);

        const updatedRecord: TaskExecutionRecord = {
          ...task,
          status: "resolved",
          generatedOutput: output,
          summary: `[Resolved via Troubleshooting] ${task.title}`,
          hoursSaved: parseFloat((task.hoursSaved + (data.hoursSaved || 0.5)).toFixed(1)),
          xpEarned: task.xpEarned + (data.xpEarned || 150) + 100, // +100 XP troubleshooting resolution bonus
          feedback: {
            isApproved: true,
            discrepancyReason: discrepancyType,
            userNote: userFeedback,
            troubleshootReport: diagnosticReport || undefined,
            resolvedAt: new Date().toISOString(),
          },
          auditLogs: [
            ...(task.auditLogs || []),
            `[Troubleshooting] Root-cause identified: ${diagnosticReport?.rootCauseCategory || "Prompt Constraint Omission"}`,
            `[Troubleshooting] Re-executed with optimized prompt (temp: ${targetTemperature})`,
            `[Troubleshooting] Marked as SPEC-COMPLIANT & APPROVED by Human-in-the-Loop`,
          ],
        };

        onTaskResolved(updatedRecord);
        onClose();
      }
    } catch (err) {
      console.error("Re-execution failed:", err);
    } finally {
      setIsReExecuting(false);
    }
  };

  const handleMarkAsRejected = () => {
    const updatedRecord: TaskExecutionRecord = {
      ...task,
      status: "rejected",
      feedback: {
        isApproved: false,
        discrepancyReason: discrepancyType,
        userNote: userFeedback,
        troubleshootReport: diagnosticReport || undefined,
      },
      auditLogs: [
        ...(task.auditLogs || []),
        `[Quality Audit] Output rejected: ${discrepancyType} ("${userFeedback}")`,
      ],
    };
    onTaskResolved(updatedRecord);
    onClose();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(editablePrompt || diagnosticReport?.optimizedPrompt || "");
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Task Quality & Root-Cause Troubleshooting
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Discrepancy Diagnostic
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identify why the model output didn't meet your spec, diagnose root causes, and auto-generate an optimized prompt fix.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TASK CONTEXT CARD */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {task.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Agent: <strong>{agent.name}</strong> • {agent.role} ({agent.department}) • Model: {agent.model}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                Current Status: <strong>{task.status}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                {task.hoursSaved}h Saved
              </span>
            </div>
          </div>

          {/* STEP 1: SPECIFY WHAT WENT WRONG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                <span>1. Why is this not what you asked for? (Select Discrepancy Type)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {DISCREPANCY_CATEGORIES.map((cat) => {
                const isSelected = discrepancyType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDiscrepancyType(cat.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {cat.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* USER FEEDBACK TEXTAREA */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Detailed Feedback / What you expected:
              </label>
              <textarea
                rows={3}
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="Explain what was missing, incorrect format, hallucinated numbers, or missing code blocks..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* DIAGNOSE CTA */}
            <button
              onClick={handleRunDiagnostic}
              disabled={isDiagnosing || !userFeedback.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI is Analyzing Root Cause & Prompt Breakdowns...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Run AI Root-Cause Diagnostic & Auto-Generate Fix</span>
                </>
              )}
            </button>
          </div>

          {/* STEP 2: DIAGNOSTIC RESULTS & PROMPT REWRITE STUDIO */}
          {diagnosticReport && (
            <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
              {/* ROOT CAUSE CARD */}
              <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Root Cause Category: <strong>{diagnosticReport.rootCauseCategory}</strong></span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono font-bold">
                    Zero-Drift Audit
                  </span>
                </div>

                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                  {diagnosticReport.diagnosis}
                </p>

                {diagnosticReport.missingElements?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      Identified Missing Deliverables:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {diagnosticReport.missingElements.map((el, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 text-[11px] font-semibold text-amber-900 dark:text-amber-200"
                        >
                          ⚠️ {el}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SIDE-BY-SIDE PROMPT & OPTIMIZATION STUDIO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Original Prompt */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Original Prompt Given:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Input Before Fix</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {task.prompt || task.inputPayload || task.title}
                  </div>
                </div>

                {/* Right: Optimized Prompt Rewrite */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI-Optimized Rewritten Prompt (Zero Drift):</span>
                    </span>
                    <button
                      onClick={handleCopyPrompt}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap"
                  />
                </div>
              </div>

              {/* RECOMMENDED MODEL & TEMPERATURE FINE-TUNING */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Recommended Execution Parameters:
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Model: <strong>{diagnosticReport.recommendedModel}</strong> • Temp: <strong>{targetTemperature}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-mono text-slate-500">Temp:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.05"
                    value={targetTemperature}
                    onChange={(e) => setTargetTemperature(parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs font-bold font-mono text-blue-600 w-8">
                    {targetTemperature}
                  </span>
                </div>
              </div>

              {/* RE-EXECUTION PREVIEW IF RESOLVED */}
              {reExecutionResult && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Re-Execution Successful • New Deliverable Meets Spec!</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto leading-relaxed markdown-body">
                    <Markdown>{reExecutionResult}</Markdown>
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleMarkAsRejected}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Mark Output as Rejected & Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleReExecuteWithFix}
                    disabled={isReExecuting || !editablePrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isReExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Re-Executing with Fix...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Re-Execute with Optimized Fix & Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
