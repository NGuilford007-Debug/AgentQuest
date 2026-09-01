import React, { useState, useEffect, useRef } from "react";
import { 
  Agent, 
  AgentTemplate,
  EmployeeProfile, 
  LeaderboardUser, 
  TaskExecutionRecord, 
  Workflow, 
  ActiveTaskSession, 
  SaveStateSnapshot,
  WorkplaceStage,
  AiModel,
  ConnectedApp,
  PermissionScope,
  ApiAuditLog,
  AssetItem,
  WhiteLabelConfig,
  TenantProfile,
  DeveloperCompanyProfile,
  RateCardConfig,
  TenantBillingRecord,
  FinancialMetricSnapshot,
  ApprovedAutomation,
  GeneratedReportDocument,
  ClientAgentRequest,
  AgentPrivacyPolicyConfig,
  LegalDocumentItem
} from "./types";
import { 
  INITIAL_AGENTS, 
  INITIAL_USER_PROFILE, 
  CLEAN_SLATE_USER_PROFILE, 
  INITIAL_WORKFLOWS, 
  LEADERBOARD_USERS,
  INITIAL_MODELS,
  AVAILABLE_PERMISSIONS,
  INITIAL_CONNECTED_APPS,
  INITIAL_API_AUDIT_LOGS,
  INITIAL_APPROVED_AUTOMATIONS,
  INITIAL_CLIENT_AGENT_REQUESTS,
  DEFAULT_AGENT_PRIVACY_POLICY
} from "./data/initialData";
import { INITIAL_LEGAL_DOCUMENTS } from "./data/initialLegalDocs";
import { INITIAL_GENERATED_REPORTS } from "./data/initialReports";
import { INITIAL_WORKPLACE_STAGES } from "./data/workplaceStages";
import { INITIAL_ASSET_ITEMS, INITIAL_ASSET_DIRECTORIES } from "./data/initialAssets";
import { DEFAULT_WHITELABEL_CONFIG, WHITELABEL_PRESETS } from "./data/whiteLabelPresets";
import { 
  DEFAULT_DEVELOPER_PROFILE, 
  DEFAULT_RATE_CARD, 
  INITIAL_TENANT_BILLING_RECORDS, 
  HISTORICAL_FINANCIAL_SNAPSHOTS 
} from "./data/initialMonetization";
import { Header } from "./components/Header";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { AgentRoster } from "./components/AgentRoster";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import { AssetGallery } from "./components/AssetGallery";
import { TaskDispatcher } from "./components/TaskDispatcher";
import { GamificationDashboard } from "./components/GamificationDashboard";
import { Leaderboard } from "./components/Leaderboard";
import { PermissionsMatrix } from "./components/PermissionsMatrix";
import { ROIAnalytics } from "./components/ROIAnalytics";
import { WhiteLabelStudio } from "./components/WhiteLabelStudio";
import { MonetizationHub } from "./components/MonetizationHub";
import { ApprovedAutomationsVault } from "./components/ApprovedAutomationsVault";
import { AgentBuilderModal } from "./components/AgentBuilderModal";
import { ModelManagerModal } from "./components/ModelManagerModal";
import { SaveStateManager } from "./components/SaveStateManager";
import { TaskFocusHUD } from "./components/TaskFocusHUD";
import { DigitalWorkspaces } from "./components/DigitalWorkspaces";
import { ExportModal } from "./components/ExportModal";
import { AgentHealthMonitor } from "./components/AgentHealthMonitor";
import { AgentTemplateModal } from "./components/AgentTemplateModal";
import { MasterAccessGateModal } from "./components/MasterAccessGateModal";
import { QuickTaskModal } from "./components/QuickTaskModal";
import { ProfileModal } from "./components/ProfileModal";
import { PricingCheckoutModal } from "./components/PricingCheckoutModal";
import { AuthModal } from "./components/AuthModal";
import { SmartChat } from "./components/SmartChat";
import { ImageStudio } from "./components/ImageStudio";
import { LegalGovernanceCenter } from "./components/LegalGovernanceCenter";
import { TermsAgreementGateModal } from "./components/TermsAgreementGateModal";
import { MasterAccessSettings } from "./types";
import { initRevenueCat, checkHasEntitlement } from "./services/revenuecat";
import { fireCelebration, fireLevelUp } from "./utils/confetti";
import { getStoredItem, setStoredItem, removeStoredItem } from "./utils/storage";

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false);

  // Master Developer vs Client Access Gate State (Direct account authentication, no PIN)
  const [masterAccess, setMasterAccess] = useState<MasterAccessSettings>({
    currentAccessLevel: "master_developer",
    founderEmail: "toppgunn321@gmail.com",
    developerCompanyName: "Guilford Industries",
    isSimulatingClientView: false,
    clientLockEnforced: false,
    detectedEnvironment: "standalone_web_app",
  });
  const [isAccessGateOpen, setIsAccessGateOpen] = useState<boolean>(false);

  const isMasterDeveloper = masterAccess?.currentAccessLevel === "master_developer";

  // Initial local state with static defaults (pure SSR-safe initializers)
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSET_ITEMS);
  const [userProfile, setUserProfile] = useState<EmployeeProfile>(INITIAL_USER_PROFILE);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(LEADERBOARD_USERS);
  const [executionHistory, setExecutionHistory] = useState<TaskExecutionRecord[]>([]);
  const [activeTaskSession, setActiveTaskSession] = useState<ActiveTaskSession | null>(null);
  const [workplaceStages, setWorkplaceStages] = useState<WorkplaceStage[]>(INITIAL_WORKPLACE_STAGES);
  const [models, setModels] = useState<AiModel[]>(INITIAL_MODELS);
  const [permissions, setPermissions] = useState<PermissionScope[]>(AVAILABLE_PERMISSIONS);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(INITIAL_CONNECTED_APPS);
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>(INITIAL_API_AUDIT_LOGS);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(DEFAULT_WHITELABEL_CONFIG);
  const [tenants, setTenants] = useState<TenantProfile[]>(WHITELABEL_PRESETS);
  const [developerProfile, setDeveloperProfile] = useState<DeveloperCompanyProfile>(DEFAULT_DEVELOPER_PROFILE);
  const [rateCard, setRateCard] = useState<RateCardConfig>(DEFAULT_RATE_CARD);
  const [tenantsBilling, setTenantsBilling] = useState<TenantBillingRecord[]>(INITIAL_TENANT_BILLING_RECORDS);
  const [financialHistory, setFinancialHistory] = useState<FinancialMetricSnapshot[]>(HISTORICAL_FINANCIAL_SNAPSHOTS);
  const [approvedAutomations, setApprovedAutomations] = useState<ApprovedAutomation[]>(INITIAL_APPROVED_AUTOMATIONS);
  const [savedReports, setSavedReports] = useState<GeneratedReportDocument[]>(INITIAL_GENERATED_REPORTS);
  const [clientAgentRequests, setClientAgentRequests] = useState<ClientAgentRequest[]>(INITIAL_CLIENT_AGENT_REQUESTS);
  const [agentPrivacyPolicy, setAgentPrivacyPolicy] = useState<AgentPrivacyPolicyConfig>(DEFAULT_AGENT_PRIVACY_POLICY);
  const [legalDocs, setLegalDocs] = useState<LegalDocumentItem[]>(INITIAL_LEGAL_DOCUMENTS);

  // Hydrate persisted state from localStorage on client mount (SSR-safe hydration)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedMasterAccess = getStoredItem<MasterAccessSettings | null>("agentflow_master_access", null);
      if (storedMasterAccess) {
        setMasterAccess({
          ...storedMasterAccess,
          founderEmail: storedMasterAccess.founderEmail || "toppgunn321@gmail.com",
          developerCompanyName: storedMasterAccess.developerCompanyName || "Guilford Industries",
          currentAccessLevel: storedMasterAccess.currentAccessLevel || "master_developer",
        });
      }

      const storedAgents = getStoredItem<Agent[] | null>("agentflow_agents", null);
      if (storedAgents) setAgents(storedAgents);

      const storedWorkflows = getStoredItem<Workflow[] | null>("agentflow_workflows", null);
      if (storedWorkflows) setWorkflows(storedWorkflows);

      const storedAssets = getStoredItem<AssetItem[] | null>("agentflow_assets", null);
      if (storedAssets) setAssets(storedAssets);

      const storedProfile = getStoredItem<EmployeeProfile | null>("agentflow_profile", null);
      if (storedProfile) setUserProfile(storedProfile);

      const storedLeaderboard = getStoredItem<LeaderboardUser[] | null>("agentflow_leaderboard", null);
      if (storedLeaderboard) setLeaderboardUsers(storedLeaderboard);

      const storedExecutions = getStoredItem<TaskExecutionRecord[] | null>("agentflow_executions", null);
      if (storedExecutions) setExecutionHistory(storedExecutions);

      const storedActiveTask = getStoredItem<ActiveTaskSession | null>("agentflow_active_task", null);
      if (storedActiveTask) setActiveTaskSession(storedActiveTask);

      const storedStages = getStoredItem<WorkplaceStage[] | null>("agentflow_workplace_stages", null);
      if (storedStages) setWorkplaceStages(storedStages);

      const storedModels = getStoredItem<AiModel[] | null>("agentflow_models", null);
      if (storedModels) setModels(storedModels);

      const storedPermissions = getStoredItem<PermissionScope[] | null>("agentflow_permissions", null);
      if (storedPermissions) setPermissions(storedPermissions);

      const storedApps = getStoredItem<ConnectedApp[] | null>("agentflow_connected_apps", null);
      if (storedApps) setConnectedApps(storedApps);

      const storedAuditLogs = getStoredItem<ApiAuditLog[] | null>("agentflow_audit_logs", null);
      if (storedAuditLogs) setAuditLogs(storedAuditLogs);

      const storedWhiteLabel = getStoredItem<WhiteLabelConfig | null>("agentflow_whitelabel_config", null);
      if (storedWhiteLabel) setWhiteLabelConfig(storedWhiteLabel);

      const storedTenants = getStoredItem<TenantProfile[] | null>("agentflow_tenants", null);
      if (storedTenants) setTenants(storedTenants);

      const storedDevProfile = getStoredItem<DeveloperCompanyProfile | null>("agentflow_developer_profile", null);
      if (storedDevProfile) setDeveloperProfile(storedDevProfile);

      const storedRateCard = getStoredItem<RateCardConfig | null>("agentflow_rate_card", null);
      if (storedRateCard) setRateCard(storedRateCard);

      const storedTenantsBilling = getStoredItem<TenantBillingRecord[] | null>("agentflow_tenants_billing", null);
      if (storedTenantsBilling) setTenantsBilling(storedTenantsBilling);

      const storedFinancialHistory = getStoredItem<FinancialMetricSnapshot[] | null>("agentflow_financial_history", null);
      if (storedFinancialHistory) setFinancialHistory(storedFinancialHistory);

      const storedApprovedAutomations = getStoredItem<ApprovedAutomation[] | null>("agentflow_approved_automations", null);
      if (storedApprovedAutomations) setApprovedAutomations(storedApprovedAutomations);

      const storedSavedReports = getStoredItem<GeneratedReportDocument[] | null>("agentflow_saved_reports", null);
      if (storedSavedReports) setSavedReports(storedSavedReports);

      const storedClientAgentRequests = getStoredItem<ClientAgentRequest[] | null>("agentflow_client_agent_requests", null);
      if (storedClientAgentRequests) setClientAgentRequests(storedClientAgentRequests);

      const storedAgentPrivacyPolicy = getStoredItem<AgentPrivacyPolicyConfig | null>("agentflow_agent_privacy_policy", null);
      if (storedAgentPrivacyPolicy) setAgentPrivacyPolicy(storedAgentPrivacyPolicy);

      const storedLegalDocs = getStoredItem<LegalDocumentItem[] | null>("agentflow_legal_docs", null);
      if (storedLegalDocs) setLegalDocs(storedLegalDocs);

      // Initialize RevenueCat Purchases SDK with API Key test_aLsBHkgmNobJrZHUXrAefSAQdHc
      try {
        const userEmail = storedProfile?.email || "toppgunn321@gmail.com";
        initRevenueCat(userEmail);
        // Check if user has active RevenueCat entitlement ("SyncSchedule Pro")
        checkHasEntitlement("SyncSchedule Pro").then((hasPro) => {
          if (hasPro) {
            console.log("[RevenueCat] Active 'SyncSchedule Pro' entitlement detected! Granting Pro access.");
            setUserProfile((prev) => {
              const updated: EmployeeProfile = {
                ...prev,
                subscriptionPlan: prev.subscriptionPlan === "enterprise" ? "enterprise" : "pro",
              };
              setStoredItem("agentflow_profile", updated);
              return updated;
            });
          }
        });
      } catch (rcError) {
        console.warn("[RevenueCat] Initialization check skipped:", rcError);
      }
    } catch (error) {
      console.warn("[App] Hydration error from localStorage:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("agentflow_terms_accepted_session") === "true";
    } catch {
      return false;
    }
  });
  const [currentTab, setCurrentTab] = useState<NavTab>("chat");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(
    workflows[0]?.id || "wf-1"
  );
  const [isAgentBuilderOpen, setIsAgentBuilderOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [modelManagerTargetAgentId, setModelManagerTargetAgentId] = useState<string | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSaveStateModalOpen, setIsSaveStateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskAgentId, setQuickTaskAgentId] = useState<string | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPlanForPricing, setSelectedPlanForPricing] = useState<string | undefined>("free");
  const [showFocusHUD, setShowFocusHUD] = useState<boolean>(() => {
    return getStoredItem<boolean>("agentflow_show_focus_hud", false);
  });

  // Auto-save feedback indicators with useRef timer cleanup
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const triggerAutoSaveIndicator = () => {
    setIsAutoSaving(true);
    if (autoSaveTimeoutRef.current !== null) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      setIsAutoSaving(false);
      const d = new Date();
      setLastSavedTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      autoSaveTimeoutRef.current = null;
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current !== null) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_master_access", masterAccess);
  }, [masterAccess, isHydrated]);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_agents", agents);
    triggerAutoSaveIndicator();
  }, [agents, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_workflows", workflows);
    triggerAutoSaveIndicator();
  }, [workflows, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_assets", assets);
    triggerAutoSaveIndicator();
  }, [assets, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_profile", userProfile);
    triggerAutoSaveIndicator();
  }, [userProfile, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_leaderboard", leaderboardUsers);
  }, [leaderboardUsers, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_executions", executionHistory);
    triggerAutoSaveIndicator();
  }, [executionHistory, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (activeTaskSession) {
      setStoredItem("agentflow_active_task", activeTaskSession);
    } else {
      removeStoredItem("agentflow_active_task");
    }
  }, [activeTaskSession, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_workplace_stages", workplaceStages);
    triggerAutoSaveIndicator();
  }, [workplaceStages, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_models", models);
    triggerAutoSaveIndicator();
  }, [models, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_permissions", permissions);
    triggerAutoSaveIndicator();
  }, [permissions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_connected_apps", connectedApps);
    triggerAutoSaveIndicator();
  }, [connectedApps, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_audit_logs", auditLogs);
    triggerAutoSaveIndicator();
  }, [auditLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_whitelabel_config", whiteLabelConfig);
    triggerAutoSaveIndicator();
    // Dynamically update document title if document is present
    if (typeof document !== "undefined") {
      document.title = `${whiteLabelConfig.brandName} - ${whiteLabelConfig.tagline}`;
    }
  }, [whiteLabelConfig, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_tenants", tenants);
    triggerAutoSaveIndicator();
  }, [tenants, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_developer_profile", developerProfile);
    triggerAutoSaveIndicator();
  }, [developerProfile, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_rate_card", rateCard);
    triggerAutoSaveIndicator();
  }, [rateCard, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_tenants_billing", tenantsBilling);
    triggerAutoSaveIndicator();
  }, [tenantsBilling, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_financial_history", financialHistory);
    triggerAutoSaveIndicator();
  }, [financialHistory, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_approved_automations", approvedAutomations);
    triggerAutoSaveIndicator();
  }, [approvedAutomations, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_saved_reports", savedReports);
    triggerAutoSaveIndicator();
  }, [savedReports, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_client_agent_requests", clientAgentRequests);
    triggerAutoSaveIndicator();
  }, [clientAgentRequests, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem("agentflow_agent_privacy_policy", agentPrivacyPolicy);
    triggerAutoSaveIndicator();
  }, [agentPrivacyPolicy, isHydrated]);

  // Keyboard shortcut Ctrl+S / Cmd+S to open save state manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setIsSaveStateModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  // Calculate pending reviews and claimable quests count for badges
  const pendingReviewsCount = executionHistory.filter((e) => e.status === "needs_review").length;
  const claimableQuestsCount = userProfile.quests.filter((q) => q.completed && !q.claimed).length;

  // Level progression helper
  const addXpAndCheckLevel = (amount: number, hours: number = 0) => {
    setUserProfile((prev) => {
      const newXp = prev.xp + amount;
      const newHours = parseFloat((prev.hoursSavedTotal + hours).toFixed(1));
      let currentLevel = prev.level;
      let nextLevelXp = prev.nextLevelXp;

      // Check if leveled up (every ~5,500 XP)
      let leveledUp = false;
      while (newXp >= nextLevelXp) {
        currentLevel += 1;
        nextLevelXp += 5500;
        leveledUp = true;
      }

      if (leveledUp) {
        fireLevelUp();
      }

      const updatedProfile = {
        ...prev,
        xp: newXp,
        level: currentLevel,
        nextLevelXp,
        hoursSavedTotal: newHours,
        tasksAutomatedTotal: prev.tasksAutomatedTotal + (hours > 0 ? 1 : 0),
        costSavedUsd: Math.round(newHours * 85),
      };

      // Also update current user in leaderboard
      setLeaderboardUsers((lbUsers) =>
        lbUsers.map((u) =>
          u.isCurrentUser
            ? {
                ...u,
                xp: newXp,
                level: currentLevel,
                hoursSaved: newHours,
                automationsRun: updatedProfile.tasksAutomatedTotal,
              }
            : u
        )
      );

      return updatedProfile;
    });
  };

  // Agent Creation / Editing
  const handleSaveAgent = (agent: Agent) => {
    const exists = agents.some((a) => a.id === agent.id);
    if (exists) {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));
    } else {
      setAgents((prev) => [agent, ...prev]);
      // Create a default workflow for this new agent
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        agentId: agent.id,
        name: `${agent.name} Pipeline`,
        description: `Automated enterprise pipeline for ${agent.role}`,
        department: agent.department,
        isActive: true,
        totalRuns: 0,
        avgHoursSavedPerRun: 0.5,
        nodes: [
          {
            id: `n-init-1`,
            type: "trigger",
            name: "Event Webhook / API",
            description: `Trigger on ${agent.department} event`,
            iconName: "Zap",
            position: { x: 80, y: 160 },
            config: { triggerType: "Webhook" },
          },
          {
            id: `n-init-2`,
            type: "ai_process",
            name: "Gemini Intelligence Core",
            description: agent.description,
            iconName: "Sparkles",
            position: { x: 340, y: 160 },
            config: { promptTemplate: agent.systemPrompt },
          },
          {
            id: `n-init-3`,
            type: agent.autonomyLevel === "hitl" ? "human_review" : "action_output",
            name: agent.autonomyLevel === "hitl" ? "Human Review Gate" : "Slack Notification",
            description: "Dispatches output to enterprise channels",
            iconName: agent.autonomyLevel === "hitl" ? "UserCheck" : "MessageSquare",
            position: { x: 600, y: 160 },
            config: {},
          },
        ],
        connections: [
          { id: `c-init-1`, from: "n-init-1", to: "n-init-2" },
          { id: `c-init-2`, from: "n-init-2", to: "n-init-3" },
        ],
      };
      setWorkflows((prev) => [...prev, newWorkflow]);

      // Award XP for deploying new agent
      addXpAndCheckLevel(600);
      fireCelebration();
    }
  };

  const handleInstantiateTemplate = (template: AgentTemplate) => {
    const newAgent: Agent = {
      id: `agent-tmpl-${Date.now()}`,
      name: template.name,
      role: template.role,
      avatar: template.avatar,
      department: template.department,
      description: template.description,
      model: template.model,
      temperature: template.temperature,
      autonomyLevel: template.autonomyLevel,
      assignedTo: {
        userId: userProfile.id,
        userName: userProfile.name,
        team: userProfile.department,
      },
      permissions: template.permissions,
      systemPrompt: template.systemPrompt,
      status: "active",
      stats: {
        tasksCompleted: 0,
        hoursSaved: 0,
        successRate: 100,
        avgLatencySec: 1.2,
        xpGenerated: 0,
      },
      createdAt: new Date().toISOString().split("T")[0],
    };

    setAgents((prev) => [newAgent, ...prev]);

    // Create workflow pipeline for instantiated template
    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      agentId: newAgent.id,
      name: `${template.name} Automation Pipeline`,
      description: `Production workflow generated from ${template.name} template`,
      department: template.department,
      isActive: true,
      totalRuns: 0,
      avgHoursSavedPerRun: template.autonomyLevel === "autonomous" ? 1.0 : 0.6,
      nodes: [
        {
          id: `n-tmpl-1`,
          type: "trigger",
          name: "Enterprise Event Trigger",
          description: `Ingests ${template.department} events & API payloads`,
          iconName: "Zap",
          position: { x: 80, y: 160 },
          config: { triggerType: "Webhook" },
        },
        {
          id: `n-tmpl-2`,
          type: "ai_process",
          name: `${template.model} Neural Engine`,
          description: template.description,
          iconName: "BrainCircuit",
          position: { x: 340, y: 160 },
          config: { promptTemplate: template.systemPrompt },
        },
        {
          id: `n-tmpl-3`,
          type: template.autonomyLevel === "hitl" ? "human_review" : "action_output",
          name: template.autonomyLevel === "hitl" ? "Compliance Review Checkpoint" : "Slack & Enterprise Webhook Dispatch",
          description: "Publishes verified outputs to downstream enterprise channels",
          iconName: template.autonomyLevel === "hitl" ? "ShieldCheck" : "CheckCircle2",
          position: { x: 600, y: 160 },
          config: {},
        },
      ],
      connections: [
        { id: `c-tmpl-1`, from: "n-tmpl-1", to: "n-tmpl-2" },
        { id: `c-tmpl-2`, from: "n-tmpl-2", to: "n-tmpl-3" },
      ],
    };

    setWorkflows((prev) => [...prev, newWorkflow]);
    addXpAndCheckLevel(750, 2.5);
    fireCelebration();
    setIsTemplateModalOpen(false);
  };

  const handleToggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: a.status === "active" ? "idle" : "active" }
          : a
      )
    );
  };

  const handleBatchUpdateAgentStatus = (agentIds: string[], status: "active" | "idle") => {
    setAgents((prev) =>
      prev.map((a) => (agentIds.includes(a.id) ? { ...a, status } : a))
    );
  };

  const handleUpdateAgent = (updated: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const handleBatchDeleteAgents = (agentIds: string[]) => {
    setAgents((prev) => prev.filter((a) => !agentIds.includes(a.id)));
  };

  const handleSaveModel = (model: AiModel) => {
    setModels((prev) => {
      const exists = prev.some((m) => m.id === model.id);
      if (exists) {
        return prev.map((m) => (m.id === model.id ? model : m));
      }
      return [...prev, model];
    });
    addXpAndCheckLevel(150);
  };

  const handleDeleteModel = (modelId: string) => {
    setModels((prev) => prev.filter((m) => m.id !== modelId));
  };

  const handleAssignModelToAgent = (agentId: string, modelId: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, model: modelId } : a))
    );
    addXpAndCheckLevel(100);
  };

  const handleOpenModelManager = (agentId?: string) => {
    setModelManagerTargetAgentId(agentId);
    setIsModelManagerOpen(true);
  };

  const handleOpenWorkflow = (agentId: string) => {
    let matched = workflows.find((w) => w.agentId === agentId);
    if (!matched) {
      matched = workflows[0];
    }
    if (matched) {
      setActiveWorkflowId(matched.id);
    }
    setCurrentTab("studio");
  };

  const handleTaskAgent = (agentId: string) => {
    setQuickTaskAgentId(agentId);
    setIsQuickTaskOpen(true);
  };

  const handleSaveWorkflow = (updated: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  const handleCreateNewWorkflow = () => {
    const newWf: Workflow = {
      id: `wf-${Date.now()}`,
      agentId: agents[0]?.id || "agent-1",
      name: "New Enterprise Automation Pipeline",
      description: "Custom multi-node workflow orchestration",
      department: agents[0]?.department || "Engineering",
      isActive: true,
      totalRuns: 0,
      avgHoursSavedPerRun: 0.5,
      nodes: [
        {
          id: `node-${Date.now()}-1`,
          type: "trigger",
          name: "Webhook Ingest",
          description: "Ingest incident or task JSON payload",
          iconName: "Zap",
          position: { x: 80, y: 160 },
          config: { triggerType: "Webhook" },
        },
        {
          id: `node-${Date.now()}-2`,
          type: "ai_process",
          name: "Gemini Reasoning Core",
          description: "Analyze context and generate structured resolution",
          iconName: "Sparkles",
          position: { x: 340, y: 160 },
          config: {
            promptTemplate: "Analyze the input data and generate actionable remediation recommendations.",
          },
        },
        {
          id: `node-${Date.now()}-3`,
          type: "action_output",
          name: "Slack & Jira Dispatch",
          description: "Send results to war-room channel",
          iconName: "MessageSquare",
          position: { x: 600, y: 160 },
          config: { actionTarget: "Slack #devops-alerts" },
        },
      ],
      connections: [
        { id: `c-1`, from: `node-${Date.now()}-1`, to: `node-${Date.now()}-2` },
        { id: `c-2`, from: `node-${Date.now()}-2`, to: `node-${Date.now()}-3` },
      ],
    };
    setWorkflows((prev) => [newWf, ...prev]);
    setActiveWorkflowId(newWf.id);
    addXpAndCheckLevel(150);
  };

  const handleDuplicateWorkflow = (wf: Workflow) => {
    const duplicated: Workflow = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (Clone)`,
      totalRuns: 0,
    };
    setWorkflows((prev) => [duplicated, ...prev]);
    setActiveWorkflowId(duplicated.id);
  };

  const handleDeleteWorkflow = (wfId: string) => {
    if (workflows.length <= 1) {
      alert("You must keep at least one workflow pipeline.");
      return;
    }
    const remaining = workflows.filter((w) => w.id !== wfId);
    setWorkflows(remaining);
    setActiveWorkflowId(remaining[0].id);
  };

  const handleBatchDeleteWorkflows = (workflowIds: string[]) => {
    const remaining = workflows.filter((w) => !workflowIds.includes(w.id));
    if (remaining.length === 0) {
      const defaultWf: Workflow = {
        id: `wf-${Date.now()}`,
        agentId: agents[0]?.id || "agent-1",
        name: "Primary Enterprise Automation Pipeline",
        description: "Default pipeline orchestration",
        department: "Engineering",
        isActive: true,
        totalRuns: 0,
        avgHoursSavedPerRun: 0.5,
        nodes: [
          {
            id: `node-${Date.now()}-1`,
            type: "trigger",
            name: "Enterprise Event Ingestion",
            description: "Listen for API webhooks and database triggers",
            iconName: "Zap",
            position: { x: 80, y: 160 },
            config: { triggerType: "Webhook" },
          },
          {
            id: `node-${Date.now()}-2`,
            type: "ai_process",
            name: "Gemini Reasoning Core",
            description: "Analyze context and generate structured resolution",
            iconName: "Sparkles",
            position: { x: 340, y: 160 },
            config: {
              promptTemplate: "Analyze the input data and generate actionable remediation recommendations.",
            },
          },
          {
            id: `node-${Date.now()}-3`,
            type: "action_output",
            name: "Enterprise Webhook Dispatch",
            description: "Send results to downstream channels",
            iconName: "CheckCircle2",
            position: { x: 600, y: 160 },
            config: { actionTarget: "Enterprise API" },
          },
        ],
        connections: [
          { id: `c-1`, from: `node-${Date.now()}-1`, to: `node-${Date.now()}-2` },
          { id: `c-2`, from: `node-${Date.now()}-2`, to: `node-${Date.now()}-3` },
        ],
      };
      setWorkflows([defaultWf]);
      setActiveWorkflowId(defaultWf.id);
    } else {
      setWorkflows(remaining);
      if (!remaining.some((w) => w.id === activeWorkflowId)) {
        setActiveWorkflowId(remaining[0].id);
      }
    }
  };

  const handleRunTestWorkflow = (wf: Workflow) => {
    setActiveWorkflowId(wf.id);
    setCurrentTab("dispatcher");
  };

  const handleAddAsset = (newAsset: AssetItem) => {
    setAssets((prev) => [newAsset, ...prev]);
    addXpAndCheckLevel(75);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleUpdateAsset = (updated: AssetItem) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleTaskCompleted = (record: TaskExecutionRecord) => {
    setExecutionHistory((prev) => [record, ...prev]);

    // Update agent stats
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === record.agentId) {
          return {
            ...a,
            stats: {
              ...a.stats,
              tasksCompleted: a.stats.tasksCompleted + 1,
              hoursSaved: parseFloat((a.stats.hoursSaved + record.hoursSaved).toFixed(1)),
              xpGenerated: a.stats.xpGenerated + record.xpEarned,
            },
          };
        }
        return a;
      })
    );

    // Reward employee with XP & Hours
    addXpAndCheckLevel(record.xpEarned, record.hoursSaved);

    // Deduct credits if completed & update Daily Quest progress
    const cost = record.creditsCost ?? 12;
    setUserProfile((prev) => {
      const newCredits = Math.max(0, (prev.creditsBalance ?? 4850) - cost);
      const updatedQuests = prev.quests.map((q) => {
        if (q.id === "q-1" && !q.completed) {
          const next = q.current + 1;
          return { ...q, current: next, completed: next >= q.target };
        }
        if (q.id === "q-4") {
          const nextHours = parseFloat((q.current + record.hoursSaved).toFixed(1));
          return { ...q, current: nextHours, completed: nextHours >= q.target };
        }
        return q;
      });
      return { ...prev, creditsBalance: newCredits, quests: updatedQuests };
    });
  };

  const handleApproveHitl = (taskId: string) => {
    setExecutionHistory((prev) =>
      prev.map((r) => (r.id === taskId ? { ...r, status: "approved" } : r))
    );
    // Extra bonus XP for completing human review gate
    addXpAndCheckLevel(200);

    // Update quest
    setUserProfile((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.id === "q-2") {
          return { ...q, completed: true };
        }
        return q;
      });
      return { ...prev, quests: updatedQuests };
    });
  };

  const handleUpdateExecution = (updatedRecord: TaskExecutionRecord) => {
    setExecutionHistory((prev) => {
      const exists = prev.some((r) => r.id === updatedRecord.id);
      if (exists) {
        return prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
      }
      return [updatedRecord, ...prev];
    });

    if (updatedRecord.status === "resolved" || updatedRecord.status === "approved") {
      addXpAndCheckLevel(150, updatedRecord.hoursSaved || 0);
    }
  };

  const handleClaimQuest = (questId: string) => {
    const quest = userProfile.quests.find((q) => q.id === questId);
    if (!quest || quest.claimed) return;

    setUserProfile((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === questId ? { ...q, claimed: true } : q
      ),
    }));

    addXpAndCheckLevel(quest.xpReward);
  };

  const handleToggleAgentPermission = (agentId: string, permId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const hasPerm = a.permissions.includes(permId);
          return {
            ...a,
            permissions: hasPerm
              ? a.permissions.filter((id) => id !== permId)
              : [...a.permissions, permId],
          };
        }
        return a;
      })
    );
  };

  const handleBatchTogglePermissions = (agentId: string, grantAll: boolean) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            permissions: grantAll ? permissions.map((p) => p.id) : [],
          };
        }
        return a;
      })
    );
  };

  const handleSaveConnectedApp = (app: ConnectedApp, newPerms: PermissionScope[]) => {
    setConnectedApps((prev) => {
      const exists = prev.some((a) => a.id === app.id);
      if (exists) {
        return prev.map((a) => (a.id === app.id ? app : a));
      }
      return [app, ...prev];
    });

    if (newPerms.length > 0) {
      setPermissions((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newPerms.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
    }

    addXpAndCheckLevel(150);
  };

  const handleDeleteConnectedApp = (appId: string) => {
    setConnectedApps((prev) => prev.filter((a) => a.id !== appId));
    setPermissions((prev) => prev.filter((p) => p.appId !== appId));
  };

  // Restore snapshot handler
  const handleRestoreState = (snapshotData: SaveStateSnapshot["data"]) => {
    setAgents(snapshotData.agents);
    setWorkflows(snapshotData.workflows);
    setUserProfile(snapshotData.userProfile);
    setExecutionHistory(snapshotData.executionHistory || []);
    if (snapshotData.activeTaskSession) {
      setActiveTaskSession(snapshotData.activeTaskSession);
    }
    if (snapshotData.workflows.length > 0) {
      setActiveWorkflowId(snapshotData.workflows[0].id);
    }
  };

  // Reset to clean presets handler
  const handleResetToDefaults = () => {
    setAgents(INITIAL_AGENTS);
    setWorkflows(INITIAL_WORKFLOWS);
    setUserProfile(INITIAL_USER_PROFILE);
    setLeaderboardUsers(LEADERBOARD_USERS);
    setExecutionHistory([]);
    setAuditLogs([]);
    setActiveTaskSession(null);
    setActiveWorkflowId(INITIAL_WORKFLOWS[0]?.id || "wf-1");
    removeStoredItem("agentflow_agents");
    removeStoredItem("agentflow_workflows");
    removeStoredItem("agentflow_profile");
    removeStoredItem("agentflow_leaderboard");
    removeStoredItem("agentflow_executions");
    removeStoredItem("agentflow_active_task");
    removeStoredItem("agentflow_audit_logs");
  };

  // Profile Identity & Clean Slate Handlers
  const handleUpdateUserProfile = (updated: Partial<EmployeeProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      setLeaderboardUsers((lbPrev) =>
        lbPrev.map((u) =>
          u.isCurrentUser || u.id === prev.id
            ? {
                ...u,
                name: updated.name ?? u.name,
                role: updated.role ?? u.role,
                department: updated.department ?? u.department,
                avatar: updated.avatar ?? u.avatar,
              }
            : u
        )
      );
      return next;
    });
  };

  const handleResetToCleanSlate = () => {
    setUserProfile(CLEAN_SLATE_USER_PROFILE);
    setExecutionHistory([]);
    setAuditLogs([]);
    setActiveTaskSession(null);
    setLeaderboardUsers(LEADERBOARD_USERS);
    removeStoredItem("agentflow_profile");
    removeStoredItem("agentflow_executions");
    removeStoredItem("agentflow_active_task");
    removeStoredItem("agentflow_audit_logs");
  };

  const handleClearExecutionHistory = () => {
    setExecutionHistory([]);
    removeStoredItem("agentflow_executions");
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    removeStoredItem("agentflow_audit_logs");
  };

  const handleClearTenantsBilling = () => {
    setTenantsBilling([]);
    setFinancialHistory([]);
    removeStoredItem("agentflow_tenants_billing");
    removeStoredItem("agentflow_financial_history");
  };

  const handleClearApprovedAutomations = () => {
    setApprovedAutomations([]);
    removeStoredItem("agentflow_approved_automations");
  };

  const handleClearSavedReports = () => {
    setSavedReports([]);
    removeStoredItem("agentflow_saved_reports");
  };

  const handleClearAllMockData = () => {
    setUserProfile(CLEAN_SLATE_USER_PROFILE);
    setExecutionHistory([]);
    setAuditLogs([]);
    setActiveTaskSession(null);
    setApprovedAutomations([]);
    setSavedReports([]);
    setClientAgentRequests([]);
    setTenantsBilling([]);
    setFinancialHistory([]);
    removeStoredItem("agentflow_profile");
    removeStoredItem("agentflow_executions");
    removeStoredItem("agentflow_active_task");
    removeStoredItem("agentflow_audit_logs");
    removeStoredItem("agentflow_approved_automations");
    removeStoredItem("agentflow_saved_reports");
    removeStoredItem("agentflow_client_agent_requests");
    removeStoredItem("agentflow_tenants_billing");
    removeStoredItem("agentflow_financial_history");
  };

  // Dispatch focus task directly to dispatcher
  const handleDispatchTaskWithAgent = (title: string, desc: string, agentId: string) => {
    setCurrentTab("dispatcher");
  };

  // Approved Automations Vault Handlers
  const handleSaveApprovedAutomation = (automation: ApprovedAutomation) => {
    setApprovedAutomations((prev) => {
      const idx = prev.findIndex((a) => a.id === automation.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = automation;
        return next;
      }
      return [automation, ...prev];
    });
    addXpAndCheckLevel(120, automation.estimatedHoursSaved || 0.8);
    fireCelebration();
  };

  const handleUpdateApprovedAutomation = (updated: ApprovedAutomation) => {
    setApprovedAutomations((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleDeleteApprovedAutomation = (id: string) => {
    setApprovedAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  // Saved Intelligence Reports & Documents Handlers
  const handleSaveReport = (report: GeneratedReportDocument) => {
    setSavedReports((prev) => {
      const idx = prev.findIndex((r) => r.id === report.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = report;
        return next;
      }
      return [report, ...prev];
    });
    addXpAndCheckLevel(200, report.hoursSavedEstimated || 1.5);
    fireCelebration();
  };

  const handleDeleteReport = (reportId: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const handleTogglePinReport = (reportId: string) => {
    setSavedReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, isPinned: !r.isPinned } : r))
    );
  };

  // White-Label Tenant Management Handlers
  const handleUpdateWhiteLabelConfig = (updated: WhiteLabelConfig) => {
    setWhiteLabelConfig(updated);
    addXpAndCheckLevel(100);
  };

  const handleSelectTenantPreset = (tenant: TenantProfile) => {
    setWhiteLabelConfig(tenant.config);
    addXpAndCheckLevel(50);
  };

  const handleCreateTenant = (newTenant: TenantProfile) => {
    setTenants((prev) => [...prev, newTenant]);
    setWhiteLabelConfig(newTenant.config);
    addXpAndCheckLevel(200);
    fireCelebration();
  };

  const handleDeleteTenant = (tenantId: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
  };

  // Monetization Handlers
  const handleUpdateDeveloperProfile = (profile: DeveloperCompanyProfile) => {
    setDeveloperProfile(profile);
    addXpAndCheckLevel(75);
  };

  const handleUpdateRateCard = (updatedRateCard: RateCardConfig) => {
    setRateCard(updatedRateCard);
    addXpAndCheckLevel(100);
  };

  const handleUpdateTenantsBilling = (updatedBilling: TenantBillingRecord[]) => {
    setTenantsBilling(updatedBilling);
    addXpAndCheckLevel(50);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Global Header */}
      <Header
        userProfile={userProfile}
        activeAgentsCount={agents.filter((a) => a.status === "active").length}
        totalWorkflowsCount={workflows.length}
        onCreateAgent={() => {
          setEditingAgent(null);
          setIsAgentBuilderOpen(true);
        }}
        onOpenGamification={() => setCurrentTab("gamification")}
        onQuickTask={() => {
          setQuickTaskAgentId(undefined);
          setIsQuickTaskOpen(true);
        }}
        onOpenSaveStates={() => setIsSaveStateModalOpen(true)}
        onToggleFocusHUD={() => {
          const nextVal = !showFocusHUD;
          setShowFocusHUD(nextVal);
          setStoredItem("agentflow_show_focus_hud", nextVal);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenWhiteLabel={() => setCurrentTab("whitelabel")}
        onOpenMonetization={() => setCurrentTab("monetization")}
        onOpenLegal={() => setCurrentTab("legal")}
        onOpenPricing={() => {
          setSelectedPlanForPricing(userProfile.subscriptionPlan || "free");
          setIsPricingModalOpen(true);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isAutoSaving={isAutoSaving}
        lastSavedTime={lastSavedTime}
        whiteLabelConfig={whiteLabelConfig}
        isMasterDeveloper={isMasterDeveloper}
        accessLevel={masterAccess?.currentAccessLevel}
        onOpenMasterAccessGate={() => setIsAccessGateOpen(true)}
        onToggleClientPreview={() =>
          setWhiteLabelConfig((prev) => ({
            ...prev,
            clientPortalMode: !prev.clientPortalMode,
          }))
        }
      />

      {/* Main View Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (!isMasterDeveloper && (tab === "whitelabel" || tab === "monetization")) {
              setIsAccessGateOpen(true);
              return;
            }
            setCurrentTab(tab);
          }}
          pendingReviewsCount={pendingReviewsCount}
          claimableQuestsCount={claimableQuestsCount}
          unhealthyAgentsCount={agents.filter((a) => (a.stats.successRate ?? 95) < 90).length}
          totalAssetsCount={assets.length}
          automationsCount={approvedAutomations.length}
          savedReportsCount={savedReports.length}
          whiteLabelConfig={whiteLabelConfig}
          isMasterDeveloper={isMasterDeveloper}
          accessLevel={masterAccess?.currentAccessLevel}
          onOpenMasterAccessGate={() => setIsAccessGateOpen(true)}
          onOpenPricing={() => {
            setSelectedPlanForPricing(userProfile.subscriptionPlan || "free");
            setIsPricingModalOpen(true);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          userSubscriptionPlan={userProfile.subscriptionPlan}
        />

        {/* Dynamic Tab Body */}
        {currentTab === "chat" && (
          <SmartChat
            agents={agents}
            workflows={workflows}
            assets={assets}
            executionHistory={executionHistory}
            onTaskCompleted={handleTaskCompleted}
            onSaveApprovedAutomation={handleSaveApprovedAutomation}
            onNavigateToStudio={() => setCurrentTab("studio")}
            onNavigateToImageStudio={() => setCurrentTab("imagestudio")}
          />
        )}

        {currentTab === "imagestudio" && (
          <ImageStudio
            assets={assets}
            onSaveAsset={handleAddAsset}
            onNavigateToDispatcher={(prompt) => {
              setCurrentTab("chat");
            }}
          />
        )}

        {currentTab === "dashboard" && (
          <Dashboard
            agents={agents}
            workflows={workflows}
            userProfile={userProfile}
            executionHistory={executionHistory}
            savedReports={savedReports}
            onSaveReport={handleSaveReport}
            onDeleteReport={handleDeleteReport}
            onTogglePinReport={handleTogglePinReport}
            onNavigateToDispatcher={(agentId) => {
              if (agentId) setQuickTaskAgentId(agentId);
              setCurrentTab("dispatcher");
            }}
            onNavigateToVault={() => setCurrentTab("automations")}
            onNavigateToMonetization={() => setCurrentTab("monetization")}
            onNavigateToRoi={() => setCurrentTab("analytics")}
            onOpenAgentBuilder={() => {
              setEditingAgent(null);
              setIsAgentBuilderOpen(true);
            }}
          />
        )}

        {currentTab === "agents" && (
          <AgentRoster
            agents={agents}
            workflows={workflows}
            models={models}
            onCreateAgent={() => {
              setEditingAgent(null);
              setIsAgentBuilderOpen(true);
            }}
            onEditAgent={(agent) => {
              setEditingAgent(agent);
              setIsAgentBuilderOpen(true);
            }}
            onOpenWorkflow={handleOpenWorkflow}
            onTaskAgent={handleTaskAgent}
            onToggleAgentStatus={handleToggleAgentStatus}
            onDeleteAgent={handleDeleteAgent}
            onBatchUpdateStatus={handleBatchUpdateAgentStatus}
            onBatchDeleteAgents={handleBatchDeleteAgents}
            onOpenHealthMonitor={() => setCurrentTab("health")}
            onOpenModelManager={handleOpenModelManager}
            onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            onInstantiateTemplate={handleInstantiateTemplate}
            isMasterDeveloper={isMasterDeveloper}
            developerCompanyName={developerProfile.companyName}
            onOpenMasterAccessGate={() => setIsAccessGateOpen(true)}
            onOpenProfilePrivacy={() => {
              setStoredItem("agentflow_settings_active_tab", "privacy");
              setIsProfileModalOpen(true);
            }}
            onUpdateAgentVisibility={(agentId, visibility, clientPageAllowed) => {
              setAgents((prev) =>
                prev.map((a) =>
                  a.id === agentId ? { ...a, visibility, clientPageAllowed } : a
                )
              );
            }}
            onRequestClientAccess={(agent) => {
              const newReq: ClientAgentRequest = {
                id: `req-${Date.now()}`,
                agentId: agent.id,
                agentName: agent.name,
                agentAvatar: agent.avatar,
                department: agent.department,
                tenantId: (whiteLabelConfig.companyName || "client-tenant").toLowerCase().replace(/\s+/g, '-'),
                tenantName: whiteLabelConfig.companyName || "Client Tenant Organization",
                requestedByEmail: "client-lead@tenant.io",
                requesterName: "Client Operations Lead",
                requestedAt: new Date().toISOString(),
                status: "pending",
                clientNotes: `Requesting to activate ${agent.name} on our client dashboard portal.`,
                intendedClientPage: "Client Portal & Workflow Operations"
              };
              setClientAgentRequests((prev) => [newReq, ...prev]);
            }}
          />
        )}

        {currentTab === "health" && (
          <AgentHealthMonitor
            agents={agents}
            models={models}
            onUpdateAgent={handleUpdateAgent}
            onRewardXP={(amount, hours) => {
              addXpAndCheckLevel(amount, hours || 0);
            }}
            onOpenWorkflow={handleOpenWorkflow}
            onTaskAgent={handleTaskAgent}
          />
        )}

        {currentTab === "workplaces" && (
          <DigitalWorkspaces
            stages={workplaceStages}
            agents={agents}
            onUpdateStages={(updated) => setWorkplaceStages(updated)}
            onDispatchWithAgent={(agentId) => {
              setCurrentTab("dispatcher");
            }}
            onRewardXP={(amount, hours) => {
              addXpAndCheckLevel(amount, hours || 0);
            }}
          />
        )}

        {currentTab === "studio" && activeWorkflow && (
          <WorkflowCanvas
            workflow={activeWorkflow}
            workflows={workflows}
            agents={agents}
            assets={assets}
            onSaveWorkflow={handleSaveWorkflow}
            onSelectWorkflow={(id) => setActiveWorkflowId(id)}
            onCreateNewWorkflow={handleCreateNewWorkflow}
            onDuplicateWorkflow={handleDuplicateWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
            onBatchDeleteWorkflows={handleBatchDeleteWorkflows}
            onRunTestWorkflow={handleRunTestWorkflow}
            onRewardNodeAdded={() => addXpAndCheckLevel(50)}
            isMasterDeveloper={isMasterDeveloper}
            developerCompanyName={developerProfile.companyName}
          />
        )}

        {currentTab === "automations" && (
          <ApprovedAutomationsVault
            automations={approvedAutomations}
            agents={agents}
            executionHistory={executionHistory}
            onUpdateAutomation={handleUpdateApprovedAutomation}
            onDeleteAutomation={handleDeleteApprovedAutomation}
            onCreateAutomation={handleSaveApprovedAutomation}
            onRunAutomation={(automation) => {
              setQuickTaskAgentId(automation.agentId);
              setIsQuickTaskOpen(true);
            }}
            onRewardXP={(amount, hours) => {
              addXpAndCheckLevel(amount, hours || 0);
            }}
          />
        )}

        {currentTab === "assets" && (
          <AssetGallery
            assets={assets}
            onAddAsset={handleAddAsset}
            onDeleteAsset={handleDeleteAsset}
            onUpdateAsset={handleUpdateAsset}
          />
        )}

        {currentTab === "dispatcher" && (
          <TaskDispatcher
            agents={agents}
            workflows={workflows}
            executionHistory={executionHistory}
            onTaskCompleted={handleTaskCompleted}
            onApproveHitl={handleApproveHitl}
            onUpdateExecution={handleUpdateExecution}
            onSaveApprovedAutomation={handleSaveApprovedAutomation}
            onSaveReport={handleSaveReport}
            streakMultiplier={userProfile.streakMultiplier}
          />
        )}

        {currentTab === "gamification" && (
          <GamificationDashboard
            userProfile={userProfile}
            onClaimQuest={handleClaimQuest}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenAutomationsVault={() => setCurrentTab("automations")}
            onOpenAgentBuilder={() => {
              setEditingAgent(null);
              setIsAgentBuilderOpen(true);
            }}
          />
        )}

        {currentTab === "leaderboard" && (
          <Leaderboard
            users={leaderboardUsers}
            currentUserId={userProfile.id}
          />
        )}

        {currentTab === "permissions" && (
          <PermissionsMatrix
            agents={agents}
            permissions={permissions}
            connectedApps={connectedApps}
            auditLogs={auditLogs}
            onToggleAgentPermission={handleToggleAgentPermission}
            onBatchTogglePermissions={handleBatchTogglePermissions}
            onSaveConnectedApp={handleSaveConnectedApp}
            onDeleteConnectedApp={handleDeleteConnectedApp}
            onRewardXP={(amount, hours) => {
              addXpAndCheckLevel(amount, hours || 0);
            }}
          />
        )}

        {currentTab === "legal" && (
          <LegalGovernanceCenter
            documents={legalDocs}
            userProfile={userProfile}
            onOpenPricing={(planId) => {
              setSelectedPlanForPricing(planId || "enterprise");
              setIsPricingModalOpen(true);
            }}
            onOpenTermsGate={() => setHasAcceptedTerms(false)}
            onUpdateDocuments={(updated) => {
              setLegalDocs(updated);
              setStoredItem("agentflow_legal_docs", updated);
              triggerAutoSaveIndicator();
            }}
            onAcceptDocument={(docId) => {
              const updated = legalDocs.map(d => d.id === docId ? { ...d, isAcceptedByCurrentUser: true, acceptedAt: new Date().toISOString() } : d);
              setLegalDocs(updated);
              setStoredItem("agentflow_legal_docs", updated);
              triggerAutoSaveIndicator();
            }}
            companyName={whiteLabelConfig.companyName || "AgentFlow Enterprise"}
            brandName={whiteLabelConfig.brandName || "AgentFlow"}
            isMasterDeveloper={isMasterDeveloper}
          />
        )}

        {currentTab === "analytics" && (
          <ROIAnalytics
            agents={agents}
            executionHistory={executionHistory}
            onUpdateExecution={handleUpdateExecution}
            onApproveHitl={handleApproveHitl}
          />
        )}

        {currentTab === "whitelabel" && (
          <WhiteLabelStudio
            currentConfig={whiteLabelConfig}
            onUpdateConfig={handleUpdateWhiteLabelConfig}
            tenants={tenants}
            onSelectTenantPreset={handleSelectTenantPreset}
            onCreateTenant={handleCreateTenant}
            onDeleteTenant={handleDeleteTenant}
          />
        )}

        {currentTab === "monetization" && (
          <MonetizationHub
            developerProfile={developerProfile}
            rateCard={rateCard}
            tenantsBilling={tenantsBilling}
            financialHistory={financialHistory}
            onUpdateDeveloperProfile={handleUpdateDeveloperProfile}
            onUpdateRateCard={handleUpdateRateCard}
            onUpdateTenantsBilling={handleUpdateTenantsBilling}
            tenants={tenants}
          />
        )}

        {/* Focus Task HUD */}
        {showFocusHUD && (
          <TaskFocusHUD
            session={activeTaskSession}
            agents={agents}
            onUpdateSession={(updated) => setActiveTaskSession(updated)}
            onDispatchTaskWithAgent={handleDispatchTaskWithAgent}
            onClose={() => {
              setShowFocusHUD(false);
              setStoredItem("agentflow_show_focus_hud", false);
            }}
          />
        )}
      </div>

      {/* Modal: Agent Builder & Assignment */}
      <AgentBuilderModal
        isOpen={isAgentBuilderOpen}
        onClose={() => setIsAgentBuilderOpen(false)}
        onSaveAgent={handleSaveAgent}
        initialAgent={editingAgent}
        availableModels={models}
        availablePermissions={permissions}
        onOpenModelManager={() => {
          setIsModelManagerOpen(true);
        }}
        onOpenAppManager={() => {
          setIsAgentBuilderOpen(false);
          setCurrentTab("permissions");
        }}
      />

      {/* Modal: Enterprise AI Model Manager & Benchmarking */}
      <ModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => {
          setIsModelManagerOpen(false);
          setModelManagerTargetAgentId(undefined);
        }}
        models={models}
        agents={agents}
        onAddModel={handleSaveModel}
        onUpdateModel={handleSaveModel}
        onDeleteModel={handleDeleteModel}
        onAssignModelToAgent={handleAssignModelToAgent}
        preSelectedAgentId={modelManagerTargetAgentId}
      />

      {/* Modal: Save States & Snapshot Manager */}
      <SaveStateManager
        isOpen={isSaveStateModalOpen}
        onClose={() => setIsSaveStateModalOpen(false)}
        currentData={{
          agents,
          workflows,
          userProfile,
          executionHistory,
          activeTaskSession,
          auditLogsCount: auditLogs.length,
          tenantsBillingCount: tenantsBilling.length,
          approvedAutomationsCount: approvedAutomations.length,
          savedReportsCount: savedReports.length,
          clientAgentRequestsCount: clientAgentRequests.length,
        }}
        onRestoreState={handleRestoreState}
        onResetToDefaults={handleResetToDefaults}
        onResetToCleanSlate={handleResetToCleanSlate}
        onClearExecutionHistory={handleClearExecutionHistory}
        onClearAuditLogs={handleClearAuditLogs}
        onClearTenantsBilling={handleClearTenantsBilling}
        onClearApprovedAutomations={handleClearApprovedAutomations}
        onClearSavedReports={handleClearSavedReports}
        onClearAllMockData={handleClearAllMockData}
      />

      {/* Modal: Export & Audit Center */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={{
          agents,
          workflows,
          userProfile,
          executionHistory,
        }}
      />

      {/* Modal: Enterprise Pre-Configured Agent Templates */}
      <AgentTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(template, autoDeploy) => {
          if (autoDeploy) {
            handleInstantiateTemplate(template);
          } else {
            setIsTemplateModalOpen(false);
            setEditingAgent(null);
            setIsAgentBuilderOpen(true);
          }
        }}
        isMasterDeveloper={isMasterDeveloper}
      />

      {/* Modal: Master Developer Access Gate */}
      <MasterAccessGateModal
        isOpen={isAccessGateOpen}
        onClose={() => setIsAccessGateOpen(false)}
        accessSettings={masterAccess}
        developerCompanyName={developerProfile?.companyName || "AgentFlow Systems"}
        whiteLabelBrandName={whiteLabelConfig?.brandName || "AgentFlow Enterprise"}
        onUpdateAccessSettings={(newSettings) => {
          setMasterAccess(newSettings);
          if (newSettings.currentAccessLevel === "client_tenant") {
            if (currentTab === "whitelabel" || currentTab === "monetization") {
              setCurrentTab("agents");
            }
          }
        }}
      />

      {/* Modal: Quick Direct Agent Task Studio */}
      <QuickTaskModal
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        agents={agents}
        initialAgentId={quickTaskAgentId}
        workflows={workflows}
        onTaskCompleted={handleTaskCompleted}
        onSaveApprovedAutomation={handleSaveApprovedAutomation}
        streakMultiplier={userProfile.streakMultiplier}
      />

      {/* Modal: Settings & Personalization Studio */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        agents={agents}
        clientAgentRequests={clientAgentRequests}
        agentPrivacyPolicy={agentPrivacyPolicy}
        onUpdateProfile={handleUpdateUserProfile}
        onUpdateAgents={(updatedAgents) => {
          setAgents(updatedAgents);
          setStoredItem("agentflow_agents", updatedAgents);
        }}
        onUpdateClientAgentRequests={(updatedRequests) => {
          setClientAgentRequests(updatedRequests);
          setStoredItem("agentflow_client_agent_requests", updatedRequests);
        }}
        onUpdateAgentPrivacyPolicy={(policy) => {
          setAgentPrivacyPolicy(policy);
          setStoredItem("agentflow_agent_privacy_policy", policy);
        }}
        onResetToCleanSlate={handleResetToCleanSlate}
        onClearExecutionHistory={handleClearExecutionHistory}
        onOpenPricing={() => {
          setSelectedPlanForPricing(userProfile.subscriptionPlan || "free");
          setIsPricingModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Modal: Sign Up & User Registration (Free Tier Explorer + Tier Selection) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userProfile={userProfile}
        onAuthSuccess={(newProfile, planId) => {
          setUserProfile((prev) => {
            const updated: EmployeeProfile = {
              ...prev,
              ...newProfile,
              subscriptionPlan: planId || (newProfile.subscriptionPlan as any) || "free",
              isAuthenticated: true,
            };
            setStoredItem("agentflow_profile", updated);
            return updated;
          });
          setIsAuthModalOpen(false);
          if (planId && planId !== "free") {
            setSelectedPlanForPricing(planId);
            setIsPricingModalOpen(true);
          } else {
            fireCelebration();
          }
        }}
        onOpenPricingPlans={() => {
          setIsAuthModalOpen(false);
          setIsPricingModalOpen(true);
        }}
        initialPlan={(userProfile.subscriptionPlan as any) || "free"}
      />

      {/* Modal: Pricing & Stripe Subscription Checkout */}
      <PricingCheckoutModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        customerEmail={userProfile.email || developerProfile?.developerEmail || "customer@enterprise.com"}
        tenantName={userProfile.organizationName || whiteLabelConfig?.companyName || "Enterprise Team"}
        initialPlanId={selectedPlanForPricing || userProfile.subscriptionPlan || "free"}
        onSuccessUpgrade={(planId) => {
          setUserProfile((prev) => {
            const updated: EmployeeProfile = {
              ...prev,
              subscriptionPlan: planId as "free" | "starter" | "pro" | "enterprise",
              isAuthenticated: true,
            };
            setStoredItem("agentflow_profile", updated);
            return updated;
          });
          addXpAndCheckLevel(500, 1.5);
          fireCelebration();
        }}
      />
      {/* Modal: Enterprise Terms of Service & Agreements Gate */}
      <TermsAgreementGateModal
        isOpen={!hasAcceptedTerms}
        onAcceptTerms={(signerInfo) => {
          setHasAcceptedTerms(true);
          try {
            sessionStorage.setItem("agentflow_terms_accepted_session", "true");
            localStorage.setItem("agentflow_tos_accepted", JSON.stringify(signerInfo));
          } catch (e) {
            console.warn("Could not save terms acceptance:", e);
          }
        }}
        legalDocuments={legalDocs}
        userEmail={userProfile.email || "enterprise@client.com"}
        userName={userProfile.name || "Enterprise User"}
      />
    </div>
  );
}
