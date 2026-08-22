import React, { useState, useMemo } from "react";
import { Agent, AgentTemplate, AiModel, Department, Workflow } from "../types";
import { AGENT_TEMPLATES } from "../data/agentTemplates";
import { BatchDeleteConfirmationModal } from "./BatchDeleteConfirmationModal";
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
  ArrowRight,
  Lock,
  Eye,
  Info,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Check,
  Power,
  Globe,
  Inbox,
  Send,
  MessageSquare
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface AgentRosterProps {
  agents: Agent[];
  workflows?: Workflow[];
  models?: AiModel[];
  onCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onOpenWorkflow: (agentId: string) => void;
  onTaskAgent: (agentId: string) => void;
  onToggleAgentStatus: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onBatchUpdateStatus?: (agentIds: string[], status: "active" | "idle") => void;
  onBatchDeleteAgents?: (agentIds: string[]) => void;
  onOpenHealthMonitor?: (agentId?: string) => void;
  onOpenModelManager?: (agentId?: string) => void;
  onOpenTemplateModal?: () => void;
  onInstantiateTemplate?: (template: AgentTemplate) => void;
  isMasterDeveloper?: boolean;
  developerCompanyName?: string;
  onOpenMasterAccessGate?: () => void;
  onOpenProfilePrivacy?: () => void;
  onRequestClientAccess?: (agent: Agent) => void;
  onUpdateAgentVisibility?: (agentId: string, visibility: "internal_only" | "client_visible" | "pending_client_review", clientPageAllowed: boolean) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({
  agents,
  workflows = [],
  models = [],
  onCreateAgent,
  onEditAgent,
  onOpenWorkflow,
  onTaskAgent,
  onToggleAgentStatus,
  onDeleteAgent,
  onBatchUpdateStatus,
  onBatchDeleteAgents,
  onOpenHealthMonitor,
  onOpenModelManager,
  onOpenTemplateModal,
  onInstantiateTemplate,
  isMasterDeveloper = true,
  developerCompanyName = "AgentFlow Enterprise",
  onOpenMasterAccessGate,
  onOpenProfilePrivacy,
  onRequestClientAccess,
  onUpdateAgentVisibility,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showTemplatesSpotlight, setShowTemplatesSpotlight] = useState<boolean>(true);
  const [clientBlueprintModalAgent, setClientBlueprintModalAgent] = useState<Agent | null>(null);
  const [requestModalAgent, setRequestModalAgent] = useState<Agent | null>(null);
  const [clientRequestNotes, setClientRequestNotes] = useState<string>("");
  const [clientRequesterName, setClientRequesterName] = useState<string>("Client Team Lead");
  const [clientRequesterEmail, setClientRequesterEmail] = useState<string>("client-ops@tenant.io");
  
  // Bulk selection state
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [bulkActionSuccessMsg, setBulkActionSuccessMsg] = useState<string | null>(null);

  const featuredTemplates = AGENT_TEMPLATES.slice(0, 4);
  const unhealthyAgents = agents.filter((a) => (a.stats.successRate ?? 95) < 90);

  const filteredAgents = useMemo(() => {
    return agents.filter((ag) => {
      if (selectedDept !== "all" && ag.department !== selectedDept) return false;
      
      const isInternal = ag.visibility === "internal_only" || ag.clientPageAllowed === false;
      const isClientAllowed = ag.clientPageAllowed === true || ag.visibility === "client_visible";
      const isRequiresReview = ag.visibility === "pending_client_review";

      if (selectedVisibility === "internal" && !isInternal) return false;
      if (selectedVisibility === "client_allowed" && !isClientAllowed) return false;
      if (selectedVisibility === "requires_review" && !isRequiresReview) return false;

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
  }, [agents, selectedDept, selectedVisibility, searchQuery]);

  const allFilteredSelected = filteredAgents.length > 0 && filteredAgents.every((a) => selectedAgentIds.includes(a.id));
  const someFilteredSelected = filteredAgents.some((a) => selectedAgentIds.includes(a.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredAgents.map((a) => a.id));
      setSelectedAgentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set([...selectedAgentIds, ...filteredAgents.map((a) => a.id)]);
      setSelectedAgentIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleClearSelection = () => {
    setSelectedAgentIds([]);
  };

  // Bulk Operations
  const handleBulkEnable = () => {
    if (selectedAgentIds.length === 0) return;
    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedAgentIds, "active");
    } else {
      selectedAgentIds.forEach((id) => {
        const ag = agents.find((a) => a.id === id);
        if (ag && ag.status !== "active") {
          onToggleAgentStatus(id);
        }
      });
    }
    showToast(`Enabled ${selectedAgentIds.length} agent${selectedAgentIds.length > 1 ? "s" : ""}`);
  };

  const handleBulkDisable = () => {
    if (selectedAgentIds.length === 0) return;
    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedAgentIds, "idle");
    } else {
      selectedAgentIds.forEach((id) => {
        const ag = agents.find((a) => a.id === id);
        if (ag && ag.status === "active") {
          onToggleAgentStatus(id);
        }
      });
    }
    showToast(`Paused / Disabled ${selectedAgentIds.length} agent${selectedAgentIds.length > 1 ? "s" : ""}`);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedAgentIds.length === 0) return;
    if (onBatchDeleteAgents) {
      onBatchDeleteAgents(selectedAgentIds);
    } else {
      selectedAgentIds.forEach((id) => onDeleteAgent(id));
    }
    showToast(`Deleted ${selectedAgentIds.length} agent${selectedAgentIds.length > 1 ? "s" : ""}`);
    setSelectedAgentIds([]);
    setShowBulkDeleteModal(false);
  };

  const handleQuickToggleVisibility = (agent: Agent) => {
    if (!onUpdateAgentVisibility) return;
    const isCurrentlyAllowed = agent.clientPageAllowed === true || agent.visibility === "client_visible";
    if (isCurrentlyAllowed) {
      onUpdateAgentVisibility(agent.id, "internal_only", false);
      showToast(`🔒 "${agent.name}" set to Internal Only.`);
    } else {
      onUpdateAgentVisibility(agent.id, "client_visible", true);
      showToast(`🌐 "${agent.name}" authorized for Client Page.`);
    }
  };

  const handleSubmitClientRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalAgent) return;
    if (onRequestClientAccess) {
      onRequestClientAccess(requestModalAgent);
    }
    showToast(`Access request for "${requestModalAgent.name}" dispatched to creator for review!`);
    setRequestModalAgent(null);
    setClientRequestNotes("");
  };

  const showToast = (msg: string) => {
    setBulkActionSuccessMsg(msg);
    setTimeout(() => setBulkActionSuccessMsg(null), 3000);
  };

  const selectedAgentsList = agents.filter((a) => selectedAgentIds.includes(a.id));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950 relative">
      {/* Top Notification Toast */}
      {bulkActionSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{bulkActionSuccessMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <span>Autonomous Enterprise AI Agents ({agents.length})</span>
            </h1>
            {!isMasterDeveloper && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Client White-Label View</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isMasterDeveloper 
              ? "Creator Governance Mode: Control client-page exposure, set internal-only policies, and review inbound client requests."
              : `Production-ready agent fleet managed and secured by ${developerCompanyName}. Execution & scoping enabled.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Creator Profile Privacy & Visibility Manager Button */}
          {isMasterDeveloper && onOpenProfilePrivacy && (
            <button
              onClick={onOpenProfilePrivacy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0"
              title="Manage client page exposure and inbound scoping petitions"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Client Page Privacy</span>
            </button>
          )}

          {onOpenTemplateModal && (
            <button
              onClick={onOpenTemplateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{isMasterDeveloper ? "Agent Templates" : "Explore Blueprints"}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-bold shrink-0">
                {AGENT_TEMPLATES.length}
              </span>
            </button>
          )}

          {isMasterDeveloper && onOpenModelManager && (
            <button
              onClick={() => onOpenModelManager()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0"
              title="Enterprise AI Models Registry (Wholesale Models & Routing)"
            >
              <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Model Hub</span>
              {models.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0">
                  {models.length}
                </span>
              )}
            </button>
          )}

          {onOpenHealthMonitor && (
            <button
              onClick={() => onOpenHealthMonitor()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0"
            >
              <Activity className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Health Hub</span>
              {unhealthyAgents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold shrink-0">
                  {unhealthyAgents.length}
                </span>
              )}
            </button>
          )}

          {isMasterDeveloper ? (
            <button
              onClick={onCreateAgent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create Agent</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (agents.length > 0) {
                  setRequestModalAgent(agents[0]);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs hover:bg-slate-200 transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
              title={`Submit custom scoping brief to ${developerCompanyName}`}
            >
              <Inbox className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Request Custom Agent</span>
            </button>
          )}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs cursor-pointer"
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
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                  {unhealthyAgents.length} Agent{unhealthyAgents.length > 1 ? "s" : ""} Flagged
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                {unhealthyAgents.map(a => a.name).join(", ")} flagged for elevated latency or prompt ambiguity.
              </p>
            </div>
          </div>

          {onOpenHealthMonitor && (
            <button
              onClick={() => onOpenHealthMonitor(unhealthyAgents[0]?.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Diagnose & Optimize</span>
            </button>
          )}
        </div>
      )}

      {/* Filters, Search Bar & Multi-Select Control Header */}
      <div className="space-y-3">
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
            <option value="Engineering">Engineering</option>
            <option value="DevOps & SecOps">DevOps & SecOps</option>
            <option value="Sales & CRM">Sales & CRM</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Finance & Legal">Finance & Legal</option>
            <option value="Marketing">Marketing</option>
            <option value="Product">Product</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Client Visibilities</option>
            <option value="internal">🔒 Internal Only</option>
            <option value="client_allowed">🌐 Client Page Allowed</option>
            <option value="requires_review">📩 Requires Inbound Request</option>
          </select>
        </div>

        {/* Multi-Selection Control Sub-Bar */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : someFilteredSelected ? (
                <MinusSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {allFilteredSelected
                  ? "Deselect All"
                  : someFilteredSelected
                  ? `Select All (${filteredAgents.length})`
                  : `Select All (${filteredAgents.length})`}
              </span>
            </button>

            {selectedAgentIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                {selectedAgentIds.length} of {agents.length} selected
              </span>
            )}
          </div>

          {selectedAgentIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* DOCKED / FLOATING BULK ACTION TOOLBAR (VISIBLE WHEN 1+ AGENTS ARE SELECTED) */}
      {selectedAgentIds.length > 0 && (
        <div className="sticky top-2 z-40 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {selectedAgentIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Bulk Action Menu</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                  {selectedAgentIds.length} Agent{selectedAgentIds.length > 1 ? "s" : ""} Selected
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Apply batch operations across your selected fleet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Enable All */}
            <button
              type="button"
              onClick={handleBulkEnable}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Activate selected agents"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Enable ({selectedAgentIds.length})</span>
            </button>

            {/* Disable All */}
            <button
              type="button"
              onClick={handleBulkDisable}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Pause selected agents"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Disable ({selectedAgentIds.length})</span>
            </button>

            {/* Delete All */}
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Delete selected agents from fleet"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedAgentIds.length})</span>
            </button>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cancel selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const isSelected = selectedAgentIds.includes(agent.id);
          const isAutonomous = agent.autonomyLevel === "autonomous";
          const isHitl = agent.autonomyLevel === "hitl";
          const successRate = agent.stats.successRate ?? 95;
          const isCriticalHealth = successRate < 75;
          const isWarningHealth = successRate >= 75 && successRate < 90;

          const isInternal = agent.visibility === "internal_only" || agent.clientPageAllowed === false;
          const isClientAllowed = agent.clientPageAllowed === true || agent.visibility === "client_visible";
          const isRequiresReview = agent.visibility === "pending_client_review";

          return (
            <div
              key={agent.id}
              onClick={() => handleToggleSelectAgent(agent.id)}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs space-y-4 cursor-pointer relative ${
                isSelected
                  ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20"
                  : isCriticalHealth
                  ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20"
                  : isWarningHealth
                  ? "border-amber-300 dark:border-amber-900/60"
                  : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              {/* Agent Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Checkbox Trigger */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectAgent(agent.id);
                    }}
                    className="mt-1 shrink-0 cursor-pointer p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-500" />
                    )}
                  </div>

                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {agent.name}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAgentStatus(agent.id);
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          agent.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                        }`}
                        title="Click to toggle agent status"
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{agent.status}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {agent.role}
                      </span>
                      {onOpenModelManager ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenModelManager(agent.id);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 font-mono transition-colors cursor-pointer"
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
                    
                    {/* Client Page Exposure Status Pill */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {isMasterDeveloper ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickToggleVisibility(agent);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                            isInternal
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                              : isClientAllowed
                              ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                          }`}
                          title="Click to toggle client-facing page visibility"
                        >
                          {isInternal ? (
                            <>
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>🔒 Internal Only (Private)</span>
                            </>
                          ) : isClientAllowed ? (
                            <>
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>🌐 Client Page Live</span>
                            </>
                          ) : (
                            <>
                              <Inbox className="w-3 h-3 text-amber-600" />
                              <span>📩 Requires Request</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                          isClientAllowed
                            ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300"
                        }`}>
                          {isClientAllowed ? (
                            <>
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>Live on Your Page</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Requires Creator Permission</span>
                            </>
                          )}
                        </span>
                      )}
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

              {/* In Client View: If restricted, show Request Banner */}
              {!isMasterDeveloper && !isClientAllowed && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2"
                >
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                    This agent was crafted for internal workflows. Submit a brief to request activation on your page.
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestModalAgent(agent)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                  >
                    Request Access
                  </button>
                </div>
              )}

              {/* Performance Metrics */}
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
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>{agent.permissions.length} Scopes Active</span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenHealthMonitor && (
                    <button
                      onClick={() => onOpenHealthMonitor(agent.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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

                  {isMasterDeveloper ? (
                    <button
                      onClick={() => onEditAgent(agent)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Configure Agent, System Prompts & Wholesale Models (Master Admin)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setClientBlueprintModalAgent(agent)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="View Authorized Scopes & Blueprint Specs (Read-Only)"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  )}

                  <button
                    onClick={() => onOpenWorkflow(agent.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <WorkflowIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Canvas</span>
                  </button>

                  <button
                    onClick={() => onTaskAgent(agent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
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

      {/* BATCH DELETE CONFIRMATION MODAL WITH DETAILED AUTOMATION IMPACT ANALYSIS */}
      <BatchDeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        type="agents"
        selectedAgents={selectedAgentsList}
        allWorkflows={workflows}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
      />

      {/* CLIENT REQUEST ACCESS MODAL */}
      {requestModalAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Submit Agent Scoping Brief to Creator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Request permission to activate "{requestModalAgent.name}" on your client portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRequestModalAgent(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClientRequest} className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3">
                <img src={requestModalAgent.avatar} alt={requestModalAgent.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{requestModalAgent.name}</div>
                  <div className="text-[11px] text-slate-500">{requestModalAgent.role} • {requestModalAgent.department}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={clientRequesterName}
                    onChange={(e) => setClientRequesterName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={clientRequesterEmail}
                    onChange={(e) => setClientRequesterEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intended Client Page & Business Justification
                </label>
                <textarea
                  value={clientRequestNotes}
                  onChange={(e) => setClientRequestNotes(e.target.value)}
                  placeholder="Explain why your team needs this agent and which client dashboard tab it will live on..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRequestModalAgent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Scoping Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ-ONLY CLIENT BLUEPRINT MODAL */}
      {clientBlueprintModalAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <img
                  src={clientBlueprintModalAgent.avatar}
                  alt={clientBlueprintModalAgent.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {clientBlueprintModalAgent.name}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {clientBlueprintModalAgent.role} • {clientBlueprintModalAgent.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClientBlueprintModalAgent(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50">
                <div className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Managed & Verified Blueprint Architecture</span>
                </div>
                <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                  This agent is provisioned and governed by {developerCompanyName}. System prompts, wholesale models, and tool invocations are managed to ensure compliance.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Agent Persona & Scope
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {clientBlueprintModalAgent.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Granted Runtime Permissions ({clientBlueprintModalAgent.permissions.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {clientBlueprintModalAgent.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setClientBlueprintModalAgent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
