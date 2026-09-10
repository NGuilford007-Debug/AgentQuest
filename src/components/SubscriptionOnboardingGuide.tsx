import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Zap, 
  Building2, 
  Mail, 
  User, 
  Award, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Radio, 
  Bot, 
  Lock, 
  Unlock, 
  Palette, 
  CreditCard, 
  DollarSign, 
  Compass, 
  Target, 
  Activity, 
  Coffee, 
  Bell, 
  Play, 
  Flame, 
  FileText,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle
} from "lucide-react";
import { 
  EmployeeProfile, 
  MasterAccessSettings, 
  DeveloperCompanyProfile, 
  WorkplaceStage, 
  Agent, 
  WorkplaceVibe 
} from "../types";
import { NavTab } from "./Sidebar";
import { fireCelebration } from "../utils/confetti";
import { playInteractiveSound, startAmbientSound, stopAmbientSound, AmbientSoundType } from "../utils/audioSynth";
import { getWorkplaceTheme, ALL_WORKPLACE_THEMES } from "../utils/workplaceThemes";

export interface SubscriptionOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  planId: "free" | "starter" | "pro" | "enterprise";
  userProfile: EmployeeProfile;
  masterAccess: MasterAccessSettings;
  developerProfile: DeveloperCompanyProfile;
  workplaceStages: WorkplaceStage[];
  agents: Agent[];
  activeWorkplaceThemeId?: string;
  onUpdateFounderProfile: (founderData: {
    name: string;
    email: string;
    title: string;
    companyName: string;
    avatar?: string;
    activateMasterDeveloper: boolean;
  }) => void;
  onCustomizeWorkspace: (customization: {
    stageId: string;
    customStageName?: string;
    customSubtitle?: string;
    vibe?: WorkplaceVibe;
    ambientTrack?: "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse";
    assignedAgentIds: string[];
    setActiveGlobalTheme: boolean;
  }) => void;
  onNavigateToTab?: (tab: NavTab) => void;
  onCompleteOnboarding?: () => void;
}

interface PlanPresetMetadata {
  id: "free" | "starter" | "pro" | "enterprise";
  name: string;
  badge: string;
  priceLabel: string;
  tokenAllowance: string;
  creditBonus: string;
  fleetCapacity: string;
  summary: string;
  recommendedStageId: string;
  recommendedThemeId: string;
  recommendedAgents: string[];
  recommendedAmbient: "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse";
  recommendedVibe: WorkplaceVibe;
  workspaceGoal: string;
  keyPerks: string[];
  firstActions: { title: string; desc: string; targetTab: NavTab }[];
}

