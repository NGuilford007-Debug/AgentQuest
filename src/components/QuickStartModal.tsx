import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Bot, 
  Workflow as WorkflowIcon, 
  PlayCircle, 
  BarChart3, 
  ShieldCheck, 
  Users2, 
  Layers, 
  Activity, 
  Palette, 
  DollarSign, 
  BookmarkCheck, 
  Mail, 
  MessageSquareCode, 
  ImageIcon, 
  Scale, 
  Trophy, 
  CreditCard, 
  Compass, 
  Zap, 
  Check, 
  ExternalLink,
  ChevronRight,
  Lightbulb,
  FileText,
  FileDown,
  ShieldAlert,
  Clock,
  Sliders,
  Keyboard,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  currentTab?: NavTab;
}

interface FeatureGuideItem {
  id: NavTab;
  title: string;
  category: "core" | "tools" | "enterprise";
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  keyCapabilities: string[];
  proTip: string;
  samplePromptOrAction?: string;
}

const FEATURE_CATALOG: FeatureGuideItem[] = [
  {
    id: "chat",
    title: "Smart Chat & Gemini AI Assistant",
    category: "core",
    badge: "AI Reasoning",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: MessageSquareCode,
    summary: "Interact directly with Google Gemini AI models for multi-turn reasoning, streaming code generation, and rapid task drafting.",
    keyCapabilities: [
      "Dynamic model switching (Gemini 2.5 Flash, Gemini 1.5 Pro)",
      "Web research and live grounding capabilities",
      "One-click task dispatch directly into autonomous agent queues"
    ],
    proTip: "Use the prompt quick-starters to generate production-ready system instructions or test agent personas."
  },
  {
    id: "imagestudio",
    title: "Image Studio & Creative Asset Engine",
    category: "tools",
    badge: "Asset Gen",
    badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    icon: ImageIcon,
    summary: "Generate brand-consistent digital artwork, marketing mockups, and corporate UI components using Imagen 3.",
    keyCapabilities: [
      "Selectable aspect ratios (1:1, 16:9, 4:3, 9:16)",
      "Style presets: Photorealistic, Vector Minimalist, Cyberpunk, 3D Render",
      "Direct integration into the Enterprise Digital Asset Gallery"
    ],
    proTip: "Pair Vector Minimalist style with specific brand hex codes in your prompt for instant marketing collateral."
  },
  {
    id: "dashboard",
    title: "Executive Business Dashboard",
    category: "core",
    badge: "Mission Control",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    icon: BarChart3,
    summary: "Centralized mission control visualizing overall business ROI, labor replacement value, and recurring revenue run rates.",
    keyCapabilities: [
      "Condensed vs. Expanded layout toggle for high-level vs. deep audit",
      "Autonomous labor value calculation at fully loaded $85/hr",
      "AI Strategic Report generator with executive board-level classification"
    ],
    proTip: "Click 'Condensed View' to immediately see high-level executive cards during board or stakeholder briefings."
  },
  {
    id: "agents",
    title: "Agent Roster & Fleet Management",
    category: "core",
    badge: "Autonomous Fleet",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: Bot,
    summary: "Manage and configure your fleet of autonomous agents with custom system instructions, skill sets, and department roles.",
    keyCapabilities: [
      "Real-time search filtering across agent names, roles, and skills",
      "Granular autonomy tiers (Assisted, Supervised, Autonomous)",
      "System prompt tuner with JSON schema validation & temperature tuning"
    ],
    proTip: "Filter by department or type keywords in the search bar to locate specialized agents in seconds."
  },
  {
    id: "health",
    title: "Agent Health & Telemetry Monitor",
    category: "tools",
    badge: "Live SRE",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: Activity,
    summary: "Real-time Site Reliability Engineering (SRE) cockpit tracking agent uptime, inference latencies, and circuit breaker health.",
    keyCapabilities: [
      "Live latency charts and response time distribution across agents",
      "Automated circuit breaker trips on consecutive failure thresholds",
      "Direct health recovery resets and execution replay tools"
    ],
    proTip: "If an agent encounters high API error rates, the circuit breaker protects your downstream systems from cascading failures."
  },
  {
    id: "workplaces",
    title: "Digital Workspaces & Focus Stages",
    category: "tools",
    badge: "Focus Ambient",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Layers,
    summary: "Curated ergonomic operating stages featuring adaptive visual themes, synthesizer soundscapes, and integrated focus timers.",
    keyCapabilities: [
      "12+ curated workplace themes (War Room, Midnight Cyber, Zen Garden, Nordic Minimal)",
      "Web Audio synthesizer ambient soundscapes (Lo-fi drone, binaural focus, white noise)",
      "Integrated Pomodoro & Sprint timers with active telemetry tracking"
    ],
    proTip: "Toggle ambient sound from the header audio button to enter deep focus during complex workflow design."
  },
  {
    id: "studio",
    title: "Workflow Studio & Canvas Orchestrator",
    category: "core",
    badge: "Visual Graph",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    icon: WorkflowIcon,
    summary: "Visual drag-and-drop workflow canvas for connecting multiple agents, trigger events, and conditional logic branches.",
    keyCapabilities: [
      "Interactive node graph with zoom, pan, and real-time validation",
      "Multi-agent handoffs: Ingest -> Reason -> Validate -> Dispatch",
      "One-click pipeline execution with live node highlight telemetry"
    ],
    proTip: "Add a Validation or Human-in-the-Loop review node prior to high-stakes database or external API operations."
  },
  {
    id: "automations",
    title: "Approved Automations Vault",
    category: "enterprise",
    badge: "Certified Hub",
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    icon: BookmarkCheck,
    summary: "Repository of pre-certified, security-cleared automation workflows ready for immediate one-click enterprise deployment.",
    keyCapabilities: [
      "Compliance certifications (SOC-2 Type II, ISO 27001, HIPAA ready)",
      "Calculated time and monetary savings per automation cycle",
      "One-click clone and customize into Workflow Studio"
    ],
    proTip: "Browse the vault before building from scratch—many common enterprise workflows are already pre-certified."
  },
  {
    id: "assets",
    title: "Enterprise Asset Gallery",
    category: "tools",
    badge: "Asset Store",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: Layers,
    summary: "Centralized repository for corporate logos, brand guidelines, UI mockups, and AI-generated creative assets.",
    keyCapabilities: [
      "Directory-based folder organization with live previews",
      "Drag-and-drop asset ingestion and metadata tagging",
      "Instant copy of asset URI into agent prompts or workflow nodes"
    ],
    proTip: "Store your brand style guidelines here; agents can reference asset directories during content generation."
  },
  {
    id: "emails",
    title: "Email Automation Center",
    category: "tools",
    badge: "AI Triage",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: Mail,
    summary: "Autonomous inbox triage engine that parses customer intent, classifies urgency, and dispatches verified receipts.",
    keyCapabilities: [
      "Intent classification (Onboarding, Support, Billing, Escalation)",
      "Automated welcome tour dispatch and cryptographic action receipts",
      "Human oversight gate for low-confidence or high-value customer queries"
    ],
    proTip: "Click 'Run AI Triage' on any incoming email to see how Gemini auto-formulates a context-aware response."
  },
  {
    id: "dispatcher",
    title: "Task Dispatcher & Execution Engine",
    category: "core",
    badge: "Live Queue",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: PlayCircle,
    summary: "Autonomous work queue for triggering, supervising, and troubleshooting individual and batch agent task executions.",
    keyCapabilities: [
      "Interactive task trigger with custom payload parameters",
      "Live execution feed with status badges (Running, Completed, HITL Review, Error)",
      "Integrated Task Troubleshooter with Gemini root-cause diagnosis"
    ],
    proTip: "If a task pauses for Human-in-the-Loop review, inspect the output parameters and approve or retry with feedback."
  },
  {
    id: "gamification",
    title: "Gamification & Achievement Quests",
    category: "enterprise",
    badge: "Operator Quests",
    badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    icon: Trophy,
    summary: "Operator engagement layer rewarding autonomous run velocity, daily operational streaks, and milestone achievements.",
    keyCapabilities: [
      "XP progression and Operator Level tier unlocks",
      "Daily and weekly quest challenges with claimable token bounties",
      "Specialty badges (Master Orchestrator, Zero Failure Run, SRE Sentinel)"
    ],
    proTip: "Claim completed quests daily to boost your operator standing on the company-wide leaderboard."
  },
  {
    id: "leaderboard",
    title: "Agent & Employee Leaderboard",
    category: "enterprise",
    badge: "Performance",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    icon: Users2,
    summary: "Competitive benchmarking board ranking operator efficiency, labor hours saved, and department autonomous velocity.",
    keyCapabilities: [
      "Department velocity comparisons (Engineering vs DevOps vs Support)",
      "Individual operator rankings by total OpEx savings generated",
      "Peer recognition and autonomous productivity medals"
    ],
    proTip: "Check which department has the highest autonomy ratio to identify where autonomous workflows can be expanded."
  },
  {
    id: "permissions",
    title: "Security & Permissions Matrix",
    category: "enterprise",
    badge: "RBAC & Security",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: ShieldCheck,
    summary: "Enterprise Role-Based Access Control (RBAC) matrix governing agent API scopes, credential visibility, and compliance logs.",
    keyCapabilities: [
      "Scope-level permission toggles (Read, Write, Execute, Deploy, Admin)",
      "Real-time API audit trail with cryptographic timestamps",
      "Credential masking and data loss prevention (DLP) filters"
    ],
    proTip: "Restrict write access on external database connectors to Supervised or HITL-required agents only."
  },
  {
    id: "legal",
    title: "Legal & Governance Center",
    category: "enterprise",
    badge: "Compliance",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: Scale,
    summary: "Centralized legal compliance repository managing AI ethics policies, terms of service, and enterprise data processing agreements.",
    keyCapabilities: [
      "Interactive Terms & Data Protection Agreement (DPA) editor",
      "AI Transparency and Ethical Usage documentation",
      "One-click legal document export for enterprise procurement review"
    ],
    proTip: "Ensure your client terms reflect the specific agent autonomy tiers before inviting third-party operators."
  },
  {
    id: "analytics",
    title: "Executive ROI Analytics & Telemetry",
    category: "core",
    badge: "Financial ROI",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: DollarSign,
    summary: "Real-time labor replacement calculations, predictive financial forecasting, and Gemini AI executive summary reports with PDF exports.",
    keyCapabilities: [
      "Loaded OpEx savings calculations based on verified execution logs",
      "Predictive 6-month scenario model with hiring replacement forecasts",
      "Gemini AI Executive Summary generator with 2-page executive PDF download"
    ],
    proTip: "Click 'Generate Summary' in the header to produce a board-ready report and download it as an executive PDF."
  },
  {
    id: "whitelabel",
    title: "White-Label Studio & Tenant Branding",
    category: "enterprise",
    badge: "Brand Studio",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: Palette,
    summary: "Rebrand the entire workspace with client logos, customized primary colors, custom domains, and custom system prompt prefixes.",
    keyCapabilities: [
      "Live preview with one-click corporate presets (Guilford, CyberSec, HealthFirst)",
      "Custom domain and client portal sub-path routing",
      "Client lock simulation mode to test end-user customer permissions"
    ],
    proTip: "Use 'Simulate Client View' in the master access gate to verify what your client operators will see before handoff."
  },
  {
    id: "monetization",
    title: "Monetization Hub & Tenant Billing",
    category: "enterprise",
    badge: "Billing & MRR",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: CreditCard,
    summary: "Multi-tenant monetization management, recurring SaaS tier billing, per-agent rate cards, and client invoicing.",
    keyCapabilities: [
      "Customizable rate card: platform fees, per-agent compute, and hourly markup",
      "Tenant billing records and monthly invoicing generation",
      "Contracted MRR, ARR, and gross margin tracking"
    ],
    proTip: "Configure margin percentage in the Rate Card to automatically calculate markups on autonomous agent hours."
  }
];

