import React, { useState } from "react";
import { 
  ApprovedAutomation, 
  ApprovedAutomationCategory, 
  Department, 
  Agent, 
  Workflow, 
  TaskExecutionRecord 
} from "../types";
import { 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Workflow as WorkflowIcon, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Bot, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Layers, 
  ExternalLink, 
  FileText, 
  Tag, 
  TrendingUp, 
  Zap, 
  Code, 
  Eye, 
  X,
  RefreshCw,
  FolderDown,
  ChevronRight,
  ListTodo
} from "lucide-react";
import Markdown from "react-markdown";
import { fireCelebration } from "../utils/confetti";

export interface ApprovedAutomationsVaultProps {
  automations: ApprovedAutomation[];
  agents: Agent[];
  workflows?: Workflow[];
  executionHistory: TaskExecutionRecord[];
  onSaveAutomation?: (automation: ApprovedAutomation) => void;
  onUpdateAutomation?: (automation: ApprovedAutomation) => void;
  onDeleteAutomation: (id: string) => void;
  onCreateAutomation?: (automation: ApprovedAutomation) => void;
  onToggleBookmark?: (id: string) => void;
  onConvertToWorkflow?: (automation: ApprovedAutomation) => void;
  onRunAutomationWithAgent?: (automation: ApprovedAutomation) => void;
  onRunAutomation?: (automation: ApprovedAutomation) => void;
  onOpenQuickTask?: () => void;
  onRewardXP?: (amount: number, hours?: number) => void;
}

const CATEGORY_TABS: { id: "all" | ApprovedAutomationCategory; label: string; icon: any }[] = [
  { id: "all", label: "All Suggestions & Playbooks", icon: Layers },
  { id: "automation", label: "Automations & Scripts", icon: Zap },
  { id: "playbook", label: "Operational SOPs & Playbooks", icon: FileText },
  { id: "email_template", label: "Comms & Outreach", icon: Sparkles },
  { id: "workflow", label: "Multi-Node Pipelines", icon: WorkflowIcon },
];

