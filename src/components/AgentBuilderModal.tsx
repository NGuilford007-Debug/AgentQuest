import React, { useState, useMemo } from "react";
import { Agent, AgentTemplate, AiModel, AutonomyLevel, Department, PermissionScope } from "../types";
import { AVAILABLE_PERMISSIONS, INITIAL_MODELS } from "../data/initialData";
import { AGENT_TEMPLATES, PROMPT_SNIPPETS, generateAutoSuggestedPrompt, evaluatePromptQuality } from "../data/agentTemplates";
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Sliders, 
  Users, 
  Check, 
  AlertTriangle,
  Loader2,
  Lock,
  Cpu,
  Info,
  Plus,
  Layers,
  Search,
  Wand2,
  FileCode,
  BrainCircuit,
  ShieldAlert,
  Heart,
  Activity,
  Lightbulb,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface AgentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent: (agent: Agent) => void;
  initialAgent?: Agent | null;
  availableModels?: AiModel[];
  availablePermissions?: PermissionScope[];
  onOpenModelManager?: () => void;
  onOpenAppManager?: () => void;
  onOpenTemplateModal?: () => void;
}

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Sales & CRM",
  "Customer Support",
  "DevOps & SecOps",
  "Finance & Legal",
  "Human Resources",
  "Marketing",
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
];

