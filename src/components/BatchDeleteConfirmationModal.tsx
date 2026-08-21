import React, { useState } from "react";
import { Agent, Workflow, WorkflowNode, WorkflowConnection } from "../types";
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  Bot, 
  Workflow as WorkflowIcon, 
  Zap, 
  Clock, 
  Layers, 
  CheckCircle2, 
  TrendingDown, 
  GitFork, 
  Key, 
  Lock, 
  ArrowRight,
  HelpCircle,
  Activity,
  AlertCircle
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

export type BatchDeleteType = "agents" | "workflows" | "nodes";

export interface BatchDeleteConfirmationModalProps {
  isOpen: boolean;
  type: BatchDeleteType;
  // For agents
  selectedAgents?: Agent[];
  allWorkflows?: Workflow[];
  // For workflows
  selectedWorkflows?: Workflow[];
  allAgents?: Agent[];
  // For nodes
  selectedNodes?: WorkflowNode[];
  allConnections?: WorkflowConnection[];
  currentWorkflowName?: string;
  // Callbacks
  onClose: () => void;
  onConfirm: () => void;
}

export const BatchDeleteConfirmationModal: React.FC<BatchDeleteConfirmationModalProps> = ({
  isOpen,
  type,
  selectedAgents = [],
  allWorkflows = [],
  selectedWorkflows = [],
  allAgents = [],
  selectedNodes = [],
  allConnections = [],
  currentWorkflowName = "Current Pipeline",
  onClose,
  onConfirm,
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  // --- IMPACT CALCULATIONS ---

  // 1. AGENTS IMPACT
  const affectedAgentIds = new Set(selectedAgents.map((a) => a.id));
  const dependentWorkflows = allWorkflows.filter((wf) => affectedAgentIds.has(wf.agentId));
  const totalTasksCompleted = selectedAgents.reduce((acc, a) => acc + (a.stats?.tasksCompleted || 0), 0);
  const totalHoursSaved = selectedAgents.reduce((acc, a) => acc + (a.stats?.hoursSaved || 0), 0);
  const affectedDepartments = Array.from(new Set(selectedAgents.map((a) => a.department)));
  const uniquePermissions = Array.from(new Set(selectedAgents.flatMap((a) => a.permissions || [])));
  const activeAgentCount = selectedAgents.filter((a) => a.status === "active").length;

  // 2. WORKFLOWS IMPACT
  const affectedWorkflowIds = new Set(selectedWorkflows.map((w) => w.id));
  const totalWfRuns = selectedWorkflows.reduce((acc, w) => acc + (w.totalRuns || 0), 0);
  const totalWfNodes = selectedWorkflows.reduce((acc, w) => acc + (w.nodes?.length || 0), 0);
  const totalWfHoursMonthly = selectedWorkflows.reduce(
    (acc, w) => acc + (w.totalRuns || 0) * (w.avgHoursSavedPerRun || 0.5),
    0
  );
  const wfDepartments = Array.from(new Set(selectedWorkflows.map((w) => w.department)));
  const boundAgents = allAgents.filter((a) => selectedWorkflows.some((w) => w.agentId === a.id));
  const activeWfCount = selectedWorkflows.filter((w) => w.isActive).length;
  const totalTriggers = selectedWorkflows.reduce(
    (acc, w) => acc + (w.nodes?.filter((n) => n.type === "trigger").length || 0),
    0
  );

  // 3. NODES IMPACT
  const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
  const severedConnections = allConnections.filter(
    (c) => selectedNodeIds.has(c.from) || selectedNodeIds.has(c.to)
  );
  const triggerNodesCount = selectedNodes.filter((n) => n.type === "trigger").length;
  const actionNodesCount = selectedNodes.filter((n) => n.type === "action_output").length;
  const conditionNodesCount = selectedNodes.filter((n) => n.type === "condition").length;
  const humanReviewNodesCount = selectedNodes.filter((n) => n.type === "human_review").length;

  // SEVERITY BADGE DETERMINATION
  let severity: "CRITICAL" | "HIGH" | "MODERATE" = "MODERATE";
  let severityColor = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700";
  
  if (type === "agents") {
    if (activeAgentCount > 2 || dependentWorkflows.length > 2 || selectedAgents.length >= 4) {
      severity = "CRITICAL";
      severityColor = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700";
    } else if (activeAgentCount > 0 || dependentWorkflows.length > 0 || selectedAgents.length > 1) {
      severity = "HIGH";
      severityColor = "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    }
  } else if (type === "workflows") {
    if (activeWfCount > 1 || selectedWorkflows.length >= 3 || totalWfRuns > 50) {
      severity = "CRITICAL";
      severityColor = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700";
    } else if (activeWfCount > 0 || selectedWorkflows.length > 1) {
      severity = "HIGH";
      severityColor = "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    }
  } else if (type === "nodes") {
    if (triggerNodesCount > 0 || actionNodesCount > 0 || severedConnections.length >= 4) {
      severity = "HIGH";
      severityColor = "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    }
  }

  const itemsCount = 
    type === "agents" 
      ? selectedAgents.length 
      : type === "workflows" 
      ? selectedWorkflows.length 
      : selectedNodes.length;

  const requiresTextConfirm = severity === "CRITICAL" && itemsCount >= 3;
  const isConfirmReady = hasAcknowledged && (!requiresTextConfirm || confirmText.trim().toUpperCase() === "DELETE");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800 shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Confirm Batch Delete: {itemsCount} {type === "agents" ? (itemsCount === 1 ? "Agent" : "Agents") : type === "workflows" ? (itemsCount === 1 ? "Workflow Pipeline" : "Workflow Pipelines") : (itemsCount === 1 ? "Workflow Node" : "Workflow Nodes")}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${severityColor}`}>
                  {severity} Automation Impact
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Carefully review the impacted automated pipelines, execution history, and downstream business systems before proceeding.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold shrink-0 transition-colors"
            title="Cancel and close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* SECTION 1: POTENTIAL IMPACT ON AUTOMATION SUMMARY BANNER */}
          <div className="rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Projected Automation Impact & Disruption Analysis</span>
            </div>

            {/* Impact Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {type === "agents" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Bound Workflows</div>
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                      <WorkflowIcon className="w-3.5 h-3.5" />
                      <span>{dependentWorkflows.length} Pipelines</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {dependentWorkflows.length > 0 ? "Will lose active execution agent" : "No active pipeline dependencies"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Automation Throughput</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{totalHoursSaved.toFixed(1)}h Logged</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {totalTasksCompleted} automated tasks executed
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Business Units</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{affectedDepartments.length} Departments</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                      {affectedDepartments.join(", ") || "General"}
                    </div>
                  </div>
                </>
              )}

              {type === "workflows" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Active Pipelines</div>
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{activeWfCount} of {selectedWorkflows.length} Active</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {totalTriggers} triggers & event hooks halted
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Workflow Nodes</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{totalWfNodes} Orchestration Steps</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {totalWfRuns} cumulative runs recorded
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Assigned AI Agents</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5 truncate">
                      <Bot className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{boundAgents.length} Agents Assigned</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Will have pipeline unlinked
                    </div>
                  </div>
                </>
              )}

              {type === "nodes" && (
                <>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Severed Links</div>
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5" />
                      <span>{severedConnections.length} Wire Connections</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Branch routing broken
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Critical Nodes</div>
                    <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{triggerNodesCount + actionNodesCount} In/Out Steps</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {triggerNodesCount} triggers, {actionNodesCount} outputs
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Logic & Gates</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                      <span>{conditionNodesCount + humanReviewNodesCount} Decision Gates</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Evaluators removed
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Specific Warning Points */}
            <div className="space-y-1.5 text-[11px] text-rose-800 dark:text-rose-300">
              {type === "agents" && dependentWorkflows.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">• Pipeline Warning:</span>
                  <span>
                    The following {dependentWorkflows.length} workflows ({dependentWorkflows.map((w) => `"${w.name}"`).join(", ")}) are directly operated by these agents and will require reassignment.
                  </span>
                </div>
              )}
              {type === "agents" && uniquePermissions.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">• Revoked Scopes:</span>
                  <span>
                    {uniquePermissions.length} granted app/API permissions ({uniquePermissions.slice(0, 4).join(", ")}{uniquePermissions.length > 4 ? "..." : ""}) will be unlinked from autonomous execution.
                  </span>
                </div>
              )}
              {type === "workflows" && activeWfCount > 0 && (
                <div className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">• Production Disruption:</span>
                  <span>
                    {activeWfCount} actively running production pipelines will be deleted immediately. Scheduled tasks, webhook triggers, and automated batch jobs will fail.
                  </span>
                </div>
              )}
              {type === "nodes" && (
                <div className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">• Flow Disconnection:</span>
                  <span>
                    Deleting these nodes from "{currentWorkflowName}" will permanently break execution data passed along {severedConnections.length} connection paths.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LIST OF ITEMS TO BE REMOVED */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Items Marked for Deletion ({itemsCount}):</span>
              <span className="text-[11px] text-slate-400 font-normal">This action is permanent and cannot be undone</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto space-y-2">
              {/* AGENTS LIST */}
              {type === "agents" && selectedAgents.map((agent) => {
                const boundWfs = allWorkflows.filter((w) => w.agentId === agent.id);
                return (
                  <div
                    key={agent.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {agent.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${agent.status === "active" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {agent.role} • {agent.department} • {agent.model}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                        {agent.stats?.hoursSaved?.toFixed(1) || "0.0"} hrs saved
                      </span>
                      {boundWfs.length > 0 && (
                        <span className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold block">
                          {boundWfs.length} bound workflow{boundWfs.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* WORKFLOWS LIST */}
              {type === "workflows" && selectedWorkflows.map((wf) => {
                const assignedAg = allAgents.find((a) => a.id === wf.agentId);
                return (
                  <div
                    key={wf.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                        <WorkflowIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {wf.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${wf.isActive ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                            {wf.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {wf.department} • {wf.nodes?.length || 0} nodes • {assignedAg ? `Agent: ${assignedAg.name}` : "No Agent"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                        {wf.totalRuns || 0} total runs
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                        ~{((wf.totalRuns || 0) * (wf.avgHoursSavedPerRun || 0.5)).toFixed(1)} hrs automated
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* NODES LIST */}
              {type === "nodes" && selectedNodes.map((node) => {
                const nodeConns = allConnections.filter((c) => c.from === node.id || c.to === node.id);
                return (
                  <div
                    key={node.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                        <DynamicIcon name={node.iconName || "Cpu"} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {node.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {node.type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {node.description || "Workflow step"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 block">
                        {nodeConns.length} wire{nodeConns.length === 1 ? "" : "s"} attached
                      </span>
                      {node.attachedAssetIds && node.attachedAssetIds.length > 0 && (
                        <span className="text-[9px] text-slate-400 block">
                          {node.attachedAssetIds.length} asset ref
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: SAFETY ACKNOWLEDGMENT CONTROLS */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-rose-600 rounded focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                I understand that removing these <strong className="text-slate-900 dark:text-white">{itemsCount} {type}</strong> will permanently delete their configuration and halt any associated enterprise automation pipelines.
              </span>
            </label>

            {requiresTextConfirm && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Critical Fleet Action: Type <span className="font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-300">DELETE</span> below to confirm:
                </div>
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 uppercase"
                />
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isConfirmReady}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              isConfirmReady
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 active:scale-95 cursor-pointer"
                : "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm & Permanently Remove ({itemsCount} {type === "agents" ? "Agents" : type === "workflows" ? "Workflows" : "Nodes"})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
