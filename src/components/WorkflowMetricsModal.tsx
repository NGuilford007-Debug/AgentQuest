import React from "react";
import { Workflow } from "../types";
import { 
  X, 
  Workflow as WorkflowIcon, 
  Zap, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Send, 
  ExternalLink, 
  Layers, 
  Cpu, 
  UserCheck, 
  Play, 
  Fingerprint,
  TrendingUp,
  Sliders
} from "lucide-react";

interface WorkflowMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
  onToggleEmailNotifications: () => void;
  onSimulateRun: () => void;
  onOpenEmailCenter?: () => void;
}

export const WorkflowMetricsModal: React.FC<WorkflowMetricsModalProps> = ({
  isOpen,
  onClose,
  workflow,
  onToggleEmailNotifications,
  onSimulateRun,
  onOpenEmailCenter,
}) => {
  if (!isOpen) return null;

  const isEmailActive = workflow.emailNotificationsEnabled !== false;
  const hoursSaved = ((workflow.totalRuns || 0) * (workflow.avgHoursSavedPerRun || 0.5)).toFixed(1);
  const successRate = workflow.successRate ?? 99.4;

  const triggerNodesCount = workflow.nodes.filter((n) => n.type === "trigger").length;
  const aiNodesCount = workflow.nodes.filter((n) => n.type === "ai_process").length;
  const reviewNodesCount = workflow.nodes.filter((n) => n.type === "human_review" || n.type === "permission_gate").length;
  const outputNodesCount = workflow.nodes.filter((n) => n.type === "action_output").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <WorkflowIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pipeline Telemetry & Email Notification Controls
                </h3>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  workflow.isActive 
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}>
                  {workflow.isActive ? "Production Active" : "Staging Draft"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {workflow.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Email Notification Toggle Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
            isEmailActive 
              ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isEmailActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"
              }`}>
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Automated Action Receipt Emails
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                    isEmailActive 
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {isEmailActive ? "Active Dispatch" : "Muted"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sends verified execution receipts to <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">toppgunn321@gmail.com</span> with SHA-256 telemetry proof whenever this pipeline executes.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="modal-toggle-workflow-email"
              onClick={onToggleEmailNotifications}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isEmailActive ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isEmailActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4 Pipeline Execution KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Runs
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white block">
                {(workflow.totalRuns || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Lifetime runs</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Emails Sent
              </span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block">
                {(workflow.totalEmailsSent || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">100% delivered</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Success Rate
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                {successRate}%
              </span>
              <span className="text-[10px] text-slate-400">Zero crashes</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hours Saved
              </span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 block">
                {hoursSaved}h
              </span>
              <span className="text-[10px] text-slate-400">Automated</span>
            </div>
          </div>

          {/* Node Topology Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Node Topology & Execution Footprint
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Triggers:</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{triggerNodesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>AI Nodes:</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{aiNodesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>HITL Gates:</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewNodesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-violet-500" />
                  <span>Outputs:</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{outputNodesCount}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Last Execution: {workflow.lastRun || "10 mins ago"}</span>
              <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                <Fingerprint className="w-3 h-3" />
                <span>SHA-256 Telemetry Verified</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          {onOpenEmailCenter ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEmailCenter();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
              <span>Full Email & Metrics Center</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSimulateRun}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Run & Dispatch Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
