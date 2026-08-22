import React, { useState, useEffect, useMemo } from "react";
import { EmployeeProfile, Department, Agent, ClientAgentRequest, AgentPrivacyPolicyConfig } from "../types";
import { 
  User, 
  RotateCcw, 
  Trash2, 
  Check, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Award, 
  Coins, 
  AlertCircle,
  Briefcase,
  Building2,
  Image as ImageIcon,
  Sliders,
  SlidersHorizontal,
  Layers,
  Cpu,
  Gauge,
  Compass,
  Palette,
  FileCode,
  CheckCircle2,
  Flame,
  Globe,
  Settings,
  HelpCircle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Inbox,
  Send,
  Share2,
  CheckSquare,
  XCircle,
  Search,
  Filter,
  CheckCircle
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EmployeeProfile;
  agents?: Agent[];
  clientAgentRequests?: ClientAgentRequest[];
  agentPrivacyPolicy?: AgentPrivacyPolicyConfig;
  onUpdateProfile: (updated: Partial<EmployeeProfile>) => void;
  onUpdateAgents?: (agents: Agent[]) => void;
  onUpdateClientAgentRequests?: (requests: ClientAgentRequest[]) => void;
  onUpdateAgentPrivacyPolicy?: (policy: AgentPrivacyPolicyConfig) => void;
  onResetToCleanSlate: () => void;
  onClearExecutionHistory: () => void;
  onResetAgentsToDefault?: () => void;
  onOpenPricing?: () => void;
  onOpenAuthModal?: () => void;
}

const DEPARTMENTS: Department[] = [
  "Engineering",
  "DevOps & SecOps",
  "Customer Support",
  "Sales & CRM",
  "Finance & Legal",
  "Marketing",
  "Product",
  "Human Resources",
  "Operations",
  "Security"
];

