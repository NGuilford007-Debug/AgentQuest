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
  FinancialMetricSnapshot
} from "./types";
import { 
  INITIAL_AGENTS, 
  INITIAL_USER_PROFILE, 
  INITIAL_WORKFLOWS, 
  LEADERBOARD_USERS,
  INITIAL_MODELS,
  AVAILABLE_PERMISSIONS,
  INITIAL_CONNECTED_APPS,
  INITIAL_API_AUDIT_LOGS
} from "./data/initialData";
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
import { AgentBuilderModal } from "./components/AgentBuilderModal";
import { ModelManagerModal } from "./components/ModelManagerModal";
import { SaveStateManager } from "./components/SaveStateManager";
import { TaskFocusHUD } from "./components/TaskFocusHUD";
import { DigitalWorkspaces } from "./components/DigitalWorkspaces";
import { ExportModal } from "./components/ExportModal";
import { AgentHealthMonitor } from "./components/AgentHealthMonitor";
import { AgentTemplateModal } from "./components/AgentTemplateModal";
import { fireCelebration, fireLevelUp } from "./utils/confetti";

export default function App() {
  // Local state initialized with fallback to localStorage
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem("agentflow_agents");
    return saved ? JSON.parse(saved) : INITIAL_AGENTS;
  });

  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const saved = localStorage.getItem("agentflow_workflows");
    return saved ? JSON.parse(saved) : INITIAL_WORKFLOWS;
  });

  const [assets, setAssets] = useState<AssetItem[]>(() => {
    const saved = localStorage.getItem("agentflow_assets");
    return saved ? JSON.parse(saved) : INITIAL_ASSET_ITEMS;
  });

  const [userProfile, setUserProfile] = useState<EmployeeProfile>(() => {
    const saved = localStorage.getItem("agentflow_profile");
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(() => {
    const saved = localStorage.getItem("agentflow_leaderboard");
    return saved ? JSON.parse(saved) : LEADERBOARD_USERS;
  });

  const [executionHistory, setExecutionHistory] = useState<TaskExecutionRecord[]>(() => {
    const saved = localStorage.getItem("agentflow_executions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTaskSession, setActiveTaskSession] = useState<ActiveTaskSession | null>(() => {
    const saved = localStorage.getItem("agentflow_active_task");
    return saved ? JSON.parse(saved) : null;
  });

  const [workplaceStages, setWorkplaceStages] = useState<WorkplaceStage[]>(() => {
    const saved = localStorage.getItem("agentflow_workplace_stages");
    return saved ? JSON.parse(saved) : INITIAL_WORKPLACE_STAGES;
  });

  const [models, setModels] = useState<AiModel[]>(() => {
    const saved = localStorage.getItem("agentflow_models");
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });

  const [permissions, setPermissions] = useState<PermissionScope[]>(() => {
    const saved = localStorage.getItem("agentflow_permissions");
    return saved ? JSON.parse(saved) : AVAILABLE_PERMISSIONS;
  });

  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(() => {
    const saved = localStorage.getItem("agentflow_connected_apps");
    return saved ? JSON.parse(saved) : INITIAL_CONNECTED_APPS;
  });

  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>(() => {
    const saved = localStorage.getItem("agentflow_audit_logs");
    return saved ? JSON.parse(saved) : INITIAL_API_AUDIT_LOGS;
  });

  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(() => {
    const saved = localStorage.getItem("agentflow_whitelabel_config");
    return saved ? JSON.parse(saved) : DEFAULT_WHITELABEL_CONFIG;
  });

  const [tenants, setTenants] = useState<TenantProfile[]>(() => {
    const saved = localStorage.getItem("agentflow_tenants");
    return saved ? JSON.parse(saved) : WHITELABEL_PRESETS;
  });

  const [developerProfile, setDeveloperProfile] = useState<DeveloperCompanyProfile>(() => {
    const saved = localStorage.getItem("agentflow_developer_profile");
    return saved ? JSON.parse(saved) : DEFAULT_DEVELOPER_PROFILE;
  });

  const [rateCard, setRateCard] = useState<RateCardConfig>(() => {
    const saved = localStorage.getItem("agentflow_rate_card");
    return saved ? JSON.parse(saved) : DEFAULT_RATE_CARD;
  });

  const [tenantsBilling, setTenantsBilling] = useState<TenantBillingRecord[]>(() => {
    const saved = localStorage.getItem("agentflow_tenants_billing");
    return saved ? JSON.parse(saved) : INITIAL_TENANT_BILLING_RECORDS;
  });

  const [financialHistory, setFinancialHistory] = useState<FinancialMetricSnapshot[]>(() => {
    const saved = localStorage.getItem("agentflow_financial_history");
    return saved ? JSON.parse(saved) : HISTORICAL_FINANCIAL_SNAPSHOTS;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>("agents");
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
  const [showFocusHUD, setShowFocusHUD] = useState(true);

  // Auto-save feedback indicators
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const triggerAutoSaveIndicator = () => {
    setIsAutoSaving(true);
    const timeout = setTimeout(() => {
      setIsAutoSaving(false);
      const d = new Date();
      setLastSavedTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 450);
    return () => clearTimeout(timeout);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("agentflow_agents", JSON.stringify(agents));
    triggerAutoSaveIndicator();
  }, [agents]);

  useEffect(() => {
    localStorage.setItem("agentflow_workflows", JSON.stringify(workflows));
    triggerAutoSaveIndicator();
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem("agentflow_assets", JSON.stringify(assets));
    triggerAutoSaveIndicator();
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("agentflow_profile", JSON.stringify(userProfile));
    triggerAutoSaveIndicator();
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("agentflow_leaderboard", JSON.stringify(leaderboardUsers));
  }, [leaderboardUsers]);

  useEffect(() => {
    localStorage.setItem("agentflow_executions", JSON.stringify(executionHistory));
    triggerAutoSaveIndicator();
  }, [executionHistory]);

  useEffect(() => {
    if (activeTaskSession) {
      localStorage.setItem("agentflow_active_task", JSON.stringify(activeTaskSession));
    }
  }, [activeTaskSession]);

  useEffect(() => {
    localStorage.setItem("agentflow_workplace_stages", JSON.stringify(workplaceStages));
    triggerAutoSaveIndicator();
  }, [workplaceStages]);

  useEffect(() => {
    localStorage.setItem("agentflow_models", JSON.stringify(models));
    triggerAutoSaveIndicator();
  }, [models]);

  useEffect(() => {
    localStorage.setItem("agentflow_permissions", JSON.stringify(permissions));
    triggerAutoSaveIndicator();
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem("agentflow_connected_apps", JSON.stringify(connectedApps));
    triggerAutoSaveIndicator();
  }, [connectedApps]);

  useEffect(() => {
    localStorage.setItem("agentflow_audit_logs", JSON.stringify(auditLogs));
    triggerAutoSaveIndicator();
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("agentflow_whitelabel_config", JSON.stringify(whiteLabelConfig));
    triggerAutoSaveIndicator();
    // Dynamically update document title
    document.title = `${whiteLabelConfig.brandName} - ${whiteLabelConfig.tagline}`;
  }, [whiteLabelConfig]);

  useEffect(() => {
    localStorage.setItem("agentflow_tenants", JSON.stringify(tenants));
    triggerAutoSaveIndicator();
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem("agentflow_developer_profile", JSON.stringify(developerProfile));
    triggerAutoSaveIndicator();
  }, [developerProfile]);

  useEffect(() => {
    localStorage.setItem("agentflow_rate_card", JSON.stringify(rateCard));
    triggerAutoSaveIndicator();
  }, [rateCard]);

  useEffect(() => {
    localStorage.setItem("agentflow_tenants_billing", JSON.stringify(tenantsBilling));
    triggerAutoSaveIndicator();
  }, [tenantsBilling]);

  useEffect(() => {
    localStorage.setItem("agentflow_financial_history", JSON.stringify(financialHistory));
    triggerAutoSaveIndicator();
  }, [financialHistory]);

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

  const handleUpdateAgent = (updated: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
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
    setCurrentTab("dispatcher");
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

    // Update Daily Quest progress
    setUserProfile((prev) => {
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
      return { ...prev, quests: updatedQuests };
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
    setActiveWorkflowId(INITIAL_WORKFLOWS[0].id);
    localStorage.removeItem("agentflow_agents");
    localStorage.removeItem("agentflow_workflows");
    localStorage.removeItem("agentflow_profile");
    localStorage.removeItem("agentflow_leaderboard");
    localStorage.removeItem("agentflow_executions");
    localStorage.removeItem("agentflow_active_task");
  };

  // Dispatch focus task directly to dispatcher
  const handleDispatchTaskWithAgent = (title: string, desc: string, agentId: string) => {
    setCurrentTab("dispatcher");
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
        onQuickTask={() => setCurrentTab("dispatcher")}
        onOpenSaveStates={() => setIsSaveStateModalOpen(true)}
        onToggleFocusHUD={() => setShowFocusHUD(!showFocusHUD)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenWhiteLabel={() => setCurrentTab("whitelabel")}
        onOpenMonetization={() => setCurrentTab("monetization")}
        isAutoSaving={isAutoSaving}
        lastSavedTime={lastSavedTime}
        whiteLabelConfig={whiteLabelConfig}
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
          onSelectTab={(tab) => setCurrentTab(tab)}
          pendingReviewsCount={pendingReviewsCount}
          claimableQuestsCount={claimableQuestsCount}
          unhealthyAgentsCount={agents.filter((a) => (a.stats.successRate ?? 95) < 90).length}
          totalAssetsCount={assets.length}
          whiteLabelConfig={whiteLabelConfig}
        />

        {/* Dynamic Tab Body */}
        {currentTab === "agents" && (
          <AgentRoster
            agents={agents}
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
            onOpenHealthMonitor={() => setCurrentTab("health")}
            onOpenModelManager={handleOpenModelManager}
            onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            onInstantiateTemplate={handleInstantiateTemplate}
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
            onRunTestWorkflow={handleRunTestWorkflow}
            onRewardNodeAdded={() => addXpAndCheckLevel(50)}
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
            streakMultiplier={userProfile.streakMultiplier}
          />
        )}

        {currentTab === "gamification" && (
          <GamificationDashboard
            userProfile={userProfile}
            onClaimQuest={handleClaimQuest}
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

        {currentTab === "analytics" && (
          <ROIAnalytics
            agents={agents}
            executionHistory={executionHistory}
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
        onSaveModel={handleSaveModel}
        onDeleteModel={handleDeleteModel}
        onAssignModelToAgent={handleAssignModelToAgent}
        initialSelectedAgentId={modelManagerTargetAgentId}
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
        }}
        onRestoreState={handleRestoreState}
        onResetToDefaults={handleResetToDefaults}
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
        onUseTemplate={(template) => {
          handleInstantiateTemplate(template);
        }}
        onCustomizeInBuilder={(template) => {
          setIsTemplateModalOpen(false);
          setEditingAgent(null);
          setIsAgentBuilderOpen(true);
        }}
      />
    </div>
  );
}