export const AgentBuilderModal: React.FC<AgentBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent,
  initialAgent,
  availableModels = INITIAL_MODELS,
  availablePermissions = AVAILABLE_PERMISSIONS,
  onOpenModelManager,
  onOpenAppManager,
}) => {
  const [name, setName] = useState(initialAgent?.name || "AutoTriage Specialist");
  const [role, setRole] = useState(initialAgent?.role || "Workflow Automation Agent");
  const [department, setDepartment] = useState<Department>(initialAgent?.department || "Engineering");
  const [description, setDescription] = useState(
    initialAgent?.description || "Automates repetitive ticket classification, root cause analysis, and response drafting."
  );
  const [avatar, setAvatar] = useState(initialAgent?.avatar || PRESET_AVATARS[0]);
  const [model, setModel] = useState(initialAgent?.model || "gemini-3.7-flash");
  const [temperature, setTemperature] = useState(initialAgent?.temperature ?? 0.3);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(initialAgent?.autonomyLevel || "hitl");
  const [assignedUserName, setAssignedUserName] = useState(initialAgent?.assignedTo?.userName || "Alex Mercer");
  const [assignedTeam, setAssignedTeam] = useState(initialAgent?.assignedTo?.team || "Core Platform");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    initialAgent?.permissions || ["perm-jira-read-write", "perm-slack-post"]
  );
  const [systemPrompt, setSystemPrompt] = useState(
    initialAgent?.systemPrompt ||
      "You are an enterprise AI Agent. Analyze incoming task inputs accurately, adhere strictly to security policies, extract structured parameters, and draft high-fidelity outputs."
  );
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "model" | "permissions" | "team">("identity");
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");
  const [selectedPermCategory, setSelectedPermCategory] = useState<string>("all");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [promptTips, setPromptTips] = useState<string[]>([]);
  const [showPromptSnippets, setShowPromptSnippets] = useState(false);

  const promptQuality = useMemo(() => {
    return evaluatePromptQuality(systemPrompt);
  }, [systemPrompt]);

  const handleApplyTemplate = (tmpl: AgentTemplate) => {
    setName(tmpl.name);
    setRole(tmpl.role);
    setDepartment(tmpl.department);
    setDescription(tmpl.description);
    setAvatar(tmpl.avatar);
    setModel(tmpl.model);
    setTemperature(tmpl.temperature);
    setAutonomyLevel(tmpl.autonomyLevel);
    setSelectedPermissions(tmpl.permissions);
    setSystemPrompt(tmpl.systemPrompt);
    setShowTemplatePicker(false);
  };

  const handleAutoSuggestPrompt = () => {
    const { prompt: suggested, tips } = generateAutoSuggestedPrompt({
      name,
      role,
      department,
      autonomyLevel,
      selectedPermissions,
    });
    setSystemPrompt(suggested);
    setPromptTips(tips);
  };

  const handleInsertSnippet = (snippetText: string) => {
    setSystemPrompt((prev) => (prev ? `${prev.trim()}\n\n${snippetText}` : snippetText));
  };

  const allModels = availableModels.length > 0 ? availableModels : INITIAL_MODELS;
  const filteredModelOptions = allModels.filter((m) => {
    if (!modelSearchQuery.trim()) return true;
    const q = modelSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });
  const selectedModelObj = allModels.find((m) => m.id === model) || allModels[0];

  if (!isOpen) return null;

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleAiOptimizePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const res = await fetch("/api/gemini/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Role: ${role}. Department: ${department}. Task: ${description}. Design a bulletproof system prompt with enterprise guidelines and JSON output schema.`,
          department,
        }),
      });
      const data = await res.json();
      if (data.agent?.description) {
        setSystemPrompt(
          `You are ${name}, specialized in ${department}. ${data.agent.description}\n\nGuidelines:\n1. Adhere to configured permission scopes.\n2. Scrub all sensitive PII and confidential credentials.\n3. Output structured enterprise work products with confidence scores.\n4. Escalate low confidence (<90%) items for Human-in-the-Loop review.`
        );
      } else {
        setSystemPrompt(
          `You are ${name}, a senior ${role} for ${department}.\nResponsibility: ${description}\nStrictly adhere to corporate compliance, generate rigorous audit trails, and maintain 99%+ accuracy.`
        );
      }
    } catch {
      setSystemPrompt(
        `You are ${name}, a dedicated enterprise ${role} in ${department}. Your objective is: ${description}. Always provide structured, auditable outputs.`
      );
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAgent: Agent = {
      id: initialAgent?.id || `agent-${Date.now()}`,
      name,
      role,
      avatar,
      department,
      description,
      model,
      temperature,
      autonomyLevel,
      assignedTo: {
        userId: "usr-1",
        userName: assignedUserName,
        team: assignedTeam,
      },
      permissions: selectedPermissions,
      systemPrompt,
      status: initialAgent?.status || "active",
      stats: initialAgent?.stats || {
        tasksCompleted: 0,
        hoursSaved: 0,
        successRate: 100,
        avgLatencySec: 1.5,
        xpGenerated: 0,
      },
      createdAt: initialAgent?.createdAt || new Date().toISOString().split("T")[0],
    };
    onSaveAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {initialAgent ? "Configure Enterprise AI Agent" : "Build & Assign Custom AI Agent"}
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Gemini GenAI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define agent persona, autonomy boundaries, auto-suggest prompts, and permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showTemplatePicker ? "Hide Templates" : "Load Template Blueprint"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Picker Drawer Bar */}
        {showTemplatePicker && (
          <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Pick a Production-Ready Archetype Blueprint:
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                1-Click populates persona, model, prompts, and scopes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto pr-1">
              {AGENT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={tmpl.avatar}
                      alt={tmpl.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                        {tmpl.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {tmpl.department}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-500">
                    <span className="font-mono">{tmpl.model.split("-")[0]}</span>
                    <span className="font-bold text-emerald-600">~{tmpl.estimatedHoursSavedPerMonth}h/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          {[
            { id: "identity", label: "1. Persona & System Prompt", icon: Bot },
            { id: "model", label: "2. Model & Autonomy", icon: Sliders },
            { id: "permissions", label: "3. Access Permissions", icon: ShieldCheck, badge: `${selectedPermissions.length}` },
            { id: "team", label: "4. Assignment & Team", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: IDENTITY & PROMPT AUTO-SUGGEST */}
          {activeTab === "identity" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SentryOps Sentinel"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agent Role / Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lead SRE Incident Diagnostician"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workflow Objective & Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what repetitive tasks this agent will autonomously handle..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SYSTEM PROMPT & AUTO-SUGGEST TOOLKIT */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-blue-600" />
                      <span>System Instructions & Behavior Directives</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Defines persona, reasoning methodology, schema compliance, and safeguard boundaries.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSuggestPrompt}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      title="Generate comprehensive enterprise prompt based on role & permissions"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Suggest Prompt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPromptSnippets(!showPromptSnippets)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{showPromptSnippets ? "Hide Snippets" : "Insert Snippet"}</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Snippet Quick Insert Bar */}
                {showPromptSnippets && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>One-Click Prompt Snippets Library:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PROMPT_SNIPPETS.map((snip) => (
                        <div
                          key={snip.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                        >
                          <div>
                            <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                              {snip.title}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                              {snip.description}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInsertSnippet(snip.snippet)}
                            className="mt-2 w-full py-1 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Insert Block</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt Textarea */}
                <textarea
                  rows={5}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="System prompt for the enterprise AI agent..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Live Prompt Quality Scorer & Evaluation Meter */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Prompt Quality Meter:
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          promptQuality.score >= 85
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : promptQuality.score >= 60
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {promptQuality.grade} ({promptQuality.score}/100)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Clarity: <strong className="text-slate-700 dark:text-slate-300">{promptQuality.clarity}%</strong></span>
                      <span>Safety: <strong className="text-slate-700 dark:text-slate-300">{promptQuality.safety}%</strong></span>
                      <span>Structure: <strong className="text-slate-700 dark:text-slate-300">{promptQuality.structure}%</strong></span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        promptQuality.score >= 85
                          ? "bg-emerald-500"
                          : promptQuality.score >= 60
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${promptQuality.score}%` }}
                    />
                  </div>

                  {/* Suggestions if any */}
                  {promptQuality.suggestions.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <strong>Enhancement Tip:</strong> {promptQuality.suggestions[0]}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="avatar option"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-full cursor-pointer object-cover border-2 transition-all ${
                        avatar === av
                          ? "border-blue-600 scale-110 shadow-md ring-2 ring-blue-500/20"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL & AUTONOMY */}
          {activeTab === "model" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <span>AI Engine & Intelligence Model</span>
                  </div>
                  {onOpenModelManager && (
                    <button
                      type="button"
                      onClick={onOpenModelManager}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Register New Model</span>
                    </button>
                  )}
                </div>

                {/* Model Search & Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Filter models (e.g. Gemini, Claude, Llama, DeepSeek, GPT-4o, Custom)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Visual Model Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredModelOptions.map((m) => {
                    const isSelected = model === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
                          if (m.parameters?.temperatureDefault !== undefined) {
                            setTemperature(m.parameters.temperatureDefault);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs"
                            : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {m.name}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                              {m.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                          <span>{m.contextWindow.split(" ")[0]} ctx</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{m.latencyTier.split(" ")[0]}</span>
                          <span className="font-mono text-emerald-600 font-bold">{m.costTier}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Model Capabilities Banner */}
                {selectedModelObj && (
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Recommended For: <strong>{selectedModelObj.recommendedRole || "Enterprise Automation"}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">{selectedModelObj.id}</span>
                  </div>
                )}

                {/* Creativity / Temperature Slider */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    <span>Creativity / Sampling Temperature</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0.0 (Deterministic / Strict SQL & Code)</span>
                    <span>1.0 (Creative Outbound)</span>
                  </div>
                </div>
              </div>

              {/* Autonomy Level selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Autonomy Governance Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "autonomous" as AutonomyLevel,
                      title: "Fully Autonomous",
                      desc: "Executes end-to-end pipeline actions automatically without human confirmation blocks.",
                      color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100",
                    },
                    {
                      id: "hitl" as AutonomyLevel,
                      title: "Human-in-the-Loop (HITL)",
                      desc: "Requires explicit 1-click human specialist verification before firing write or external actions.",
                      color: "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100",
                    },
                    {
                      id: "shadow" as AutonomyLevel,
                      title: "Shadow / Audit Mode",
                      desc: "Simulates decisions in background without executing writes. Perfect for testing new agents.",
                      color: "border-slate-500 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100",
                    },
                  ].map((lvl) => {
                    const isSelected = autonomyLevel === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setAutonomyLevel(lvl.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? lvl.color : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs">{lvl.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {lvl.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCESS PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>
                    Grant only least-privilege enterprise scopes required for this agent's workflows across connected apps.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{selectedPermissions.length} Enabled</span>
                  {onOpenAppManager && (
                    <button
                      type="button"
                      onClick={onOpenAppManager}
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors"
                    >
                      Connect New App
                    </button>
                  )}
                </div>
              </div>

              {/* Permission search & category filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={permissionSearchQuery}
                    onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    placeholder="Filter permissions by app, code, or keyword (e.g. Gmail, PR, Stripe)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedPermCategory}
                  onChange={(e) => setSelectedPermCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Productivity & Workspace">Productivity & Workspace</option>
                  <option value="CRM & Sales">CRM & Sales</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Communication">Communication</option>
                  <option value="Databases & Storage">Databases & Storage</option>
                  <option value="Payments & Billing">Payments & Billing</option>
                  <option value="Analytics & Warehouses">Analytics & Warehouses</option>
                  <option value="Support & Helpdesk">Support & Helpdesk</option>
                  <option value="HR & Legal">HR & Legal</option>
                  <option value="Custom APIs & Webhooks">Custom APIs & Webhooks</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {availablePermissions
                  .filter((perm) => {
                    if (selectedPermCategory !== "all" && perm.category !== selectedPermCategory) return false;
                    if (permissionSearchQuery.trim()) {
                      const q = permissionSearchQuery.toLowerCase();
                      return (
                        perm.name.toLowerCase().includes(q) ||
                        perm.code.toLowerCase().includes(q) ||
                        perm.description.toLowerCase().includes(q) ||
                        (perm.appName && perm.appName.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  })
                  .map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    const isRiskHigh = perm.riskLevel === "high" || perm.riskLevel === "critical";
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                              {perm.name}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                isRiskHigh
                                  ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                                  : perm.riskLevel === "medium"
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              }`}
                            >
                              {perm.riskLevel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{perm.code}</span>
                            {perm.appName && <span>• {perm.appName}</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: TEAM ASSIGNMENT */}
          {activeTab === "team" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Assign Primary Employee & Team Queue</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Employee (Operator)
                    </label>
                    <input
                      type="text"
                      value={assignedUserName}
                      onChange={(e) => setAssignedUserName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      This user receives Gamification XP & productivity streaks for runs executed by this agent.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Team / Queue
                    </label>
                    <input
                      type="text"
                      value={assignedTeam}
                      onChange={(e) => setAssignedTeam(e.target.value)}
                      placeholder="e.g. SRE Incident Response Team"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enables routing of team-level ticket dispatching and collaborative review queues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== "team" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "identity") setActiveTab("model");
                    else if (activeTab === "model") setActiveTab("permissions");
                    else if (activeTab === "permissions") setActiveTab("team");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Next Step &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {initialAgent ? "Save Changes" : "Deploy & Assign Agent"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
