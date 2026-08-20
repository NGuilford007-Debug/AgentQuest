import React, { useState, useEffect } from "react";
import { EmployeeProfile, Department, Agent } from "../types";
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
  RefreshCw
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EmployeeProfile;
  agents?: Agent[];
  onUpdateProfile: (updated: Partial<EmployeeProfile>) => void;
  onUpdateAgents?: (agents: Agent[]) => void;
  onResetToCleanSlate: () => void;
  onClearExecutionHistory: () => void;
  onResetAgentsToDefault?: () => void;
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  agents = [],
  onUpdateProfile,
  onUpdateAgents,
  onResetToCleanSlate,
  onClearExecutionHistory,
  onResetAgentsToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<"settings" | "benchmarks" | "behavior" | "cleanslate">(() => {
    return (localStorage.getItem("agentflow_settings_active_tab") as any) || "settings";
  });
  const [name, setName] = useState(userProfile.name);
  const [role, setRole] = useState(userProfile.role);
  const [department, setDepartment] = useState<Department>(userProfile.department);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem("agentflow_workspace_name") || "Acme Enterprise Corp";
  });
  const [preferredTone, setPreferredTone] = useState<string>(() => {
    return localStorage.getItem("agentflow_pref_tone") || "executive";
  });
  const [portalMode, setPortalMode] = useState<string>(() => {
    return localStorage.getItem("agentflow_portal_mode") || "generalist";
  });
  const [globalTemperature, setGlobalTemperature] = useState<number>(() => {
    const savedTemp = localStorage.getItem("agentflow_global_temp");
    return savedTemp ? parseFloat(savedTemp) : 0.35;
  });
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>(() => {
    return localStorage.getItem("agentflow_selected_benchmark") || "balanced-fleet";
  });
  
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
      setCompanyName(localStorage.getItem("agentflow_workspace_name") || "Acme Enterprise Corp");
      setPreferredTone(localStorage.getItem("agentflow_pref_tone") || "executive");
      setPortalMode(localStorage.getItem("agentflow_portal_mode") || "generalist");
      const savedTemp = localStorage.getItem("agentflow_global_temp");
      if (savedTemp) setGlobalTemperature(parseFloat(savedTemp));
      const savedBenchmark = localStorage.getItem("agentflow_selected_benchmark");
      if (savedBenchmark) setSelectedBenchmarkId(savedBenchmark);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTabChange = (tab: "settings" | "benchmarks" | "behavior" | "cleanslate") => {
    setActiveTab(tab);
    localStorage.setItem("agentflow_settings_active_tab", tab);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || "Alex Mercer";
    const cleanRole = role.trim() || "Automation Architect";
    const cleanAvatar = avatar.trim() || PRESET_AVATARS[0].url;
    const cleanCompany = companyName.trim() || "Acme Enterprise Corp";

    onUpdateProfile({
      name: cleanName,
      role: cleanRole,
      department,
      avatar: cleanAvatar,
    });
    localStorage.setItem("agentflow_workspace_name", cleanCompany);
    localStorage.setItem("agentflow_pref_tone", preferredTone);
    localStorage.setItem("agentflow_avatar_url", cleanAvatar);
    showToast("Profile identity & personalization preferences saved across sessions!");
  };

  const handleToneChange = (toneId: string) => {
    setPreferredTone(toneId);
    localStorage.setItem("agentflow_pref_tone", toneId);
    showToast(`Work product delivery tone set to "${toneId}".`);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatar(avatarUrl);
    localStorage.setItem("agentflow_avatar_url", avatarUrl);
  };

  const handleApplyBenchmarkPreset = (preset: BenchmarkPreset) => {
    setSelectedBenchmarkId(preset.id);
    setGlobalTemperature(preset.temperature);
    
    // Persist benchmark preset selections to localStorage
    localStorage.setItem("agentflow_selected_benchmark", preset.id);
    localStorage.setItem("agentflow_global_temp", preset.temperature.toString());
    localStorage.setItem("agentflow_benchmark_model", preset.model);
    
    if (onUpdateAgents && agents.length > 0) {
      const updatedAgents = agents.map((agent) => ({
        ...agent,
        model: preset.model,
        temperature: preset.temperature,
      }));
      onUpdateAgents(updatedAgents);
      localStorage.setItem("agentflow_agents", JSON.stringify(updatedAgents));
      showToast(`Applied & persisted "${preset.name}" across all ${agents.length} fleet agents!`);
    } else {
      showToast(`Selected & persisted "${preset.name}" benchmark preset!`);
    }
  };

  const handleApplyCustomFleetSettings = () => {
    localStorage.setItem("agentflow_global_temp", globalTemperature.toString());
    if (onUpdateAgents && agents.length > 0) {
      const updatedAgents = agents.map((agent) => ({
        ...agent,
        temperature: globalTemperature,
      }));
      onUpdateAgents(updatedAgents);
      localStorage.setItem("agentflow_agents", JSON.stringify(updatedAgents));
      showToast(`Persisted global fleet temperature (${globalTemperature}) across all agents!`);
    } else {
      showToast(`Persisted temperature setting: ${globalTemperature}`);
    }
  };

  const handleTogglePortalMode = (mode: string) => {
    setPortalMode(mode);
    localStorage.setItem("agentflow_portal_mode", mode);
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
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
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
                Personalize your profile, configure enterprise benchmark presets, tune agent parameters, or initialize baseline telemetry.
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
            <span>Profile & Personalization</span>
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
                    Full Name
                  </label>
                  <input
                    id="input-profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    Role & Job Title
                  </label>
                  <input
                    id="input-profile-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Automation Lead / SRE"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Department & Workspace Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Department Affiliation
                  </label>
                  <select
                    id="select-profile-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* TAB 2: Enterprise Benchmark Presets */}
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

          {/* TAB 3: Model Portal & Behavior */}
          {activeTab === "behavior" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Universal Model Portal Philosophy
                    </h3>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                      Agent personas provide stylistic flavor, tone, and domain expertise. Under the hood, each agent is an unconstrained gateway to the full foundational model, capable of handling any cross-department task without artificial limitations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Mode Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Agent Execution Capability Mode:
                </label>

                <div 
                  onClick={() => handleTogglePortalMode("generalist")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    portalMode === "generalist"
                      ? "bg-indigo-50/50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          Universal Generalist Portal (Recommended)
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            Maximum Flexibility
                          </span>
                        </h4>
                        {portalMode === "generalist" && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        Agents carry their specialized character/tone, but will eagerly solve ANY problem (code, marketing, video titles, finance, HR, support) without declining or restricting capabilities.
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => handleTogglePortalMode("specialist")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    portalMode === "specialist"
                      ? "bg-indigo-50/50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          Domain-Anchored Specialist
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Strict Role Focus
                          </span>
                        </h4>
                        {portalMode === "specialist" && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        Agents strongly filter all questions through their dedicated department lens (e.g. SRE focuses exclusively on technical reliability).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Clean Slate & Data Integrity */}
          {activeTab === "cleanslate" && (
            <div className="space-y-6">
              {/* Baseline Info Box */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
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