const PRESET_AVATARS = [
  { label: "Alex (Default)", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" },
  { label: "Elena", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
  { label: "Marcus", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { label: "Priya", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
  { label: "David", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { label: "Chloe", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
];

interface BenchmarkPreset {
  id: string;
  name: string;
  badge: string;
  model: string;
  temperature: number;
  description: string;
  idealFor: string;
  latencyTier: string;
  icon: any;
  color: string;
}

const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  {
    id: "max-velocity",
    name: "Maximum Velocity (Ultra-Fast)",
    badge: "Sub-Second",
    model: "gemini-3.7-flash",
    temperature: 0.25,
    description: "High-throughput sub-second responses optimized for rapid alert triage, customer tickets, and webhook routing.",
    idealFor: "SRE triage, tier-1 customer support, quick status summaries",
    latencyTier: "< 0.5s Latency",
    icon: Zap,
    color: "from-amber-500 to-orange-500 text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "deep-reasoning",
    name: "Deep Enterprise Reasoning",
    badge: "Maximum Depth",
    model: "gemini-3.1-pro-preview",
    temperature: 0.2,
    description: "Deep multi-step analytical reasoning and 2M token context for complex codebase refactoring, multi-page financial audits, and architecture design.",
    idealFor: "Engineering specs, legal contract reviews, database migrations",
    latencyTier: "~2.5s Latency",
    icon: Cpu,
    color: "from-purple-500 to-indigo-600 text-purple-500 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "balanced-fleet",
    name: "Balanced Production Fleet",
    badge: "Default Standard",
    model: "gemini-3.7-flash",
    temperature: 0.35,
    description: "Optimal balance of execution speed, accuracy, and operational efficiency across all department tasks.",
    idealFor: "Daily operations, cross-team collaboration, ad-hoc task studio",
    latencyTier: "~1.0s Latency",
    icon: Gauge,
    color: "from-blue-500 to-cyan-500 text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "creative-generalist",
    name: "Creative & Strategy Generalist",
    badge: "Maximum Freedom",
    model: "gemini-3.7-flash",
    temperature: 0.7,
    description: "Unconstrained ideation, cross-domain brainstorming, high-converting copywriting, video titles, and executive proposals.",
    idealFor: "Marketing, sales outreach, content strategy, campaign ideation",
    latencyTier: "~1.1s Latency",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500 text-pink-500 bg-pink-500/10 border-pink-500/30",
  },
  {
    id: "zero-drift",
    name: "Zero-Drift Deterministic (SOC2)",
    badge: "Strict Verification",
    model: "gemini-3.7-flash",
    temperature: 0.1,
    description: "Mathematically constrained deterministic outputs with zero stochastic hallucination, strict JSON schema validation, and audit logs.",
    idealFor: "Compliance reporting, payment reconciliation, API security audits",
    latencyTier: "~0.8s Latency",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500 text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
];

function safeGet(key: string, fallback: string = ""): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  agents = [],
  clientAgentRequests = [],
  agentPrivacyPolicy,
  onUpdateProfile,
  onUpdateAgents,
  onUpdateClientAgentRequests,
  onUpdateAgentPrivacyPolicy,
  onResetToCleanSlate,
  onClearExecutionHistory,
  onResetAgentsToDefault,
  onOpenPricing,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<"settings" | "privacy" | "benchmarks" | "behavior" | "cleanslate">(() => {
    return (safeGet("agentflow_settings_active_tab", "settings") as any) || "settings";
  });
  
  // Profile fields
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email || "alex.mercer@enterprise.io");
  const [role, setRole] = useState(userProfile.role);
  const [department, setDepartment] = useState<Department>(userProfile.department);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [companyName, setCompanyName] = useState<string>(() => {
    return safeGet("agentflow_workspace_name", "Acme Enterprise Corp");
  });
  const [preferredTone, setPreferredTone] = useState<string>(() => {
    return safeGet("agentflow_pref_tone", "executive");
  });
  const [portalMode, setPortalMode] = useState<string>(() => {
    return safeGet("agentflow_portal_mode", "generalist");
  });
  const [globalTemperature, setGlobalTemperature] = useState<number>(() => {
    const savedTemp = safeGet("agentflow_global_temp");
    return savedTemp ? parseFloat(savedTemp) : 0.35;
  });
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>(() => {
    return safeGet("agentflow_selected_benchmark", "balanced-fleet");
  });
  
  // Privacy & Client Visibility fields
  const [agentFilterQuery, setAgentFilterQuery] = useState("");
  const [agentFilterDept, setAgentFilterDept] = useState<string>("all");
  const [agentFilterVisibility, setAgentFilterVisibility] = useState<string>("all");
  const [requestFilterStatus, setRequestFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [activeReplyRequestId, setActiveReplyRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [confirmCleanSlate, setConfirmCleanSlate] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Synchronize state from userProfile and localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(userProfile.name);
      setRole(userProfile.role);
      setDepartment(userProfile.department);
      setAvatar(userProfile.avatar);
      setCompanyName(safeGet("agentflow_workspace_name", "Acme Enterprise Corp"));
      setPreferredTone(safeGet("agentflow_pref_tone", "executive"));
      setPortalMode(safeGet("agentflow_portal_mode", "generalist"));
      const savedTemp = safeGet("agentflow_global_temp");
      if (savedTemp) setGlobalTemperature(parseFloat(savedTemp));
      const savedBenchmark = safeGet("agentflow_selected_benchmark");
      if (savedBenchmark) setSelectedBenchmarkId(savedBenchmark);
    }
  }, [isOpen, userProfile]);

  const pendingRequestsCount = useMemo(() => {
    return clientAgentRequests.filter((r) => r.status === "pending").length;
  }, [clientAgentRequests]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(agentFilterQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(agentFilterQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(agentFilterQuery.toLowerCase());
      
      const matchesDept = agentFilterDept === "all" || agent.department === agentFilterDept;

      const isInternal = agent.visibility === "internal_only" || agent.clientPageAllowed === false;
      const isClientAllowed = agent.clientPageAllowed === true || agent.visibility === "client_visible";
      const isRequiresReview = agent.visibility === "pending_client_review";

      const matchesVisibility = 
        agentFilterVisibility === "all" ||
        (agentFilterVisibility === "internal" && isInternal) ||
        (agentFilterVisibility === "client_allowed" && isClientAllowed) ||
        (agentFilterVisibility === "requires_review" && isRequiresReview);

      return matchesSearch && matchesDept && matchesVisibility;
    });
  }, [agents, agentFilterQuery, agentFilterDept, agentFilterVisibility]);

  const filteredRequests = useMemo(() => {
    return clientAgentRequests.filter((req) => {
      if (requestFilterStatus === "all") return true;
      return req.status === requestFilterStatus;
    });
  }, [clientAgentRequests, requestFilterStatus]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3200);
  };

  const handleTabChange = (tab: "settings" | "privacy" | "benchmarks" | "behavior" | "cleanslate") => {
    setActiveTab(tab);
    safeSet("agentflow_settings_active_tab", tab);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || "Alex Mercer";
    const cleanRole = role.trim() || "Automation Architect";
    const cleanAvatar = avatar.trim() || PRESET_AVATARS[0].url;
    const cleanCompany = companyName.trim() || "Acme Enterprise Corp";

    onUpdateProfile({
      name: cleanName,
      email: email.trim(),
      organizationName: cleanCompany,
      role: cleanRole,
      department,
      avatar: cleanAvatar,
    });
    safeSet("agentflow_workspace_name", cleanCompany);
    safeSet("agentflow_pref_tone", preferredTone);
    safeSet("agentflow_avatar_url", cleanAvatar);
    showToast("Profile identity & personalization preferences saved across sessions!");
  };

  const handleToneChange = (toneId: string) => {
    setPreferredTone(toneId);
    safeSet("agentflow_pref_tone", toneId);
    showToast(`Work product delivery tone set to "${toneId}".`);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatar(avatarUrl);
    safeSet("agentflow_avatar_url", avatarUrl);
  };

  // Agent Privacy & Client Visibility Handlers
  const handleUpdateAgentVisibility = (
    agentId: string, 
    visibility: "internal_only" | "client_visible" | "pending_client_review", 
    clientPageAllowed: boolean
  ) => {
    if (!onUpdateAgents) return;
    const updated = agents.map((a) => {
      if (a.id === agentId) {
        return {
          ...a,
          visibility,
          clientPageAllowed,
        };
      }
      return a;
    });
    onUpdateAgents(updated);
    safeSet("agentflow_agents", JSON.stringify(updated));

    const target = agents.find((a) => a.id === agentId);
    if (visibility === "internal_only") {
      showToast(`🔒 "${target?.name || 'Agent'}" is now Internal Only (Hidden from client pages).`);
    } else if (visibility === "client_visible") {
      showToast(`🌐 "${target?.name || 'Agent'}" authorized for Client Page visibility.`);
    } else {
      showToast(`📩 "${target?.name || 'Agent'}" now requires formal Client Request.`);
    }
  };

  const handleApproveClientRequest = (request: ClientAgentRequest) => {
    // 1. Update request status
    if (onUpdateClientAgentRequests) {
      const updatedReqs = clientAgentRequests.map((r) => 
        r.id === request.id ? { ...r, status: "approved" as const } : r
      );
      onUpdateClientAgentRequests(updatedReqs);
      safeSet("agentflow_client_agent_requests", JSON.stringify(updatedReqs));
    }

    // 2. Update agent to allowed
    if (onUpdateAgents) {
      const updatedAgents = agents.map((a) => {
        if (a.id === request.agentId) {
          return {
            ...a,
            clientPageAllowed: true,
            visibility: "client_visible" as const,
          };
        }
        return a;
      });
      onUpdateAgents(updatedAgents);
      safeSet("agentflow_agents", JSON.stringify(updatedAgents));
    }

    showToast(`✅ Approved! "${request.agentName}" is now active on ${request.tenantName}'s client page.`);
  };

  const handleRejectClientRequest = (request: ClientAgentRequest) => {
    if (onUpdateClientAgentRequests) {
      const updatedReqs = clientAgentRequests.map((r) => 
        r.id === request.id ? { ...r, status: "rejected" as const } : r
      );
      onUpdateClientAgentRequests(updatedReqs);
      safeSet("agentflow_client_agent_requests", JSON.stringify(updatedReqs));
    }
    showToast(`Declined request from ${request.tenantName}. Agent remains internal.`);
  };

  const handleSendClarification = (request: ClientAgentRequest) => {
    if (!replyMessage.trim()) return;
    showToast(`Scoping response sent to ${request.requestedByEmail}: "${replyMessage.slice(0, 40)}..."`);
    setActiveReplyRequestId(null);
    setReplyMessage("");
  };

  const handleApplyBenchmarkPreset = (preset: BenchmarkPreset) => {
    setSelectedBenchmarkId(preset.id);
    setGlobalTemperature(preset.temperature);
    
    safeSet("agentflow_selected_benchmark", preset.id);
    safeSet("agentflow_global_temp", preset.temperature.toString());
    safeSet("agentflow_benchmark_model", preset.model);
    
    if (onUpdateAgents && agents.length > 0) {
      const updatedAgents = agents.map((agent) => ({
        ...agent,
        model: preset.model,
        temperature: preset.temperature,
      }));
      onUpdateAgents(updatedAgents);
      safeSet("agentflow_agents", JSON.stringify(updatedAgents));
      showToast(`Applied & persisted "${preset.name}" across all ${agents.length} fleet agents!`);
    } else {
      showToast(`Selected & persisted "${preset.name}" benchmark preset!`);
    }
  };

  const handleApplyCustomFleetSettings = () => {
    safeSet("agentflow_global_temp", globalTemperature.toString());
    if (onUpdateAgents && agents.length > 0) {
      const updatedAgents = agents.map((agent) => ({
        ...agent,
        temperature: globalTemperature,
      }));
      onUpdateAgents(updatedAgents);
      safeSet("agentflow_agents", JSON.stringify(updatedAgents));
      showToast(`Persisted global fleet temperature (${globalTemperature}) across all agents!`);
    } else {
      showToast(`Persisted temperature setting: ${globalTemperature}`);
    }
  };

  const handleTogglePortalMode = (mode: string) => {
    setPortalMode(mode);
    safeSet("agentflow_portal_mode", mode);
    showToast(mode === "generalist" 
      ? "Universal Model Portal Mode active: Agents will execute all cross-department tasks freely." 
      : "Domain-Anchored Mode active: Agents prioritize core department focus."
    );
  };

  const handleExecuteCleanSlate = () => {
    onResetToCleanSlate();
    setConfirmCleanSlate(false);
    showToast("Reset to clean slate! Baseline initialized to Level 1 (0 XP).");
  };

  const handleExecuteClearHistory = () => {
    onClearExecutionHistory();
    setConfirmClearHistory(false);
    showToast("Execution history purged.");
  };

  const handleRefillCredits = () => {
    onUpdateProfile({ creditsBalance: 5000 });
    showToast("AI Credits balance replenished to 5,000!");
  };

  return (
    <div 
      id="profile-clean-slate-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="profile-clean-slate-modal"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Settings & Personalization Studio
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {userProfile.role} • {userProfile.department}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize profile identity, govern agent client-page visibility, review client permission requests, or configure benchmark presets.
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-5 pt-2 gap-1 overflow-x-auto">
          <button
            id="tab-profile-settings"
            onClick={() => handleTabChange("settings")}
            className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Identity</span>
          </button>

          {/* NEW: Agent Privacy & Client Requests Tab */}
          <button
            id="tab-profile-privacy"
            onClick={() => handleTabChange("privacy")}
            className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Agent Visibility & Client Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {pendingRequestsCount} pending
              </span>
            )}
          </button>

          <button
            id="tab-profile-benchmarks"
            onClick={() => handleTabChange("benchmarks")}
            className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "benchmarks"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Enterprise Benchmark Presets</span>
          </button>

          <button
            id="tab-profile-behavior"
            onClick={() => handleTabChange("behavior")}
            className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "behavior"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Model Portal & Behavior</span>
          </button>

          <button
            id="tab-profile-cleanslate"
            onClick={() => handleTabChange("cleanslate")}
            className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "cleanslate"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clean Slate & Reset</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Profile & Identity */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Account & Subscription Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {userProfile.organizationName || "Enterprise Workspace"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/30 whitespace-nowrap">
                        {userProfile.subscriptionPlan ? `${userProfile.subscriptionPlan} Tier` : "Free Explorer"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {userProfile.email || "Free tier account • Standard API quota"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {onOpenPricing && (
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
                    >
                      {userProfile.subscriptionPlan === "free" || !userProfile.subscriptionPlan ? "Upgrade Plan" : "Manage Plans"}
                    </button>
                  )}
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold shadow-2xs active:scale-95 transition-all whitespace-nowrap"
                    >
                      {userProfile.isAuthenticated ? "Account Switch" : "Sign Up"}
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  Avatar & Visual Identity
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatar || PRESET_AVATARS[0].url}
                    alt="Current Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                      Choose from preset portraits or enter a custom photo URL:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAvatarSelect(preset.url)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
                            avatar === preset.url
                              ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded-full object-cover" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Display Name
                  </label>
                  <input
                    id="input-profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    Job Title / Role
                  </label>
                  <input
                    id="input-profile-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead AI Systems Architect"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Department & Workspace Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    Department Focus
                  </label>
                  <select
                    id="select-profile-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    Organization / Workspace
                  </label>
                  <input
                    id="input-profile-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Enterprise Corp"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preferred Communication & Output Tone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  Preferred Work Product Delivery Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "executive", label: "Executive Brief", desc: "Crisp summaries & ROI" },
                    { id: "technical", label: "Deep Technical", desc: "Detailed code & schemas" },
                    { id: "agile", label: "Agile Actionable", desc: "Immediate next steps" },
                    { id: "creative", label: "Strategic & Creative", desc: "Expansive brainstorming" }
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleToneChange(tone.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        preferredTone === tone.id
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{tone.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{tone.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Custom Avatar Image URL
                </label>
                <input
                  id="input-profile-custom-avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Personalization Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Agent Visibility & Client Requests (PROMINENT USER FOCUS) */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              {/* Explainer Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Creator Authority & Client Page Visibility Control
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold">
                        Privacy Enforced
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                      Your custom AI agents weren't built for a client's page specifically. Here you have full autonomy to decide which agents appear on client white-label portals, keep proprietary models internal, or require clients to submit a formal scoping request before they can activate an agent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Inbound Client Access Requests Queue */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Inbound Client Access Petitions ({clientAgentRequests.length})
                    </h4>
                    {pendingRequestsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                        {pendingRequestsCount} Awaiting Review
                      </span>
                    )}
                  </div>
                  
                  {/* Filter tabs for requests */}
                  <div className="flex items-center gap-1">
                    {(["all", "pending", "approved", "rejected"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setRequestFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer capitalize ${
                          requestFilterStatus === st
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">No Pending Requests Matching Filter</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Client organizations will appear here when they request permission to add your agents to their white-label dashboard.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((req) => {
                      const isPending = req.status === "pending";
                      const isApproved = req.status === "approved";
                      const isRejected = req.status === "rejected";

                      return (
                        <div
                          key={req.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isPending 
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-sm"
                              : isApproved
                              ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              {/* Client Organization & Requester */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {req.tenantLogo && (
                                  <img 
                                    src={req.tenantLogo} 
                                    alt={req.tenantName} 
                                    className="w-5 h-5 rounded-md object-cover border border-slate-300 dark:border-slate-700" 
                                  />
                                )}
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {req.tenantName}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  • requested by <strong className="text-slate-700 dark:text-slate-300">{req.requesterName}</strong> ({req.requestedByEmail})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  • {new Date(req.requestedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>

                              {/* Target Agent & Target Client Page */}
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold">
                                  {req.agentAvatar && (
                                    <img src={req.agentAvatar} alt={req.agentName} className="w-3.5 h-3.5 rounded-full object-cover" />
                                  )}
                                  <span>Agent: {req.agentName}</span>
                                </div>
                                <span className="text-[11px] text-slate-500">→</span>
                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  <span>Target Client Page: <strong>{req.intendedClientPage}</strong></span>
                                </div>
                              </div>

                              {/* Client Message / Note */}
                              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic relative">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute top-3 left-3" />
                                <div className="pl-5">
                                  "{req.clientNotes}"
                                </div>
                              </div>

                              {/* Active Clarification Reply Box */}
                              {activeReplyRequestId === req.id && (
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 mt-2">
                                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Send Scoping Requirements or Rejection Context to {req.requesterName}</span>
                                  </div>
                                  <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="e.g. This agent requires custom API credentials and Redis cluster access. Please confirm your webhook infrastructure before activation..."
                                    rows={2}
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveReplyRequestId(null)}
                                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendClarification(req)}
                                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Dispatch Scoping Note</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveClientRequest(req)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve for Client Page</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectClientRequest(req)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReplyRequestId(activeReplyRequestId === req.id ? null : req.id);
                                      setReplyMessage("");
                                    }}
                                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                    title="Send Scoping Feedback"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : isApproved ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span>Active on Client Page</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                                  <XCircle className="w-4 h-4 text-slate-400" />
                                  <span>Declined by Creator</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Agent Fleet Privacy & Client Page Visibility Matrix */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>My Created Agents & Client Exposure Matrix ({agents.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Toggle whether each individual agent is internal-only or authorized for client accounts.
                    </p>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={agentFilterQuery}
                        onChange={(e) => setAgentFilterQuery(e.target.value)}
                        placeholder="Search agents..."
                        className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none w-36 focus:w-48 transition-all"
                      />
                    </div>

                    <select
                      value={agentFilterDept}
                      onChange={(e) => setAgentFilterDept(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={agentFilterVisibility}
                      onChange={(e) => setAgentFilterVisibility(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Visibility</option>
                      <option value="internal">🔒 Internal Only</option>
                      <option value="client_allowed">🌐 Client Allowed</option>
                      <option value="requires_review">📩 Requires Review</option>
                    </select>
                  </div>
                </div>

                {/* Agents Matrix List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredAgents.map((agent) => {
                    const isInternal = agent.visibility === "internal_only" || agent.clientPageAllowed === false;
                    const isClientAllowed = agent.clientPageAllowed === true || agent.visibility === "client_visible";
                    const isRequiresReview = agent.visibility === "pending_client_review";

                    return (
                      <div
                        key={agent.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isInternal
                            ? "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
                            : isClientAllowed
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300/60 dark:border-emerald-800/60"
                            : "bg-amber-50/20 dark:bg-amber-950/10 border-amber-300/60 dark:border-amber-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {agent.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                {agent.department}
                              </span>
                              {isInternal && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>Internal Only</span>
                                </span>
                              )}
                              {isClientAllowed && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-emerald-500" />
                                  <span>Client Page Allowed</span>
                                </span>
                              )}
                              {isRequiresReview && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                  <Inbox className="w-3 h-3 text-amber-500" />
                                  <span>Requires Request</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {agent.description}
                            </p>
                          </div>
                        </div>

                        {/* 3-Way Segmented Visibility Selector */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleUpdateAgentVisibility(agent.id, "internal_only", false)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isInternal
                                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                            title="Keep strictly private to creator workspace"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Internal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateAgentVisibility(agent.id, "pending_client_review", false)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isRequiresReview
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                            title="Client must submit scoping brief and wait for your approval"
                          >
                            <Inbox className="w-3 h-3" />
                            <span>Require Request</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateAgentVisibility(agent.id, "client_visible", true)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isClientAllowed
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                            title="Expose on client portal"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Client Allowed</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Global Creator Privacy Policies */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Global Workspace Privacy Rules</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Default New Agents to 'Internal Only'</div>
                      <div className="text-[10px] text-slate-500">Newly constructed agents are never published to client portals without explicit confirmation.</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                      Active
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Real-Time Inbound Request Alerts</div>
                      <div className="text-[10px] text-slate-500">Receive immediate badge indicators whenever a client tenant submits an access petition.</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Enterprise Benchmark Presets */}
          {activeTab === "benchmarks" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      Fleet-Wide Foundation Model Presets
                    </h3>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-1 leading-relaxed">
                      Each agent is a direct portal to the underlying AI model. Select an enterprise benchmark preset below to configure all fleet agents with matching latency, temperature, and reasoning parameters with a single click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benchmark Preset Grid */}
              <div className="space-y-3">
                {BENCHMARK_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedBenchmarkId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-slate-50 dark:bg-slate-800/90 border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${preset.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {preset.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {preset.model}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                Temp: {preset.temperature}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500">
                                • {preset.latencyTier}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                              {preset.description}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              <strong className="text-slate-500 dark:text-slate-400">Best for:</strong> {preset.idealFor}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyBenchmarkPreset(preset)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-200 hover:text-purple-600 border border-slate-200 dark:border-slate-600"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active Preset</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-purple-500" />
                              <span>Apply to Fleet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Temperature Slider Override */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-500" />
                    Fine-Tune Global Fleet Temperature: <span className="text-purple-600 dark:text-purple-400">{globalTemperature}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyCustomFleetSettings}
                    className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Apply Value ({globalTemperature})
                  </button>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={globalTemperature}
                  onChange={(e) => setGlobalTemperature(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0.0 (Deterministic / SOC2)</span>
                  <span>0.35 (Balanced)</span>
                  <span>0.7+ (Expansive Creative)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Model Portal & Behavior */}
          {activeTab === "behavior" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Model Routing & Operational Execution Strategy
                    </h3>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                      Configure how autonomous agents route requests between domain specialists, how execution audits are formatted, and how human-in-the-loop approvals are triggered.
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Mode Switcher */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Execution Orchestration Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePortalMode("generalist")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      portalMode === "generalist"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        Universal Model Portal (Recommended)
                      </div>
                      {portalMode === "generalist" && (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-normal">
                      Agents freely execute tasks across engineering, sales, and operations by analyzing context dynamically.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePortalMode("anchored")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      portalMode === "anchored"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        Domain-Anchored Specialist
                      </div>
                      {portalMode === "anchored" && (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-normal">
                      Agents enforce strict departmental boundaries and require Human-in-the-Loop review for cross-domain queries.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Clean Slate & Reset */}
          {activeTab === "cleanslate" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Baseline Telemetry & Zero-State Baseline
                    </h3>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                      Starting with a baseline initialization ensures your autonomous metrics, labor savings, and task histories accurately reflect actual live production workloads.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Metrics Baseline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Autonomy Ratio</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    {userProfile.autonomousRunRatio ?? 82}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">OpEx Cost Replaced</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                    ${(userProfile.costSavedUsd || 15600).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Hours Liberated</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
                    {userProfile.hoursSavedTotal.toFixed(1)} hrs
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">AI Credits</div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                    {userProfile.creditsBalance?.toLocaleString() || "5,000"}
                  </div>
                </div>
              </div>

              {/* Reset Actions */}
              <div className="space-y-4 pt-2">
                {/* Action 1: Clean Slate Profile Reset */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Reset All Metrics to Clean Slate
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Initializes telemetry back to clean baseline: 0 hours saved, standard autonomy ratio, and restores full starting credit allowance.
                    </p>
                  </div>

                  {confirmCleanSlate ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleExecuteCleanSlate}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Confirm Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCleanSlate(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCleanSlate(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 border border-amber-300 dark:border-amber-800 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Reset to Clean Slate
                    </button>
                  )}
                </div>

                {/* Action 2: Purge Execution Log */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Purge Task Execution History
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Clears recent task execution logs without resetting your user level or badge progress.
                    </p>
                  </div>

                  {confirmClearHistory ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleExecuteClearHistory}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Confirm Purge
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-red-200 dark:border-red-800 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Clear History Log
                    </button>
                  )}
                </div>

                {/* Action 3: Refill AI Credits */}
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-purple-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Replenish Credit Balance
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Reset your available AI generation allowance back to 5,000 Credits.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefillCredits}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    Refill to 5,000 Credits
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span>Settings saved automatically to local storage</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