interface QuickStartStep {
  stepNumber: number;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  targetTab: NavTab;
  actionLabel: string;
  secondaryTab?: NavTab;
  secondaryLabel?: string;
  highlights: string[];
}

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    stepNumber: 1,
    title: "Explore Your Autonomous Fleet",
    tagline: "Interact with agents, inspect skills, and review system prompts",
    description: "AgentFlow includes specialized agents across Engineering, DevOps, Support, Sales, and Finance. Start by exploring the fleet roster or chatting directly with Gemini AI.",
    icon: Bot,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    targetTab: "agents",
    actionLabel: "Open Agent Roster",
    secondaryTab: "chat",
    secondaryLabel: "Try Smart Chat",
    highlights: [
      "Use real-time search in Agent Roster to filter by role or skill",
      "Smart Chat supports Gemini 2.5 Flash for rapid multi-turn reasoning",
      "Inspect system prompts and temperature settings per agent"
    ]
  },
  {
    stepNumber: 2,
    title: "Trigger & Orchestrate Workflows",
    tagline: "Run autonomous tasks or build visual node-based pipelines",
    description: "Execute individual tasks in the Dispatcher, or orchestrate multi-agent handoffs on the visual Workflow Canvas. Certified templates are also available in the Automations Vault.",
    icon: WorkflowIcon,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
    targetTab: "dispatcher",
    actionLabel: "Launch Task Dispatcher",
    secondaryTab: "studio",
    secondaryLabel: "Open Workflow Studio",
    highlights: [
      "Trigger tasks and watch live execution status badges (Running, Resolved, HITL)",
      "Workflow Studio provides an interactive drag-and-drop node graph",
      "Access pre-certified SOC-2 & ISO workflows in the Automations Vault"
    ]
  },
  {
    stepNumber: 3,
    title: "Track ROI & Download Executive PDFs",
    tagline: "Quantify labor hours saved, cost avoidance, and generate AI reports",
    description: "Every autonomous task records hours liberated based on loaded employee capacity ($85/hr). Use Gemini to synthesize board-level executive summaries and download polished 2-page PDFs.",
    icon: DollarSign,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    targetTab: "analytics",
    actionLabel: "View ROI Analytics",
    secondaryTab: "dashboard",
    secondaryLabel: "Executive Dashboard",
    highlights: [
      "Real-time calculations of OpEx savings and net value created",
      "Predictive 6-month scenario model for hiring capacity planning",
      "Gemini AI Executive Summary generator with one-click 2-page PDF export"
    ]
  },
  {
    stepNumber: 4,
    title: "Governance, Security & White-Labeling",
    tagline: "Enforce RBAC permissions, monitor health, and customize client branding",
    description: "Manage fine-grained API scopes in the Permissions Matrix, track system reliability in the Health Monitor, and rebrand the entire platform for your enterprise or agency clients.",
    icon: ShieldCheck,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
    targetTab: "permissions",
    actionLabel: "Security Matrix",
    secondaryTab: "whitelabel",
    secondaryLabel: "White-Label Studio",
    highlights: [
      "Granular RBAC scopes with automated credential masking and audit logs",
      "Health Monitor features live circuit breaker protection against API failures",
      "White-Label Studio allows custom logos, primary brand themes, and subdomains"
    ]
  }
];

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  tab: NavTab;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "check-chat",
    label: "Test Gemini AI in Smart Chat",
    description: "Send a prompt or ask for an architectural plan in Smart Chat.",
    tab: "chat"
  },
  {
    id: "check-filter",
    label: "Filter Agents in Agent Roster",
    description: "Use the live search bar to filter agents by name or department.",
    tab: "agents"
  },
  {
    id: "check-dispatch",
    label: "Run a Task in Task Dispatcher",
    description: "Trigger a task execution and monitor real-time telemetry.",
    tab: "dispatcher"
  },
  {
    id: "check-summary",
    label: "Generate an Executive ROI Summary",
    description: "Click 'Generate Summary' in ROI Analytics and download the PDF report.",
    tab: "analytics"
  },
  {
    id: "check-theme",
    label: "Customize Your Digital Workspace",
    description: "Select an ergonomic workplace theme or start ambient audio.",
    tab: "workplaces"
  },
  {
    id: "check-security",
    label: "Review Security & Permissions Matrix",
    description: "Inspect role-based scopes, API logs, and access permissions.",
    tab: "permissions"
  }
];

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  currentTab
}) => {
  const [activeTab, setActiveTab] = useState<"quickstart" | "catalog" | "checklist" | "shortcuts">("quickstart");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "tools" | "enterprise">("all");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  
  // Stored checklist progress in local state
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("agentflow_tutorial_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleChecklistItem = (id: string) => {
    setCompletedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("agentflow_tutorial_checklist", JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save checklist state:", err);
      }
      return next;
    });
  };

  const completedCount = useMemo(() => {
    return Object.values(completedItems).filter(Boolean).length;
  }, [completedItems]);

  const completionPercentage = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  // Filtered features catalog
  const filteredFeatures = useMemo(() => {
    return FEATURE_CATALOG.filter(item => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = 
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.keyCapabilities.some(c => c.toLowerCase().includes(query)) ||
        item.proTip.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const currentStep = QUICK_START_STEPS[currentStepIndex];

  const handleLaunch = (tab: NavTab) => {
    onNavigateToTab(tab);
    onClose();
  };

  return (
    <div 
      id="modal-quick-start-tutorial"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-start-title"
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="quick-start-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  AgentFlow Quick Start & Feature Guide
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Interactive Tour • 18 Workspaces</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Master autonomous multi-agent pipelines, live telemetry tracking, and executive board-ready ROI reports.
              </p>
            </div>
          </div>

          <button
            id="btn-close-quick-start"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* NAVIGATION TABS                                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-quick-start-steps"
              type="button"
              onClick={() => setActiveTab("quickstart")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "quickstart"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ 4-Step Quick Start</span>
            </button>

            <button
              id="tab-quick-start-catalog"
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>🧭 All 18 Features & Workspaces</span>
            </button>

            <button
              id="tab-quick-start-checklist"
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "checklist"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>🎯 Getting Started Checklist</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {completedCount}/{CHECKLIST_ITEMS.length}
              </span>
            </button>

            <button
              id="tab-quick-start-shortcuts"
              type="button"
              onClick={() => setActiveTab("shortcuts")}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "shortcuts"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>💡 Best Practices & Shortcuts</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY CONTENT                                                       */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: 4-STEP QUICK START ONBOARDING */}
          {activeTab === "quickstart" && (
            <div className="space-y-6">
              {/* Stepper Navigation Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {QUICK_START_STEPS.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <button
                      key={step.stepNumber}
                      type="button"
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isActive
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs"
                          : isPast
                          ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive 
                          ? "bg-blue-600 text-white font-bold text-xs" 
                          : isPast 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold"
                      }`}>
                        {isPast ? <Check className="w-3.5 h-3.5" /> : step.stepNumber}
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <div className="text-[11px] font-bold leading-tight truncate">
                          Step {step.stepNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {step.title.split(" ")[0]} {step.title.split(" ")[1] || ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Feature Showcase Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${currentStep.iconBg}`}>
                      <currentStep.icon className={`w-6 h-6 ${currentStep.iconColor}`} />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Step {currentStep.stepNumber} of {QUICK_START_STEPS.length}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                        {currentStep.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                        {currentStep.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Direct Jump Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      id={`btn-step-${currentStep.stepNumber}-primary`}
                      type="button"
                      onClick={() => handleLaunch(currentStep.targetTab)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <span>{currentStep.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {currentStep.secondaryTab && currentStep.secondaryLabel && (
                      <button
                        id={`btn-step-${currentStep.stepNumber}-secondary`}
                        type="button"
                        onClick={() => handleLaunch(currentStep.secondaryTab!)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <span>{currentStep.secondaryLabel}</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {currentStep.description}
                </p>

                {/* Highlights Bullet Cards */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Key Highlights & Pro Recommendations:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentStep.highlights.map((hl, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Highlight #{idx + 1}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                          {hl}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom step navigation arrows */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous Step
                  </button>

                  <div className="text-xs font-semibold text-slate-400">
                    Step {currentStepIndex + 1} of {QUICK_START_STEPS.length}
                  </div>

                  {currentStepIndex < QUICK_START_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStepIndex(prev => Math.min(QUICK_START_STEPS.length - 1, prev + 1))}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("checklist")}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Checklist</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL 18 FEATURES & WORKSPACES CATALOG */}
          {activeTab === "catalog" && (
            <div className="space-y-5">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-guide-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 18 workspaces (e.g. ROI, PDF, Chat, Canvas)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: `All Workspaces (${FEATURE_CATALOG.length})` },
                    { id: "core", label: "Core Fleet" },
                    { id: "tools", label: "Tools & Focus" },
                    { id: "enterprise", label: "Enterprise & Governance" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        categoryFilter === cat.id
                          ? "bg-blue-600 text-white font-bold shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Workspaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFeatures.map(item => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.id}
                      className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {item.title}
                              </h4>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Key Capabilities:
                          </div>
                          <ul className="space-y-0.5">
                            {item.keyCapabilities.slice(0, 2).map((cap, i) => (
                              <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
                                <span className="text-blue-500 leading-none mt-0.5">•</span>
                                <span className="truncate">{cap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-amber-600 dark:text-amber-400">Pro Tip: </span>
                          <span>{item.proTip}</span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          Tab: /{item.id}
                        </span>
                        <button
                          id={`btn-jump-to-${item.id}`}
                          type="button"
                          onClick={() => handleLaunch(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredFeatures.length === 0 && (
                <div className="py-16 text-center space-y-2">
                  <Search className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No features matched "{searchQuery}"
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Clear filters to view all 18 workspaces
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPERATOR ONBOARDING CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="space-y-6">
              {/* Progress Bar Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Operator Orientation Checklist
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Complete core operational tasks to master the multi-agent workspace.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {completionPercentage}%
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {completedCount} of {CHECKLIST_ITEMS.length} Completed
                    </div>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2.5">
                {CHECKLIST_ITEMS.map((item, index) => {
                  const isChecked = !!completedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isChecked
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                            isChecked
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "border border-slate-300 dark:border-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${
                            isChecked ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"
                          }`}>
                            {index + 1}. {item.label}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunch(item.tab)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Jump to Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BEST PRACTICES & SHORTCUTS */}
          {activeTab === "shortcuts" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial ROI Model card */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>How ROI & Value Realization Works</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Labor value saved is calculated against a fully loaded enterprise rate of <strong>$85.00/hour</strong> (incorporating base compensation, healthcare, tax, and desk equipment overhead). AI token consumption is deducted at approximately $1.15 per saved hour to determine net financial avoidance.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    Net Savings = (Hours Saved × $85) - AI Compute Cost
                  </div>
                </div>

                {/* Gemini AI Executive Summaries & PDF */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <FileDown className="w-4 h-4" />
                    <span>AI Executive Summaries & PDF Exports</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Google Gemini analyzes all recent task execution logs, pass/fail ratios, and departmental velocities to formulate an Executive Impact Briefing. You can download this directly as a 2-page, board-ready PDF complete with governance attestations and strategic recommendations.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300">
                    Available in <strong>ROI Analytics</strong> via the "Generate Summary" button and "Download PDF".
                  </div>
                </div>

                {/* Circuit Breaker Health Safeguards */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Circuit Breakers & Fault Tolerance</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Autonomous agents monitor consecutive execution failures. If an external API or database connector fails 3 times sequentially, the agent's circuit breaker automatically trips to <strong>OPEN</strong> status, preventing downstream retry storms and API quota burn.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300">
                    Reset and test circuit breakers anytime in the <strong>Agent Health Monitor</strong>.
                  </div>
                </div>

                {/* Keyboard Shortcuts & Quick Navigation */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                    <Keyboard className="w-4 h-4" />
                    <span>Quick Navigation & Key Shortcuts</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Close Active Dialog or Modal</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-mono">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Search & Filter Agent Roster</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-mono">Ctrl + F</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>Quick Task Focus HUD</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px] font-mono">Header HUD</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous Multi-Agent Enterprise v3.7 • Active Session</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-quick-start-footer"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
