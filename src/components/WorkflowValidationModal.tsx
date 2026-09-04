import React from "react";
import {
  AlertTriangle,
  X,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Trash2,
  ShieldAlert,
  ArrowRight,
  GitFork,
  Sparkles,
  Zap,
} from "lucide-react";
import { WorkflowValidationError, WorkflowValidationReport } from "../utils/workflowValidation";
import { WorkflowNode, WorkflowConnection } from "../types";

interface WorkflowValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WorkflowValidationReport;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onSelectNode: (nodeId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onAutoRepair: () => void;
  isDeploymentAttempt?: boolean;
  workflowName?: string;
}

export const WorkflowValidationModal: React.FC<WorkflowValidationModalProps> = ({
  isOpen,
  onClose,
  report,
  nodes,
  connections,
  onSelectNode,
  onDeleteConnection,
  onAutoRepair,
  isDeploymentAttempt = false,
  workflowName,
}) => {
  if (!isOpen) return null;

  const nodeMap = new Map<string, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      id="workflow-validation-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="workflow-validation-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-start justify-between gap-3 ${
            isDeploymentAttempt || !report.isValid
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
              : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isDeploymentAttempt || !report.isValid
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/20"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              }`}
            >
              {isDeploymentAttempt || !report.isValid ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2
                id="validation-modal-title"
                className={`text-lg font-bold ${
                  isDeploymentAttempt || !report.isValid
                    ? "text-rose-900 dark:text-rose-200"
                    : "text-emerald-900 dark:text-emerald-200"
                }`}
              >
                {isDeploymentAttempt
                  ? "Deployment Blocked: Invalid Automation Pipeline"
                  : report.isValid
                  ? "Pipeline Validation Passed"
                  : "Pipeline Validation Issues Detected"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isDeploymentAttempt
                  ? "Deployment to the live production fleet is locked until all broken connections and missing configuration fields are resolved."
                  : report.isValid
                  ? "All node connections, routing branches, and required configuration fields are verified and ready for live execution."
                  : `Detected ${report.stats.totalErrors} critical issue${
                      report.stats.totalErrors > 1 ? "s" : ""
                    } that must be resolved prior to pipeline deployment.`}
              </p>
            </div>
          </div>
          <button
            id="btn-close-validation-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Summary Badges */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              {report.stats.brokenConnectionsCount} Broken Connection{report.stats.brokenConnectionsCount !== 1 ? "s" : ""}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {report.stats.missingFieldsCount} Missing Field{report.stats.missingFieldsCount !== 1 ? "s" : ""}
            </span>
            {report.stats.structuralCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {report.stats.structuralCount} Structural Defect{report.stats.structuralCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>

          {!report.isValid && (
            <button
              id="btn-auto-repair-modal"
              onClick={onAutoRepair}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Repair All Issues</span>
            </button>
          )}
        </div>

        {/* Scrollable Issue List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {report.errors.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Pipeline is structurally sound and fully configured!
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All data connectors, triggers, reasoning prompts, and conditional branches are verified with active routing.
              </p>
            </div>
          ) : (
            report.errors.map((error) => {
              const node = error.nodeId ? nodeMap.get(error.nodeId) : undefined;
              const isBrokenConn = error.type === "broken_connection";
              const isMissingField = error.type === "missing_field";

              return (
                <div
                  key={error.id}
                  className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-start justify-between gap-3 group transition-colors hover:bg-rose-50/80 dark:hover:bg-rose-950/30"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1 rounded bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          {error.title}
                        </span>
                        {error.type === "broken_connection" && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded font-semibold">
                            Connection Cable
                          </span>
                        )}
                        {error.type === "missing_field" && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded font-semibold">
                            Config Field: {error.field}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-800/90 dark:text-rose-300 mt-0.5 leading-relaxed">
                        {error.message}
                      </p>
                      {node && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <span>Component:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {node.name}
                          </span>
                          <span className="text-[10px] uppercase px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                            {node.type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {error.nodeId && (
                      <button
                        onClick={() => {
                          onSelectNode(error.nodeId!);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        title="Focus and inspect node in canvas"
                      >
                        <span>Fix Node</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {error.connectionId && (
                      <button
                        onClick={() => onDeleteConnection(error.connectionId!)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-xs font-semibold shadow-xs transition-colors"
                        title="Delete this broken connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Fix issues highlighted in <span className="text-rose-600 font-bold">RED</span> on the canvas or configuration panel.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Back to Canvas
            </button>
            {!report.isValid && (
              <button
                onClick={onAutoRepair}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Auto-Repair All Issues</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