export const ApprovedAutomationsVault: React.FC<ApprovedAutomationsVaultProps> = ({
  automations,
  agents,
  workflows = [],
  executionHistory,
  onSaveAutomation,
  onUpdateAutomation,
  onDeleteAutomation,
  onCreateAutomation,
  onToggleBookmark,
  onConvertToWorkflow,
  onRunAutomationWithAgent,
  onRunAutomation,
  onOpenQuickTask,
  onRewardXP,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ApprovedAutomationCategory>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [viewingAutomation, setViewingAutomation] = useState<ApprovedAutomation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedActionMap, setCheckedActionMap] = useState<Record<string, boolean>>({});

  const handleSaveItem = (item: ApprovedAutomation) => {
    if (onUpdateAutomation) {
      onUpdateAutomation(item);
    } else if (onSaveAutomation) {
      onSaveAutomation(item);
    } else if (onCreateAutomation) {
      onCreateAutomation(item);
    }
  };

  const handleToggleBookmarkItem = (id: string) => {
    if (onToggleBookmark) {
      onToggleBookmark(id);
    } else {
      const item = automations.find((a) => a.id === id);
      if (item) {
        handleSaveItem({ ...item, isBookmarked: !item.isBookmarked });
      }
    }
  };

  const handleRunItem = (item: ApprovedAutomation) => {
    if (onRunAutomationWithAgent) {
      onRunAutomationWithAgent(item);
    } else if (onRunAutomation) {
      onRunAutomation(item);
    }
  };

  const handleConvertItem = (item: ApprovedAutomation) => {
    if (onConvertToWorkflow) {
      onConvertToWorkflow(item);
    } else {
      handleSaveItem({ ...item, status: "deployed" });
    }
  };

  // Filter calculations
  const filteredAutomations = automations.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesDept = selectedDepartment === "all" || item.department === selectedDepartment;
    const matchesBookmark = !onlyBookmarked || item.isBookmarked;

    return matchesSearch && matchesCategory && matchesDept && matchesBookmark;
  });

  // Analytics Metrics
  const totalHoursSaved = automations.reduce((sum, a) => sum + (a.estimatedHoursSaved || 0), 0);
  const deployedCount = automations.filter((a) => a.status === "deployed" || a.workflowId).length;
  const bookmarkedCount = automations.filter((a) => a.isBookmarked).length;

  const handleCopyContent = (automation: ApprovedAutomation) => {
    navigator.clipboard.writeText(automation.generatedContent);
    setCopiedId(automation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMarkdown = (automation: ApprovedAutomation) => {
    const blob = new Blob([
      `# ${automation.title}\n\n` +
      `**Agent:** ${automation.agentName} (${automation.department})\n` +
      `**Model:** ${automation.modelUsed}\n` +
      `**Approved At:** ${new Date(automation.approvedAt).toLocaleString()}\n\n` +
      `---\n\n` +
      `### Source Prompt\n> ${automation.sourcePrompt}\n\n` +
      `---\n\n` +
      `${automation.generatedContent}\n\n` +
      `---\n\n` +
      `### Recommended Action Items:\n` +
      automation.suggestedActions.map((a) => `- [ ] ${a}`).join("\n")
    ], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${automation.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleActionCheck = (automationId: string, actionIdx: number) => {
    const key = `${automationId}-${actionIdx}`;
    setCheckedActionMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImportFromRecord = (record: TaskExecutionRecord) => {
    const matchedAgent = agents.find((a) => a.id === record.agentId);
    const newAutomation: ApprovedAutomation = {
      id: `auto-saved-${Date.now()}`,
      title: record.title || "Approved Task Automation",
      description: record.summary || `Approved deliverable from ${record.agentName}`,
      agentId: record.agentId,
      agentName: record.agentName,
      agentAvatar: matchedAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      department: record.department,
      modelUsed: matchedAgent?.model || "gemini-3.7-flash",
      sourcePrompt: record.prompt || record.inputPayload,
      generatedContent: record.generatedOutput || record.summary,
      suggestedActions: [
        `Deploy ${record.title} to production operations`,
        `Configure recurring execution schedule`,
        `Notify team via Slack webhook`
      ],
      category: "automation",
      approvedAt: new Date().toISOString(),
      status: "active",
      estimatedHoursSaved: record.hoursSaved || 0.8,
      tags: [record.department, "Approved", "Task History"],
      isBookmarked: true,
    };

    handleSaveItem(newAutomation);
    setIsImportModalOpen(false);
    fireCelebration();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* HEADER HERO */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Approved Automations & Suggestions Vault
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {automations.length} Saved Playbooks
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Every high-quality generation, suggested automation, and incident playbook you approve is persisted here. 
                  Transform suggestions into live visual studio workflows, trigger immediate agent runs, or export production SOPs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="btn-import-from-history"
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
              >
                <FolderDown className="w-4 h-4 text-blue-500" />
                <span>Save from Task History</span>
              </button>

              {onOpenQuickTask && (
                <button
                  id="btn-vault-prompt-agent"
                  type="button"
                  onClick={onOpenQuickTask}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Prompt New Automation</span>
                </button>
              )}
            </div>
          </div>

          {/* TELEMETRY METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Preserved</div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">{automations.length} Suggestions</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Value</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{totalHoursSaved.toFixed(1)} Hours Saved</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <WorkflowIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Live Visual Studio</div>
                <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{deployedCount} Deployed</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Bookmarked SOPs</div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400">{bookmarkedCount} Pinned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="px-6 md:px-8 py-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-automations"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search automations, code, or tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department & Bookmark Toggles */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              id="select-dept-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="DevOps & SecOps">DevOps & SecOps</option>
              <option value="Engineering">Engineering</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Sales & CRM">Sales & CRM</option>
              <option value="Finance & Legal">Finance & Legal</option>
              <option value="Human Resources">Human Resources</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                onlyBookmarked
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>

        {/* Category Tabs Row */}
        <div className="max-w-7xl mx-auto flex gap-1 pt-3 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AUTOMATIONS GRID */}
      <div className="p-6 md:p-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {filteredAutomations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <BookmarkCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No Approved Automations Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  When you approve agent task generations in the Dispatcher or Prompt Studio, their recommended scripts and playbooks will be automatically saved here.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Import from Recent Tasks
                </button>
                {onOpenQuickTask && (
                  <button
                    type="button"
                    onClick={onOpenQuickTask}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Prompt an Agent Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredAutomations.map((item) => {
                const isCopied = copiedId === item.id;
                const isDeployed = item.status === "deployed" || Boolean(item.workflowId);

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    {/* CARD HEADER */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.agentAvatar}
                            alt={item.agentName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {item.agentName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.department}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>Model: {item.modelUsed}</span>
                              <span>•</span>
                              <span>Approved {new Date(item.approvedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleBookmarkItem(item.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.isBookmarked
                                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600"
                                : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                            title={item.isBookmarked ? "Remove Bookmark" : "Bookmark Playbook"}
                          >
                            <Bookmark className={`w-4 h-4 ${item.isBookmarked ? "fill-amber-500" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAutomation(item.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete from Vault"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* TITLE & DESCRIPTION */}
                      <div className="mt-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </h3>
                          {isDeployed && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                              <WorkflowIcon className="w-2.5 h-2.5" />
                              <span>Live in Studio</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* ACTION ITEMS CHECKLIST */}
                      {item.suggestedActions && item.suggestedActions.length > 0 && (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <ListTodo className="w-3 h-3 text-blue-500" />
                            <span>Recommended Next Actions:</span>
                          </div>
                          <div className="space-y-1">
                            {item.suggestedActions.map((action, idx) => {
                              const isChecked = Boolean(checkedActionMap[`${item.id}-${idx}`]);
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => toggleActionCheck(item.id, idx)}
                                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span className={`text-[11px] leading-tight ${isChecked ? "line-through opacity-60 text-slate-400" : ""}`}>
                                    {action}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* TAGS */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingAutomation(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>Inspect Spec</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyContent(item)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Copy Full Deliverable"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadMarkdown(item)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download Markdown (.md)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
                          title="Run task prompt with assigned agent"
                        >
                          <Play className="w-3 h-3 text-blue-500" />
                          <span>Run Task</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConvertItem(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                        >
                          <WorkflowIcon className="w-3.5 h-3.5" />
                          <span>{isDeployed ? "Open in Studio" : "Convert to Workflow"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* INSPECT AUTOMATION SPEC MODAL */}
      {viewingAutomation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={viewingAutomation.agentAvatar}
                  alt={viewingAutomation.agentName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {viewingAutomation.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Approved from {viewingAutomation.agentName} • Model: {viewingAutomation.modelUsed}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyContent(viewingAutomation)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingAutomation(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Source Prompt Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                  Source Trigger Prompt:
                </div>
                <div className="text-xs text-blue-900 dark:text-blue-200 italic font-mono">
                  "{viewingAutomation.sourcePrompt}"
                </div>
              </div>

              {/* Rendered Deliverable Markdown */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans overflow-x-auto shadow-inner">
                <div className="markdown-body space-y-3 prose dark:prose-invert max-w-none">
                  <Markdown>{viewingAutomation.generatedContent}</Markdown>
                </div>
              </div>

              {/* Action Checklist */}
              {viewingAutomation.suggestedActions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-blue-500" />
                    <span>Suggested Next Action Items</span>
                  </div>
                  <div className="space-y-1.5">
                    {viewingAutomation.suggestedActions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Estimated efficiency value: <strong>{viewingAutomation.estimatedHoursSaved} Hours Saved</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingAutomation(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Close Window
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleConvertItem(viewingAutomation);
                    setViewingAutomation(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <WorkflowIcon className="w-4 h-4" />
                  <span>Convert into Live Workflow Canvas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT FROM RECENT TASK HISTORY MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <FolderDown className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Save from Recent Task Executions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {executionHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No task execution history available. Run an agent task first to capture and preserve suggestions!
                </div>
              ) : (
                executionHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rec.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {rec.agentName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {rec.summary || rec.generatedOutput}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportFromRecord(rec)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-all shadow-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Playbook</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
