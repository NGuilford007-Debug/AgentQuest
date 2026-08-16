import React, { useState } from "react";
import { Agent, AgentTemplate, AiModel, Department } from "../types";
import { AGENT_TEMPLATES } from "../data/agentTemplates";
import { 
  Bot, 
  Plus, 
  Workflow as WorkflowIcon, 
  Play, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Users, 
  Trash2, 
  PauseCircle, 
  PlayCircle,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  Wand2,
  Cpu,
  ArrowRight
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface AgentRosterProps {
  agents: Agent[];
  models?: AiModel[];
  onCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onOpenWorkflow: (agentId: string) => void;
  onTaskAgent: (agentId: string) => void;
  onToggleAgentStatus: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onOpenHealthMonitor?: (agentId?: string) => void;
  onOpenModelManager?: (agentId?: string) => void;
  onOpenTemplateModal?: () => void;
  onInstantiateTemplate?: (template: AgentTemplate) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({
  agents,
  models = [],
  onCreateAgent,
  onEditAgent,
  onOpenWorkflow,
  onTaskAgent,
  onToggleAgentStatus,
  onDeleteAgent,
  onOpenHealthMonitor,
  onOpenModelManager,
  onOpenTemplateModal,
  onInstantiateTemplate,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showTemplatesSpotlight, setShowTemplatesSpotlight] = useState<boolean>(true);

  const featuredTemplates = AGENT_TEMPLATES.slice(0, 4);
  const unhealthyAgents = agents.filter((a) => (a.stats.successRate ?? 95) < 90);

  const filteredAgents = agents.filter((ag) => {
    if (selectedDept !== "all" && ag.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ag.name.toLowerCase().includes(q) ||
        ag.role.toLowerCase().includes(q) ||
        ag.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>Autonomous Enterprise AI Agents ({agents.length})</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configured with specific domain scopes, autonomy levels, and team assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onOpenTemplateModal && (
            <button
              onClick={onOpenTemplateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Agent Templates</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-bold">
                {AGENT_TEMPLATES.length}
              </span>
            </button>
          )}

          {onOpenModelManager && (
            <button
              onClick={() => onOpenModelManager()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all"
              title="Enterprise AI Models Registry"
            >
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Model Hub</span>
              {models.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {models.length}
                </span>
              )}
            </button>
          )}

          {onOpenHealthMonitor && (
            <button
              onClick={() => onOpenHealthMonitor()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all"
            >
              <Activity className="w-4 h-4 text-rose-500" />
              <span>Health Hub</span>
              {unhealthyAgents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {unhealthyAgents.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onCreateAgent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Custom Agent</span>
          </button>
        </div>
      </div>

      {/* AGENT TEMPLATES SPOTLIGHT CAROUSEL BANNER */}
      {showTemplatesSpotlight && onOpenTemplateModal && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-indigo-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Quick-Launch Production Archetype Blueprints
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pre-configured with tested system prompts, tool scopes, and benchmarked models.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenTemplateModal}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All {AGENT_TEMPLATES.length} Templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTemplatesSpotlight(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs"
                title="Dismiss spotlight banner"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <img
                      src={tmpl.avatar}
                      alt={tmpl.name}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {tmpl.difficultyTier}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {tmpl.role}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>~{tmpl.estimatedHoursSavedPerMonth}h/mo</span>
                  </span>
                  <button
                    onClick={() => {
                      if (onInstantiateTemplate) {
                        onInstantiateTemplate(tmpl);
                      } else if (onOpenTemplateModal) {
                        onOpenTemplateModal();
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Deploy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proactive Agent Health Alert Banner */}
      {unhealthyAgents.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                <span>Agent Health Telemetry Alert:</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  {unhealthyAgents.length} Agent{unhealthyAgents.length > 1 ? "s" : ""} Experiencing Elevated Failure / Low ROI
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                {unhealthyAgents.map(a => a.name).join(", ")} flagged for sampling drift or ambiguous prompts.
              </p>
            </div>
          </div>

          {onOpenHealthMonitor && (
            <button
              onClick={() => onOpenHealthMonitor(unhealthyAgents[0]?.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Diagnose & Optimize</span>
            </button>
          )}
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search agents by role, persona, or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Departments ({agents.length})</option>
          <option value="DevOps & SecOps">DevOps & SecOps</option>
          <option value="Sales & CRM">Sales & CRM</option>
          <option value="Customer Support">Customer Support</option>
          <option value="Finance & Legal">Finance & Legal</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
        </select>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const isAutonomous = agent.autonomyLevel === "autonomous";
          const isHitl = agent.autonomyLevel === "hitl";
          const successRate = agent.stats.successRate ?? 95;
          const isCriticalHealth = successRate < 75;
          const isWarningHealth = successRate >= 75 && successRate < 90;

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs space-y-4 ${
                isCriticalHealth
                  ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20"
                  : isWarningHealth
                  ? "border-amber-300 dark:border-amber-900/60"
                  : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              {/* Agent Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {agent.name}
                      </h3>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          agent.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {agent.role}
                      </span>
                      {onOpenModelManager ? (
                        <button
                          type="button"
                          onClick={() => onOpenModelManager(agent.id)}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
                          title="Click to switch or configure AI model"
                        >
                          <Cpu className="w-2.5 h-2.5 text-blue-500" />
                          <span>{agent.model}</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">
                          <Cpu className="w-2.5 h-2.5 text-blue-500" />
                          <span>{agent.model}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {agent.department} • Assigned to: <strong>{agent.assignedTo.userName}</strong> ({agent.assignedTo.team})
                    </div>
                  </div>
                </div>

                {/* Health & Autonomy Badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${
                      isAutonomous
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : isHitl
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {agent.autonomyLevel.toUpperCase()}
                  </span>

                  {isCriticalHealth ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Health: {successRate}%</span>
                    </span>
                  ) : isWarningHealth ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Health: {successRate}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Health: {successRate}%</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {agent.description}
              </p>

              {/* Performance Metrics & Permissions */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tasks Run</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {agent.stats.tasksCompleted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Hours Saved</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {agent.stats.hoursSaved}h
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</div>
                  <div className={`text-xs font-bold font-mono ${
                    isCriticalHealth ? "text-rose-600 dark:text-rose-400" : isWarningHealth ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {agent.stats.successRate}%
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>{agent.permissions.length} Scopes Active</span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenHealthMonitor && (
                    <button
                      onClick={() => onOpenHealthMonitor(agent.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        isCriticalHealth || isWarningHealth
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="AI Health Diagnostic & Optimizer"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isCriticalHealth || isWarningHealth ? "text-rose-500 animate-pulse" : "text-slate-500"}`} />
                      <span>{isCriticalHealth || isWarningHealth ? "AI Diagnose" : "Health"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEditAgent(agent)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Configure Agent & Permissions"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenWorkflow(agent.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    <WorkflowIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Canvas</span>
                  </button>

                  <button
                    onClick={() => onTaskAgent(agent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Task Agent</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