const PLAN_PRESETS: Record<"free" | "starter" | "pro" | "enterprise", PlanPresetMetadata> = {
  free: {
    id: "free",
    name: "Developer Free Tier",
    badge: "Sandbox Explorer",
    priceLabel: "$0 / month",
    tokenAllowance: "500,000 Free Tokens",
    creditBonus: "$10 Free Seed Balance",
    fleetCapacity: "2 Active Agent Slots",
    summary: "Ideal for sandbox experimentation, rapid agent prompting, and local workflow testing.",
    recommendedStageId: "stage-neural-lab",
    recommendedThemeId: "theme-creative-synth",
    recommendedAgents: ["agent-1", "agent-2"],
    recommendedAmbient: "lofi_beats",
    recommendedVibe: "creative_flow",
    workspaceGoal: "Rapid AI Prototyping & Single-Agent Experiments",
    keyPerks: [
      "Access to Smart Chat & prompt dispatcher",
      "Standard Gemini 2.5 Flash execution",
      "Essential digital workspace environment"
    ],
    firstActions: [
      { title: "Dispatch First Task", desc: "Send an ad-hoc prompt directly to your stationed agent", targetTab: "chat" },
      { title: "Inspect Workspace", desc: "Explore ambient soundscapes and workstation triggers", targetTab: "workplaces" }
    ]
  },
  starter: {
    id: "starter",
    name: "Starter Agency",
    badge: "Agile Automation Launchpad",
    priceLabel: "$49 / month",
    tokenAllowance: "5,000,000 Monthly Tokens",
    creditBonus: "$40 Real-time Wallet Deposit",
    fleetCapacity: "5 Dedicated Agent Slots",
    summary: "Built for agile boutique agencies and lean engineering teams automating critical operational pipelines.",
    recommendedStageId: "stage-war-room",
    recommendedThemeId: "theme-sre-titanium",
    recommendedAgents: ["agent-1", "agent-3"],
    recommendedAmbient: "cyber_hum",
    recommendedVibe: "cyber_alert",
    workspaceGoal: "High-Throughput Incident Triage & Client Ticket Automation",
    keyPerks: [
      "5M High-speed prompt & inference tokens monthly",
      "$40 Initial API token allowance in wallet",
      "SRE Incident War Room with +25% resolution speed buff",
      "Access to Prompt Agent Focus HUD"
    ],
    firstActions: [
      { title: "Configure SRE War Room", desc: "Station your core infrastructure agents into high alert", targetTab: "workplaces" },
      { title: "Build Customer Escalation Flow", desc: "Automate inbound email triage and ticket assignment", targetTab: "studio" },
      { title: "Check Task Focus HUD", desc: "Track live operational checklist completion", targetTab: "dashboard" }
    ]
  },
  pro: {
    id: "pro",
    name: "Growth SaaS",
    badge: "Scaling Cross-Department Fleet",
    priceLabel: "$199 / month",
    tokenAllowance: "25,000,000 Monthly Tokens",
    creditBonus: "$160 High-Volume Wallet Deposit",
    fleetCapacity: "15 Concurrent Agent Slots",
    summary: "Engineered for high-growth SaaS organizations scaling automated intelligence across Engineering, Marketing, Finance, and Support.",
    recommendedStageId: "stage-strategy-oasis",
    recommendedThemeId: "theme-zen-minimal",
    recommendedAgents: ["agent-1", "agent-2", "agent-5"],
    recommendedAmbient: "binaural_432",
    recommendedVibe: "deep_focus",
    workspaceGoal: "Cross-Departmental ROI Optimization & Executive Intelligence Synthesis",
    keyPerks: [
      "25M Generative tokens with priority queuing",
      "$160 Operational credit allowance deposited into wallet",
      "Executive Penthouse Strategy Deck with +20% ROI modeling buff",
      "Automated PDF ROI Executive Briefing generation",
      "Circuit Breaker spend velocity and runaway-loop quarantine"
    ],
    firstActions: [
      { title: "Generate Executive ROI Briefing", desc: "Synthesize hour-savings and OpEx reductions across departments", targetTab: "dashboard" },
      { title: "Deploy Multi-Department Workflows", desc: "Connect GitHub, Jira, and Slack webhooks seamlessly", targetTab: "studio" },
      { title: "Set Circuit Breaker Safety", desc: "Establish spend velocity ceilings and loop protection", targetTab: "health" }
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise White-Label",
    badge: "Master White-Label Agency Empire",
    priceLabel: "$499 / month",
    tokenAllowance: "100,000,000 Monthly Tokens",
    creditBonus: "$420 Enterprise Wallet Deposit",
    fleetCapacity: "Unlimited Autonomous Fleet",
    summary: "The ultimate institutional solution for agencies and enterprise teams delivering custom-branded, multi-tenant AI operations with client billing.",
    recommendedStageId: "stage-secops-vault",
    recommendedThemeId: "theme-cyberpunk-2099",
    recommendedAgents: ["agent-1", "agent-2", "agent-3", "agent-4", "agent-5"],
    recommendedAmbient: "vault_pulse",
    recommendedVibe: "cyber_alert",
    workspaceGoal: "Zero-Trust Multi-Tenant Governance & White-Label Client Monetization",
    keyPerks: [
      "100M Dedicated enterprise tokens with zero retention compliance",
      "$420 Wallet allowance credited instantly to agency balance",
      "Full White-Label Studio: Custom domain CNAME, brand colors, logo",
      "Stripe Connect client payouts & metered token margin rate cards",
      "Client Lock Enforcement: Simulate or lock tenant operator views",
      "Quantum SecOps Vault with 40% RBAC leakage prevention buff"
    ],
    firstActions: [
      { title: "Open White-Label Studio", desc: "Configure your agency logo, primary hex colors, and custom domain", targetTab: "whitelabel" },
      { title: "Configure Stripe Rate Card", desc: "Set your token markup margins (e.g. 3.5x) to profit from client usage", targetTab: "monetization" },
      { title: "Audit Zero-Trust SecOps Vault", desc: "Verify PII masking and RBAC permission boundaries", targetTab: "permissions" }
    ]
  }
};

const FOUNDER_TITLE_CHIPS = [
  "Founder & Chief Automation Officer",
  "Managing Director & Founder",
  "CEO & AI Solutions Architect",
  "Principal Agency Partner",
  "VP of Intelligent Operations",
  "Head of Autonomous Systems"
];

const FOUNDER_AVATARS = [
  { id: "crown", label: "Executive Crown", emoji: "👑", bg: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { id: "shield", label: "Root Guardian", emoji: "🛡️", bg: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  { id: "bolt", label: "Velocity Architect", emoji: "⚡", bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  { id: "star", label: "Elite Partner", emoji: "⭐", bg: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  { id: "diamond", label: "Founding Partner", emoji: "💎", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" }
];

export const SubscriptionOnboardingGuide: React.FC<SubscriptionOnboardingGuideProps> = ({
  isOpen,
  onClose,
  planId,
  userProfile,
  masterAccess,
  developerProfile,
  workplaceStages,
  agents,
  activeWorkplaceThemeId,
  onUpdateFounderProfile,
  onCustomizeWorkspace,
  onNavigateToTab,
  onCompleteOnboarding,
}) => {
  // Step Management: 1: Plan Confirmation, 2: Founder Setup, 3: Workspace Customization, 4: Launch
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "starter" | "pro" | "enterprise">(planId || "pro");

  // Step 2: Founder Profile Form State
  const [founderName, setFounderName] = useState<string>(
    userProfile.name || "Alex Mercer"
  );
  const [founderEmail, setFounderEmail] = useState<string>(
    developerProfile.developerEmail || masterAccess.founderEmail || userProfile.email || "founder@enterprise.io"
  );
  const [founderTitle, setFounderTitle] = useState<string>(
    userProfile.role || "Founder & Chief Automation Officer"
  );
  const [companyName, setCompanyName] = useState<string>(
    developerProfile.companyName || userProfile.organizationName || "Guilford Industries"
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("crown");
  const [activateMasterDev, setActivateMasterDev] = useState<boolean>(true);
  const [founderSavedSuccess, setFounderSavedSuccess] = useState<boolean>(false);

  // Step 3: Workspace Customization State
  const planPreset = PLAN_PRESETS[selectedPlan] || PLAN_PRESETS.pro;
  const [selectedStageId, setSelectedStageId] = useState<string>(planPreset.recommendedStageId);
  const [customStageName, setCustomStageName] = useState<string>("");
  const [customSubtitle, setCustomSubtitle] = useState<string>(planPreset.workspaceGoal);
  const [selectedAmbientTrack, setSelectedAmbientTrack] = useState<"cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse">(
    planPreset.recommendedAmbient
  );
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(planPreset.recommendedAgents);
  const [setAsGlobalTheme, setSetAsGlobalTheme] = useState<boolean>(true);
  const [workspaceSavedSuccess, setWorkspaceSavedSuccess] = useState<boolean>(false);
  const [isPlayingPreviewAudio, setIsPlayingPreviewAudio] = useState<boolean>(false);

  // Sync state if planId changes
  useEffect(() => {
    if (planId) {
      setSelectedPlan(planId);
      const preset = PLAN_PRESETS[planId] || PLAN_PRESETS.pro;
      setSelectedStageId(preset.recommendedStageId);
      setSelectedAmbientTrack(preset.recommendedAmbient);
      setSelectedAgentIds(preset.recommendedAgents);
      setCustomSubtitle(preset.workspaceGoal);
    }
  }, [planId]);

  // Handle ambient sound preview toggle
  const handleToggleSoundPreview = (track: "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse") => {
    if (isPlayingPreviewAudio && selectedAmbientTrack === track) {
      stopAmbientSound();
      setIsPlayingPreviewAudio(false);
    } else {
      setSelectedAmbientTrack(track);
      startAmbientSound(track as AmbientSoundType, 0.4);
      setIsPlayingPreviewAudio(true);
      playInteractiveSound("click");
    }
  };

  // Clean up preview audio on unmount or close
  useEffect(() => {
    return () => {
      if (isPlayingPreviewAudio) {
        stopAmbientSound();
      }
    };
  }, [isPlayingPreviewAudio]);

  if (!isOpen) return null;

  // Selected stage details
  const currentStageObj = workplaceStages.find((s) => s.id === selectedStageId) || workplaceStages[0];

  const handleSaveFounderProfile = () => {
    onUpdateFounderProfile({
      name: founderName.trim(),
      email: founderEmail.trim(),
      title: founderTitle.trim(),
      companyName: companyName.trim(),
      avatar: selectedAvatarId,
      activateMasterDeveloper: activateMasterDev,
    });
    setFounderSavedSuccess(true);
    playInteractiveSound("chime");
    fireCelebration();
    setTimeout(() => {
      setFounderSavedSuccess(false);
    }, 2400);
  };

  const handleApplyWorkspaceCustomization = () => {
    onCustomizeWorkspace({
      stageId: selectedStageId,
      customStageName: customStageName.trim() || undefined,
      customSubtitle: customSubtitle.trim() || undefined,
      ambientTrack: selectedAmbientTrack,
      assignedAgentIds: selectedAgentIds,
      setActiveGlobalTheme: setAsGlobalTheme,
    });
    setWorkspaceSavedSuccess(true);
    playInteractiveSound("chime");
    fireCelebration();
    setTimeout(() => {
      setWorkspaceSavedSuccess(false);
    }, 2400);
  };

  const handleFinishOnboarding = () => {
    // If not manually applied, apply both automatically
    onUpdateFounderProfile({
      name: founderName.trim(),
      email: founderEmail.trim(),
      title: founderTitle.trim(),
      companyName: companyName.trim(),
      avatar: selectedAvatarId,
      activateMasterDeveloper: activateMasterDev,
    });

    onCustomizeWorkspace({
      stageId: selectedStageId,
      customStageName: customStageName.trim() || undefined,
      customSubtitle: customSubtitle.trim() || undefined,
      ambientTrack: selectedAmbientTrack,
      assignedAgentIds: selectedAgentIds,
      setActiveGlobalTheme: setAsGlobalTheme,
    });

    if (isPlayingPreviewAudio) {
      stopAmbientSound();
      setIsPlayingPreviewAudio(false);
    }

    try {
      localStorage.setItem(`agentflow_onboarding_completed_${selectedPlan}`, "true");
      localStorage.setItem("agentflow_has_completed_founder_onboarding", "true");
    } catch {
      // ignore
    }

    playInteractiveSound("level_up");
    fireCelebration();
    onCompleteOnboarding?.();
    onClose();

    // Navigate to customized workspace
    onNavigateToTab?.("workplaces");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      id="modal-subscription-onboarding"
    >
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-guide-title"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="onboarding-guide-title" className="text-sm font-bold text-white tracking-tight">
                  Automated Subscription Onboarding
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {planPreset.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure your master founder identity and tailor your initial workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  id={`btn-step-dot-${step}`}
                  onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    currentStep === step
                      ? "bg-indigo-600 text-white shadow-sm"
                      : currentStep > step
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                  title={`Go to step ${step}`}
                >
                  {currentStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </button>
              ))}
            </div>

            <button
              id="btn-close-onboarding-guide"
              onClick={() => {
                if (isPlayingPreviewAudio) stopAmbientSound();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close Onboarding Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Tracker Pill Bar */}
        <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Step {currentStep} of 4:</span>
            <span className="text-indigo-400 font-medium">
              {currentStep === 1 && "Active Subscription Plan & Capabilities"}
              {currentStep === 2 && "Setup Founder Profile & Master Access"}
              {currentStep === 3 && "Customize Initial Plan-Tailored Workspace"}
              {currentStep === 4 && "Launch Workspace & Recommended Next Steps"}
            </span>
          </div>

          <button
            id="btn-skip-onboarding"
            onClick={handleFinishOnboarding}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 underline decoration-slate-600"
          >
            Apply defaults & Launch
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================== */}
          {/* STEP 1: SUBSCRIPTION CONFIRMATION & PLAN OVERVIEW       */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200" id="onboarding-step-1">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                      Subscription Active
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Welcome to {planPreset.name}!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    {planPreset.summary} Your quotas and enterprise features are unlocked across the entire system.
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30">
                  <span className="text-[11px] text-slate-400">Subscription Tier</span>
                  <span className="text-sm font-bold text-emerald-400">{planPreset.priceLabel}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{planPreset.badge}</span>
                </div>
              </div>

              {/* Plan Switcher Pills (If user wants to tailor based on a different tier) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Selected Subscription Plan to Configure:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Click any tier to preview its configuration</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["free", "starter", "pro", "enterprise"] as const).map((tier) => {
                    const info = PLAN_PRESETS[tier];
                    const isSelected = selectedPlan === tier;
                    return (
                      <button
                        key={tier}
                        id={`btn-select-tier-${tier}`}
                        onClick={() => {
                          setSelectedPlan(tier);
                          setSelectedStageId(info.recommendedStageId);
                          setSelectedAmbientTrack(info.recommendedAmbient);
                          setSelectedAgentIds(info.recommendedAgents);
                          setCustomSubtitle(info.workspaceGoal);
                          playInteractiveSound("click");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white capitalize">{info.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-400">{info.priceLabel}</div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">{info.tokenAllowance}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Plan Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Inference Quota</span>
                  </div>
                  <div className="text-sm font-bold text-white">{planPreset.tokenAllowance}</div>
                  <p className="text-[10px] text-slate-400">Fast streaming with Gemini 2.5 Flash & 1.5 Pro</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Wallet Balance</span>
                  </div>
                  <div className="text-sm font-bold text-white">{planPreset.creditBonus}</div>
                  <p className="text-[10px] text-slate-400">Real-time credit deposit for metered tool runs</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Bot className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Fleet Capacity</span>
                  </div>
                  <div className="text-sm font-bold text-white">{planPreset.fleetCapacity}</div>
                  <p className="text-[10px] text-slate-400">Autonomous agents stationed across workspaces</p>
                </div>
              </div>

              {/* Plan Included Highlights */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <div className="text-xs font-bold text-slate-200">Included Capabilities with {planPreset.name}:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {planPreset.keyPerks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SET UP 'FOUNDER' PROFILE & MASTER ACCESS         */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200" id="onboarding-step-2">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Step 2: Establish Your 'Founder' Profile & Master Authority
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  As the primary subscriber, your account is designated as the <strong>Master Founder</strong>. 
                  This grants root authority over white-label branding, rate cards, financial payouts, and allows simulating 
                  or enforcing client views.
                </p>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Founder Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Founder Legal Name</span>
                  </label>
                  <input
                    id="input-founder-name"
                    type="text"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Founder Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Founder Work Email</span>
                  </label>
                  <input
                    id="input-founder-email"
                    type="email"
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    placeholder="e.g. founder@enterprise.io"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Organization / Agency Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Company or Agency Name</span>
                  </label>
                  <input
                    id="input-founder-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Guilford Industries"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Executive Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Executive Role / Title</span>
                  </label>
                  <input
                    id="input-founder-title"
                    type="text"
                    value={founderTitle}
                    onChange={(e) => setFounderTitle(e.target.value)}
                    placeholder="e.g. Founder & Chief Automation Officer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Title Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Quick Title Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {FOUNDER_TITLE_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFounderTitle(chip)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        founderTitle === chip
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Founder Avatar / Insignia Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Select Founder Executive Insignia:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FOUNDER_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(av.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        selectedAvatarId === av.id
                          ? `${av.bg} shadow-md ring-1 ring-white/20`
                          : "bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="text-xl">{av.emoji}</span>
                      <span className="text-[11px] font-bold truncate max-w-full">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Developer Elevation Switch */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Activate Master Developer Elevation</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[9px] uppercase font-mono">Root</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Unlocks White-Label Studio, Rate Card markups, and master simulation without PIN entry.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={activateMasterDev}
                    onChange={(e) => setActivateMasterDev(e.target.checked)}
                    className="sr-only peer"
                    id="checkbox-activate-master-dev"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Live Save Button for Step 2 */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  You can modify these details anytime from Profile & Settings.
                </span>
                <button
                  id="btn-save-founder-profile"
                  type="button"
                  onClick={handleSaveFounderProfile}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {founderSavedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved & Synchronized!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Founder Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: CUSTOMIZE INITIAL WORKSPACE BASED ON PLAN        */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200" id="onboarding-step-3">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Step 3: Customize Initial Workspace for {planPreset.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Digital Workspaces set the environmental aura, ambient audio frequency, and operational buff multiplier 
                  for your agents. Based on your <strong>{planPreset.name}</strong> plan, we recommend the 
                  <strong> {workplaceStages.find((s) => s.id === planPreset.recommendedStageId)?.name || "Recommended Stage"}</strong>.
                </p>
              </div>

              {/* Stage Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Select Primary Environmental Stage:</span>
                  <span className="text-[11px] text-cyan-400 font-normal">Includes specific operational buffs</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {workplaceStages.map((stage) => {
                    const isSelected = selectedStageId === stage.id;
                    const isRecommended = planPreset.recommendedStageId === stage.id;
                    return (
                      <button
                        key={stage.id}
                        id={`btn-select-stage-${stage.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedStageId(stage.id);
                          setSelectedAmbientTrack(stage.ambientTrack);
                          playInteractiveSound("click");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? "bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/40"
                            : "bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                            Recommended
                          </span>
                        )}
                        <div className="text-xs font-bold text-white pr-16 truncate">{stage.name}</div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{stage.subtitle}</p>
                        
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                          <span className="text-cyan-300 font-bold truncate max-w-[130px]">{stage.buffMultiplier}</span>
                          <span className="text-slate-400 font-mono">{stage.noiseLevel.split(" ")[0]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Fine-Tuning */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Stage Properties & Audio Ambience</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    Active: {currentStageObj?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Custom Stage Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Workspace Custom Name (Optional)</label>
                    <input
                      id="input-custom-stage-name"
                      type="text"
                      value={customStageName}
                      onChange={(e) => setCustomStageName(e.target.value)}
                      placeholder={currentStageObj?.name || "e.g. SRE Cyber War Room"}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  {/* Operational Mission Goal */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Operational Focus & Mission Objective</label>
                    <input
                      id="input-custom-stage-subtitle"
                      type="text"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="e.g. High-throughput real-time incident resolution"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Ambient Audio Selector with Preview Button */}
                <div className="space-y-2 pt-2 border-t border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Atmospheric Sound Generator (Procedural WebAudio)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleSoundPreview(selectedAmbientTrack)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        isPlayingPreviewAudio
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                          : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      }`}
                    >
                      {isPlayingPreviewAudio ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          <span>Mute Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Test Audio Track</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "cyber_hum", label: "Server Core Hum", desc: "Sub-Bass fan array" },
                      { id: "zen_rain", label: "Bamboo Rain & 432Hz", desc: "Calm equilibrium" },
                      { id: "lofi_beats", label: "Warm Lo-Fi Vinyl", desc: "Relaxed synergy" },
                      { id: "binaural_432", label: "Binaural Alpha Waves", desc: "Executive focus" },
                      { id: "cafe_chatter", label: "Rooftop Cafe Murmur", desc: "Social recharge" },
                      { id: "vault_pulse", label: "Quantum Resonance", desc: "Cryo vault pulse" },
                    ].map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          setSelectedAmbientTrack(track.id as any);
                          if (isPlayingPreviewAudio) {
                            startAmbientSound(track.id as any, 0.4);
                          }
                          playInteractiveSound("click");
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          selectedAmbientTrack === track.id
                            ? "bg-cyan-950/40 border-cyan-400 text-white ring-1 ring-cyan-400/40"
                            : "bg-slate-900 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{track.label}</div>
                        <div className="text-[9px] text-slate-400 truncate">{track.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stationed Agents Multi-Select */}
                <div className="space-y-2 pt-2 border-t border-slate-700/80">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Select Agents Stationed in this Initial Stage:</span>
                    <span className="text-[10px] text-slate-400">{selectedAgentIds.length} agents stationed</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agents.map((agent) => {
                      const isAssigned = selectedAgentIds.includes(agent.id);
                      return (
                        <div
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgentIds((prev) =>
                              isAssigned
                                ? prev.filter((id) => id !== agent.id)
                                : [...prev, agent.id]
                            );
                          }}
                          className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isAssigned
                              ? "bg-indigo-950/40 border-indigo-500/50 text-white"
                              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{agent.avatar || "🤖"}</span>
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-200 truncate">{agent.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isAssigned ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-600 bg-slate-800"
                          }`}>
                            {isAssigned && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Global Theme Sync Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setAsGlobalTheme}
                      onChange={(e) => setSetAsGlobalTheme(e.target.checked)}
                      className="rounded-md border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Set this stage vibe as the global app atmosphere</span>
                  </label>

                  <button
                    id="btn-apply-workspace-customization"
                    type="button"
                    onClick={handleApplyWorkspaceCustomization}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    {workspaceSavedSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Workspace Applied!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Workspace Setup</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: LAUNCH & PLAN-SPECIFIC RECOMMENDED ACTIONS       */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200" id="onboarding-step-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/40 space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  You're Ready to Launch as Master Founder!
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  Your founder credentials for <strong>{founderName}</strong> ({companyName}) and initial workspace 
                  configuration for <strong>{planPreset.name}</strong> are completely provisioned.
                </p>
              </div>

              {/* Summary of Configured Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    Executive Founder Profile
                  </span>
                  <div className="text-xs text-slate-200 font-bold">{founderName}</div>
                  <div className="text-[11px] text-slate-300">{founderTitle}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{founderEmail} • {companyName}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    <span>Master Developer root access active</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    Initial Workspace Stage
                  </span>
                  <div className="text-xs text-slate-200 font-bold">
                    {customStageName || currentStageObj?.name}
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-1">
                    {customSubtitle || currentStageObj?.subtitle}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Track: {selectedAmbientTrack} • {selectedAgentIds.length} agents stationed
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    <span>Atmospheric operational buff applied</span>
                  </div>
                </div>
              </div>

              {/* Recommended Next Actions for Plan */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-200">
                  Recommended First Steps for {planPreset.name}:
                </div>
                <div className="space-y-2">
                  {planPreset.firstActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors cursor-pointer group"
                      onClick={() => {
                        handleFinishOnboarding();
                        onNavigateToTab?.(action.targetTab);
                      }}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{action.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            {action.targetTab}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{action.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions Bar */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                id="btn-onboarding-back"
                type="button"
                onClick={() => {
                  setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                  playInteractiveSound("click");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Press Next to set up your Founder Profile
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                id="btn-onboarding-next"
                type="button"
                onClick={() => {
                  if (currentStep === 2) {
                    handleSaveFounderProfile();
                  } else if (currentStep === 3) {
                    handleApplyWorkspaceCustomization();
                  }
                  setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                  playInteractiveSound("click");
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-launch-customized-workspace"
                type="button"
                onClick={handleFinishOnboarding}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Customized Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
